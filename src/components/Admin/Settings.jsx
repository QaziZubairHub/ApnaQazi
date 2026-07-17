import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  MessageCircle, Save, RotateCcw, Send, CheckCircle2,
  Clock, Link2, Smartphone, Monitor, Palette, ShieldCheck,
} from "lucide-react";
import { db } from "../../firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Skeleton from "../ui/Skeleton";

const inputClass =
  "w-full px-3.5 py-2.5 rounded-[12px] border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all";
const labelClass = "block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5";
const sectionTitleClass = "text-sm font-bold text-slate-800";
const sectionSubClass = "text-xs text-slate-400 mt-0.5";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const defaultSettings = {
  // Section 1 — Business Information
  businessNumber: "+923012991483",
  businessName: "ApnaQazi",
  supportName: "",
  welcomeMessage: "Hi! Welcome to ApnaQazi. How can we help you today?",
  autoReplyMessage: "Thanks for reaching out! We'll get back to you shortly.",
  awayMessage: "We're currently away. We'll respond as soon as we're back online.",

  // Section 2 — Order Notifications
  notifyNewOrder: true,
  notifyCancelOrder: true,
  notifyDeliveredOrder: true,
  notifyPayment: true,
  notifyRefund: true,

  // Section 3 — Customer Support
  enableWhatsAppChat: true,
  showFloatingButton: true,
  showOnMobile: true,
  showOnDesktop: true,
  openInNewTab: true,

  // Section 4 — Button Settings
  buttonText: "Chat with us on WhatsApp",
  buttonPosition: "bottom-right",
  buttonColor: "#25D366",

  // Section 5 — Working Hours
  workingHours: DAYS.reduce((acc, day) => {
    acc[day] = { enabled: day !== "Sunday", open: "09:00", close: "21:00" };
    return acc;
  }, {}),

  // Section 6 — Advanced
  countryCode: "+92",
  whatsappApiUrl: "https://wa.me/",
};

