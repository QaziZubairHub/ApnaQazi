import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import FloatingWhatsApp from "./FloatingWhatsApp";
import LoginRegister, { UserMenu } from "./Admin/Login_Register";
import { useCart } from "../contexts/CartContext";
import { formatCurrency } from "../util/helpers";


const menus = [
    { label: 'Home', href: '/' },
    { label: 'Product', href: '/product' },
    { label: 'Category', href: '/category' },
    { label: 'Contact us', href: '/Contact us' },
];

const contactItems = [
    { icon: 'ri-phone-line', href: 'tel:+923012991483', label: '+92 301 2991483' },
    { icon: 'ri-mail-line', href: 'mailto:qazizubairleo@gmail.com', label: 'qazizubairleo@gmail.com' },
    { icon: 'ri-time-line', label: 'Mon–Sat 9am–7pm' },
];

const socialLinks = [
    { label: 'Facebook', href: '#', icon: 'ri-facebook-fill', hoverClass: 'hover:bg-blue-600' },
    { label: 'Instagram', href: '#', icon: 'ri-instagram-line', hoverClass: 'hover:bg-pink-600' },
    { label: 'Twitter', href: '#', icon: 'ri-twitter-x-line', hoverClass: 'hover:bg-sky-500' },
    { label: 'YouTube', href: '#', icon: 'ri-youtube-fill', hoverClass: 'hover:bg-red-600' },
];

