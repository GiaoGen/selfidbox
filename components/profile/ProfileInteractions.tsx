import { CoverFlowSources } from "@/components/profile/CoverFlowSources";

export function ProfileInteractions({
  title,
}: {
  title: string;
  description: string;
}) {
  return (
    <>
      <CoverFlowSources />

      {title && (
        <>
          {/* Divider */}
          <hr className="border-0 border-t border-[var(--ink)]/8" />

          {/* One-line personality summary */}
          <p className="text-center text-lg font-medium leading-relaxed tracking-wide text-[var(--ink)]/80 sm:text-xl">
            {title}
          </p>
        </>
      )}
    </>
  );
}
