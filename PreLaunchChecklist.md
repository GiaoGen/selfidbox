SelfIDBox — Pre Launch Checklist

Status

核心功能已完成：

- Explore
- Create (AI Quiz Studio)
- Profile
- Quiz Runtime
- UGC Quiz
- Admin
- AI Usage
- PWA

当前阶段：

上线前收尾与风险排查。

---

P0 — 上线前建议确认

1. Supabase Auth Redirect URL

确认以下地址已加入：

- https://selfidbox.com
- https://www.selfidbox.com
- https://YOUR_PROJECT.vercel.app
- http://localhost:3000

位置：

Supabase Dashboard

Authentication → URL Configuration

---

2. Vercel Environment Variables

确认 Production 环境已配置：

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- DEEPSEEK_API_KEY
- ADMIN_USER_IDS

如果 OCR 仍未部署：

- OCR_API_URL
- OCR_API_KEY

必须具备缺失时的兜底逻辑。

---

3. Admin 权限验证

当前 Admin 页面已经受保护。

需要确认：

不仅页面受保护。

所有 Admin API：

- 创建
- 编辑
- 删除
- Prompt
- AI Usage

都必须校验管理员权限。

不能只依赖前端隐藏。

---

4. RLS 实测

不要只确认 SQL 已执行。

必须进行真实测试：

用户 A

创建：

- Profile
- Reports
- Quiz Attempts

用户 B

尝试访问 A 的数据。

预期：

读取失败。

---

匿名用户测试：

预期：

不能读取：

- user_profile
- reports
- quiz_attempts

---

公开内容测试：

预期：

published quizzes 可读。

draft quizzes 不可读。

---

5. Supabase Storage 权限

检查所有 Bucket：

OCR 截图

是否公开？

分享图片

是否公开？

用户上传图片

是否允许任意覆盖？

确认：

Bucket Policy 与产品设计一致。

---

6. AI 成本保护

检查：

DeepSeek 控制台

确认：

- 配额提醒
- 余额提醒
- 使用监控

避免 AI 路由被刷导致成本失控。

---

7. Rate Limit

当前已完成：

20 req/min/user

确认：

- Quiz Results
- Quiz Factors
- Quiz Questions
- Quiz Vectors

均已启用。

注意：

当前属于轻量限流。

Vercel Serverless 环境下不能视为强安全方案。

---

8. 日志检查

上线前：

检查：

- Vercel Logs
- Supabase Logs

确认：

无大量 500
无无限重试
无未处理异常

---

P1 — 建议上线时拥有

9. Privacy Policy

页面：

/privacy

内容至少包含：

- 收集哪些数据
- 如何使用数据
- 是否调用 AI 服务
- 用户如何删除数据

---

10. Terms of Service

页面：

/terms

内容至少包含：

- 用户内容责任
- Quiz 内容责任
- 平台免责条款

---

11. Community Guidelines

页面：

/community-guidelines

内容：

- 禁止违法内容
- 禁止骚扰内容
- 禁止恶意 Quiz

---

P2 — 运营准备

12. 新账号全流程测试

不要使用开发账号。

创建全新账号。

完整测试：

注册
↓
邮件确认
↓
登录
↓
创建 Quiz
↓
生成 Results
↓
生成 Factors
↓
生成 Questions
↓
发布
↓
进入 Explore
↓
完成 Quiz
↓
生成 Profile
↓
删除数据来源
↓
退出登录

记录所有异常。

---

13. AI Usage 检查

观察：

/admin/ai-usage

确认：

- Results
- Factors
- Questions
- Vectors
- Profile Summary

均有记录。

---

14. 性能检查

重点：

- Explore
- Profile
- Quiz Detail

确认：

- Skeleton 生效
- 页面不会长时间白屏
- 图片正常加载

---

15. 备份

上线前：

导出：

- Schema
- Migration
- Env 配置

至少保留一份离线备份。

---

当前不建议继续做

上线前不要继续投入：

- 商城
- 等级系统
- 积分
- 虚拟形象
- Prompt 数据库管理系统
- 大规模 UI 重构

优先：

稳定性
安全
Prompt 质量
真实用户反馈

---

最终上线标准

满足：

- Build 正常
- Vercel 正常
- Auth 正常
- RLS 正常
- Admin 正常
- AI 正常
- 新账号全链路测试通过

即可进入 V1 公测阶段。