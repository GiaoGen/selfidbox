export function ProfileSummary({
  title,
  description,
  onDataSourceClick,
}: {
  title: string;
  description: string;
  onDataSourceClick?: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#b8a4ed_0%,#ffb084_62%,#fffaf0_100%)] p-6 text-[#0a0a0a] shadow-[0_18px_50px_rgba(10,10,10,0.08)] sm:p-8">
      <div>
        <p className="text-sm font-semibold opacity-70">SelfID profile</p>
        <h1 className="mt-2 text-5xl font-semibold leading-none sm:text-6xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 opacity-85">
          {description}
        </p>

        <button
          onClick={onDataSourceClick}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/35 px-5 py-2.5 text-sm font-semibold backdrop-blur-sm transition hover:bg-white/50"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-9-9" />
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4" />
            <path d="M12 18v4" />
            <path d="M4.93 4.93l2.83 2.83" />
            <path d="M16.24 16.24l2.83 2.83" />
          </svg>
          数据来源
        </button>
      </div>
    </section>
  );
}
