import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// The real download button pulls in @react-pdf/renderer (browser-only and heavy),
// so stub it; this test focuses on the form -> preview data flow.
vi.mock("@/components/NdaDownloadButton", () => ({
  default: () => <div data-testid="download-stub">Download PDF</div>,
}));

import NdaGenerator from "@/components/NdaGenerator";

describe("NdaGenerator", () => {
  it("loads the (mocked) PDF download control", async () => {
    render(<NdaGenerator />);
    expect(await screen.findByTestId("download-stub")).toBeInTheDocument();
  });

  it("flows form edits through to the live preview", async () => {
    const user = userEvent.setup();
    render(<NdaGenerator />);
    await screen.findByTestId("download-stub");

    // Before typing, the governing-law value is a placeholder in the preview.
    expect(screen.getByText("[Fill in state]")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Governing law (state)"), "Delaware");

    // "Delaware" now appears in the preview (Cover Page + Standard Terms §9).
    expect(screen.getAllByText("Delaware").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText("[Fill in state]")).not.toBeInTheDocument();
  });
});
