/* eslint-disable @typescript-eslint/no-require-imports */
// User-requested revision of one existing batch. prepare is read-only remotely;
// sql emits one guarded transaction; verify is read-only apart from sample logins.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { BATCH, PROJECT, runtime, hash } = require('./seed-simulated-users.cjs');
const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, '.seed-data', BATCH);
const REVISION = 'natural-profiles-v1';
const read = name => JSON.parse(fs.readFileSync(path.join(DIR, name), 'utf8'));
const write = (name, value) => fs.writeFileSync(path.join(DIR, name), JSON.stringify(value, null, 2));
const NAMES = ['芋泥少加糖', '南风慢慢', '小陈不想早八', '周末再说', '不加冰的柠檬茶', '今天也想摸鱼', '阿橘', '眠山', '拾一', '小狗在听雨', 'momo_7', '一颗青提', '白日梦收集员', '山茶没有花', '晚点回消息', '抱走一只猫', '阿舟_', '春困选手', '薄荷苏打水', '小周又迟到了', '月亮营业中', 'Haru.', '想去海边吹风', '松鼠不松', '咸鱼翻个面', '七点半的云', '树影斑驳', '今天吃点啥', '橙子汽水儿', '别叫我起床', '蓝莓司康', '奶油蘑菇汤', 'linlin呀', '卷毛小熊', '寄一封晚风', '小岛来信', 'Pluto_96', '雨停之后', '阿眠没睡醒', '芝士焗饭', '努力不熬夜', '半杯乌龙', '路过人间的猫', '发呆一小会', 'Zzz小林', '海盐味的夏天', '听说你也喜欢雨', '布丁有点甜', '银河漫游者', '林间有风', '一口蛋挞', 'Kiki的小日常', '冰美式续命', '不想取名字了喂', '春日迟迟', 'Mori__', '地球观察日记', '向晚的风', '桃子碎冰冰', '存一点快乐', '阿梨呀', '凌晨两点的月亮', '下次一定早睡', '路边一朵云'];
const DESCRIPTIONS = [
  '难得空下来的周末，你会把时间交给朋友、兴趣还是独处？从几个日常选择里，找到最适合自己的充电方式。',
  '有人擅长带头推进，有人负责串联想法，也有人总能稳住细节。看看合作时，你习惯用怎样的节奏让团队前进。',
  '走进一座陌生城市，你先翻攻略、寻找小店，还是随心走进一条街？用旅行中的小选择，画出你的探索路线。',
  '计划赶不上变化时，有人迅速行动，有人先观察局面。看看你的第一反应里，藏着怎样的适应方式。',
  '一句闲聊、一段旋律或一个未解的问题，都可能点亮灵感。看看什么最容易唤醒你的好奇心与创造欲。',
  '靠近一点还是留些空间，表达需要还是慢慢等待？从相处细节里，看看让你舒服的关系距离。',
  '如果深夜还有一家亮着灯的书店，你会翻开哪本书，又愿意停留多久？在书架之间寻找与你共鸣的生活姿态。',
  '专注的清晨、自在的午休和有边界的下班，怎样搭配才合你心意？拼出属于你的理想工作日。',
  '聊天、倾听、表达分歧时，我们都有自己习惯的方式。看看你的沟通风格，可能给朋友留下怎样的印象。',
  '行程排满才安心，还是给偶遇留一点位置？从出发前到旅途中的选择，发现你的旅行偏好。',
  '面临选择时，你更相信分析、直觉、经验还是身边人的感受？找一找平时为你指路的决策指南针。',
  '你的创意像晴天一样直接，还是像细雨一样慢慢酝酿？从面对新点子的习惯，认识自己的创造力气候。',
  '窗边的座位、熟悉的咖啡和偶然的谈话，组成怎样的午后？看看你在咖啡馆里最自在的角色。',
  '从约时间到照顾现场气氛，一场聚会有许多不同的安排方式。看看你习惯怎样把大家聚在一起。',
  '意见不同的时候，你会直接说明、耐心解释，还是先给彼此一点时间？探索你面对分歧时的表达习惯。',
  '情绪有时晴朗，有时多云，也需要合适的出口。从日常反应里，看看你如何察觉和安顿自己的感受。',
  '分享琐事、留意细节、表达关心，亲密往往藏在小习惯里。看看你习惯怎样靠近重要的人。',
  '先找方向、列清单、拉人讨论，还是做出第一个版本？看看新项目开始时，你最自然的行动路径。',
  '一个人的时间可以安静、热闹、充实或漫无目的。为自己的独处时光选一种最贴切的颜色。',
  '熟悉的邻居、自在的边界、热闹的公共空间，你最看重什么？拼出让你愿意长久生活的社区模样。',
  '如果时间和精力只能先给一件事，你会怎样排列梦想？看看你的愿望清单背后，最在意的生活价值。',
  '沿着街巷散步，有人追随风景，有人观察人群，也有人寻找新的目的地。走出一张属于你的城市人格地图。',
  '遇到新知识时，怎样学才容易进入状态？从理解、练习与交流的偏好，找到适合自己的学习补给站。',
  '忙碌之后，你需要安静、运动、陪伴还是重新整理生活？看看压力来临时，什么最能帮助你恢复节奏。',
];
function seededRandom() { let n = 19372461; return () => ((n = Math.imul(n ^ n >>> 15, 2246822519) >>> 0) / 4294967296); }
function iso(time) { return new Date(time).toISOString(); }
function uuid(label) { const h = crypto.createHash('md5').update(REVISION + ':' + label).digest('hex'); return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`; }
function env() {
  require('@next/env').loadEnvConfig(ROOT);
  assert.equal(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname, PROJECT + '.supabase.co');
  return require('@supabase/supabase-js').createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}
async function checked(request, label) { const r = await request; if(r.error) throw new Error(label + ': ' + r.error.message); return r.data; }
async function rows(db, table) {
  const key = ['user_profile','user_credits'].includes(table) ? 'user_id' : 'id', result=[];
  for(let i=0;;i+=1000) { const data=await checked(db.from(table).select('*').order(key).range(i,i+999), table); result.push(...data); if(data.length<1000) return result; }
}
function emailFor(domain, rng, occupied) {
  const words=['yue','summer','lin','mori','blue','orange','chen','hana','iris','river','lemon','xing','qiu','mint','cloud','wen'];
  const pick=()=>words[Math.floor(rng()*words.length)], number=n=>String(Math.floor(rng()*10**n)).padStart(n,'0');
  for(let i=0;i<100;i++) {
    let local;
    if(domain==='qq.com') local=String(1+Math.floor(rng()*9))+number(7+Math.floor(rng()*3));
    else { const kind=Math.floor(rng()*5); local=kind===0 ? pick()+number(4) : kind===1 ? pick()+'.'+pick()+number(2) : kind===2 ? pick()+pick()+number(3) : kind===3 ? pick()+'_'+number(5) : pick()+number(2)+pick(); if(domain==='gmail.com') local=local.replaceAll('_','.'); }
    const email=local+'@'+domain;
    if(!occupied.has(email)) {occupied.add(email);return email;}
  }
  throw new Error('Email allocation exhausted');
}
function assembleQuiz(quiz,snapshot) {
  const factors=snapshot.quiz_factors.filter(x=>x.quiz_id===quiz.id).sort((a,b)=>a.sort_order-b.sort_order);
  const results=snapshot.quiz_results.filter(x=>x.quiz_id===quiz.id).sort((a,b)=>a.sort_order-b.sort_order);
  const questions=snapshot.quiz_questions.filter(x=>x.quiz_id===quiz.id).sort((a,b)=>a.question_order-b.question_order).map(q=>({...q,options:snapshot.quiz_options.filter(o=>o.question_id===q.id).sort((a,b)=>a.option_order-b.option_order)}));
  if(!factors.length||!results.length||!questions.length||questions.some(q=>q.options.length<2))return null;
  if(results.some(r=>!r.result_vector||Object.values(r.result_vector).some(v=>typeof v!=='number'||!Number.isFinite(v))))return null;
  if(questions.some(q=>q.options.some(o=>!o.factor_effects||Object.values(o.factor_effects).some(v=>typeof v!=='number'||!Number.isFinite(v)))))return null;
  return {...quiz,factors,results,questions};
}
async function profilesFromSources(people, attempts, reports, snapshot) {
  const {rebuildUserProfileFromAllSources}=require(path.join(ROOT,'lib/rebuild-user-profile.ts'));
  const profiles=[];
  for(const person of people) {
    let payload;
    const mock={from(table) {
      const filters=[], state={order:null};
      const query={select(){return query;},eq(k,v){filters.push([k,v]);return query;},order(k,options){state.order=[k,options];return query;},then(resolve,reject){try{let data=(table==='reports'?reports:attempts).filter(r=>filters.every(([k,v])=>r[k]===v));if(state.order)data=[...data].sort((a,b)=>state.order[1]?.ascending===false?String(b[state.order[0]]).localeCompare(String(a[state.order[0]])):String(a[state.order[0]]).localeCompare(String(b[state.order[0]])));return Promise.resolve({data,error:null}).then(resolve,reject);}catch(e){return Promise.reject(e).then(resolve,reject);}},upsert(value){payload=value;return Promise.resolve({error:null});},update(){return {in(){return Promise.resolve({error:null});}};}};
      return query;
    }};
    const result=await rebuildUserProfileFromAllSources(person.id,mock);assert.equal(result.ok,true);
    assert.ok(payload);
    const previous=snapshot.user_profile.find(p=>p.user_id===person.id);
    profiles.push({...payload,updated_at:previous.updated_at,source_report_ids:previous.source_report_ids});
  }
  return profiles;
}
async function prepare(db) {
  assert.ok(!fs.existsSync(path.join(DIR,'revision-plan.json')),'Revision already prepared; inspect existing plan');
  const original=read('prepared-plan.json'), ids=new Set(original.people.map(p=>p.id)), ownQuizzes=new Set(original.tables.quizzes.map(q=>q.id));
  const tables=['users','quizzes','quiz_factors','quiz_results','quiz_questions','quiz_options','quiz_attempts','quiz_attempt_answers','reports','user_profile','user_credits','credit_events'];
  const results=await Promise.allSettled(tables.map(async t=>[t,await rows(db,t)]));
  const snapshot={};for(const r of results){if(r.status==='rejected')throw r.reason;snapshot[r.value[0]]=r.value[1];}
  const auth=await checked(db.auth.admin.listUsers({page:1,perPage:1000}),'auth list');
  const authOwned=auth.users.filter(u=>ids.has(u.id));assert.equal(authOwned.length,64);authOwned.forEach(u=>assert.equal(u.app_metadata.seed_batch,BATCH));
  const attempts=snapshot.quiz_attempts.filter(a=>ids.has(a.user_id));assert.equal(attempts.length,432);
  assert.equal(snapshot.quizzes.filter(q=>ownQuizzes.has(q.id)).length,24);
  const initialAttemptIds=new Set(original.tables.quiz_attempts.map(a=>a.id));
  const protectedAttempts=snapshot.quiz_attempts.filter(a=>!ids.has(a.user_id)||!initialAttemptIds.has(a.id));
  const rng=seededRandom(), occupied=new Set([...auth.users.map(u=>u.email),...snapshot.users.map(u=>u.email)]), usernames=new Set(snapshot.users.filter(u=>!ids.has(u.id)).map(u=>u.username));
  const names=[...NAMES];for(let i=names.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[names[i],names[j]]=[names[j],names[i]];}
  const people=original.people.map((p,i)=>{let username=names[i];while(usernames.has(username))username+='.';usernames.add(username);return {...p,display_name:null,username,email:emailFor(p.email.split('@')[1],rng,occupied)};});
  const quizPatches=original.tables.quizzes.map((q,i)=>({id:q.id,title:q.title.replace(/^模拟[·：:\s]*/,''),description:DESCRIPTIONS[i],status:'sandbox',cover_image_url:null,published_at:null}));
  const newQuizzes=snapshot.quizzes.filter(q=>ownQuizzes.has(q.id)).map(q=>assembleQuiz(q,snapshot));assert.ok(newQuizzes.every(Boolean));
  const oldQuizzes=snapshot.quizzes.filter(q=>!ownQuizzes.has(q.id)&&q.status==='published').map(q=>assembleQuiz(q,snapshot)).filter(Boolean);assert.ok(oldQuizzes.length>0);
  const {calculateUserVector,rankRuntimeResultsV2}=runtime();
  const allNewCounts=new Map(newQuizzes.map(q=>[q.id,protectedAttempts.filter(a=>a.quiz_id===q.id).length])), usedOld=new Map(people.map(p=>[p.id,new Set()])), patches=[];
  for(const attempt of [...attempts].sort((a,b)=>a.created_at.localeCompare(b.created_at))) {
    if(!initialAttemptIds.has(attempt.id)){if(!ownQuizzes.has(attempt.quiz_id))usedOld.get(attempt.user_id).add(attempt.quiz_id);continue;}
    const person=people.find(p=>p.id===attempt.user_id), available=q=>Date.parse(q.published_at||q.created_at)<=Date.parse(attempt.created_at);
    let old=oldQuizzes.filter(available), fresh=old.filter(q=>!usedOld.get(person.id).has(q.id));if(fresh.length)old=fresh;
    const local=newQuizzes.filter(q=>Date.parse(q.created_at)<=Date.parse(attempt.created_at)&&allNewCounts.get(q.id)<20);
    const useOld=old.length&&(!usedOld.get(person.id).size||rng()<0.7||!local.length);
    let q;
    if(useOld){q=old[Math.floor(rng()*old.length)];usedOld.get(person.id).add(q.id);}
    else{assert.ok(local.length,'Sandbox capacity exceeded');const min=Math.min(...local.map(x=>allNewCounts.get(x.id)));const pool=local.filter(x=>allNewCounts.get(x.id)<=min+1);q=pool[Math.floor(rng()*pool.length)];allNewCounts.set(q.id,allNewCounts.get(q.id)+1);}
    if(q.id===attempt.quiz_id)continue;
    const factorKeys=q.factors.map(f=>f.key);
    const answers=q.questions.map(question=>{const options=question.options.map(option=>({option,score:Object.entries(option.factor_effects).reduce((s,[k,v])=>s+((person.preference[k]??50)-50+(rng()-0.5)*40)*v,0)})).sort((a,b)=>b.score-a.score);return {questionId:question.id,optionId:options[0].option.id,effects:options[0].option.factor_effects};});
    const vector=calculateUserVector(factorKeys,answers), {ranked}=rankRuntimeResultsV2(vector,q.results,q.questions,factorKeys), top=ranked[0].result;
    const weight=Math.min(.95,Math.max(.05,((100-(q.abstractness??50))+(q.seriousness??50)+(q.depth??50)+(100-(q.poeticness??50))+(100-(q.title_relevance??50))+(100-(q.goofiness??50)))/600));
    patches.push({id:attempt.id,user_id:person.id,quiz_id:q.id,user_vector:vector,similarity_ranking:ranked.slice(0,3).map(r=>({result_key:r.result.key,result_name:r.result.name,similarity:r.similarity})),final_result_id:top.id,final_result_key:top.key,final_result_name:top.name,profile_weight:weight,answers:answers.map(a=>a.optionId)});
  }
  assert.ok([...usedOld.values()].every(x=>x.size>0),'Every user must have an original quiz attempt');
  const revisedAttempts=attempts.map(a=>({...a,...patches.find(p=>p.id===a.id),fused_into_profile:true}));
  const rewards=[], seen=new Set(snapshot.credit_events.filter(e=>e.type==='quiz_completed'&&e.metadata?.seed_batch!==BATCH).map(e=>e.reference_id));
  for(const a of [...revisedAttempts].sort((a,b)=>a.created_at.localeCompare(b.created_at))) {const q=snapshot.quizzes.find(q=>q.id===a.quiz_id),reference=`${q.id}::${a.user_id}`;if(q.creator_user_id&&q.creator_user_id!==a.user_id&&!seen.has(reference)){seen.add(reference);rewards.push({id:uuid(reference),user_id:q.creator_user_id,type:'quiz_completed',amount:1,reference_id:reference,metadata:{seed_batch:BATCH,seed_revision:REVISION},created_at:a.created_at});}}
  const previousRewards=snapshot.credit_events.filter(e=>e.type==='quiz_completed'&&e.metadata?.seed_batch===BATCH);
  const recipients=new Set([...previousRewards,...rewards].map(e=>e.user_id)), creditAdjustments=[];
  for(const userId of recipients) {
    const old=snapshot.user_credits.find(c=>c.user_id===userId), before=previousRewards.filter(e=>e.user_id===userId).reduce((s,e)=>s+e.amount,0), after=rewards.filter(e=>e.user_id===userId).length;
    const first=rewards.filter(e=>e.user_id===userId).map(e=>e.created_at).sort()[0];
    creditAdjustments.push({user_id:userId,delta:after-before,old:old||null,first:first||null});
  }
  const counts=snapshot.quizzes.filter(q=>ownQuizzes.has(q.id)||revisedAttempts.some(a=>a.quiz_id===q.id)).map(q=>({id:q.id,before:q.attempt_count??0,protected:snapshot.quiz_attempts.filter(a=>a.quiz_id===q.id&&!ids.has(a.user_id)).length,after:(ownQuizzes.has(q.id)?snapshot.quiz_attempts.filter(a=>a.quiz_id===q.id&&!ids.has(a.user_id)).length:(q.attempt_count??0)-attempts.filter(a=>a.quiz_id===q.id).length)+revisedAttempts.filter(a=>a.quiz_id===q.id).length}));
  counts.filter(q=>ownQuizzes.has(q.id)).forEach(q=>assert.ok(q.after<=20));
  const profiles=await profilesFromSources(people,revisedAttempts,snapshot.reports.filter(r=>ids.has(r.user_id)),snapshot);
  const plan={revision:REVISION,batch:BATCH,project:PROJECT,preparedAt:iso(Date.now()),people,quizPatches,patches,revisedAttempts,profiles,rewards,creditAdjustments,counts,oldQuizIds:oldQuizzes.map(q=>q.id),summary:{users:64,quizzes:24,reassignedAttempts:patches.length,originalQuizAttempts:revisedAttempts.filter(a=>!ownQuizzes.has(a.quiz_id)).length,originalQuizzesUsed:new Set(revisedAttempts.filter(a=>!ownQuizzes.has(a.quiz_id)).map(a=>a.quiz_id)).size,maxSandboxAttempts:Math.max(...counts.filter(q=>ownQuizzes.has(q.id)).map(q=>q.after)),totalAttempts:432,protectedNonBatchOnNewQuizzes:protectedAttempts.filter(a=>ownQuizzes.has(a.quiz_id)&&!ids.has(a.user_id)).length,protectedLaterBatchAttempts:attempts.filter(a=>!initialAttemptIds.has(a.id)).length}};
  write('revision-before.json',{...snapshot,auth:authOwned});write('revision-plan.json',plan);fs.writeFileSync(path.join(DIR,'revision.sql'),sql(plan));console.log(JSON.stringify(plan.summary));
}
function sql(plan,{rollback=false}={}) {
  const literal=value=>{const text=JSON.stringify(value),delimiter='$rev_'+hash(text).slice(0,24)+'$';assert.ok(!text.includes(delimiter));return delimiter+text+delimiter+'::jsonb';};
  return `begin; set local lock_timeout='5s'; select pg_advisory_xact_lock(hashtext('${BATCH}'));
do $revision$ declare
 people jsonb := ${literal(plan.people.map(p=>({id:p.id,email:p.email,username:p.username})))};
 quizzes jsonb := ${literal(plan.quizPatches)};
 attempts jsonb := ${literal(plan.patches)};
 profiles jsonb := ${literal(plan.profiles)};
 rewards jsonb := ${literal(plan.rewards)};
 credits jsonb := ${literal(plan.creditAdjustments)};
 counts jsonb := ${literal(plan.counts)};
 credit_row record;
begin
 if (select count(*) from auth.users u join jsonb_to_recordset(people) p(id uuid) on p.id=u.id where u.raw_app_meta_data->>'seed_batch'='${BATCH}')<>64 then raise exception 'Batch identity mismatch'; end if;
 if exists(select 1 from auth.users u join jsonb_to_recordset(people) p(id uuid) on p.id=u.id where u.raw_app_meta_data->>'seed_revision'='${REVISION}') then raise exception 'Revision already applied; verify instead of replay'; end if;
 if (select count(*) from public.quiz_attempts where user_id in(select (x->>'id')::uuid from jsonb_array_elements(people)x))<>432 then raise exception 'Attempt set changed'; end if;
 if exists(select 1 from auth.users u join jsonb_to_recordset(people)p(id uuid,email text) on lower(u.email)=lower(p.email) where u.id<>p.id) then raise exception 'Email conflict'; end if;
 if exists(select 1 from public.users u join jsonb_to_recordset(people)p(id uuid,username text) on u.username=p.username where u.id<>p.id) then raise exception 'Username conflict'; end if;
 if exists(select 1 from public.quizzes q join jsonb_to_recordset(counts)v(id uuid,before integer) on v.id=q.id where coalesce(q.attempt_count,0)<>v.before) then raise exception 'Quiz counters changed'; end if;
 if exists(select 1 from jsonb_to_recordset(counts)c(id uuid,protected integer) where c.id in(select (x->>'id')::uuid from jsonb_array_elements(quizzes)x) and c.protected<>(select count(*) from public.quiz_attempts a where a.quiz_id=c.id and (a.user_id is null or a.user_id not in(select (x->>'id')::uuid from jsonb_array_elements(people)x)))) then raise exception 'External attempt set changed'; end if;
 update auth.users u set email=p.email,raw_user_meta_data=(coalesce(u.raw_user_meta_data,'{}'::jsonb)-'display_name')||jsonb_build_object('username',p.username),raw_app_meta_data=u.raw_app_meta_data||jsonb_build_object('seed_revision','${REVISION}'),updated_at=now() from jsonb_to_recordset(people)p(id uuid,email text,username text) where u.id=p.id;
 update auth.identities i set identity_data=jsonb_set(i.identity_data,'{email}',to_jsonb(p.email)),updated_at=now() from jsonb_to_recordset(people)p(id uuid,email text) where i.user_id=p.id and i.provider='email';
 update public.users u set display_name=null,email=p.email,username=p.username from jsonb_to_recordset(people)p(id uuid,email text,username text) where u.id=p.id;
 update public.reports r set from_email=p.email from jsonb_to_recordset(people)p(id uuid,email text) where r.user_id=p.id and r.input_type='email' and r.raw_ai_response->>'seed_batch'='${BATCH}';
 update public.quizzes q set title=v.title,description=v.description,status='sandbox',cover_image_url=null,published_at=null from jsonb_to_recordset(quizzes)v(id uuid,title text,description text) where q.id=v.id;
 update public.quiz_results r set description=case r.key when 'r1' then '你习惯先观察细节，再按自己的节奏作出选择。' when 'r2' then '你会留意人与人之间的感受，在相处和行动中寻找舒服的平衡。' when 'r3' then '新鲜的可能性容易吸引你，你愿意通过尝试发现新的方向。' else '你倾向于明确方向、主动行动，把想法逐步落到实际生活中。' end||'面对「'||q.title||'」里的日常情境，这份偏好也许会成为你的自然回应。' from jsonb_to_recordset(quizzes)q(id uuid,title text) where r.quiz_id=q.id;
 update public.quiz_factors f set description='观察你在'||f.name||'方面的日常倾向。' where f.quiz_id in(select (x->>'id')::uuid from jsonb_array_elements(quizzes)x);
 update public.quiz_attempts a set quiz_id=v.quiz_id,user_vector=v.user_vector,similarity_ranking=v.similarity_ranking,final_result_id=v.final_result_id,final_result_key=v.final_result_key,final_result_name=v.final_result_name,profile_weight=v.profile_weight,fused_into_profile=true from jsonb_populate_recordset(null::public.quiz_attempts,attempts)v where a.id=v.id;
 delete from public.quiz_attempt_answers where attempt_id in(select (x->>'id')::uuid from jsonb_array_elements(attempts)x);
 insert into public.quiz_attempt_answers(attempt_id,quiz_id,question_id,option_id,created_at) select a.id,a.quiz_id,o.question_id,o.id,a.created_at from jsonb_to_recordset(attempts)v(id uuid,answers jsonb) cross join lateral jsonb_array_elements_text(v.answers) opt join public.quiz_options o on o.id=opt.value::uuid join public.quiz_attempts a on a.id=v.id;
 update public.quizzes q set attempt_count=v.after from jsonb_to_recordset(counts)v(id uuid,after integer) where q.id=v.id;
 delete from public.credit_events where type='quiz_completed' and metadata->>'seed_batch'='${BATCH}';
 insert into public.credit_events select * from jsonb_populate_recordset(null::public.credit_events,rewards);
 for credit_row in select * from jsonb_to_recordset(credits)v(user_id uuid,delta integer,old jsonb,first timestamptz) loop
  if credit_row.old is not null and credit_row.old<>'null'::jsonb then
   if not exists(select 1 from public.user_credits u where u.user_id=credit_row.user_id and to_jsonb(u)=credit_row.old) then raise exception 'Credit account changed'; end if;
   update public.user_credits set bonus_credits=bonus_credits+credit_row.delta where user_id=credit_row.user_id;
  else
   insert into public.user_credits(user_id,base_credits,bonus_credits,used_credits,base_refilled_at,updated_at) values(credit_row.user_id,20,credit_row.delta,0,credit_row.first,credit_row.first);
   insert into public.credit_events(user_id,type,amount,metadata,created_at) values(credit_row.user_id,'base_monthly',20,jsonb_build_object('seed_batch','${BATCH}','seed_revision','${REVISION}'),credit_row.first);
  end if;
 end loop;
 update public.user_profile p set core_vector=v.core_vector,social_vector=v.social_vector,report_count=v.report_count,updated_at=v.updated_at,source_report_ids=v.source_report_ids from jsonb_populate_recordset(null::public.user_profile,profiles)v where p.user_id=v.user_id;
 update public.quiz_attempts set fused_into_profile=true where user_id in(select (x->>'id')::uuid from jsonb_array_elements(people)x);
 if exists(select 1 from public.user_credits where user_id in(select (x->>'user_id')::uuid from jsonb_array_elements(credits)x) and base_credits+bonus_credits-used_credits<0) then raise exception 'Negative balance'; end if;
end $revision$;
${rollback?'rollback':'commit'};
select '${REVISION}' as ${rollback?'validated_revision_rolled_back':'applied_revision'},64 as users_updated,24 as quizzes_updated,${plan.patches.length} as reassigned_attempts;`;
}
async function verify(db) {
  const plan=read('revision-plan.json'), before=read('revision-before.json'), ids=plan.people.map(p=>p.id);
  const tables=['users','quizzes','quiz_attempts','quiz_attempt_answers','user_profile','user_credits','credit_events'];
  const current={};const settled=await Promise.allSettled(tables.map(async t=>[t,await rows(db,t)]));for(const result of settled){if(result.status==='rejected')throw result.reason;current[result.value[0]]=result.value[1];}
  const auth=await checked(db.auth.admin.listUsers({page:1,perPage:1000}),'auth');
  for(const person of plan.people){const u=current.users.find(u=>u.id===person.id),a=auth.users.find(u=>u.id===person.id);assert.equal(u.display_name,null);assert.equal(u.username,person.username);assert.equal(u.email,person.email);assert.equal(a.email,person.email);assert.ok(!('display_name' in a.user_metadata));assert.equal(a.app_metadata.seed_revision,REVISION);if(person.email.endsWith('@qq.com'))assert.match(person.email,/^\d+@qq\.com$/);}
  for(const q of plan.quizPatches){const actual=current.quizzes.find(x=>x.id===q.id);for(const key of ['title','description','status','cover_image_url','published_at'])assert.deepEqual(actual[key],q[key]);assert.ok(actual.attempt_count<=20);}
  const owned=current.quiz_attempts.filter(a=>ids.includes(a.user_id));assert.equal(owned.length,432);
  const options=new Map(before.quiz_options.map(o=>[o.id,o]));
  for(const a of owned){const answers=current.quiz_attempt_answers.filter(x=>x.attempt_id===a.id),count=before.quiz_questions.filter(q=>q.quiz_id===a.quiz_id).length;assert.equal(answers.length,count);assert.equal(new Set(answers.map(x=>x.question_id)).size,count);for(const answer of answers){const option=options.get(answer.option_id);assert.equal(answer.quiz_id,a.quiz_id);assert.equal(option.quiz_id,a.quiz_id);assert.equal(option.question_id,answer.question_id);}const expected=plan.revisedAttempts.find(x=>x.id===a.id);for(const key of ['quiz_id','user_vector','similarity_ranking','final_result_id','final_result_key','final_result_name'])assert.deepEqual(a[key],expected[key]);assert.equal(Date.parse(a.created_at),Date.parse(expected.created_at));}
  for(const expected of plan.profiles){const actual=current.user_profile.find(p=>p.user_id===expected.user_id);assert.deepEqual(actual.core_vector,expected.core_vector);assert.deepEqual(actual.social_vector,expected.social_vector);assert.equal(actual.report_count,expected.report_count);}
  for(const c of plan.counts)assert.equal(current.quizzes.find(q=>q.id===c.id).attempt_count,c.after);
  // Original quiz content and all original attempts/answers are preserved; only
  // their counters and authors' reward balances change with the new interactions.
  const ownQuizIds=new Set(plan.quizPatches.map(q=>q.id));
  for(const q of before.quizzes.filter(q=>!ownQuizIds.has(q.id))){const actual=current.quizzes.find(x=>x.id===q.id);const stripped=x=>{const copy={...x};delete copy.attempt_count;return copy;};assert.deepEqual(stripped(actual),stripped(q));}
  for(const a of before.quiz_attempts.filter(a=>!ids.includes(a.user_id)))assert.equal(hash(current.quiz_attempts.find(x=>x.id===a.id)),hash(a));
  for(const c of plan.creditAdjustments){const account=current.user_credits.find(x=>x.user_id===c.user_id);assert.equal(Number(account.bonus_credits),Number(c.old?.bonus_credits??0)+c.delta);}
  const credentials=read('credentials.json');for(const p of plan.people)credentials[p.key].email=p.email;write('credentials.json',credentials);
  const {createClient}=require('@supabase/supabase-js');
  for(const index of [0,48]){const person=plan.people[index],client=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});const logged=await checked(client.auth.signInWithPassword(credentials[person.key]),'revised login');assert.equal(logged.user.id,person.id);const mine=await checked(client.from('users').select('username,display_name').eq('id',person.id).single(),'user display');assert.equal(mine.username,person.username);assert.equal(mine.display_name,null);await checked(client.auth.signOut(),'logout');}
  const result={...plan.summary,verifiedAt:iso(Date.now()),answers:current.quiz_attempt_answers.filter(a=>owned.some(x=>x.id===a.attempt_id)).length,allDisplayNamesNull:true,uniqueUsernames:new Set(plan.people.map(p=>p.username)).size,qqNumeric:true,originalContentPreserved:true,loginSamples:2,passed:true};write('revision-verification.json',result);console.log(JSON.stringify(result));
}
async function main(){const command=process.argv[2];if(command==='sql'||command==='dry-run-sql'){process.stdout.write(sql(read('revision-plan.json'),{rollback:command==='dry-run-sql'}));return;}const db=env();runtime();if(command==='prepare')await prepare(db);else if(command==='verify')await verify(db);else throw new Error('Use prepare, sql, dry-run-sql or verify');}
module.exports={emailFor,NAMES,DESCRIPTIONS};
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
