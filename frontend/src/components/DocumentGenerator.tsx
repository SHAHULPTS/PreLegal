"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import DocumentChat from "@/components/DocumentChat";
import DocumentForm from "@/components/DocumentForm";
import DocumentHistory from "@/components/DocumentHistory";
import DocumentPreview from "@/components/DocumentPreview";
import { useAuth } from "@/components/AuthGate";
import { api, type SavedDocumentSummary } from "@/lib/api";
import {
  DISCLAIMER,
  emptyValues,
  type DocumentDetail,
  type FieldValues,
  type FieldSpec,
} from "@/lib/documents";

// @react-pdf/renderer is browser-only, so load the download button client-side.
const DocumentDownloadButton = dynamic(
  () => import("@/components/DocumentDownloadButton"),
  {
    ssr: false,
    loading: () => (
      <span className="inline-flex items-center rounded-md bg-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-500">
        Loading…
      </span>
    ),
  },
);

function defaultTitle(detail: DocumentDetail, values: FieldValues): string {
  const party = detail.fields.find(
    (f: FieldSpec) => /companyname$/i.test(f.key) && (values[f.key] ?? "").trim(),
  );
  const who = party ? values[party.key].trim() : "";
  return who ? `${detail.name} — ${who}` : detail.name;
}

export default function DocumentGenerator() {
  const { user, logout } = useAuth();
  const [documentType, setDocumentType] = useState("");
  const [values, setValues] = useState<FieldValues>({});
  const [detail, setDetail] = useState<DocumentDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [saved, setSaved] = useState<SavedDocumentSummary[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [savedTitle, setSavedTitle] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const refreshSaved = useCallback(async () => {
    try {
      setSaved(await api.listSaved());
    } catch {
      // Non-fatal: the history list just stays as-is.
    } finally {
      setSavedLoading(false);
    }
  }, []);

  // Load the user's saved documents on mount (state set in async callbacks).
  useEffect(() => {
    let cancelled = false;
    api
      .listSaved()
      .then((items) => {
        if (!cancelled) setSaved(items);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSavedLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load the chosen document's spec + template whenever the selection changes.
  useEffect(() => {
    if (!documentType || detail?.id === documentType) return;

    let cancelled = false;
    api
      .getDocument(documentType)
      .then((doc) => {
        if (cancelled) return;
        setDetail(doc);
        setLoadError(null);
        // Seed any fields the spec defines but the chat hasn't filled yet.
        setValues((current) => ({ ...emptyValues(doc.fields), ...current }));
      })
      .catch(() => {
        if (!cancelled) setLoadError("Couldn't load that document. Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [documentType, detail?.id]);

  function handleResult(nextType: string, nextFields: FieldValues) {
    if (nextType !== documentType) {
      setDocumentType(nextType);
      setValues(nextFields);
      // A freshly chosen document is unsaved until the user saves it.
      setSavedId(null);
      setSavedTitle(null);
      if (!nextType) setDetail(null);
    } else {
      setValues((current) => ({ ...current, ...nextFields }));
    }
  }

  async function handleSave() {
    if (!detail) return;
    setSaving(true);
    setActionError(null);
    const body = {
      documentType: detail.id,
      title: savedTitle ?? defaultTitle(detail, values),
      fields: values,
    };
    try {
      const result = savedId
        ? await api.updateSaved(savedId, body)
        : await api.createSaved(body);
      setSavedId(result.id);
      setSavedTitle(result.title);
      await refreshSaved();
    } catch {
      setActionError("Couldn't save the document. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleOpen(id: number) {
    setActionError(null);
    try {
      const doc = await api.getSaved(id);
      setDocumentType(doc.documentType);
      setValues(doc.fields);
      setSavedId(doc.id);
      setSavedTitle(doc.title);
    } catch {
      setActionError("Couldn't open that document. Please try again.");
    }
  }

  async function handleDelete(id: number) {
    setActionError(null);
    try {
      await api.deleteSaved(id);
      if (id === savedId) setSavedId(null);
      await refreshSaved();
    } catch {
      setActionError("Couldn't delete that document. Please try again.");
    }
  }

  function handleNew() {
    setDocumentType("");
    setValues({});
    setDetail(null);
    setSavedId(null);
    setSavedTitle(null);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-brand-navy px-6 py-4 text-white shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight">PreLegal</span>
          <span className="rounded bg-brand-yellow px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-navy">
            Beta
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <button
            type="button"
            onClick={handleNew}
            className="rounded-md bg-white/10 px-3 py-1.5 font-medium text-white transition hover:bg-white/20"
          >
            New document
          </button>
          <span className="hidden text-white/70 sm:inline">{user.email}</span>
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-md border border-white/30 px-3 py-1.5 font-medium text-white transition hover:bg-white/10"
          >
            Sign out
          </button>
        </div>
      </header>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand-navy">
          {detail ? detail.name : "Document Generator"}
        </h1>
        <p className="mt-1 text-sm text-brand-gray">
          Chat with the assistant to choose a document and fill in its details. The
          preview updates as details are captured, and you can fine-tune any field by
          hand before saving or downloading the PDF.
        </p>
      </div>

      {actionError && (
        <p role="alert" className="text-sm text-red-600">
          {actionError}
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className="space-y-4">
          <DocumentChat
            documentType={documentType}
            fields={values}
            onResult={handleResult}
          />

          {detail && (
            <details className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <summary className="cursor-pointer text-base font-semibold text-brand-navy">
                Review &amp; edit details
              </summary>
              <div className="mt-6">
                <DocumentForm fields={detail.fields} values={values} onChange={setValues} />
              </div>
            </details>
          )}

          <DocumentHistory
            items={saved}
            activeId={savedId}
            loading={savedLoading}
            onOpen={handleOpen}
            onDelete={handleDelete}
          />
        </div>

        <section className="space-y-4 lg:sticky lg:top-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-brand-navy">Preview</h2>
            {detail && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="rounded-md bg-brand-purple px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
                >
                  {saving ? "Saving…" : savedId ? "Update saved" : "Save"}
                </button>
                <DocumentDownloadButton doc={detail} values={values} />
              </div>
            )}
          </div>

          <div className="rounded-md border border-brand-yellow/40 bg-brand-yellow/10 px-4 py-2 text-xs text-brand-navy">
            {DISCLAIMER}
          </div>

          <div className="max-h-[calc(100vh-8rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            {detail ? (
              <DocumentPreview doc={detail} values={values} />
            ) : (
              <p className="px-10 py-16 text-center text-sm text-brand-gray">
                {loadError ??
                  "Your document preview will appear here once you've chosen a document in the chat."}
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
