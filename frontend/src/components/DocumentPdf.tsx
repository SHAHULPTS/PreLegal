"use client";

import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import {
  coverRows,
  DISCLAIMER,
  partyGroups,
  type DocumentDetail,
  type FieldValues,
} from "@/lib/documents";
import { parseTemplate, type DocBlock, type DocSegment } from "@/lib/template";

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
  paragraph: { marginBottom: 6, textAlign: "justify" },
  heading: { fontFamily: "Helvetica-Bold", marginTop: 6, marginBottom: 2 },
  bold: { fontFamily: "Helvetica-Bold" },
  defined: { fontFamily: "Helvetica-Bold" },
  placeholder: { fontFamily: "Helvetica-Oblique", color: "#9ca3af" },
  intro: { marginTop: 12, marginBottom: 8 },
  disclaimer: {
    marginTop: 4,
    marginBottom: 12,
    padding: 6,
    fontSize: 8,
    color: "#032147",
    backgroundColor: "#fbf3d6",
    border: "1pt solid #ecad0a",
  },
  attribution: { fontSize: 8, color: "#6b7280", marginTop: 16 },
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
    flex: 1,
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
  if (seg.defined) return styles.defined;
  if (seg.bold) return styles.bold;
  return undefined;
}

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

function Block({ block }: { block: DocBlock }) {
  return (
    <Text
      style={[styles.paragraph, block.heading ? styles.heading : {}, { marginLeft: block.level * 16 }]}
    >
      {block.marker ? <Text style={styles.bold}>{block.marker} </Text> : null}
      <Segments segments={block.segments} />
    </Text>
  );
}

export default function DocumentPdf({ doc, values }: { doc: DocumentDetail; values: FieldValues }) {
  const parsed = parseTemplate(doc.template);
  const rows = coverRows(doc.fields, values);
  const groups = partyGroups(doc.fields, values);
  const rowLabels = groups[0]?.rows.map((r) => r.label) ?? [];

  return (
    <Document title={doc.name} author="PreLegal">
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{doc.name}</Text>
        <Text style={styles.subtitle}>Cover Page</Text>

        <Text style={styles.disclaimer}>{DISCLAIMER}</Text>

        {rows.map((row) => (
          <View key={row.key} style={styles.coverField}>
            <Text style={styles.fieldLabel}>{row.label}</Text>
            {row.hint ? <Text style={styles.fieldHint}>{row.hint}</Text> : null}
            <Text>
              <Segments segments={row.segments} />
            </Text>
          </View>
        ))}

        {groups.length > 0 && (
          <>
            <Text style={styles.intro}>
              By signing this Cover Page, each party agrees to enter into this agreement as
              of the Effective Date.
            </Text>
            <View style={styles.table}>
              <View style={styles.row}>
                <Text style={styles.cellLabel} />
                {groups.map((g) => (
                  <Text key={g.title} style={[styles.cell, styles.headerCell]}>
                    {g.title}
                  </Text>
                ))}
              </View>
              <View style={styles.row} wrap={false}>
                <Text style={styles.cellLabel}>Signature</Text>
                {groups.map((g) => (
                  <Text key={g.title} style={styles.cell} />
                ))}
              </View>
              {rowLabels.map((label, rowIndex) => (
                <View style={styles.row} key={label} wrap={false}>
                  <Text style={styles.cellLabel}>{label}</Text>
                  {groups.map((g) => (
                    <Text key={g.title} style={styles.cell}>
                      {g.rows[rowIndex]?.value}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          </>
        )}

        <Text style={styles.sectionHeading}>{parsed.title || "Standard Terms"}</Text>
        {parsed.blocks.map((block, i) => (
          <Block key={i} block={block} />
        ))}

        {parsed.attribution ? <Text style={styles.attribution}>{parsed.attribution}</Text> : null}
      </Page>
    </Document>
  );
}
