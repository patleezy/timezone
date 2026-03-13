import { useState, useMemo, useCallback, useRef, useEffect } from "react";

const CITIES = [
  { id: "la", city: "Los Angeles", country: "US", tz: "America/Los_Angeles", flag: "🇺🇸", locale: "en-US", region: "AMERICAS" },
  { id: "ny", city: "New York", country: "US", tz: "America/New_York", flag: "🇺🇸", locale: "en-US", region: "AMERICAS" },
  { id: "mx", city: "Mexico City", country: "Mexico", tz: "America/Mexico_City", flag: "🇲🇽", locale: "es-MX", region: "AMERICAS" },
  { id: "sp", city: "São Paulo", country: "Brazil", tz: "America/Sao_Paulo", flag: "🇧🇷", locale: "pt-BR", region: "AMERICAS" },
  { id: "tor", city: "Toronto", country: "Canada", tz: "America/Toronto", flag: "🇨🇦", locale: "en-CA", region: "AMERICAS" },
  { id: "lon", city: "London", country: "UK", tz: "Europe/London", flag: "🇬🇧", locale: "en-GB", region: "EMEA" },
  { id: "cork", city: "Cork", country: "Ireland", tz: "Europe/Dublin", flag: "🇮🇪", locale: "en-IE", region: "EMEA" },
  { id: "par", city: "Paris", country: "France", tz: "Europe/Paris", flag: "🇫🇷", locale: "fr-FR", region: "EMEA" },
  { id: "ber", city: "Berlin", country: "Germany", tz: "Europe/Berlin", flag: "🇩🇪", locale: "de-DE", region: "EMEA" },
  { id: "mad", city: "Madrid", country: "Spain", tz: "Europe/Madrid", flag: "🇪🇸", locale: "es-ES", region: "EMEA" },
  { id: "mil", city: "Milan", country: "Italy", tz: "Europe/Rome", flag: "🇮🇹", locale: "it-IT", region: "EMEA" },
  { id: "ams", city: "Amsterdam", country: "Netherlands", tz: "Europe/Amsterdam", flag: "🇳🇱", locale: "nl-NL", region: "EMEA" },
  { id: "mos", city: "Moscow", country: "Russia", tz: "Europe/Moscow", flag: "🇷🇺", locale: "ru-RU", region: "EMEA" },
  { id: "dub", city: "Dubai", country: "UAE", tz: "Asia/Dubai", flag: "🇦🇪", locale: "ar-AE", region: "EMEA" },
  { id: "mum", city: "Mumbai", country: "India", tz: "Asia/Kolkata", flag: "🇮🇳", locale: "hi-IN", region: "APAC" },
  { id: "sg", city: "Singapore", country: "Singapore", tz: "Asia/Singapore", flag: "🇸🇬", locale: "en-SG", region: "APAC" },
  { id: "hk", city: "Hong Kong", country: "China", tz: "Asia/Hong_Kong", flag: "🇭🇰", locale: "zh-HK", region: "APAC" },
  { id: "bj", city: "Beijing", country: "China", tz: "Asia/Shanghai", flag: "🇨🇳", locale: "zh-CN", region: "APAC" },
  { id: "sel", city: "Seoul", country: "S. Korea", tz: "Asia/Seoul", flag: "🇰🇷", locale: "ko-KR", region: "APAC" },
  { id: "tok", city: "Tokyo", country: "Japan", tz: "Asia/Tokyo", flag: "🇯🇵", locale: "ja-JP", region: "APAC" },
  { id: "syd", city: "Sydney", country: "Australia", tz: "Australia/Sydney", flag: "🇦🇺", locale: "en-AU", region: "APAC" },
];

const REGIONS = [
  { key: "AMERICAS", icon: "🌎", defaultAnchor: "la", ids: ["la", "ny", "tor", "mx", "sp"] },
  { key: "EMEA", icon: "🌍", defaultAnchor: "cork", ids: ["lon", "cork", "par", "ber", "mad", "mil", "ams", "mos", "dub"] },
  { key: "APAC", icon: "🌏", defaultAnchor: "sg", ids: ["sg", "hk", "bj", "sel", "tok", "syd", "mum"] },
];

const getCity = (id) => CITIES.find((c) => c.id === id);
const LA = getCity("la");

// Helpers
const fmtTime = (d, tz) => d.toLocaleString("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true });
const fmtTime24 = (d, tz) => d.toLocaleString("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false });
const fmtDate = (d, tz) => d.toLocaleString("en-US", { timeZone: tz, weekday: "short", month: "short", day: "numeric" });

function utcOff(tz) {
  const m = new Date().toLocaleString("en-US", { timeZone: tz, timeZoneName: "shortOffset" }).match(/GMT([+-]\d+:?\d*)/);
  return m ? "UTC" + m[1] : "UTC";
}

function getDayDiff(d, rTz, tTz) {
  const a = new Date(d.toLocaleString("en-US", { timeZone: rTz })).getDate();
  const b = new Date(d.toLocaleString("en-US", { timeZone: tTz })).getDate();
  if (b === a) return "";
  return b > a || (a > 25 && b < 5) ? "+1d" : "-1d";
}

function isPeak(d, tz) {
  const h = new Date(d.toLocaleString("en-US", { timeZone: tz })).getHours();
  return h >= 9 && h < 18;
}

function isBiz(d, tz) {
  const h = new Date(d.toLocaleString("en-US", { timeZone: tz })).getHours();
  return h >= 7 && h < 22;
}

function buildDate(ds, h, m, tz) {
  const s = ds + "T" + String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":00";
  const u = new Date(s + "Z");
  const l = new Date(u.toLocaleString("en-US", { timeZone: tz }));
  return new Date(new Date(s).getTime() + (u - l));
}

function to24(h, ap) {
  if (ap === "PM" && h !== 12) return h + 12;
  if (ap === "AM" && h === 12) return 0;
  return h;
}

function doCopy(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).catch(function () {
      return fbCopy(text);
    });
  }
  return fbCopy(text);
}

