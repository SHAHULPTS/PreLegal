"use client";

import { useMemo } from "react";
import {
  coverRows,
  partyGroups,
  type DocumentDetail,
  type FieldValues,
} from "@/lib/documents";
import { parseTemplate, type DocBlock, type DocSegment } from "@/lib/template";

interface DocumentPreviewProps {
  doc: DocumentDetail;
  values: FieldValues;
}

/** On-screen, paper-like rendering of the completed agreement. */
export default function DocumentPreview({ doc, values }: DocumentPreviewProps) {
  const parsed = useMemo(() => parseTemplate(doc.template), [doc.template]);
  const rows = coverRows(doc.fields, values);
  const groups = partyGroups(doc.fields, values);

  return (
    <article className="mx-auto max-w-[680px] space-y-5 px-10 py-12 text-[13px] leading-relaxed text-slate-800">
      <header className="space-y-1 text-center">
        <h1 className="text-xl font-bold text-slate-900">{doc.name}</h1>
        <p className="text-xs uppercase tracking-wide text-slate-500">Cover Page</p>
      </header>

      {rows.map((row) => (
        <div key={row.key}>
          <h3 className="font-semibold text-slate-900">{row.label}</h3>
          {row.hint && <p className="text-[11px] text-slate-500">{row.hint}</p>}
          <div className="mt-0.5">
            <Segments segments={row.segments} />
          </div>
        </div>
      ))}

      {groups.length > 0 && (
        <>
          <p className="pt-2">
            By signing this Cover Page, each party agrees to enter into this agreement as
            of the Effective Date.
          </p>
          <SignatureTable groups={groups} />
        </>
      )}

      <hr className="my-6 border-slate-200" />

      <section className="space-y-3">
        <h2 className="text-center text-base font-bold text-slate-900">
          {parsed.title || "Standard Terms"}
        </h2>
        {parsed.blocks.map((block, i) => (
          <Block key={i} block={block} />
        ))}
      </section>

      {parsed.attribution && (
        <p className="pt-4 text-[11px] text-slate-500">{parsed.attribution}</p>
      )}
    </article>
  );
}

function Block({ block }: { block: DocBlock }) {
  const indent = block.level * 20;
  return (
    <p
      style={{ marginLeft: indent }}
      className={block.heading ? "font-bold text-slate-900" : undefined}
    >
      {block.marker && <span className="font-semibold">{block.marker} </span>}
      <Segments segments={block.segments} />
    </p>
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
        if (seg.defined) {
          return (
            <span key={i} className="font-medium text-slate-900">
              {seg.text}
            </span>
          );
        }
        if (seg.bold) {
          return (
            <strong key={i} className="font-semibold">
              {seg.text}
            </strong>
          );
        }
        return <span key={i}>{seg.text}</span>;
      })}
    </>
  );
}

function SignatureTable({
  groups,
}: {
  groups: { title: string; rows: { label: string; value: string }[] }[];
}) {
  const rowLabels = groups[0]?.rows.map((r) => r.label) ?? [];
  return (
    <table className="w-full border-collapse text-[12px]">
      <thead>
        <tr>
          <th className="w-1/4 border border-slate-300 bg-slate-50 p-2 text-left" />
          {groups.map((g) => (
            <th key={g.title} className="border border-slate-300 bg-slate-50 p-2 text-left">
              {g.title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          <th className="border border-slate-300 bg-slate-50 p-2 text-left font-medium">
            Signature
          </th>
          {groups.map((g) => (
            <td key={g.title} className="h-8 border border-slate-300 p-2" />
          ))}
        </tr>
        {rowLabels.map((label, rowIndex) => (
          <tr key={label}>
            <th className="border border-slate-300 bg-slate-50 p-2 text-left font-medium">
              {label}
            </th>
            {groups.map((g) => (
              <td key={g.title} className="h-8 border border-slate-300 p-2">
                {g.rows[rowIndex]?.value}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
