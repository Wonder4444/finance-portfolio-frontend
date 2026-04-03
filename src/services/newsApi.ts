import { NewsItem } from "../types";

const YAHOO_RSS_PROXY_URL = "/yahoo-rss/news/rssindex";
const YAHOO_RSS_URL = "https://finance.yahoo.com/news/rssindex";
const MAX_NEWS_ITEMS = 20;

function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function deriveCategory(rawCategory: string, title: string): string {
  if (rawCategory.trim()) return rawCategory.trim();

  const text = title.toLowerCase();
  if (/(crypto|bitcoin|ethereum|token|blockchain)/.test(text)) return "Crypto";
  if (/(fed|inflation|cpi|rate|economy|gdp)/.test(text)) return "Economy";
  if (/(oil|gold|silver|commodity|energy)/.test(text)) return "Commodity";
  if (/(nasdaq|s&p|dow|stocks?|equity|market)/.test(text)) return "Market";
  return "Finance";
}

function formatTime(pubDate: string): string {
  const date = new Date(pubDate);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function parseYahooRss(xmlText: string): NewsItem[] {
  const xml = new DOMParser().parseFromString(xmlText, "application/xml");
  const parseError = xml.querySelector("parsererror");
  if (parseError) {
    throw new Error("Failed to parse Yahoo RSS XML response.");
  }

  const items = Array.from(xml.querySelectorAll("item"));
  return items.slice(0, MAX_NEWS_ITEMS).map((item, index) => {
    const title =
      item.querySelector("title")?.textContent?.trim() || "Untitled";
    const categoryRaw = item.querySelector("category")?.textContent || "";
    const pubDateStr = item.querySelector("pubDate")?.textContent || "";
    const parsedDate = new Date(pubDateStr);
    const pubDate = Number.isNaN(parsedDate.getTime())
      ? Date.now() - index * 1000
      : parsedDate.getTime();

    const guid = item.querySelector("guid")?.textContent?.trim();
    const link = item.querySelector("link")?.textContent?.trim();
    const id = guid || link || `yahoo-news-${index}`;

    return {
      id,
      time: formatTime(pubDateStr),
      pubDate,
      title,
      category: deriveCategory(categoryRaw, title),
      link,
    };
  });
}

async function fetchRssText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.text();
}

export async function fetchYahooNews(): Promise<NewsItem[]> {
  try {
    // Prefer same-origin proxy in development to fully avoid browser CORS checks.
    const rssText = await fetchRssText(YAHOO_RSS_PROXY_URL);
    return parseYahooRss(rssText);
  } catch {
    try {
      const rssText = await fetchRssText(YAHOO_RSS_URL);
      return parseYahooRss(rssText);
    } catch {
      // Last-resort fallback to a public CORS wrapper if direct access is blocked.
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(YAHOO_RSS_URL)}`;
      const rssText = await fetchRssText(proxyUrl);
      return parseYahooRss(rssText);
    }
  }
}
