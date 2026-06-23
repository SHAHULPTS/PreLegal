"use client";

import {
  ATTRIBUTION,
  DOCUMENT_TITLE,
  SIGNATURE_ROWS,
  STANDARD_TERMS,
  coverPageFields,
  interpolate,
  type DocSegment,
  type NdaFormData,
  type Party,
} from "@/lib/nda";

interface NdaPreviewProps {
  data: NdaFormData;
}

/** On-screen, paper-like rendering of the completed agreement. */
export default function NdaPreview({ data }: NdaPreviewProps) {
  return (
    <article className="mx-auto max-w-[680px] space-y-5 px-10 py-12 text-[13px] leading-relaxed text-slate-800">
      <header className="space-y-1 text-center">
        <h1 className="text-xl font-bold text-slate-900">{DOCUMENT_TITLE}</h1>
        <p className="text-xs uppercase tracking-wide text-slate-500">Cover Page</p>
      </header>

      {coverPageFields(data).map((field) => (
        <CoverField key={field.key} label={field.label} hint={field.hint}>
          <span className="whitespace-pre-line">
            <Segments segments={field.segments} />
          </span>
        </CoverField>
      ))}

      <p className="pt-2">
        By signing this Cover Page, each party agrees to enter into this MNDA as of
        the Effective Date.
      </p>

      <SignatureTable party1={data.party1} party2={data.party2} />

      <hr className="my-6 border-slate-200" />

      <section className="space-y-4">
        <h2 className="text-center text-base font-bold text-slate-900">
          Standard Terms
        </h2>
        {STANDARD_TERMS.map((term) => (
          <p key={term.number}>
            <span className="font-semibold">
              {term.number}. {term.title}.
            </span>{" "}
            <Segments segments={interpolate(term.body, data)} />
          </p>
        ))}
      </section>

      <p className="pt-4 text-[11px] text-slate-500">{ATTRIBUTION}</p>
    </article>
  );
}

function Segments({ segments }: { segments: DocSegment[] }) {
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.filled) {
          return (
            <strong key={i} className="font-semibold text-slate-900">
              {seg.text}
            </strong>
          );
        }
        if (seg.placeholder) {
          return (
            <span key={i} className="italic text-slate-400">
              {seg.text}
            </span>
          );
        }
        return <span key={i}>{seg.text}</span>;
      })}
    </>
  );
}

function CoverField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="font-semibold text-slate-900">{label}</h3>
      {hint && <p className="text-[11px] text-slate-500">{hint}</p>}
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

function SignatureTable({ party1, party2 }: { party1: Party; party2: Party }) {
  return (
    <table className="w-full border-collapse text-[12px]">
      <thead>
        <tr>
          <th className="w-1/4 border border-slate-300 bg-slate-50 p-2 text-left" />
          <th className="border border-slate-300 bg-slate-50 p-2 text-left">Party 1</th>
          <th className="border border-slate-300 bg-slate-50 p-2 text-left">Party 2</th>
        </tr>
      </thead>
      <tbody>
        {SIGNATURE_ROWS.map((row) => (
          <tr key={row.label}>
            <th className="border border-slate-300 bg-slate-50 p-2 text-left font-medium">
              {row.label}
            </th>
            <td className="h-8 border border-slate-300 p-2">{row.get(party1)}</td>
            <td className="h-8 border border-slate-300 p-2">{row.get(party2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
