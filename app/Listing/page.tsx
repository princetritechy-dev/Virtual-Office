
import Header from "../components/header";
import Footer from "../components/footer";
import Image from "next/image";
import "./listing.css";



export const dynamic = "force-dynamic";

const WP_ROOT ="https://lavender-alligator-176962.hostingersite.com/index.php/wp-json/wp/v2";

async function wpFetch(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`WP fetch failed ${res.status}: ${url}\n${body.slice(0, 200)}`);
  }
  return res.json();
}


const mediaCache = new Map<number, string>();

async function getMediaUrl(id?: number | null): Promise<string | null> {
  if (!id) return null;
  if (mediaCache.has(id)) return mediaCache.get(id)!;

  const media = await wpFetch(`${WP_ROOT}/media/${id}`);
  const url = media?.source_url ?? null;

  if (url) mediaCache.set(id, url);
  return url;
}

export default async function LocationPage() {
  const page = await wpFetch(
    `${WP_ROOT}/pages/424`
  );

  const acf = page?.acf || {};

  const s1 = acf?.section_one_content || {};
  const left = acf?.left_section_content || {};
  const right = acf?.right_section_content || {};
  const s3 = acf?.section_three_content || {};


  const sectionOneBg = await getMediaUrl(s1?.bg_image);
  const heroImg = await getMediaUrl(s1?.right_image);
  const pillIcon = await getMediaUrl(s1?.pill_icon);
  const servicesIcon = await getMediaUrl(left?.section_icon);
  const mapImg = await getMediaUrl(right?.section_image);

  const transportItemsRaw = right?.section_item || [];
  const transportIcons = await Promise.all(
    transportItemsRaw.map((it: any) => getMediaUrl(it?.icon))
  );

  const transportItems = transportItemsRaw.map((it: any, idx: number) => ({
    ...it,
    iconUrl: transportIcons[idx],
  }));

  const featuresRaw = s3?.features || [];
  const featureIcons = await Promise.all(
    featuresRaw.map((f: any) => getMediaUrl(f?.icon_image))
  );

  const features = featuresRaw.map((f: any, idx: number) => ({
    ...f,
    iconUrl: featureIcons[idx],
  }));
  return (
    <main>
      <Header />

      {/* HERO */}
      <section
          className="hero"
          style={
            {
              "--section-bg": sectionOneBg ? `url(${sectionOneBg})` : "none",
            } as React.CSSProperties
          }
        >
        <div className="wrap">
          <div className="heroGrid">
            <div>
              <div className="badge">
                <span className="dot" />{s1?.badge_text}
              </div>

              <h1
                className="h1"
                dangerouslySetInnerHTML={{ __html: s1?.title || "" }}
              />

              <div className="priceRow">
                <div className="price">{s1?.price_amount}</div>
                <div className="per">{s1?.price_suffix}</div>
              </div>

              <p className="discount">{s1?.discount_text}</p>

              <nav className="tabs" aria-label="tabs">
                {(s1?.tabs || []).map((t: any, i: number) => (
                  <a key={i} className={`tab ${i === 0 ? "active" : ""}`} href={t?.tab_link}>
                    {t?.tab_label}
                  </a>
                ))}
              </nav>

              <p
                className="desc"
                dangerouslySetInnerHTML={{
                  __html: (s1?.description || "").replace(/\r?\n/g, "<br/>"),
                }}
              />

              <a className="cta" href={s1?.cta_button_link?.url || "#"}>
                {s1?.cta_button_label}
              </a>

            </div>

            <div className="heroCard">
              <div className="heroMedia">
                {heroImg && (
                  <Image
                    src={heroImg}
                    alt="Building"
                    width={1400}
                    height={900}
                    style={{ width: "100%", height: "auto" }}
                    priority
                  />
                )}

                <div className="locPill">
                  {pillIcon && <img src={pillIcon} alt="" width={18} />}
                  {s1?.pill_text}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="content">
        <div className="wrap">
          <div className="contentGrid">
            {/* Left: Services Card */}
            <div className="whiteCard">
              <h2 className="cardTitle">
                {servicesIcon && <img src={servicesIcon} alt="" className="ico" />}
                {left?.section_heading}
              </h2>

              <ul className="list">
                {(left?.section_list || []).map((item: any, idx: number) => (
                  <li key={idx} className="li">
                    ✔ {item?.list_item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: Transport + Map */}
            <div className="rightCol">
              <h3>{right?.section_heading}</h3>

              <div className="transport">
                {transportItems.map((t: any, i: number) => (
                  <div className="tItem" key={i}>
                    {t.iconUrl && <img src={t.iconUrl} width={20} alt="" />}
                    <div>
                      <b>{t.item_title}</b>
                      <span>{t.time}</span>
                    </div>
                  </div>
                ))}
                </div>

              <div className="mapCard">
                {mapImg && (
                  <Image
                    src={mapImg}
                    alt="Map"
                    width={1400}
                    height={900}
                    style={{ width: "100%", height: "auto" }}
                  />
                )}
                <div className="mapBar">
                  <div className="mapLeft">
                    <svg className="pinMini" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 22s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    <div className="mapTxt">
                      <b>{right?.section_title}</b>
                      <span>{right?.section_subtitle}</span>
                    </div>
                  </div>
                  <div className="tag">{right?.tag_text}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM STRIP */}
      <section className="featureStrip">
        <div className="wrap">
          <div className="features">
            {features.map((f: any, i: number) => (
              <div key={i} className="featureItem">
               <div className="imgdiv"> {f.iconUrl && <img src={f.iconUrl} width={24} alt="" />}</div>
                <p className="fTitle">{f.feature_title}</p>
                <p className="fDesc">{f.feature_description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