const Layout = ({ children }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [navTop, setNavTop] = useState(40);
    const location = useLocation();

    useEffect(() => {
        const handleHeaderStyle = () => {
            const scrolled = window.scrollY;
            setIsScrolled(scrolled > 40);
            setNavTop(Math.max(0, 40 - scrolled));
        };

        handleHeaderStyle();

        window.addEventListener('scroll', handleHeaderStyle, { passive: true });
        window.addEventListener('resize', handleHeaderStyle, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleHeaderStyle);
            window.removeEventListener('resize', handleHeaderStyle);
        };
    }, []);

    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const closeMobileMenu = () => setIsMenuOpen(false);
    const { itemCount, subtotal } = useCart();

    return (
        <div className="relative min-h-screen flex flex-col">

            {/* =========== PREMIUM ANNOUNCEMENT BAR =========== */}
            <div className="bg-slate-900 text-slate-300 w-full relative z-50">
                <div className="w-full mx-auto flex items-center justify-center h-10 px-4 overflow-hidden">
                    <div className="marquee text-[11px] font-semibold tracking-[0.2em] uppercase whitespace-nowrap text-center">
                        <span className="text-[#c79864]">★</span> CHEAP & BEST — APNA QAZI <span className="text-[#c79864]">★</span> FREE DELIVERY ON ORDERS PKR 10,000+ IN KARACHI <span className="text-[#c79864]">★</span> EXCLUSIVE NEW ARRIVALS <span className="text-[#c79864]">★</span>
                    </div>
                </div>
                <style>
                    {`@keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } } .marquee { display: inline-block; white-space: nowrap; animation: marquee 30s linear infinite; }`}
                </style>
            </div>

            {/* =========== MAIN NAVBAR (Glassmorphism) =========== */}
            <nav
                style={{
                    top: `${navTop}px`,
                    transition: 'background-color 300ms ease-in-out, border-color 300ms ease-in-out, box-shadow 300ms ease-in-out, backdrop-filter 300ms ease-in-out',
                }}
                className={`fixed left-0 right-0 w-full z-50 ${
                    isScrolled
                        ? 'bg-transparent border-b border-transparent'
                        : 'bg-white/10 backdrop-blur-md border-b border-white/10'
                }`}
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between py-4 px-4 md:px-6 relative h-[72px]">
                    {/* --- 1. LEFT: Hamburger & Desktop Links --- */}
                    <div className="flex-1 flex justify-start items-center gap-8">
                        <button
                            className="lg:hidden text-slate-800 focus:outline-none w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 transition"
                            onClick={() => setIsMenuOpen(true)}
                        >
                            <i className="ri-menu-3-line text-xl"></i>
                        </button>

                        <ul className="hidden lg:flex gap-8 items-center">
                            {menus.map((item) => (
                                <li key={item.href}>
                                    <Link
                                        to={item.href}
                                        className={`relative text-[13px] font-medium tracking-wide text-slate-600 hover:text-slate-900 transition-all duration-300 pb-1 ${
                                            location.pathname === item.href ? 'text-slate-900 font-semibold' : ''
                                        }`}
                                    >
                                        {item.label}
                                        <span className={`absolute bottom-0 left-0 h-[2px] bg-[#c79864] transition-all duration-300 ease-out ${
                                            location.pathname === item.href ? 'w-full' : 'w-0 group-hover:w-full'
                                        }`}></span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* --- 2. CENTER: Logo --- */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex justify-center items-center">
                            <Link to="/" className="transition-transform duration-300 hover:scale-105">
                                <img
                                    src="/images/ApnaQazi_Logo_v1.png"
                                    alt="Logo"
                                    className="h-[66px] lg:h-[81px] w-auto object-contain drop-shadow-sm"
                                />
                            </Link>
                        </div>

                    {/* --- 3. RIGHT: Search, UserMenu, Wishlist, Cart --- */}
                    <div className="flex-1 flex justify-end items-center gap-2 md:gap-3">
                        <div className="hidden md:flex items-center">
                            {isSearchOpen ? (
                                <div className="flex items-center bg-slate-100 rounded-full px-4 h-10 gap-2 w-48 border border-slate-200 focus-within:border-[#c79864] transition-all">
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        className="bg-transparent outline-none w-full text-sm text-slate-700 placeholder-slate-400"
                                        autoFocus
                                    />
                                    <button onClick={() => setIsSearchOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                        <i className="ri-close-line"></i>
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsSearchOpen(true)}
                                    className="p-2.5 rounded-full hover:bg-slate-100 transition-colors text-slate-600 hover:text-slate-900"
                                >
                                    <i className="ri-search-line text-lg"></i>
                                </button>
                            )}
                        </div>

                        <div className="hidden xl:flex items-center">
                            <UserMenu onOpenAuth={() => setIsAuthOpen(true)} />
                        </div>

                        <Link to="/wishlist" className="relative p-2.5 rounded-full hover:bg-slate-100 transition-colors text-slate-600 hover:text-red-500">
                            <i className="ri-heart-line text-lg"></i>
                            <span className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full text-[9px] font-bold w-[16px] h-[16px] flex items-center justify-center">0</span>
                        </Link>

                        <Link to="/Cart" className="relative flex items-center gap-2 p-2.5 rounded-full hover:bg-slate-100 transition-colors text-slate-600 hover:text-slate-900 group">
                            <i className="ri-shopping-bag-line text-lg"></i>
                            <span className="hidden md:inline-block text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                                {itemCount > 0 ? formatCurrency(subtotal) : formatCurrency(0)}
                            </span>
                            <span className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full text-[9px] font-bold w-[16px] h-[16px] flex items-center justify-center">
                                {itemCount}
                            </span>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* =========== INDUSTRY LEVEL MOBILE DRAWER MENU =========== */}
            <div
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] transition-opacity duration-300 lg:hidden ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={closeMobileMenu}
            ></div>

            <div className={`fixed top-0 right-0 h-full w-[85%] max-w-sm bg-white shadow-2xl z-[101] transform transition-transform duration-300 ease-out flex flex-col lg:hidden ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <img src="/images/ApnaQazi_Logo_v1.png" alt="Logo" className="h-10 object-contain" />
                    <button onClick={closeMobileMenu} className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-900">
                        <i className="ri-close-line text-xl"></i>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <ul className="space-y-1">
                        {menus.map((item) => (
                            <li key={item.href}>
                                <Link
                                    to={item.href}
                                    onClick={closeMobileMenu}
                                    className={`block py-3 px-4 rounded-xl text-[15px] font-medium tracking-wide transition-all duration-200 ${
                                        location.pathname === item.href
                                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                                        : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <UserMenu onOpenAuth={() => { closeMobileMenu(); setIsAuthOpen(true); }} />
                    </div>
                </div>
            </div>

            <LoginRegister isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

            <FloatingWhatsApp />

            {/* =========== Main Content =========== */}
            <main className={`flex-1 ${location.pathname === '/' ? '-mt-[73px]' : 'pt-[73px]'}`}>
                {children}
            </main>

            {/* =========== FOOTER (Premium Styling) =========== */}
            <footer className="bg-slate-900 text-slate-300 mt-auto relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 lg:py-16">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">

                        {/* Brand — full width on mobile */}
                        <div className="col-span-2 lg:col-span-1 space-y-4">
                            <Link to="/" className="inline-flex group">
                                <img src="/images/ApnaQazi_Logo_v1.png" alt="Apna Qazi" className="h-12 w-auto brightness-110 group-hover:brightness-125 transition-all duration-200" />
                            </Link>
                            <p className="text-sm text-slate-300 leading-relaxed tracking-wide">
                                Quality products, fair prices — delivered with care. Free delivery in Karachi on orders above PKR 5,000.
                            </p>
                            <div className="flex items-center gap-3 text-sm text-slate-300 leading-relaxed tracking-wide">
                                <i className="ri-map-pin-line w-4 flex-shrink-0 text-slate-500"></i>
                                <span>1/343 Shah Faisal Colony, Karachi</span>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h3 className="text-white font-semibold text-xs uppercase tracking-wider mb-4">Quick Links</h3>
                            <ul className="space-y-2.5">
                                {menus.map((item) => (
                                    <li key={item.href}>
                                        <Link to={item.href} className="text-sm text-slate-300 leading-relaxed tracking-wide hover:text-[#c79864] transition-colors duration-200">
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                                <li>
                                    <button onClick={() => setIsAuthOpen(true)} className="text-sm text-slate-300 leading-relaxed tracking-wide hover:text-[#c79864] transition-colors duration-200">
                                        Login / Signup
                                    </button>
                                </li>
                            </ul>
                        </div>

                        {/* Contact */}
                        <div>
                            <h3 className="text-white font-semibold text-xs uppercase tracking-wider mb-4">Contact</h3>
                            <ul className="space-y-3">
                                {contactItems.map((item) => (
                                    <li key={item.label} className="flex items-center gap-3 text-sm text-slate-300 leading-relaxed tracking-wide">
                                        <i className={`${item.icon} w-4 flex-shrink-0 text-slate-500`}></i>
                                        {item.href ? (
                                            <a href={item.href} className="hover:text-[#c79864] transition-colors duration-200">{item.label}</a>
                                        ) : (
                                            <span>{item.label}</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Newsletter — full width on mobile */}
                        <div className="col-span-2 lg:col-span-1">
                            <h3 className="text-white font-semibold text-xs uppercase tracking-wider mb-4">Newsletter</h3>
                            <p className="text-sm text-slate-300 mb-3 leading-relaxed tracking-wide">Get updates about new arrivals and exclusive offers.</p>
                            <form className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="email"
                                    placeholder="Your email address"
                                    required
                                    className="flex-1 bg-slate-800 border border-slate-700 placeholder-slate-500 text-white py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c79864]/50 transition-all text-sm tracking-wide"
                                />
                                <button type="submit" className="bg-[#c79864] text-slate-900 font-bold px-6 py-3 rounded-lg hover:bg-[#d4a878] transition-colors duration-200 text-sm tracking-wide shadow-lg shadow-[#c79864]/20">
                                    Subscribe
                                </button>
                            </form>
                            <div className="mt-5">
                                <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-3">Follow us</h4>
                                <div className="flex items-center gap-3">
                                    {socialLinks.map((social) => (
                                        <a
                                            key={social.label}
                                            aria-label={social.label}
                                            href={social.href}
                                            className={`p-2 bg-slate-800 rounded-lg text-white transition-all duration-200 hover:scale-110 hover:shadow-lg ${social.hoverClass}`}
                                        >
                                            <i className={social.icon}></i>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 border-t border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 tracking-wide">
                        <div>© {new Date().getFullYear()} Apna Qazi. All rights reserved.</div>
                        <div className="flex items-center gap-4">
                            <span>Secure payments</span>
                            <img src="/images/payments.svg" alt="Payments" className="h-5 w-auto opacity-50" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
