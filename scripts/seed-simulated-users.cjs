/* One-off, resumable fixtures for the explicitly authorized current project.
 * node scripts/seed-simulated-users.cjs preview|preflight|auth [2|64]|auth-sql [2|64]
 * node scripts/seed-simulated-users.cjs login [2|64]|import|verify|cleanup-sql
 * All credentials and manifests remain in the ignored .seed-data directory.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const Module = require('node:module');

const ROOT = path.resolve(__dirname, '..');
const PROJECT = 'ynwyxcbbtvozqqjspzex';
const BATCH = 'sim-20261102-v1';
const DIR = path.join(ROOT, '.seed-data', BATCH);
const MONTHS = ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'];
const REG_COUNTS = [2, 3, 5, 25, 23, 5, 1];
const ATTEMPT_COUNTS = [9, 22, 35, 173, 151, 38, 4];
const KEYS = ['social', 'sensitivity', 'rationality', 'curiosity', 'independence', 'expressiveness', 'drive', 'imagination', 'assertiveness', 'security_need', 'empathy', 'dramaticness', 'orderliness', 'contradiction', 'attachment', 'presence'];
const LABELS = ['社交', '敏感度', '理性', '好奇心', '独立性', '表达欲', '行动力', '想象力', '主动性', '安全需求', '共情', '戏剧性', '秩序感', '矛盾感', '依恋', '存在感'];
const TABLES = ['users', 'quizzes', 'quiz_factors', 'quiz_results', 'quiz_questions', 'quiz_options', 'quiz_attempts', 'quiz_attempt_answers', 'reports', 'user_profile', 'user_credits', 'credit_events', 'ai_usage_logs', 'test_categories', 'test_sites', 'test_site_clicks', 'ai_prompts', 'ai_prompt_versions'];
const CATEGORIES = ['5512464f-2e02-4430-a1a3-d0f3f25c9754', 'cb2acb0c-d094-435b-b816-4effd5495ead', '0c60ae10-3297-4c17-ac2f-3994c927c70b'];

function save(name, value) {
  fs.mkdirSync(DIR, { recursive: true });
  const dest = path.join(DIR, name);
  fs.writeFileSync(dest + '.tmp', JSON.stringify(value, null, 2), { mode: 0o600 });
  fs.renameSync(dest + '.tmp', dest);
}
function load(name, fallback) {
  const file = path.join(DIR, name);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : fallback;
}
function hash(value) { return crypto.createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : stable(value)).digest('hex'); }
function stable(value) {
  if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + stable(value[k])).join(',') + '}';
  return JSON.stringify(value);
}
function uuid(key) {
  const h = hash(BATCH + ':' + key).slice(0, 32).split(''); h[12] = '5'; h[16] = '8';
  return [h.slice(0, 8), h.slice(8, 12), h.slice(12, 16), h.slice(16, 20), h.slice(20)].map(x => x.join('')).join('-');
}
function random(seed) {
  let x = parseInt(hash(seed).slice(0, 8), 16);
  return () => { x |= 0; x = x + 0x6D2B79F5 | 0; let t = Math.imul(x ^ x >>> 15, 1 | x); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function iso(value) { return new Date(value).toISOString(); }
function add(time, minutes) { return iso(Date.parse(time) + minutes * 60000); }
function month(time) { return iso(Date.parse(time) + 8 * 3600000).slice(0, 7); }
function bounds(index, cutoff) {
  const start = index === 0 ? Date.parse('2026-05-16T00:00:00+08:00') : Date.parse(MONTHS[index] + '-01T00:00:00+08:00');
  const next = index === 6 ? Date.parse(cutoff) : Date.parse(MONTHS[index + 1] + '-01T00:00:00+08:00');
  return [start, Math.min(next - 1, Date.parse(cutoff))];
}
function runtime() {
  // Compile the existing TS functions, including their relative/alias imports.
  if (!runtime.ready) {
    const ts = require('typescript');
    const resolve = Module._resolveFilename;
    Module._resolveFilename = function (request, parent, ...args) {
      if (request.startsWith('@/')) request = path.join(ROOT, request.slice(2));
      return resolve.call(this, request, parent, ...args);
    };
    require.extensions['.ts'] = (mod, filename) => {
      const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } });
      mod._compile(output.outputText, filename);
    };
    runtime.ready = true;
  }
  return require(path.join(ROOT, 'lib/quiz-runtime.ts'));
}
function env() {
  require('@next/env').loadEnvConfig(ROOT);
  assert.equal(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname, PROJECT + '.supabase.co', 'Wrong Supabase project');
  assert.ok(process.env.SUPABASE_SERVICE_ROLE_KEY, 'Missing service key');
  return require('@supabase/supabase-js').createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(30000) }) } });
}
function publicClient() {
  return require('@supabase/supabase-js').createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}
async function checked(request, context) {
  const result = await request;
  if (result.error) throw new Error(context + ': ' + result.error.message);
  return result.data;
}

function buildPlan(cutoff = new Date().toISOString()) {
  assert.ok(Date.parse(cutoff) >= Date.parse('2026-11-02T00:00:00+08:00'), 'Cutoff precedes planned November cohort');
  const rng = random(BATCH), { calculateUserVector, rankRuntimeResultsV2 } = runtime();
  const domains = [...Array(30).fill('qq.com'), ...Array(22).fill('163.com'), ...Array(6).fill('outlook.com'), ...Array(6).fill('gmail.com')];
  for (let i = domains.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [domains[i], domains[j]] = [domains[j], domains[i]]; }
  const family = ['林', '陈', '许', '周', '吴', '张', '李', '赵'];
  const given = ['予安', '知夏', '子墨', '亦宁', '星禾', '书言', '思远', '沐晴'];
  const people = [];
  for (let m = 0; m < 7; m++) {
    const [start, end] = bounds(m, cutoff);
    for (let j = 0; j < REG_COUNTS[m]; j++) {
      const i = people.length, key = 'u' + String(i + 1).padStart(3, '0');
      const registration = iso(start + Math.floor((Math.min(end - start, 10 * 86400000) - 3600000) * (j + rng() * 0.5) / REG_COUNTS[m]) + 3600000);
      people.push({ key, id: uuid(key), email: `seed20261102.${key}.${hash(key).slice(0, 6)}@${domains[i]}`, display_name: family[i % 8] + given[Math.floor(i / 8)], username: 'sim_' + key + '_' + hash(key).slice(0, 4), created_at: registration, attempts: i < 16 ? 15 : i < 48 ? 5 : 2, preference: Object.fromEntries(KEYS.map(k => [k, 15 + Math.floor(rng() * 71)])) });
    }
  }
  const authors = [0, 1, 5, 10, 15, 20, 35, 40].map(i => people[i]);
  const themes = ['周末的充电方式', '你在团队中的节奏', '陌生城市的探索路线', '面对变化的第一反应', '你的灵感从哪里来', '关系里的安全距离', '深夜书店的选择', '理想工作日的样子', '朋友眼中的沟通方式', '旅行计划的隐藏偏好', '日常决策的指南针', '你的创造力气候', '午后咖啡馆的角色', '你会怎样组织聚会', '遇到分歧时的表达', '你的情绪天气预报', '亲密关系中的小习惯', '新项目启动的方式', '独处时光的颜色', '你心中的理想社区', '梦想清单的排序', '城市散步的人格地图', '你的学习补给站', '压力下的恢复节奏'];
  const cases = ['一个空闲周末突然到来', '朋友邀请你尝试陌生的活动', '团队需要决定下一步', '原定计划临时改变', '你发现了一个有趣的问题', '身边的人情绪低落', '你有机会表达自己的想法', '一天结束，你想恢复精力', '新任务需要有人先行动', '你正在安排下一次见面', '面对几个同样吸引人的选择', '你想为生活留下一点新鲜感'];
  const tables = Object.fromEntries(['quizzes', 'quiz_factors', 'quiz_results', 'quiz_questions', 'quiz_options', 'quiz_attempts', 'quiz_attempt_answers', 'ai_usage_logs', 'credit_events', 'user_credits'].map(t => [t, []]));
  const quizData = [];
  for (let i = 0; i < 24; i++) {
    const creator = authors[i % 8], created = add(creator.created_at, 20 + Math.floor(i / 8) * 5), id = uuid('quiz:' + i);
    const status = i < 12 ? 'published' : i < 16 ? 'sandbox' : i < 20 ? 'submitted' : 'draft';
    const q = { id, creator_user_id: creator.id, slug: BATCH + '-q' + String(i + 1).padStart(2, '0'), title: '模拟·' + themes[i], hook: '从日常选择观察你的偏好', description: '明确标记的模拟测评，用于数据与界面验证。结果仅供测试。', quiz_type: 'personality', audience: ['一般大众'], tone: ['轻松', '温和'], status, featured: false, created_at: created, updated_at: add(created, 30), published_at: status === 'published' ? add(created, 30) : null, attempt_count: 0, abstractness: 20 + i % 5 * 10, seriousness: 40 + i % 4 * 10, depth: 40 + i % 3 * 15, poeticness: 20 + i % 4 * 10, title_relevance: 40, goofiness: 15 + i % 3 * 10, cover_image_url: null, category_id: CATEGORIES[i % 3], popularity_score: 0, color: ['#d7a2a8', '#78aaa6', '#aaa0c0', '#e2ad92', '#c6aa68', '#98b39b'][i % 6] };
    tables.quizzes.push(q);
    const factors = KEYS.map((key, j) => ({ id: uuid(`factor:${i}:${j}`), quiz_id: id, key, name: LABELS[j], description: '模拟测评维度：' + LABELS[j], sort_order: j, created_at: created }));
    tables.quiz_factors.push(...factors);
    const names = ['安静的观察者', '温柔的连接者', '好奇的探索者', '坚定的推动者'];
    const results = names.map((name, j) => ({ id: uuid(`result:${i}:${j}`), quiz_id: id, key: 'r' + (j + 1), name, subtitle: themes[i] + '中的一种可能', description: `${name}倾向于以自己的节奏回应日常情境；这是模拟数据生成的结果描述，并非心理诊断。`, traits: [['细致', '独立'], ['共情', '耐心'], ['好奇', '开放'], ['主动', '有序']][j], result_vector: Object.fromEntries(KEYS.map((k, x) => [k, 20 + ((x + j + i) % 4) * 20])), share_text: `在${themes[i]}里，我遇见了${name}。`, sort_order: j, created_at: created, image_url: null, color: ['#d7e5dd', '#f0d8cf', '#ded8ee', '#e9dfbd'][j] }));
    tables.quiz_results.push(...results);
    const questions = [];
    for (let j = 0; j < 8 + i % 3 * 2; j++) {
      const question = { id: uuid(`question:${i}:${j}`), quiz_id: id, question_order: j + 1, text: `关于「${themes[i]}」：${cases[j]}，你更倾向于？`, description: null, created_at: created };
      tables.quiz_questions.push(question);
      const a = j * 2 % 16, b = (j * 2 + 1) % 16;
      const options = [[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([x, y], k) => ({ id: uuid(`option:${i}:${j}:${k}`), quiz_id: id, question_id: question.id, option_order: k + 1, label: String.fromCharCode(65 + k), text: `${x > 0 ? '主动投入' : '先留出观察空间'}，${y > 0 ? '跟随当下的感受' : '梳理自己的判断'}。`, factor_effects: { [KEYS[a]]: x * 3, [KEYS[b]]: y * 2 }, created_at: created }));
      tables.quiz_options.push(...options); questions.push({ ...question, options });
    }
    quizData.push({ ...q, factors, results, questions });
  }
  // Allocate latest registrants first, so no monthly quota is stranded before signup.
  const capacity = [...ATTEMPT_COUNTS], slots = [];
  for (const person of [...people].reverse()) {
    const firstMonth = MONTHS.indexOf(month(person.created_at));
    for (let n = 0; n < person.attempts; n++) {
      const candidates = capacity.map((remaining, m) => ({ m, remaining })).filter(x => x.m >= firstMonth && x.remaining > 0);
      const total = candidates.reduce((s, x) => s + x.remaining, 0); assert.ok(total > 0, 'Monthly allocation infeasible');
      let pick = rng() * total, selected = candidates[candidates.length - 1].m;
      for (const c of candidates) { pick -= c.remaining; if (pick < 0) { selected = c.m; break; } }
      capacity[selected]--;
      const [start, end] = bounds(selected, cutoff), earliest = Math.max(start, Date.parse(person.created_at) + 7200000, Date.parse(quizData[0].published_at) + 60000);
      assert.ok(end > earliest, 'No time for registered user');
      slots.push({ person, at: iso(earliest + Math.floor(rng() * (end - earliest))), month: selected });
    }
  }
  assert.deepEqual(capacity, Array(7).fill(0)); slots.sort((a, b) => a.at.localeCompare(b.at));
  const lastQuiz = new Map();
  for (let i = 0; i < slots.length; i++) {
    const { person, at } = slots[i];
    const eligible = quizData.filter(q => ['published', 'sandbox'].includes(q.status) && Date.parse(q.published_at || q.updated_at) <= Date.parse(at) && (q.status !== 'sandbox' || tables.quizzes.find(x => x.id === q.id).attempt_count < 20));
    const alternatives = eligible.filter(q => q.id !== lastQuiz.get(person.id));
    const choices = alternatives.length ? alternatives : eligible; assert.ok(choices.length);
    const q = choices[Math.floor(rng() * choices.length)]; lastQuiz.set(person.id, q.id);
    const answers = q.questions.map(question => {
      const scored = question.options.map(option => ({ option, score: Object.entries(option.factor_effects).reduce((s, [k, v]) => s + (person.preference[k] - 50 + (rng() - 0.5) * 45) * v, 0) })).sort((a, b) => b.score - a.score);
      return { questionId: question.id, optionId: scored[0].option.id, effects: scored[0].option.factor_effects };
    });
    const vector = calculateUserVector(KEYS, answers), { ranked } = rankRuntimeResultsV2(vector, q.results, q.questions, KEYS), top = ranked[0].result;
    const weight = Math.min(0.95, Math.max(0.05, ((100 - q.abstractness) + q.seriousness + q.depth + (100 - q.poeticness) + (100 - q.title_relevance) + (100 - q.goofiness)) / 600));
    const id = uuid('attempt:' + i);
    tables.quiz_attempts.push({ id, quiz_id: q.id, user_id: person.id, user_vector: vector, similarity_ranking: ranked.slice(0, 3).map(r => ({ result_key: r.result.key, result_name: r.result.name, similarity: r.similarity })), final_result_id: top.id, final_result_key: top.key, final_result_name: top.name, created_at: at, included_in_profile: true, profile_weight: weight, fused_into_profile: false });
    tables.quiz_attempt_answers.push(...answers.map((a, j) => ({ id: uuid(`answer:${i}:${j}`), attempt_id: id, quiz_id: q.id, question_id: a.questionId, option_id: a.optionId, created_at: at })));
    tables.quizzes.find(x => x.id === q.id).attempt_count++;
  }
  const reports = [];
  for (let i = 0; i < 32; i++) {
    const person = people[i * 2], kinds = i < 16 ? ['email'] : i < 24 ? ['screenshot'] : ['email', 'screenshot'];
    for (const kind of kinds) {
      const key = person.key + '-' + kind, userAttempts = tables.quiz_attempts.filter(a => a.user_id === person.id);
      const at = add(userAttempts[Math.floor(rng() * userAttempts.length)].created_at, -5);
      const main = ['INTJ', 'INFP', 'ENFP', 'ISTJ', 'INFJ', 'ENTP', 'ISFP', 'ESFJ'][i % 8];
      const dims = Object.fromEntries(KEYS.map(k => [k, { value: person.preference[k], confidence: 0.8, source: 'simulated', evidence: 'Synthetic fixture; not an actual assessment or OCR inference.' }]));
      const core = Object.fromEntries(KEYS.slice(0, 8).map(k => [k, dims[k]])), social = Object.fromEntries(KEYS.slice(8).map(k => [k, dims[k]]));
      const text = `SIMULATED REPORT\nUser ${person.key}\nType MBTI\nResult ${main}\n` + KEYS.map(k => `${k}: ${person.preference[k]}`).join('\n') + '\nSynthetic fixture, not a real assessment.';
      reports.push({ key, record: { created_at: at, user_id: person.id, input_type: kind, to_email: kind === 'email' ? `${person.key}@seed-inbox.example.invalid` : null, from_email: kind === 'email' ? person.email : null, subject: kind === 'email' ? '模拟测评报告 · ' + main : null, report_type: 'MBTI', main_result: main, dimensions: { ...core, ...social }, confidence: 0.8, raw_ai_response: { seed_batch: BATCH, seed_report_key: key, simulated: true, executed_at: cutoff, is_assessment_report: true, schema_version: 'report_normalized_v1', test_type: 'MBTI', source_name: 'Synthetic fixture', main_result: main, result_label: main, result_category: 'simulation', overall_confidence: 0.8, core_vector: core, social_vector: social, extra_traits: [], tags: ['模拟'], summary: `模拟 ${main} 报告，供界面与数据验证。`, warnings: ['Synthetic data: no actual OCR or model call occurred.'] }, raw_text: text, parse_status: 'normalized', core_vector: core, social_vector: social, extra_traits: [], normalized_summary: `模拟 ${main} 报告，供界面与数据验证。`, normalized_confidence: 0.8, schema_version: 'report_normalized_v1', image_url: null, ocr_text: kind === 'screenshot' ? text : null, ocr_confidence: kind === 'screenshot' ? 1 : null, image_hash: null } });
    }
  }
  const { estimateCost } = require(path.join(ROOT, 'lib/ai/model-pricing.ts'));
  const features = ['quiz_generate_results', 'quiz_generate_factors', 'quiz_generate_result_vectors', 'quiz_generate_questions'];
  for (const person of authors) {
    const owned = tables.quizzes.filter(q => q.creator_user_id === person.id), first = owned[0];
    for (let j = 0; j < 5; j++) {
      const success = j < 4, input = success ? 350 + Math.floor(rng() * 1600) : 0, output = success ? 250 + Math.floor(rng() * 1400) : 0;
      tables.ai_usage_logs.push({ id: uuid('ai:' + person.key + ':' + j), user_id: person.id, feature: features[j % 4], model: 'deepseek-chat', prompt_tokens: input, completion_tokens: output, total_tokens: input + output, estimated_cost: estimateCost('deepseek-chat', input, output), success, error_message: success ? null : 'SIMULATED_UPSTREAM_FAILURE', metadata: { seed_batch: BATCH, simulated: true, executed_at: cutoff, quiz_id: first.id, charged: success }, created_at: add(first.created_at, 2 + j * 3) });
    }
  }
  const actions = [];
  for (const q of tables.quizzes.filter(q => q.status === 'published')) actions.push({ user_id: q.creator_user_id, type: 'quiz_approved', amount: 5, reference_id: q.id, at: q.published_at });
  const rewardKeys = new Set();
  for (const a of tables.quiz_attempts) {
    const q = tables.quizzes.find(x => x.id === a.quiz_id), ref = `${q.id}::${a.user_id}`;
    if (q.creator_user_id !== a.user_id && !rewardKeys.has(ref)) { rewardKeys.add(ref); actions.push({ user_id: q.creator_user_id, type: 'quiz_completed', amount: 1, reference_id: ref, at: a.created_at }); }
  }
  for (const a of tables.ai_usage_logs.filter(a => a.metadata.charged)) actions.push({ user_id: a.user_id, type: 'ai_generate', amount: -1, reference_id: a.id, at: a.created_at });
  for (const person of people) {
    const events = actions.filter(x => x.user_id === person.id).sort((a, b) => a.at.localeCompare(b.at));
    const balance = { user_id: person.id, base_credits: 20, bonus_credits: 0, used_credits: 0, base_refilled_at: person.created_at, updated_at: person.created_at };
    const event = (type, amount, at, ref = null) => tables.credit_events.push({ id: uuid(`credit:${person.key}:${tables.credit_events.length}`), user_id: person.id, type, amount, reference_id: ref, metadata: { seed_batch: BATCH, simulated: true }, created_at: at });
    event('base_monthly', 20, person.created_at);
    for (const action of events) {
      // Postgres date_trunc('month', timestamptz) currently uses UTC, not Taipei.
      if (action.at.slice(0, 7) > balance.base_refilled_at.slice(0, 7)) {
        const available = balance.base_credits + balance.bonus_credits - balance.used_credits;
        if (available < 20) { const delta = 20 - available; balance.base_credits += delta; event('base_monthly', delta, action.at); }
        balance.base_refilled_at = action.at;
      }
      if (action.amount < 0) balance.used_credits -= action.amount; else balance.bonus_credits += action.amount;
      balance.updated_at = action.at; event(action.type, action.amount, action.at, action.reference_id);
      assert.ok(balance.base_credits + balance.bonus_credits - balance.used_credits >= 0);
    }
    tables.user_credits.push(balance);
  }
  const plan = { batch: BATCH, project: PROJECT, executed_at: cutoff, people, authors: authors.map(p => p.id), reports, tables };
  validatePlan(plan); return plan;
}

function validatePlan(plan) {
  assert.equal(plan.batch, BATCH); assert.equal(plan.project, PROJECT);
  assert.equal(plan.people.length, 64); assert.equal(plan.reports.length, 40);
  assert.equal(plan.tables.quiz_attempts.length, 432); assert.equal(plan.tables.ai_usage_logs.length, 40);
  assert.deepEqual(MONTHS.map(m => plan.people.filter(p => month(p.created_at) === m).length), REG_COUNTS);
  assert.deepEqual(MONTHS.map(m => plan.tables.quiz_attempts.filter(a => month(a.created_at) === m).length), ATTEMPT_COUNTS);
  for (const [domain, total] of Object.entries({ 'qq.com': 30, '163.com': 22, 'outlook.com': 6, 'gmail.com': 6 })) assert.equal(plan.people.filter(p => p.email.endsWith('@' + domain)).length, total);
  const people = new Map(plan.people.map(p => [p.id, p])), quizzes = new Map(plan.tables.quizzes.map(q => [q.id, q]));
  const questions = new Map(plan.tables.quiz_questions.map(q => [q.id, q])), options = new Map(plan.tables.quiz_options.map(o => [o.id, o]));
  const results = new Map(plan.tables.quiz_results.map(r => [r.id, r]));
  for (const p of plan.people) assert.equal(plan.tables.quiz_attempts.filter(a => a.user_id === p.id).length, p.attempts);
  for (const q of quizzes.values()) {
    assert.ok(q.created_at >= people.get(q.creator_user_id).created_at);
    assert.equal(q.attempt_count, plan.tables.quiz_attempts.filter(a => a.quiz_id === q.id).length);
    if (q.status === 'sandbox') assert.ok(q.attempt_count <= 20);
  }
  for (const a of plan.tables.quiz_attempts) {
    const q = quizzes.get(a.quiz_id), answers = plan.tables.quiz_attempt_answers.filter(x => x.attempt_id === a.id);
    assert.ok(a.created_at >= people.get(a.user_id).created_at && a.created_at >= (q.published_at || q.updated_at));
    assert.ok(Date.parse(a.created_at) <= Date.parse(plan.executed_at));
    assert.equal(results.get(a.final_result_id).quiz_id, a.quiz_id);
    assert.equal(answers.length, plan.tables.quiz_questions.filter(x => x.quiz_id === q.id).length);
    assert.equal(new Set(answers.map(x => x.question_id)).size, answers.length);
    for (const answer of answers) { assert.equal(questions.get(answer.question_id).quiz_id, q.id); assert.equal(options.get(answer.option_id).question_id, answer.question_id); assert.equal(answer.quiz_id, q.id); }
  }
  for (const r of plan.reports) { assert.ok(r.record.created_at >= people.get(r.record.user_id).created_at); assert.equal(r.record.raw_ai_response.seed_batch, BATCH); }
  for (const t of Object.values(plan.tables)) assert.equal(new Set(t.map(x => x.id || x.user_id)).size, t.length, 'Duplicate IDs');
  for (const balance of plan.tables.user_credits) {
    assert.ok(people.has(balance.user_id), 'Credit balance outside simulation');
    const events = plan.tables.credit_events.filter(e => e.user_id === balance.user_id);
    assert.equal(events.reduce((s, e) => s + e.amount, 0), balance.base_credits + balance.bonus_credits - balance.used_credits);
    assert.equal(events.filter(e => e.type === 'ai_generate').length, balance.used_credits);
  }
  for (const event of plan.tables.credit_events) assert.ok(people.has(event.user_id), 'Credit event outside simulation');
  for (const log of plan.tables.ai_usage_logs) assert.ok(people.has(log.user_id) && plan.authors.includes(log.user_id), 'AI log outside simulation authors');
  return true;
}
function summary(plan) {
  return { batch: BATCH, project: PROJECT, users: plan.people.length, counts: Object.fromEntries(Object.entries(plan.tables).map(([k, v]) => [k, v.length])), reports: plan.reports.length, monthlyRegistrations: REG_COUNTS, monthlyAttempts: ATTEMPT_COUNTS, executedAt: plan.executed_at };
}
function getPlan() { const p = load('plan.json'); assert.ok(p, 'Run preview first'); validatePlan(p); return p; }
async function allRows(db, table) {
  const key = ['user_profile', 'user_credits'].includes(table) ? 'user_id' : 'id', rows = [];
  for (let start = 0; ; start += 1000) { const page = await checked(db.from(table).select('*').order(key).range(start, start + 999), 'read ' + table); rows.push(...page); if (page.length < 1000) return rows; }
}
async function snapshot(db) {
  const output = {};
  for (const table of TABLES) {
    const rows = await allRows(db, table), key = ['user_profile', 'user_credits'].includes(table) ? 'user_id' : 'id';
    output[table] = Object.fromEntries(rows.map(r => [r[key], hash(r)]));
  }
  return output;
}
async function authUsers(db) {
  const rows = [];
  for (let page = 1; ; page++) { const data = await checked(db.auth.admin.listUsers({ page, perPage: 1000 }), 'list auth'); rows.push(...data.users); if (data.users.length < 1000) return rows; }
}
async function preflight(db, plan) {
  assert.ok(!load('auth.json') || load('baseline.json'), 'Refuse to take a baseline after creation');
  for (const id of CATEGORIES) assert.ok((await checked(db.from('test_categories').select('id').eq('id', id), 'category')).length);
  const buckets = await checked(db.storage.listBuckets(), 'list buckets'); assert.ok(buckets.some(b => b.id === 'quiz-result-images' && b.public));
  const users = await authUsers(db);
  for (const p of plan.people) { const found = users.find(u => u.id === p.id || u.email === p.email); if (found) assert.ok(found.id === p.id && found.app_metadata.seed_batch === BATCH, 'Existing user collision'); }
  if (!load('baseline.json')) { save('baseline.json', { at: iso(Date.now()), tables: await snapshot(db), auth: Object.fromEntries(users.map(u => [u.id, hash({ id: u.id, email: u.email, created_at: u.created_at, app_metadata: u.app_metadata })])) }); }
  console.log(JSON.stringify({ preflight: 'passed', project: PROJECT, authUsers: users.length, existingDataBaseline: true }));
}
async function createAuth(db, plan, limit) {
  assert.ok(load('baseline.json'), 'Run preflight before creating accounts');
  const credentials = load('credentials.json', {}), progress = load('auth.json', {}), existing = await authUsers(db);
  for (const p of plan.people.slice(0, limit)) {
    if (!credentials[p.key]) { credentials[p.key] = { email: p.email, password: crypto.randomBytes(30).toString('base64url') }; save('credentials.json', credentials); }
    let user = existing.find(u => u.id === p.id || u.email === p.email);
    if (!user) user = (await checked(db.auth.admin.createUser({ id: p.id, email: p.email, password: credentials[p.key].password, email_confirm: true, app_metadata: { seed_batch: BATCH, simulated: true, seed_executed_at: plan.executed_at, simulated_registered_at: p.created_at }, user_metadata: { display_name: p.display_name, username: p.username } }), 'create ' + p.key)).user;
    assert.equal(user.id, p.id); assert.equal(user.app_metadata.seed_batch, BATCH);
    if (!progress[p.key]) progress[p.key] = { id: user.id, actualCreatedAt: user.created_at, originalEmailConfirmedAt: user.email_confirmed_at, originalIdentities: user.identities };
    save('auth.json', progress);
    console.log(JSON.stringify({ authCreatedOrResumed: p.key, completed: Object.keys(progress).length }));
  }
}
function authSQL(plan, limit) {
  const progress = load('auth.json', {}), people = plan.people.slice(0, limit); people.forEach(p => assert.equal(progress[p.key]?.id, p.id));
  const values = people.map(p => `('${p.id}'::uuid,'${p.created_at}'::timestamptz)`).join(',\n');
  return `begin; set local lock_timeout='5s';\nselect pg_advisory_xact_lock(hashtext('${BATCH}'));\ndo $$ begin if (select count(*) from auth.users where id in (${people.map(p => `'${p.id}'`).join(',')}) and raw_app_meta_data->>'seed_batch'='${BATCH}') <> ${people.length} then raise exception 'Seed ownership mismatch'; end if; end $$;\nwith v(id,at) as (values ${values}) update auth.users u set created_at=v.at,email_confirmed_at=v.at+interval '1 minute' from v where u.id=v.id and u.raw_app_meta_data->>'seed_batch'='${BATCH}';\nwith v(id,at) as (values ${values}) update auth.identities i set created_at=v.at from v,auth.users u where i.user_id=v.id and u.id=i.user_id and u.raw_app_meta_data->>'seed_batch'='${BATCH}' and i.provider='email';\nwith v(id,at) as (values ${values}) update public.users u set created_at=v.at from v,auth.users a where u.id=v.id and a.id=u.id and a.raw_app_meta_data->>'seed_batch'='${BATCH}';\ncommit;\nselect count(*) as calibrated_users,min(created_at) as first_registration,max(created_at) as last_registration from auth.users where raw_app_meta_data->>'seed_batch'='${BATCH}';`;
}
async function login(db, plan, limit, verifyData = false) {
  const credentials = load('credentials.json', {}), results = [];
  for (const p of plan.people.slice(0, limit)) {
    const client = publicClient();
    try {
      const data = await checked(client.auth.signInWithPassword(credentials[p.key]), 'login ' + p.key);
      assert.equal(data.user.id, p.id); assert.equal(data.user.role, 'authenticated');
      assert.equal(Date.parse(data.user.created_at), Date.parse(p.created_at), 'Auth date calibration missing');
      const own = await checked(client.from('users').select('id').eq('id', p.id), 'own user'); assert.equal(own.length, 1);
      const other = plan.people.find(x => x.id !== p.id);
      const privateTables = verifyData ? ['users', 'reports', 'user_profile', 'quiz_attempts', 'user_credits', 'credit_events'] : ['users'];
      for (const table of privateTables) { const key = table === 'users' ? 'id' : 'user_id'; const forbidden = await checked(client.from(table).select(key).eq(key, other.id), 'cross-user read ' + table); assert.equal(forbidden.length, 0, 'Cross-user leak: ' + table); }
      if (verifyData) {
        const attempts = await checked(client.from('quiz_attempts').select('id').eq('user_id', p.id), 'own attempts'); assert.equal(attempts.length, p.attempts);
        const { getProfileSources } = require(path.join(ROOT, 'lib/user-profile-db.ts'));
        const { getSourceDetail } = require(path.join(ROOT, 'lib/source-detail-db.ts'));
        const sources = await getProfileSources(p.id, client); assert.equal(sources.length, p.attempts + plan.reports.filter(r => r.record.user_id === p.id).length);
        for (const type of ['quiz', 'report']) { const source = sources.find(s => s.source_type === type); if (source) assert.ok(await getSourceDetail(p.id, type, String(source.id), client)); }
      }
      results.push({ user: p.key, authDateMatches: true, ownRead: true, privateDataIsolation: true });
    } finally { const { error } = await client.auth.signOut(); if (error) throw new Error('Sign-out failed: ' + error.message); }
  }
  const filename = verifyData ? 'rls-verification.json' : 'login-verification.json';
  const previous = load(filename, []), merged = new Map(previous.map(r => [r.user, r])); results.forEach(r => merged.set(r.user, r));
  save(filename, [...merged.values()]); console.log(JSON.stringify({ loginVerified: results.length, cumulativeVerified: merged.size, privateDataIsolation: true }));
}

function comparable(row, expected) {
  const output = {};
  for (const key of Object.keys(expected)) {
    if (key === 'fused_into_profile') continue;
    const value = row[key], target = expected[key];
    output[key] = key.endsWith('_at') && value ? iso(value) : typeof target === 'number' && value !== null ? Number(value) : value;
  }
  return output;
}
async function insertExact(db, table, rows, conflict = 'id') {
  for (let start = 0; start < rows.length; start += 100) {
    const chunk = rows.slice(start, start + 100), current = await checked(db.from(table).select('*').in(conflict, chunk.map(r => r[conflict])), 'existing ' + table);
    const found = new Map(current.map(r => [r[conflict], r])), missing = [];
    for (const row of chunk) {
      const old = found.get(row[conflict]);
      if (old) assert.deepEqual(comparable(old, row), comparable(row, row), 'Existing record changed: ' + table + '/' + row[conflict]); else missing.push(row);
    }
    if (missing.length) await checked(db.from(table).insert(missing), 'insert ' + table);
  }
  console.log(JSON.stringify({ importedOrMatched: table, count: rows.length }));
}
async function image(db, objectPath, lines, bg) {
  const sharp = require('sharp'), esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  const height = Math.max(420, 100 + lines.length * 34);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="${height}"><rect width="900" height="${height}" fill="${bg}"/>${lines.map((line, i) => `<text x="48" y="${65 + i * 34}" font-family="Arial,sans-serif" font-size="22" fill="#222">${esc(line)}</text>`).join('')}</svg>`;
  const buffer = await sharp(Buffer.from(svg)).webp({ quality: 85 }).toBuffer(), digest = hash(buffer), assets = load('assets.json', {});
  if (!assets[objectPath]) {
    const result = await db.storage.from('quiz-result-images').upload(objectPath, buffer, { contentType: 'image/webp', upsert: false });
    if (result.error && result.error.message !== 'The resource already exists') throw new Error('Image upload: ' + result.error.message);
    // Also verify the bytes when recovering from a response lost after upload.
    const blob = await checked(db.storage.from('quiz-result-images').download(objectPath), 'verify uploaded bytes');
    assert.equal(hash(Buffer.from(await blob.arrayBuffer())), digest, 'Existing object collision');
    assets[objectPath] = { hash: digest, size: buffer.length }; save('assets.json', assets);
  } else assert.equal(assets[objectPath].hash, digest);
  return { url: db.storage.from('quiz-result-images').getPublicUrl(objectPath).data.publicUrl, hash: digest };
}
async function importData(db, plan) {
  assert.equal(Object.keys(load('auth.json', {})).length, 64, 'Create all 64 accounts first');
  for (const p of plan.people) {
    const auth = (await checked(db.auth.admin.getUserById(p.id), 'check auth date')).user;
    assert.equal(auth.app_metadata.seed_batch, BATCH); assert.equal(Date.parse(auth.created_at), Date.parse(p.created_at));
    const current = await checked(db.from('users').select('*').eq('id', p.id).single(), 'business user');
    assert.equal(current.email, p.email);
    if (current.username && current.username !== p.username) throw new Error('User profile modified since creation');
    await checked(db.from('users').update({ display_name: p.display_name, username: p.username }).eq('id', p.id), 'complete user');
    if ((plan.people.indexOf(p) + 1) % 16 === 0) console.log(JSON.stringify({ completedUserProfiles: plan.people.indexOf(p) + 1 }));
  }
  for (let i = 0; i < plan.tables.quiz_results.length; i += 4) {
    const result = plan.tables.quiz_results[i], asset = await image(db, `${BATCH}/results/${result.id}.webp`, ['SIMULATED RESULT', 'Quiz ' + (Math.floor(i / 4) + 1), 'The Observer', 'Thoughtful / Independent', 'Synthetic fixture for interface testing'], '#e8ede6');
    result.image_url = asset.url; plan.tables.quizzes[Math.floor(i / 4)].cover_image_url = asset.url;
  }
  for (const fixture of plan.reports.filter(r => r.record.input_type === 'screenshot')) {
    const asset = await image(db, `${BATCH}/reports/${fixture.key}.webp`, fixture.record.raw_text.split('\n'), '#f6f1e8');
    fixture.record.image_url = asset.url; fixture.record.image_hash = asset.hash;
  }
  console.log(JSON.stringify({ verifiedImageObjects: Object.keys(load('assets.json', {})).length }));
  const { computeHeatScore } = require(path.join(ROOT, 'lib/explore/sort.ts'));
  for (const q of plan.tables.quizzes) q.popularity_score = computeHeatScore(q.attempt_count, q.created_at);
  // Persist exact import values (including time-dependent heat) before the first insert.
  const alreadyPrepared = load('prepared-plan.json');
  if (alreadyPrepared) plan = alreadyPrepared; else save('prepared-plan.json', plan);
  for (const table of ['quizzes', 'quiz_factors', 'quiz_results', 'quiz_questions', 'quiz_options', 'quiz_attempts', 'quiz_attempt_answers']) await insertExact(db, table, plan.tables[table]);
  const reportIds = load('report-ids.json', {});
  const existing = await checked(db.from('reports').select('*').eq('raw_ai_response->>seed_batch', BATCH), 'existing reports');
  for (const fixture of plan.reports) {
    const row = existing.find(r => r.raw_ai_response.seed_report_key === fixture.key);
    if (row) { assert.deepEqual(comparable(row, fixture.record), comparable(fixture.record, fixture.record)); reportIds[fixture.key] = row.id; }
    else { const inserted = await checked(db.from('reports').insert(fixture.record).select('id').single(), 'insert report ' + fixture.key); reportIds[fixture.key] = inserted.id; }
    save('report-ids.json', reportIds);
  }
  for (const table of ['credit_events', 'user_credits', 'ai_usage_logs']) await insertExact(db, table, plan.tables[table], table === 'user_credits' ? 'user_id' : 'id');
  const { rebuildUserProfileFromAllSources } = require(path.join(ROOT, 'lib/rebuild-user-profile.ts'));
  const profiles = load('profiles.json', {});
  for (const p of plan.people) {
    const result = await rebuildUserProfileFromAllSources(p.id, db); assert.equal(result.ok, true);
    // Full rebuild deduplicates by quiz but only flags the winning attempts.
    // Mark superseded historical fixtures as handled too, so the next incremental
    // rebuild cannot fuse those old attempts as new input.
    await checked(db.from('quiz_attempts').update({ fused_into_profile: true }).in('id', plan.tables.quiz_attempts.filter(a => a.user_id === p.id).map(a => a.id)), 'mark historical attempts handled');
    const sourceTimes = [...plan.tables.quiz_attempts.filter(a => a.user_id === p.id).map(a => a.created_at), ...plan.reports.filter(r => r.record.user_id === p.id).map(r => r.record.created_at)].sort();
    const reportList = plan.reports.filter(r => r.record.user_id === p.id).map(r => reportIds[r.key]);
    await checked(db.from('user_profile').update({ updated_at: add(sourceTimes.at(-1), 0.01), source_report_ids: reportList }).eq('user_id', p.id), 'profile snapshot');
    profiles[p.key] = { report_count: result.report_count }; save('profiles.json', profiles);
    if (Object.keys(profiles).length % 16 === 0) console.log(JSON.stringify({ rebuiltProfiles: Object.keys(profiles).length }));
  }
  save('import-complete.json', { at: iso(Date.now()), summary: summary(plan) });
  console.log(JSON.stringify({ importComplete: true, ...summary(plan) }));
}

async function verify(db, plan) {
  const prepared = load('prepared-plan.json'); assert.ok(prepared && load('import-complete.json')); plan = prepared;
  const baseline = load('baseline.json'), current = await snapshot(db), unchanged = {};
  for (const table of TABLES) {
    const mismatches = Object.entries(baseline.tables[table]).filter(([id, digest]) => current[table][id] !== digest);
    assert.equal(mismatches.length, 0, 'Existing data changed in ' + table); unchanged[table] = Object.keys(baseline.tables[table]).length;
  }
  const originalAuth = await authUsers(db);
  for (const [id, digest] of Object.entries(baseline.auth)) { const user = originalAuth.find(u => u.id === id); assert.ok(user); assert.equal(hash({ id: user.id, email: user.email, created_at: user.created_at, app_metadata: user.app_metadata }), digest, 'Original Auth user modified'); }
  const checks = {};
  for (const [table, rows] of Object.entries(plan.tables)) {
    const key = table === 'user_credits' ? 'user_id' : 'id', remote = await allRows(db, table), matched = remote.filter(r => rows.some(x => x[key] === r[key]));
    assert.equal(matched.length, rows.length, table + ' count');
    for (const expected of rows) { const actual = matched.find(r => r[key] === expected[key]); assert.deepEqual(comparable(actual, expected), comparable(expected, expected), table + ' payload mismatch'); }
    checks[table] = matched.length;
  }
  const reports = await checked(db.from('reports').select('*').eq('raw_ai_response->>seed_batch', BATCH), 'verify reports'); assert.equal(reports.length, 40); checks.reports = reports.length;
  const profiles = await checked(db.from('user_profile').select('*').in('user_id', plan.people.map(p => p.id)), 'verify profiles'); assert.equal(profiles.length, 64);
  for (const p of plan.people) {
    const profile = profiles.find(r => r.user_id === p.id), attempts = plan.tables.quiz_attempts.filter(a => a.user_id === p.id);
    assert.equal(profile.report_count, new Set(attempts.map(a => a.quiz_id)).size + reports.filter(r => r.user_id === p.id).length);
    for (const [vector, keys] of [[profile.core_vector, KEYS.slice(0, 8)], [profile.social_vector, KEYS.slice(8)]]) for (const k of keys) { assert.ok(vector[k]); assert.ok(vector[k].value >= 0 && vector[k].value <= 100); assert.ok(vector[k].confidence >= 0 && vector[k].confidence <= 1); assert.ok(vector[k].count > 0); }
  }
  checks.user_profile = profiles.length;
  const { rebuildUserProfile } = require(path.join(ROOT, 'lib/rebuild-user-profile.ts'));
  const noNewSources = await rebuildUserProfile(plan.people[0].id, db);
  assert.equal(noNewSources.reason, 'NO_NEW_SOURCES', 'Historical sources would be fused again');
  for (const [objectPath, asset] of Object.entries(load('assets.json', {}))) {
    const blob = await checked(db.storage.from('quiz-result-images').download(objectPath), 'verify asset'); assert.equal(hash(Buffer.from(await blob.arrayBuffer())), asset.hash);
  }
  // All 64 Auth records were verified during import; authenticated page-data
  // helpers are sampled across heavy, ordinary, light, report and creator users.
  await login(db, plan, 2, true);
  for (const index of [20, 48, 63]) {
    const representative = { ...plan, people: [plan.people[index], ...plan.people.filter((_, i) => i !== index)] };
    await login(db, representative, 1, true);
  }
  const report = { batch: BATCH, verifiedAt: iso(Date.now()), counts: { ...checks, auth_users: originalAuth.filter(u => u.app_metadata.seed_batch === BATCH).length }, existingPublicRowsUnchanged: unchanged, originalAuthUsersUnchanged: Object.keys(baseline.auth).length, images: Object.keys(load('assets.json', {})).length, knownLimits: ['Synthetic OCR/model data; no external paid requests', 'Public lists and usage totals include simulation', 'guest_signup and per-user external click history are not implemented in current app', 'Full profile rebuild deduplicates repeated attempts per quiz'], passed: true };
  assert.equal(report.counts.auth_users, 64); save('verification.json', report); console.log(JSON.stringify(report));
}
function cleanupSQL(plan) {
  const ids = plan.people.map(p => `'${p.id}'`).join(','), qids = plan.tables.quizzes.map(q => `'${q.id}'`).join(',');
  return `-- Review only. Revoke simulation sessions before deleting Auth users; remove the exact Storage objects in assets.json through the Storage API.\nbegin; set local lock_timeout='5s';\ndo $$ begin if exists(select 1 from public.quiz_attempts where quiz_id in (${qids}) and (user_id is null or user_id not in (${ids}))) then raise exception 'External attempts depend on simulation quizzes'; end if; if (select count(*) from auth.users where id in (${ids}) and raw_app_meta_data->>'seed_batch'='${BATCH}') <> 64 then raise exception 'Seed ownership mismatch'; end if; end $$;\ndelete from public.quiz_attempt_answers where attempt_id in (select id from public.quiz_attempts where user_id in (${ids}));\ndelete from public.quiz_attempts where user_id in (${ids});\ndelete from public.reports where user_id in (${ids}) and raw_ai_response->>'seed_batch'='${BATCH}';\ndelete from public.user_profile where user_id in (${ids});\ndelete from public.credit_events where user_id in (${ids}) and metadata->>'seed_batch'='${BATCH}';\ndelete from public.user_credits where user_id in (${ids});\ndelete from public.ai_usage_logs where user_id in (${ids}) and metadata->>'seed_batch'='${BATCH}';\ndelete from public.quizzes where id in (${qids}) and creator_user_id in (${ids});\ndelete from public.users where id in (${ids});\ndelete from auth.users where id in (${ids}) and raw_app_meta_data->>'seed_batch'='${BATCH}';\ncommit;`;
}
async function main() {
  const command = process.argv[2] || 'preview';
  if (command === 'preview') {
    const refresh = process.argv[3] === '--refresh';
    if (refresh) assert.ok(!load('baseline.json') && !load('auth.json'), 'Cannot replace an execution plan after preflight');
    const plan = (!refresh && load('plan.json')) || buildPlan(); validatePlan(plan); save('plan.json', plan); save('preview.json', summary(plan)); console.log(JSON.stringify(summary(plan))); return;
  }
  const plan = getPlan(), limit = Number(process.argv[3] || 2); assert.ok([2, 64].includes(limit), 'Auth/login limit must be 2 or 64');
  if (command === 'auth-sql') { process.stdout.write(authSQL(plan, limit)); return; }
  if (command === 'cleanup-sql') { process.stdout.write(cleanupSQL(plan)); return; }
  const db = env(); runtime();
  if (command === 'preflight') await preflight(db, plan);
  else if (command === 'auth') await createAuth(db, plan, limit);
  else if (command === 'login') await login(db, plan, limit);
  else if (command === 'import') await importData(db, plan);
  else if (command === 'verify') await verify(db, plan);
  else throw new Error('Unknown command');
}
module.exports = { buildPlan, validatePlan, summary, runtime, BATCH, PROJECT, KEYS, MONTHS, hash, stable };
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
