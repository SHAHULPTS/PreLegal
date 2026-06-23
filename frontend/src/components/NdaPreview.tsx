"use client";

import {
  ATTRIBUTION,
  DOCUMENT_TITLE,
  SIGNATURE_ROWS,
  STANDARD_TERMS,
  formatDate,
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

      <CoverField label="Purpose" hint="How Confidential Information may be used">
        <Value value={data.purpose} placeholder="[Purpose]" />
      </CoverField>

      <CoverField label="Effective Date">
        <Value value={formatDate(data.effectiveDate)} placeholder="[Effective Date]" />
      </CoverField>

      <CoverField label="MNDA Term" hint="The length of this MNDA">
        {data.mndaTermType === "fixed" ? (
          <span>
            Expires{" "}
            <Value
              value={data.mndaTermYears.trim()}
              placeholder="[#]"
              suffix=" year(s)"
            />{" "}
            from the Effective Date.
          </span>
        ) : (
          <span>Continues until terminated in accordance with the MNDA.</span>
        )}
      </CoverField>

      <CoverField
        label="Term of Confidentiality"
        hint="How long Confidential Information is protected"
      >
        {data.confidentialityTermType === "fixed" ? (
          <span>
            <Value
              value={data.confidentialityTermYears.trim()}
              placeholder="[#]"
              suffix=" year(s)"
            />{" "}
            from the Effective Date, but trade secrets remain protected until they
            are no longer trade secrets under applicable law.
          </span>
        ) : (
          <span>In perpetuity.</span>
        )}
      </CoverField>

      <CoverField label="Governing Law & Jurisdiction">
        <div className="space-y-1">
          <div>
            Governing Law: <Value value={data.governingLaw} placeholder="[Fill in state]" />
          </div>
          <div>
            Jurisdiction:{" "}
            <Value value={data.jurisdiction} placeholder="[Fill in city/county and state]" />
          </div>
        </div>
      </CoverField>

      {data.modifications.trim() && (
        <CoverField label="MNDA Modifications">
          <span className="whitespace-pre-wrap">{data.modifications}</span>
        </CoverField>
      )}

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
      {segments.map((seg, i) =>
        seg.filled ? (
          <strong key={i} className="font-semibold text-slate-900">
            {seg.text}
          </strong>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
}

function Value({
  value,
  placeholder,
  suffix = "",
}: {
  value: string;
  placeholder: string;
  suffix?: string;
}) {
  if (!value.trim()) {
    return <span className="italic text-slate-400">{placeholder}</span>;
  }
  return (
    <strong className="font-semibold text-slate-900">
      {value}
      {suffix}
    </strong>
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
