import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import NdaPreview from "@/components/NdaPreview";
import { defaultFormData, emptyParty, type NdaFormData } from "@/lib/nda";

function makeData(overrides: Partial<NdaFormData> = {}): NdaFormData {
  return {
    ...defaultFormData,
    ...overrides,
    party1: { ...defaultFormData.party1, ...overrides.party1 },
    party2: { ...defaultFormData.party2, ...overrides.party2 },
  };
}

describe("NdaPreview", () => {
  it("renders the document title and full Standard Terms", () => {
    render(<NdaPreview data={makeData()} />);
    expect(
      screen.getByRole("heading", { name: "Mutual Non-Disclosure Agreement" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Standard Terms" }),
    ).toBeInTheDocument();
    // A representative section from the Standard Terms.
    expect(
      screen.getByText(/Use and Protection of Confidential Information/),
    ).toBeInTheDocument();
  });

  it("shows placeholders for unfilled Cover Page fields", () => {
    render(<NdaPreview data={makeData({ governingLaw: "", jurisdiction: "" })} />);
    expect(screen.getByText("[Fill in state]")).toBeInTheDocument();
    expect(screen.getByText("[Fill in city/county and state]")).toBeInTheDocument();
  });

  it("renders filled Cover Page values", () => {
    render(
      <NdaPreview
        data={makeData({ governingLaw: "Delaware", effectiveDate: "2026-06-23" })}
      />,
    );
    // The value appears on the Cover Page and again within the Standard Terms.
    expect(screen.getAllByText("Delaware").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("June 23, 2026").length).toBeGreaterThanOrEqual(2);
  });

  it("describes a fixed MNDA term", () => {
    render(<NdaPreview data={makeData({ mndaTermType: "fixed", mndaTermYears: "2" })} />);
    expect(screen.getByText(/Expires/)).toBeInTheDocument();
    expect(screen.getByText(/from the Effective Date\./)).toBeInTheDocument();
  });

  it("describes an until-terminated MNDA term", () => {
    render(<NdaPreview data={makeData({ mndaTermType: "untilTerminated" })} />);
    expect(
      screen.getByText("Continues until terminated in accordance with the MNDA."),
    ).toBeInTheDocument();
  });

  it("describes a perpetual confidentiality term", () => {
    render(<NdaPreview data={makeData({ confidentialityTermType: "perpetuity" })} />);
    expect(screen.getByText("In perpetuity.")).toBeInTheDocument();
  });

  it("hides the modifications section when empty and shows it when present", () => {
    const { rerender } = render(<NdaPreview data={makeData({ modifications: "" })} />);
    expect(screen.queryByText("MNDA Modifications")).not.toBeInTheDocument();

    rerender(<NdaPreview data={makeData({ modifications: "Section 5 amended." })} />);
    expect(screen.getByText("MNDA Modifications")).toBeInTheDocument();
    expect(screen.getByText("Section 5 amended.")).toBeInTheDocument();
  });

  it("places party company names in the signature table", () => {
    render(
      <NdaPreview
        data={makeData({
          party1: { ...emptyParty, companyName: "Acme Inc" },
          party2: { ...emptyParty, companyName: "Beta LLC" },
        })}
      />,
    );
    const table = screen.getByRole("table");
    expect(within(table).getByText("Acme Inc")).toBeInTheDocument();
    expect(within(table).getByText("Beta LLC")).toBeInTheDocument();
  });
});
