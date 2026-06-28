import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DocumentHistory from "@/components/DocumentHistory";
import type { SavedDocumentSummary } from "@/lib/api";

const items: SavedDocumentSummary[] = [
  { id: 1, documentType: "mutual-nda", title: "Acme NDA", updated_at: "2026-06-20T10:00:00Z" },
  { id: 2, documentType: "pilot-agreement", title: "Pilot v1", updated_at: "2026-06-21T10:00:00Z" },
];

describe("DocumentHistory", () => {
  it("shows an empty-state message when there are no documents", () => {
    render(
      <DocumentHistory items={[]} activeId={null} loading={false} onOpen={() => {}} onDelete={() => {}} />,
    );
    expect(screen.getByText(/Documents you save will appear here/i)).toBeInTheDocument();
  });

  it("opens and deletes by id", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const onDelete = vi.fn();
    render(
      <DocumentHistory
        items={items}
        activeId={1}
        loading={false}
        onOpen={onOpen}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByText("Pilot v1"));
    expect(onOpen).toHaveBeenCalledWith(2);

    await user.click(screen.getByRole("button", { name: "Delete Acme NDA" }));
    expect(onDelete).toHaveBeenCalledWith(1);
  });
});
