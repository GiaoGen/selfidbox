"use client";
/* eslint-disable react/no-unescaped-entities */

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

/* ================================================================== */
/*  LegalContent — 三份法律文档的纯文本                                  */
/* ================================================================== */

function H2({ children }: { children: string }) {
  return <h2 className="text-[14px] font-semibold text-[var(--ink)] mt-4 mb-1.5 first:mt-0">{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-1.5">{children}</p>;
}

function TermsOfService() {
  return (
    <div>
      <H2>1. 服务说明</H2>
      <P>SelfIDBox（以下简称"本平台"）是一个 AI 驱动的性格测验平台。核心功能：<strong className="font-semibold text-[var(--ink)]">探索</strong>（浏览和参与性格测验）、<strong className="font-semibold text-[var(--ink)]">Quiz Studio</strong>（通过 AI 创建个性化测验）、<strong className="font-semibold text-[var(--ink)]">人格画像</strong>（根据测验结果构建个人人格向量档案）。</P>
      <P><strong className="font-semibold text-[var(--ink)]">重要提示：本平台所有测验和结果仅供娱乐目的，不构成任何专业心理学、精神病学、医学或职业咨询建议。</strong></P>

      <H2>2. 用户资格与账户</H2>
      <P>您必须年满 <strong className="font-semibold text-[var(--ink)]">13 周岁</strong> 方可使用本平台。注册时需提供有效邮箱。您对账户安全负全部责任。禁止转让、出售或出借账户。</P>

      <H2>3. 用户行为规范</H2>
      <P>禁止创建违法、侵权、色情、暴力、仇恨言论内容。禁止使用自动化脚本批量调用 AI 功能、绕过积分系统。禁止攻击服务器、植入恶意代码、反向工程。禁止上传恶意文件。</P>

      <H2>4. 用户生成内容</H2>
      <P>您在 Quiz Studio 中创建的测验内容的知识产权归您所有。<strong className="font-semibold text-[var(--ink)]">您授予本平台在全球范围内永久、免费、非独占的许可</strong>，用于展示和分发您的测验。您对创建的内容负全部责任。其他用户在您的测验中产生的答题数据属于该用户与本平台共有，不属于测验创建者。</P>

      <H2>5. AI 生成内容声明</H2>
      <P>测验题目、结果描述、因子分析由 DeepSeek AI 自动生成。AI 生成内容可能出现<strong className="font-semibold text-[var(--ink)]">不准确、有偏见、不适当或完全错误</strong>的情况。发布即视为您已审阅并认可该内容，对其承担全部责任。</P>

      <H2>6. 积分系统</H2>
      <P>积分（Credits）是本平台内的虚拟货币，用于兑换 AI 生成功能的使用次数。<strong className="font-semibold text-[var(--ink)]">积分不可转让、不可兑换现金、不可退款。</strong></P>

      <H2>7. 第三方链接</H2>
      <P>探索页面可能包含指向第三方测评站点的链接，这些站点<strong className="font-semibold text-[var(--ink)]">不受本平台控制</strong>。点击第三方链接和向第三方提供个人信息的风险由您自行承担。外站由本平台手动审核，但不构成背书。</P>

      <H2>8. 免责声明</H2>
      <P>本平台按"<strong className="font-semibold text-[var(--ink)]">现状</strong>"（AS IS）提供，不附带任何明示或默示保证。不保证服务不会中断、及时、安全或无误。所有测验结果和人格分析<strong className="font-semibold text-[var(--ink)]">仅供娱乐</strong>，不得用于任何实际决策。</P>

      <H2>9. 责任限制</H2>
      <P>在法律允许的最大范围内，本平台开发者（个人开发者）对因使用或无法使用本平台导致的任何间接、附带、特殊或后果性损害不承担责任。总赔偿金额不超过您在过去 12 个月内向本平台支付的费用金额（免费用户则为零）。</P>

      <H2>10. 账户终止</H2>
      <P>您可以随时联系本平台要求注销账户。本平台保留因违反服务条款而终止或暂停账户的权利。</P>

      <H2>11. 法律适用与争议解决</H2>
      <P>本服务条款受<strong className="font-semibold text-[var(--ink)]">中华人民共和国法律</strong>管辖。争议首先友好协商，协商不成提交有管辖权的人民法院处理。</P>

      <H2>12. 条款变更</H2>
      <P>本平台保留修改本服务条款的权利。重大变更将通过平台公告或邮件通知。继续使用即表示接受修改后的条款。</P>
    </div>
  );
}

function PrivacyPolicy() {
  return (
    <div>
      <H2>1. 概述</H2>
      <P>本隐私政策说明 SelfIDBox（"本平台"或"我们"）如何收集、使用、存储和保护您的个人信息。我们尽力做到透明和最小化数据收集。</P>

      <H2>2. 我们收集的信息</H2>
      <P><strong className="font-semibold text-[var(--ink)]">您主动提供的：</strong>邮箱地址、用户名（账户创建与认证）；测验内容（Quiz Studio 中创建的标题、描述、题目等）；上传的截图文件（OCR 识别）。</P>
      <P><strong className="font-semibold text-[var(--ink)]">使用中自动产生的：</strong>答题记录与结果排名；16 维人格向量、词云数据、AI 摘要；AI 生成功能调用次数（积分管理）；外部测试站点点击记录。</P>
      <P><strong className="font-semibold text-[var(--ink)]">技术信息：</strong>IP 地址、浏览器类型、操作系统、访问时间（Vercel 自动记录）；错误技术信息（Sentry 自动收集，已禁用源码映射）。</P>
      <P><strong className="font-semibold text-[var(--ink)]">我们不收集：</strong>精确地理位置、通讯录、相册、支付信息、身份证号、真实姓名。</P>

      <H2>3. 我们如何使用信息</H2>
      <P>仅用于提供核心服务（匹配结果、构建画像、生成词云）、改进服务、积分管理、安全防护和法律合规。<strong className="font-semibold text-[var(--ink)]">我们不会将您的个人信息出售给第三方。</strong>不会用于广告投放或自动化决策。</P>

      <H2>4. 数据存储与安全</H2>
      <P>数据存储在 <strong className="font-semibold text-[var(--ink)]">Supabase</strong>（PostgreSQL 数据库 + Storage 文件存储）中。所有表启用行级安全策略（RLS）；密码经加密哈希处理；数据传输全程 HTTPS/TLS 加密。<strong className="font-semibold text-[var(--ink)]">无法保证绝对安全。</strong></P>

      <H2>5. 第三方服务商</H2>
      <P><strong className="font-semibold text-[var(--ink)]">Supabase</strong>（数据库、认证、文件存储）、<strong className="font-semibold text-[var(--ink)]">DeepSeek</strong>（AI 生成内容）、<strong className="font-semibold text-[var(--ink)]">Vercel</strong>（网站托管）、<strong className="font-semibold text-[var(--ink)]">Sentry</strong>（错误追踪）、<strong className="font-semibold text-[var(--ink)]">OCR 服务</strong>（截图识别）。服务商仅在其服务所需范围内接触您的数据。</P>

      <H2>6. Cookie 政策</H2>
      <P>仅使用 Supabase Auth 管理的认证 Cookie（保持登录状态）。无第三方追踪、广告或分析 Cookie。禁用 Cookie 可能导致无法登录。</P>

      <H2>7. 数据保留</H2>
      <P>账户存续期间保留数据。账户注销后 30 天内删除个人信息。已去标识化的统计数据可能被保留用于服务改进。</P>

      <H2>8. 您的权利</H2>
      <P>您享有访问权、更正权、删除权、导出权。如需行使，请发送邮件至 <strong className="font-semibold text-[var(--ink)]">giaogen001@gmail.com</strong>，我们将在 15 个工作日内回复。</P>

      <H2>9. 儿童隐私</H2>
      <P>本平台<strong className="font-semibold text-[var(--ink)]">不面向 13 岁以下儿童</strong>。若发现误收集了儿童数据，请立即联系我们删除。</P>

      <H2>10. 政策更新</H2>
      <P>我们可能不时更新本隐私政策。重大变更将通过平台公告或邮件通知。建议定期查看。</P>
    </div>
  );
}

function ContentDisclaimer() {
  return (
    <div>
      <H2>1. 仅供娱乐</H2>
      <P>SelfIDBox 上的所有测验、测试结果、人格分析、词云和画像摘要<strong className="font-semibold text-[var(--ink)]">仅供娱乐目的</strong>。</P>

      <H2>2. 不构成专业建议</H2>
      <P>本平台提供的任何内容<strong className="font-semibold text-[var(--ink)]">不构成</strong>：心理学/精神病学诊断或治疗建议、医学诊断或健康指导、职业规划或招聘评估、法律咨询、感情关系指导，或任何形式的专业咨询关系。</P>

      <H2>3. AI 生成内容</H2>
      <P>部分测验内容由 DeepSeek AI 自动生成，可能存在事实性错误、文化偏见或不当内容。<strong className="font-semibold text-[var(--ink)]">发布 AI 生成的测验即表示您已审阅并对其承担责任。</strong></P>

      <H2>4. 不可作为决策依据</H2>
      <P>您不应基于测验结果做出职业选择、感情决定、医疗决定、重大财务或法律决定。</P>

      <H2>5. 无专业关系</H2>
      <P>使用本平台不会建立任何医患关系、咨询关系或治疗关系。如有心理健康困扰，请寻求持证专业人士帮助。</P>

      <H2>6. 外部测试站点</H2>
      <P>探索页中的第三方测评站点由本平台手动审核收录，但不受本平台控制。对其内容的准确性、安全性或隐私做法不作任何保证。点击外站链接和提交个人信息的风险由您自行承担。</P>

      <H2>7. 如您感到不适</H2>
      <P>若测验内容引发不适、焦虑或情绪困扰，请立即停止使用，联系专业心理咨询师。中国心理危机干预热线：<strong className="font-semibold text-[var(--ink)]">400-161-9995</strong>。</P>

      <H2>8. 免责</H2>
      <P>本平台开发者（个人开发者）对因使用本平台测验内容或依赖测验结果而产生的任何直接或间接损失不承担法律责任。</P>
    </div>
  );
}

/* ================================================================== */
/*  Export                                                              */
/* ================================================================== */

export type LegalTab = "terms" | "privacy" | "disclaimer";

export const TAB_LABELS: Record<LegalTab, string> = {
  terms: "服务条款",
  privacy: "隐私政策",
  disclaimer: "内容声明",
};

export function LegalContent({ tab }: { tab: LegalTab }) {
  if (tab === "terms") return <TermsOfService />;
  if (tab === "privacy") return <PrivacyPolicy />;
  return <ContentDisclaimer />;
}

/* ================================================================== */
/*  LegalModal — 最简单的弹窗                                           */
/* ================================================================== */

interface LegalModalProps {
  open: boolean;
  onClose: () => void;
  initialTab?: LegalTab;
}

export function LegalModal({ open, onClose, initialTab = "terms" }: LegalModalProps) {
  const [tab, setTab] = useState(initialTab);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black/80"
             onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[300px] shadow-[0_4px_20px_rgba(0,0,0,0.10)]"
            style={{ backgroundColor: "var(--surface-soft)" }}
          >
            {/* perforation dots */}
            <div className="flex justify-center gap-1 py-1.5 overflow-hidden select-none">
              {Array.from({ length: 18 }).map((_, i) => (
                <span key={i} className="inline-block w-[3px] h-[3px] rounded-full bg-[var(--ink)]/12 shrink-0" />
              ))}
            </div>

            {/* tabs */}
            <div className="flex gap-0.5 px-2.5 pb-2 border-b-2 border-dashed border-[var(--ink)]/10">
              {(Object.keys(TAB_LABELS) as LegalTab[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`px-2 py-1 text-[11px] font-medium transition-colors ${
                    tab === t
                      ? "bg-[var(--ink)] text-white"
                      : "text-[var(--muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  {TAB_LABELS[t]}
                </button>
              ))}
            </div>

            {/* content — only scrollable element */}
            <div className="px-2.5 py-3 text-[12px] leading-[1.7] text-[var(--body)]"
                 style={{ height: 520, overflowY: "scroll", WebkitOverflowScrolling: "touch" }}>
              <LegalContent tab={tab} />
            </div>

            {/* bottom */}
            <div className="border-t-2 border-dashed border-[var(--ink)]/10 px-2.5 py-2 text-[10px] text-[var(--muted)]/50">
              最后更新：2026-06-24
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
