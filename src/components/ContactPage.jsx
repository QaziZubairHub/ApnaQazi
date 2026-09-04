import { useState } from 'react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;
    setFormData({ name: '', email: '', subject: '', message: '' });
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <section
      id="contact"
      className="grid grid-cols-1 lg:grid-cols-3 bg-white min-h-[580px] font-sans border-t border-[#e8e0d5]"
    >
      {/* Left — Google Map: Shah Faisal Colony, Karachi */}
      <div className="w-full min-h-[300px] lg:min-h-[580px]">
        <iframe
          title="Shah Faisal Colony, Karachi"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3620.5!2d67.14480879999999!3d24.8798492!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3eb33e06723fa22f%3A0x31a99b40db2fd0f4!2sTCF%20School%20Shah%20Faisal%20Campus!5e0!3m2!1sen!2spk!4v1700000000000"
          className="w-full h-full min-h-[300px] border-0"
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      {/* Middle — Office Info */}
      <div className="px-8 py-12 bg-[#f9f8f6] flex flex-col justify-center gap-7 border-r border-[#e8e0d5]">
        <div>
          <h2 className="text-[26px] font-semibold text-[#1a1a2e] tracking-tight font-serif">
            Meet us
          </h2>
          <div className="mt-3 h-px bg-[#e8e0d5]" />
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[#c8a96e] text-[15px]">📞</span>
            <span className="text-[11px] font-semibold text-[#888] uppercase tracking-widest">
              Phone
            </span>
          </div>
          <p className="text-[14px] text-[#1a1a2e] pl-6">+92 300 0000000</p>
        </div>

        {/* Address */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[#c8a96e] text-[15px]">📍</span>
            <span className="text-[11px] font-semibold text-[#888] uppercase tracking-widest">
              Our office
            </span>
          </div>
          <p className="text-[14px] text-[#1a1a2e] pl-6 leading-relaxed">
            Near TCF School, Shah Faisal Colony,<br />Karachi, Pakistan
          </p>
        </div>

        {/* Hours */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[#c8a96e] text-[15px]">🕐</span>
            <span className="text-[11px] font-semibold text-[#888] uppercase tracking-widest">
              Hours
            </span>
          </div>
          <p className="text-[14px] text-[#1a1a2e] pl-6 leading-relaxed">
            Mon – Fri: 9am – 6pm<br />Sat: 10am – 2pm
          </p>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[#c8a96e] text-[15px]">✉️</span>
            <span className="text-[11px] font-semibold text-[#888] uppercase tracking-widest">
              Email
            </span>
          </div>
          <a
            href="mailto:hi@ourcompany.com"
            className="text-[14px] text-[#c8a96e] font-medium pl-6 hover:text-[#e63946] transition-colors"
          >
            hi@ourcompany.com
          </a>
        </div>
      </div>

      {/* Right — Contact Form */}
      <div className="px-8 py-12 bg-white flex flex-col justify-center">
        <h2 className="text-[26px] font-semibold text-[#1a1a2e] tracking-tight font-serif mb-7">
          Get in touch
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="name"
              className="text-[11px] font-semibold text-[#888] uppercase tracking-widest"
            >
              Your name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Ahmed Khan"
              value={formData.name}
              onChange={handleChange}
              required
              className="px-3 py-2.5 bg-[#f9f8f6] border border-[#e8e0d5] rounded-md text-[13px] text-[#1a1a2e] placeholder:text-[#bbb] outline-none focus:border-[#c8a96e] focus:ring-1 focus:ring-[#c8a96e] transition-all"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-[11px] font-semibold text-[#888] uppercase tracking-widest"
            >
              Email address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="ahmed@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              className="px-3 py-2.5 bg-[#f9f8f6] border border-[#e8e0d5] rounded-md text-[13px] text-[#1a1a2e] placeholder:text-[#bbb] outline-none focus:border-[#c8a96e] focus:ring-1 focus:ring-[#c8a96e] transition-all"
            />
          </div>

          {/* Subject */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="subject"
              className="text-[11px] font-semibold text-[#888] uppercase tracking-widest"
            >
              Subject
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              placeholder="How can we help you?"
              value={formData.subject}
              onChange={handleChange}
              className="px-3 py-2.5 bg-[#f9f8f6] border border-[#e8e0d5] rounded-md text-[13px] text-[#1a1a2e] placeholder:text-[#bbb] outline-none focus:border-[#c8a96e] focus:ring-1 focus:ring-[#c8a96e] transition-all"
            />
          </div>

          {/* Message */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="message"
              className="text-[11px] font-semibold text-[#888] uppercase tracking-widest"
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows="4"
              placeholder="Write your message here..."
              value={formData.message}
              onChange={handleChange}
              className="px-3 py-2.5 bg-[#f9f8f6] border border-[#e8e0d5] rounded-md text-[13px] text-[#1a1a2e] placeholder:text-[#bbb] outline-none resize-none focus:border-[#c8a96e] focus:ring-1 focus:ring-[#c8a96e] transition-all"
            />
          </div>

          <button
            type="submit"
            className="mt-1 py-3 bg-[#1a1a2e] hover:bg-[#c8a96e] text-white rounded-md text-[12px] font-semibold tracking-widest uppercase transition-colors duration-300"
          >
            Send message
          </button>

          {/* Success message */}
          {submitted && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded-md text-[13px] text-green-700">
              <span>✅</span>
              Message sent! We'll get back to you soon.
            </div>
          )}
        </form>
      </div>
    </section>
  );
};

export default Contact;
