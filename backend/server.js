// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors({ origin: "http://localhost:5173", credentials: false }));
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ message: "InvestMate API is running" });
});

/**
 * GET /api/investments
 * Returns all investments ordered by date (newest first)
 */
app.get("/api/investments", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, symbol, shares, buy_price, buy_date, notes FROM investments ORDER BY buy_date DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching investments:", err);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
});

/**
 * POST /api/investments
 * Body: { symbol, shares, buyPrice, buyDate, notes }
 */
app.post("/api/investments", async (req, res) => {
  try {
    const { symbol, shares, buyPrice, buyDate, notes } = req.body;

    if (!symbol || !shares || !buyPrice || !buyDate) {
      return res
        .status(400)
        .json({ error: "symbol, shares, buyPrice, buyDate are required" });
    }

    const result = await pool.query(
      `INSERT INTO investments (symbol, shares, buy_price, buy_date, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, symbol, shares, buy_price, buy_date, notes`,
      [symbol.toUpperCase(), shares, buyPrice, buyDate, notes || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error inserting investment:", err);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
});

/**
 * GET /api/portfolio/summary
 * Simple MVP: total invested amount (based on buy_price)
 */
app.get("/api/portfolio/summary", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT COALESCE(SUM(shares * buy_price), 0) AS total_invested FROM investments"
    );
    const totalInvested = Number(result.rows[0].total_invested || 0);

    res.json({
      totalInvested,
      // later you can add currentValue, P/L using live prices
    });
  } catch (err) {
    console.error("Error getting summary:", err);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
});

/**
 * GET /api/quote/:symbol
 * External API demo using Alpha Vantage "demo" key.
 * This satisfies the "external API integration" requirement.
 */
app.get("/api/quote/:symbol", async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const apiKey = process.env.ALPHAVANTAGE_KEY || "demo";

    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(
      symbol
    )}&apikey=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    const quote = data["Global Quote"];
    if (!quote) {
      return res.status(404).json({ error: "QUOTE_NOT_FOUND" });
    }

    res.json({
      symbol: quote["01. symbol"],
      price: Number(quote["05. price"]),
      previousClose: Number(quote["08. previous close"]),
      changePercent: quote["10. change percent"],
    });
  } catch (err) {
    console.error("Error fetching quote:", err);
    res.status(500).json({ error: "EXTERNAL_API_ERROR" });
  }
});

app.listen(PORT, () => {
  console.log(`InvestMate API listening on http://localhost:${PORT}`);
});
