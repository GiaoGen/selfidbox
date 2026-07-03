---
name: web-scouting-limitations
description: Known blocking and access issues when scouting quiz sites for SelfIDBox
metadata:
  type: reference
---

## WebFetch Blocking

As of 2026-06-28, the claude.ai WebFetch tool is blocked by enterprise security policies for most quiz domains. This prevents direct page verification during scouting sessions.

**Blocked domains** (confirmed):
arealme.com, buzzfeed.com, uquiz.com, quizexpo.com, seemypersonality.com, gotoquiz.com, personalityfeed.com, tryinteract.com, brainrotquizzes.com, fungenerators.com, quiz.fan, psyctest.cn, testharo.com, qfeast.com, leaphope.com, 8games.net

**Why:** Likely Cloudflare/CDN protection, DDoS protection, or enterprise network policy.

**Workaround:** Rely on web search result evidence (titles, snippets, URLs, platform reputation) to verify quiz existence and basic accessibility. When a platform's free/no-login policy is well-documented across multiple search results, accept as sufficient evidence for candidate submission.

**When to skip a candidate:** If search results are ambiguous about login/paywall requirements, or if a platform has inconsistent reports about free access, exclude the candidate.

## Future session tips

- Always note in output whether URLs were verified via direct fetch or search evidence
- Prioritize platforms with consistent, well-documented free access policies
- Cross-reference candidate URLs across multiple search results when direct fetch fails
