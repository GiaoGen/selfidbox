import type { QuizMeta } from "@/lib/mock-quiz-engine";

export function QuizMetaCard({ meta }: { meta: QuizMeta }) {
  return (
    <section className="overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#b8a4ed_0%,#ffb084_62%,#fffaf0_100%)] p-6 shadow-[0_18px_50px_rgba(10,10,10,0.08)] sm:p-8">
      <p className="text-sm font-semibold opacity-70">Quiz Meta</p>
      <h2 className="mt-2 text-4xl font-semibold tracking-[-0.03em]">{meta.title}</h2>
      <p className="mt-3 text-lg leading-7 opacity-80">{meta.hook}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <span className="rounded-full bg-white/35 px-4 py-2 text-sm font-semibold">
          {meta.quiz_type}
        </span>
        <span className="rounded-full bg-white/35 px-4 py-2 text-sm font-semibold">
          {meta.audience}
        </span>
        <span className="rounded-full bg-white/35 px-4 py-2 text-sm font-semibold">
          {meta.tone}
        </span>
      </div>
    </section>
  );
}
