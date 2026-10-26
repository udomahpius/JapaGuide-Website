const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const themeToggle = $("#themeToggle");
function setTheme(theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem("japaguide-theme", theme);
  themeToggle.textContent = theme === "dark" ? "☀" : "☾";
  themeToggle.setAttribute(
    "aria-label",
    theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
  );
}
setTheme(
  localStorage.getItem("japaguide-theme") ||
    (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"),
);
themeToggle.addEventListener("click", () =>
  setTheme(
    document.documentElement.classList.contains("dark") ? "light" : "dark",
  ),
);
$("#menuToggle").addEventListener("click", () =>
  $("#mobileMenu").classList.toggle("hidden"),
);
$("#year").textContent = new Date().getFullYear();
$("#todayDate").textContent =
  new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(new Date()) +
  " · Start with trusted information";
const destinations = [
  ["Canada", "Canada visa and immigration information", "#canada"],
  [
    "United Kingdom",
    "UK visa guides and student visa",
    "https://www.gov.uk/government/organisations/uk-visas-and-immigration",
  ],
  ["Portugal", "Portugal visa information", "https://vistos.mne.gov.pt/en/"],
  [
    "Germany",
    "Work and study in Germany",
    "https://www.make-it-in-germany.com/en/",
  ],
  [
    "United States",
    "US visa categories and information",
    "https://travel.state.gov/content/travel/en/us-visas.html",
  ],
  ["Study abroad", "Scholarships and university resources", "#study"],
  ["Jobs abroad", "Official international job resources", "#jobs"],
  ["Relocation costs", "Estimate your moving budget", "#costTool"],
];
const searchForm = $("#heroSearch"),
  searchInput = $("#searchInput"),
  searchResults = $("#searchResults");
function renderSearch(q) {
  let results = destinations
    .filter((x) => (x[0] + " " + x[1]).toLowerCase().includes(q.toLowerCase()))
    .slice(0, 5);
  searchResults.innerHTML = results.length
    ? results
        .map(
          (x) =>
            `<a href="${x[2]}" ${x[2].startsWith("http") ? 'target="_blank" rel="noopener"' : ""}>${x[0]} <span style="float:right">↗</span><small style="display:block;color:#81909d;margin-top:3px">${x[1]}</small></a>`,
        )
        .join("")
    : "<p>No matching guide found. Try a country or topic such as study, jobs or costs.</p>";
  searchResults.classList.remove("hidden");
}
searchInput.addEventListener("input", () => {
  const q = searchInput.value.trim();
  if (q.length > 1) renderSearch(q);
  else searchResults.classList.add("hidden");
});
searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const q = searchInput.value.trim();
  if (!q) {
    searchInput.focus();
    return;
  }
  renderSearch(q);
  searchResults.scrollIntoView({ block: "nearest", behavior: "smooth" });
});
document.addEventListener("click", (e) => {
  if (!searchForm.contains(e.target)) searchResults.classList.add("hidden");
});
function fmtMoney(n, currency) {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "NGN" ? 0 : 2,
    }).format(n);
  } catch {
    return `${currency} ${n.toLocaleString()}`;
  }
}
function updateEstimate() {
  const currency = $("#currency").value;
  const total = ["docsCost", "flightCost", "housingCost", "livingCost"].reduce(
    (s, id) => s + Math.max(0, Number($("#" + id).value) || 0),
    0,
  );
  $("#estimateTotal").textContent = fmtMoney(total, currency);
}
["currency", "docsCost", "flightCost", "housingCost", "livingCost"].forEach(
  (id) => $("#" + id).addEventListener("input", updateEstimate),
);
updateEstimate();
function updateChecklist() {
  const boxes = $$("#checkItems input[type=checkbox]"),
    done = boxes.filter((b) => b.checked).length;
  $("#checkProgress").style.width = `${(done / boxes.length) * 100}%`;
  $("#checkCount").textContent = `${done} of ${boxes.length} complete`;
}
$$("#checkItems input").forEach((b) =>
  b.addEventListener("change", updateChecklist),
);
$("#resetChecks").addEventListener("click", () => {
  $$("#checkItems input").forEach((b) => (b.checked = false));
  updateChecklist();
});
async function convertCurrency() {
  const amount = Math.max(0, Number($("#fxAmount").value) || 0),
    from = $("#fxFrom").value,
    to = $("#fxTo").value;
  $("#fxResult").textContent = "Fetching rate…";
  $("#fxDate").textContent = "Connecting to exchange-rate service";
  $("#fxStatus").textContent = "";
  if (from === to) {
    $("#fxResult").textContent = fmtMoney(amount, to);
    $("#fxDate").textContent = "Same currency — no conversion needed";
    return;
  }
  try {
    const response = await fetch(
      `https://api.frankfurter.dev/v2/rate/${encodeURIComponent(from)}/${encodeURIComponent(to)}`,
    );
    if (!response.ok)
      throw new Error(
        response.status === 404 || response.status === 422
          ? "This currency pair is not supported by the current reference-rate provider."
          : "Rate service temporarily unavailable.",
      );
    const data = await response.json();
    $("#fxResult").textContent = fmtMoney(amount * data.rate, to);
    $("#fxDate").textContent =
      `1 ${from} = ${data.rate.toLocaleString(undefined, { maximumSignificantDigits: 7 })} ${to} · Rate date: ${data.date}`;
    $("#fxStatus").textContent =
      "Daily reference rate provided by Frankfurter.";
  } catch (err) {
    $("#fxResult").textContent = "Rate unavailable";
    $("#fxDate").textContent = "No unsupported rate has been guessed.";
    $("#fxStatus").textContent =
      err.message + " You can try another currency pair.";
  }
}
$("#convertBtn").addEventListener("click", convertCurrency);
["fxAmount", "fxFrom", "fxTo"].forEach((id) =>
  $("#" + id).addEventListener("change", convertCurrency),
);
convertCurrency();
const toast = $("#toast");
let toastTimeout;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 3500);
}
$("#newsletterForm").addEventListener("submit", (e) => {
  e.preventDefault();
  if (!$("#emailConsent").checked) return;
  $("#newsletterMessage").textContent =
    "Your form is validated, but subscriptions are not sent yet. Connect a trusted email provider or backend endpoint before launch.";
  showToast(
    "Email validated. Live newsletter delivery needs a connected email service.",
  );
});
// Keep outbound official-source links clearly separated from editorial claims. Forms require a production backend before collecting data.

