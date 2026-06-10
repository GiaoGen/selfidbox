/* ------------------------------------------------------------------ */
/*  Result vector post-processing                                       */
/*                                                                      */
/*  Applied AFTER AI generation to ensure quality:                      */
/*  1. Clamp profiles where >70% of factors are extreme                  */
/*  2. Detect too-similar result pairs via cosine similarity             */
/*  3. Auto-spread values on the closest factors for >0.95 pairs        */
/* ------------------------------------------------------------------ */

export interface NormalizerResult {
  vectors: Record<string, Record<string, number>>;
  changes: string[];
}

/* ------------------------------------------------------------------ */
/*  Cosine similarity (0-100 scale)                                    */
/* ------------------------------------------------------------------ */

export function cosineSimilarity(
  a: Record<string, number>,
  b: Record<string, number>,
): number {
  const keys = Object.keys(a);
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (const k of keys) {
    const va = a[k] ?? 50;
    const vb = b[k] ?? 50;
    dot += va * vb;
    magA += va * va;
    magB += vb * vb;
  }
  if (magA === 0 || magB === 0) return 1;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/* ------------------------------------------------------------------ */
/*  Trait → factor alignment (simple keyword match)                    */
/* ------------------------------------------------------------------ */

const FACTOR_TRAIT_KEYWORDS: Record<string, string[]> = {
  social: ["社交", "外向", "开朗", "活泼", "热闹", "群体", "合群", "内向", "孤僻"],
  sensitivity: ["敏感", "细腻", "感知", "察觉", "情绪化", "敏锐"],
  rationality: ["理性", "逻辑", "冷静", "分析", "客观", "理智"],
  curiosity: ["好奇", "探索", "求知", "新鲜", "冒险", "猎奇"],
  independence: ["独立", "自主", "自由", "独处", "自我", "依赖"],
  expressiveness: ["表达", "分享", "外放", "表现", "展示", "沉默", "内敛"],
  drive: ["行动", "执行", "果断", "主动", "积极", "驱动", "拖延", "被动"],
  imagination: ["想象", "幻想", "创意", "抽象", "灵感", "现实", "务实"],
  assertiveness: ["主张", "坚持", "强势", "主导", "自信", "妥协", "服从"],
  security_need: ["安全", "稳定", "谨慎", "保守", "可靠", "冒险"],
  empathy: ["共情", "温柔", "体贴", "关怀", "善解人意", "冷漠", "理性"],
  dramaticness: ["戏剧", "夸张", "热烈", "表现", "张扬", "低调", "内敛"],
  orderliness: ["秩序", "规律", "条理", "计划", "整齐", "严谨", "随性", "混乱"],
  contradiction: ["反差", "矛盾", "复杂", "多变", "两面", "一致", "简单"],
  attachment: ["亲密", "依赖", "投入", "深情", "粘人", "疏离", "独立"],
  presence: ["存在感", "气场", "焦点", "引人注目", "突出", "低调", "隐藏"],
};

function traitFactorAlignment(traits: string[], factorKey: string): number {
  const kw = FACTOR_TRAIT_KEYWORDS[factorKey] ?? [factorKey];
  let score = 0;
  for (const trait of traits) {
    for (const word of kw) {
      if (trait.includes(word) || word.includes(trait)) {
        score += 1;
      }
    }
  }
  return score;
}

/* ------------------------------------------------------------------ */
/*  Clamp overly extreme profiles                                      */
/* ------------------------------------------------------------------ */

function clampExtreme(
  vector: Record<string, number>,
): { vector: Record<string, number>; clamped: boolean } {
  const keys = Object.keys(vector);
  if (keys.length === 0) return { vector, clamped: false };

  const extremeCount = keys.filter(
    (k) => vector[k] >= 90 || vector[k] <= 10,
  ).length;
  const ratio = extremeCount / keys.length;

  if (ratio <= 0.7) return { vector, clamped: false };

  const result: Record<string, number> = {};
  for (const k of keys) {
    const v = vector[k];
    if (v >= 95) result[k] = 85;
    else if (v >= 90) result[k] = 80;
    else if (v <= 5) result[k] = 15;
    else if (v <= 10) result[k] = 20;
    else result[k] = v;
  }
  return { vector: result, clamped: true };
}

/* ------------------------------------------------------------------ */
/*  Main entry point                                                    */
/* ------------------------------------------------------------------ */

export function normalizeResultVectors(
  vectors: Record<string, Record<string, number>>,
  results: { key: string; traits: string[] }[],
  factors: { key: string; name: string }[],
): NormalizerResult {
  const changes: string[] = [];
  const resultKeys = Object.keys(vectors);
  const factorKeys = factors.map((f) => f.key);

  if (resultKeys.length < 2 || factorKeys.length === 0) {
    return { vectors, changes };
  }

  // ---- Step 1: Clamp extreme profiles ----
  const afterClamp: Record<string, Record<string, number>> = {};
  for (const rk of resultKeys) {
    const { vector, clamped } = clampExtreme(vectors[rk]);
    afterClamp[rk] = vector;
    if (clamped) {
      changes.push(`[clamp]  "${rk}"  extreme ratio > 70%, pulled toward center`);
    }
  }

  // ---- Step 2: Compute pairwise cosine similarity ----
  const SIMILARITY_SPREAD = 0.95;
  const SIMILARITY_WARN = 0.90;

  type PairInfo = { a: string; b: string; similarity: number };
  const pairs: PairInfo[] = [];

  for (let i = 0; i < resultKeys.length; i++) {
    for (let j = i + 1; j < resultKeys.length; j++) {
      const sim = cosineSimilarity(
        afterClamp[resultKeys[i]],
        afterClamp[resultKeys[j]],
      );
      pairs.push({ a: resultKeys[i], b: resultKeys[j], similarity: sim });
    }
  }
  pairs.sort((a, b) => b.similarity - a.similarity);

  // ---- Step 3: Spread too-similar pairs ----
  const spread: Record<string, Record<string, number>> = {};
  for (const rk of resultKeys) {
    spread[rk] = { ...afterClamp[rk] };
  }

  for (const pair of pairs) {
    if (pair.similarity <= SIMILARITY_SPREAD) continue;

    // Find factors where the two results are closest (candidates for spreading)
    const diffs: {
      factorKey: string;
      diff: number;
      valA: number;
      valB: number;
    }[] = [];
    for (const fk of factorKeys) {
      const va = spread[pair.a][fk] ?? 50;
      const vb = spread[pair.b][fk] ?? 50;
      diffs.push({ factorKey: fk, diff: Math.abs(va - vb), valA: va, valB: vb });
    }
    diffs.sort((a, b) => a.diff - b.diff); // closest first

    // Spread on 2-3 factors where values are closest
    const spreadCount = Math.min(3, diffs.length);
    const resultA = results.find((r) => r.key === pair.a);
    const resultB = results.find((r) => r.key === pair.b);
    const delta = pair.similarity > 0.97 ? 22 : 14;

    for (let i = 0; i < spreadCount; i++) {
      const { factorKey, valA, valB } = diffs[i];
      if (Math.abs(valA - valB) > 25) continue; // already differentiated

      const alignA =
        resultA?.traits
          ? traitFactorAlignment(resultA.traits, factorKey)
          : 0;
      const alignB =
        resultB?.traits
          ? traitFactorAlignment(resultB.traits, factorKey)
          : 0;

      let newA = valA;
      let newB = valB;

      if (alignA > alignB) {
        newA = Math.min(95, valA + delta);
        newB = Math.max(5, valB - delta);
      } else if (alignB > alignA) {
        newB = Math.min(95, valB + delta);
        newA = Math.max(5, valA - delta);
      } else {
        // Equal alignment — spread from current values
        if (valA >= valB) {
          newA = Math.min(95, valA + delta);
          newB = Math.max(5, valB - delta);
        } else {
          newB = Math.min(95, valB + delta);
          newA = Math.max(5, valA - delta);
        }
      }

      spread[pair.a][factorKey] = Math.round(newA);
      spread[pair.b][factorKey] = Math.round(newB);
    }

    changes.push(
      `[spread] "${pair.a}" vs "${pair.b}" sim=${pair.similarity.toFixed(3)} → spread on ${spreadCount} factor(s)`,
    );
  }

  // ---- Step 4: Log warning for mildly similar pairs ----
  for (const pair of pairs) {
    if (
      pair.similarity > SIMILARITY_WARN &&
      pair.similarity <= SIMILARITY_SPREAD
    ) {
      changes.push(
        `[warn]   "${pair.a}" vs "${pair.b}" sim=${pair.similarity.toFixed(3)} (mild, no action)`,
      );
    }
  }

  return { vectors: spread, changes };
}