function fbCopy(text) {
  var t = document.createElement("textarea");
  t.value = text;
  t.style.position = "fixed";
  t.style.opacity = "0";
  t.style.left = "-9999px";
  document.body.appendChild(t);
  t.focus();
  t.select();
  try { document.execCommand("copy"); } catch (e) { /* noop */ }
  document.body.removeChild(t);
  return Promise.resolve();
}

function dlBlob(content, name, mime) {
  var b = new Blob([content], { type: mime });
  var u = URL.createObjectURL(b);
  var a = document.createElement("a");
  a.href = u;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(u); }, 1000);
}

// PDF builder
function buildPDF(title, subtitle, rows) {
  var W = 612, H = 792, M = 48, y = H - M - 44;
  var ops = [];
  var esc = function (s) { return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)").replace(/[^\x20-\x7E]/g, "?"); };
  var txt = function (x, yy, s, f, sz) { ops.push("BT /" + (f || "F1") + " " + (sz || 9) + " Tf " + x + " " + yy + " Td (" + esc(s) + ") Tj ET"); };

  ops.push("0.89 0.1 0.22 rg");
  ops.push("0 " + (H - 36) + " " + W + " 36 re f");
  ops.push("BT /FB 10 Tf 1 1 1 rg " + M + " " + (H - 26) + " Td (LAUNCH TIMES) Tj ET");
  ops.push("0 0 0 rg");

  txt(M, y, title, "FB", 14); y -= 18;
  txt(M, y, subtitle, "F1", 9); y -= 26;

  ops.push("0.94 0.94 0.94 rg " + (M - 4) + " " + (y - 5) + " " + (W - 2 * M + 8) + " 18 re f");
  ops.push("0 0 0 rg");
  var cx = [M, M + 130, M + 220, M + 300, M + 380, M + 450];
  var headers = ["City", "Time (12h)", "Time (24h)", "Date", "UTC Offset", "Locale"];
  headers.forEach(function (h, i) { txt(cx[i], y, h, "FB", 8); });
  y -= 20;

  rows.forEach(function (r) {
    if (y < M + 20) { ops.push("%%PB%%"); y = H - M - 14; }
    if (r.isHeader) {
      y -= 6;
      ops.push("0.89 0.1 0.22 rg");
      txt(M, y, r.text, "FB", 10);
      ops.push("0 0 0 rg");
      y -= 16;
    } else {
      var dd = r.dayDiff ? " " + r.dayDiff : "";
      txt(cx[0], y, r.city || "", "F1", 8);
      txt(cx[1], y, (r.time12 || "") + dd, "FB", 8);
      txt(cx[2], y, r.time24 || "", "F1", 8);
      txt(cx[3], y, r.date || "", "F1", 8);
      txt(cx[4], y, r.offset || "", "F1", 8);
      txt(cx[5], y, r.locale || "", "F1", 8);
      y -= 13;
    }
  });

  y -= 8;
  ops.push("0.5 0.5 0.5 rg");
  txt(M, Math.max(y, M), "Generated " + new Date().toLocaleString("en-US"), "F1", 7);
  ops.push("0 0 0 rg");

  var pages = [[]];
  ops.forEach(function (o) {
    if (o === "%%PB%%") pages.push([]);
    else pages[pages.length - 1].push(o);
  });

  var oid = 0, ob = [];
  var nw = function (c) { oid++; ob.push({ id: oid, c: c }); return oid; };
  var catId = nw(""), pgLId = nw("");
  var f1 = nw("<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>");
  var fb = nw("<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>");
  var res = "/Font << /F1 " + f1 + " 0 R /FB " + fb + " 0 R >>";

  var pids = pages.map(function (pg) {
    var s = pg.join("\n");
    var si = nw("<< /Length " + s.length + " >>\nstream\n" + s + "\nendstream");
    return nw("<< /Type /Page /Parent " + pgLId + " 0 R /MediaBox [0 0 " + W + " " + H + "] /Contents " + si + " 0 R /Resources << " + res + " >> >>");
  });

  ob[pgLId - 1].c = "<< /Type /Pages /Kids [" + pids.map(function (p) { return p + " 0 R"; }).join(" ") + "] /Count " + pids.length + " >>";
  ob[catId - 1].c = "<< /Type /Catalog /Pages " + pgLId + " 0 R >>";

  var pdf = "%PDF-1.4\n", off = [];
  ob.forEach(function (o) {
    off.push(pdf.length);
    pdf += o.id + " 0 obj\n" + o.c + "\nendobj\n";
  });
  var xr = pdf.length;
  pdf += "xref\n0 " + (oid + 1) + "\n0000000000 65535 f \n";
  off.forEach(function (o) {
    pdf += String(o).padStart(10, "0") + " 00000 n \n";
  });
  pdf += "trailer\n<< /Size " + (oid + 1) + " /Root " + catId + " 0 R >>\nstartxref\n" + xr + "\n%%EOF";
  return pdf;
}

