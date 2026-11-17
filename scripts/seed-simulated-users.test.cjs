/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildPlan, validatePlan, KEYS } = require('./seed-simulated-users.cjs');
const cutoff = '2026-11-02T10:00:00.000Z';
const plan = buildPlan(cutoff);

test('fixed input gives reproducible IDs, allocations and payloads', () => {
  assert.deepEqual(buildPlan(cutoff), plan);
});

test('invalid cross-quiz answers and missing answers fail before writes', () => {
  const corrupt = structuredClone(plan);
  corrupt.tables.quiz_attempt_answers[0].option_id = corrupt.tables.quiz_options.find(o => o.quiz_id !== corrupt.tables.quiz_attempt_answers[0].quiz_id).id;
  assert.throws(() => validatePlan(corrupt));
  const missing = structuredClone(plan);
  missing.tables.quiz_attempt_answers.pop();
  assert.throws(() => validatePlan(missing));
});

test('historical inputs cannot precede signup or lose monthly coverage', () => {
  const corrupt = structuredClone(plan);
  corrupt.tables.quiz_attempts[0].created_at = '2026-05-01T00:00:00.000Z';
  assert.throws(() => validatePlan(corrupt));
});

test('failed upstream calls have neither token usage nor credit spend', () => {
  const failed = plan.tables.ai_usage_logs.filter(l => !l.success);
  assert.equal(failed.length, 8);
  for (const log of failed) {
    assert.equal(log.total_tokens, 0);
    assert.equal(log.metadata.charged, false);
    assert.ok(!plan.tables.credit_events.some(e => e.type === 'ai_generate' && e.reference_id === log.id));
  }
  assert.equal(plan.tables.credit_events.filter(e => e.type === 'ai_generate').length, 32);
});

test('creator rewards are unique and exclude self-completions', () => {
  const rewards = plan.tables.credit_events.filter(e => e.type === 'quiz_completed');
  assert.equal(new Set(rewards.map(e => e.user_id + ':' + e.reference_id)).size, rewards.length);
  for (const reward of rewards) {
    const [quizId, userId] = reward.reference_id.split('::');
    assert.notEqual(userId, reward.user_id);
    assert.equal(plan.tables.quizzes.find(q => q.id === quizId).creator_user_id, reward.user_id);
    assert.ok(plan.tables.quiz_attempts.some(a => a.quiz_id === quizId && a.user_id === userId && a.created_at === reward.created_at));
  }
});

test('screenshots have matching synthetic transcript and all sixteen dimensions', () => {
  assert.equal(plan.reports.filter(r => r.record.input_type === 'screenshot').length, 16);
  assert.equal(plan.reports.filter(r => r.record.input_type === 'email').length, 24);
  for (const { record } of plan.reports) {
    assert.deepEqual(Object.keys({ ...record.core_vector, ...record.social_vector }), KEYS);
    if (record.input_type === 'screenshot') assert.equal(record.ocr_text, record.raw_text);
  }
});
