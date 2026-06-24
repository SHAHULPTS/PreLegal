"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import NdaDocument from "@/components/NdaDocument";
import { pdfFileName, type NdaFormData } from "@/lib/nda";

const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60";

/**
 * Browser-only PDF download trigger. Rendered via a `ssr: false` dynamic import
 * because @react-pdf/renderer relies on browser APIs.
 */
export default function NdaDownloadButton({ data }: { data: NdaFormData }) {
  return (
    <PDFDownloadLink
      document={<NdaDocument data={data} />}
      fileName={pdfFileName(data)}
      className={buttonClass}
    >
      {({ loading }) => (loading ? "Preparing PDF…" : "Download PDF")}
    </PDFDownloadLink>
  );
}
