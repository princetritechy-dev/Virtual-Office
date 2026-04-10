"use client";

import React, { useState } from "react";

export default function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const fd = new FormData(form);

    const payload = {
      firstName: String(fd.get("firstName") || ""),
      lastName: String(fd.get("lastName") || ""),
      email: String(fd.get("email") || ""),
      phone: String(fd.get("phone") || ""),
      subject: String(fd.get("subject") || "General Inquiry"),
      message: String(fd.get("message") || ""),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || "Something went wrong.");
        return;
      }

      // Show success message and reset form
      setSuccessMessage(true);
      form.reset();
    } catch {
      alert("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="contact-form">
      {/* Display success message if form was successfully submitted */}
      {successMessage ? (
        <div className="success-message">
          <h3>Thank you for reaching out! We’ll get back to you shortly.</h3>
        </div>
      ) : (
        <>
          <h2>Send us a message</h2>
          <p>Fill out the form below and we'll get back to you shortly.</p>

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <input name="firstName" type="text" placeholder="First Name" required />
              <input name="lastName" type="text" placeholder="Last Name" required />
            </div>

            <div className="form-row">
              <input name="email" type="email" placeholder="Email Address" required />
              <input name="phone" type="text" placeholder="Phone Number" />
            </div>

            <div className="form-row">
              <select name="subject" defaultValue="General Inquiry">
                <option value="General Inquiry">General Inquiry</option>
                <option value="Support">Support</option>
                <option value="Sales">Sales</option>
              </select>
            </div>

            <div className="form-row">
              <textarea name="message" placeholder="How can we help you today?" required />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Message ✈"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
