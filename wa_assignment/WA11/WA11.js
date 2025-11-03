const API_KEY = "5e8d5573caeba00ae21b95b00d0d7964";

document.addEventListener("DOMContentLoaded", () => {
  const $ = (s) => document.querySelector(s);

  const modeRadios = document.querySelectorAll('input[name="mode"]');
  const cityRow = $("#cityRow");
  const manualRow = $("#manualRow");
  const citySelect = $("#citySelect");
  const manualCity = $("#manualCity");
  const goBtn = $("#goBtn");

  const statusEl = $("#status");
  const card = $("#card");
  const wCity = $("#wCity");
  const wDesc = $("#wDesc");
  const wTemp = $("#wTemp");
  const wFeels = $("#wFeels");
  const wHum = $("#wHum");
  const wWind = $("#wWind");
  const asOf = $("#asOf");

  function getMode() {
    const r = document.querySelector('input[name="mode"]:checked');
    return r ? r.value : "precise";
  }

  function updateModeUI() {
    const m = getMode();
    cityRow.hidden = m !== "city";
    manualRow.hidden = m !== "manual";
  }

  modeRadios.forEach(r => r.addEventListener("change", updateModeUI));
  const preciseRadio = document.querySelector('input[name="mode"][value="precise"]');
  if (preciseRadio) preciseRadio.checked = true;
  updateModeUI();

  function setStatus(msg) {
    statusEl.textContent = msg;
  }

  function fetchWithTimeout(url, ms = 8000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(t));
  }

  function showCard(d, units = "imperial") {
    const tUnit = units === "metric" ? "°C" : "°F";
    const wUnit = units === "metric" ? "m/s" : "mph";
    wCity.textContent = `${d.name}${d.sys && d.sys.country ? ", " + d.sys.country : ""}`;
    wDesc.textContent = d.weather && d.weather[0] ? d.weather[0].description : "";
    wTemp.textContent = Math.round(d.main.temp) + tUnit;
    wFeels.textContent = Math.round(d.main.feels_like) + tUnit;
    wHum.textContent = (d.main.humidity ?? 0) + "%";
    wWind.textContent = (Math.round(d.wind.speed) ?? 0) + " " + wUnit;
    asOf.textContent = "As of " + new Date(d.dt * 1000).toLocaleString();
    card.hidden = false;
  }

  async function getWeather() {
    card.hidden = true;
    setStatus("Fetching...");

    const base = "https://api.openweathermap.org/data/2.5/weather";
    const params = new URLSearchParams({ appid: API_KEY, units: "imperial" });
    const mode = getMode();

    try {
      if (mode === "precise") {
        const pos = await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 7000 })
        );
        params.set("lat", pos.coords.latitude.toFixed(4));
        params.set("lon", pos.coords.longitude.toFixed(4));
      } else if (mode === "city") {
        params.set("q", citySelect.value.trim());
      } else {
        const q = manualCity.value.trim();
        if (!q) throw new Error("Please type a city like 'Boulder, US'.");
        params.set("q", q);
      }

      const url = `${base}?${params.toString()}`;
      const res = await fetchWithTimeout(url);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error("API error " + res.status + ": " + txt.slice(0, 140));
      }

      const data = await res.json();
      showCard(data);
      setStatus("Success.");
    } catch (err) {
      if (err?.message?.includes("denied Geolocation")) {
        setStatus("Location permission denied. Try City or Manual mode.");
      } else if (err?.name === "AbortError") {
        setStatus("Request timed out. Try again.");
      } else {
        setStatus("Could not get weather. " + (err?.message || "Unknown error."));
      }
    }
  }

  goBtn.addEventListener("click", getWeather);
});