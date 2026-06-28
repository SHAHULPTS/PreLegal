"use client";

import type { FieldSpec, FieldValues } from "@/lib/documents";

interface DocumentFormProps {
  fields: FieldSpec[];
  values: FieldValues;
  onChange: (next: FieldValues) => void;
}

const labelClass = "block text-sm font-medium text-slate-700";
const inputClass =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

/** Generic key-terms editor driven by a document's field spec. */
export default function DocumentForm({ fields, values, onChange }: DocumentFormProps) {
  const set = (key: string, value: string) => onChange({ ...values, [key]: value });

  const general = fields.filter((f) => !f.group);
  const groups = groupParties(fields);

  return (
    <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
      {general.length > 0 && (
        <Section title="Agreement details" description="The business terms on the Cover Page.">
          {general.map((field) => (
            <FieldRow key={field.key} field={field} value={values[field.key] ?? ""} onChange={set} />
          ))}
        </Section>
      )}

      {groups.map((group) => (
        <Section
          key={group.title}
          title={group.title}
          description="Signing party details for the Cover Page."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {group.fields.map((field) => (
              <FieldRow
                key={field.key}
                field={{ ...field, label: rowLabel(field.label) }}
                value={values[field.key] ?? ""}
                onChange={set}
              />
            ))}
          </div>
        </Section>
      ))}
    </form>
  );
}

function FieldRow({
  field,
  value,
  onChange,
}: {
  field: FieldSpec;
  value: string;
  onChange: (key: string, value: string) => void;
}) {
  const id = `field-${field.key}`;
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {field.label}
      </label>
      {field.hint && <p className="text-xs text-slate-500">{field.hint}</p>}
      {renderControl(field, id, value, onChange)}
    </div>
  );
}

function renderControl(
  field: FieldSpec,
  id: string,
  value: string,
  onChange: (key: string, value: string) => void,
) {
  switch (field.type) {
    case "textarea":
      return (
        <textarea
          id={id}
          className={inputClass}
          rows={2}
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
        />
      );
    case "date":
      return (
        <input
          id={id}
          type="date"
          className={inputClass}
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
        />
      );
    case "years":
      return (
        <input
          id={id}
          type="number"
          min={1}
          className={inputClass}
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
        />
      );
    case "select":
      return (
        <select
          id={id}
          className={inputClass}
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
        >
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    default:
      return (
        <input
          id={id}
          className={inputClass}
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
        />
      );
  }
}

function groupParties(fields: FieldSpec[]): { title: string; fields: FieldSpec[] }[] {
  const groups: { title: string; fields: FieldSpec[] }[] = [];
  const byKey = new Map<string, { title: string; fields: FieldSpec[] }>();
  for (const field of fields) {
    if (!field.group) continue;
    let group = byKey.get(field.group);
    if (!group) {
      group = { title: groupTitle(field.label), fields: [] };
      byKey.set(field.group, group);
      groups.push(group);
    }
    group.fields.push(field);
  }
  return groups;
}

function groupTitle(label: string): string {
  const idx = label.indexOf(":");
  return idx === -1 ? label : label.slice(0, idx).trim();
}

function rowLabel(label: string): string {
  const idx = label.indexOf(":");
  return idx === -1 ? label : label.slice(idx + 1).trim();
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
