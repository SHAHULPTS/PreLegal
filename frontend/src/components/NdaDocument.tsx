"use client";

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import {
  ATTRIBUTION,
  DOCUMENT_TITLE,
  STANDARD_TERMS,
  formatDate,
  interpolate,
  type NdaFormData,
  type Party,
} from "@/lib/nda";

const styles = StyleSheet.create({
  page: {
    paddingVertical: 56,
    paddingHorizontal: 56,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.5,
    color: "#1f2937",
  },
  title: { fontSize: 16, fontFamily: "Helvetica-Bold", textAlign: "center" },
  subtitle: {
    fontSize: 9,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#6b7280",
    marginTop: 2,
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginTop: 18,
    marginBottom: 8,
  },
  coverField: { marginBottom: 10 },
  fieldLabel: { fontFamily: "Helvetica-Bold" },
  fieldHint: { fontSize: 8, color: "#6b7280", marginBottom: 1 },
  paragraph: { marginBottom: 8, textAlign: "justify" },
  bold: { fontFamily: "Helvetica-Bold" },
  placeholder: { fontFamily: "Helvetica-Oblique", color: "#9ca3af" },
  intro: { marginTop: 12, marginBottom: 8 },
  attribution: { fontSize: 8, color: "#6b7280", marginTop: 16 },
  // Signature table
  table: { marginTop: 10, borderTop: "1pt solid #cbd5e1", borderLeft: "1pt solid #cbd5e1" },
  row: { flexDirection: "row" },
  cellLabel: {
    width: "28%",
    padding: 5,
    borderRight: "1pt solid #cbd5e1",
    borderBottom: "1pt solid #cbd5e1",
    backgroundColor: "#f8fafc",
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  cell: {
    width: "36%",
    padding: 5,
    minHeight: 22,
    borderRight: "1pt solid #cbd5e1",
    borderBottom: "1pt solid #cbd5e1",
    fontSize: 9,
  },
  headerCell: { backgroundColor: "#f8fafc", fontFamily: "Helvetica-Bold" },
});

function ValueText({
  value,
  placeholder,
  suffix = "",
}: {
  value: string;
  placeholder: string;
  suffix?: string;
}) {
  if (!value.trim()) return <Text style={styles.placeholder}>{placeholder}</Text>;
  return (
    <Text style={styles.bold}>
      {value}
      {suffix}
    </Text>
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
    <View style={styles.coverField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
      <Text>{children}</Text>
    </View>
  );
}

function SignatureTable({ party1, party2 }: { party1: Party; party2: Party }) {
  const rows: { label: string; get: (p: Party) => string }[] = [
    { label: "Signature", get: () => "" },
    { label: "Print Name", get: (p) => p.signatoryName },
    { label: "Title", get: (p) => p.title },
    { label: "Company", get: (p) => p.companyName },
    { label: "Notice Address", get: (p) => p.noticeAddress },
    { label: "Date", get: () => "" },
  ];
  return (
    <View style={styles.table}>
      <View style={styles.row}>
        <Text style={[styles.cellLabel]} />
        <Text style={[styles.cell, styles.headerCell]}>Party 1</Text>
        <Text style={[styles.cell, styles.headerCell]}>Party 2</Text>
      </View>
      {rows.map((row) => (
        <View style={styles.row} key={row.label} wrap={false}>
          <Text style={styles.cellLabel}>{row.label}</Text>
          <Text style={styles.cell}>{row.get(party1)}</Text>
          <Text style={styles.cell}>{row.get(party2)}</Text>
        </View>
      ))}
    </View>
  );
}

export default function NdaDocument({ data }: { data: NdaFormData }) {
  return (
    <Document title={DOCUMENT_TITLE} author="PreLegal">
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{DOCUMENT_TITLE}</Text>
        <Text style={styles.subtitle}>Cover Page</Text>

        <CoverField label="Purpose" hint="How Confidential Information may be used">
          <ValueText value={data.purpose} placeholder="[Purpose]" />
        </CoverField>

        <CoverField label="Effective Date">
          <ValueText value={formatDate(data.effectiveDate)} placeholder="[Effective Date]" />
        </CoverField>

        <CoverField label="MNDA Term" hint="The length of this MNDA">
          {data.mndaTermType === "fixed" ? (
            <>
              <Text>Expires </Text>
              <ValueText value={data.mndaTermYears.trim()} placeholder="[#]" suffix=" year(s)" />
              <Text> from the Effective Date.</Text>
            </>
          ) : (
            <Text>Continues until terminated in accordance with the MNDA.</Text>
          )}
        </CoverField>

        <CoverField
          label="Term of Confidentiality"
          hint="How long Confidential Information is protected"
        >
          {data.confidentialityTermType === "fixed" ? (
            <>
              <ValueText
                value={data.confidentialityTermYears.trim()}
                placeholder="[#]"
                suffix=" year(s)"
              />
              <Text>
                {" "}
                from the Effective Date, but trade secrets remain protected until they
                are no longer trade secrets under applicable law.
              </Text>
            </>
          ) : (
            <Text>In perpetuity.</Text>
          )}
        </CoverField>

        <CoverField label="Governing Law & Jurisdiction">
          <Text>Governing Law: </Text>
          <ValueText value={data.governingLaw} placeholder="[Fill in state]" />
          <Text>{"\n"}Jurisdiction: </Text>
          <ValueText value={data.jurisdiction} placeholder="[Fill in city/county and state]" />
        </CoverField>

        {data.modifications.trim() ? (
          <CoverField label="MNDA Modifications">
            <Text>{data.modifications}</Text>
          </CoverField>
        ) : null}

        <Text style={styles.intro}>
          By signing this Cover Page, each party agrees to enter into this MNDA as of
          the Effective Date.
        </Text>

        <SignatureTable party1={data.party1} party2={data.party2} />

        <Text style={styles.sectionHeading}>Standard Terms</Text>
        {STANDARD_TERMS.map((term) => (
          <Text style={styles.paragraph} key={term.number}>
            <Text style={styles.bold}>
              {term.number}. {term.title}.{" "}
            </Text>
            {interpolate(term.body, data).map((seg, i) => (
              <Text key={i} style={seg.filled ? styles.bold : undefined}>
                {seg.text}
              </Text>
            ))}
          </Text>
        ))}

        <Text style={styles.attribution}>{ATTRIBUTION}</Text>
      </Page>
    </Document>
  );
}
