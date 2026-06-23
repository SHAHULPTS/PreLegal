import { describe, expect, it } from "vitest";
import {
  ATTRIBUTION,
  DOCUMENT_TITLE,
  STANDARD_TERMS,
  coverPageFields,
  defaultFormData,
  emptyParty,
  formatDate,
  interpolate,
  pdfFileName,
  segmentsToText,
  type NdaFormData,
} from "@/lib/nda";

/** Builds form data from defaults with the given overrides. */
function makeData(overrides: Partial<NdaFormData> = {}): NdaFormData {
  return {
    ...defaultFormData,
    ...overrides,
    party1: { ...defaultFormData.party1, ...overrides.party1 },
    party2: { ...defaultFormData.party2, ...overrides.party2 },
  };
}

describe("formatDate", () => {
  it("formats an ISO date as a long US date", () => {
    expect(formatDate("2026-06-23")).toBe("June 23, 2026");
  });

  it("returns an empty string for an empty input", () => {
    expect(formatDate("")).toBe("");
  });

  it("returns an empty string for an invalid date", () => {
    expect(formatDate("not-a-date")).toBe("");
  });

  it("does not drift across time zones (uses local midnight)", () => {
    // A naive `new Date('2026-01-01')` parses as UTC and can render as Dec 31
    // in negative-offset zones; formatDate appends T00:00:00 to avoid this.
    expect(formatDate("2026-01-01")).toBe("January 1, 2026");
  });
});

describe("interpolate", () => {
  it("splits a template into static and filled value segments", () => {
    const segments = interpolate("Hello {{purpose}}!", makeData({ purpose: "Eval" }));
    expect(segments).toEqual([
      { text: "Hello ", filled: false },
      { text: "Eval", filled: true },
      { text: "!", filled: false },
    ]);
  });

  it("uses a bracketed fallback for an empty value, marked not filled", () => {
    const segments = interpolate("{{purpose}}", makeData({ purpose: "" }));
    expect(segments).toEqual([{ text: "[Purpose]", filled: false }]);
  });

  it("treats whitespace-only values as empty", () => {
    const segments = interpolate("{{governingLaw}}", makeData({ governingLaw: "   " }));
    expect(segments).toEqual([{ text: "[Governing Law]", filled: false }]);
  });

  it("trims surrounding whitespace from filled values", () => {
    const [segment] = interpolate("{{purpose}}", makeData({ purpose: "  Eval  " }));
    expect(segment).toEqual({ text: "Eval", filled: true });
  });

  it("resolves the effective date through formatDate", () => {
    const [segment] = interpolate("{{effectiveDate}}", makeData({ effectiveDate: "2026-06-23" }));
    expect(segment).toEqual({ text: "June 23, 2026", filled: true });
  });

  it("resolves repeated occurrences of the same token", () => {
    const segments = interpolate("{{governingLaw}} / {{governingLaw}}", makeData({ governingLaw: "Delaware" }));
    expect(segments.filter((s) => s.filled).map((s) => s.text)).toEqual([
      "Delaware",
      "Delaware",
    ]);
  });

  it("returns a single static segment when there are no tokens", () => {
    expect(interpolate("plain text", makeData())).toEqual([
      { text: "plain text", filled: false },
    ]);
  });

  it("is re-entrant (global regex state does not leak between calls)", () => {
    const data = makeData({ purpose: "Eval" });
    const first = interpolate("{{purpose}} {{purpose}}", data);
    const second = interpolate("{{purpose}} {{purpose}}", data);
    expect(first).toEqual(second);
    expect(first.filter((s) => s.filled)).toHaveLength(2);
  });

  describe("MNDA term derivation", () => {
    it("singularizes a one-year fixed term", () => {
      const [s] = interpolate("{{mndaTerm}}", makeData({ mndaTermType: "fixed", mndaTermYears: "1" }));
      expect(s.text).toBe("period ending 1 year after the Effective Date");
    });

    it("pluralizes a multi-year fixed term", () => {
      const [s] = interpolate("{{mndaTerm}}", makeData({ mndaTermType: "fixed", mndaTermYears: "3" }));
      expect(s.text).toBe("period ending 3 years after the Effective Date");
    });

    it("uses a [#] placeholder when the year count is blank", () => {
      const [s] = interpolate("{{mndaTerm}}", makeData({ mndaTermType: "fixed", mndaTermYears: "" }));
      expect(s.text).toContain("[#] after the Effective Date");
    });

    it.each(["0", "-3", "1.5", "abc"])(
      "rejects invalid year count %j with a [#] placeholder",
      (value) => {
        const [s] = interpolate(
          "{{mndaTerm}}",
          makeData({ mndaTermType: "fixed", mndaTermYears: value }),
        );
        expect(s.text).toBe("period ending [#] after the Effective Date");
      },
    );

    it("describes an until-terminated term", () => {
      const [s] = interpolate("{{mndaTerm}}", makeData({ mndaTermType: "untilTerminated" }));
      expect(s.text).toBe("MNDA Term, which continues until terminated in accordance with this MNDA");
    });
  });

  describe("confidentiality term derivation", () => {
    it("describes a fixed confidentiality term with trade-secret carve-out", () => {
      const [s] = interpolate(
        "{{confidentialityTerm}}",
        makeData({ confidentialityTermType: "fixed", confidentialityTermYears: "2" }),
      );
      expect(s.text).toContain("a period of 2 years from the Effective Date");
      expect(s.text).toContain("trade secrets");
    });

    it("describes a perpetual confidentiality term", () => {
      const [s] = interpolate(
        "{{confidentialityTerm}}",
        makeData({ confidentialityTermType: "perpetuity" }),
      );
      expect(s.text).toBe("an indefinite period (in perpetuity)");
    });
  });
});

