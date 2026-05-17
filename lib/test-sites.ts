export type TestCategory = "personality" | "career" | "fun";

export type TestDifficulty = "轻松" | "标准" | "深入";

export type TestSite = {
  id: string;
  name: string;
  category: TestCategory;
  categoryLabel: string;
  description: string;
  longDescription: string;
  tags: string[];
  estimatedMinutes: number;
  supportsEmailReport: boolean;
  difficulty: TestDifficulty;
  sourceName: string;
  sourceUrl: string;
  url: string;
  popularity: string;
  accent: "pink" | "teal" | "lavender" | "peach" | "ochre" | "mint";
  bestFor: string;
};

export const importEmail = "demo@selfidbox.com";

export const categories: {
  id: TestCategory;
  label: string;
  href: string;
  description: string;
  accent: TestSite["accent"];
}[] = [
  {
    id: "personality",
    label: "人格测试",
    href: "/explore/personality",
    description: "MBTI、九型人格、大五人格和更轻松的自我画像。",
    accent: "lavender",
  },
  {
    id: "career",
    label: "职业测评",
    href: "/explore/career",
    description: "找到适合的工作风格、职业方向和团队角色。",
    accent: "teal",
  },
  {
    id: "fun",
    label: "娱乐测试",
    href: "/explore/fun",
    description: "适合分享的趣味人格、动物、食物和社交测试。",
    accent: "pink",
  },
];

