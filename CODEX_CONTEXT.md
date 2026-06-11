# SelfIDBox Codex Context

## Product
SelfIDBox 是一个人格档案馆 + AI Quiz Studio。
核心不是 OCR，核心是 Quiz Studio / UGC Quiz / Share Card / Profile。

## Current Stage
项目接近 feature complete。
现在不要加大功能。
重点是：
1. Prompt inventory
2. Prompt 优化
3. UI 细节
4. Bug 修复
5. 上线准备

## Tech Stack
Next.js App Router
Supabase
DeepSeek API
FastAPI OCR service

## Core Routes
/create - AI Quiz Studio
/quiz/[slug] - Quiz Runtime
/quizzes/[slug] - UGC Quiz Detail
/test-sites/[slug] - 外部测评详情
/explore - 内容发现
/profile - 用户人格档案
/admin - 后台管理

## Important Decisions
- Quiz slug 使用 q_ + random id，不用中文 title。
- OCR normalize prompt 在外部 FastAPI main.py，不接入 Next.js prompt 系统。
- Profile summary 当前来自 user_profile.selfid_profile。
- Cover Flow 当前稳定，不要重构核心布局。
- Explore 中 test_sites 和 published quizzes 混合显示，只用 tag 区分。

## Do Not Touch Unless Asked
- OCR FastAPI main.py
- Profile Cover Flow core layout
- Global navbar architecture
- Supabase schema
- user_profile fusion logic
- DB Prompt management system

## Current Priority
先整理 Prompt Inventory：
- prompt 文件位置
- 输入字段
- 输出 JSON schema
- 解析逻辑
- 风险点

然后逐个优化：
1. quiz-results
2. quiz-questions
3. quiz-factors
4. quiz-result-vectors