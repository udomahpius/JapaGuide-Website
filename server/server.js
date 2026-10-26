import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
dotenv.config();
const app = express();
app.use(
  cors({
    origin: [
      "http://127.0.0.1:5500",
      "http://localhost:5500",
    ],
  }),
);
// app.use(cors({ origin: process.env.FRONTEND_ORIGIN || true }));
app.use(express.json({ limit: "40kb" }));
const PORT = process.env.PORT || 3000;
const DUFFEL = "https://api.duffel.com";
const token = process.env.DUFFEL_ACCESS_TOKEN;
const headers = () => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/json",
  "Content-Type": "application/json",
  "Duffel-Version": "v2",
});
function requireToken(res) {
  if (!token) {
    res
      .status(503)
      .json({
        error:
          "Live flight search is not configured yet. Add DUFFEL_ACCESS_TOKEN to server/.env.",
      });
    return false;
  }
  return true;
}
async function duffel(path, options = {}) {
  const response = await fetch(`${DUFFEL}${path}`, {
    ...options,
    headers: { ...headers(), ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      body?.errors
        ?.map((e) => e.message)
        .filter(Boolean)
        .join("; ") || `Flight provider returned HTTP ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return body;
}
function safePlace(p) {
  return {
    id: p.id,
    code: p.iata_code || p.iata_city_code || "",
    name: p.name || p.city_name || "",
    city: p.city_name || p.name || "",
    countryCode: p.iata_country_code || "",
    type: p.type || "place",
    label: `${p.city_name || p.name || "Place"}${p.name && p.city_name && p.name !== p.city_name ? " — " + p.name : ""} (${p.iata_code || p.iata_city_code || "Code unavailable"})`,
  };
}
app.get("/api/health", (req, res) =>
  res.json({ ok: true, provider: "Duffel", configured: Boolean(token) }),
);
app.get("/api/places", async (req, res) => {
  if (!requireToken(res)) return;
  const query = String(req.query.query || "").trim();
  if (query.length < 2) return res.json({ places: [] });
  try {
    const result = await duffel(
      `/places/suggestions?query=${encodeURIComponent(query)}`,
    );
    res.json({ places: (result.data || []).slice(0, 8).map(safePlace) });
  } catch (e) {
    res.status(e.status || 502).json({ error: e.message });
  }
});
function passengers(adults) {
  return Array.from({ length: adults }, () => ({ type: "adult" }));
}
function makeSlices(body) {
  const slices = [
    {
      origin: body.origin,
      destination: body.destination,
      departure_date: body.departureDate,
    },
  ];
  if (body.tripType === "return" && body.returnDate)
    slices.push({
      origin: body.destination,
      destination: body.origin,
      departure_date: body.returnDate,
    });
  return slices;
}
function offerAirline(offer) {
  const seg = offer.slices?.[0]?.segments?.[0];
  return (
    seg?.operating_carrier?.name ||
    seg?.marketing_carrier?.name ||
    "Airline not supplied"
  );
}
function carrierCode(offer) {
  const seg = offer.slices?.[0]?.segments?.[0];
  return (
    seg?.operating_carrier?.iata_code || seg?.marketing_carrier?.iata_code || ""
  );
}
function normaliseOffer(o) {
  return {
    id: o.id,
    total_amount: o.total_amount,
    total_currency: o.total_currency,
    airline: offerAirline(o),
    carrierCode: carrierCode(o),
    slices: o.slices || [],
    expires_at: o.expires_at || null,
    booking_url: null,
  };
}
async function getOffers(body) {
  const data = {
    slices: makeSlices(body),
    passengers: passengers(body.adults),
    cabin_class: body.cabinClass || "economy",
  };
  const result = await duffel(
    "/air/offer_requests?return_offers=true&supplier_timeout=20000",
    { method: "POST", body: JSON.stringify({ data }) },
  );
  let offers = (result.data?.offers || []).map(normaliseOffer);
  if (body.airline) {
    const wanted = body.airline.toLowerCase();
    offers = offers.filter(
      (o) =>
        o.airline.toLowerCase().includes(wanted) ||
        o.carrierCode.toLowerCase() === wanted,
    );
  }
  offers.sort((a, b) => Number(a.total_amount) - Number(b.total_amount));
  return offers.slice(0, 30);
}
app.post("/api/flights/search", async (req, res) => {
  if (!requireToken(res)) return;
  const b = req.body || {};
  const adults = Number(b.adults || 1);
  if (
    !/^[A-Z]{3}$/.test(b.origin || "") ||
    !/^[A-Z]{3}$/.test(b.destination || "")
  )
    return res
      .status(400)
      .json({
        error: "Select a valid city or airport from the place suggestions.",
      });
  if (b.origin === b.destination)
    return res
      .status(400)
      .json({ error: "Origin and destination must be different." });
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(b.departureDate || "") ||
    new Date(b.departureDate + "T00:00:00") <
      new Date(new Date().toISOString().slice(0, 10) + "T00:00:00")
  )
    return res
      .status(400)
      .json({ error: "Choose a valid departure date today or later." });
  if (
    b.tripType === "return" &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(b.returnDate || "") ||
      b.returnDate < b.departureDate)
  )
    return res
      .status(400)
      .json({ error: "Choose a valid return date on or after departure." });
  if (!Number.isInteger(adults) || adults < 1 || adults > 9)
    return res
      .status(400)
      .json({ error: "Passenger count must be between 1 and 9 adults." });
  try {
    const offers = await getOffers({ ...b, adults });
    res.json({
      offers,
      checkedAt: new Date().toISOString(),
      note: "Fares may change; refresh/revalidate the selected offer before purchase.",
    });
  } catch (e) {
    res.status(e.status || 502).json({ error: e.message });
  }
});
const routes = [
  {
    origin: "YYZ",
    destination: "JFK",
    originLabel: "Toronto",
    destinationLabel: "New York",
    tripType: "oneway",
  },
  {
    origin: "LHR",
    destination: "JFK",
    originLabel: "London",
    destinationLabel: "New York",
    tripType: "oneway",
  },
  {
    origin: "LOS",
    destination: "LHR",
    originLabel: "Lagos",
    destinationLabel: "London",
    tripType: "oneway",
  },
  {
    origin: "YYZ",
    destination: "LHR",
    originLabel: "Toronto",
    destinationLabel: "London",
    tripType: "oneway",
  },
  {
    origin: "DXB",
    destination: "LOS",
    originLabel: "Dubai",
    destinationLabel: "Lagos",
    tripType: "oneway",
  },
  {
    origin: "JFK",
    destination: "YYZ",
    originLabel: "New York",
    destinationLabel: "Toronto",
    tripType: "oneway",
  },
];
app.get("/api/flights/deals", async (req, res) => {
  if (!requireToken(res)) return;
  const depart = new Date(Date.now() + 35 * 86400000)
    .toISOString()
    .slice(0, 10);
  try {
    const all = await Promise.allSettled(
      routes.map(async (route) => {
        const offers = await getOffers({
          ...route,
          departureDate: depart,
          adults: 1,
          cabinClass: "economy",
        });
        if (!offers.length) return null;
        const o = offers[0];
        const first = o.slices?.[0]?.segments?.[0];
        const lastSlice = o.slices?.[0];
        const last = lastSlice?.segments?.[lastSlice.segments.length - 1];
        const countryCode = (code) =>
          ({ YYZ: "CA", JFK: "US", LHR: "GB", LOS: "NG", DXB: "AE" })[code] ||
          "";
        return {
          origin: {
            code: route.origin,
            city: route.originLabel,
            countryCode: countryCode(route.origin),
            label: route.originLabel,
          },
          destination: {
            code: route.destination,
            city: route.destinationLabel,
            countryCode: countryCode(route.destination),
            label: route.destinationLabel,
          },
          price: o.total_amount,
          currency: o.total_currency,
          airline: o.airline,
          departureDate: depart,
          tripType: "One way",
          stopsLabel:
            Math.max(0, (lastSlice?.segments?.length || 1) - 1) === 0
              ? "Non-stop"
              : `${lastSlice.segments.length - 1} stop(s)`,
          updatedAt: new Date().toISOString(),
        };
      }),
    );
    const deals = all
      .filter((x) => x.status === "fulfilled" && x.value)
      .map((x) => x.value)
      .sort((a, b) => Number(a.price) - Number(b.price));
    res.json({
      deals,
      checkedAt: new Date().toISOString(),
      message: deals.length
        ? ""
        : "No current offers were returned for the configured sample routes.",
    });
  } catch (e) {
    res.status(e.status || 502).json({ error: e.message });
  }
});
app.listen(PORT, () =>
  console.log(`JapaGuide flight API running on http://localhost:${PORT}`),
);
