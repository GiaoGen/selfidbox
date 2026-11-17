# SelfIDBox 模拟用户及完整使用数据方案

日期：2026-11-02。状态：已按本方案执行批次 `sim-20261102-v1`。实际数量、通过的验收与前端水合问题见 [执行结果](./simulated-user-data-result.md)，维护方式见 [批次维护](./simulated-user-data-runbook.md)。以下保留原方案内容。

## 1. 范围与目标

- 在现有正式 Supabase 项目 `selfidbox`（`ynwyxcbbtvozqqjspzex`）新增 64 个明确标记的模拟账号及关联数据。不创建新项目、分支或测试环境。
- 目标是验证多用户数据、历史筛选、测评结果、来源卡片、画像、创作和积分展示；并发压力、邮件实际投递、第三方 OCR 和模型真实调用不由数据库造数证明。
- 不修改现有真人账号、报告、测评、积分和 Auth 审计日志；本批次互动使用本批次作者的测评。公开的模拟内容及其统计会出现在当前产品中。
- 以下数量是实施目标；当前数据库结构无法记录的行为明确列为边界，不编造新表或扩展业务能力。

## 2. 用户、邮箱及角色

| 项目 | 分配 |
| --- | --- |
| 邮箱 | QQ 30、163 22、Outlook 6、Gmail 6；域名分别为 qq.com、163.com、outlook.com、gmail.com |
| 活跃度 | 轻度 16 人各 2 次答题；普通 32 人各 5 次；重度 16 人各 15 次，共 432 次 |
| 报告用户 | 32 人：16 人仅邮件报告、8 人仅截图报告、8 人两种都有，共 40 份有效报告 |
| 创作者 | 8 人各 3 个测评，共 24 个；角色与活跃度、报告用户交叉安排 |
| 测评状态 | published 12、sandbox 4、submitted 4、draft 4 |
| AI 日志 | 8 位创作者覆盖四个生成功能，至少 32 条成功日志；加 8 条失败/重试样本，共 40 条 |

模拟邮箱仅是账号数据，不代表真实邮箱所有权。使用专用批次命名并检查冲突，不使用已知真人邮箱；不发送验证、邀请、恢复密码或报告邮件。昵称、用户名和答题偏好有差异；Auth 用户仍为普通 authenticated 用户，不授予管理员权限。账号凭据不进入提交文件、浏览器代码或输出日志。

## 3. 完整时间分布

暂定覆盖 2026-05-16 至实际执行时刻；执行日期变化时更新截止时间。按 Asia/Taipei 规划，UTC 存储，不生成未来记录。

| 月份 | 注册人数 | 答题次数 |
| --- | ---: | ---: |
| 5 月 16 日起 | 2 | 9 |
| 6 月 | 3 | 22 |
| 7 月 | 5 | 35 |
| 8 月 | 25 | 173 |
| 9 月 | 23 | 151 |
| 10 月 | 5 | 38 |
| 11 月至截止时刻 | 1 | 4 |
| 合计 | 64 | 432 |

八、九月共有 48 个注册、324 次答题，均占 75%。报告、创作、AI 和积分事件采用相同的主要活跃月份倾向，并服从依赖顺序；不强迫各类事件具有完全相同的百分比。

- 为每人建立模拟注册时间、会话日期和活跃程度，先检查每人的答题配额与月份配额能够同时满足，再生成具体事件。早期注册者可在后续月份回访。
- 创建账号后，通过精确 ID 白名单和受控 SQL 事务校准 `auth.users.created_at`、对应 `auth.identities.created_at` 和 `public.users.created_at`。Admin API 自身不提供 created_at 参数；只读检查已确认当前数据库连接具有对应列的 UPDATE 权限。
- 校准前检查 Auth 约束和触发器，核对相关确认时间等字段的先后关系；不改密码、provider、身份归属或伪造登录时间。实际执行时间与原始时间留在批次记录中。
- Auth 审计日志、实际登录会话、Storage 实际上传时间保留真实时间。模拟历史不代表这些服务在历史日期实际发生过请求。
- 作者注册 ≤ 测评创建 ≤ 发布 ≤ 发布后答题；报告和答题 ≥ 用户注册；画像快照 ≥ 被融合来源。答案与完成时间按现有数据模型一致保存，不能宣称已有逐题作答耗时。
- 先导入所有历史来源，再重建画像并设置适合该模拟快照的更新时间，防止先写晚期快照导致历史来源被增量融合逻辑跳过。

## 4. 每位用户必备数据

