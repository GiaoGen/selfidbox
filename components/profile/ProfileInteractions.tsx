"use client";

import { useState } from "react";
import { ProfileSummary } from "@/components/ProfileSummary";
import { CoverFlowSources } from "@/components/profile/CoverFlowSources";
import { DataSourceModal } from "@/components/DataSourceModal";

export function ProfileInteractions({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const [sourceOpen, setSourceOpen] = useState(false);

  return (
    <>
      <CoverFlowSources />

      <ProfileSummary
        title={title}
        description={description}
        onDataSourceClick={() => setSourceOpen(true)}
      />

      <DataSourceModal
        open={sourceOpen}
        onClose={() => setSourceOpen(false)}
      />
    </>
  );
}
