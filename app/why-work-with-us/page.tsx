

import Image from "next/image";
import Header from "../components/header";
import Footer from "../components/footer";

import "./why-work.css"; // ✅ only this page css



export const dynamic = "force-dynamic";

const WP_BASE = "https://lavender-alligator-176962.hostingersite.com/index.php/wp-json/wp/v2/pages/336";
const WP_MEDIA = "https://lavender-alligator-176962.hostingersite.com/index.php/wp-json/wp/v2";
const stripQuoteDiv = (s: string) => {
  if (!s) return "";

  return s
    // remove raw <div class="quote">...</div> (including empty)
    .replace(/<div[^>]*class=["']quote["'][^>]*>[\s\S]*?<\/div>/gi, "")
    // remove escaped &lt;div class="quote"&gt;...&lt;/div&gt;
    .replace(/&lt;div[^&]*class=&quot;quote&quot;[^&]*&gt;[\s\S]*?&lt;\/div&gt;/gi, "")
    .trim();
};

async function wpFetch(url: string) {
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    const body = await res.text();
    console.error("WP FETCH FAILED:", res.status, res.statusText);
    console.error("URL:", url);
    console.error("BODY:", body.slice(0, 400));
    return null;
  }

  return res.json();
}


async function getMediaUrl(id?: number | null): Promise<string | null> {
  if (!id) return null;
  const media = await wpFetch(`${WP_MEDIA}/media/${id}`);
  return media?.source_url || null;
}



export default async function WhyWork() {
  const page = await wpFetch(`${WP_BASE}`);
  const acf = page?.acf || {};

  const s1 = acf?.first_section_content || {};
  const s2 = acf?.second_section_content || {};
  const s3 = acf?.third_section_content || {};
  const s4 = acf?.fourth_section_content || {};
  const s5 = acf?.fifth_section_content || {};
  const s6 = acf?.sixth_section_content || {};

  // Images
  const heroBg = await getMediaUrl(s1?.background_image);
  const subIcon = await getMediaUrl(s2?.sub_section_icon);
  const darkBg = await getMediaUrl(s5?.background_image);
  const s6ImageUrl = await getMediaUrl(s6?.section_image);


//Heading
const h1 = s1?.section_heading;
const h3 = s2?.section_heading;

  // Arrays

    const keyPoints = s3?.right_section_key_points ?? [];

    const keyPointsWithIcons = await Promise.all(
      keyPoints.map(async (kp: any) => ({
        ...kp,
        iconUrl: await getMediaUrl(kp?.point_icon),
      }))
    );


    

    const itemsRaw = s4?.section_items || [];

    const items = await Promise.all(
      itemsRaw.map(async (item: any) => ({
        ...item,
        iconUrl: await getMediaUrl(item?.item_icon),
      }))
    );
  return (
    <main className="listing-page">
      <Header />

      {/* HERO */}
      <section
        className="hero"
        style={
          {
            "--hero-bg": heroBg ? `url(${heroBg})` : "none",
          } as React.CSSProperties
        }
      >
        <div className="container hero-inner">
          <div className="pill">PARTNERSHIP PROGRAM</div>
          <h1 dangerouslySetInnerHTML={{ __html: h1 || "" }} />


          <div className="hero-divider" />

          <p>
            {s1?.section_paragraph}
          </p>

          <div className="hero-down" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 16l-6-6m6 6l6-6"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Curved white bottom */}
        <div className="hero-curve" aria-hidden="true" />
      </section>

      {/* FLOATING CARD */}
      <section className="float-wrap">
        <div className="container">
          <div className="float-card">
            <h3
              dangerouslySetInnerHTML={{ __html: h3 || "" }}
            />

            <p>
              {s2?.section_paragraph}
            </p>

            <div className="promise">
              <div className="promise-icon" aria-hidden="true">
                {subIcon && (
                  <Image
                    src={subIcon}
                    alt="Icon"
                    width={18}
                    height={18}
                  />
                )}
              </div>

              <div>
                <div className="promise-small">{s2?.sub_section_heading}</div>
                <div className="promise-text">
                  {s2?.sub_section_paragraph}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* REVENUE SPLIT */}
      <section className="section">
        <div className="container split">
          <div className="rev-card">
            <div className="rev-top">{s3?.left_section_heading}</div>

            <div className="rev-numbers">
              <div className="big">{s3?.left_section_number_first}</div>
              <div className="slash">/</div>
              <div className="small">{s3?.left_section_number_second}</div>
            </div>

            <div className="rev-bar">
              <span />
            </div>

             <div
                className="rev-note"
                dangerouslySetInnerHTML={{ __html: s3?.left_section_paragraph ?? "" }}
              />
          </div>

          <div className="split-text">
            <h2>{s3?.right_section_heading}</h2>
            <p>
              {s3?.right_section_paragraph}
            </p>

             <ul className="ticks">
                {keyPointsWithIcons.map((kp: any, idx: number) => (
                  <li key={idx}>
                    <span className="tick">
                      {kp.iconUrl ? (
                        <img src={kp.iconUrl} alt="" width={22} height={22} />
                      ) : 
                      (
                        // fallback tick if icon missing
                        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path
                            d="M20 6L9 17l-5-5"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>

                    {kp.point_description}
                  </li>
                ))}
              </ul>
          </div>
        </div>
      </section>

      {/* SUPPORT */}
      <section className="section how-we-support">
        <div className="container">
          <div className="title-center">
            <h2>{s4?.section_heading}</h2>
            <div className="underline" />
          </div>

          <div className="cards">
              {items.map((item: any, index: number) => (
                <div className="info-card" key={index}>
                  <div className="ic" aria-hidden="true">
                    {item.iconUrl ? (
                      <img src={item.iconUrl} alt="" width={40} height={40} />
                    ) : null}
                  </div>

                  <h3>{item?.item_heading}</h3>

                  <p
                    dangerouslySetInnerHTML={{
                      __html: item?.item_description || "",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
      </section>

      {/* DARK */}
      <section
        className="dark"
        style={
          {
            "--dark-bg": darkBg ? `url(${darkBg})` : "none",
          } as React.CSSProperties
        }
      >
        <div className="container dark-inner">
          <h2
              dangerouslySetInnerHTML={{
            __html: s5?.main_heading,
          }}/>

          <p>
            {stripQuoteDiv(s5?.intro_text)}
          </p>

          <div className="quote">
            <em>
              {s5?.quote_text}
            </em>
            <strong>
              {s5?.quote_highlight_line}
            </strong>
          </div>

          <div className="footer-line">
            {s5?.bottom_statement}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-wrap">
        <div className="container">
          <div className="cta">
            {/* ✅ Next/Image fill: parent must be relative + height */}
            <div className="cta-media">
              {s6ImageUrl && (
                <Image
                  src={s6ImageUrl}
                  alt={s6?.section_heading || "Partner with us"}
                  fill
                  style={{ objectFit: "cover" }}
                  priority
                />
              )}
            </div>

            <div>
              <h3>{s6?.section_heading}</h3>
              <p>
                {s6?.section_paragraph}
              </p>

              <div className="btns">
                {s6?.button_one_label && s6?.button_one_link?.url && (
                  <a
                    className="btn primary"
                    href={s6.button_one_link.url}
                    target={s6.button_one_link.target || undefined}
                    rel={s6.button_one_link.target === "_blank" ? "noopener noreferrer" : undefined}
                  >
                    {s6.button_one_label}
                  </a>
                )}

                {s6?.button_two_label && s6?.button_two_link?.url && (
                  <a
                    className="btn"
                    href={s6.button_two_link.url}
                    target={s6.button_two_link.target || undefined}
                    rel={s6.button_two_link.target === "_blank" ? "noopener noreferrer" : undefined}
                  >
                    {s6.button_two_label}
                  </a>
                )}
              </div>

              {s6?.bottom_text && <small>{s6.bottom_text}</small>}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

