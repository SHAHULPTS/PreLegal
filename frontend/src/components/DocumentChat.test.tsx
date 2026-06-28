import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const chat = vi.fn();

vi.mock("@/lib/api", () => ({
  api: { chat: (...args: unknown[]) => chat(...args) },
  ApiError: class ApiError extends Error {
    constructor(
      readonly status: number,
      message: string,
    ) {
      super(message);
    }
  },
}));

import DocumentChat from "@/components/DocumentChat";

describe("DocumentChat", () => {
  beforeEach(() => chat.mockReset());

  it("shows the assistant greeting", () => {
    render(<DocumentChat documentType="" fields={{}} onResult={() => {}} />);
    expect(screen.getByText(/help you create a legal document/i)).toBeInTheDocument();
  });

  it("reports the chosen document and fields from a reply", async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    chat.mockResolvedValue({
      reply: "Great — let's create a Mutual NDA.",
      documentType: "mutual-nda",
      fields: { purpose: "" },
      complete: false,
    });

    render(<DocumentChat documentType="" fields={{}} onResult={onResult} />);
    await user.type(screen.getByLabelText("Message"), "I need an NDA");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(chat).toHaveBeenCalledWith(
      [
        expect.objectContaining({ role: "assistant" }),
        { role: "user", content: "I need an NDA" },
      ],
      "",
      {},
    );
    expect(await screen.findByText(/let's create a Mutual NDA/i)).toBeInTheDocument();
    expect(onResult).toHaveBeenCalledWith("mutual-nda", { purpose: "" });
  });

  it("shows an error and restores the input when the request fails", async () => {
    const user = userEvent.setup();
    chat.mockRejectedValueOnce(new Error("network down"));

    render(<DocumentChat documentType="mutual-nda" fields={{}} onResult={() => {}} />);
    await user.type(screen.getByLabelText("Message"), "hello there");
    await user.click(screen.getByRole("button", { name: "Send" }));

    await screen.findByRole("alert");
    expect(screen.getByLabelText("Message")).toHaveValue("hello there");
  });
});
