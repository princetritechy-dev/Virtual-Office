"use client";

import { useState } from "react";

const faqs = [
  {
    q: "What is a virtual office and how does it work?",
    a: "A virtual office gives your company a professional UK business address without renting a physical office. You use the address on your website, invoices, Companies House and HMRC. We receive your mail and you choose either our Collect package or Scan & Forward package.",
  },
  {
    q: "Do you charge setup fees or add ons?",
    a: "No. We have two simple packages with everything included. No setup fees, no hidden extras.",
  },
  {
    q: "Can I use the address as my registered office?",
    a: "Yes, you can use the address as your registered office.",
  },
  {
    q: "How does a virtual office help with SEO?",
    a: "It helps create a professional business presence and location relevance.",
  },
  {
    q: "How long does setup take?",
    a: "Setup is usually completed quickly after your details are verified.",
  },
  {
    q: "Can I book a meeting room?",
    a: "Yes, meeting room options can be arranged when available.",
  },
  {
    q: "Is a virtual office suitable for international businesses?",
    a: "Yes, it is suitable for international businesses needing a UK presence.",
    full: true,
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="faqSection">
      <div className="container">
        <div className="centerTitle">
          <h2 className="h2">Frequently Asked Questions</h2>
          <div className="titleUnderline" />
        </div>

        <div className="faqGrid">
          {faqs.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={index}
                className={`faqItem ${isOpen ? "open" : ""}`}
              >
                <button
                  className="faqQ"
                  onClick={() =>
                    setOpenIndex(isOpen ? null : index)
                  }
                >
                  <span>{item.q}</span>

                  <span className="faqPlus">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>

                <div className={`faqAnswerWrap ${isOpen ? "show" : ""}`}>
                  <div className="faqA">{item.a}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}