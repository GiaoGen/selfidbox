# Prompt Inventory — SelfIDBox

> 分析日期：2026-06-10
> 状态：不修改代码、只做分析

---

## 概览

| Prompt | 文件 | AI 调用 | 状态 |
|---|---|---|---|
| quiz-results | lib/prompts/quiz-results.ts | ✅ DeepSeek | 活跃 |
| quiz-factors | lib/prompts/quiz-factors.ts | ✅ DeepSeek | 活跃 |
| quiz-questions | lib/prompts/quiz-questions.ts | ✅ DeepSeek | 活跃 |
| quiz-result-vectors | lib/prompts/quiz-result-vectors.ts | ✅ DeepSeek | 活跃 |
| profile-summary | lib/prompts/profile-summary.ts | ❌ | 模板计算，非 AI |
| ocr-normalize | 外部 FastAPI main.py | ❓ | 不在本仓库内 |

---

## 通用基础架构

### API 调用参数

| 参数 | quiz-results | quiz-factors | quiz-questions | quiz-result-vectors |
|---|---|---|---|---|
| Model | deepseek-chat | deepseek-chat | deepseek-chat | deepseek-chat |
| Temperature | 0.85 | 0.8 | 0.85 | 0.7 |
| Max Tokens | 4096 | 3072 | 4096 | 4096 |
| URL | pi.deepseek.com/v1/chat/completions | 同 | 同 | 同 |

### Token 追踪

- **文件**：lib/ai/track-ai-usage.ts、lib/ai/model-pricing.ts
- **机制**：fire-and-forget 写入 i_usage_logs 表
- **定价**：deepseek-chat input $" + @'$' + @"0.14/M、output $" + @'$' + @"0.28/M

### Markdown 剥离（所有 route 共用）

`
if starts with ` → 去掉第一行
if ends with ` → 去掉最后 3 字符
`

**局限**：不处理  `json （language identifier）、不处理中间有其他内容的情况。

---

## 1. quiz-results

### 文件位置

- **Prompt 文件**：lib/prompts/quiz-results.ts
- **调用路由**：pp/api/quiz-ai/generate-results/route.ts
- **System Prompt 常量**：QUIZ_RESULTS_SYSTEM
- **构建函数**：uildQuizResultsPrompt()

### 功能

生成测评的人格结果类型（results）。用户设定测评标题后，AI 自动产生 N 个互不重叠的人格结果，包含名称、副标题、描述、特质、分享文案。

### 输入字段

| 字段 | 类型 | 必需 | 说明 |
|---|---|---|---|
| 	itle | string | ✅ | 测评标题 |
| hook | string | ❌ | 测评副标题 |
| quiz_type | string | ❌ | 测评类型，默认 "personality" |
| udienceStr | string（拼合） | ❌ | 目标受众，默认 "一般大众" |
| 	oneStr | string（拼合） | ❌ | 语气风格，默认 "中性" |
| esult_count | 
umber | ✅ | 结果数量，范围 1-16 |
| bstractness | 
umber | ❌ | 抽象度 0-100，默认 50 |
| seriousness | 
umber | ❌ | 严肃度 0-100，默认 50 |
| depth | 
umber | ❌ | 深度 0-100，默认 50 |
| poeticness | 
umber | ❌ | 文艺度 0-100，默认 50 |
| pinned_results | {key, name, traits}[] | ❌ | 用户已固定的结果（不可重复） |

### 输出 JSON Schema

`json
{
  "results": [
    {
      "key": "old_piano",
      "name": "旧钢琴",
      "subtitle": "安静但情绪很深",
      "description": "你像一架旧钢琴，表面安静，但内在有很深的情绪和记忆。",
      "traits": ["敏感", "克制", "内省"],
      "share_text": "我是旧钢琴人格，你是什么？"
    }
  ]
}
`

### 解析位置

- **文件**：pp/api/quiz-ai/generate-results/route.ts
- **Markdown 剥离**：基础 code fence 移除
- **JSON 解析**：JSON.parse()
- **校验项**：
  - esults 是数组 ✅
  - 每个元素是 object ✅
  - key 是 string ✅
  - 
ame 是 string ✅
  - 	raits 是 array ✅
- **校验缺失**：
  - 不校验 subtitle、description、share_text 是否存在
  - 不校验 	raits 数量（prompt 要求 3-5，但无代码强制）
  - 不校验生成的数量是否匹配 esult_count

### 风险点

1. **输出字段不完整**：subtitle、description、share_text 不被校验，AI 可能漏掉
2. **prompt 输出格式中不含 color 字段**：CODEX_CONTEXT.md 的示例里有 "color": "..."，但 prompt 的 Output format 没有对应字段 — prompt 与预期不一致
3. **未使用 esponse_format: { type: "json_object" }**：仅靠 prompt 文字约束 JSON 输出，AI 可能输出 Markdown
4. **code fence 剥离粗糙**：只处理以  `  开头且以  `  结尾的情况， `json  可能残留
5. **无重试逻辑**：JSON 解析失败直接报错 502
6. **result_count 与实际生成长度不一致无人校验**

