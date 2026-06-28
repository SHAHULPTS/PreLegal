import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const signin = vi.fn();
const signup = vi.fn();

vi.mock("@/lib/api", () => ({
  api: {
    signin: (...args: unknown[]) => signin(...args),
    signup: (...args: unknown[]) => signup(...args),
  },
  ApiError: class ApiError extends Error {
    constructor(
      readonly status: number,
      message: string,
    ) {
      super(message);
    }
  },
}));

import AuthForm from "@/components/AuthForm";
import { ApiError } from "@/lib/api";

describe("AuthForm", () => {
  beforeEach(() => {
    signin.mockReset();
    signup.mockReset();
  });

  it("signs in and reports the authenticated user", async () => {
    const user = userEvent.setup();
    const onAuthed = vi.fn();
    const account = { id: 1, email: "alice@example.com", created_at: "" };
    signin.mockResolvedValue(account);

    render(<AuthForm onAuthed={onAuthed} />);
    await user.type(screen.getByLabelText("Email"), "alice@example.com");
    await user.type(screen.getByLabelText("Password"), "correct-horse");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(signin).toHaveBeenCalledWith("alice@example.com", "correct-horse");
    expect(onAuthed).toHaveBeenCalledWith(account);
  });

  it("switches to sign up and calls signup", async () => {
    const user = userEvent.setup();
    const onAuthed = vi.fn();
    signup.mockResolvedValue({ id: 2, email: "bob@example.com", created_at: "" });

    render(<AuthForm onAuthed={onAuthed} />);
    await user.click(screen.getByRole("button", { name: "Sign up" }));
    await user.type(screen.getByLabelText("Email"), "bob@example.com");
    await user.type(screen.getByLabelText("Password"), "long-enough-pw");
    // The submit button now reads "Sign up".
    await user.click(screen.getByRole("button", { name: "Sign up" }));

    expect(signup).toHaveBeenCalledWith("bob@example.com", "long-enough-pw");
    expect(onAuthed).toHaveBeenCalled();
  });

  it("shows the API error message on failure", async () => {
    const user = userEvent.setup();
    signin.mockRejectedValue(new ApiError(401, "Invalid email or password."));

    render(<AuthForm onAuthed={vi.fn()} />);
    await user.type(screen.getByLabelText("Email"), "alice@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid email or password.",
    );
  });
});
