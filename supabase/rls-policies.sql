-- ============================================================================
-- SelfIDBox — RLS Policy Guide
-- ============================================================================
-- 在 Supabase Dashboard → Authentication → Policies 中逐表检查。
-- 如果某表没有任何 policy，复制对应 SQL 到 Supabase SQL Editor 执行。
-- ============================================================================

-- ============================================================================
-- 1. user_profile — 用户人格数据（core_vector, social_vector, summary）
-- ============================================================================
-- 要求：用户只能读写自己的 profile
-- 检查：是否有 SELECT / INSERT / UPDATE policy，条件为 user_id = auth.uid()

/*
-- 如果没有，执行：
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON user_profile
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profile
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profile
  FOR UPDATE USING (auth.uid() = user_id);
*/

-- ============================================================================
-- 2. quiz_attempts — 用户答题记录
-- ============================================================================
-- 要求：用户只能读/写自己的答题记录
-- 注意：rebuildUserProfile 使用 service_role 读取所有用户的记录，
--       所以需要一个 service_role 可绕过 RLS 的 policy，或者
--       直接在 lib/rebuild-user-profile.ts 中使用 service_role client

/*
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own attempts" ON quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attempts" ON quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
*/

-- ============================================================================
-- 3. quiz_attempt_answers — 答题选项明细
-- ============================================================================
-- 要求：与 quiz_attempts 关联，用户只能读自己的

/*
ALTER TABLE quiz_attempt_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own answers" ON quiz_attempt_answers
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM quiz_attempts WHERE id = attempt_id)
  );

CREATE POLICY "Users can insert own answers" ON quiz_attempt_answers
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM quiz_attempts WHERE id = attempt_id)
  );
*/

-- ============================================================================
-- 4. reports — 用户上传的报告/截图
-- ============================================================================
-- 要求：用户只能读/写自己的报告

/*
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own reports" ON reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports" ON reports
  FOR UPDATE USING (auth.uid() = user_id);
*/

-- ============================================================================
-- 5. quizzes — Quiz 定义（元数据 + style controls）
-- ============================================================================
-- 要求：所有人可读 published 和 sandbox 状态的 quiz
--       只有创建者可写自己的 quiz
--       创建者必须是登录用户

/*
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- 任何人都能读已发布和试玩版
CREATE POLICY "Anyone can read published quizzes" ON quizzes
  FOR SELECT USING (status IN ('published', 'sandbox'));

-- 创建者可以读自己的（包括未发布状态）
CREATE POLICY "Creator can read own quizzes" ON quizzes
  FOR SELECT USING (auth.uid() = creator_user_id);

-- 创建者可以插入
CREATE POLICY "Creator can insert quizzes" ON quizzes
  FOR INSERT WITH CHECK (auth.uid() = creator_user_id);

-- 创建者可以更新
CREATE POLICY "Creator can update own quizzes" ON quizzes
  FOR UPDATE USING (auth.uid() = creator_user_id);
*/

-- ============================================================================
-- 6. quiz_factors / quiz_results / quiz_questions / quiz_options
-- ============================================================================
-- 这些表通过 quiz_id 关联到 quizzes。
-- 要求：与父表 quizzes 一致的权限模型

/*
ALTER TABLE quiz_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_options ENABLE ROW LEVEL SECURITY;

-- quiz_factors
CREATE POLICY "Anyone can read factors of published quizzes" ON quiz_factors
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM quizzes WHERE id = quiz_id AND status IN ('published', 'sandbox'))
  );
CREATE POLICY "Creator can manage factors" ON quiz_factors
  FOR ALL USING (
    EXISTS (SELECT 1 FROM quizzes WHERE id = quiz_id AND creator_user_id = auth.uid())
  );

-- quiz_results
CREATE POLICY "Anyone can read results of published quizzes" ON quiz_results
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM quizzes WHERE id = quiz_id AND status IN ('published', 'sandbox'))
  );
CREATE POLICY "Creator can manage results" ON quiz_results
  FOR ALL USING (
    EXISTS (SELECT 1 FROM quizzes WHERE id = quiz_id AND creator_user_id = auth.uid())
  );

-- quiz_questions
CREATE POLICY "Anyone can read questions of published quizzes" ON quiz_questions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM quizzes WHERE id = quiz_id AND status IN ('published', 'sandbox'))
  );
CREATE POLICY "Creator can manage questions" ON quiz_questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM quizzes WHERE id = quiz_id AND creator_user_id = auth.uid())
  );

-- quiz_options
CREATE POLICY "Anyone can read options of published quizzes" ON quiz_options
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM quizzes WHERE id = quiz_id AND status IN ('published', 'sandbox'))
  );
CREATE POLICY "Creator can manage options" ON quiz_options
  FOR ALL USING (
    EXISTS (SELECT 1 FROM quizzes WHERE id = quiz_id AND creator_user_id = auth.uid())
  );
*/

-- ============================================================================
-- 7. test_sites / test_categories — 官方测评数据
-- ============================================================================
-- 要求：所有人可读（公开数据），仅 admin 可写
-- 当前 admin 通过前端操作，使用 anon key（RLS 视为匿名用户）
-- 所以需要允许匿名读取

/*
ALTER TABLE test_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_categories ENABLE ROW LEVEL SECURITY;

-- 任何人都能读已发布的数据
CREATE POLICY "Anyone can read published test sites" ON test_sites
  FOR SELECT USING (status = 'published');

CREATE POLICY "Anyone can read published categories" ON test_categories
  FOR SELECT USING (status = 'published');
*/

-- ============================================================================
-- 8. test_site_clicks — 点击追踪
-- ============================================================================
-- 要求：所有人可 INSERT（匿名点击追踪），仅 admin 可 SELECT

/*
ALTER TABLE test_site_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert clicks" ON test_site_clicks
  FOR INSERT WITH CHECK (true);
*/

-- ============================================================================
-- 9. ai_usage_logs / ai_prompts — AI 使用追踪
-- ============================================================================
-- 要求：仅 admin 可读，服务端可 INSERT
-- 这些表通常通过 lib/ai/track-ai-usage.ts 写入（使用 anon key）

/*
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;
*/

-- ============================================================================
-- 10. Storage bucket: quiz-result-images
-- ============================================================================
-- 检查 Supabase Dashboard → Storage → Policies
-- 当前迁移文件中已有一个 policy：add_image_url.sql
-- 确认 bucket 存在且 policy 生效
-- 要求：
--   SELECT: 所有人可读（公开图片）
--   INSERT: 登录用户可上传

/*
-- 在 Supabase Dashboard → Storage → quiz-result-images → Policies 中检查：
-- 1. "Give users access to own folder" 或类似 policy（INSERT for authenticated users）
-- 2. "Give public access" 或类似 policy（SELECT for public）
*/
