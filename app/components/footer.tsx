import Link from "next/link";
import Script from "next/script";
import Image from "next/image";
export default function Footer(){
  return(
    <><footer className="footer">
      <div className="footerBrand">
        <div className="brandText">
          <div className="brand">
            <img
              src="/images/logo2.png"
              alt="Virtual Office Anywhere"
              className="brandLogo" />
          </div>

        </div>
      </div>
      <div className="footerCopy">© 2026 Virtual Office Anywhere. All rights reserved.</div>
    </footer><Script id="hamburger-script" strategy="afterInteractive">
        {`
          const navWrapper = document.querySelector('.navWrapper');
          const hamburger = document.querySelector('.hamburger');

          if (hamburger) {
            hamburger.addEventListener('click', () => {
              navWrapper.classList.toggle('open');
            });
          }
        `}
      </Script>
      </>

  )
}