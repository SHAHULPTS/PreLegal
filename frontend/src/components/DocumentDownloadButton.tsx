"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import DocumentPdf from "@/components/DocumentPdf";
import { pdfFileName, type DocumentDetail, type FieldValues } from "@/lib/documents";

const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60";

/**
 * Browser-only PDF download trigger. Rendered via a `ssr: false` dynamic import
 * because @react-pdf/renderer relies on browser APIs.
 */
export default function DocumentDownloadButton({
  doc,
  values,
}: {
  doc: DocumentDetail;
  values: FieldValues;
}) {
  return (
    <PDFDownloadLink
      document={<DocumentPdf doc={doc} values={values} />}
      fileName={pdfFileName(doc.name, doc.fields, values)}
      className={buttonClass}
    >
      {({ loading }) => (loading ? "Preparing PDF…" : "Download PDF")}
    </PDFDownloadLink>
  );
}
