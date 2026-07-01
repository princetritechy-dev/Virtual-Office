import Image from "next/image";
import Header from "../components/header";
import Footer from "../components/footer";
import "./compliance.css";

export const dynamic = "force-dynamic";

const WP_BASE =
  "https://lavender-alligator-176962.hostingersite.com/index.php/wp-json/custom/v1/page/597";

const WP_MEDIA =
  "https://lavender-alligator-176962.hostingersite.com/index.php/wp-json/wp/v2";

/**
 * WP fetch helper
 */
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

/**
 * Get media URL by ID
 */
async function getMediaUrl(id?: number | null): Promise<string | null> {
  if (!id) return null;

  const media = await wpFetch(`${WP_MEDIA}/media/${id}`);
  return media?.source_url || null;
}

export default async function WhyWork() {
  const page = await wpFetch(WP_BASE);

  const acf = page?.data?.acf || page?.acf || {};

  // Sections
  const s1 = acf?.first_section_content || {};
  const s2 = acf?.second_section_content || {};
  const s3 = acf?.third_section_content || {};
  const s4 = acf?.fourth_section_content || {};
  const s5 = acf?.fifth_section_content || {};

  // Text values (s1 + s2 + s3)
  const h1 = s1?.section_heading;
  const h3 = s2?.section_heading;

  const whyHeading = s3?.section_heading;
  const whySubHeading = s3?.sub_heading;
  const whyP1 = s3?.paragraph_one;

  const benefits = s3?.sub_section_content || [];

  // Media (parallel fetch)
const [heroBg, whyImage1, whyImage2] = await Promise.all([
  getMediaUrl(s1?.background_image?.ID),
  getMediaUrl(s3?.first_image?.ID),
  getMediaUrl(s3?.second_image?.ID),
]);

const subIcon = s2?.sub_section_icon;

  return (
    <main className="listing-page">
      <Header />

      {/* HERO SECTION */}
      <section
        className="compliance-hero"
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

          <p>{s1?.section_paragraph}</p>

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

        <div className="hero-curve" aria-hidden="true" />
      </section>

      {/* FLOATING CARD SECTION */}
      <section className="compliance-float-wrap">
        <div className="container">
          <div className="float-card">
            <h3 dangerouslySetInnerHTML={{ __html: h3 || "" }} />

            <p>{s2?.section_paragraph}</p>

            <div className="promise">
              <div className="promise-icon" aria-hidden="true">
                {subIcon && (
                  <Image src={subIcon} alt="Icon" width={20} height={24} />
                )}
              </div>

              <div>
                <div className="promise-small">
                  {s2?.sub_section_heading}
                </div>

                <div className="promise-text">
                  {s2?.sub_section_paragraph}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* THIRD SECTION (WHY / REQUIREMENTS) */}
      {/* THIRD SECTION */}
        <section className="sectionWhy">
        <div className="container whyGrid">

            {/* Images */}
            <div className="whyImages">
            <div className="leftImg">
                {whyImage1 && (
                <Image
                    src={whyImage1}
                    alt="Image"
                    fill
                    className="whyImg"
                />
                )}
            </div>

            <div className="rightImg">
                {whyImage2 && (
                <Image
                    src={whyImage2}
                    alt="Image"
                    fill
                    className="whyImg"
                />
                )}
            </div>
            </div>

            {/* Content */}
            <div className="whyContent">

            <h2
                dangerouslySetInnerHTML={{
                __html: whyHeading || "",
                }}
            />

            <p className="whyDesc">
                {whyP1}
            </p>

            <div className="quoteBox">
                {whySubHeading}
            </div>

            <h4>{s3?.sub_section_heading}</h4>

            <ul className="checkList">
                {benefits.map((item: any, index: number) =>
                item?.point_text ? (
                    <li key={index}>{item.point_text}</li>
                ) : null
                )}
            </ul>

            </div>

        </div>
        </section>

{/* FOURTH SECTION */}
<section className="better-experience">
  <div className="container">
    <div className="better-content">

      <h2
        dangerouslySetInnerHTML={{
          __html: s4?.section_heading || "",
        }}
      />

      <p className="description">
        {s4?.section_description}
      </p>

      <div className="experience-box">
        <p>{s4?.box_content}</p>
      </div>

      <h4>{s4?.bottom_text}</h4>

    </div>
  </div>
</section>

        {/* FIFTH SECTION */}
        <section className="cta-wrap">
        <div className="container">
            <div className="cta">
            <div>
                <h3>{s5?.section_heading}</h3>

                <div
                    dangerouslySetInnerHTML={{
                        __html: s5?.section_paragraph || "",
                    }}
                    />

                <div className="btns">
                {s5?.button_one_label && (
                    <a
                    className="btn primary"
                    href={s5?.button_one_link || "/contact-us"}
                    >
                    {s5.button_one_label}
                    </a>
                )}

                {s5?.button_two_label && (
                    <a
                    className="btn"
                    href={s5?.button_two_link || "/about-us"}
                    >
                    {s5.button_two_label}
                    </a>
                )}
                </div>
                {s5?.bottom_text && <small>{s5.bottom_text}</small>}
            </div>
            </div>
        </div>
        </section>

      <Footer />
    </main>
  );
}