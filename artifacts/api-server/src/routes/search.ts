import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/search", async (req, res): Promise<void> => {
  const query = typeof req.query.q === "string" ? req.query.q : "";
  if (!query) {
    res.status(400).json({ error: "q parameter is required" });
    return;
  }

  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1&no_redirect=1`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Haley-Agent/1.0",
        Accept: "application/json",
      },
    });

    const data = (await response.json()) as {
      AbstractText?: string;
      AbstractURL?: string;
      AbstractSource?: string;
      Answer?: string;
      AnswerType?: string;
      RelatedTopics?: Array<{ Text?: string; FirstURL?: string; Result?: string }>;
      Definition?: string;
      DefinitionURL?: string;
      Heading?: string;
    };

    const results: Array<{ title: string; snippet: string; url: string }> = [];

    if (data.AbstractText) {
      results.push({
        title: data.Heading ?? query,
        snippet: data.AbstractText,
        url: data.AbstractURL ?? "",
      });
    }

    if (data.Answer) {
      results.push({
        title: `Answer: ${data.AnswerType ?? "Direct"}`,
        snippet: data.Answer,
        url: "",
      });
    }

    if (data.Definition) {
      results.push({
        title: "Definition",
        snippet: data.Definition,
        url: data.DefinitionURL ?? "",
      });
    }

    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics.slice(0, 5)) {
        if (topic.Text) {
          results.push({
            title: topic.Text.split(" - ")[0] ?? topic.Text.slice(0, 60),
            snippet: topic.Text,
            url: topic.FirstURL ?? "",
          });
        }
      }
    }

    res.json({ query, results: results.slice(0, 8) });
  } catch (err) {
    logger.error({ err }, "Web search failed");
    res.status(500).json({ error: "Search failed" });
  }
});

export default router;
