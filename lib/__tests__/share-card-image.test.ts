import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { shareCardToPng } from "@/lib/share-card-image";

const mocks = vi.hoisted(() => ({ toPng: vi.fn(), isSafari: vi.fn() }));
vi.mock("html-to-image", () => ({ toPng: mocks.toPng }));
vi.mock("@/lib/browser-detect", () => ({ isSafari: mocks.isSafari }));

beforeEach(() => {
  vi.resetAllMocks();
  mocks.toPng.mockResolvedValue("data:image/png;base64,result");
  vi.stubGlobal("document", { fonts: { ready: Promise.resolve() } });
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
});

afterEach(() => vi.unstubAllGlobals());

describe("share card PNG export", () => {
  it("exports the full layout dimensions of a visually scaled receipt", async () => {
    const card = {
      offsetWidth: 382, scrollHeight: 2400,
      getBoundingClientRect: () => ({ width: 95.5, height: 600 }),
      querySelectorAll: () => [],
    } as unknown as HTMLDivElement;

    expect(await shareCardToPng(card)).toBe("data:image/png;base64,result");
    expect(mocks.toPng).toHaveBeenCalledExactlyOnceWith(card, {
      width: 382, height: 2400, pixelRatio: 2, cacheBust: true,
    });
  });

  it("waits for fonts and image decoding before exporting", async () => {
    let loadFont!: () => void;
    let decodeImage!: () => void;
    vi.stubGlobal("document", { fonts: { ready: new Promise<void>((resolve) => { loadFont = resolve; }) } });
    const decode = vi.fn(() => new Promise<void>((resolve) => { decodeImage = resolve; }));
    const card = { offsetWidth: 382, scrollHeight: 600, querySelectorAll: () => [{ decode }] } as unknown as HTMLDivElement;

    const pending = shareCardToPng(card);
    expect(decode).not.toHaveBeenCalled();
    loadFont();
    await Promise.resolve();
    expect(decode).toHaveBeenCalledOnce();
    expect(mocks.toPng).not.toHaveBeenCalled();
    decodeImage();
    await pending;
    expect(mocks.toPng).toHaveBeenCalledOnce();
  });

  it("primes Safari images and allows a broken image's text fallback", async () => {
    mocks.isSafari.mockReturnValue(true);
    const decode = vi.fn().mockRejectedValue(new Error("Broken image"));
    const card = { offsetWidth: 382, scrollHeight: 600, querySelectorAll: () => [{ decode }] } as unknown as HTMLDivElement;

    await shareCardToPng(card);
    expect(mocks.toPng).toHaveBeenCalledTimes(2);
    expect(mocks.toPng.mock.calls[0]).toEqual(mocks.toPng.mock.calls[1]);
  });
});
