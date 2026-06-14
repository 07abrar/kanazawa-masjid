import { useState, useEffect, Fragment } from "react";
import { useLang } from "../contexts/LanguageContext";
import { useSEO } from "../hooks/useSEO";
import { formatDate } from "../utils/markdown";
import WhatsAppLink from "../components/WhatsAppLink";
import { CONTACT } from "../config/contact";

const SHEET_ID = "11GeEfw_G2_xCclXFn3zFQNvaQwTQYgvTwO6R6wf5Oas";
const DASHBOARD_GID = "611076386";
const PORTION_MAP_GID = "1768165631";
const PROJECT_SETTINGS_GID = "497769113";
const DONORS_GID = "1464600789";

const DASHBOARD_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/pub?output=csv&gid=${DASHBOARD_GID}`;
const PORTION_MAP_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/pub?output=csv&gid=${PORTION_MAP_GID}`;
const PROJECT_SETTINGS_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/pub?output=csv&gid=${PROJECT_SETTINGS_GID}`;
const DONORS_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/pub?output=csv&gid=${DONORS_GID}`;

function parseCSV(text) {
  const rows = [];
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const cols = [];
    let inQuote = false;
    let cell = "";
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuote = !inQuote;
        }
      } else if (ch === "," && !inQuote) {
        cols.push(cell);
        cell = "";
      } else {
        cell += ch;
      }
    }
    cols.push(cell);
    rows.push(cols);
  }
  return rows;
}

function parseDashboard(rows) {
  const r3 = rows[3] || [];
  const r7 = rows[7] || [];
  const r8 = rows[8] || [];
  const r9 = rows[9] || [];
  const r10 = rows[10] || [];
  const r11 = rows[11] || [];
  const percentStr = (r11[4] || "0%").trim();
  const percentNum = Math.min(100, Math.max(0, parseFloat(percentStr.replace("%", "")) || 0));
  return {
    totalPortions: (r3[1] || "0").trim(),
    portionsTaken: (r3[2] || "0").trim(),
    portionsReserved: (r3[3] || "0").trim(),
    portionsAvailable: (r3[4] || "0").trim(),
    costPerPortion: (r7[4] || "").trim(),
    totalTargetAmount: (r8[4] || "").trim(),
    amountCollected: (r9[4] || "").trim(),
    amountReserved: (r10[4] || "").trim(),
    percentFundedStr: percentStr,
    percentFundedNum: percentNum,
  };
}

function parseProjectSettings(rows) {
  const get = (idx) => ((rows[idx] || [])[4] || "").trim();
  return {
    projectName: get(1),
    totalPortions: get(2),
    costPerPortion: get(3),
    currency: get(4),
    bank: get(5),
    branchCode: get(6),
    accountNumber: get(7),
    contact: get(8),
    website: get(9),
    propertyAddress: get(10),
  };
}

const STATUS_MAP = { Paid: "paid", Avail: "available", Reserved: "reserved" };

function parsePortionMap(rows) {
  const portions = [];
  for (let r = 3; r <= 22; r++) {
    if (r >= rows.length) break;
    const row = rows[r];
    for (let c = 1; c <= 15; c++) {
      const raw = (row[c] || "").trim();
      const status = STATUS_MAP[raw] || "available";
      portions.push({ id: (r - 3) * 15 + (c - 1) + 1, status });
    }
  }
  return portions;
}

function parseDonors(rows) {
  const donors = [];
  for (let r = 3; r < rows.length; r++) {
    const row = rows[r];
    const idVal = (row[0] || "").trim();
    if (!idVal || isNaN(Number(idVal))) continue;
    donors.push({
      id: Number(idVal),
      fromPortion: (row[1] || "").trim(),
      toPortion: (row[2] || "").trim(),
      // col 3 is donor name — intentionally skipped (privacy)
      status: (row[4] || "").trim() === "Paid" ? "paid" : "reserved",
      qtyPortions: (row[5] || "").trim(),
      amount: (row[6] || "").trim(),
      date: (row[7] || "").trim(),
      notes: (row[8] || "").trim(),
    });
  }
  return donors;
}

function getLastUpdated(donors) {
  let latest = null;
  for (const d of donors) {
    if (!d.date) continue;
    const dt = new Date(d.date);
    if (!isNaN(dt) && (!latest || dt > latest)) latest = dt;
  }
  return latest ? latest.toISOString().slice(0, 10) : null;
}