---

## 2. quiz-factors

### 文件位置

- **Prompt 文件**：lib/prompts/quiz-factors.ts
- **调用路由**：pp/api/quiz-ai/generate-factors/route.ts
- **System Prompt 常量**：QUIZ_FACTORS_SYSTEM
- **构建函数**：uildQuizFactorsPrompt()

### 功能

从预定义的 SelfID 因子目录中选取适合该测评的维度因子。AI **不允许**自己发明 key，只能从给定的目录中选择。

### 输入字段

| 字段 | 类型 | 必需 | 说明 |
|---|---|---|---|
| 	itle | string | ✅ | 测评标题 |
| hook | string | ❌ | 测评副标题 |
| quiz_type | string | ❌ | 测评类型 |
| udienceStr | string（拼合） | ❌ | 目标受众 |
| 	oneStr | string（拼合） | ❌ | 语气风格 |
| esults | {key, name, description, traits}[] | ✅ | 已有的结果列表（≥1 个） |
| count | 
umber | ❌ | 因子数量，默认 5，范围 1-16 |
| pinned_factors | {key, name}[] | ❌ | 已固定的因子 |

### 因子目录

来自 lib/selfid-factors.ts 的 16 个因子：

**核心（Core，8 个）**：social、sensitivity、ationality、curiosity、independence、expressiveness、drive、imagination

**社交（Social，8 个）**：ssertiveness、security_need、empathy、dramaticness、orderliness、contradiction、ttachment、presence

### 输出 JSON Schema

`json
{
  "factors": [
    {
      "key": "sensitivity",
      "name": "敏感度",
      "description": "衡量用户对情绪、环境和细节变化的感知强度"
    }
  ]
}
`

### 解析位置

- **文件**：pp/api/quiz-ai/generate-factors/route.ts
- **校验项**：
  - actors 是数组 ✅
  - key 必须在 SELFID_FACTOR_KEYS 白名单中 ✅
  - key 不允许重复 ✅
  - 
ame 是 string ✅
- **校验缺失**：
  - 不校验 description 是否存在

### 风险点

1. **校验最严格**（白名单 + 去重），安全度相对较高
2. **与 quiz-questions 的因子校验不同步**：factors route 校验 SELFID_FACTOR_KEYS（16 个全部），但 questions route 只校验前端传入的 actorKeys 子集 — 如果前端传错了 factor 到 questions，可能两边用的 key 集合不一致
3. **name/description 可能与目录中的不一致**：AI 可以返回"相似但不完全一样"的中文名
4. **未使用 esponse_format: { type: "json_object" }**

---

## 3. quiz-questions

### 文件位置

- **Prompt 文件**：lib/prompts/quiz-questions.ts
- **调用路由**：pp/api/quiz-ai/generate-questions/route.ts
- **System Prompt 常量**：QUIZ_QUESTIONS_SYSTEM
- **构建函数**：uildQuizQuestionsPrompt()

