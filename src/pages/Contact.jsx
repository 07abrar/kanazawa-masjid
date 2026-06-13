import { useLang } from "../contexts/LanguageContext";
import { useSEO } from "../hooks/useSEO";
import { CONTACT } from "../config/contact";
import WhatsAppLink from "../components/WhatsAppLink";
import WhatsAppIcon from "../components/icons/WhatsAppIcon";

export default function Contact() {
  const { t } = useLang();
  useSEO(
    "Contact",
    "Contact Kanazawa Umar bin Al-Khattab Mosque. Find our address, phone number, and location in Kanazawa, Japan.",
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="section-title">{t("contact.title")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column */}
        <div className="space-y-6">
          {/* Address & Contact */}
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {t("contact.address")}
            </h2>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-3">
                <svg
                  className="h-5 w-5 text-primary-600 mt-0.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <a
                  href={CONTACT.mapsDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  {CONTACT.address}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <svg
                  className="h-5 w-5 text-primary-600 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <a
                  href={CONTACT.phoneTel}
                  className="text-primary-600 hover:underline"
                >
                  {CONTACT.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <WhatsAppIcon className="h-5 w-5 text-primary-600 shrink-0" />
                <WhatsAppLink href={CONTACT.whatsappGroup} className="text-primary-600 hover:underline text-left">
                  Prayer Times WhatsApp Group
                </WhatsAppLink>
              </li>
              <li className="flex items-center gap-3">
                <WhatsAppIcon className="h-5 w-5 text-primary-600 shrink-0" />
                <WhatsAppLink href={CONTACT.whatsappCommunity} className="text-primary-600 hover:underline text-left">
                  Indonesia Muslim Community
                </WhatsAppLink>
              </li>
              <li className="flex items-center gap-3">
                <WhatsAppIcon className="h-5 w-5 text-primary-600 shrink-0" />
                <WhatsAppLink href={CONTACT.imam.whatsapp} className="text-primary-600 hover:underline text-left">
                  {CONTACT.imam.name} ({CONTACT.imam.phone})
                </WhatsAppLink>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              {t("contact.socialMedia")}
            </h2>
            <p className="text-sm text-gray-500 mb-4">{t("contact.followUs")}</p>
            <a
              href={CONTACT.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
              @kmiishikawa.jp
            </a>
          </div>
        </div>

        {/* Map */}
        <div className="card p-0 overflow-hidden">
          <h2 className="text-lg font-bold text-gray-900 p-6 pb-3">
            {t("contact.mapTitle")}
          </h2>
          <iframe
            title="Kanazawa Masjid Location"
            src={CONTACT.mapsEmbedUrl}
            className="w-full"
            height="420"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  );
}