function StatCard({ label, value, colorClass }) {
  return (
    <div className={`card ${colorClass}`}>
      <p className="text-sm font-medium mb-1">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

function Skeleton({ className }) {
  return <div className={`bg-gray-200 rounded animate-pulse ${className}`} />;
}

export default function Wakaf() {
  const { t, lang } = useLang();
  useSEO(t("wakaf.pageTitle"), t("wakaf.pageDesc"));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [portions, setPortions] = useState([]);
  const [settings, setSettings] = useState(null);
  const [donors, setDonors] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch(DASHBOARD_URL).then((r) => { if (!r.ok) throw new Error(); return r.text(); }),
      fetch(PORTION_MAP_URL).then((r) => { if (!r.ok) throw new Error(); return r.text(); }),
      fetch(PROJECT_SETTINGS_URL).then((r) => { if (!r.ok) throw new Error(); return r.text(); }),
      fetch(DONORS_URL).then((r) => { if (!r.ok) throw new Error(); return r.text(); }),
    ])
      .then(([dashText, mapText, settingsText, donorsText]) => {
        const parsedDonors = parseDonors(parseCSV(donorsText));
        setDashboard(parseDashboard(parseCSV(dashText)));
        setPortions(parsePortionMap(parseCSV(mapText)));
        setSettings(parseProjectSettings(parseCSV(settingsText)));
        setDonors(parsedDonors);
        setLastUpdated(getLastUpdated(parsedDonors));
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="section-title">{t("wakaf.pageTitle")}</h1>
      <p className="text-gray-600 mb-8 max-w-2xl">{t("wakaf.intro")}</p>

      {/* Skeleton loading */}
      {loading && (
        <>
          {/* CTA skeleton */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="h-40" />
          </div>

          {/* Stat cards skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>

          {/* Financial + progress skeleton */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="card space-y-2">
              {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-8" />)}
            </div>
            <div className="card">
              <Skeleton className="h-full min-h-[160px]" />
            </div>
          </div>

          {/* Portion map skeleton */}
          <div className="grid gap-[2px] mb-8" style={{ gridTemplateColumns: "repeat(15, 1fr)" }}>
            {Array.from({ length: 300 }, (_, i) => (
              <Skeleton key={i} className="aspect-square rounded-sm" />
            ))}
          </div>

          {/* Donor table skeleton */}
          <div className="space-y-2">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-10" />)}
          </div>
        </>
      )}

      {/* Error */}
      {error && (
        <div className="card bg-red-50 text-red-700 text-center py-10">
          {t("wakaf.errorMsg")}
        </div>
      )}

      {/* Loaded content */}
      {!loading && !error && dashboard && settings && (
        <>
          {/* How to Donate CTA */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-bold text-green-800 mb-4">{t("wakaf.howToDonate")}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Step 1 */}
              <div>
                <p className="text-sm font-semibold text-green-700 mb-2">{t("wakaf.step1")}</p>
                <div className="space-y-1.5">
                  {[
                    [t("wakaf.bank"), settings.bank],
                    [t("wakaf.branchCode"), settings.branchCode],
                    [t("wakaf.accountNumber"), settings.accountNumber],
                  ].map(([label, value]) => (
                    <div key={label} className="flex gap-3 text-sm">
                      <span className="text-gray-500 min-w-[7.5rem] shrink-0">{label}</span>
                      <span className="font-mono font-semibold text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 2 */}
              <div>
                <p className="text-sm font-semibold text-green-700 mb-2">{t("wakaf.step2")}</p>
                <p className="text-sm text-gray-700 mb-3">
                  {t("wakaf.ctaText").replace("{contact}", settings.contact)}
                </p>
                <WhatsAppLink
                  href={CONTACT.imam.whatsapp}
                  className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  {settings.contact}
                </WhatsAppLink>
              </div>
            </div>
          </div>

          {/* Dashboard */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{t("wakaf.dashboard")}</h2>

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard label={t("wakaf.totalPortions")} value={dashboard.totalPortions} colorClass="" />
              <StatCard label={t("wakaf.portionsTaken")} value={dashboard.portionsTaken} colorClass="bg-green-50 text-green-700" />
              <StatCard label={t("wakaf.portionsReserved")} value={dashboard.portionsReserved} colorClass="bg-amber-50 text-amber-700" />
              <StatCard label={t("wakaf.portionsAvailable")} value={dashboard.portionsAvailable} colorClass="bg-blue-50 text-blue-700" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch mb-8">
              {/* Financial summary */}
              <div className="card">
                <h3 className="font-semibold text-gray-700 mb-3">{t("wakaf.financialSummary")}</h3>
                <div className="divide-y divide-gray-100">
                  {[
                    [t("wakaf.costPerPortion"), dashboard.costPerPortion],
                    [t("wakaf.totalTargetAmount"), dashboard.totalTargetAmount],
                    [t("wakaf.amountCollected"), dashboard.amountCollected],
                    [t("wakaf.amountReserved"), dashboard.amountReserved],
                    [t("wakaf.percentFunded"), dashboard.percentFundedStr],
                  ].map(([label, value], i) => (
                    <div
                      key={label}
                      className={`flex justify-between py-2 text-sm ${i % 2 !== 0 ? "bg-gray-50 -mx-4 px-4" : ""}`}
                    >
                      <span className="text-gray-600">{label}</span>
                      <span className="font-medium text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Funding progress */}
              <div className="card flex flex-col justify-center">
                <h3 className="font-semibold text-gray-700 mb-4">{t("wakaf.fundingProgress")}</h3>
                <p className="text-4xl font-bold text-primary-600 mb-1">{dashboard.percentFundedStr}</p>
                <p className="text-sm text-gray-500 mb-4">{t("wakaf.ofTargetFunded")}</p>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-primary-600 h-4 rounded-full transition-all"
                    style={{ width: `${dashboard.percentFundedNum}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  {t("wakaf.paid")}: {dashboard.portionsTaken} {t("wakaf.portions")} · {t("wakaf.reserved")}: {dashboard.portionsReserved} {t("wakaf.portions")}
                </p>
              </div>
            </div>
          </section>

          {/* Portion Map */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 mb-1">{t("wakaf.portionMap")}</h2>
            <p className="text-sm text-gray-500 mb-4">{t("wakaf.portionMapDesc")}</p>

            {/* Legend */}
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-sm bg-green-600 inline-block" />
                <span className="text-sm text-gray-600">{t("wakaf.paid")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-sm bg-amber-400 inline-block" />
                <span className="text-sm text-gray-600">{t("wakaf.reserved")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-sm bg-gray-100 border border-gray-300 inline-block" />
                <span className="text-sm text-gray-600">{t("wakaf.available")}</span>
              </div>
            </div>

            <div className="grid gap-[2px]" style={{ gridTemplateColumns: "repeat(15, 1fr) auto" }}>
              {/* X-axis header */}
              {Array.from({ length: 15 }, (_, i) => (
                <div key={i} className="h-5 flex items-center justify-center text-[10px] text-gray-400">
                  {i + 1}
                </div>
              ))}
              <div className="h-5" />

              {/* Data rows */}
              {Array.from({ length: 20 }, (_, rowIdx) => {
                const rowPortions = portions.slice(rowIdx * 15, rowIdx * 15 + 15);
                const start = rowIdx * 15 + 1;
                const end = start + 14;
                return (
                  <Fragment key={rowIdx}>
                    {rowPortions.map((p) => {
                      const cellClass =
                        p.status === "paid"
                          ? "bg-green-600 text-white"
                          : p.status === "reserved"
                          ? "bg-amber-400 text-white"
                          : "bg-gray-100 text-gray-400 border border-gray-200";
                      return (
                        <div
                          key={p.id}
                          className={`aspect-square flex items-center justify-center text-[10px] font-medium rounded-sm ${cellClass}`}
                          title={`#${p.id} — ${p.status}`}
                        >
                          {p.id}
                        </div>
                      );
                    })}
                    <div className="flex items-center pl-1.5 text-[10px] text-gray-400 whitespace-nowrap">
                      {start}–{end}
                    </div>
                  </Fragment>
                );
              })}
            </div>

            <div className="flex justify-between items-center mt-3">
              <p className="text-xs text-gray-400">{t("wakaf.dataNote")}</p>
              {lastUpdated && (
                <p className="text-xs text-gray-400">
                  {t("wakaf.lastUpdated")}: {formatDate(lastUpdated, lang)}
                </p>
              )}
            </div>
          </section>

          {/* Donor List */}
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-1">{t("wakaf.donorList")}</h2>
            <p className="text-sm text-gray-500 mb-4">{t("wakaf.donorListDesc")}</p>

            {donors.length === 0 ? (
              <p className="text-gray-500 text-sm">{t("wakaf.noDonors")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-primary-700 text-white">
                      {[
                        t("wakaf.colNum"),
                        t("wakaf.colPortions"),
                        t("wakaf.colStatus"),
                        t("wakaf.colQty"),
                        t("wakaf.colAmount"),
                        t("wakaf.colDate"),
                        t("wakaf.colNotes"),
                      ].map((col) => (
                        <th key={col} className="px-3 py-2 text-left font-semibold whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {donors.map((donor, i) => (
                      <tr key={donor.id} className={i % 2 !== 0 ? "bg-gray-50" : ""}>
                        <td className="px-3 py-2 text-gray-600">{donor.id}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {donor.fromPortion === donor.toPortion
                            ? `${t("wakaf.portionSingle")} ${donor.fromPortion}`
                            : `${t("wakaf.portionRange")} ${donor.fromPortion}–${donor.toPortion}`}
                        </td>
                        <td className="px-3 py-2">
                          {donor.status === "paid" ? (
                            <span className="bg-green-100 text-green-700 rounded-full px-2 py-0.5 text-xs font-medium">
                              {t("wakaf.paid")}
                            </span>
                          ) : (
                            <span className="bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 text-xs font-medium">
                              {t("wakaf.reserved")}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-gray-700">{donor.qtyPortions}</td>
                        <td className="px-3 py-2 text-gray-700 font-mono">{donor.amount}</td>
                        <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                          {donor.date ? formatDate(donor.date, lang) : "—"}
                        </td>
                        <td className="px-3 py-2 text-gray-500">{donor.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
