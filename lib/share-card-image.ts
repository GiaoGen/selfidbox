import { toPng } from "html-to-image";
import { isSafari } from "@/lib/browser-detect";

export async function shareCardToPng(card: HTMLDivElement): Promise<string> {
  await document.fonts.ready;
  const images = Array.from(card.querySelectorAll("img"));
  await Promise.all(images.map((image) => image.decode().catch(() => {
    // Broken result images use the share card's text fallback.
  })));
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

  const options = {
    width: card.offsetWidth,
    height: card.scrollHeight,
    pixelRatio: 2,
    cacheBust: true,
  };
  if (isSafari() && images.length > 0) {
    // Prime WebKit's SVG image cache before exporting the final PNG.
    await toPng(card, options);
  }
  return toPng(card, options);
}
