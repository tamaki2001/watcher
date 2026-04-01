import { NextResponse } from "next/server";

export const revalidate = 3600; // 1時間キャッシュ

export async function GET() {
  const queries = [
    "戦争+紛争+犠牲者",
    "空爆+市民+死亡",
    "難民+避難民",
  ];

  const allItems: { title: string; link: string }[] = [];

  for (const q of queries) {
    try {
      const res = await fetch(
        `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=ja&gl=JP&ceid=JP:ja`,
        { next: { revalidate: 3600 } }
      );
      const xml = await res.text();

      // <item>ブロックを抽出
      const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
      for (const block of itemBlocks.slice(0, 3)) {
        // titleを抽出（CDATA形式 or 通常形式）
        const titleMatch = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
                           block.match(/<title>(.*?)<\/title>/);
        // linkを抽出
        const linkMatch = block.match(/<link>(.*?)<\/link>/) ||
                          block.match(/<link\/>(https?[^<]*)/);

        if (titleMatch && linkMatch) {
          allItems.push({
            title: titleMatch[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"'),
            link: linkMatch[1],
          });
        }
      }
    } catch {
      // skip
    }
  }

  // 重複除去して最大8件
  const seen = new Set<string>();
  const unique = allItems.filter((item) => {
    if (seen.has(item.title)) return false;
    seen.add(item.title);
    return true;
  }).slice(0, 8);

  return NextResponse.json(unique);
}
