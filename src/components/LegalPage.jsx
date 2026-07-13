import { useLocation, Link } from "react-router-dom";
import Layout from "./Layout";

const legalPages = {
  "/terms": {
    title: "Terms of Service",
    subtitle: "Simple, transparent terms designed for modern shopping.",
    sections: [
      {
        heading: "What you can expect",
        content:
          "ApnaQazi operates a secure e-commerce platform for product browsing, ordering, and fast checkout. Orders are governed by a clear refund, delivery, and return process.",
      },
      {
        heading: "Order acceptance",
        content:
          "All orders are subject to availability and confirmation. An order confirmation email is not a guarantee that the order has been accepted. Acceptance occurs when your order is shipped.",
      },
      {
        heading: "Payment and pricing",
        content:
          "Prices listed on the site include taxes where applicable. Payment is processed securely and we support local payment options through the checkout flow.",
      },
    ],
  },
  "/privacy": {
    title: "Privacy Policy",
    subtitle: "How ApnaQazi protects your personal information.",
    sections: [
      {
        heading: "Data we collect",
        content:
          "We collect only the information required to process orders, deliver products, and improve your shopping experience. We do not sell your information to third parties.",
      },
      {
        heading: "Security",
        content:
          "Your personal data is protected using standard security practices. Sensitive payment details are not stored on our servers.",
      },
      {
        heading: "Communications",
        content:
          "We may contact you about your order, account updates, and relevant offers. You may opt out of promotional messages at any time.",
      },
    ],
  },
  "/returns": {
    title: "Return Policy",
    subtitle: "Easy and clear returns for eligible orders.",
    sections: [
      {
        heading: "Eligibility",
        content:
          "Items are eligible for return within 14 days of delivery when in original condition and packaging. Some categories may have specific return guidelines.",
      },
      {
        heading: "How to return",
        content:
          "Contact our support team through the contact page within 14 days. We will guide you through the return authorization and shipment process.",
      },
      {
        heading: "Refund timeline",
        content:
          "Refunds are processed after the returned item is inspected. It may take up to 7 business days for the refund to appear in your account.",
      },
    ],
  },
};

const LegalPage = () => {
  const { pathname } = useLocation();
  const page = legalPages[pathname] || legalPages["/terms"];

  return (
    <Layout>
      <section className="bg-slate-50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-[28px] border border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-600">Legal</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              {page.title}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              {page.subtitle}
            </p>
          </div>

          <div className="space-y-8">
            {page.sections.map((section) => (
              <article key={section.heading} className="rounded-3xl bg-slate-50 p-6">
                <h2 className="text-xl font-semibold text-slate-900">{section.heading}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{section.content}</p>
              </article>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">Need help? Our support team is ready to assist.</p>
            <Link
              to="/contact-us"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default LegalPage;
