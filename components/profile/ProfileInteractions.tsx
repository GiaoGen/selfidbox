"use client";

import { CoverFlowSources } from "@/components/profile/CoverFlowSources";
import type { ProfileSourceEntry } from "@/lib/user-profile-db";

export function ProfileInteractions({
  initialSources,
}: {
  initialSources?: ProfileSourceEntry[];
}) {
  return <CoverFlowSources initialSources={initialSources} />;
}
