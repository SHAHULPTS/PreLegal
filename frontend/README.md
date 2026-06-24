# Mutual NDA Generator (PreLegal)

A Next.js web app that turns a short form into a complete, downloadable
**Mutual Non-Disclosure Agreement** (Common Paper Mutual NDA, Version 1.0).

Implements Jira issue **PL-3**: the user enters key information in a form, the
site renders the filled-in MNDA (Cover Page + full Standard Terms) in a live
preview, and the completed document can be downloaded locally as a PDF.

## Features

- **Form-driven Cover Page** — purpose, effective date, MNDA term, term of
  confidentiality, governing law/jurisdiction, optional modifications, and both
  parties' signature-block details.
- **Live preview** — a paper-like rendering of the agreement updates as you type.
- **Client-side PDF download** — generates a real (selectable-text) PDF in the
  browser via `@react-pdf/renderer`; no server or upload required.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts: `npm run build`, `npm run start`, `npm run lint`.

## How it works

- `src/lib/nda.ts` — shared types, default data, the Standard Terms text with
  `{{token}}` placeholders, and the tokenizer that resolves Cover Page values
  into text segments. This single source of content drives both the preview and
  the PDF.
- `src/components/NdaForm.tsx` — the controlled input form.
- `src/components/NdaPreview.tsx` — the on-screen HTML rendering.
- `src/components/NdaDocument.tsx` — the `@react-pdf/renderer` document.
- `src/components/NdaDownloadButton.tsx` — the PDF download link (browser-only,
  loaded through a `ssr: false` dynamic import in `NdaGenerator.tsx`).

## Attribution

The agreement text is the Common Paper Mutual Non-Disclosure Agreement
(Version 1.0), free to use under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
