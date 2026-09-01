import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function extractTextFromHtml(html: string): string {
  // Remove scripts and styles entirely
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  // Extract title
  const titleMatch = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "";

  // Extract meta description
  const metaMatch = text.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  const metaDesc = metaMatch ? metaMatch[1].trim() : "";

  // Extract headings
  const headings: string[] = [];
  const hMatches = text.matchAll(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi);
  for (const m of hMatches) {
    const clean = m[1].replace(/<[^>]+>/g, "").trim();
    if (clean) headings.push(clean);
  }

  // Strip all remaining HTML tags
  const bodyText = text
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{3,}/g, "\n\n")
    .trim();

  const parts: string[] = [];
  if (title) parts.push(`TITLE: ${title}`);
  if (metaDesc) parts.push(`DESCRIPTION: ${metaDesc}`);
  if (headings.length > 0) parts.push(`HEADINGS: ${headings.slice(0, 10).join(" | ")}`);
  parts.push(`CONTENT:\n${bodyText.slice(0, 6000)}`);

  return parts.join("\n\n");
}

router.get("/browse", async (req, res): Promise<void> => {
  const url = typeof req.query.url === "string" ? req.query.url : "";
  if (!url) {
    res.status(400).json({ error: "url parameter is required" });
    return;
  }

  let targetUrl = url;
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    targetUrl = "https://" + targetUrl;
  }

  try {
    new URL(targetUrl); // Validate URL
  } catch {
    res.status(400).json({ error: "Invalid URL" });
    return;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,*/*",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    clearTimeout(timeout);

    const contentType = response.headers.get("content-type") ?? "";
    let content: string;

    if (contentType.includes("text/html")) {
      const html = await response.text();
      content = extractTextFromHtml(html);
    } else if (contentType.includes("application/json")) {
      const json = await response.text();
      content = json.slice(0, 4000);
    } else {
      const text = await response.text();
      content = text.slice(0, 4000);
    }

    res.json({
      url: targetUrl,
      status: response.status,
      content,
    });
  } catch (err) {
    logger.error({ err, url: targetUrl }, "Browse failed");
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: `Could not fetch ${targetUrl}: ${msg}` });
  }
});

export default router;
