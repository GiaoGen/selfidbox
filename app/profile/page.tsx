import Link from "next/link";
import { ProfileRadar, type RadarPoint } from "@/components/ProfileRadar";
import { ProfileSummary } from "@/components/ProfileSummary";
import { VectorCard } from "@/components/VectorCard";

const corePersonality: RadarPoint[] = [
  { name: "社交性", english: "Social", value: 42 },
  { name: "情绪敏感度", english: "Sensitivity", value: 86 },
  { name: "理性度", english: "Rationality", value: 71 },
  { name: "探索欲", english: "Curiosity", value: 78 },
  { name: "独立性", english: "Independence", value: 82 },
  { name: "表达欲", english: "Expressiveness", value: 48 },
  { name: "行动力", english: "Drive", value: 66 },
  { name: "幻想度", english: "Imagination", value: 88 },
];

const socialExpression: RadarPoint[] = [
  { name: "攻击性", english: "Assertiveness", value: 38 },
  { name: "安全感需求", english: "Security Need", value: 74 },
  { name: "共情力", english: "Empathy", value: 85 },
  { name: "戏剧性", english: "Dramaticness", value: 52 },
  { name: "秩序感", english: "Orderliness", value: 69 },
  { name: "反差感", english: "Contradiction", value: 77 },
  { name: "亲密倾向", english: "Attachment", value: 61 },
  { name: "能量场", english: "Presence", value: 46 },
];

const sourceCards = [
  {
    label: "数据来源",
    value: "3 份",
    description: "已导入 MBTI、动物人格和职业测试的 mock 报告。",
    tone: "peach" as const,
  },
  {
    label: "测试类型",
    value: "MBTI",
    description: "包含人格类型、趣味表达和职业倾向三类信号。",
    tone: "lavender" as const,
  },
  {
    label: "融合状态",
    value: "Mock",
    description: "当前不接真实 AI 和融合算法，只先验证个人页体验。",
    tone: "teal" as const,
  },
];

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <div className="mx-auto flex w-full max-w-[960px] flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between rounded-full bg-[var(--surface-soft)] p-2">
          <Link
            href="/explore"
            className="rounded-full px-4 py-2 text-sm font-semibold"
          >
            SelfIDBox
          </Link>
          <Link
            href="/create"
            className="rounded-full px-4 py-2 text-sm font-semibold"
          >
            Quiz Studio
          </Link>
          <Link
            href="/profile"
            className="rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white"
          >
            Profile
          </Link>
        </nav>

        <ProfileSummary
          title="高敏感的想象型独行者"
          archetype="Sensitive Explorer"
          description="你的核心图谱呈现出高情绪敏感度、高幻想度和高独立性。你不一定总是外放表达，但会持续观察、吸收和重组世界里的细节。"
          note="SelfID 不是单一测试结果，而是从多个测试中融合出的统一人格图谱。"
          tags={["高敏感", "独立", "想象力", "低攻击性"]}
        />

        <section className="grid gap-5 lg:grid-cols-2">
          <ProfileRadar
            title="Core Personality"
            subtitle="你本质是什么样的人"
            data={corePersonality}
            color="#ff4d8b"
          />
          <ProfileRadar
            title="Social Expression"
            subtitle="你如何在世界中表现自己"
            data={socialExpression}
            color="#1a3a3a"
          />
        </section>

        <section className="rounded-[32px] bg-[#ffb084] p-5 text-[#0a0a0a] shadow-[0_18px_50px_rgba(10,10,10,0.07)] sm:p-6">
          <p className="text-sm font-semibold opacity-70">AI-style summary</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
            你像一台安静但灵敏的内在雷达
          </h2>
          <p className="mt-4 text-base leading-7 opacity-85">
            你对情绪、氛围和隐含信息很敏感，也拥有较强的想象与自我驱动。社交表达上，你更倾向于温和靠近而不是强势推进；当安全感足够时，你会释放出更高的共情、创造和存在感。
          </p>
        </section>

        <section className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-[var(--muted)]">
              Source cards
            </p>
            <h2 className="mt-1 text-3xl font-semibold">数据来源</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {sourceCards.map((card) => (
              <VectorCard
                key={card.label}
                label={card.label}
                value={card.value}
                description={card.description}
                tone={card.tone}
              />
            ))}
          </div>
        </section>

        <section className="rounded-[32px] bg-[var(--surface-soft)] p-5 sm:p-6">
          <p className="text-sm font-semibold text-[var(--muted)]">
            About SelfID
          </p>
          <p className="mt-3 text-base leading-7 text-[var(--body)]">
            SelfID 不是单一测试结果，而是从多个测试中融合出的统一人格图谱。它把不同报告里的稳定信号、社交表达和兴趣倾向合并成一张可持续更新的自我画像。
          </p>
        </section>
      </div>
    </main>
  );
}
