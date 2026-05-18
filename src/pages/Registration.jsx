import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useLang } from "../contexts/LanguageContext";
import { useSEO } from "../hooks/useSEO";
import { REGISTRATION_EVENTS } from "../config/registrationEvents";

function generateChallenge() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  const ops = [
    { question: `${a} + ${b}`, answer: a + b },
    { question: `${a} × ${b}`, answer: a * b },
  ];
  return ops[Math.floor(Math.random() * ops.length)];
}

export default function Registration() {
  const { eventId } = useParams();
  const { t } = useLang();
  const event = REGISTRATION_EVENTS[eventId];

  useSEO(event ? event.title : "Registration", event ? event.seoDesc : "");

  const [form, setForm] = useState({ name: "", session: "", attendees: "" });
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState("");
  const [sessionCounts, setSessionCounts] = useState(null);
  const [challenge] = useState(generateChallenge);
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaError, setCaptchaError] = useState(false);

  useEffect(() => {
    if (!event) return;
    fetch(`/api/register?event=${event.eventId}`)
      .then((r) => r.json())
      .then((data) => setSessionCounts(data.sessions))
      .catch(() => setSessionCounts({}));
  }, [event]);

  if (!event) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="card">
          <p className="text-gray-500">{t("registration.notFound")}</p>
        </div>
      </div>
    );
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.session) return;

    if (Number(captchaInput) !== challenge.answer) {
      setCaptchaError(true);
      return;
    }
    setCaptchaError(false);
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          attendees: Number(form.attendees),
          event: event.eventId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus("success");
      } else {
        const errorKey =
          data.error === "duplicate_name"
            ? "registration.duplicateName"
            : "registration.error";
        setErrorMsg(t(errorKey));
        setStatus("error");
      }
    } catch {
      setErrorMsg(t("registration.error"));
      setStatus("error");
    }
  }

  const sessions = event.sessions.map((s) => ({
    ...s,
    label: `${t("registration.sessionPrefix")} ${s.value} — ${s.time}`,
  }));

  if (status === "success") {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="card">
          <div className="text-5xl mb-4">🌙</div>
          <h1 className="text-2xl font-bold text-primary-700 mb-2">
            {t("registration.successTitle")}
          </h1>
          <p className="text-gray-600">{t("registration.successBody")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="section-title">{event.title}</h1>
      <p className="text-gray-600 mb-6">{event.subtitle}</p>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("registration.nameLabel")}
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder={t("registration.namePlaceholder")}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Session */}
          <fieldset>
            <legend className="block text-sm font-medium text-gray-700 mb-2">
              {t("registration.sessionLabel")}
            </legend>
            {sessionCounts === null && (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-1">
                <svg
                  className="animate-spin h-4 w-4 text-primary-500 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                {t("registration.loadingCounts")}
              </div>
            )}
            <div className="space-y-2">
              {sessions.map((s) => {
                const count =
                  sessionCounts !== null ? (sessionCounts[s.value] ?? 0) : null;
                const badgeClass =
                  count === null
                    ? "text-gray-400 bg-gray-100"
                    : count >= 200
                      ? "text-red-700 bg-red-100"
                      : count >= 100
                        ? "text-yellow-700 bg-yellow-100"
                        : "text-gray-500 bg-gray-100";
                const warnLabel =
                  count >= 200
                    ? t("registration.warnFull")
                    : count >= 100
                      ? t("registration.warnBusy")
                      : null;
                return (
                  <label
                    key={s.value}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="session"
                      value={s.value}
                      checked={form.session === s.value}
                      onChange={handleChange}
                      required
                      className="accent-primary-600"
                    />
                    <span className="text-sm text-gray-700">{s.label}</span>
                    {count !== null && (
                      <span
                        className={`ml-auto text-xs px-2 py-0.5 rounded-full whitespace-nowrap font-medium ${badgeClass}`}
                      >
                        {warnLabel ? `⚠ ${warnLabel} · ` : ""}
                        {count} {t("registration.registered")}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* Attendees */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("registration.attendeesLabel")}
            </label>
            <input
              type="number"
              name="attendees"
              value={form.attendees}
              onChange={handleChange}
              min={1}
              max={10}
              required
              className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t("registration.attendeesHint")}
            </p>
          </div>

          {/* Captcha */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <p className="text-sm font-medium text-gray-700 mb-1">
              {t("prayer.captchaTitle")}
            </p>
            <p className="text-sm text-gray-500 mb-3">
              {t("prayer.captchaPrompt")}
            </p>
            <p className="text-2xl font-bold text-center text-primary-700 mb-3 py-2 bg-primary-50 rounded-lg">
              {challenge.question} = ?
            </p>
            <input
              type="number"
              value={captchaInput}
              onChange={(e) => {
                setCaptchaInput(e.target.value);
                setCaptchaError(false);
              }}
              placeholder={t("prayer.captchaPlaceholder")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {captchaError && (
              <p className="text-red-500 text-sm text-center mt-1">
                {t("prayer.captchaError")}
              </p>
            )}
          </div>

          {status === "error" && (
            <p className="text-sm text-red-600">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full py-4 px-6 rounded-xl font-bold text-lg text-white bg-gradient-to-r from-primary-600 to-primary-700 shadow-lg hover:from-primary-500 hover:to-primary-600 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg flex items-center justify-center gap-2"
          >
            {status === "submitting" ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                {t("registration.submitting")}
              </>
            ) : (
              <>
                {t("registration.submit")}
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
