
import Header from "../components/header";
import Footer from "../components/footer";
import "./contact.css"; // ✅ make sure file name is contact.css (not about.css)
import ContactForm from "./ContactForm";


export default function ContactUsPage() {
  return (
    <main className="contact-page">
      <Header />

      <section className="contact-hero">
        <div className="hero-row"> 
        <h5>GET IN TOUCH</h5>
        <h1>Contact Us</h1>
        <div className="hero-content">
        <span className="upper">
          Sometimes the quickest way forward is simply to talk. If you are exploring a virtual office, comparing locations, or thinking about partnering with Virtual Office Anywhere, we encourage you to pick up the phone and speak with us directly.
        </span>
        <span className="lower">
          Our friendly team are ready to help you. We believe business support should feel personal, clear, and accessible. No call centres, just real people ready to help you
          find the right solution.
        </span>
        </div>
        </div>
      </section>
      <section className="contact-wrapper">
        <div className="contact-inner-wrapper">
          {/* LEFT INFO */}
          <div className="contact-info">
            <div className="contact-left">
              <h2>Contact Information</h2>
              <p>Our team is available to talk through locations, pricing, availability, partnership opportunities, or any questions you may have.</p>

              {/* <div className="info-item">
                <div className="info-svg">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
                    <path
                      d="M12 22s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </div>

                <div className="info-con">
                  <strong>Our Office</strong>
                  <br />
                  123 Lorem Ipsum Street
                  <br />
                  London, UK W1 2AB
                </div>
              </div> */}

              <div className="info-item">
                <div className="info-svg">
                  <svg xmlns="http://www.w3.org/20 00/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
                    <path
                      d="M21 16.5v3a2 2 0 0 1-2.2 2c-3.6-.4-6.9-2-9.6-4.6C6.5 14.2 4.9 10.9 4.5 7.3A2 2 0 0 1 6.5 5h3a2 2 0 0 1 2 1.7c.1.8.3 1.6.6 2.4a2 2 0 0 1-.4 2.1L10.5 12a16 16 0 0 0 3.5 3.5l.8-1.2a2 2 0 0 1 2.1-.4c.8.3 1.6.5 2.4.6A2 2 0 0 1 21 16.5Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <div className="info-con">
                  <strong>GIVE US A CALL</strong>
                  <br />
                  +44 (0) 20 7907 9380
                  {/* <br />
                  Mon - Fri, 9am - 6pm */}
                </div>
              </div>

              <div className="info-item">
                <div className="info-svg">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
                    <path
                      d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M4.5 7.5 12 13l7.5-5.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="info-con">
                  <strong>PREFER TO EMAIL?</strong>
                  <br />
                  You can also reach us at:
                  <br />
                 info@virtualofficeanywhere.co.uk
                </div>
              </div>
            </div>

            <div className="content-right">
              <h4>Follow Us</h4>
              <div className="svg-group">
                <div className="svg-gropu-item">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                    <path d="M4.98 3.5C4.98 4.88 3.86 6 2.48 6S0 4.88 0 3.5 1.12 1 2.48 1 4.98 2.12 4.98 3.5zM0 8h5v16H0V8zm7.5 0h4.7v2.2h.1c.7-1.2 2.4-2.4 5-2.4 5.3 0 6.3 3.5 6.3 8v9.2h-5V16c0-2.2 0-5-3-5s-3.5 2.3-3.5 4.8V24h-5V8z" />
                  </svg>
                </div>

                <div className="svg-gropu-item">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                    <path d="M24 4.6c-.9.4-1.8.6-2.8.8 1-.6 1.8-1.5 2.2-2.6-.9.5-2 .9-3.1 1.1A4.8 4.8 0 0 0 12 8.1c0 .4 0 .8.1 1.1C8 9 4.3 7.1 1.7 4.2c-.4.7-.6 1.5-.6 2.4 0 1.7.9 3.2 2.2 4.1-.8 0-1.6-.2-2.3-.6v.1c0 2.4 1.7 4.4 3.9 4.9-.4.1-.9.2-1.4.2-.3 0-.7 0-1-.1.7 2 2.6 3.5 4.8 3.6A9.7 9.7 0 0 1 0 21.5 13.6 13.6 0 0 0 7.3 24c8.8 0 13.6-7.3 13.6-13.6v-.6c.9-.7 1.7-1.5 2.3-2.4z" />
                  </svg>
                </div>

                <div className="svg-gropu-item">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                    <path d="M7 2C4.2 2 2 4.2 2 7v10c0 2.8 2.2 5 5 5h10c2.8 0 5-2.2 5-5V7c0-2.8-2.2-5-5-5H7zm0 2h10c1.7 0 3 1.3 3 3v10c0 1.7-1.3 3-3 3H7c-1.7 0-3-1.3-3-3V7c0-1.7 1.3-3 3-3zm5 3.5A5.5 5.5 0 1 0 17.5 13 5.5 5.5 0 0 0 12 7.5zm0 2A3.5 3.5 0 1 1 8.5 13 3.5 3.5 0 0 1 12 9.5zm4.8-3.3a1.3 1.3 0 1 0 1.3 1.3 1.3 1.3 0 0 0-1.3-1.3z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT FORM */}
          <ContactForm />
        </div>
      </section>

      <section className="map-section">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2482.5472159295473!2d-0.14466692337908485!3d51.5215223718165!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x48761ad63dfdab65%3A0x816ac5f19ffaca39!2sLorem%20Ipsum%20Corp!5e0!3m2!1sen!2suk!4v1770997633187!5m2!1sen!2suk"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          title="Google Map"
        />
      </section>

      <section className="faq">
        <h2>Have Questions?</h2>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
        <a href="#">View Frequently Asked Questions →</a>
      </section>

      <Footer />
    </main>
  );
}
