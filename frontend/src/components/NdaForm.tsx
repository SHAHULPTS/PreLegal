"use client";

import type { NdaFormData, Party } from "@/lib/nda";

interface NdaFormProps {
  data: NdaFormData;
  onChange: (next: NdaFormData) => void;
}

const labelClass = "block text-sm font-medium text-slate-700";
const inputClass =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

export default function NdaForm({ data, onChange }: NdaFormProps) {
  const set = <K extends keyof NdaFormData>(key: K, value: NdaFormData[K]) =>
    onChange({ ...data, [key]: value });

  const setParty = (key: "party1" | "party2", patch: Partial<Party>) =>
    onChange({ ...data, [key]: { ...data[key], ...patch } });

  return (
    <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
      <Section
        title="Agreement details"
        description="The business terms captured on the Cover Page."
      >
        <Field label="Purpose" htmlFor="purpose">
          <textarea
            id="purpose"
            className={inputClass}
            rows={2}
            value={data.purpose}
            placeholder="How Confidential Information may be used"
            onChange={(e) => set("purpose", e.target.value)}
          />
        </Field>

        <Field label="Effective date" htmlFor="effectiveDate">
          <input
            id="effectiveDate"
            type="date"
            className={inputClass}
            value={data.effectiveDate}
            onChange={(e) => set("effectiveDate", e.target.value)}
          />
        </Field>

        <Field label="Length of this MNDA" htmlFor="mndaTermType">
          <div className="flex flex-wrap items-center gap-3">
            <select
              id="mndaTermType"
              className={`${inputClass} w-auto`}
              value={data.mndaTermType}
              onChange={(e) =>
                set("mndaTermType", e.target.value as NdaFormData["mndaTermType"])
              }
            >
              <option value="fixed">Expires after a set term</option>
              <option value="untilTerminated">Continues until terminated</option>
            </select>
            {data.mndaTermType === "fixed" && (
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="number"
                  min={1}
                  className={`${inputClass} mt-0 w-20`}
                  value={data.mndaTermYears}
                  onChange={(e) => set("mndaTermYears", e.target.value)}
                />
                year(s) from the effective date
              </label>
            )}
          </div>
        </Field>

        <Field
          label="How long Confidential Information is protected"
          htmlFor="confidentialityTermType"
        >
          <div className="flex flex-wrap items-center gap-3">
            <select
              id="confidentialityTermType"
              className={`${inputClass} w-auto`}
              value={data.confidentialityTermType}
              onChange={(e) =>
                set(
                  "confidentialityTermType",
                  e.target.value as NdaFormData["confidentialityTermType"],
                )
              }
            >
              <option value="fixed">For a set term</option>
              <option value="perpetuity">In perpetuity</option>
            </select>
            {data.confidentialityTermType === "fixed" && (
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="number"
                  min={1}
                  className={`${inputClass} mt-0 w-20`}
                  value={data.confidentialityTermYears}
                  onChange={(e) => set("confidentialityTermYears", e.target.value)}
                />
                year(s) from the effective date
              </label>
            )}
          </div>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Governing law (state)" htmlFor="governingLaw">
            <input
              id="governingLaw"
              className={inputClass}
              value={data.governingLaw}
              placeholder="Delaware"
              onChange={(e) => set("governingLaw", e.target.value)}
            />
          </Field>
          <Field label="Jurisdiction (city/county & state)" htmlFor="jurisdiction">
            <input
              id="jurisdiction"
              className={inputClass}
              value={data.jurisdiction}
              placeholder="New Castle, DE"
              onChange={(e) => set("jurisdiction", e.target.value)}
            />
          </Field>
        </div>

        <Field label="MNDA modifications (optional)" htmlFor="modifications">
          <textarea
            id="modifications"
            className={inputClass}
            rows={2}
            value={data.modifications}
            placeholder="List any modifications to the Standard Terms"
            onChange={(e) => set("modifications", e.target.value)}
          />
        </Field>
      </Section>

      <PartyFields
        title="Party 1"
        partyKey="party1"
        party={data.party1}
        onChange={(patch) => setParty("party1", patch)}
      />
      <PartyFields
        title="Party 2"
        partyKey="party2"
        party={data.party2}
        onChange={(patch) => setParty("party2", patch)}
      />
    </form>
  );
}

function PartyFields({
  title,
  partyKey,
  party,
  onChange,
}: {
  title: string;
  partyKey: "party1" | "party2";
  party: Party;
  onChange: (patch: Partial<Party>) => void;
}) {
  return (
    <Section title={title} description="Signing party details for the Cover Page.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company" htmlFor={`${partyKey}-company`}>
          <input
            id={`${partyKey}-company`}
            className={inputClass}
            value={party.companyName}
            onChange={(e) => onChange({ companyName: e.target.value })}
          />
        </Field>
        <Field label="Print name" htmlFor={`${partyKey}-name`}>
          <input
            id={`${partyKey}-name`}
            className={inputClass}
            value={party.signatoryName}
            onChange={(e) => onChange({ signatoryName: e.target.value })}
          />
        </Field>
        <Field label="Title" htmlFor={`${partyKey}-title`}>
          <input
            id={`${partyKey}-title`}
            className={inputClass}
            value={party.title}
            onChange={(e) => onChange({ title: e.target.value })}
          />
        </Field>
        <Field
          label="Notice address (email or postal)"
          htmlFor={`${partyKey}-address`}
        >
          <input
            id={`${partyKey}-address`}
            className={inputClass}
            value={party.noticeAddress}
            onChange={(e) => onChange({ noticeAddress: e.target.value })}
          />
        </Field>
      </div>
    </Section>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="space-y-4">
      <div>
        <legend className="text-base font-semibold text-slate-900">{title}</legend>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      {children}
    </fieldset>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      {children}
    </div>
  );
}
