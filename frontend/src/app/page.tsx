import AuthGate from "@/components/AuthGate";
import DocumentGenerator from "@/components/DocumentGenerator";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
      <AuthGate>
        <DocumentGenerator />
      </AuthGate>
    </main>
  );
}
