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

      // XMLからtitleとlinkを抽出
      const items = [...xml.matchAll(/<item>[\s\S]*?<title><!\[CDATA\[(.*?)\]\]><\/title>[\s\S]*?<link>(.*?)<\/link>/g)];
      for (const match of items.slice(0, 3)) {
        allItems.push({ title: match[1], link: match[2] });
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