// Small reusable toggle switch (kept local to this file, matches existing icon-toggle style)
const ToggleSwitch = ({ checked, onChange, label, description }) => (
  <div className="flex items-center justify-between gap-4 py-2.5">
    <div className="min-w-0">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ${
        checked ? "bg-primary" : "bg-slate-200"
      }`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  </div>
);

const SectionHeader = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-center gap-2.5 mb-5">
    <div className="w-9 h-9 rounded-[10px] bg-primary/10 flex items-center justify-center shrink-0">
      <Icon size={16} className="text-primary" />
    </div>
    <div>
      <h3 className={sectionTitleClass}>{title}</h3>
      {subtitle && <p className={sectionSubClass}>{subtitle}</p>}
    </div>
  </div>
);

const sanitizeDigits = (value = "") => value.replace(/[^\d+]/g, "");

const Settings = () => {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [validating, setValidating] = useState(false);

  const SETTINGS_DOC = doc(db, "settings", "whatsapp");

  const loadSettings = async () => {
    setLoading(true);
    try {
      const snap = await getDoc(SETTINGS_DOC);
      if (snap.exists()) {
        const data = snap.data();
        setSettings((prev) => ({
          ...prev,
          ...data,
          workingHours: { ...prev.workingHours, ...(data.workingHours || {}) },
        }));
      } else {
        setSettings(defaultSettings);
      }
    } catch (err) {
      toast.error("Failed to load WhatsApp settings: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));

  const setWorkingHour = (day, field, value) => {
    setSettings((prev) => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: { ...prev.workingHours[day], [field]: value },
      },
    }));
  };

  const validate = () => {
    const number = sanitizeDigits(settings.businessNumber);
    if (!number || number.replace("+", "").length < 10) {
      toast.error("Please enter a valid WhatsApp Business Number.");
      return false;
    }
    if (!settings.businessName?.trim()) {
      toast.error("Business Name is required.");
      return false;
    }
    if (!settings.welcomeMessage?.trim()) {
      toast.error("Welcome Message is required.");
      return false;
    }
    if (!settings.buttonText?.trim()) {
      toast.error("Button Text is required.");
      return false;
    }
    if (!settings.countryCode?.trim()) {
      toast.error("Country Code is required.");
      return false;
    }
    return true;
  };

  const generatedLink = () => {
    const digits = sanitizeDigits(settings.businessNumber).replace("+", "");
    return digits ? `https://wa.me/${digits}` : "https://wa.me/";
  };

  const createAuditLog = async (action, detail) => {
    try {
      await setDoc(
        doc(db, "auditLogs", `whatsapp_${Date.now()}`),
        {
          module: "settings",
          section: "whatsapp",
          action,
          detail,
          createdAt: serverTimestamp(),
        }
      );
    } catch {
      // Non-critical: audit logging failure should not block the save flow
    }
  };

  const handleSave = async (e) => {
    e?.preventDefault?.();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        ...settings,
        businessNumber: sanitizeDigits(settings.businessNumber),
        updatedAt: serverTimestamp(),
      };
      await setDoc(SETTINGS_DOC, payload, { merge: true });
      await createAuditLog("update", "WhatsApp settings updated");
      toast.success("WhatsApp settings saved successfully!");
      await loadSettings();
    } catch (err) {
      toast.error("Failed to save settings: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    toast("Form reset to default values.", { icon: "↺" });
  };

  const handleTestMessage = async () => {
    const number = sanitizeDigits(settings.businessNumber).replace("+", "");
    if (!number) {
      toast.error("Please enter a WhatsApp number first.");
      return;
    }
    setTesting(true);
    try {
      const message = encodeURIComponent(
        `Test message from ${settings.businessName || "Admin Panel"}: WhatsApp integration is working correctly.`
      );
      const url = `https://wa.me/${number}?text=${message}`;
      const win = window.open(url, "_blank", "noopener,noreferrer");
      if (!win) {
        toast.error("Popup blocked. Please allow popups to send a test message.");
      } else {
        toast.success("Test message opened in WhatsApp.");
        await createAuditLog("test_message", `Test message sent to ${number}`);
      }
    } catch (err) {
      toast.error("Test failed: " + err.message);
    } finally {
      setTesting(false);
    }
  };

  const handleValidateNumber = async () => {
    setValidating(true);
    try {
      const number = sanitizeDigits(settings.businessNumber);
      const digitsOnly = number.replace("+", "");
      const isValid = /^\d{10,15}$/.test(digitsOnly);
      if (isValid) {
        toast.success("WhatsApp number format looks valid.");
      } else {
        toast.error("Invalid WhatsApp number format. Use country code + number (e.g. +923012991483).");
      }
      await createAuditLog("validate_number", `Validation result: ${isValid ? "valid" : "invalid"} (${number})`);
    } catch (err) {
      toast.error("Validation failed: " + err.message);
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">Settings</p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">WhatsApp Business Settings</h1>
        </div>
        <Card hover={false}><Skeleton rows={4} /></Card>
        <Card hover={false}><Skeleton rows={3} /></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">Settings</p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MessageCircle size={22} className="text-primary" />
            WhatsApp Business Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500">Manage WhatsApp business communication, notifications and support widget.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" icon={RotateCcw} onClick={handleReset} disabled={saving}>
            Reset
          </Button>
          <Button type="button" icon={Save} loading={saving} disabled={saving} onClick={handleSave}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Section 1 — Business Information */}
          <Card hover={false} className="lg:col-span-2">
            <SectionHeader icon={MessageCircle} title="Business Information" subtitle="Core WhatsApp business identity and messages" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>WhatsApp Business Number *</label>
                <input
                  value={settings.businessNumber}
                  onChange={(e) => set("businessNumber", e.target.value)}
                  placeholder="+923012991483"
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Business Name *</label>
                <input
                  value={settings.businessName}
                  onChange={(e) => set("businessName", e.target.value)}
                  placeholder="ApnaQazi"
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Support Name</label>
                <input
                  value={settings.supportName}
                  onChange={(e) => set("supportName", e.target.value)}
                  placeholder="Support Team"
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Welcome Message *</label>
                <textarea
                  value={settings.welcomeMessage}
                  onChange={(e) => set("welcomeMessage", e.target.value)}
                  rows={2}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Auto Reply Message</label>
                <textarea
                  value={settings.autoReplyMessage}
                  onChange={(e) => set("autoReplyMessage", e.target.value)}
                  rows={2}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Away Message</label>
                <textarea
                  value={settings.awayMessage}
                  onChange={(e) => set("awayMessage", e.target.value)}
                  rows={2}
                  className={inputClass}
                />
              </div>
            </div>
          </Card>

          {/* Section 2 — Order Notifications */}
          <Card hover={false}>
            <SectionHeader icon={CheckCircle2} title="Order Notifications" subtitle="Choose which order events send WhatsApp alerts" />
            <div className="divide-y divide-slate-100">
              <ToggleSwitch
                checked={settings.notifyNewOrder}
                onChange={(v) => set("notifyNewOrder", v)}
                label="Enable New Order Notification"
              />
              <ToggleSwitch
                checked={settings.notifyCancelOrder}
                onChange={(v) => set("notifyCancelOrder", v)}
                label="Enable Cancel Order Notification"
              />
              <ToggleSwitch
                checked={settings.notifyDeliveredOrder}
                onChange={(v) => set("notifyDeliveredOrder", v)}
                label="Enable Delivered Notification"
              />
              <ToggleSwitch
                checked={settings.notifyPayment}
                onChange={(v) => set("notifyPayment", v)}
                label="Enable Payment Notification"
              />
              <ToggleSwitch
                checked={settings.notifyRefund}
                onChange={(v) => set("notifyRefund", v)}
                label="Enable Refund Notification"
              />
            </div>
          </Card>

          {/* Section 3 — Customer Support */}
          <Card hover={false}>
            <SectionHeader icon={Smartphone} title="Customer Support" subtitle="Control the WhatsApp chat widget visibility" />
            <div className="divide-y divide-slate-100">
              <ToggleSwitch
                checked={settings.enableWhatsAppChat}
                onChange={(v) => set("enableWhatsAppChat", v)}
                label="Enable WhatsApp Chat"
              />
              <ToggleSwitch
                checked={settings.showFloatingButton}
                onChange={(v) => set("showFloatingButton", v)}
                label="Show Floating WhatsApp Button"
              />
              <ToggleSwitch
                checked={settings.showOnMobile}
                onChange={(v) => set("showOnMobile", v)}
                label="Show on Mobile"
              />
              <ToggleSwitch
                checked={settings.showOnDesktop}
                onChange={(v) => set("showOnDesktop", v)}
                label="Show on Desktop"
              />
              <ToggleSwitch
                checked={settings.openInNewTab}
                onChange={(v) => set("openInNewTab", v)}
                label="Open in New Tab"
              />
            </div>
          </Card>

          {/* Section 4 — Button Settings */}
          <Card hover={false}>
            <SectionHeader icon={Palette} title="Button Settings" subtitle="Customize the floating chat button" />
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Button Text</label>
                <input
                  value={settings.buttonText}
                  onChange={(e) => set("buttonText", e.target.value)}
                  placeholder="Chat with us on WhatsApp"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Button Position</label>
                <select
                  value={settings.buttonPosition}
                  onChange={(e) => set("buttonPosition", e.target.value)}
                  className={inputClass}
                >
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Button Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settings.buttonColor}
                    onChange={(e) => set("buttonColor", e.target.value)}
                    className="h-10 w-14 rounded-[10px] border border-slate-200 cursor-pointer bg-white"
                  />
                  <input
                    value={settings.buttonColor}
                    onChange={(e) => set("buttonColor", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Preview Button</label>
                <div className="rounded-[14px] border border-slate-200 bg-slate-50 p-6 flex justify-end">
                  <button
                    type="button"
                    style={{ backgroundColor: settings.buttonColor }}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-full text-white text-sm font-semibold shadow-lg"
                  >
                    <MessageCircle size={16} />
                    {settings.buttonText || "Chat with us on WhatsApp"}
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Section 5 — Working Hours */}
          <Card hover={false} className="lg:col-span-2">
            <SectionHeader icon={Clock} title="Working Hours" subtitle="Set support availability for each day of the week" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400">
                    <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider">Day</th>
                    <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider">Enabled</th>
                    <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider">Open Time</th>
                    <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider">Close Time</th>
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((day) => {
                    const dayData = settings.workingHours[day] || { enabled: false, open: "09:00", close: "21:00" };
                    return (
                      <tr key={day} className="border-b border-slate-50">
                        <td className="px-3 py-2.5 font-medium text-slate-700">{day}</td>
                        <td className="px-3 py-2.5">
                          <button
                            type="button"
                            onClick={() => setWorkingHour(day, "enabled", !dayData.enabled)}
                            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                              dayData.enabled ? "bg-primary" : "bg-slate-200"
                            }`}
                            role="switch"
                            aria-checked={dayData.enabled}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                                dayData.enabled ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </td>
                        <td className="px-3 py-2.5">
                          <input
                            type="time"
                            value={dayData.open}
                            onChange={(e) => setWorkingHour(day, "open", e.target.value)}
                            disabled={!dayData.enabled}
                            className={`${inputClass} disabled:opacity-50`}
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <input
                            type="time"
                            value={dayData.close}
                            onChange={(e) => setWorkingHour(day, "close", e.target.value)}
                            disabled={!dayData.enabled}
                            className={`${inputClass} disabled:opacity-50`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Section 6 — Advanced */}
          <Card hover={false}>
            <SectionHeader icon={Link2} title="Advanced" subtitle="API configuration and generated chat link" />
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Country Code</label>
                  <input
                    value={settings.countryCode}
                    onChange={(e) => set("countryCode", e.target.value)}
                    placeholder="+92"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>WhatsApp API URL</label>
                  <input
                    value={settings.whatsappApiUrl}
                    onChange={(e) => set("whatsappApiUrl", e.target.value)}
                    placeholder="https://wa.me/"
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Generated Chat Link (auto-generated)</label>
                <div className="flex items-center gap-2">
                  <input
                    value={generatedLink()}
                    readOnly
                    className={`${inputClass} bg-slate-50 text-slate-500 font-mono text-xs`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => {
                      navigator.clipboard?.writeText(generatedLink());
                      toast.success("Link copied to clipboard!");
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-slate-400 mt-1.5">Preview: {generatedLink()}</p>
              </div>
            </div>
          </Card>

          {/* Section 7 — Test Connection */}
          <Card hover={false}>
            <SectionHeader icon={ShieldCheck} title="Test Connection" subtitle="Verify your WhatsApp business number works correctly" />
            <div className="flex flex-col gap-3">
              <Button
                type="button"
                variant="secondary"
                icon={Send}
                loading={testing}
                disabled={testing}
                onClick={handleTestMessage}
                className="w-full"
              >
                {testing ? "Sending…" : "Send Test Message"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                icon={ShieldCheck}
                loading={validating}
                disabled={validating}
                onClick={handleValidateNumber}
                className="w-full"
              >
                {validating ? "Validating…" : "Validate WhatsApp Number"}
              </Button>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                <Monitor size={13} />
                <span>Test actions open WhatsApp Web/App using the configured business number.</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Bottom action bar (mobile-friendly duplicate of header actions) */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-end gap-2 sm:hidden"
        >
          <Button type="button" variant="ghost" icon={RotateCcw} onClick={handleReset} disabled={saving}>
            Reset
          </Button>
          <Button type="submit" icon={Save} loading={saving} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </motion.div>
      </form>
    </div>
  );
};

export default Settings;
