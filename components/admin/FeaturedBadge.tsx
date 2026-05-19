export function FeaturedBadge({ featured }: { featured: boolean }) {
  if (!featured) return null;

  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#ffb084] px-2 py-0.5 text-xs font-semibold text-[#0a0a0a]">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      Featured
    </span>
  );
}
