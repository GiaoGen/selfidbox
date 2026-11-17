import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProfileSourceEntry } from "@/lib/user-profile-db";
import { useSourceCardOpen } from "@/components/profile/useSourceCardOpen";

const mocks = vi.hoisted(() => ({ state: null as unknown, fetch: vi.fn() }));

vi.mock("react", () => ({
  useState: (initial: unknown) => {
    mocks.state = initial;
    return [initial, (update: unknown) => {
      mocks.state = typeof update === "function" ? update(mocks.state) : update;
    }];
  },
  useRef: (initial: unknown) => ({ current: initial }),
  useCallback: (callback: unknown) => callback,
}));

const entry: ProfileSourceEntry = {
  id: "legacy", source_type: "quiz", created_at: "2026-11-17T00:00:00Z",
  title: "旧记录", result: "结果 A", meta: "Quiz Studio",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", mocks.fetch);
});

afterEach(() => vi.unstubAllGlobals());

describe("useSourceCardOpen pending requests", () => {
  it("keeps a loading card closed after its response arrives", async () => {
    let respond!: (response: Response) => void;
    mocks.fetch.mockReturnValue(new Promise<Response>((resolve) => { respond = resolve; }));
    const card = useSourceCardOpen();
    const pending = card.openCard(entry);
    expect(mocks.state).toMatchObject({ cardOpen: true, cardLoading: true });

    card.closeCard();
    respond(Response.json({ ok: true, detail: { id: "legacy", final_result_name: "结果 A" } }));
    await pending;

    expect(mocks.state).toMatchObject({ cardOpen: false });
  });

  it("keeps the newer instant card when an older response arrives", async () => {
    let respond!: (response: Response) => void;
    mocks.fetch.mockReturnValue(new Promise<Response>((resolve) => { respond = resolve; }));
    const card = useSourceCardOpen();
    const pending = card.openCard(entry);
    await card.openCard({ ...entry, id: "new", result: "结果 B", traits: [] });

    respond(Response.json({ ok: true, detail: { id: "legacy", final_result_name: "结果 A" } }));
    await pending;

    expect(mocks.state).toMatchObject({ cardOpen: true, cardLoading: false, cardData: { id: "new", final_result_name: "结果 B" } });
  });

  it("keeps the newer card open when an older request fails", async () => {
    let fail!: (error: Error) => void;
    mocks.fetch.mockReturnValue(new Promise<Response>((_, reject) => { fail = reject; }));
    const card = useSourceCardOpen();
    const pending = card.openCard(entry);
    await card.openCard({ ...entry, id: "new", result: "结果 B", traits: [] });

    fail(new Error("Old request failed"));
    await pending;

    expect(mocks.state).toMatchObject({ cardOpen: true, cardLoading: false, cardData: { id: "new" } });
  });
});
