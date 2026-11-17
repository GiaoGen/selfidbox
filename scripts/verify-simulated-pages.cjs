/* eslint-disable @typescript-eslint/no-require-imports */
// Read-only website/API smoke test, using only the newly created simulation accounts.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createServerClient } = require('@supabase/ssr');
const { chromium } = require('@playwright/test');
const { PROJECT, BATCH } = require('./seed-simulated-users.cjs');
const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, '.seed-data', BATCH);
const BASE = 'https://selfidbox.com';
const read = file => JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'));

async function main() {
  require('@next/env').loadEnvConfig(ROOT);
  assert.equal(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname, PROJECT + '.supabase.co');
  const plan = read('prepared-plan.json'), credentials = read('credentials.json');
  const executablePath = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe', chromium.executablePath()].find(file => fs.existsSync(file));
  assert.ok(executablePath, 'No browser installed');
  const browser = await chromium.launch({ executablePath, headless: true });
  const report = { batch: BATCH, origin: BASE, checkedAt: new Date().toISOString(), checks: [], browserErrors: [] };
  try {
    const publicContext = await browser.newContext();
    const publicPage = await publicContext.newPage();
    publicPage.on('pageerror', error => report.browserErrors.push({ url: publicPage.url(), message: error.message, stack: error.stack?.split('\n').slice(0, 5) }));
    for (const route of ['/explore?range=all&internal=1&search=' + encodeURIComponent('模拟'), '/quizzes/' + plan.tables.quizzes[0].slug, '/quiz/' + plan.tables.quizzes[0].slug]) {
      const response = await publicPage.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 60000 });
      assert.equal(response.status(), 200, 'Public page ' + route);
      await publicPage.getByText(plan.tables.quizzes[0].title, { exact: false }).first().waitFor({ state: 'visible', timeout: 30000 });
      report.checks.push({ route, status: response.status() });
    }
    await publicPage.screenshot({ path: path.join(DIR, 'quiz-page.png'), fullPage: true });
    await publicContext.close();

    for (const index of [0, 20, 48, 63]) {
      const person = plan.people[index], cookies = new Map();
      const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { autoRefreshToken: false }, cookies: { getAll: () => [...cookies.values()], setAll: updates => updates.forEach(cookie => cookies.set(cookie.name, cookie)) } });
      const auth = await client.auth.signInWithPassword(credentials[person.key]);
      if (auth.error) throw new Error('Website login: ' + auth.error.message);
      assert.equal(auth.data.user.id, person.id);
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      try {
        await context.addCookies([...cookies.values()].filter(c => c.value).map(c => ({ name: c.name, value: c.value, url: BASE, secure: true, sameSite: 'Lax' })));
        const page = await context.newPage();
        page.on('pageerror', error => report.browserErrors.push({ url: page.url(), user: person.key, message: error.message, stack: error.stack?.split('\n').slice(0, 5) }));
        const response = await page.goto(BASE + '/profile', { waitUntil: 'domcontentloaded', timeout: 60000 });
        assert.equal(response.status(), 200); assert.equal(new URL(page.url()).pathname, '/profile');
        await page.getByText('社交性', { exact: true }).first().waitFor({ state: 'visible', timeout: 30000 });
        const sourcesResponse = await context.request.get(BASE + '/api/profile/sources');
        assert.equal(sourcesResponse.status(), 200); const sourcesData = await sourcesResponse.json(); assert.equal(sourcesData.ok, true);
        assert.equal(sourcesData.sources.length, person.attempts + plan.reports.filter(r => r.record.user_id === person.id).length);
        for (const sourceType of ['quiz', 'report']) {
          const source = sourcesData.sources.find(s => s.source_type === sourceType);
          if (!source) continue;
          const detail = await context.request.get(BASE + '/api/profile/source-detail?source_type=' + sourceType + '&id=' + source.id);
          assert.equal(detail.status(), 200); assert.equal((await detail.json()).ok, true);
        }
        const otherAttempt = plan.tables.quiz_attempts.find(a => a.user_id !== person.id);
        const forbidden = await context.request.get(BASE + '/api/profile/source-detail?source_type=quiz&id=' + otherAttempt.id);
        assert.equal(forbidden.status(), 404, 'Cross-user website access');
        const quizzesResponse = await context.request.get(BASE + '/api/my-quizzes'); assert.equal(quizzesResponse.status(), 200);
        const quizzes = await quizzesResponse.json(); assert.equal(quizzes.ok, true);
        assert.equal(quizzes.quizzes.length, plan.tables.quizzes.filter(q => q.creator_user_id === person.id).length);
        const assets = await page.locator('img').evaluateAll(images => images.filter(img => img.src.includes('sim-20261102-v1')).map(img => ({ loaded: img.complete && img.naturalWidth > 0 })));
        assert.ok(assets.every(asset => asset.loaded));
        await page.screenshot({ path: path.join(DIR, 'profile-' + person.key + '.png'), fullPage: true });
        report.checks.push({ user: person.key, profile: 200, sources: sourcesData.sources.length, ownDetails: true, crossUserDetail: 404, authoredQuizzes: quizzes.quizzes.length });
        console.log(JSON.stringify(report.checks.at(-1)));
      } finally {
        await context.close();
        const logout = await client.auth.signOut(); if (logout.error) throw new Error('Website sign-out failed: ' + logout.error.message);
      }
    }
    report.functionalChecksPassed = true;
    report.browserRuntimeCheckPassed = report.browserErrors.length === 0;
    assert.equal(report.browserErrors.length, 0, 'Browser runtime errors'); report.passed = true;
  } catch (error) {
    report.passed = false; report.error = error.message; throw error;
  } finally {
    fs.writeFileSync(path.join(DIR, 'website-verification.json'), JSON.stringify(report, null, 2)); await browser.close();
  }
  console.log(JSON.stringify({ websiteVerification: 'passed', checks: report.checks.length, browserErrors: report.browserErrors.length }));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
