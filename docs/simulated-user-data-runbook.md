# 模拟数据批次维护

当前批次：`sim-20261102-v1`。唯一允许的 Supabase project ref：`ynwyxcbbtvozqqjspzex`。

## 当前修订

`natural-profiles-v1` 已按用户追加要求完成。当前字段和数量以 [执行结果](./simulated-user-data-result.md) 开头的修订记录为准；原 preview/prepared-plan 保留为初始历史清单，不覆盖。

`node scripts/revise-seeded-data.cjs verify` 校验当前修订。该脚本的 prepare 仅远端读取并保存备份；dry-run-sql/sql 分别生成回滚预演/正式提交的单事务 SQL，已提交事务带 revision 防重放校验。旧 import/verify 和旧网站脚本对应初始批次，不能作为当前修订的验收入口；更新后的邮箱凭据已同步至本地 credentials.json。

旧 cleanup-review.sql 未包含原有测评新增计数和原作者奖励的恢复步骤，不能直接作为本次修订的完整清理操作；后续清理需要结合 revision-before/plan 恢复本次增量，并保留其他用户的新记录。

## 文件与凭据

- 运行入口：`scripts/seed-simulated-users.cjs`；线上只读页面验收：`scripts/verify-simulated-pages.cjs`。
- 本地 `.seed-data/sim-20261102-v1/` 保存固定预览、准备后的精确写入数据、原数据校验摘要、Auth 创建进度、图片清单、报告 ID、画像进度和验收结果。
- `credentials.json` 包含本批次账号的随机密码，已通过 `.gitignore` 排除。只在受控本地使用，不提交、截图或粘贴到日志。
- 使用现有 `.env.local` 的项目 URL、服务端 service_role key 和公开 key。脚本检查目标项目，不改环境配置、数据库结构或 RLS。
- 使用已安装的 Node、Supabase SDK、TypeScript、sharp 和 Playwright；浏览器验收优先使用本机 Edge/Chrome，不安装额外浏览器。

## 执行阶段

```text
node scripts/seed-simulated-users.cjs preview
node scripts/seed-simulated-users.cjs preflight
node scripts/seed-simulated-users.cjs auth 2
node scripts/seed-simulated-users.cjs auth-sql 2
node scripts/seed-simulated-users.cjs login 2
node scripts/seed-simulated-users.cjs auth 64
node scripts/seed-simulated-users.cjs auth-sql 64
node scripts/seed-simulated-users.cjs import
node scripts/seed-simulated-users.cjs verify
node scripts/verify-simulated-pages.cjs
```

`auth-sql` 只输出 SQL，必须在指定项目的数据库管理连接中执行；Node SDK 没有设置 Auth created_at 的参数。SQL 使用批次标记、精确 ID 白名单及事务校准模拟注册时间。实际 Auth 审计日志和登录时间不回填。

`preview` 默认读取已保存计划，首次预览固定时间截止点。预检前可使用 `preview --refresh`；预检/创建账号后不能替换执行计划。`import` 重跑会检查已有数据是否匹配；发现不一致时停止，不覆盖后续用户操作。重建画像后，旧的重复测评答题也标记为已处理，防止被增量函数再次融合。

`verify` 校验本批次所有写入值、图片哈希、画像来源计数、增量融合无新增来源，以及原有 public 记录和 Auth 核心资料的校验摘要。登录及跨用户私有数据读取按用户类型抽样；`login 64` 可额外逐一验证全部账号，正常批次验收无需重复全部登录。

页面脚本在 `https://selfidbox.com` 检查探索页、测评详情/答题入口，以及重度、普通、轻度、报告用户和创作者的画像与来源 API，拒绝跨用户来源详情读取；不提交额外答题或发起模型请求。截图和结果保存在本地批次目录。

本批次数据验收已通过，页面功能读取通过；浏览器无错误检查因 React #418 未通过，严格页面脚本会以非零状态退出。该问题在原有测评页面也可复现，详见 [执行结果](./simulated-user-data-result.md)，不得把非零退出解释为未导入数据后盲目重建批次。

## 验证脚本

```text
node --test scripts/seed-simulated-users.test.cjs
npx eslint scripts/seed-simulated-users.cjs scripts/seed-simulated-users.test.cjs scripts/verify-simulated-pages.cjs
```

## 清理

`node scripts/seed-simulated-users.cjs cleanup-sql` 生成清理 SQL 供复核，不自动执行。实际清理是后续单独操作：先处理本批次有效会话，再按清单移除独占图片及业务记录；有真人答题依赖的模拟测评不能直接级联删除。数据库 SQL 不会替代 Storage API 删除文件，也不会撤销尚未过期的访问令牌。

## 数据解释

- 邮箱、报告、图片和 AI 日志均为明确标记的模拟数据；不发邮件，不调用付费 OCR/AI。
- 当前配置的 OCR 地址指向本机，本次预检连接失败。报告使用当前应用已知的 normalized 成功结构；没有猜测失败状态或宣称验证了外部解析服务。
- 画像全量重建按测评去重，`report_count` 为有效报告加不同测评的有效来源数，可能小于历史答题条数。
- guest_signup 无完整触发路径，逐用户站外点击没有现有数据模型；不造这类无法证实的业务记录。
- 公开模拟测评进入当前正式产品列表；现有用量页面会把模拟 tokens 和估算费用纳入展示，不能将其解释为真实账单。