describe("segmentsToText", () => {
  it("flattens segments back into a plain string", () => {
    const segments = interpolate("Hi {{purpose}}.", makeData({ purpose: "Eval" }));
    expect(segmentsToText(segments)).toBe("Hi Eval.");
  });
});

describe("pdfFileName", () => {
  it("includes both party company names", () => {
    const name = pdfFileName(
      makeData({
        party1: { ...emptyParty, companyName: "Acme Inc" },
        party2: { ...emptyParty, companyName: "Beta LLC" },
      }),
    );
    expect(name).toBe("Mutual-NDA-Acme-Inc-and-Beta-LLC.pdf");
  });

  it("includes a single party when only one is provided", () => {
    const name = pdfFileName(
      makeData({ party1: { ...emptyParty, companyName: "Acme" } }),
    );
    expect(name).toBe("Mutual-NDA-Acme.pdf");
  });

  it("falls back to a generic name when no companies are provided", () => {
    expect(pdfFileName(makeData())).toBe("Mutual-NDA.pdf");
  });

  it("slugifies special characters and trims separators", () => {
    const name = pdfFileName(
      makeData({ party1: { ...emptyParty, companyName: "  Foo & Bar, Inc.  " } }),
    );
    expect(name).toBe("Mutual-NDA-Foo-Bar-Inc.pdf");
  });
});

