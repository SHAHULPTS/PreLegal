"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import NdaForm from "@/components/NdaForm";
import NdaPreview from "@/components/NdaPreview";
import { defaultFormData, type NdaFormData } from "@/lib/nda";

// @react-pdf/renderer is browser-only, so load the download button client-side.
const NdaDownloadButton = dynamic(() => import("@/components/NdaDownloadButton"), {
  ssr: false,
  loading: () => (
    <span className="inline-flex items-center rounded-md bg-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-500">
      Loading…
    </span>
  ),
});

export default function NdaGenerator() {
  const [data, setData] = useState<NdaFormData>(defaultFormData);

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <NdaForm data={data} onChange={setData} />
      </section>

      <section className="space-y-4 lg:sticky lg:top-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-slate-900">Preview</h2>
          <NdaDownloadButton data={data} />
        </div>
        <div className="max-h-[calc(100vh-8rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <NdaPreview data={data} />
        </div>
      </section>
    </div>
  );
}