### 功能

生成测评题目，每道选择题的每个选项都带有 actor_effects（-3 到 +3 的整数偏移），用于向量空间计算用户人格位置。

### 输入字段

| 字段 | 类型 | 必需 | 说明 |
|---|---|---|---|
| 	itle | string | ✅ | 测评标题 |
| hook | string | ❌ | 副标题 |
| quiz_type | string | ❌ | 类型 |
| udienceStr | string（拼合） | ❌ | 受众 |
| 	oneStr | string（拼合） | ❌ | 语气 |
| bstractness | 
umber | ❌ | 0-100，默认 50 |
| seriousness | 
umber | ❌ | 0-100，默认 50 |
| depth | 
umber | ❌ | 0-100，默认 50 |
| poeticness | 
umber | ❌ | 0-100，默认 50 |
| esults | {key, name, description, traits}[] | ✅ | ≥2 个 |
| actors | {key, name, description?}[] | ✅ | ≥2 个 |
| esult_vectors | Record<string, Record<string, number>> | ❌ | 参考向量 |
| question_count | 
umber | ❌ | 默认 8，范围 1-20 |
| options_per_question | 
umber | ❌ | 默认 4，范围 2-6 |
| pinned_questions | {text}[] | ❌ | 已固定的题目 |

### 输出 JSON Schema

`json
{
  "questions": [
    {
      "text": "你更喜欢哪种夜晚？",
      "description": "",
      "options": [
        {
          "label": "A",
          "text": "一个人听雨写东西",
          "factor_effects": {
            "sensitivity": 2,
            "imagination": 2,
            "expressiveness": -1
          }
        }
      ]
    }
  ]
}
`

### 解析位置

- **文件**：pp/api/quiz-ai/generate-questions/route.ts
- **校验项**（最严格）：
  - questions 是数组 ✅
  - 每个 question 的 	ext 是 string ✅
  - 每个 question 的 options 是数组 ✅
  - 每个 option 的 label 是 string ✅
  - 每个 option 的 	ext 是 string ✅
  - 每个 option 的 actor_effects 是 object ✅
  - actor_effects 的 key 必须在当前 actorKeySet 中 ✅
  - 每个 effect 值必须是 -3 到 +3 的整数 ✅
  - 每个 option 至少有 1 个 effect，最多 3 个 ✅
- **校验缺失**：
  - 不验证 coverage rule（所有因子至少被覆盖一次）— 仅靠 prompt 约束

### 风险点

1. **factorKeySet 来自前端传入**：如果前端传的 actors 与 quiz-factors 生成的不一致，可能导致 AI 使用不存在的 key → 被代码正确拦截为错误
2. **pinned_questions 去重**：仅靠 prompt 约束语义去重，无代码级校验
3. **effect 数量限制 1-3**：prompt 和代码一致，但若 factor 数量少（例如只有 2 个），可能不够分散
4. **description 字段**：schema 里有但实际无人使用
5. **未使用 esponse_format: { type: "json_object" }**

---

## 4. quiz-result-vectors

### 文件位置

- **Prompt 文件**：lib/prompts/quiz-result-vectors.ts
- **调用路由**：pp/api/quiz-ai/generate-result-vectors/route.ts
- **System Prompt 常量**：QUIZ_RESULT_VECTORS_SYSTEM
- **构建函数**：uildQuizResultVectorsPrompt()

### 功能

为每个结果人格在每个因子上分配 0-100 的向量值，用于后续的 Euclidean distance 计算匹配用户。

### 输入字段

| 字段 | 类型 | 必需 | 说明 |
|---|---|---|---|
| 	itle | string | ✅ | 测评标题 |
| hook | string | ❌ | 副标题 |
| quiz_type | string | ❌ | 类型 |
| udienceStr | string（拼合） | ❌ | 受众 |
| 	oneStr | string（拼合） | ❌ | 语气 |
| esults | {key, name, description, traits}[] | ✅ | ≥1 个 |
| actors | {key, name, description?}[] | ✅ | ≥2 个 |
| pinned_vectors | {key, name, values}[] | ❌ | 已固定的向量 |