export const testSites: TestSite[] = [
  {
    id: "mbti-16-style",
    name: "16 型人格快速测试",
    category: "personality",
    categoryLabel: "人格",
    description: "用轻量题目理解自己的能量来源、决策方式和生活节奏。",
    longDescription:
      "适合作为人格档案的第一份基础报告。结果容易被朋友理解，也方便和后续报告一起汇总成长期人格画像。",
    tags: ["MBTI", "自我理解", "社交分享"],
    estimatedMinutes: 8,
    supportsEmailReport: true,
    difficulty: "标准",
    sourceName: "SelfIDBox Mock",
    sourceUrl: "https://www.16personalities.com/",
    url: "https://www.16personalities.com/",
    popularity: "本周 12.4k 人在看",
    accent: "lavender",
    bestFor: "想快速拥有一张可分享人格名片的人",
  },
  {
    id: "big-five-core",
    name: "大五人格维度测评",
    category: "personality",
    categoryLabel: "人格",
    description: "从开放性、责任心、外向性、宜人性和情绪稳定性看自己。",
    longDescription:
      "比类型标签更细，适合沉淀到人格档案中做长期对比。分数型结果也方便 AI 总结趋势。",
    tags: ["大五人格", "量化维度", "长期档案"],
    estimatedMinutes: 12,
    supportsEmailReport: true,
    difficulty: "深入",
    sourceName: "Open Personality Lab Mock",
    sourceUrl: "https://selfidbox.com",
    url: "https://selfidbox.com",
    popularity: "高收藏",
    accent: "peach",
    bestFor: "希望看到分数维度和稳定特质的人",
  },
  {
    id: "enneagram-map",
    name: "九型人格动机地图",
    category: "personality",
    categoryLabel: "人格",
    description: "关注内在动机、压力反应和亲密关系中的惯性模式。",
    longDescription:
      "九型人格更偏向动机解释，适合配合 MBTI 或大五报告一起看，让人格档案不只停留在标签层面。",
    tags: ["九型人格", "动机", "关系模式"],
    estimatedMinutes: 10,
    supportsEmailReport: false,
    difficulty: "深入",
    sourceName: "Type Studio Mock",
    sourceUrl: "https://selfidbox.com",
    url: "https://selfidbox.com",
    popularity: "讨论热度高",
    accent: "ochre",
    bestFor: "想理解自己为什么会这样选择的人",
  },
  {
    id: "shadow-strengths",
    name: "隐藏优势人格扫描",
    category: "personality",
    categoryLabel: "人格",
    description: "从朋友眼中的你、压力下的你和日常选择里找出隐藏优势。",
    longDescription:
      "适合做完基础人格测试后补充一份更轻松的优势报告，让自我介绍更具体，也更适合分享。",
    tags: ["隐藏优势", "自我介绍", "轻分析"],
    estimatedMinutes: 5,
    supportsEmailReport: true,
    difficulty: "轻松",
    sourceName: "Strength Mirror Mock",
    sourceUrl: "https://selfidbox.com",
    url: "https://selfidbox.com",
    popularity: "新手友好",
    accent: "mint",
    bestFor: "想找到自己身上可被朋友记住的特质的人",
  },
  {
    id: "career-anchor",
    name: "职业锚倾向测试",
    category: "career",
    categoryLabel: "职业",
    description: "判断你更看重自主、稳定、管理、创造还是专业成长。",
    longDescription:
      "适合在换工作、选方向和职业复盘时使用。报告可以帮助 SelfIDBox 汇总你的职业偏好和决策权重。",
    tags: ["职业锚", "换工作", "价值排序"],
    estimatedMinutes: 9,
    supportsEmailReport: true,
    difficulty: "标准",
    sourceName: "Career Compass Mock",
    sourceUrl: "https://selfidbox.com",
    url: "https://selfidbox.com",
    popularity: "职场用户常用",
    accent: "teal",
    bestFor: "正在换方向或重新评估工作选择的人",
  },
  {
    id: "work-style-fit",
    name: "工作风格适配测评",
    category: "career",
    categoryLabel: "职业",
    description: "看看你更适合独立深潜、协作推进、创意发散还是流程管理。",
    longDescription:
      "这类结果适合用于团队沟通和求职自我介绍，也能和人格报告合并生成更完整的工作画像。",
    tags: ["工作风格", "团队协作", "求职"],
    estimatedMinutes: 6,
    supportsEmailReport: true,
    difficulty: "轻松",
    sourceName: "Team Mirror Mock",
    sourceUrl: "https://selfidbox.com",
    url: "https://selfidbox.com",
    popularity: "分享率高",
    accent: "mint",
    bestFor: "想把自己介绍得更具体、更有人味的人",
  },
  {
    id: "holland-code-lite",
    name: "霍兰德兴趣代码 Lite",
    category: "career",
    categoryLabel: "职业",
    description: "用兴趣倾向找到你更容易投入的任务环境和职业主题。",
    longDescription:
      "比传统职业列表更轻，先给出方向感，再把兴趣标签沉淀进人格档案，辅助后续推荐。",
    tags: ["兴趣代码", "职业方向", "学生友好"],
    estimatedMinutes: 7,
    supportsEmailReport: false,
    difficulty: "标准",
    sourceName: "Interest Lab Mock",
    sourceUrl: "https://selfidbox.com",
    url: "https://selfidbox.com",
    popularity: "适合新手",
    accent: "ochre",
    bestFor: "还在探索职业大方向的人",
  },
  {
    id: "team-role-signal",
    name: "团队角色信号测试",
    category: "career",
    categoryLabel: "职业",
    description: "看看你在团队里更像启动者、整合者、稳定器还是收尾者。",
    longDescription:
      "适合团队沟通、项目复盘和个人优势表达。结果轻量但实用，后续可以和职业锚一起生成工作画像。",
    tags: ["团队角色", "项目协作", "优势表达"],
    estimatedMinutes: 5,
    supportsEmailReport: true,
    difficulty: "轻松",
    sourceName: "Role Signal Mock",
    sourceUrl: "https://selfidbox.com",
    url: "https://selfidbox.com",
    popularity: "团队分享友好",
    accent: "lavender",
    bestFor: "想知道自己在协作里自然承担什么角色的人",
  },
  {
    id: "animal-social-vibe",
    name: "你的聊天气质像哪种动物",
    category: "fun",
    categoryLabel: "娱乐",
    description: "从回复节奏、表达习惯和社交能量看你的聊天人格。",
    longDescription:
      "轻松、好分享，适合朋友圈传播。结果不追求严肃心理学，更像一张带有性格线索的社交卡片。",
    tags: ["动物人格", "聊天", "朋友圈"],
    estimatedMinutes: 3,
    supportsEmailReport: true,
    difficulty: "轻松",
    sourceName: "Social Quiz Mock",
    sourceUrl: "https://selfidbox.com",
    url: "https://selfidbox.com",
    popularity: "今日热门",
    accent: "pink",
    bestFor: "想发一张朋友会点开的测试结果卡的人",
  },
  {
    id: "fruit-energy",
    name: "你像哪一种水果能量",
    category: "fun",
    categoryLabel: "娱乐",
    description: "用甜度、酸度、存在感和治愈力生成你的水果人格。",
    longDescription:
      "这是一类很适合 UGC 平台的趣味测试，结果轻、传播快，也能沉淀成用户自我表达标签。",
    tags: ["水果人格", "趣味", "低压力"],
    estimatedMinutes: 2,
    supportsEmailReport: false,
    difficulty: "轻松",
    sourceName: "Fruit Mood Mock",
    sourceUrl: "https://selfidbox.com",
    url: "https://selfidbox.com",
    popularity: "转发友好",
    accent: "peach",
    bestFor: "想用轻松方式表达今天状态的人",
  },
  {
    id: "instrument-personality",
    name: "你是哪种乐器人格",
    category: "fun",
    categoryLabel: "娱乐",
    description: "看你的节奏感、情绪表达和社交音色更像哪种乐器。",
    longDescription:
      "把抽象性格变成可感知的乐器意象。适合后续生成可视化结果卡，也适合用户自己创建变体测试。",
    tags: ["乐器人格", "创意表达", "结果卡"],
    estimatedMinutes: 4,
    supportsEmailReport: true,
    difficulty: "轻松",
    sourceName: "Sound Self Mock",
    sourceUrl: "https://selfidbox.com",
    url: "https://selfidbox.com",
    popularity: "新上架",
    accent: "lavender",
    bestFor: "喜欢带一点艺术感和可视化结果的人",
  },
  {
    id: "weather-mood",
    name: "你的今日天气人格",
    category: "fun",
    categoryLabel: "娱乐",
    description: "把今天的情绪、社交电量和表达方式变成一张天气卡。",
    longDescription:
      "适合每日分享的小测试。结果很轻，不要求严肃解释，但可以给 SelfIDBox 增加状态类人格标签。",
    tags: ["天气人格", "每日状态", "分享卡"],
    estimatedMinutes: 2,
    supportsEmailReport: false,
    difficulty: "轻松",
    sourceName: "Mood Weather Mock",
    sourceUrl: "https://selfidbox.com",
    url: "https://selfidbox.com",
    popularity: "适合打卡",
    accent: "ochre",
    bestFor: "想用一张小卡片表达今天心情的人",
  },
];

export function getTestsByCategory(category: TestCategory) {
  return testSites.filter((site) => site.category === category);
}

export function getTestSite(id: string) {
  return testSites.find((site) => site.id === id);
}

export function getRelatedTestSites(site: TestSite, count = 3) {
  return testSites
    .filter((item) => item.category === site.category && item.id !== site.id)
    .slice(0, count);
}
