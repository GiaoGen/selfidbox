-- Seed default AI prompt templates
-- Run after migration: supabase/migrations/add_ai_prompts.sql

-- quiz_results: generate personality result types for a quiz
insert into ai_prompts (key, name, description, prompt)
values (
  'quiz_results',
  'Quiz - Generate Results',
  'Generate distinct personality result types for a quiz based on title, audience, style controls, and pinned results.',
  $$设计一个人格测试的结果类型。

测试标题：{{title}}
测试副标题：{{hook}}
测试类型：{{quiz_type}}
目标受众：{{audience}}
语气风格：{{tone}}
结果数量：{{result_count}} 个
{{style_controls}}
{{pinned_results}}
请生成 {{result_count}} 个有明显区分度的人格结果。{{pinned_results_note}}每个结果的 key 使用英文 snake_case。请严格按照风格控制参数调整生成内容的抽象度、严肃度、深度和文艺度。$$
)
on conflict (key) do nothing;

-- quiz_factors: select dimensional factors from the predefined catalog
insert into ai_prompts (key, name, description, prompt)
values (
  'quiz_factors',
  'Quiz - Generate Factors',
  'Select dimensional factors from the Selfid factor catalog that best differentiate the given results.',
  $$从以下因子库中选择适合这个测试的因子维度。

测试标题：{{title}}
测试副标题：{{hook}}
测试类型：{{quiz_type}}
目标受众：{{audience}}
语气风格：{{tone}}
因子数量：{{factor_count}} 个

已有的结果人格：
{{results_summary}}
{{pinned_factors}}

可用因子库（只能从中选择，绝对不能自己创造 key）：
{{factor_catalog}}

请从以上因子库中选择 {{factor_count}} 个能够有效区分这些结果人格的因子维度。{{pinned_factors_note}}每个因子必须能够产生足够的区分度——不能让所有结果在同一因子上看起来一样。返回的 key 必须与因子库中完全一致。$$
)
on conflict (key) do nothing;

-- quiz_questions: generate multiple-choice questions with factor effects
insert into ai_prompts (key, name, description, prompt)
values (
  'quiz_questions',
  'Quiz - Generate Questions',
  'Generate scenario-based multiple-choice questions with factor effect deltas for vector-space quiz engine.',
  $$设计新一轮题目。这些题目用于一个基于因子向量计算的个性测试。

测试标题：{{title}}
测试副标题：{{hook}}
测试类型：{{quiz_type}}
目标受众：{{audience}}
语气风格：{{tone}}
{{style_controls}}

当前结果人格（每个都配有在各因子上的参考值，不要直接用在题目里，只需要用它们了解不同的"方向"）：

结果人格：
{{results_summary}}

因子列表：
{{factors_summary}}

上述结果人格对应的参考因子向量：
{{result_vectors_summary}}
{{pinned_questions}}

请生成 {{question_count}} 道选择题，每题 {{options_per_question}} 个选项。要求：
- 每个 option 影响 1-3 个因子
- factor_effects 值为 -3 到 +3 之间的整数
- 所有 {{factor_count}} 个因子在整个题目集中都要有涉及
- 题目要场景化、有画面感、容易选、适合分享
- 严格按照风格控制参数调整题目的抽象度、严肃度、深度和选项的文艺度{{pinned_questions_note}}$$
)
on conflict (key) do nothing;

-- quiz_result_vectors: assign factor values to result personality types
insert into ai_prompts (key, name, description, prompt)
values (
  'quiz_result_vectors',
  'Quiz - Generate Result Vectors',
  'Assign 0-100 factor values to each result personality type, with core traits high (80-95), opposite traits low (10-30), neutral (40-60).',
  $$为测试的人格结果分配向量值。

测试标题：{{title}}
测试副标题：{{hook}}
测试类型：{{quiz_type}}
目标受众：{{audience}}
语气风格：{{tone}}

待生成向量的结果人格：
{{results_summary}}

因子维度：
{{factors_summary}}
{{pinned_vectors}}

请为以上每个结果在每个因子上分配 0-100 的值。记住：
- 核心匹配的特征高到 80-95
- 明显不符合的特征低到 10-30
- 中性特征 40-60
- 不同结果之间要有明显区分度$$
)
on conflict (key) do nothing;

-- ocr_normalize: normalize OCR-extracted text fields
insert into ai_prompts (key, name, description, prompt)
values (
  'ocr_normalize',
  'OCR - Normalize',
  'Normalize and clean OCR-extracted text fields from screenshots.',
  $$You are an OCR text normalizer. Your task is to clean and normalize text extracted from screenshots.

Rules:
- Output ONLY valid JSON. No markdown, no code fences, no explanation.
- Fix obvious OCR errors (e.g., common character misrecognitions).
- Remove noise artifacts (random symbols, partial text fragments).
- Preserve the original language and meaning.
- Do not add, remove, or change substantive content — only fix OCR artifacts.

Input text:
{{raw_text}}

Output format:
{
  "normalized_text": "...",
  "confidence": 0.0-1.0,
  "changes_made": ["list of changes"]
}$$
)
on conflict (key) do nothing;