// Flight search: all fare and place data is requested from the server-side Duffel integration.
const flightApi = "https://japa-guide-website.vercel.app/api";
// const flightApi = "/api";
const dealContainer = document.querySelector("#flightDeals");
const dealsStatus = document.querySelector("#dealsStatus");
const searchFormFlights = document.querySelector("#flightSearchForm");
const flightMessage = document.querySelector("#flightSearchMessage");
const resultsContainer = document.querySelector("#flightResults");
const departureInput = document.querySelector("#flightDepart");
const returnInput = document.querySelector("#flightReturn");
const tripInputs = [...document.querySelectorAll('input[name="tripType"]')];
const dateISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const minDate = dateISO(new Date());
departureInput.min = minDate;
departureInput.value = dateISO(new Date(Date.now() + 30 * 86400000));
returnInput.min = departureInput.value;
returnInput.value = dateISO(new Date(Date.now() + 37 * 86400000));
departureInput.addEventListener("change", () => {
  returnInput.min = departureInput.value;
  if (returnInput.value < departureInput.value)
    returnInput.value = departureInput.value;
});
function updateTripType() {
  const isReturn =
    document.querySelector('input[name="tripType"]:checked')?.value ===
    "return";
  document.querySelector(".return-date-field").style.display = isReturn
    ? "flex"
    : "none";
  returnInput.required = isReturn;
}
tripInputs.forEach((x) => x.addEventListener("change", updateTripType));
updateTripType();
function escapeHTML(s = "") {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
function money(amount, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch {
    return `${currency} ${amount}`;
  }
}
function flagFor(code = "") {
  const map = {
    CA: "🇨🇦",
    US: "🇺🇸",
    GB: "🇬🇧",
    NG: "🇳🇬",
    PT: "🇵🇹",
    DE: "🇩🇪",
    FR: "🇫🇷",
    AE: "🇦🇪",
    TR: "🇹🇷",
    IN: "🇮🇳",
    GH: "🇬🇭",
    ZA: "🇿🇦",
    AU: "🇦🇺",
    JP: "🇯🇵",
    ES: "🇪🇸",
    IT: "🇮🇹",
    NL: "🇳🇱",
    IE: "🇮🇪",
    KE: "🇰🇪",
    QA: "🇶🇦",
    SA: "🇸🇦",
    BR: "🇧🇷",
    MX: "🇲🇽",
    CH: "🇨🇭",
    CN: "🇨🇳",
    SG: "🇸🇬",
  };
  return map[code] || "🌍";
}
function dateLabel(date) {
  if (!date) return "Date varies";
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function dealCard(deal) {
  const origin = deal.origin || {},
    dest = deal.destination || {};
  const currency = deal.currency || "USD";
  const originCountry = origin.countryCode || "",
    destCountry = dest.countryCode || "";
  return `<article class="flight-deal-card"><div class="deal-art"><div><div class="deal-country">LIVE ROUTE FARE</div><div class="deal-route-flags" style="margin-top:13px"><span>${flagFor(originCountry)}</span><span>→</span><span>${flagFor(destCountry)}</span></div></div><span style="font-size:9px;position:relative;z-index:1">${escapeHTML(deal.tripType || "One way")}</span></div><div class="deal-body"><div class="deal-route"><strong>${escapeHTML(origin.city || origin.name || "Origin")} → ${escapeHTML(dest.city || dest.name || "Destination")}</strong><span>${escapeHTML(origin.code || "")}–${escapeHTML(dest.code || "")}</span></div><div class="deal-airline">${escapeHTML(deal.airline || "Airline offer")} · ${escapeHTML(deal.stopsLabel || "Stops vary")}</div><div class="deal-price-row"><div class="deal-price">${money(deal.price, currency)}<small>per passenger · fare found</small></div><button class="deal-search-btn" type="button" data-route-origin="${escapeHTML(origin.code || "")}" data-route-destination="${escapeHTML(dest.code || "")}" data-origin-label="${escapeHTML(origin.label || origin.city || "")}" data-destination-label="${escapeHTML(dest.label || dest.city || "")}">Search route ↗</button></div><div class="deal-date"><span>Departure: ${dateLabel(deal.departureDate)}</span><span>Updated ${deal.updatedAt ? new Date(deal.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "just now"}</span></div></div></article>`;
}
async function loadFlightDeals() {
  if (!dealContainer) return;
  try {
    const r = await fetch(`${flightApi}/flights/deals`);
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Live fares could not be loaded.");
    if (!data.deals?.length)
      throw new Error(
        data.message ||
          "No live offers were returned for the sample routes. Try the search form with your dates.",
      );
    dealContainer.innerHTML = data.deals.map(dealCard).join("");
    dealsStatus.textContent = `Live search completed ${data.checkedAt ? new Date(data.checkedAt).toLocaleString() : ""}. These are currently returned offers, not guaranteed ticket prices.`;
    dealContainer.querySelectorAll(".deal-search-btn").forEach((btn) =>
      btn.addEventListener("click", () => {
        const origin = document.querySelector("#flightOrigin"),
          destination = document.querySelector("#flightDestination");
        origin.value = btn.dataset.originLabel;
        destination.value = btn.dataset.destinationLabel;
        document.querySelector("#originCode").value = btn.dataset.routeOrigin;
        document.querySelector("#destinationCode").value =
          btn.dataset.routeDestination;
        document
          .querySelector("#flightSearchPanel")
          .scrollIntoView({ behavior: "smooth", block: "start" });
        origin.dispatchEvent(new Event("change"));
        destination.dispatchEvent(new Event("change"));
      }),
    );
  } catch (err) {
    dealContainer.innerHTML = `<div class="flight-loading"><span>✈</span><span>${escapeHTML(err.message)}<br><small>Connect a valid server API token to show live fares.</small></span></div>`;
    dealsStatus.textContent =
      "No fixed or invented fares are shown when the live API is unavailable.";
  }
}
document
  .querySelector("#dealPrev")
  ?.addEventListener("click", () =>
    dealContainer.scrollBy({ left: -280, behavior: "smooth" }),
  );
document
  .querySelector("#dealNext")
  ?.addEventListener("click", () =>
    dealContainer.scrollBy({ left: 280, behavior: "smooth" }),
  );
loadFlightDeals();
async function setupPlaceAutocomplete(inputId, hiddenId, suggestionsId) {
  const input = document.getElementById(inputId),
    hidden = document.getElementById(hiddenId),
    box = document.getElementById(suggestionsId);
  let timer;
  input.addEventListener("input", () => {
    hidden.value = "";
    clearTimeout(timer);
    const q = input.value.trim();
    if (q.length < 2) {
      box.classList.add("hidden");
      return;
    }
    timer = setTimeout(async () => {
      box.innerHTML =
        '<div style="padding:10px;font-size:11px">Searching cities and airports…</div>';
      box.classList.remove("hidden");
      try {
        const r = await fetch(
            `${flightApi}/places?query=${encodeURIComponent(q)}`,
          ),
          data = await r.json();
        if (!r.ok) throw new Error(data.error || "Place search unavailable");
        const places = data.places || [];
        if (!places.length) {
          box.innerHTML =
            '<div style="padding:10px;font-size:11px">No matching city or airport. Try a nearby major city or airport code.</div>';
          return;
        }
        box.innerHTML = places
          .map(
            (p, i) =>
              `<button type="button" data-index="${i}">${escapeHTML(p.label)}<small>${escapeHTML(p.type || "Airport/city")} · ${escapeHTML(p.countryCode || "")} · ${escapeHTML(p.code || "")}</small></button>`,
          )
          .join("");
        box.querySelectorAll("button").forEach((btn, i) =>
          btn.addEventListener("click", () => {
            const p = places[i];
            input.value = p.label;
            hidden.value = p.code;
            box.classList.add("hidden");
          }),
        );
      } catch (err) {
        box.innerHTML = `<div style="padding:10px;font-size:11px">${escapeHTML(err.message)}. Check the server connection.</div>`;
      }
    }, 260);
  });
  input.addEventListener("focus", () => {
    if (box.innerHTML.trim() && input.value.trim().length > 1)
      box.classList.remove("hidden");
  });
  document.addEventListener("click", (e) => {
    if (!input.parentElement.contains(e.target)) box.classList.add("hidden");
  });
}
setupPlaceAutocomplete("flightOrigin", "originCode", "originSuggestions");
setupPlaceAutocomplete(
  "flightDestination",
  "destinationCode",
  "destinationSuggestions",
);
document.querySelector("#swapLocations")?.addEventListener("click", () => {
  const a = document.querySelector("#flightOrigin"),
    b = document.querySelector("#flightDestination"),
    ac = document.querySelector("#originCode"),
    bc = document.querySelector("#destinationCode");
  [a.value, b.value] = [b.value, a.value];
  [ac.value, bc.value] = [bc.value, ac.value];
});
function renderFlightResults(offers, currency) {
  if (!offers.length) {
    resultsContainer.innerHTML =
      '<div class="flight-no-results">No matching fares were returned for these exact details. Try another date, broaden the airline preference, or search a nearby city/airport.</div>';
    return;
  }
  resultsContainer.innerHTML = offers
    .map((o) => {
      const firstSlice = o.slices?.[0],
        lastSeg = firstSlice?.segments?.[firstSlice.segments.length - 1],
        firstSeg = firstSlice?.segments?.[0];
      const airline =
        o.airline ||
        firstSeg?.operating_carrier?.name ||
        firstSeg?.marketing_carrier?.name ||
        "Airline not supplied";
      const from = firstSeg?.origin?.iata_code || "",
        to = lastSeg?.destination?.iata_code || "";
      const depart = firstSeg?.departing_at
        ? new Date(firstSeg.departing_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—";
      const arrive = lastSeg?.arriving_at
        ? new Date(lastSeg.arriving_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—";
      const stops = Math.max(0, (firstSlice?.segments?.length || 1) - 1);
      const duration = firstSlice?.duration
        ? firstSlice.duration.replace("PT", "").toLowerCase()
        : "";
      return `<article class="flight-result"><div class="result-airline">${escapeHTML(airline)}<small>${escapeHTML(from)} → ${escapeHTML(to)} · ${stops === 0 ? "Non-stop" : `${stops} stop(s)`}${duration ? " · " + escapeHTML(duration) : ""}</small></div><div class="result-times"><div>${depart}<small>${escapeHTML(from)}</small></div><span class="line"></span><div>${arrive}<small>${escapeHTML(to)}</small></div></div><div class="result-price"><strong>${money(o.total_amount, o.total_currency || currency)}</strong><small>Total fare · ${escapeHTML(o.total_currency || currency)}</small><a href="${o.booking_url || "#flightSearchPanel"}" ${o.booking_url ? 'target="_blank" rel="noopener"' : ""} class="flight-select-link">${o.booking_url ? "View offer" : "Select offer"} ↗</a></div></article>`;
    })
    .join("");
}
searchFormFlights?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const originCode = document.querySelector("#originCode").value,
    destinationCode = document.querySelector("#destinationCode").value;
  const originText = document.querySelector("#flightOrigin").value.trim(),
    destinationText = document.querySelector("#flightDestination").value.trim();
  if (!originCode || !destinationCode) {
    flightMessage.textContent =
      "Please choose both departure and destination from the provider suggestions so the correct airport/city code is used.";
    return;
  }
  if (originCode === destinationCode) {
    flightMessage.textContent =
      "Choose two different departure and destination locations.";
    return;
  }
  if (returnInput.required && returnInput.value < departureInput.value) {
    flightMessage.textContent =
      "Return date must be on or after departure date.";
    return;
  }
  const button = document.querySelector("#flightSearchButton");
  button.disabled = true;
  button.innerHTML =
    '<span class="spinner" style="display:inline-block;vertical-align:middle;border-color:#ffffff55;border-top-color:#fff"></span> Searching airlines…';
  flightMessage.textContent =
    "Searching current provider offers. This can take a short while.";
  resultsContainer.innerHTML = "";
  try {
    const payload = {
      origin: originCode,
      destination: destinationCode,
      originLabel: originText,
      destinationLabel: destinationText,
      departureDate: departureInput.value,
      returnDate: returnInput.required ? returnInput.value : null,
      adults: Number(document.querySelector("#flightAdults").value),
      cabinClass: document.querySelector("#flightCabin").value,
      airline: document.querySelector("#flightAirline").value.trim(),
      currency: document.querySelector("#flightCurrency").value,
      tripType: document.querySelector('input[name="tripType"]:checked').value,
    };
    const r = await fetch(`${flightApi}/flights/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Flight search failed.");
    renderFlightResults(data.offers || [], payload.currency);
    flightMessage.textContent = `${(data.offers || []).length} offer(s) returned · searched ${originText} → ${destinationText} · checked ${new Date(data.checkedAt || Date.now()).toLocaleTimeString()}. ${data.note || ""}`;
    resultsContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (err) {
    flightMessage.textContent = err.message;
    resultsContainer.innerHTML =
      '<div class="flight-no-results">Live search is not available right now. Confirm the backend is running and a valid Duffel access token is configured. No sample fares are substituted.</div>';
  } finally {
    button.disabled = false;
    button.innerHTML = "Search available flights <span>→</span>";
  }
});

// JapaGuide scroll reveal enhancement — visual-only; does not alter site functionality.
(function initScrollReveal() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!("IntersectionObserver" in window)) return;
  const targets = document.querySelectorAll(
    ".section-head, .country-card, .article-card, .quick-panel, .tool-card, .timeline-cards a, .opportunity-card, .study-feature, .study-links a, .journal-grid article, .scam-inner, .newsletter-box, .about-grid, .flight-carousel-shell, .flight-deal-card",
  );
  if (!targets.length) return;
  document.body.classList.add("motion-ready");
  targets.forEach((el) => el.classList.add("scroll-reveal"));
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -36px 0px" },
  );
  targets.forEach((el) => observer.observe(el));
})();
