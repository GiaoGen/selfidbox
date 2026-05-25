export interface QuizMeta {
  title: string;
  hook: string;
  quiz_type: string;
  audience: string;
  tone: string;
}

export interface Result {
  id: string;
  name: string;
  subtitle?: string;
  description: string;
  traits: string[];
  shareText?: string;
}

export interface AIResult {
  key: string;
  name: string;
  subtitle?: string;
  description: string;
  traits: string[];
  share_text?: string;
}

export function mapAIResults(aiResults: AIResult[]): Result[] {
  return aiResults.map((ai) => ({
    id: ai.key,
    name: ai.name,
    subtitle: ai.subtitle,
    description: ai.description,
    traits: ai.traits,
    shareText: ai.share_text,
  }));
}

export interface Factor {
  id: string;
  name: string;
  nameEn: string;
}

export interface ResultVector {
  resultId: string;
  values: Record<string, number>;
}

export interface OptionEffect {
  label: string;
  text: string;
  effects: Record<string, number>;
}

export interface Question {
  id: string;
  text: string;
  options: OptionEffect[];
}

export type UserVector = Record<string, number>;

export const quizMeta: QuizMeta = {
  title: "测测你像哪种乐器",
  hook: "你的情绪其实有声音",
  quiz_type: "personality",
  audience: "小红书用户",
  tone: "文艺 / 治愈",
};

export const results: Result[] = [
  {
    id: "old-piano",
    name: "旧钢琴",
    description: "你不是安静，你只是很少把真正的声音交出去。",
    traits: ["内敛", "深沉", "审美敏锐", "情绪记忆强"],
  },
  {
    id: "electric-guitar",
    name: "电吉他",
    description: "你的存在感不需要解释，声音就是你的语言。",
    traits: ["外放", "有冲击力", "自由", "不羁"],
  },
  {
    id: "flute",
    name: "长笛",
    description: "轻盈、通透，你像一阵能穿透嘈杂的清澈风声。",
    traits: ["细腻", "灵动", "治愈", "善于感知氛围"],
  },
  {
    id: "drums",
    name: "鼓",
    description: "你是人群的心跳，节奏感就是你理解世界的方式。",
    traits: ["有力量", "节奏感强", "带动他人", "直接"],
  },
  {
    id: "violin",
    name: "小提琴",
    description: "精准而深情，你用结构和技巧表达最复杂的情绪。",
    traits: ["精准", "深情", "自律", "有结构感"],
  },
];

export const factors: Factor[] = [
  { id: "sensitivity", name: "敏感度", nameEn: "Sensitivity" },
  { id: "expressiveness", name: "表达欲", nameEn: "Expressiveness" },
  { id: "imagination", name: "幻想度", nameEn: "Imagination" },
  { id: "drive", name: "行动力", nameEn: "Drive" },
  { id: "orderliness", name: "秩序感", nameEn: "Orderliness" },
];

export const resultVectors: ResultVector[] = [
  {
    resultId: "old-piano",
    values: { sensitivity: 90, expressiveness: 20, imagination: 85, drive: 35, orderliness: 70 },
  },
  {
    resultId: "electric-guitar",
    values: { sensitivity: 45, expressiveness: 95, imagination: 60, drive: 90, orderliness: 30 },
  },
  {
    resultId: "flute",
    values: { sensitivity: 78, expressiveness: 55, imagination: 88, drive: 45, orderliness: 50 },
  },
  {
    resultId: "drums",
    values: { sensitivity: 35, expressiveness: 85, imagination: 45, drive: 95, orderliness: 40 },
  },
  {
    resultId: "violin",
    values: { sensitivity: 82, expressiveness: 48, imagination: 80, drive: 60, orderliness: 88 },
  },
];

export const questions: Question[] = [
  {
    id: "q1",
    text: "你更喜欢哪种夜晚？",
    options: [
      {
        label: "A",
        text: "一个人听雨写东西",
        effects: { sensitivity: 2, imagination: 2, expressiveness: -1 },
      },
      {
        label: "B",
        text: "和朋友去 livehouse",
        effects: { expressiveness: 2, drive: 1 },
      },
      {
        label: "C",
        text: "整理房间然后早睡",
        effects: { orderliness: 2, drive: 1 },
      },
    ],
  },
  {
    id: "q2",
    text: "在人群里你更像？",
    options: [
      {
        label: "A",
        text: "安静观察者",
        effects: { sensitivity: 1, expressiveness: -2, imagination: 1 },
      },
      {
        label: "B",
        text: "气氛推动者",
        effects: { expressiveness: 2, drive: 2 },
      },
    ],
  },
];

export const mockUserVector: UserVector = {
  sensitivity: 84,
  expressiveness: 31,
  imagination: 82,
  drive: 42,
  orderliness: 66,
};

export const finalResultInterpretation = {
  main: "你给人的感觉可能是温和、克制，甚至有点难接近。但你的内在其实很深，情绪感受、记忆力和审美判断都比别人想象得更强。",
  secondary: "你也带有一点「长笛人格」的轻盈感。",
};

export const finalResultSubtitle =
  "你不是安静，你只是很少把真正的声音交出去。";
