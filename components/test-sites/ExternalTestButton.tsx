"use client";

type ExternalTestButtonProps = {
  testSiteId: string;
  url: string;
  label?: string;
};

export function ExternalTestButton({
  testSiteId,
  url,
  label = "去做这个测试",
}: ExternalTestButtonProps) {
  function handleClick() {
    console.log("click tracked", { testSiteId, url });

    // window.open FIRST — mobile browsers block it if anything async runs before
    window.open(url, "_blank", "noopener,noreferrer");

    // fire-and-forget AFTER the window is already opening
    fetch(`/api/test-sites/${testSiteId}/click`, { method: "POST" }).catch(
      () => {},
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex min-h-14 items-center justify-center rounded-[20px] bg-[var(--ink)] px-6 text-base font-semibold text-white"
    >
      {label}
    </button>
  );
}
