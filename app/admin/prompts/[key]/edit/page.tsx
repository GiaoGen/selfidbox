import { notFound, redirect } from "next/navigation";
import { getPromptByKey, upsertPrompt, validatePromptContent, clearPromptCache } from "@/lib/ai/prompts";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function EditPromptPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const prompt = await getPromptByKey(key);

  if (!prompt) {
    notFound();
  }

  const validation = validatePromptContent(prompt.prompt);
  const showWarning = prompt.is_active && !validation.valid;

  async function handleSave(formData: FormData) {
    "use server";

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const promptText = formData.get("prompt") as string;
    const isActive = formData.get("is_active") === "true";

    if (!name || !promptText) {
      throw new Error("Name and Prompt are required.");
    }

    await upsertPrompt(key, {
      name,
      description: description || null,
      prompt: promptText,
      is_active: isActive,
    });

    clearPromptCache(key);

    revalidatePath("/admin/prompts");
    revalidatePath(`/admin/prompts/${key}/edit`);
    redirect("/admin/prompts");
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-[-0.03em]">
          Edit Prompt
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          <code className="rounded-full bg-[var(--ink)]/8 px-2 py-0.5 text-[11px] font-medium">
            {key}
          </code>
          <span className="ml-2">v{prompt.version}</span>
        </p>
      </div>

      {showWarning && (
        <div className="rounded-[16px] border border-amber-300 bg-amber-50 px-5 py-3 text-sm text-amber-800">
          <strong>⚠ Invalid Prompt:</strong> {validation.reason}.
          AI calls will automatically use the code fallback instead of this DB
          prompt. Fix the prompt content or set it to inactive to clear this
          warning.
        </div>
      )}

      <form
        action={handleSave}
        className="space-y-5 rounded-[24px] bg-[var(--surface-card)] p-6 shadow-sm"
      >
        {/* Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-semibold text-[var(--ink)] mb-1.5"
          >
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={prompt.name}
            className="w-full rounded-[14px] border border-[var(--hairline)] bg-white px-4 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ink)]/15"
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-semibold text-[var(--ink)] mb-1.5"
          >
            Description
          </label>
          <input
            id="description"
            name="description"
            type="text"
            defaultValue={prompt.description ?? ""}
            className="w-full rounded-[14px] border border-[var(--hairline)] bg-white px-4 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ink)]/15"
          />
        </div>

        {/* Active toggle */}
        <div className="flex items-center gap-3">
          <label
            htmlFor="is_active"
            className="text-sm font-semibold text-[var(--ink)]"
          >
            Active
          </label>
          <select
            id="is_active"
            name="is_active"
            defaultValue={prompt.is_active ? "true" : "false"}
            className="rounded-[14px] border border-[var(--hairline)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ink)]/15"
          >
            <option value="true">Active — DB prompt overrides code fallback</option>
            <option value="false">Inactive — code fallback is used</option>
          </select>
        </div>

        {/* Prompt textarea */}
        <div>
          <label
            htmlFor="prompt"
            className="block text-sm font-semibold text-[var(--ink)] mb-1.5"
          >
            Prompt Template
          </label>
          <p className="mb-2 text-xs text-[var(--muted)]">
            Use{" "}
            <code className="rounded bg-[var(--ink)]/8 px-1 text-[11px]">
              {"{{variable_name}}"}
            </code>{" "}
            for dynamic values. Missing variables are replaced with empty
            strings.
          </p>
          <textarea
            id="prompt"
            name="prompt"
            required
            rows={20}
            defaultValue={prompt.prompt}
            className="w-full rounded-[14px] border border-[var(--hairline)] bg-white px-4 py-3 text-sm text-[var(--ink)] font-mono leading-relaxed placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ink)]/15 resize-y"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="rounded-[14px] bg-[var(--ink)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Save Changes
          </button>
          <a
            href="/admin/prompts"
            className="rounded-[14px] border border-[var(--hairline)] px-5 py-2.5 text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
