import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { doc, setDoc, getDoc, getDocs, collection, query, where } from "firebase/firestore";
import { getFriendlyAuthError, signInWithFacebook, signInWithGoogle } from "../../services/authService";

// ─── Avatar initials helper ──────────────────────────────────────────────────
const getInitials = (name = "") => {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ─── Avatar color based on name ─────────────────────────────────────────────
const getAvatarColor = (name = "") => {
  const colors = [
    "#706bcf", "#0891b2", "#059669", "#d97706",
    "#dc2626", "#7c3aed", "#db2777", "#ea580c",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

// ════════════════════════════════════════════════════════════════════════════
// USER MENU — Navbar mein use karo
// Usage: <UserMenu onOpenAuth={() => setAuthOpen(true)} />
// ════════════════════════════════════════════════════════════════════════════
export const UserMenu = ({ onOpenAuth }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, "users", firebaseUser.uid));
          if (snap.exists()) setUserData(snap.data());
        } catch {
          // fallback to auth profile
        }
      } else {
        setUserData(null);
      }
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut(auth);
      setDropdownOpen(false);
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setLoggingOut(false);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest("#user-menu-container")) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const displayName =
    userData?.fullname || user?.displayName || user?.email?.split("@")[0] || "User";
  const displayEmail = userData?.email || user?.email || "";
  const avatarColor = getAvatarColor(displayName);
  const initials = getInitials(displayName);

  if (!user) {
    return (
      <button
        onClick={onOpenAuth}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#27555A] text-white text-sm font-semibold hover:bg-[#CD6E3B] active:scale-[0.97] transition-all shadow-sm"
      >
        <i className="ri-user-line text-base"></i>
        <span>Login / Register</span>
      </button>
    );
  }

  return (
    <div id="user-menu-container" className="relative">
      <button
        onClick={() => setDropdownOpen((v) => !v)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-gray-200 hover:border-indigo-300 hover:shadow-sm transition-all bg-white"
        aria-expanded={dropdownOpen}
        aria-haspopup="true"
      >
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden"
          style={{ backgroundColor: user.photoURL ? "transparent" : avatarColor }}
        >
          {user.photoURL ? (
            <img src={user.photoURL} alt={displayName} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            initials
          )}
        </span>
        <span className="text-sm font-semibold text-gray-800 max-w-[120px] truncate hidden sm:block">
          {displayName}
        </span>
        <i className={`ri-arrow-down-s-line text-gray-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}></i>
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 z-[80] overflow-hidden">
          {/* User info */}
          <div className="px-4 py-3.5 border-b border-gray-100 flex items-center gap-3 bg-gradient-to-r from-indigo-50 to-purple-50">
            <span
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden"
              style={{ backgroundColor: user.photoURL ? "transparent" : avatarColor }}
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt={displayName} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                initials
              )}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
              <p className="text-xs text-gray-500 truncate">{displayEmail}</p>
            </div>
          </div>

          {/* Links */}
          <div className="py-1.5">
            {[
              { to: "/profile", icon: "ri-user-3-line", label: "My Profile" },
              { to: "/orders", icon: "ri-shopping-bag-3-line", label: "My Orders" },
              { to: "/wishlist", icon: "ri-heart-3-line", label: "Wishlist" },
              { to: "/Cart", icon: "ri-shopping-cart-2-line", label: "Cart" },
              { to: "/settings", icon: "ri-settings-3-line", label: "Settings" },
            ].map(({ to, icon, label }) => (
              <Link
                key={to} to={to}
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
              >
                <i className={`${icon} text-base w-4`}></i>
                {label}
              </Link>
            ))}
          </div>

          {/* Logout */}
          <div className="border-t border-gray-100 p-2">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-60"
            >
              {loggingOut
                ? <i className="ri-loader-4-line animate-spin text-base w-4"></i>
                : <i className="ri-logout-box-r-line text-base w-4"></i>
              }
              {loggingOut ? "Logging out..." : "Sign Out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// LOGIN / REGISTER DRAWER
// ════════════════════════════════════════════════════════════════════════════
const LoginRegister = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [authTab, setAuthTab] = useState("login");
  const [authForm, setAuthForm] = useState({
    loginEmail: "", password: "", fullname: "", email: "", regPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [showRegPwd, setShowRegPwd] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape" && isOpen) onClose?.(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleInput = (e) => {
    const { name, value } = e.target;
    setAuthForm((p) => ({ ...p, [name]: value }));
    setError(""); setMessage("");
  };

  const switchTab = (tab) => {
    setAuthTab(tab); setError(""); setMessage("");
    setAuthForm({ loginEmail: "", password: "", fullname: "", email: "", regPassword: "" });
  };

  // ── Login ────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError(""); setMessage("");
    try {
      const { user } = await signInWithEmailAndPassword(auth, authForm.loginEmail.trim(), authForm.password);
      setMessage("Login successful! Welcome back 👋");
      await goToAdminAfterLogin(user);
      setTimeout(() => onClose?.(), 900);
    } catch (err) {
      setError(getFriendlyAuthError(err.code));
      console.error("LOGIN:", err.code);
    } finally {
      setLoading(false);
    }
  };

  // ── Register ─────────────────────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    if (authForm.fullname.trim().length < 2) { setError("Poora naam enter karein."); return; }
    if (authForm.regPassword.length < 6) { setError("Password 6+ characters ka hona chahiye."); return; }
    setLoading(true); setError(""); setMessage("");
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth, authForm.email.trim(), authForm.regPassword
      );
      await updateProfile(user, { displayName: authForm.fullname.trim() });

      // Check if any admin exists — if not, make this user admin
      let role = "user";
      try {
        const adminsSnap = await getDocs(query(collection(db, "users"), where("role", "==", "admin")));
        if (adminsSnap.empty) role = "admin";
      } catch { /* fallback: user */ }

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        fullname: authForm.fullname.trim(),
        email: authForm.email.trim(),
        provider: "email",
        photoURL: "",
        role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setMessage(`Welcome, ${authForm.fullname.trim()}! Account ban gaya 🎉`);
      if (role === "admin") navigate("/admin/dashboard", { replace: true });
      setTimeout(() => onClose?.(), 900);
    } catch (err) {
      setError(getFriendlyAuthError(err.code));
      console.error("REGISTER:", err.code);
    } finally {
      setLoading(false);
    }
  };

  const ADMIN_EMAIL = "qazizubairleo@gmail.com";

  const handleSocialLogin = async (providerName) => {
    setLoading(true); setError(""); setMessage("");
    try {
      const user = providerName === "google"
        ? await signInWithGoogle()
        : await signInWithFacebook();

      // Admin access is determined ONLY by authenticated email.
      const isAdminNow = (user?.email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase();

      // Preserve existing Firestore write behavior for user profile (no collection changes).
      const existing = await getDoc(doc(db, "users", user.uid));
      let role = "user";
      if (existing.exists() && existing.data().role) {
        role = existing.data().role;
      } else {
        try {
          const adminsSnap = await getDocs(query(collection(db, "users"), where("role", "==", "admin")));
          if (adminsSnap.empty) role = "admin";
        } catch {
          // fallback to user role
        }
      }

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        fullname: user.displayName || "",
        email: user.email || "",
        photoURL: user.photoURL || "",
        provider: providerName,
        role,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      setMessage(`Welcome, ${user.displayName || "User"}! 🎉`);
      if (isAdminNow) navigate("/admin/dashboard", { replace: true });
      else navigate("/", { replace: true });
      setTimeout(() => onClose?.(), 900);
    } catch (err) {
      setError(getFriendlyAuthError(err.code));
      console.error("SOCIAL_AUTH:", err.code);
    } finally {
      setLoading(false);
    }
  };

  // Password strength
  const pwdStrength = (pwd) => {
    if (!pwd.length) return null;
    if (pwd.length < 6) return { label: "Too short", color: "bg-red-400", w: "w-1/4" };
    if (pwd.length < 8)  return { label: "Weak",      color: "bg-orange-400", w: "w-2/4" };
    if (pwd.length < 12) return { label: "Good",      color: "bg-yellow-400", w: "w-3/4" };
    return                      { label: "Strong",    color: "bg-emerald-500", w: "w-full" };
  };
  const strength = pwdStrength(authForm.regPassword);

  const inputClass =
    "w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition bg-gray-50 focus:bg-white";

  const goToAdminAfterLogin = async (user) => {
    const fallbackPath = "/admin/dashboard";
    const fromPath = location.state?.from?.pathname || fallbackPath;
    const targetPath = fromPath.startsWith("/admin") ? fromPath : fallbackPath;

    const isAdminNow = (user?.email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase();

    if (isAdminNow) {
      navigate(targetPath, { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60]"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[440px] bg-white z-[70] shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog" aria-modal="true" aria-label="Authentication"
      >
        {/* Top accent */}
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <div className="p-6 md:p-8">

          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <i className="ri-store-2-line text-white text-sm"></i>
                </div>
                <span className="text-xs font-semibold text-indigo-600 tracking-widest uppercase">Apna Qazi</span>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                {authTab === "login" ? "Welcome back" : "Join us today"}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {authTab === "login"
                  ? "Sign in to your account to continue"
                  : "Create your free account in seconds"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors mt-1"
              aria-label="Close"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            {["login", "register"].map((tab) => (
              <button
                key={tab} onClick={() => switchTab(tab)}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  authTab === tab
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-4 flex items-center gap-2.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <i className="ri-error-warning-fill text-red-500 shrink-0"></i>
              <span>{error}</span>
            </div>
          )}
          {message && (
            <div className="mb-4 flex items-center gap-2.5 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <i className="ri-checkbox-circle-fill text-emerald-500 shrink-0"></i>
              <span>{message}</span>
            </div>
          )}

          {/* ── LOGIN FORM ── */}
          {authTab === "login" ? (
            <form onSubmit={handleLogin} noValidate className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Email Address</label>
                <div className="relative">
                  <i className="ri-mail-line absolute left-3.5 top-3.5 text-gray-400"></i>
                  <input required type="email" name="loginEmail"
                    value={authForm.loginEmail} onChange={handleInput}
                    placeholder="you@example.com" autoComplete="email"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Password</label>
                  <Link to="/forgot-password" className="text-xs text-indigo-600 hover:underline font-medium">Forgot password?</Link>
                </div>
                <div className="relative">
                  <i className="ri-lock-line absolute left-3.5 top-3.5 text-gray-400"></i>
                  <input required type={showLoginPwd ? "text" : "password"} name="password"
                    value={authForm.password} onChange={handleInput}
                    placeholder="••••••••" autoComplete="current-password"
                    className={`${inputClass} pr-10`}
                  />
                  <button type="button" onClick={() => setShowLoginPwd(v => !v)}
                    className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-700">
                    <i className={showLoginPwd ? "ri-eye-off-line" : "ri-eye-line"}></i>
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-sm text-gray-600 cursor-pointer select-none">
                <input type="checkbox" className="w-4 h-4 accent-indigo-600 rounded" />
                Keep me signed in
              </label>

              <button type="submit" disabled={loading}
                className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-100 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading
                  ? <span className="flex items-center justify-center gap-2"><i className="ri-loader-4-line animate-spin"></i> Signing in...</span>
                  : "Sign in →"
                }
              </button>
            </form>

          ) : (
            /* ── REGISTER FORM ── */
            <form onSubmit={handleRegister} noValidate className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Full Name</label>
                <div className="relative">
                  <i className="ri-user-line absolute left-3.5 top-3.5 text-gray-400"></i>
                  <input required type="text" name="fullname"
                    value={authForm.fullname} onChange={handleInput}
                    placeholder="Ali Ahmed" autoComplete="name"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Email Address</label>
                <div className="relative">
                  <i className="ri-mail-line absolute left-3.5 top-3.5 text-gray-400"></i>
                  <input required type="email" name="email"
                    value={authForm.email} onChange={handleInput}
                    placeholder="you@example.com" autoComplete="email"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Password</label>
                <div className="relative">
                  <i className="ri-lock-line absolute left-3.5 top-3.5 text-gray-400"></i>
                  <input required type={showRegPwd ? "text" : "password"} name="regPassword"
                    value={authForm.regPassword} onChange={handleInput}
                    placeholder="Min. 6 characters" autoComplete="new-password"
                    className={`${inputClass} pr-10`}
                  />
                  <button type="button" onClick={() => setShowRegPwd(v => !v)}
                    className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-700">
                    <i className={showRegPwd ? "ri-eye-off-line" : "ri-eye-line"}></i>
                  </button>
                </div>
                {strength && (
                  <div className="mt-2">
                    <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.w}`} />
                    </div>
                    <p className={`text-xs mt-1 font-medium ${
                      strength.label === "Strong" ? "text-emerald-600"
                      : strength.label === "Good" ? "text-yellow-600"
                      : strength.label === "Weak" ? "text-orange-500"
                      : "text-red-500"
                    }`}>{strength.label} password</p>
                  </div>
                )}
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-100 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading
                  ? <span className="flex items-center justify-center gap-2"><i className="ri-loader-4-line animate-spin"></i> Creating account...</span>
                  : "Create Account →"
                }
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="flex-grow h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">or</span>
            <div className="flex-grow h-px bg-gray-200" />
          </div>

          {/* Social */}
          <div className="space-y-2.5">
            <button type="button" onClick={() => handleSocialLogin("google")} disabled={loading}
              className="w-full flex items-center justify-center gap-3 border border-gray-200 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <i className="ri-google-fill text-[#DB4437] text-lg"></i>
              Continue with Google
            </button>
            <button type="button" onClick={() => handleSocialLogin("facebook")} disabled={loading}
              className="w-full flex items-center justify-center gap-3 border border-gray-200 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <i className="ri-facebook-fill text-[#1877F2] text-lg"></i>
              Continue with Facebook
            </button>
          </div>

          {/* Footer */}
          <p className="mt-6 text-xs text-center text-gray-400 leading-relaxed">
            By continuing, you agree to our{" "}
            <Link to="/terms" className="text-indigo-600 hover:underline font-medium">Terms of Service</Link>
            {" "}and{" "}
            <Link to="/privacy" className="text-indigo-600 hover:underline font-medium">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </>
  );
};

export default LoginRegister;