### 输出 JSON Schema

`json
{
  "result_vectors": {
    "old_piano": {
      "sensitivity": 90,
      "independence": 25
    }
  }
}
`

### 解析位置

- **文件**：pp/api/quiz-ai/generate-result-vectors/route.ts
- **校验项**：
  - esult_vectors 是 object ✅
  - 每个 result key 都存在 ✅
  - 每个 result 的每个 factor key 都存在 ✅
  - 每个值必须是 0-100 的数字 ✅
- **校验缺失**：
  - 不验证整数（prompt 强调整数，代码只检查 	ypeof v !== "number"，允许浮点数透传）
  - 不验证是否真的"高 80-95 / 低 10-30 / 中 40-60"

### 风险点

1. **浮点数透传**：prompt 强调整数，但代码只校验 	ypeof v !== "number"，85.7 会被接受。这可能影响后续向量计算（Euclidean distance 对浮点数 OK，但语义上不应有小数）
2. **温度最低（0.7）**：相比其他 prompt（0.8/0.85），相对更稳定
3. **未使用 esponse_format: { type: "json_object" }**

---

## 5. ocr-normalize

### 位置

- **不在本仓库内**
- OCR 服务由外部 FastAPI 提供，Prompt 定义在其 main.py 中
- Next.js 端仅有代理路由 pp/api/screenshot-report/route.ts，负责表单转发

### 代理逻辑

pp/api/screenshot-report/route.ts：
1. 接收 multipart/form-data（含 ile）
2. 转发到 OCR_API_BASE_URL/screenshot-report
3. 检查返回的 parse_status === "normalized" 或 is_assessment_report === true
4. 满足条件则调用 ebuildUserProfile(userId) 重建人格档案

### 风险点

1. **Prompt 在外部**：不在 Next.js prompt 管理系统中，无法通过统一的 Prompt Inventory 追踪
2. **输出格式依赖外部约定**：core_vector / social_vector 的 JSON 结构由外部决定，与 ebuildUserProfile 的 parseReportDim 解析逻辑松耦合
3. **parseReportDim 兼容性好**：同时支持 {value, confidence} 和 OCR norm 格式 {value, confidence, source, evidence}

---

## 6. profile-summary（非 AI）

### 位置

- **文件**：lib/prompts/profile-summary.ts

### 说明

**不是 AI Prompt。** 这是一个纯模板计算函数，输入 core_vector 和 social_vector（Record<string, DimOut>），输出 { selfid_profile, summary }。

- selfid_profile：取偏离 50 最大的前 4 个维度，加"高"/"低"前缀拼接，如 "高社交性 · 低独立性 · 高敏感度 · 低理性度"
- summary：按 core / social 分组取 top 3，用模板拼接，如 "核心人格为【社交性】偏高（72）·【敏感度】偏高（68）·【理性度】偏低（31）；社会表达为..."

---

## 共享风险总结

1. **未使用 esponse_format: { type: "json_object" }** — DeepSeek API 支持此参数，可强制 JSON 输出，减少 Markdown/文本噪音
2. **无重试机制** — JSON 解析失败直接返回 502
3. **Prompt 与代码校验不完全对齐** — 例如 quiz-results prompt 示例要求 5 个字段，代码只校验 3 个
4. **result_count / factor_count 不一致** — results 上限 16，factors 上限 16，但实际编码中从不交叉校验
5. **OCR prompt 外部化** — 无法统一管理
6. **profile-summary 是模板而非 AI** — 文件名在 lib/prompts/ 下有误导性（已确认非 AI，无需改造）
7. **所有 4 个 route 结构高度重复** — Markdown 剥离、JSON 解析、错误处理逻辑几乎一模一样，但暂不重构
