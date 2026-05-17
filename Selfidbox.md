SelfIDBox 项目说明（Current Architecture & Product Spec）

项目名称

SelfIDBox

---

一、项目定位

SelfIDBox 是一个：


«AI 驱动的人格/测试内容平台»
同时也是人格测试聚合网站
聚合各种人格/性格/心理/娱乐测试
分类导航
SEO 获取自然流量
用户跳转至第三方网站完成测试

当前包含两条核心方向：

1. 人格报告聚合与 AI 分析系统（邮箱系统）
2. UGC AI 测试生成平台（用户创建测试）

两条路线会同时存在，并最终融合。

---

二、核心产品结构

路线 A：人格报告聚合（Personality Inbox）

核心理念

用户在各种第三方测评网站（MBTI、大五人格、动物人格、职业测试等）完成测试后：

- 将报告发送到自己的专属人格邮箱
- 系统自动解析邮件
- AI 提取测评结果
- 形成长期人格档案

---

用户流程

用户：

第三方测试网站
↓
填写：
u_xxxxxx@selfidbox.com
↓
第三方发送报告邮件
↓
Cloudflare Email Worker 接收
↓
AI 解析结构化
↓
保存 Supabase
↓
人格档案生成

---

当前已完成技术

域名

selfidbox.com

---

Cloudflare Email Routing

已实现：

*@selfidbox.com

Catch-all 邮件系统。

---

Cloudflare Email Worker

已实现：

- 接收邮件
- 获取：
  - from
  - to
  - subject
  - raw email

---

DeepSeek API

已实现：

邮件内容 → AI 结构化解析。

例如：

{
  "main_result": "INFJ-A",
  "dimensions": {
    "I": 72,
    "N": 74,
    "F": 64,
    "J": 81
  }
}

---

Supabase

已接通：

- PostgreSQL
- reports 表
- Worker 可写入数据库

---

三、人格数据模型（非常重要）

不同测评格式不同。

不能强制统一。

因此使用：

通用人格报告抽象模型

核心字段

是什么测评？
最终结果是什么？
是否存在量化维度？
解释文本是什么？
标签是什么？

---

reports 表（推荐结构）

reports
- id
- created_at

- to_email
- from_email
- subject

- source_name
- source_url

- report_type
- result_label
- result_category

- main_result

- dimensions jsonb

- interpretation text

- tags jsonb

- raw_text
- raw_ai_response jsonb

- confidence
- parse_status

---

四、人格数据设计原则

可量化数据

存入：

dimensions

例如：

{
  "I": 72,
  "N": 74
}

---

不可量化结果

例如：

- 动物人格
- 食物人格
- 乐器人格

存入：

main_result

例如：

猫头鹰
草莓奶昔
电吉他

---

标签系统

AI 自动生成：

[
  "理性",
  "敏感",
  "独立",
  "浪漫"
]

用于：

- 搜索
- 聚合
- 推荐
- AI 总结

---

五、路线 B：UGC AI 测试平台

核心理念

用户可以：

- 创建自己的测试
- 分享测试
- 传播结果

本质上是：

«AI Native UGC Quiz Platform»

---

六、UGC 平台目标

不是：

严肃心理学

而是：

好玩
社交传播
低成本自我表达

例如：

- 测测你像哪种水果
- 测测你的聊天像哪种动物
- 测测你是哪种乐器人格

---

七、UGC 平台核心逻辑

AI 自动生成测试

用户输入：

帮我做一个：
测测你像哪种乐器

AI 自动生成：

- 标题
- 描述
- 问题
- 选项
- 结果
- 结果文案

---

八、UGC 数据库结构

quizzes

quizzes
- id
- title
- description
- theme
- creator_email
- status
- created_at

---

quiz_questions

quiz_questions
- id
- quiz_id
- question_order
- question_text
- options jsonb

---

quiz_results

quiz_results
- id
- quiz_id
- result_key
- title
- description
- tags jsonb

---

九、UGC 平台核心目标

形成：

用户创建
↓
用户分享
↓
用户传播
↓
更多用户创建

循环。

---

十、整体项目定位（最终）

SelfIDBox 不是：

普通 MBTI 网站

而是：

«AI 驱动的人格表达与测试内容平台»

包含：

- 人格报告聚合
- AI 人格分析
- UGC 测试创建
- 社交传播
- 人格标签系统

---

十一、当前技术栈

域名

selfidbox.com

---

DNS / 邮件

Cloudflare

---

Email Processing

Cloudflare Email Workers

---

AI

DeepSeek API

---

Database

Supabase PostgreSQL

---

后续前端

推荐：

Next.js

---

十二、当前产品阶段

当前处于：

MVP / PMF 验证阶段

目标：

验证：

用户是否愿意：
- 导入人格报告
- 创建测试
- 分享测试
- 为 AI 结果付费

---

十三、重要产品判断

人格档案系统

优点：

- 深度
- AI 价值高

缺点：

- 低频
- 用户未必长期维护

---

UGC 测试平台

优点：

- 高传播
- 用户生成内容
- 更容易增长

缺点：

- 更像内容平台
- 需要传播机制

---

十四、最终战略

当前决定：

«邮箱人格聚合 + UGC AI 测试平台 双路线并行»

其中：

邮箱系统

作为：

人格数据入口

---

UGC 系统

作为：

增长与传播引擎

---

十五、核心价值（最终）

SelfIDBox 真正的价值不是：

- 邮箱
- AI API
- 数据库

而是：

«“人格表达与传播”»