describe("STANDARD_TERMS", () => {
  it("contains all 11 sections, sequentially numbered", () => {
    expect(STANDARD_TERMS).toHaveLength(11);
    expect(STANDARD_TERMS.map((t) => t.number)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    ]);
  });

  it("has a non-empty title and body for each section", () => {
    for (const term of STANDARD_TERMS) {
      expect(term.title.trim().length).toBeGreaterThan(0);
      expect(term.body.trim().length).toBeGreaterThan(0);
    }
  });

  it("only references known Cover Page tokens", () => {
    const known = new Set([
      "purpose",
      "effectiveDate",
      "mndaTerm",
      "confidentialityTerm",
      "governingLaw",
      "jurisdiction",
    ]);
    for (const term of STANDARD_TERMS) {
      for (const match of term.body.matchAll(/\{\{(\w+)\}\}/g)) {
        expect(known.has(match[1])).toBe(true);
      }
    }
  });

  it("fully resolves every token when the form is complete", () => {
    const complete = makeData({
      purpose: "Eval",
      effectiveDate: "2026-06-23",
      governingLaw: "Delaware",
      jurisdiction: "New Castle, DE",
    });
    for (const term of STANDARD_TERMS) {
      const text = segmentsToText(interpolate(term.body, complete));
      expect(text).not.toMatch(/\{\{|\[Purpose\]|\[Effective Date\]|\[Governing Law\]|\[Jurisdiction\]/);
    }
  });
});

describe("coverPageFields", () => {
  const find = (data: NdaFormData, key: string) =>
    coverPageFields(data).find((f) => f.key === key);

  const textOf = (data: NdaFormData, key: string) =>
    segmentsToText(find(data, key)!.segments);

  it("returns the six standard fields and omits modifications when empty", () => {
    const fields = coverPageFields(makeData({ modifications: "" }));
    expect(fields.map((f) => f.key)).toEqual([
      "purpose",
      "effectiveDate",
      "mndaTerm",
      "confidentialityTerm",
      "governingLaw",
    ]);
  });

  it("appends the modifications field only when present", () => {
    const fields = coverPageFields(makeData({ modifications: "Section 5 amended." }));
    const mods = fields.find((f) => f.key === "modifications");
    expect(mods).toBeDefined();
    expect(segmentsToText(mods!.segments)).toBe("Section 5 amended.");
  });

  it("marks unfilled values as muted placeholders", () => {
    const [seg] = find(makeData({ purpose: "" }), "purpose")!.segments;
    expect(seg).toEqual({ text: "[Purpose]", filled: false, placeholder: true });
  });

  it("marks filled values as emphasized (not placeholder)", () => {
    const [seg] = find(makeData({ purpose: "Eval" }), "purpose")!.segments;
    expect(seg).toEqual({ text: "Eval", filled: true });
  });

  it("renders the fixed MNDA term with a validated year count", () => {
    expect(textOf(makeData({ mndaTermType: "fixed", mndaTermYears: "2" }), "mndaTerm")).toBe(
      "Expires 2 year(s) from the Effective Date.",
    );
    // Invalid year falls back to the [#] placeholder.
    expect(textOf(makeData({ mndaTermType: "fixed", mndaTermYears: "0" }), "mndaTerm")).toBe(
      "Expires [#] from the Effective Date.",
    );
  });

  it("renders the until-terminated and perpetuity branches", () => {
    expect(textOf(makeData({ mndaTermType: "untilTerminated" }), "mndaTerm")).toBe(
      "Continues until terminated in accordance with the MNDA.",
    );
    expect(
      textOf(makeData({ confidentialityTermType: "perpetuity" }), "confidentialityTerm"),
    ).toBe("In perpetuity.");
  });

  it("combines governing law and jurisdiction across two lines", () => {
    const text = textOf(
      makeData({ governingLaw: "Delaware", jurisdiction: "New Castle, DE" }),
      "governingLaw",
    );
    expect(text).toBe("Governing Law: Delaware\nJurisdiction: New Castle, DE");
  });
});

describe("constants", () => {
  it("exposes the document title and CC BY attribution", () => {
    expect(DOCUMENT_TITLE).toBe("Mutual Non-Disclosure Agreement");
    expect(ATTRIBUTION).toContain("CC BY 4.0");
  });

  it("ships sensible defaults", () => {
    expect(defaultFormData.mndaTermType).toBe("fixed");
    expect(defaultFormData.confidentialityTermType).toBe("fixed");
    expect(emptyParty.companyName).toBe("");
  });
});
