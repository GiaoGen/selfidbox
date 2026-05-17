export function VectorCard({
  label,
  value,
  description,
  tone = "cream",
}: {
  label: string;
  value: string;
  description: string;
  tone?: "cream" | "pink" | "teal" | "lavender" | "peach";
}) {
  const tones = {
    cream: "bg-[var(--surface-card)] text-[var(--ink)]",
    pink: "bg-[#ff4d8b] text-white",
    teal: "bg-[#1a3a3a] text-white",
    lavender: "bg-[#b8a4ed] text-[#0a0a0a]",
    peach: "bg-[#ffb084] text-[#0a0a0a]",
  };

  return (
    <article
      className={`rounded-[28px] p-5 shadow-[0_18px_50px_rgba(10,10,10,0.07)] ${tones[tone]}`}
    >
      <p className="text-sm font-semibold opacity-70">{label}</p>
      <p className="mt-3 text-3xl font-semibold leading-none">{value}</p>
      <p className="mt-4 text-sm leading-6 opacity-80">{description}</p>
    </article>
  );
}
