import { useState, useEffect, useRef } from "react";

// 14-period Wilder's smoothed RSI
function calcRSI14(closes) {
  if (closes.length < 15) return null;

  const changes = [];
  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }

  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 0; i < 14; i++) {
    if (changes[i] > 0) avgGain += changes[i];
    else avgLoss += Math.abs(changes[i]);
  }
  avgGain /= 14;
  avgLoss /= 14;

  for (let i = 14; i < changes.length; i++) {
    const gain = changes[i] > 0 ? changes[i] : 0;
    const loss = changes[i] < 0 ? Math.abs(changes[i]) : 0;
    avgGain = (avgGain * 13 + gain) / 14;
    avgLoss = (avgLoss * 13 + loss) / 14;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return parseFloat((100 - 100 / (1 + rs)).toFixed(1));
}

async function fetchBtcDominance() {
  const res = await fetch("https://api.coingecko.com/api/v3/global");
  if (!res.ok) throw new Error(`CoinGecko global: ${res.status}`);
  const json = await res.json();
  const pct = json.data?.market_cap_percentage?.btc;
  if (pct == null) throw new Error("BTC dominance field missing");
  return parseFloat(pct.toFixed(1));
}

async function fetchPrices() {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,solana,zcash&vs_currencies=usd"
  );
  if (!res.ok) throw new Error(`CoinGecko prices: ${res.status}`);
  const json = await res.json();
  return {
    btcPrice: json.bitcoin?.usd ?? null,
    solPrice: json.solana?.usd ?? null,
    zecPrice: json.zcash?.usd ?? null,
  };
}

async function fetchSolRsi() {
  // 15 weekly klines → 14 changes → one RSI value
  // The last kline is the current in-progress week (live close = current price)
  const res = await fetch(
    "https://api.binance.com/api/v3/klines?symbol=SOLUSDT&interval=1W&limit=15"
  );
  if (!res.ok) throw new Error(`Binance klines: ${res.status}`);
  const json = await res.json();
  if (!Array.isArray(json) || json.length < 15) {
    throw new Error("Insufficient kline data");
  }
  // Index 4 is the close price in each kline
  const closes = json.map((k) => parseFloat(k[4]));
  return calcRSI14(closes);
}

const REFRESH_MS = 5 * 60 * 1000; // 5 minutes

export function useMarketData() {
  const [state, setState] = useState({
    btcDominance: null,
    btcPrice: null,
    solPrice: null,
    zecPrice: null,
    solRsiWeekly: null,
    loading: true,
    error: null,
    lastUpdated: null,
  });

  // Retain last valid values so failed refreshes don't clear the display
  const prevValid = useRef({});
  const timerRef = useRef(null);

  const fetchAll = useRef(async () => {
    const [domResult, pricesResult, rsiResult] = await Promise.allSettled([
      fetchBtcDominance(),
      fetchPrices(),
      fetchSolRsi(),
    ]);

    const next = {
      btcDominance:
        domResult.status === "fulfilled"
          ? domResult.value
          : prevValid.current.btcDominance ?? null,
      ...(pricesResult.status === "fulfilled"
        ? pricesResult.value
        : {
            btcPrice: prevValid.current.btcPrice ?? null,
            solPrice: prevValid.current.solPrice ?? null,
            zecPrice: prevValid.current.zecPrice ?? null,
          }),
      solRsiWeekly:
        rsiResult.status === "fulfilled"
          ? rsiResult.value
          : prevValid.current.solRsiWeekly ?? null,
    };

    if (domResult.status === "fulfilled")
      prevValid.current.btcDominance = next.btcDominance;
    if (pricesResult.status === "fulfilled") {
      prevValid.current.btcPrice = next.btcPrice;
      prevValid.current.solPrice = next.solPrice;
      prevValid.current.zecPrice = next.zecPrice;
    }
    if (rsiResult.status === "fulfilled")
      prevValid.current.solRsiWeekly = next.solRsiWeekly;

    const anyFailed = [domResult, pricesResult, rsiResult].some(
      (r) => r.status === "rejected"
    );
    const allFailed = [domResult, pricesResult, rsiResult].every(
      (r) => r.status === "rejected"
    );

    setState({
      ...next,
      loading: false,
      error: allFailed
        ? "All data sources unavailable"
        : anyFailed
        ? "Some sources unavailable — showing last known values"
        : null,
      lastUpdated: new Date(),
    });
  });

  useEffect(() => {
    fetchAll.current();
    timerRef.current = setInterval(() => fetchAll.current(), REFRESH_MS);
    return () => clearInterval(timerRef.current);
  }, []);

  return state;
}