| 表/身份 | 数量 | 内容与约束 |
| --- | ---: | --- |
| auth.users | 1 | Admin API 正常创建；唯一 ID、邮箱、认证资料及管理员可控的模拟批次标记 |
| auth.identities | 由 Auth 创建 | 使用正常生成的邮箱身份；不把 Gmail 地址伪造成 Google OAuth 登录身份 |
| users | 1 | id 与 Auth 相同；email、username、display_name、created_at；inbox_address/inbound_email 按实际收件机制处理，没有分配则为空 |
| quiz_attempts | 2 / 5 / 15 | quiz_id、user_id、user_vector、similarity_ranking、final_result_id/key/name、created_at、included_in_profile、profile_weight、fused_into_profile |
| quiz_attempt_answers | 每次答题每题 1 条 | attempt_id、quiz_id、question_id、option_id、created_at；所有关联属于同一个测评，不缺题、不重复题 |
| user_profile | 1 | core_vector、social_vector、report_count、updated_at；由真实计分及画像融合代码计算 |
| user_credits | 1 | base_credits、bonus_credits、used_credits、base_refilled_at、updated_at；余额与流水一致 |
| credit_events | 至少初始化事件 | type、amount、reference_id、metadata、created_at；后续事件与模拟业务对应 |

画像 core_vector/social_vector 的维度结构为 value、confidence、count，覆盖现有 8 个核心维度和 8 个社交维度；没有来源证据的维度按现有函数处理，不强填随机值。

`report_count` 按当前代码表示有效报告与有效答题的来源合计。`source_report_ids`、`summary`、`selfid_profile` 逐项检查，当前重建函数没有维护全部这些字段；没有现行消费者或生成路径的字段保留合理空值，不冒充已生成的 AI 摘要。报告来源 ID 若维护，只引用有效报告，不混入答题 UUID。

## 5. 报告及图片

40 份有效报告覆盖现有邮箱与截图导入数据形态。另预留少量失败样本，具体 parse_status 必须从实际解析服务契约确认后确定，不发明状态枚举。

- 公共字段：user_id、report_type、main_result、dimensions、confidence、raw_ai_response、raw_text、parse_status、created_at。
- 标准化字段：core_vector、social_vector、extra_traits、normalized_summary、normalized_confidence、schema_version；结构和数值范围符合现有解析/展示规则。有效来源的 parse_status 为当前代码消费的 normalized。
- 邮件字段：input_type=email、to_email、from_email、subject；使用匹配的模拟内容，不实际投递。
- 截图字段：input_type=screenshot、image_url、ocr_text、ocr_confidence、image_hash；图片必须有可访问的实际文件，哈希与文件对应，文本、主结果与图片内容一致。
- 失败样本不参与成功画像融合；未实际运行 OCR/AI 的内容保留模拟来源标记。外部截图服务的对象存储位置、失败状态及原始响应结构需要执行前核对，不能仅凭当前代理接口宣称已验证。
- 不适用的字段保留 null/空集合，不能为了填满字段虚构附件、OCR 或邮件信息。

## 6. 创作与完整测评结构

24 个测评归属 8 位模拟作者，复用现有分类；采用可追溯的模拟模板或明确可复用内容，全部子记录生成新 ID，不改变原测评归属。

| 表 | 内容 |
| --- | --- |
| quizzes | creator_user_id、slug、title、hook、description、quiz_type、audience、tone、status、featured、published_at、created_at、updated_at、attempt_count、六项风格控制、cover_image_url、category_id、popularity_score、color |
| quiz_factors | quiz_id、key、name、description、sort_order、created_at |
| quiz_results | quiz_id、key、name、subtitle、description、traits、result_vector、share_text、sort_order、image_url、color、created_at |
| quiz_questions | quiz_id、question_order、text、description、created_at |
| quiz_options | question_id、quiz_id、option_order、label、text、factor_effects、created_at |

每个可作答测评有完整因子、结果、题目及选项；向量和 option.factor_effects 使用对应因子 key。使用当前页面实际调用的计分路径计算用户向量、排名及结果，不任意填写结果 ID。题目数随内容变化，答案总数按 432 次答题对应题目数精确计算，不预报虚假固定总数。

状态采用当前状态接口支持的 draft/sandbox/submitted/published。现有部分答题代码仍检查 submitting，与 submitted 存在差异；本批次仅安排 published 和 sandbox 答题，不利用或顺手修复该差异。sandbox 总尝试次数不得超过现有 20 次限制。

attempt_count 与本批次实际记录一致，热度按现有公式计算。结果图使用现有 quiz-result-images 上传机制；有图样本使用真实可访问文件，无图样本留空。封面、颜色、长短文案均覆盖常规展示组合。

## 7. 积分与 AI

- 基础积分事件：base_monthly。按当前规则离线按历史事件顺序演算：符合补充条件时将可用积分补至 20；不能每月无条件累加 20。现有 RPC 使用 now()，不能简单重复调用来冒充历史月份。
- 他人完成奖励：quiz_completed，按 quizId::userId 及现有去重规则发放；重复答题不重复奖励，自测不奖励。
- 首次审核奖励：quiz_approved，按现有规则每测评 +5 且去重。
- AI 消耗：ai_generate，每次进入扣费环节的请求 -1。失败是否扣费依实际路由的失败阶段确定，不能以日志 success=false 一概推断不扣费。
- guest_signup：当前仓库未查到完整触发路径。列为待核实能力，只有明确转化证据、规则和关联后才生成，不为覆盖 enum 随意写入。
- 可用积分 = base_credits + bonus_credits - used_credits；事件、余额和时间互相对应，不能出现无依据奖励、负可用余额或重复去重键。

