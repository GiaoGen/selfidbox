"use client";

import { CoverFlowSources } from "@/components/profile/CoverFlowSources";
import { SourceBlocks } from "@/components/profile/SourceBlocks";
import type { ProfileSourceEntry } from "@/lib/user-profile-db";

export function ProfileInteractions({
  initialSources,
}: {
  initialSources?: ProfileSourceEntry[];
}) {
  const sources = initialSources ?? [];

  return (
    <>
      <CoverFlowSources initialSources={sources} />
      <SourceBlocks sources={sources} />
    </>
  );
}
