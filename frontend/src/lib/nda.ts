// Shared data model and content for the Common Paper Mutual NDA generator.
//
// The Standard Terms text below is the Common Paper Mutual Non-Disclosure
// Agreement (Version 1.0), free to use under CC BY 4.0
// (https://creativecommons.org/licenses/by/4.0/). Cover Page values are
// injected via `{{token}}` placeholders so that the same source text drives
// both the on-screen preview and the generated PDF.

export type MndaTermType = "fixed" | "untilTerminated";
export type ConfidentialityTermType = "fixed" | "perpetuity";

export interface Party {
  companyName: string;
  signatoryName: string;
  title: string;
  noticeAddress: string;
}

export interface NdaFormData {
  purpose: string;
  effectiveDate: string; // ISO yyyy-mm-dd
  mndaTermType: MndaTermType;
  mndaTermYears: string;
  confidentialityTermType: ConfidentialityTermType;
  confidentialityTermYears: string;
  governingLaw: string; // U.S. state
  jurisdiction: string; // city/county and state
  modifications: string;
  party1: Party;
  party2: Party;
}

export const emptyParty: Party = {
  companyName: "",
  signatoryName: "",
  title: "",
  noticeAddress: "",
};

export const defaultFormData: NdaFormData = {
  purpose: "Evaluating whether to enter into a business relationship between the parties.",
  effectiveDate: "",
  mndaTermType: "fixed",
  mndaTermYears: "1",
  confidentialityTermType: "fixed",
  confidentialityTermYears: "1",
  governingLaw: "",
  jurisdiction: "",
  modifications: "",
  party1: { ...emptyParty },
  party2: { ...emptyParty },
};

// ---------------------------------------------------------------------------
// Token resolution
// ---------------------------------------------------------------------------

type TokenKey =
  | "purpose"
  | "effectiveDate"
  | "mndaTerm"
  | "confidentialityTerm"
  | "governingLaw"
  | "jurisdiction";

/** A run of text that is either static template prose or a filled-in value. */
export interface DocSegment {
  text: string;
  /** True for resolved Cover Page values (rendered emphasized). */
  filled: boolean;
}

const FALLBACKS: Record<TokenKey, string> = {
  purpose: "[Purpose]",
  effectiveDate: "[Effective Date]",
  mndaTerm: "[MNDA Term]",
  confidentialityTerm: "[Term of Confidentiality]",
  governingLaw: "[Governing Law]",
  jurisdiction: "[Jurisdiction]",
};

export function formatDate(iso: string): string {
  if (!iso) return "";
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function years(value: string): string {
  const n = Number(value.trim());
  // Reject blank, non-numeric, non-integer, and non-positive year counts so
  // legally nonsensical text (e.g. "0 years", "-3 years") never reaches output.
  if (!Number.isInteger(n) || n <= 0) return "[#]";
  return n === 1 ? "1 year" : `${n} years`;
}

/** Computes the resolved (possibly empty) value for each Cover Page token. */
function tokenValues(data: NdaFormData): Record<TokenKey, string> {
  const mndaTerm =
    data.mndaTermType === "fixed"
      ? `period ending ${years(data.mndaTermYears)} after the Effective Date`
      : "MNDA Term, which continues until terminated in accordance with this MNDA";

  const confidentialityTerm =
    data.confidentialityTermType === "fixed"
      ? `a period of ${years(
          data.confidentialityTermYears,
        )} from the Effective Date (and, for trade secrets, until they are no longer protected as trade secrets under applicable law)`
      : "an indefinite period (in perpetuity)";

  return {
    purpose: data.purpose.trim(),
    effectiveDate: formatDate(data.effectiveDate),
    mndaTerm,
    confidentialityTerm,
    governingLaw: data.governingLaw.trim(),
    jurisdiction: data.jurisdiction.trim(),
  };
}

/** Splits a template string into static and resolved-value segments. */
export function interpolate(template: string, data: NdaFormData): DocSegment[] {
  const values = tokenValues(data);
  const segments: DocSegment[] = [];
  // Local to each call: avoids shared `lastIndex` state on a module-level regex.
  const tokenRe = /\{\{(\w+)\}\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRe.exec(template)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: template.slice(lastIndex, match.index), filled: false });
    }
    const key = match[1] as TokenKey;
    const value = values[key];
    segments.push({
      text: value || FALLBACKS[key] || `[${key}]`,
      filled: Boolean(value),
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < template.length) {
    segments.push({ text: template.slice(lastIndex), filled: false });
  }
  return segments;
}

