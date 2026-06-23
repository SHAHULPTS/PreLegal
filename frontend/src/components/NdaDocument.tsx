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
  SIGNATURE_ROWS,
  STANDARD_TERMS,
  coverPageFields,
  interpolate,
  type DocSegment,
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

function segmentStyle(seg: DocSegment) {
  if (seg.filled) return styles.bold;
  if (seg.placeholder) return styles.placeholder;
  return undefined;
}

/** Renders DocSegments as inline (nestable) Text runs. */
function Segments({ segments }: { segments: DocSegment[] }) {
  return (
    <>
      {segments.map((seg, i) => (
        <Text key={i} style={segmentStyle(seg)}>
          {seg.text}
        </Text>
      ))}
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
    <View style={styles.coverField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
      <Text>{children}</Text>
    </View>
  );
}

function SignatureTable({ party1, party2 }: { party1: Party; party2: Party }) {
  return (
    <View style={styles.table}>
      <View style={styles.row}>
        <Text style={[styles.cellLabel]} />
        <Text style={[styles.cell, styles.headerCell]}>Party 1</Text>
        <Text style={[styles.cell, styles.headerCell]}>Party 2</Text>
      </View>
      {SIGNATURE_ROWS.map((row) => (
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

        {coverPageFields(data).map((field) => (
          <CoverField key={field.key} label={field.label} hint={field.hint}>
            <Segments segments={field.segments} />
          </CoverField>
        ))}

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
            <Segments segments={interpolate(term.body, data)} />
          </Text>
        ))}

        <Text style={styles.attribution}>{ATTRIBUTION}</Text>
      </Page>
    </Document>
  );
}
