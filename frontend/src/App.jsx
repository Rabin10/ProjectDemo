import { useEffect, useState } from "react";
import "./App.css";

const API_BASE = "http://localhost:4000";

function App() {
  const [investments, setInvestments] = useState([]);
  const [summary, setSummary] = useState({ totalInvested: 0 });
  const [form, setForm] = useState({
    symbol: "",
    shares: "",
    buyPrice: "",
    buyDate: "",
    notes: "",
  });
  const [quoteSymbol, setQuoteSymbol] = useState("");
  const [quote, setQuote] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchInvestments();
    fetchSummary();
  }, []);

  async function fetchInvestments() {
    const res = await fetch(`${API_BASE}/api/investments`);
    const data = await res.json();
    setInvestments(data);
  }

  async function fetchSummary() {
    const res = await fetch(`${API_BASE}/api/portfolio/summary`);
    const data = await res.json();
    setSummary(data);
  }

  async function handleAddInvestment(e) {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/investments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: form.symbol,
          shares: Number(form.shares),
          buyPrice: Number(form.buyPrice),
          buyDate: form.buyDate,
          notes: form.notes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add investment");
      }

      const newInv = await res.json();
      setInvestments((prev) => [newInv, ...prev]);
      fetchSummary();

      setForm({
        symbol: "",
        shares: "",
        buyPrice: "",
        buyDate: "",
        notes: "",
      });
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleFetchQuote(e) {
    e.preventDefault();
    setLoadingQuote(true);
    setQuote(null);
    setError("");

    try {
      const res = await fetch(
        `${API_BASE}/api/quote/${encodeURIComponent(quoteSymbol)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch quote");
      setQuote(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingQuote(false);
    }
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "1.5rem" }}>
      <h1>InvestMate – MVP Demo</h1>
      <p>
        Track your investments in one place and view a simple summary. This is
        the minimum viable product.
      </p>

      {/* Summary */}
      <section
        style={{
          marginTop: "1rem",
          padding: "1rem",
          border: "1px solid #ddd",
          borderRadius: "8px",
        }}
      >
        <h2>Portfolio Summary</h2>
        <p>
          <strong>Total Invested:</strong>{" "}
          ${summary.totalInvested?.toFixed(2)}
        </p>
      </section>

      {/* Add investment */}
      <section
        style={{
          marginTop: "1rem",
          padding: "1rem",
          border: "1px solid #ddd",
          borderRadius: "8px",
        }}
      >
        <h2>Add Investment</h2>
        {error && <p style={{ color: "red" }}>{error}</p>}

        <form onSubmit={handleAddInvestment}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <input
              placeholder="Symbol (e.g., AAPL)"
              value={form.symbol}
              onChange={(e) =>
                setForm((f) => ({ ...f, symbol: e.target.value }))
              }
              required
            />
            <input
              type="number"
              step="0.0001"
              placeholder="Shares"
              value={form.shares}
              onChange={(e) =>
                setForm((f) => ({ ...f, shares: e.target.value }))
              }
              required
            />
            <input
              type="number"
              step="0.01"
              placeholder="Buy Price"
              value={form.buyPrice}
              onChange={(e) =>
                setForm((f) => ({ ...f, buyPrice: e.target.value }))
              }
              required
            />
            <input
              type="date"
              value={form.buyDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, buyDate: e.target.value }))
              }
              required
            />
          </div>
          <div style={{ marginTop: "0.5rem" }}>
            <input
              style={{ width: "100%" }}
              placeholder="Notes (optional)"
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
            />
          </div>
          <button style={{ marginTop: "0.5rem" }} type="submit">
            Add Investment
          </button>
        </form>
      </section>

      {/* Investments table */}
      <section
        style={{
          marginTop: "1rem",
          padding: "1rem",
          border: "1px solid #ddd",
          borderRadius: "8px",
        }}
      >
        <h2>Investments</h2>
        {investments.length === 0 ? (
          <p>No investments yet. Add one above.</p>
        ) : (
          <table width="100%" border="1" cellPadding="6">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Shares</th>
                <th>Buy Price</th>
                <th>Buy Date</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {investments.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.symbol}</td>
                  <td>{Number(inv.shares)}</td>
                  <td>${Number(inv.buy_price).toFixed(2)}</td>
                  <td>{inv.buy_date}</td>
                  <td>{inv.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* External API demo */}
      <section
        style={{
          marginTop: "1rem",
          padding: "1rem",
          border: "1px solid #ddd",
          borderRadius: "8px",
        }}
      >
        <h2>Check Live Quote (External API Demo)</h2>
        <form onSubmit={handleFetchQuote}>
          <input
            placeholder="Symbol (e.g., IBM)"
            value={quoteSymbol}
            onChange={(e) => setQuoteSymbol(e.target.value)}
            required
          />
          <button type="submit" disabled={loadingQuote}>
            {loadingQuote ? "Loading..." : "Get Quote"}
          </button>
        </form>

        {quote && (
          <div style={{ marginTop: "0.5rem" }}>
            <p>
              Symbol: <strong>{quote.symbol}</strong>
            </p>
            <p>Price: ${quote.price.toFixed(2)}</p>
            <p>Previous Close: ${quote.previousClose.toFixed(2)}</p>
            <p>Change: {quote.changePercent}</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default App;
