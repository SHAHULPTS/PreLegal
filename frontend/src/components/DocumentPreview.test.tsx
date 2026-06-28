import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import DocumentPreview from "@/components/DocumentPreview";
import { emptyValues, type DocumentDetail } from "@/lib/documents";

const doc: DocumentDetail = {
  id: "pilot-agreement",
  name: "Pilot Agreement",
  description: "A time-limited pilot.",
  fields: [
    { key: "governingLaw", label: "Governing Law", type: "text" },
    { key: "party1CompanyName", label: "Provider: Company name", type: "text", group: "party1" },
    { key: "party2CompanyName", label: "Customer: Company name", type: "text", group: "party2" },
  ],
  template: [
    "# Pilot Agreement",
    '1. <span class="header_2" id="1">Pilot Access</span>',
    '    1. <span class="header_3" id="1.1">Access.</span>  Governed by <span class="orderform_link">Governing Law</span>.',
  ].join("\n"),
};

describe("DocumentPreview", () => {
  it("renders the document name and the standard terms body", () => {
    render(<DocumentPreview doc={doc} values={emptyValues(doc.fields)} />);
    expect(screen.getByRole("heading", { level: 1, name: "Pilot Agreement" })).toBeInTheDocument();
    expect(screen.getByText(/Pilot Access/)).toBeInTheDocument();
    expect(screen.getByText(/Governed by/)).toBeInTheDocument();
    // *_link spans render as defined-term references (the term name) — appears
    // both as the cover-page label and inline in the body.
    expect(screen.getAllByText("Governing Law").length).toBeGreaterThanOrEqual(2);
  });

  it("shows a cover-page value once captured, and party titles in the signature table", () => {
    const values = {
      ...emptyValues(doc.fields),
      governingLaw: "Delaware",
      party1CompanyName: "Acme",
    };
    render(<DocumentPreview doc={doc} values={values} />);
    expect(screen.getByText("Delaware")).toBeInTheDocument();
    expect(screen.getByText("Provider")).toBeInTheDocument();
    expect(screen.getByText("Acme")).toBeInTheDocument();
  });
});
