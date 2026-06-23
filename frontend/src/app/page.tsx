import NdaGenerator from "@/components/NdaGenerator";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Mutual NDA Generator
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Fill in the details below to generate a complete Mutual Non-Disclosure
          Agreement. The preview updates as you type, and you can download the
          finished document as a PDF.
        </p>
      </header>
      <NdaGenerator />
    </main>
  );
}
