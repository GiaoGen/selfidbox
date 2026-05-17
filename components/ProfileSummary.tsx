export function ProfileSummary({
  title,
  archetype,
  description,
  tags,
  note,
}: {
  title: string;
  archetype: string;
  description: string;
  tags: string[];
  note: string;
}) {
  return (
    <section className="overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#b8a4ed_0%,#ffb084_62%,#fffaf0_100%)] p-6 text-[#0a0a0a] shadow-[0_18px_50px_rgba(10,10,10,0.08)] sm:p-8">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-white/35 px-3 py-1 text-sm font-semibold"
          >
            #{tag}
          </span>
        ))}
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-[1fr_180px] sm:items-end">
        <div>
          <p className="text-sm font-semibold opacity-70">SelfID profile</p>
          <h1 className="mt-2 text-5xl font-semibold leading-none sm:text-6xl">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 opacity-85">
            {description}
          </p>
          <p className="mt-5 max-w-2xl rounded-[24px] bg-white/35 p-4 text-sm font-semibold leading-6">
            {note}
          </p>
        </div>

        <div className="rounded-[28px] bg-white/35 p-5">
          <p className="text-sm font-semibold opacity-70">融合画像</p>
          <p className="mt-3 text-3xl font-semibold leading-tight">
            {archetype}
          </p>
        </div>
      </div>
    </section>
  );
}