40 条模拟 AI 日志覆盖 quiz_generate_results、quiz_generate_factors、quiz_generate_result_vectors、quiz_generate_questions。字段包括 user_id、feature、model、prompt_tokens、completion_tokens、total_tokens、estimated_cost、success、error_message、metadata、created_at。metadata 显式记录模拟标记和批次；tokens 关系及估算费用依当前模型计价规则一致；未调用模型，不代表真实账单。当前 AI Usage 页面若不排除模拟标记，统计会混入这些样本，应在批次验收结果中明确披露，不擅自改页面。

## 8. 所有业务表的覆盖边界

以上覆盖 users、user_profile、reports、quizzes、quiz_factors、quiz_results、quiz_questions、quiz_options、quiz_attempts、quiz_attempt_answers、user_credits、credit_events、ai_usage_logs，共 13 表；其余 5 表如下，public 合计 18 张表。

- test_categories：共享分类，复用并验证外键，不按用户复制。
- test_sites：共享站外目录，复用。若测试站外热度，使用明确的模拟目录样本，避免改真实目录统计。
- test_site_clicks：无 user_id，当前点击接口只更新 test_sites 的计数/热度，不插入此表。可规划全站点击样本并在批次清单记录模拟行为人，但不能宣称数据库或页面已具备逐用户点击历史。默认不补这类非必要样本。
- ai_prompts 与 ai_prompt_versions：两张共享配置表，保持原数据与版本不变，不随用户复制。

不生成不存在的浏览、收藏、分享、下载、通知、支付或逐题耗时表；不伪造 Supabase Auth 会话、审计日志和 OAuth 授权。完整指现有功能对应的数据形态与关联覆盖，不等于全部可空字段都有非空值。

## 9. 实施顺序（后续获准执行时）

1. 只读预检：重新确认 project ref、表结构、约束、触发器、现有用户归属、收件和截图服务契约、Storage 及计分入口。此前 Auth 12/public.users 13 的差异只核对，不自动清理。
2. 纯本地预览：固定随机种子，生成 64 人分配清单、全部 ID、模拟事件时间线、文件清单、预计各表数量及校验报告；显示实际将访问的 project ref。
3. 先建同一项目中的 2 个模拟账号，验证 Auth 时间校准、登录及权限；这些账号计入最终 64 人，不额外累加。验证失败则停止扩展，报告实际阻塞。
4. 正常创建余下 Auth 账号；记录 API 返回 ID；事务校准本批次历史身份/用户时间。Auth API 调用、文件上传与 SQL 无法共用一个全局事务，逐阶段记录检查点和补偿动作。
5. 上传需要的图片，写入本批次测评及子表、报告、答题和答案；按业务关联演算积分，并写入明确标记的模拟 AI 日志。每阶段可重跑且不重复创建。
6. 从所有有效来源重建用户画像，校准模拟快照时间；核对所有聚合值和普通用户权限。
7. 输出验收清单：目标/实际数量、时间与邮箱分布、关联与数值校验、公开可见影响、尚未覆盖的真实外部服务行为，以及逐 ID 清理清单。

批次清单为唯一追溯入口：逻辑用户编号、批次、实际创建时间、模拟注册时间、邮箱、角色、所有记录 ID、文件对象路径、原始 Auth 时间及阶段状态。带 metadata 的表同时写模拟标记，没有 metadata 的表通过清单和关联追溯；不为标记新增表字段。管理凭据仅在服务端或本地执行进程使用。

## 10. 验收与清理

- 数量：64 个新账号及对应业务用户、64 份画像/积分账户；432 次完整答题、40 份有效报告、24 个测评及完整子表、40 条模拟 AI 日志；答案/因子/题目/结果/选项/积分流水按预览清单验收。
- 分布：四类邮箱准确；注册人数及答题月份配额准确；八、九月占比符合计划；无未来时间、注册前活动、发布前公开答题或缺失依赖。
- 数据形态：UUID/报告 bigint ID、整数、numeric、boolean、文本、timestamptz、JSON 对象、JSON 数组和 bigint[] 均符合实际字段；JSON 结构、维度、数值范围、置信度及 ID 类型按现有代码检查。
- 一致性：答案能复算结果，结果属于对应测评，画像能从来源重建；融合标记正确，积分余额和去重事件正确，文件可访问且匹配记录。
- 页面：抽样轻度、普通、重度、报告用户及创作者，查看个人页、来源详情、结果卡、我的测评、积分和管理用量页面；普通登录验证用户不能访问其他用户的私有数据，不能仅以 service_role 查询成功代替权限验证。
- 清理只处理精确批次 ID：答案/答题、报告/画像、积分事件/账户、AI 日志、测评子表/测评及独占文件，再处理 public.users/Auth 用户；清理前读取当前外键，不能仅依赖 Auth 删除级联。AI 日志无用户外键，必须显式处理。
- 若模拟公开测评后来已有真人答题、引用或共享文件，清理前列出冲突，不级联删除真人记录；保留依赖或先取消公开，单独决定后续处理。

实施成功须以真实执行及验收结果为准；当前批次的执行记录以本文开头链接的执行结果为准。数据库造数不代表外部 OCR 或模型真实调用已经验证。
