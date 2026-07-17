import { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const FALLBACK = {
  businessNumber: "+923012991483",
  buttonColor: "#25D366",
  buttonPosition: "bottom-right",
  buttonText: "Chat with us on WhatsApp",
  welcomeMessage: "Hi! Welcome to ApnaQazi. How can we help you today?",
  enableWhatsAppChat: true,
  showFloatingButton: true,
  showOnDesktop: true,
  showOnMobile: true,
};

const sanitizeDigits = (value = "") => value.replace(/[^\d+]/g, "");

const FloatingWhatsApp = () => {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "whatsapp"));
        if (active) {
          setConfig(snap.exists() ? { ...FALLBACK, ...snap.data() } : FALLBACK);
        }
      } catch {
        if (active) setConfig(FALLBACK);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  if (!config) return null;

  const {
    businessNumber,
    buttonColor,
    buttonPosition,
    buttonText,
    welcomeMessage,
    enableWhatsAppChat,
    showFloatingButton,
    showOnDesktop,
    showOnMobile,
  } = config;

  if (!enableWhatsAppChat || !showFloatingButton) return null;

  const isMobile = window.matchMedia("(max-width: 767px)").matches;
  if ((isMobile && !showOnMobile) || (!isMobile && !showOnDesktop)) return null;

  const digits = sanitizeDigits(businessNumber).replace(/^\+/, "");
  const href = `https://wa.me/${digits}?text=${encodeURIComponent(welcomeMessage || "")}`;

  const positionClass =
    buttonPosition === "bottom-left"
      ? "left-4 sm:left-6"
      : "right-4 sm:right-6";
  const bottomClass = "bottom-4 sm:bottom-6";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={buttonText || "Chat on WhatsApp"}
      title={buttonText || "Chat on WhatsApp"}
      className={`fixed z-[90] ${bottomClass} ${positionClass} group flex items-center justify-center w-[60px] h-[60px] rounded-full text-white outline-none transition-transform duration-300 hover:scale-[1.08] hover:shadow-[0_12px_32px_rgba(37,211,102,0.55)] focus-visible:ring-4 focus-visible:ring-[#25D366]/40 animate-wa-glow animate-wa-heartbeat`}
      style={{ backgroundColor: buttonColor || "#25D366", boxShadow: "0 8px 24px rgba(37, 211, 102, 0.35)" }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        className="w-8 h-8 shrink-0"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M16.04 3.2C9.09 3.2 3.4 8.89 3.4 15.84c0 2.36.66 4.67 1.92 6.68L3.2 28.8l6.5-1.7a12.6 12.6 0 0 0 6.34 1.62h.01c6.95 0 12.64-5.69 12.64-12.64 0-3.38-1.31-6.55-3.7-8.94A12.55 12.55 0 0 0 16.04 3.2zm0 23.06h-.01a10.56 10.56 0 0 1-5.38-1.47l-.39-.23-3.86 1.01 1.03-3.76-.25-.39a10.5 10.5 0 0 1-1.61-5.62c0-5.83 4.74-10.57 10.57-10.57 2.82 0 5.47 1.1 7.46 3.09a10.5 10.5 0 0 1 3.09 7.48c0 5.83-4.74 10.57-10.57 10.57zm5.79-7.91c-.32-.16-1.88-.93-2.17-1.03-.29-.11-.5-.16-.71.16-.21.32-.81 1.03-1 1.24-.18.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.58-.95-.85-1.59-1.89-1.78-2.21-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.18.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.71-1.71-.97-2.34-.26-.62-.52-.54-.71-.55l-.61-.01c-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.64s1.14 3.06 1.3 3.27c.16.21 2.25 3.44 5.46 4.82.76.33 1.36.53 1.82.68.76.25 1.46.21 2.01.13.61-.09 1.88-.77 2.14-1.51.26-.74.26-1.38.18-1.51-.08-.13-.29-.21-.61-.37z" />
      </svg>
    </a>
  );
};

export default FloatingWhatsApp;
