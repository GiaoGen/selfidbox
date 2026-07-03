---
name: quiz-platforms-reference
description: Known quiz platforms, their characteristics, accessibility, and regional origins for SelfIDBox scouting
metadata:
  type: reference
---

## Confirmed Quiz Platforms

### Chinese-language platforms (CN source)
- **arealme.com** — Large collection of Chinese personality/psychology quizzes. Paths use `/cn/` suffix for Chinese. Free, no login. Covers: soul color, animal personality, shape personality, likeable person test, SBTI (32 types), MBTI, Enneagram. High quality, well-designed. WebFetch blocked (Cloudflare/CDN).
- **sbti.unun.dev** — Original SBTI test by B站 creator. Viral 2026. 27 personality types, ~31 questions. Free, no login. Pure entertainment.
- **psyctest.cn** — Massive Chinese test platform (~1790 tests). Supports 18 languages. Free tier has daily limits; VIP for unlimited. Has both professional scales (SCL-90, SDS) and fun quizzes. Be selective — exclude clinical tests. WebFetch blocked.
- **toolxq.com** — Hosts SBTI mirror and other tools.

### Korean platforms (KR source)
- **testharo.com** — Korean test platform. Core tests: MBTI (67q), Enneagram (63q), DISC (56q), Ideal MBTI (28q). Multi-language (KR, CN, JP, EN, TW). Free, no login required. Clean Next.js build. WebFetch blocked.

### Japanese platforms (JP source)
- **charatype.com** — Japanese MBTI-style personality diagnosis. ~5 min, 16 types, includes love compatibility + career advice. Free, no registration confirmed via search. Unknown if WebFetch accessible.
- **shindanmaker.com** — Japanese "diagnosis maker" platform. User-created diagnoses. Popular for VTuber/character generators. Niche and highly specific — each diagnosis is a separate page. NSFW content exists — filter carefully.

### English/international platforms
- **buzzfeed.com/quizzes** — Classic quiz platform. "Which character are you?", personality, lifestyle quizzes. Free, ads-supported. WebFetch blocked.
- **uquiz.com** — Community-created quizzes. Strong in aesthetic/vibe/soul-type niches. Free, no login. WebFetch blocked.
- **gotoquiz.com** — Long-running quiz platform. User-created. Explicitly "no pop-ups, no registration." Good for friendship, personality, color quizzes. WebFetch blocked.
- **quizexpo.com** — Clean quiz platform. 15-question format. Color, element, archetype quizzes. Free, no signup. WebFetch blocked.
- **quizpanda.com** — Modern quiz platform. Aesthetic, friendship, element quizzes. Free, no signup. WebFetch blocked.
- **brainrotquizzes.com** — Independent solo creator (Maya). Thoughtful, emotionally-aware quizzes. Aesthetic, soul animal, vibe quizzes. Free, no login. WebFetch blocked.
- **personalityfeed.com** — Self-reflection quizzes. "Am I unique?", "Am I toxic?" etc. Free, no signup. Entertainment/self-reflection only. WebFetch blocked.
- **lifeshouts.com** — Lifestyle and aesthetic quizzes. Minimalist vs maximalist, aesthetic matching. Free. WebFetch blocked.
- **idrlabs.com** — Academically-reviewed quizzes. Modern mental age test. Free, no login. Some tests have optional paid reports. WebFetch blocked.
- **wikihow.com** — Has quiz section. Archetype quiz (Jungian 12). Free, no signup. WebFetch blocked.
- **crystalknows.com** — Enneagram test. 1M+ users. Free, no signup for basic results. WebFetch blocked.
- **101planners.com** — Love language quiz. 12 questions, ~3 min. Free, no signup. Has partner comparison feature. WebFetch blocked.
- **calculife.com** — Calculator site with test section. Love language test (70 statements), Enneagram test. Browser-local scoring. Chinese version available. WebFetch blocked.
- **fungenerators.com** — Random quiz generator. Aesthetic vibe quiz. Free, no signup. WebFetch blocked.

### Apps (excluded from web scouting but noted)
- **Truetest** — Friendship/love quiz app. Google Play only.
- **PopTypes** — Clean quiz platform (MBTI, Big Five, Enneagram). Website + app.
- **5秒MBTI** — Korean 4-question MBTI app. Google Play only.

## WebFetch Limitations

As of 2026-06-28, WebFetch (claude.ai) is BLOCKED by enterprise security policies for most quiz domains:
- arealme.com — blocked
- buzzfeed.com — blocked
- uquiz.com — blocked
- quizexpo.com — blocked
- seemypersonality.com — blocked
- gotoquiz.com — blocked
- personalityfeed.com — blocked
- tryinteract.com — blocked
- brainrotquizzes.com — blocked
- fungenerators.com — blocked
- quiz.fan — blocked
- psyctest.cn — blocked
- testharo.com — blocked
- qfeast.com — blocked
- leaphope.com — blocked
- 8games.net — blocked

This means quiz verification must rely on search result evidence (titles, snippets, platform reputation) rather than direct page inspection. Future sessions should note this constraint.

## Successful Search Queries

- `"what animal are you" personality quiz free online no registration` — Good results across multiple platforms
- `arealme.com 中文 心理测试 趣味` — Returns specific quiz pages with `/cn/` paths
- `free enneagram test online no signup` — Multiple platforms with detailed comparison
- `uquiz.com/personality-quizzes what aesthetic` — Returns specific uquiz quiz URLs
- `buzzfeed "which character are you" quiz` — Many character quiz URLs
- `color personality test online free interactive` — Good discovery across quizexpo, gotoquiz
- `free love language test no signup` — Multiple options (101planners, calculife)
