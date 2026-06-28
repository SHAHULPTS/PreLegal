"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import DocumentChat from "@/components/DocumentChat";
import DocumentForm from "@/components/DocumentForm";
import DocumentPreview from "@/components/DocumentPreview";
import { useAuth } from "@/components/AuthGate";
import { api } from "@/lib/api";
import { emptyValues, type DocumentDetail, type FieldValues } from "@/lib/documents";

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

export default function DocumentGenerator() {
  const { user, logout } = useAuth();
  const [documentType, setDocumentType] = useState("");
  const [values, setValues] = useState<FieldValues>({});
  const [detail, setDetail] = useState<DocumentDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

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
      if (!nextType) setDetail(null);
    } else {
      setValues((current) => ({ ...current, ...nextFields }));
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {detail ? detail.name : "PreLegal Document Generator"}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Chat with the assistant to choose a document and fill in its details. The
            preview updates as details are captured, and you can fine-tune any field by
            hand before downloading the PDF.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <span className="hidden sm:inline">{user.email}</span>
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className="space-y-4">
          <DocumentChat
            documentType={documentType}
            fields={values}
            onResult={handleResult}
          />

          {detail && (
            <details className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <summary className="cursor-pointer text-base font-semibold text-slate-900">
                Review &amp; edit details
              </summary>
              <div className="mt-6">
                <DocumentForm fields={detail.fields} values={values} onChange={setValues} />
              </div>
            </details>
          )}
        </div>

        <section className="space-y-4 lg:sticky lg:top-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold text-slate-900">Preview</h2>
            {detail && <DocumentDownloadButton doc={detail} values={values} />}
          </div>
          <div className="max-h-[calc(100vh-8rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            {detail ? (
              <DocumentPreview doc={detail} values={values} />
            ) : (
              <p className="px-10 py-16 text-center text-sm text-slate-500">
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