/** Flattens segments into a plain string (used for the PDF file name, etc.). */
export function segmentsToText(segments: DocSegment[]): string {
  return segments.map((s) => s.text).join("");
}

// ---------------------------------------------------------------------------
// Document content
// ---------------------------------------------------------------------------

export const DOCUMENT_TITLE = "Mutual Non-Disclosure Agreement";

export interface StandardTerm {
  number: number;
  title: string;
  body: string;
}

export const STANDARD_TERMS: StandardTerm[] = [
  {
    number: 1,
    title: "Introduction",
    body: 'This Mutual Non-Disclosure Agreement (which incorporates these Standard Terms and the Cover Page (defined below)) (“MNDA”) allows each party (“Disclosing Party”) to disclose or make available information in connection with the {{purpose}} which (1) the Disclosing Party identifies to the receiving party (“Receiving Party”) as “confidential”, “proprietary”, or the like or (2) should be reasonably understood as confidential or proprietary due to its nature and the circumstances of its disclosure (“Confidential Information”). Each party’s Confidential Information also includes the existence and status of the parties’ discussions and information on the Cover Page. Confidential Information includes technical or business information, product designs or roadmaps, requirements, pricing, security and compliance documentation, technology, inventions and know-how. To use this MNDA, the parties must complete and sign a cover page incorporating these Standard Terms (“Cover Page”). Each party is identified on the Cover Page and capitalized terms have the meanings given herein or on the Cover Page.',
  },
  {
    number: 2,
    title: "Use and Protection of Confidential Information",
    body: "The Receiving Party shall: (a) use Confidential Information solely for the {{purpose}}; (b) not disclose Confidential Information to third parties without the Disclosing Party’s prior written approval, except that the Receiving Party may disclose Confidential Information to its employees, agents, advisors, contractors and other representatives having a reasonable need to know for the {{purpose}}, provided these representatives are bound by confidentiality obligations no less protective of the Disclosing Party than the applicable terms in this MNDA and the Receiving Party remains responsible for their compliance with this MNDA; and (c) protect Confidential Information using at least the same protections the Receiving Party uses for its own similar information but no less than a reasonable standard of care.",
  },
  {
    number: 3,
    title: "Exceptions",
    body: "The Receiving Party’s obligations in this MNDA do not apply to information that it can demonstrate: (a) is or becomes publicly available through no fault of the Receiving Party; (b) it rightfully knew or possessed prior to receipt from the Disclosing Party without confidentiality restrictions; (c) it rightfully obtained from a third party without confidentiality restrictions; or (d) it independently developed without using or referencing the Confidential Information.",
  },
  {
    number: 4,
    title: "Disclosures Required by Law",
    body: "The Receiving Party may disclose Confidential Information to the extent required by law, regulation or regulatory authority, subpoena or court order, provided (to the extent legally permitted) it provides the Disclosing Party reasonable advance notice of the required disclosure and reasonably cooperates, at the Disclosing Party’s expense, with the Disclosing Party’s efforts to obtain confidential treatment for the Confidential Information.",
  },
  {
    number: 5,
    title: "Term and Termination",
    body: "This MNDA commences on the {{effectiveDate}} and expires at the end of the {{mndaTerm}}. Either party may terminate this MNDA for any or no reason upon written notice to the other party. The Receiving Party’s obligations relating to Confidential Information will survive for {{confidentialityTerm}}, despite any expiration or termination of this MNDA.",
  },
  {
    number: 6,
    title: "Return or Destruction of Confidential Information",
    body: "Upon expiration or termination of this MNDA or upon the Disclosing Party’s earlier request, the Receiving Party will: (a) cease using Confidential Information; (b) promptly after the Disclosing Party’s written request, destroy all Confidential Information in the Receiving Party’s possession or control or return it to the Disclosing Party; and (c) if requested by the Disclosing Party, confirm its compliance with these obligations in writing. As an exception to subsection (b), the Receiving Party may retain Confidential Information in accordance with its standard backup or record retention policies or as required by law, but the terms of this MNDA will continue to apply to the retained Confidential Information.",
  },
  {
    number: 7,
    title: "Proprietary Rights",
    body: "The Disclosing Party retains all of its intellectual property and other rights in its Confidential Information and its disclosure to the Receiving Party grants no license under such rights.",
  },
  {
    number: 8,
    title: "Disclaimer",
    body: "ALL CONFIDENTIAL INFORMATION IS PROVIDED “AS IS”, WITH ALL FAULTS, AND WITHOUT WARRANTIES, INCLUDING THE IMPLIED WARRANTIES OF TITLE, MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.",
  },
  {
    number: 9,
    title: "Governing Law and Jurisdiction",
    body: "This MNDA and all matters relating hereto are governed by, and construed in accordance with, the laws of the State of {{governingLaw}}, without regard to the conflict of laws provisions of such {{governingLaw}}. Any legal suit, action, or proceeding relating to this MNDA must be instituted in the federal or state courts located in {{jurisdiction}}. Each party irrevocably submits to the exclusive jurisdiction of such courts in any such suit, action, or proceeding.",
  },
  {
    number: 10,
    title: "Equitable Relief",
    body: "A breach of this MNDA may cause irreparable harm for which monetary damages are an insufficient remedy. Upon a breach of this MNDA, the Disclosing Party is entitled to seek appropriate equitable relief, including an injunction, in addition to its other remedies.",
  },
  {
    number: 11,
    title: "General",
    body: "Neither party has an obligation under this MNDA to disclose Confidential Information to the other or proceed with any proposed transaction. Neither party may assign this MNDA without the prior written consent of the other party, except that either party may assign this MNDA in connection with a merger, reorganization, acquisition or other transfer of all or substantially all its assets or voting securities. Any assignment in violation of this Section is null and void. This MNDA will bind and inure to the benefit of each party’s permitted successors and assigns. Waivers must be signed by the waiving party’s authorized representative and cannot be implied from conduct. If any provision of this MNDA is held unenforceable, it will be limited to the minimum extent necessary so the rest of this MNDA remains in effect. This MNDA (including the Cover Page) constitutes the entire agreement of the parties with respect to its subject matter, and supersedes all prior and contemporaneous understandings, agreements, representations, and warranties, whether written or oral, regarding such subject matter. This MNDA may only be amended, modified, waived, or supplemented by an agreement in writing signed by both parties. Notices, requests and approvals under this MNDA must be sent in writing to the email or postal addresses on the Cover Page and are deemed delivered on receipt. This MNDA may be executed in counterparts, including electronic copies, each of which is deemed an original and which together form the same agreement.",
  },
];

/** Rows of the Cover Page signature block, shared by the preview and the PDF. */
export const SIGNATURE_ROWS: { label: string; get: (party: Party) => string }[] = [
  { label: "Signature", get: () => "" },
  { label: "Print Name", get: (p) => p.signatoryName },
  { label: "Title", get: (p) => p.title },
  { label: "Company", get: (p) => p.companyName },
  { label: "Notice Address", get: (p) => p.noticeAddress },
  { label: "Date", get: () => "" },
];

export const ATTRIBUTION =
  "Common Paper Mutual Non-Disclosure Agreement (Version 1.0) free to use under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/).";

/** A filename-safe stem for the generated PDF, derived from the parties. */
export function pdfFileName(data: NdaFormData): string {
  const slug = (value: string) =>
    value
      .trim()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "");
  const p1 = slug(data.party1.companyName);
  const p2 = slug(data.party2.companyName);
  const parties = [p1, p2].filter(Boolean).join("-and-");
  return parties ? `Mutual-NDA-${parties}.pdf` : "Mutual-NDA.pdf";
}
