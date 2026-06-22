"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { TestSite } from "@/lib/test-sites";
import { nipponColorForSlug, textColorForNipponBg } from "@/lib/nippon-colors";

export function RelatedTestSites({ sites }: { sites: TestSite[] }) {
  if (sites.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-[var(--muted)]">
          Related tests
        </p>
        <h2 className="mt-1 text-3xl font-semibold tracking-[-0.03em]">
          相关测试推荐
        </h2>
      </div>

      <motion.div
        className="grid gap-3 sm:grid-cols-3"
        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        initial="hidden"
        animate="visible"
      >
        {sites.map((site) => {
          const bg = nipponColorForSlug(site.id);
          const fg = textColorForNipponBg(bg);
          return (
          <motion.div
            key={site.id}
            variants={{ hidden: { opacity: 0, scale: 0.90 }, visible: { opacity: 1, scale: 1 } }}
          >
            <Link
              href={`/test-sites/${site.id}`}
              className="flex min-h-44 flex-col justify-between rounded-[28px] p-5 shadow-[0_18px_50px_rgba(10,10,10,0.08)]"
              style={{ backgroundColor: bg, color: fg }}
            >
              <div>
                <span className="rounded-full bg-white/28 px-3 py-1 text-xs font-semibold">
                  {site.estimatedMinutes} min
                </span>
                <h3 className="mt-4 text-xl font-semibold leading-tight tracking-[-0.02em]">
                  {site.name}
                </h3>
              </div>
              <p className="mt-5 line-clamp-2 text-sm leading-6 opacity-85">
                {site.description}
              </p>
            </Link>
          </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
