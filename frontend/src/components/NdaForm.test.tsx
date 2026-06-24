import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NdaForm from "@/components/NdaForm";
import { defaultFormData, type NdaFormData } from "@/lib/nda";

/** Renders the form with real state so controlled inputs update on interaction. */
function renderControlled(initial: NdaFormData = defaultFormData) {
  function Harness() {
    const [data, setData] = useState(initial);
    return <NdaForm data={data} onChange={setData} />;
  }
  return render(<Harness />);
}

describe("NdaForm", () => {
  it("renders the core Cover Page and party fields", () => {
    renderControlled();
    expect(screen.getByLabelText("Purpose")).toBeInTheDocument();
    expect(screen.getByLabelText("Effective date")).toBeInTheDocument();
    expect(screen.getByLabelText("Governing law (state)")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Jurisdiction (city/county & state)"),
    ).toBeInTheDocument();
    // Both parties expose a Company field.
    expect(
      screen.getByLabelText("Company", { selector: "#party1-company" }),
    ).toBeInTheDocument();
  });

  it("calls onChange with the updated field value", () => {
    const onChange = vi.fn();
    render(<NdaForm data={defaultFormData} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Governing law (state)"), {
      target: { value: "Delaware" },
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ governingLaw: "Delaware" }),
    );
  });

  it("updates nested party data immutably", () => {
    const onChange = vi.fn();
    render(<NdaForm data={defaultFormData} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Print name", { selector: "#party1-name" }), {
      target: { value: "Ada Lovelace" },
    });

    const next = onChange.mock.calls[0][0] as NdaFormData;
    expect(next.party1.signatoryName).toBe("Ada Lovelace");
    // Party 2 must be untouched.
    expect(next.party2).toEqual(defaultFormData.party2);
  });

  it("shows a year input for a fixed MNDA term and hides it when until-terminated", async () => {
    const user = userEvent.setup();
    renderControlled();

    // Both term sections start fixed -> two numeric year inputs.
    expect(screen.getAllByRole("spinbutton")).toHaveLength(2);

    await user.selectOptions(
      screen.getByLabelText("Length of this MNDA"),
      "untilTerminated",
    );

    expect(screen.getAllByRole("spinbutton")).toHaveLength(1);
  });

  it("hides the confidentiality year input when set to perpetuity", async () => {
    const user = userEvent.setup();
    renderControlled();

    await user.selectOptions(
      screen.getByLabelText("How long Confidential Information is protected"),
      "perpetuity",
    );

    expect(screen.getAllByRole("spinbutton")).toHaveLength(1);
  });

  it("reflects typed input in a controlled field", async () => {
    const user = userEvent.setup();
    renderControlled();

    const jurisdiction = screen.getByLabelText("Jurisdiction (city/county & state)");
    await user.type(jurisdiction, "New Castle, DE");

    expect(jurisdiction).toHaveValue("New Castle, DE");
  });
});
