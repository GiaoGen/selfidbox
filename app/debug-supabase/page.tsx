import { getCategories, getPublishedTestSites } from "@/lib/test-sites-db";

export default async function DebugSupabasePage() {
  const categories = await getCategories();
  const sites = await getPublishedTestSites();

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-2xl font-bold">Supabase Debug</h1>

      <h2 className="mt-6 text-xl font-semibold">Categories</h2>
      <pre className="mt-3 rounded-xl bg-gray-100 p-4 text-sm overflow-auto">
        {JSON.stringify(categories, null, 2)}
      </pre>

      <h2 className="mt-6 text-xl font-semibold">Test Sites</h2>
      <pre className="mt-3 rounded-xl bg-gray-100 p-4 text-sm overflow-auto">
        {JSON.stringify(sites, null, 2)}
      </pre>
    </main>
  );
}