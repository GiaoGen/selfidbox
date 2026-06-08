"use client";

import { useState } from "react";
import { UserMenu } from "@/components/auth/UserMenu";
import { DataSourceModal } from "@/components/DataSourceModal";

export function ProfileHeaderActions() {
  const [sourceOpen, setSourceOpen] = useState(false);

  return (
    <>
      <UserMenu
        actions={[{ label: "数据来源", onClick: () => setSourceOpen(true) }]}
      />
      <DataSourceModal
        open={sourceOpen}
        onClose={() => setSourceOpen(false)}
      />
    </>
  );
}