// ── COMPONENT ─────────────────────────────────────────────────────────────
export default function LaunchTimesApp() {
  const [mode, setMode] = useState("simultaneous");
  const [launchName, setLaunchName] = useState("");
  const [launchDate, setLaunchDate] = useState("2026-03-15");
  const [lH, setLH] = useState(9);
  const [lM, setLM] = useState(0);
  const [lAP, setLAP] = useState("AM");
  const [rH, setRH] = useState(9);
  const [rM, setRM] = useState(0);
  const [rAP, setRAP] = useState("AM");
  const [regConf, setRegConf] = useState({
    AMERICAS: { custom: false, date: "2026-03-15", h: 9, m: 0, ap: "AM" },
    EMEA:     { custom: false, date: "2026-03-15", h: 9, m: 0, ap: "AM" },
    APAC:     { custom: false, date: "2026-03-15", h: 9, m: 0, ap: "AM" },
  });
  var updateRegConf = function (key, field, val) {
    setRegConf(function (p) {
      var n = { ...p };
      n[key] = { ...n[key] };
      n[key][field] = val;
      return n;
    });
  };
  var anyCustom = regConf.AMERICAS.custom || regConf.EMEA.custom || regConf.APAC.custom;
  var displayTitle = launchName ? launchName : "LAUNCH TIMES";
  var fileSlug = launchName ? launchName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : "launch";
  var filePrefix = fileSlug + "-" + launchDate;
  const [anchors, setAnchors] = useState({ AMERICAS: "la", EMEA: "cork", APAC: "sg" });
  const [enabled, setEnabled] = useState(function () {
    var s = {};
    CITIES.forEach(function (c) { s[c.id] = true; });
    return s;
  });
  const [copiedId, setCopiedId] = useState(null);
  const [showExp, setShowExp] = useState(false);
  const [toast, setToast] = useState(null);
  const expRef = useRef(null);

  var allIds = CITIES.map(function (c) { return c.id; });
  var enabledCount = allIds.filter(function (id) { return enabled[id]; }).length;
  var allChecked = enabledCount === allIds.length;
  var noneChecked = enabledCount === 0;

  var toggleCity = function (id) {
    setEnabled(function (p) { var n = { ...p }; n[id] = !n[id]; return n; });
  };
  var toggleRegion = function (regionIds) {
    setEnabled(function (p) {
      var n = { ...p };
      var allOn = regionIds.every(function (id) { return n[id]; });
      regionIds.forEach(function (id) { n[id] = !allOn; });
      return n;
    });
  };
  var selectAll = function () {
    setEnabled(function (p) {
      var n = { ...p };
      var target = !allChecked;
      allIds.forEach(function (id) { n[id] = target; });
      return n;
    });
  };
  var regionCheckedCount = function (ids) {
    return ids.filter(function (id) { return enabled[id]; }).length;
  };

  useEffect(function () {
    var handler = function (e) {
      if (expRef.current && !expRef.current.contains(e.target)) setShowExp(false);
    };
    document.addEventListener("mousedown", handler);
    return function () { document.removeEventListener("mousedown", handler); };
  }, []);

  const refDate = useMemo(function () {
    return buildDate(launchDate, to24(lH, lAP), lM, "America/Los_Angeles");
  }, [launchDate, lH, lM, lAP]);

  const rH24 = to24(rH, rAP);

  const flash = useCallback(function (id) {
    setCopiedId(id);
    setTimeout(function () { setCopiedId(null); }, 1600);
  }, []);

  const notify = useCallback(function (msg) {
    setToast(msg);
    setTimeout(function () { setToast(null); }, 2400);
  }, []);

  const handleCopy = useCallback(function (text, id) {
    doCopy(text).then(function () { flash(id); });
  }, [flash]);

  const getCityData = useCallback(function (c, date, aTz) {
    return {
      city: c.city, country: c.country, flag: c.flag, locale: c.locale, id: c.id, tz: c.tz,
      time12: fmtTime(date, c.tz), time24: fmtTime24(date, c.tz),
      date: fmtDate(date, c.tz), offset: utcOff(c.tz),
      dayDiff: getDayDiff(date, aTz, c.tz),
      peak: isPeak(date, c.tz), biz: isBiz(date, c.tz),
    };
  }, []);

  const allData = useMemo(function () {
    return REGIONS.map(function (r) {
      var anchorCity = getCity(anchors[r.key]) || getCity(r.defaultAnchor);
      var anchorTz = anchorCity.tz;
      var rc = regConf[r.key];
      var rDate, rHour, rMin;
      if (mode === "simultaneous") {
        return { key: r.key, icon: r.icon, ids: r.ids, anchorCity: anchorCity, anchorTz: anchorTz, regionDate: refDate, regDate: launchDate, regTimeStr: fmtTime(refDate, "America/Los_Angeles") + " PT", cities: r.ids.map(function (id) { var c = getCity(id); return c ? getCityData(c, refDate, "America/Los_Angeles") : null; }).filter(Boolean) };
      }
      if (rc.custom) {
        rDate = rc.date;
        rHour = to24(rc.h, rc.ap);
        rMin = rc.m;
      } else {
        rDate = launchDate;
        rHour = rH24;
        rMin = rM;
      }
      var date = buildDate(rDate, rHour, rMin, anchorTz);
      var cities = r.ids.map(function (id) { var c = getCity(id); return c ? getCityData(c, date, anchorTz) : null; }).filter(Boolean);
      var timeStr = rc.custom ? rc.h + ":" + String(rc.m).padStart(2, "0") + " " + rc.ap : rH + ":" + String(rM).padStart(2, "0") + " " + rAP;
      return { key: r.key, icon: r.icon, ids: r.ids, anchorCity: anchorCity, anchorTz: anchorTz, regionDate: date, regDate: rc.custom ? rc.date : launchDate, regTimeStr: timeStr + " at " + anchorCity.city, isCustom: rc.custom, cities: cities };
    });
  }, [mode, refDate, launchDate, rH24, rM, rH, rAP, anchors, getCityData, regConf]);

  // LA reference for non-Americas regions
  const laDataForRegion = useMemo(function () {
    if (mode !== "regional") return {};
    var out = {};
    allData.forEach(function (r) {
      if (r.key === "AMERICAS") return;
      out[r.key] = getCityData(LA, r.regionDate, r.anchorTz);
    });
    return out;
  }, [mode, allData, getCityData]);

  // Export generators
  var genCopyAll = function () {
    var t = displayTitle.toUpperCase() + "\n";
    if (mode === "simultaneous") {
      t += "Date: " + launchDate + "\nTime: " + fmtTime(refDate, "America/Los_Angeles") + " PT\n\n";
    } else {
      t += "Mode: Regional (per-anchor local time)\n\n";
    }
    allData.forEach(function (r) {
      var activeCities = r.cities.filter(function (c) { return enabled[c.id]; });
      if (activeCities.length === 0) return;
      t += r.icon + " " + r.key;
      if (mode === "regional") t += " (Anchor: " + r.anchorCity.city + ")";
      t += "\n";
      if (mode === "regional") {
        t += "  Date: " + r.regDate + "  |  Time: " + r.regTimeStr + (r.isCustom ? " [custom]" : "") + "\n";
      }
      if (mode === "regional" && r.key !== "AMERICAS" && laDataForRegion[r.key]) {
        var la = laDataForRegion[r.key];
        t += "  🏠 🇺🇸 Los Angeles (your team): " + la.time12 + (la.dayDiff ? " " + la.dayDiff : "") + "  |  " + la.date + "\n";
      }
      activeCities.forEach(function (c) {
        t += "  " + c.flag + " " + c.city + ": " + c.time12 + (c.dayDiff ? " " + c.dayDiff : "") + "  |  " + c.date + "  |  " + c.offset + "  |  " + c.locale + "\n";
      });
      t += "\n";
    });
    return t.trim();
  };

  var genCSV = function () {
    var csv = "Region,Anchor,Launch Date,Launch Time,City,Country,Time 12h,Time 24h,Date,Day Shift,UTC Offset,Locale,Timezone\n";
    allData.forEach(function (r) {
      r.cities.filter(function (c) { return enabled[c.id]; }).forEach(function (c) {
        csv += '"' + r.key + '","' + r.anchorCity.city + '","' + (r.regDate || launchDate) + '","' + (r.regTimeStr || "") + '","' + c.city + '","' + c.country + '","' + c.time12 + '","' + c.time24 + '","' + c.date + '","' + (c.dayDiff || "") + '","' + c.offset + '","' + c.locale + '","' + c.tz + '"\n';
      });
    });
    return csv;
  };

  var genTXT = function () {
    var bar = "=".repeat(78);
    var t = bar + "\n  " + displayTitle.toUpperCase() + "\n" + bar + "\n\n";
    if (mode === "simultaneous") {
      t += "  Date:  " + launchDate + "\n";
      t += "  Time:  " + fmtTime(refDate, "America/Los_Angeles") + " PT\n";
    } else {
      t += "  Mode:  Regional (per-anchor local time)\n";
    }
    t += "\n" + "-".repeat(78) + "\n";
    allData.forEach(function (r) {
      var activeCities = r.cities.filter(function (c) { return enabled[c.id]; });
      if (activeCities.length === 0) return;
      t += "\n  " + r.icon + " " + r.key;
      if (mode === "regional") t += " -- Anchor: " + r.anchorCity.city;
      t += "\n";
      if (mode === "regional") {
        t += "  Date: " + r.regDate + "  |  Time: " + r.regTimeStr + (r.isCustom ? " [custom]" : "") + "\n";
      }
      t += "  " + "-".repeat(64) + "\n";
      if (mode === "regional" && r.key !== "AMERICAS" && laDataForRegion[r.key]) {
        var la = laDataForRegion[r.key];
        t += "  " + "* LA (your team)".padEnd(20) + (la.time12 + (la.dayDiff ? " " + la.dayDiff : "")).padEnd(14) + la.time24.padEnd(8) + la.date.padEnd(20) + la.offset + "\n";
      }
      activeCities.forEach(function (c) {
        t += "  " + c.city.padEnd(20) + (c.time12 + (c.dayDiff ? " " + c.dayDiff : "")).padEnd(14) + c.time24.padEnd(8) + c.date.padEnd(20) + c.offset.padEnd(12) + c.locale + "\n";
      });
    });
    t += "\n" + bar + "\n";
    return t;
  };

  var handleExportCSV = function () { dlBlob(genCSV(), filePrefix + ".csv", "text/csv"); setShowExp(false); notify("CSV downloaded"); };
  var handleExportTXT = function () { dlBlob(genTXT(), filePrefix + ".txt", "text/plain"); setShowExp(false); notify("TXT downloaded"); };
  var handleExportPDF = function () {
    var rows = [];
    allData.forEach(function (r) {
      var activeCities = r.cities.filter(function (c) { return enabled[c.id]; });
      if (activeCities.length === 0) return;
      rows.push({ isHeader: true, text: r.key + (mode === "regional" ? "  -  Anchor: " + r.anchorCity.city + "  |  " + r.regDate + "  " + r.regTimeStr : "") });
      if (mode === "regional" && r.key !== "AMERICAS" && laDataForRegion[r.key]) {
        var la = laDataForRegion[r.key];
        rows.push({ city: "* LA (your team)", time12: la.time12, time24: la.time24, date: la.date, dayDiff: la.dayDiff, offset: la.offset, locale: la.locale });
      }
      activeCities.forEach(function (c) { rows.push(c); });
    });
    var sub = mode === "simultaneous"
      ? launchDate + "  |  " + fmtTime(refDate, "America/Los_Angeles") + " PT  |  Simultaneous"
      : "Regional Launch  |  Per-anchor local times";
    dlBlob(buildPDF(displayTitle + " - All Markets", sub, rows), filePrefix + ".pdf", "application/pdf");
    setShowExp(false);
    notify("PDF downloaded");
  };

  // Render helpers
  var hours = Array.from({ length: 12 }, function (_, i) { return i + 1; });
  var mins = [0, 15, 30, 45];
  var cH = mode === "simultaneous" ? lH : rH;
  var cM2 = mode === "simultaneous" ? lM : rM;
  var cAP = mode === "simultaneous" ? lAP : rAP;
  var sH2 = mode === "simultaneous" ? setLH : setRH;
  var sM2 = mode === "simultaneous" ? setLM : setRM;
  var sAP2 = mode === "simultaneous" ? setLAP : setRAP;

  return (
    <div style={S.wrap}>
      <div style={S.bg} />

      {toast && (
        <div style={S.toast}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ marginRight: 6 }}>
            <path d="M3 8.5l3.5 3.5L13 4" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {toast}
        </div>
      )}

      <header style={S.header}>
        <div style={S.headerIn}>
          <div style={S.logoRow}>
            <div style={S.badge}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2"/>
                <path d="M12 6v6.5l4 2.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h1 style={S.title}>{launchName ? launchName.toUpperCase() : "LAUNCH TIMES"}</h1>
              <p style={S.sub}>{launchName ? "Launch Times" : "Global Time Zone Converter"}</p>
            </div>
          </div>
          <div ref={expRef} style={{ position: "relative" }}>
            <button style={S.expBtn} onClick={function () { setShowExp(!showExp); }}>
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ marginRight: 7 }}>
                <path d="M8 1v9m-3.5-3.5L8 10l3.5-3.5M2 12.5v1.5h12v-1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Export
            </button>
            {showExp && (
              <div style={S.dd}>
                {[
                  { fn: handleExportCSV, ic: "📊", l: "CSV", d: "Spreadsheet-ready" },
                  { fn: handleExportTXT, ic: "📄", l: "TXT", d: "Plain text" },
                  { fn: handleExportPDF, ic: "📕", l: "PDF", d: "Printable document" },
                ].map(function (e) {
                  return (
                    <button key={e.l} style={S.ddItem} onClick={e.fn}
                      onMouseEnter={function (ev) { ev.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                      onMouseLeave={function (ev) { ev.currentTarget.style.background = "transparent"; }}>
                      <span style={{ fontSize: 17 }}>{e.ic}</span>
                      <div style={{ flex: 1, textAlign: "left" }}>
                        <div style={{ fontWeight: 600 }}>Export {e.l}</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{e.d}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </header>

      <div style={S.sec}>
        <div style={S.modeWrap}>
          <button style={{ ...S.modeBtn, ...(mode === "simultaneous" ? S.modeBtnOn : {}) }}
            onClick={function () { setMode("simultaneous"); }}>
            <span style={{ fontSize: 20 }}>🌐</span>
            <span style={{ fontWeight: 600 }}>Same Time Global</span>
            <span style={{ fontSize: 10, opacity: 0.5 }}>One PT time → all cities</span>
          </button>
          <button style={{ ...S.modeBtn, ...(mode === "regional" ? S.modeBtnOn : {}) }}
            onClick={function () { setMode("regional"); }}>
            <span style={{ fontSize: 20 }}>🗺️</span>
            <span style={{ fontWeight: 600 }}>By Region</span>
            <span style={{ fontSize: 10, opacity: 0.5 }}>Custom date & time per region</span>
          </button>
        </div>
      </div>

      <div style={S.sec}>
        <div style={S.card}>
          <label style={S.lbl}>LAUNCH NAME <span style={{ fontWeight: 400, letterSpacing: 0, textTransform: "none", opacity: 0.6 }}>(optional)</span></label>
          <input
            type="text"
            value={launchName}
            onChange={function (e) { setLaunchName(e.target.value); }}
            placeholder="e.g. XYZ Global Launch"
            style={S.nameIn} />
        </div>
      </div>

      <div style={S.sec}>
        <div style={S.inputGrid}>
          <div style={S.card}>
            <label style={S.lbl}>{mode === "regional" && anyCustom ? "DEFAULT LAUNCH DATE" : "LAUNCH DATE"}</label>
            <input type="date" value={launchDate} onChange={function (e) { setLaunchDate(e.target.value); }} style={S.dateIn} />
          </div>
          <div style={S.card}>
            <label style={S.lbl}>{mode === "simultaneous" ? "LAUNCH TIME (PT)" : (anyCustom ? "DEFAULT LOCAL TIME" : "LOCAL TIME (at anchor)")}</label>
            <div style={S.timeRow}>
              <select value={cH} onChange={function (e) { sH2(Number(e.target.value)); }} style={S.sel}>
                {hours.map(function (h) { return <option key={h} value={h}>{h}</option>; })}
              </select>
              <span style={S.colon}>:</span>
              <select value={cM2} onChange={function (e) { sM2(Number(e.target.value)); }} style={S.sel}>
                {mins.map(function (m) { return <option key={m} value={m}>{String(m).padStart(2, "0")}</option>; })}
              </select>
              <select value={cAP} onChange={function (e) { sAP2(e.target.value); }} style={S.sel}>
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
            {mode === "regional" && <div style={S.defaultHint}>Applies to regions without custom overrides</div>}
          </div>
        </div>
      </div>

      <div style={S.sec}>
        <div style={S.selBar}>
          <div style={S.selBarLeft}>
            <button style={S.selBtn} onClick={selectAll}>
              <span style={{ ...S.chk, ...(allChecked ? S.chkOn : {}) }}>
                {allChecked && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                {!allChecked && !noneChecked && <span style={{ width: 6, height: 2, background: "#fff", borderRadius: 1, display: "block" }} />}
              </span>
              {allChecked ? "Deselect All" : "Select All"}
            </button>
            <span style={S.selCount}>{enabledCount} of {allIds.length} cities</span>
          </div>
          {enabledCount < allIds.length && (
            <span style={S.selHint}>Unchecked cities excluded from exports</span>
          )}
        </div>
      </div>

      <div style={S.sec}>
        {allData.map(function (r, ri) {
          var laRow = laDataForRegion[r.key];
          return (
            <div key={r.key} style={{ ...S.rBlock, animationDelay: ri * 0.07 + "s" }}>
              <div style={S.rHead}>
                <button style={S.regToggle} onClick={function () { toggleRegion(r.ids); }}>
                  <span style={{ ...S.chk, ...S.chkSm, ...(regionCheckedCount(r.ids) === r.ids.length ? S.chkOn : regionCheckedCount(r.ids) > 0 ? S.chkMix : {}) }}>
                    {regionCheckedCount(r.ids) === r.ids.length && <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    {regionCheckedCount(r.ids) > 0 && regionCheckedCount(r.ids) < r.ids.length && <span style={{ width: 5, height: 2, background: "#fff", borderRadius: 1, display: "block" }} />}
                  </span>
                </button>
                <span style={{ fontSize: 22 }}>{r.icon}</span>
                <h2 style={S.rTitle}>{r.key}</h2>
                <span style={S.regCount}>{regionCheckedCount(r.ids)}/{r.ids.length}</span>
                {mode === "regional" && (
                  <div style={S.anchorPick}>
                    <span style={S.anchorPickLabel}>Anchor:</span>
                    <select
                      value={anchors[r.key]}
                      onChange={function (e) { setAnchors(function (p) { var n = { ...p }; n[r.key] = e.target.value; return n; }); }}
                      style={S.anchorSel}>
                      {r.ids.map(function (id) {
                        var c = getCity(id);
                        return <option key={id} value={id}>{c.flag} {c.city}</option>;
                      })}
                    </select>
                  </div>
                )}
              </div>

              {mode === "regional" && (
                <div style={{ marginBottom: 8 }}>
                  <button
                    style={{ ...S.customToggle, ...(regConf[r.key].custom ? { ...S.customToggleOn, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 } : {}) }}
                    onClick={function () { updateRegConf(r.key, "custom", !regConf[r.key].custom); }}>
                    <span style={{ ...S.chk, ...S.chkXs, ...(regConf[r.key].custom ? S.chkOn : {}) }}>
                      {regConf[r.key].custom && <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </span>
                    <span>Custom Date & Time</span>
                    {!regConf[r.key].custom && <span style={S.customDefault}>using default</span>}
                  </button>

                  {regConf[r.key].custom && (
                    <div style={S.customPanel}>
                      <div style={S.customRow}>
                        <label style={S.customLbl}>DATE</label>
                        <input type="date" value={regConf[r.key].date}
                          onChange={function (e) { updateRegConf(r.key, "date", e.target.value); }}
                          style={S.customDateIn} />
                      </div>
                      <div style={S.customRow}>
                        <label style={S.customLbl}>TIME</label>
                        <div style={S.customTimeRow}>
                          <select value={regConf[r.key].h}
                            onChange={function (e) { updateRegConf(r.key, "h", Number(e.target.value)); }}
                            style={S.customSel}>
                            {hours.map(function (hh) { return <option key={hh} value={hh}>{hh}</option>; })}
                          </select>
                          <span style={{ color: "rgba(255,255,255,0.3)" }}>:</span>
                          <select value={regConf[r.key].m}
                            onChange={function (e) { updateRegConf(r.key, "m", Number(e.target.value)); }}
                            style={S.customSel}>
                            {mins.map(function (mm) { return <option key={mm} value={mm}>{String(mm).padStart(2, "0")}</option>; })}
                          </select>
                          <select value={regConf[r.key].ap}
                            onChange={function (e) { updateRegConf(r.key, "ap", e.target.value); }}
                            style={S.customSel}>
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {mode === "regional" && (
                <div style={{ ...S.aBar, ...(regConf[r.key].custom ? { borderColor: "rgba(168,85,247,0.3)", background: "rgba(168,85,247,0.06)" } : {}) }}>
                  <div style={S.aBarL}>
                    <span style={{ fontSize: 16 }}>{r.anchorCity.flag}</span>
                    <div>
                      <div style={{ ...S.aCity, ...(regConf[r.key].custom ? { color: "#a855f7" } : {}) }}>{r.anchorCity.city}</div>
                      <div style={S.aRole}>{regConf[r.key].custom ? "CUSTOM" : "ANCHOR"}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ ...S.aTime, ...(regConf[r.key].custom ? { color: "#a855f7" } : {}) }}>{fmtTime(r.regionDate, r.anchorTz)}</div>
                    <div style={S.aDate}>{fmtDate(r.regionDate, r.anchorTz)}</div>
                  </div>
                </div>
              )}

              {mode === "regional" && r.key !== "AMERICAS" && laRow && (
                <button style={S.laBar}
                  onClick={function () {
                    handleCopy("🇺🇸 Los Angeles: " + laRow.time12 + (laRow.dayDiff ? " " + laRow.dayDiff : "") + " (" + laRow.date + ") | " + laRow.offset, "la-" + r.key);
                  }}>
                  {copiedId === "la-" + r.key && (
                    <div style={S.laBarCopied}>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8.5l3.5 3.5L13 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Copied!
                    </div>
                  )}
                  <div style={S.laBarL}>
                    <span style={{ fontSize: 14 }}>🏠</span>
                    <span style={{ fontSize: 15 }}>🇺🇸</span>
                    <div>
                      <div style={S.laCity}>Los Angeles</div>
                      <div style={S.laRole}>YOUR TEAM</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={S.laTime}>
                      {laRow.time12}
                      {laRow.dayDiff && <span style={{ fontSize: 10, color: "#E31937", marginLeft: 4 }}>{laRow.dayDiff}</span>}
                    </div>
                    <div style={S.laDate}>{laRow.date}</div>
                  </div>
                </button>
              )}

              <div style={S.grid}>
                {r.cities.map(function (c) {
                  var color = c.peak ? "#22c55e" : c.biz ? "#f59e0b" : "#ef4444";
                  var str = c.flag + " " + c.city + ": " + c.time12 + (c.dayDiff ? " " + c.dayDiff : "") + " (" + c.date + ") | " + c.offset + " | " + c.locale;
                  var cid = r.key + "-" + c.id;
                  var copied = copiedId === cid;
                  var isAnch = mode === "regional" && c.id === anchors[r.key];
                  var isOn = enabled[c.id];
                  return (
                    <div key={c.id} style={S.cardWrap}>
                      <button
                        style={{
                          ...S.cityCard,
                          borderColor: copied ? "rgba(227,25,55,0.5)" : isAnch ? "rgba(227,25,55,0.25)" : "rgba(255,255,255,0.07)",
                          background: isAnch ? "rgba(227,25,55,0.06)" : "rgba(255,255,255,0.035)",
                          opacity: isOn ? 1 : 0.35,
                          borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
                        }}
                        onClick={function () { handleCopy(str, cid); }}>
                      {copied && (
                        <div style={S.overlay}>
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M4 10.5l4 4L16 5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Copied!
                        </div>
                      )}
                      <div style={S.cardTop}>
                        <span style={{ fontSize: 18 }}>{c.flag}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          {isAnch && <span style={S.anchTag}>ANCHOR</span>}
                          <div style={{ width: 7, height: 7, borderRadius: "50%", background: color }} />
                        </div>
                      </div>
                      <div style={S.cN}>{c.city}</div>
                      <div style={S.cT}>{c.time12}</div>
                      {c.dayDiff && <span style={S.dayB}>{c.dayDiff}</span>}
                      <div style={S.cD}>{c.date}</div>
                      <div style={S.cO}>{c.offset}</div>
                      <div style={S.cL}>{c.locale}</div>
                      </button>
                      <button
                        style={{ ...S.cardChkBar, opacity: isOn ? 1 : 0.5 }}
                        onClick={function (ev) { ev.stopPropagation(); toggleCity(c.id); }}>
                        <span style={{ ...S.chk, ...S.chkXs, ...(isOn ? S.chkOn : {}) }}>
                          {isOn && <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                        </span>
                        <span style={S.chkLabel}>{isOn ? "incl." : "excl."}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ ...S.sec, textAlign: "center", paddingBottom: 8 }}>
        <button
          style={{ ...S.copyAll, ...(copiedId === "all" ? { background: "rgba(227,25,55,0.22)", borderColor: "rgba(227,25,55,0.5)" } : {}) }}
          onClick={function () { handleCopy(genCopyAll(), "all"); }}>
          {copiedId === "all" ? (
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M3 8.5l3.5 3.5L13 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Copied to Clipboard!
            </span>
          ) : (
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M10 4V2.5A1.5 1.5 0 008.5 1h-6A1.5 1.5 0 001 2.5v6A1.5 1.5 0 002.5 10H4" stroke="currentColor" strokeWidth="1.3" />
              </svg>
              Copy {enabledCount < allIds.length ? enabledCount + " Selected" : "All"} Times
            </span>
          )}
        </button>
      </div>

      <div style={S.legend}>
        {[
          { c: "#22c55e", l: "Daytime (9a–6p)" },
          { c: "#f59e0b", l: "Early/Evening" },
          { c: "#ef4444", l: "Night" },
        ].map(function (x) {
          return (
            <div key={x.l} style={S.legI}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: x.c }} />
              <span>{x.l}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── STYLES ──────────────────────────────────────────────────────────────
const S = {
  wrap: { minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: "'SF Pro Display',-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif", position: "relative" },
  bg: { position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: "radial-gradient(circle at 20% 20%,rgba(227,25,55,0.06) 0%,transparent 50%),radial-gradient(circle at 80% 80%,rgba(227,25,55,0.04) 0%,transparent 50%)" },
  toast: { position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 999, background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", padding: "10px 24px", borderRadius: 10, fontSize: 13, fontWeight: 600, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", animation: "fadeIn 0.15s ease", display: "flex", alignItems: "center" },
  header: { position: "relative", zIndex: 2, padding: "22px 16px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(10,10,10,0.85)", backdropFilter: "blur(12px)" },
  headerIn: { maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" },
  logoRow: { display: "flex", alignItems: "center", gap: 14 },
  badge: { width: 42, height: 42, borderRadius: "50%", background: "#E31937", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 22, fontFamily: "Georgia,serif", color: "#fff", flexShrink: 0 },
  title: { fontSize: 20, fontWeight: 700, letterSpacing: 3, margin: 0, lineHeight: 1.2 },
  sub: { fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "2px 0 0" },
  expBtn: { display: "flex", alignItems: "center", padding: "9px 16px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" },
  dd: { position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 100, background: "#161616", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 6, minWidth: 220, boxShadow: "0 20px 60px rgba(0,0,0,0.7)", animation: "fadeIn 0.12s ease" },
  ddItem: { display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "12px 14px", borderRadius: 8, border: "none", background: "transparent", color: "#fff", fontSize: 13, fontFamily: "inherit", cursor: "pointer", textAlign: "left" },
  sec: { position: "relative", zIndex: 1, maxWidth: 960, margin: "0 auto", padding: "18px 16px 0", overflow: "hidden" },
  modeWrap: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, background: "rgba(255,255,255,0.03)", borderRadius: 14, padding: 5, border: "1px solid rgba(255,255,255,0.06)" },
  modeBtn: { display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "13px 12px 11px", borderRadius: 10, border: "none", background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 13, fontFamily: "inherit" },
  modeBtnOn: { background: "rgba(227,25,55,0.12)", color: "#fff", boxShadow: "inset 0 0 0 1px rgba(227,25,55,0.3)" },
  inputGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, overflow: "hidden" },
  card: { background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 16, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden", minWidth: 0 },
  lbl: { display: "block", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: "rgba(255,255,255,0.35)", marginBottom: 10 },
  dateIn: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", colorScheme: "dark", minWidth: 0, maxWidth: "100%" },
  nameIn: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", minWidth: 0 },
  timeRow: { display: "flex", alignItems: "center", gap: 4, minWidth: 0 },
  sel: { flex: 1, padding: "10px 2px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 14, fontFamily: "inherit", outline: "none", cursor: "pointer", appearance: "none", textAlign: "center", colorScheme: "dark", minWidth: 0 },
  colon: { color: "rgba(255,255,255,0.3)", fontSize: 18, fontWeight: 300 },
  rBlock: { marginBottom: 26, animation: "fadeInUp 0.4s ease both" },
  rHead: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" },
  rTitle: { fontSize: 13, fontWeight: 700, letterSpacing: 2, margin: 0, color: "rgba(255,255,255,0.6)" },
  anchorPick: { display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" },
  anchorPickLabel: { fontSize: 10, fontWeight: 600, letterSpacing: 1, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" },
  anchorSel: { padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(227,25,55,0.25)", background: "rgba(227,25,55,0.06)", color: "#fff", fontSize: 12, fontFamily: "inherit", outline: "none", cursor: "pointer", colorScheme: "dark" },
  aBar: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(227,25,55,0.07)", border: "1px solid rgba(227,25,55,0.2)", borderRadius: 10, padding: "12px 16px", marginBottom: 8 },
  aBarL: { display: "flex", alignItems: "center", gap: 10 },
  aCity: { fontSize: 13, fontWeight: 700, color: "#E31937" },
  aRole: { fontSize: 8, fontWeight: 700, letterSpacing: 1.5, color: "rgba(227,25,55,0.6)", marginTop: 1 },
  aTime: { fontSize: 18, fontWeight: 700, color: "#E31937" },
  aDate: { fontSize: 11, color: "rgba(255,255,255,0.35)" },
  defaultHint: { fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 8, fontStyle: "italic" },
  customToggle: { display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", width: "100%", textAlign: "left" },
  customToggleOn: { borderColor: "rgba(168,85,247,0.3)", background: "rgba(168,85,247,0.06)", color: "#a855f7" },
  customDefault: { fontSize: 9, color: "rgba(255,255,255,0.2)", marginLeft: "auto", fontWeight: 400, fontStyle: "italic" },
  customPanel: { display: "flex", gap: 12, padding: "10px 12px", marginTop: 0, borderRadius: "0 0 8px 8px", border: "1px solid rgba(168,85,247,0.2)", borderTop: "none", background: "rgba(168,85,247,0.04)", flexWrap: "wrap" },
  customRow: { display: "flex", alignItems: "center", gap: 8 },
  customLbl: { fontSize: 9, fontWeight: 700, letterSpacing: 1.2, color: "rgba(168,85,247,0.6)", textTransform: "uppercase", minWidth: 32 },
  customDateIn: { padding: "5px 8px", borderRadius: 6, border: "1px solid rgba(168,85,247,0.25)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 12, fontFamily: "inherit", outline: "none", colorScheme: "dark" },
  customTimeRow: { display: "flex", alignItems: "center", gap: 4 },
  customSel: { padding: "5px 4px", borderRadius: 6, border: "1px solid rgba(168,85,247,0.25)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 12, fontFamily: "inherit", outline: "none", cursor: "pointer", appearance: "none", textAlign: "center", colorScheme: "dark", minWidth: 38 },
  laBar: { position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.18)", borderRadius: 10, padding: "10px 16px", marginBottom: 12, cursor: "pointer", width: "100%", fontFamily: "inherit", color: "#fff", overflow: "hidden" },
  laBarCopied: { position: "absolute", inset: 0, zIndex: 5, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(59,130,246,0.92)", borderRadius: 9, fontSize: 12, fontWeight: 700, color: "#fff", animation: "fadeIn 0.1s ease" },
  laBarL: { display: "flex", alignItems: "center", gap: 8 },
  laCity: { fontSize: 13, fontWeight: 700, color: "#3b82f6" },
  laRole: { fontSize: 8, fontWeight: 700, letterSpacing: 1.5, color: "rgba(59,130,246,0.7)", marginTop: 1 },
  laTime: { fontSize: 16, fontWeight: 700, color: "#fff" },
  laDate: { fontSize: 11, color: "rgba(255,255,255,0.35)" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 8 },
  cityCard: { position: "relative", borderRadius: 12, padding: "14px 10px 10px", textAlign: "center", cursor: "pointer", fontFamily: "inherit", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" },
  overlay: { position: "absolute", inset: 0, zIndex: 5, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, background: "rgba(227,25,55,0.93)", borderRadius: 11, fontSize: 12, fontWeight: 700, color: "#fff", animation: "fadeIn 0.1s ease" },
  cardTop: { display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: 4 },
  anchTag: { fontSize: 7, fontWeight: 700, letterSpacing: 1, color: "#E31937", background: "rgba(227,25,55,0.15)", padding: "2px 5px", borderRadius: 3 },
  cN: { fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.55)" },
  cT: { fontSize: 17, fontWeight: 700, color: "#fff", lineHeight: 1.3 },
  dayB: { display: "inline-block", fontSize: 9, fontWeight: 700, background: "rgba(227,25,55,0.2)", color: "#E31937", padding: "1px 6px", borderRadius: 4 },
  cD: { fontSize: 10, color: "rgba(255,255,255,0.28)", marginTop: 1 },
  cO: { fontSize: 9, color: "rgba(255,255,255,0.16)", fontFamily: "'SF Mono',monospace" },
  cL: { fontSize: 9, color: "rgba(227,25,55,0.4)", fontWeight: 600, marginTop: 1 },
  copyAll: { display: "inline-flex", alignItems: "center", padding: "13px 28px", borderRadius: 10, border: "1px solid rgba(227,25,55,0.3)", background: "rgba(227,25,55,0.07)", color: "#E31937", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" },
  selBar: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 16px", flexWrap: "wrap", gap: 8 },
  selBarLeft: { display: "flex", alignItems: "center", gap: 12 },
  selBtn: { display: "flex", alignItems: "center", gap: 7, padding: "5px 10px 5px 6px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" },
  selCount: { fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 500 },
  selHint: { fontSize: 10, color: "rgba(227,25,55,0.5)", fontWeight: 500, fontStyle: "italic" },
  chk: { width: 16, height: 16, borderRadius: 4, border: "1.5px solid rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" },
  chkOn: { background: "#E31937", borderColor: "#E31937" },
  chkMix: { background: "rgba(227,25,55,0.5)", borderColor: "rgba(227,25,55,0.5)" },
  chkSm: { width: 14, height: 14, borderRadius: 3 },
  chkXs: { width: 14, height: 14, borderRadius: 3 },
  regToggle: { display: "flex", alignItems: "center", padding: 0, border: "none", background: "transparent", cursor: "pointer", flexShrink: 0 },
  regCount: { fontSize: 10, color: "rgba(255,255,255,0.2)", fontWeight: 500, marginLeft: 2 },
  cardChkBar: { display: "flex", alignItems: "center", justifyContent: "center", gap: 5, width: "100%", padding: "4px 0", border: "1px solid rgba(255,255,255,0.07)", borderTop: "none", borderBottomLeftRadius: 8, borderBottomRightRadius: 8, background: "rgba(255,255,255,0.02)", cursor: "pointer", fontFamily: "inherit", color: "rgba(255,255,255,0.35)" },
  cardWrap: { display: "flex", flexDirection: "column" },
  chkLabel: { fontSize: 8, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" },
  legend: { position: "relative", zIndex: 1, maxWidth: 960, margin: "0 auto", padding: "20px 16px 40px", display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap" },
  legI: { display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "rgba(255,255,255,0.28)" },
};

if (typeof document !== "undefined" && !document.getElementById("btz")) {
  var e = document.createElement("style");
  e.id = "btz";
  e.textContent = "@keyframes fadeInUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}@media(max-width:520px){input[type=date]{font-size:13px!important;padding:8px 6px!important}select{font-size:13px!important;padding:8px 2px!important}}";
  document.head.appendChild(e);
}
