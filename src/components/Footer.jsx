import { Link } from "react-router-dom";
import { useLang } from "../contexts/LanguageContext";
import { CONTACT } from "../config/contact";
import WhatsAppLink from "./WhatsAppLink";
import WhatsAppIcon from "./icons/WhatsAppIcon";

export default function Footer() {
  const { t } = useLang();

  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Branding */}
          <div>
            <h3 className="text-white font-bold text-lg mb-2">
              Kanazawa Masjid
            </h3>
            <p className="text-sm text-gray-400">{t("footer.tagline")}</p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-semibold mb-3">
              {t("footer.quickLinks")}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  {t("nav.home")}
                </Link>
              </li>
              <li>
                <Link to="/news" className="hover:text-white transition-colors">
                  {t("nav.news")}
                </Link>
              </li>
              <li>
                <Link
                  to="/events"
                  className="hover:text-white transition-colors"
                >
                  {t("nav.events")}
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="hover:text-white transition-colors"
                >
                  {t("nav.contact")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <h4 className="text-white font-semibold mb-3">
              {t("footer.contactInfo")}
            </h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <svg
                  className="h-4 w-4 mt-0.5 shrink-0 text-primary-400"
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
                  className="hover:text-white transition-colors"
                >
                  {CONTACT.address}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 shrink-0 text-primary-400"
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
                  className="hover:text-white transition-colors"
                >
                  {CONTACT.phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <WhatsAppIcon className="h-4 w-4 shrink-0 text-green-400" />
                <WhatsAppLink href={CONTACT.whatsappGroup} className="hover:text-white transition-colors text-left">
                  Prayer Times Group
                </WhatsAppLink>
              </li>
              <li className="flex items-center gap-2">
                <WhatsAppIcon className="h-4 w-4 shrink-0 text-green-400" />
                <WhatsAppLink href={CONTACT.whatsappCommunity} className="hover:text-white transition-colors text-left">
                  Indonesia Muslim Community
                </WhatsAppLink>
              </li>
              <li className="flex items-center gap-2">
                <WhatsAppIcon className="h-4 w-4 shrink-0 text-green-400" />
                <WhatsAppLink href={CONTACT.imam.whatsapp} className="hover:text-white transition-colors text-left">
                  {CONTACT.imam.name}
                </WhatsAppLink>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-xs text-gray-500">
          &copy; {new Date().getFullYear()} Kanazawa Umar bin Al-Khattab Mosque.{" "}
          {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
}
