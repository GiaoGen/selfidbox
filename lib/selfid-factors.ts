export interface SelfidFactorDef {
  key: string;
  name: string;
  group: "core" | "social";
  description: string;
}

export const SELFID_FACTORS: SelfidFactorDef[] = [
  // --- Core (8) — 核心人格：你本质是什么样的人 ---
  {
    key: "social",
    name: "社交性",
    group: "core",
    description: "衡量一个人在社交互动中的倾向性与舒适度，高分数表示乐于与人交往、从社交中获取能量",
  },
  {
    key: "sensitivity",
    name: "敏感度",
    group: "core",
    description: "衡量用户对情绪、环境和细节变化的感知强度，高分数表示情感细腻、容易察觉细微变化",
  },
  {
    key: "rationality",
    name: "理性度",
    group: "core",
    description: "衡量用户做决策时依赖逻辑与分析的程度，高分数表示倾向于理性思考而非感性判断",
  },
  {
    key: "curiosity",
    name: "探索欲",
    group: "core",
    description: "衡量用户对新知识、新体验的渴望程度，高分数表示充满好奇心、乐于尝试未知",
  },
  {
    key: "independence",
    name: "独立性",
    group: "core",
    description: "衡量用户自主决策与独立思考的倾向，高分数表示不依赖他人、有主见",
  },
  {
    key: "expressiveness",
    name: "表达欲",
    group: "core",
    description: "衡量用户表达自我想法与情感的欲望强度，高分数表示喜欢分享、善于表达",
  },
  {
    key: "drive",
    name: "行动力",
    group: "core",
    description: "衡量用户将想法转化为行动的能力与冲动，高分数表示执行力强、说做就做",
  },
  {
    key: "imagination",
    name: "幻想度",
    group: "core",
    description: "衡量用户想象力和抽象思维活跃程度，高分数表示富有创意、喜欢想象和构建内心世界",
  },
  // --- Social (8) — 社会表达：你如何在世界中表现自己 ---
  {
    key: "assertiveness",
    name: "主张性",
    group: "social",
    description: "衡量用户在社交中坚持自己观点与需求的程度，高分数表示敢于坚持、不易妥协",
  },
  {
    key: "security_need",
    name: "安全感需求",
    group: "social",
    description: "衡量用户对稳定性和确定性的需求程度，高分数表示需要较多的安全感和可预期性",
  },
  {
    key: "empathy",
    name: "共情力",
    group: "social",
    description: "衡量用户理解和感受他人情绪的能力，高分数表示善解人意、容易站在他人角度思考",
  },
  {
    key: "dramaticness",
    name: "戏剧性",
    group: "social",
    description: "衡量用户在社交表达中的戏剧化和情绪起伏程度，高分数表示情感表达丰富、有感染力",
  },
  {
    key: "orderliness",
    name: "秩序感",
    group: "social",
    description: "衡量用户对规律、结构和计划的偏好程度，高分数表示喜欢有条理、按计划行事",
  },
  {
    key: "contradiction",
    name: "反差感",
    group: "social",
    description: "衡量用户内在与外在表现的差异程度，高分数表示表里不一、有多重面向",
  },
  {
    key: "attachment",
    name: "亲密倾向",
    group: "social",
    description: "衡量用户在亲密关系中的投入与依赖程度，高分数表示重视深度连接、愿意投入情感",
  },
  {
    key: "presence",
    name: "存在感",
    group: "social",
    description: "衡量用户在群体中被注意和感知的程度，高分数表示气场强、容易成为焦点",
  },
];

/* ------------------------------------------------------------------ */
/*  Convenience lookups                                                */
/* ------------------------------------------------------------------ */

export const SELFID_FACTOR_KEYS: Set<string> = new Set(
  SELFID_FACTORS.map((f) => f.key),
);

export const CORE_KEYS: Set<string> = new Set(
  SELFID_FACTORS.filter((f) => f.group === "core").map((f) => f.key),
);

export const SOCIAL_KEYS: Set<string> = new Set(
  SELFID_FACTORS.filter((f) => f.group === "social").map((f) => f.key),
);

export const FACTOR_BY_KEY: Record<string, SelfidFactorDef> = {};
for (const f of SELFID_FACTORS) {
  FACTOR_BY_KEY[f.key] = f;
}
