import express from "express";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({
  suppressNotices: ["yahooSurvey"],
});

const app = express();
const PORT = Number(process.env.CRYPTO_API_PORT || 8787);

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "crypto-price-api" });
});

app.get("/prices", async (req, res) => {
  try {
    const raw = String(req.query.symbols || "");
    const symbols = raw
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    if (symbols.length === 0) {
      return res.status(400).json({ error: "Missing symbols query parameter" });
    }

    const results = await Promise.allSettled(
      symbols.map((symbol) => yahooFinance.quote(symbol)),
    );

    const quotes = [];
    const failed = [];

    results.forEach((result, index) => {
      const symbol = symbols[index];
      if (result.status !== "fulfilled") {
        failed.push({ symbol, reason: String(result.reason) });
        return;
      }

      const quote = result.value;
      const price = quote.regularMarketPrice ?? quote.postMarketPrice ?? 0;
      const previousClose =
        quote.regularMarketPreviousClose ?? quote.regularMarketOpen ?? price;
      const change = price - previousClose;
      const changePercent =
        previousClose !== 0 ? (change / previousClose) * 100 : 0;

      quotes.push({
        symbol,
        name: quote.shortName || quote.longName || symbol,
        price,
        previousClose,
        change,
        changePercent,
        currency: quote.currency || "USD",
      });
    });

    return res.json({ quotes, failed });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch crypto quotes",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

app.listen(PORT, () => {
  console.log(`crypto-price-api listening on http://localhost:${PORT}`);
});
