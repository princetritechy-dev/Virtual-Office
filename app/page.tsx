import Image from "next/image";
import PlatformCard from "./PlatformCard";
import Header from "./components/header";
// import Footer from "./components/footer";

export const dynamic = "force-dynamic"; // ✅ IMPORTANT for Vercel

type ContentBox = {
  content_box: string;
};

type DifferenceContent = {
  first_difference_content: {
    difference_content: ContentBox[];
  };
  second_difference_content: {
    difference_content: ContentBox[];
  };
  third_difference_content: {
    difference_content: ContentBox[];
  };
};

type WPPage = {
      first_difference_content?: {
      difference_content: ContentBox[];
    };
    second_difference_content?: {
      difference_content: ContentBox[];
    };
    third_difference_content?: {
      difference_content: ContentBox[];
    }
};

async function getMediaById(id: number) {
  const res = await fetch(
    `https://lavender-alligator-176962.hostingersite.com/index.php/wp-json/wp/v2/media/${id}`,
    { cache: "no-store" }
  );

  if (!res.ok) return null;

  const data = await res.json();

  return {
    src: data?.source_url,
    alt: data?.alt_text || data?.title?.rendered || "",
  };
}

async function getHomePage() {
  const res = await fetch(
    "https://lavender-alligator-176962.hostingersite.com/index.php/wp-json/wp/v2/pages?slug=home",
    { cache: "no-store" }
  );

  if (!res.ok) return null;

  const data = await res.json();
  return data?.[0] ?? null;
}

export default async function HomePage() {
  const page = await getHomePage();

  console.log("WP PAGE DATA:", {
    title: page?.title?.rendered,
    hasACF: !!page?.acf,
    acfKeys: page?.acf ? Object.keys(page.acf) : [],
  });

  console.log(page?.acf?.benefits_section); 

  const h1 = page?.acf?.banner?.main_heading;
  const subheading = page?.acf?.banner?.sub_heading;
  const hero_para = page?.acf?.banner?.bottom_content;
  const heroButtons = page?.acf?.banner?.hero_buttons || [];
  const heroImageId = page?.acf?.banner?.hero_image;
  let heroImage = null;
  if (heroImageId) {
    heroImage = await getMediaById(heroImageId);
  }
  const hero_note = page?.acf?.banner?.address_content;




const whySection = page?.acf?.why_section || {};

const whyHeading = whySection?.why_heading || "";
const whySubHeading = whySection?.why_sub_heading || "";
const whyP1 = whySection?.why_paragraph_one || "";
const whyP2 = whySection?.why_paragraph_two || "";

let whyImage1 = null;
let whyImage2 = null;

if (whySection?.why_image_first) {
  whyImage1 = await getMediaById(whySection.why_image_first);
}

if (whySection?.why_image_second) {
  whyImage2 = await getMediaById(whySection.why_image_second);
}

const benefits = page?.acf?.benefits_section ?? [];



const receiveItems = Array.isArray(page?.acf?.what_you_recieve_section)
  ? page.acf.what_you_recieve_section
  : [];
const receiveIcons = await Promise.all(
  receiveItems.map(async (item: any) => {
    const id = item?.icon_image;
    if (!id) return null;
    return await getMediaById(id);
  })
);

const howSteps = Array.isArray(page?.acf?.how_it_work_section)
  ? page.acf.how_it_work_section
  : [];



const platformItems = Array.isArray(page?.acf?.platform_features_section)
  ? page.acf.platform_features_section
  : [];

const platformIcons = await Promise.all(
  platformItems.map(async (item: any) => {
    const id = item?.icon_image;
    if (!id) return null;
    return await getMediaById(id);
  })
);

  
  function decodeHtmlEntities(h1: any): import("react").ReactNode {
    throw new Error("Function not implemented.");
  }

  return (
    <div className="page">
      <Header />

      {/* ================= HERO ================= */}
      <section className="hero">
        <div className="heroBg" aria-hidden="true" />
        <div className="container heroGrid">
          <div className="heroLeft">
            <div className="pill">
              <Image
                src="/images/icon-top.png"
                alt="Check icon"
                width={8}
                height={8}
                className="dotIcon"
              />
              <span>Live in 24 HOURS</span>
            </div>

            <h1
                className="h1"
                dangerouslySetInnerHTML={{
                  __html: h1 || "",
                }}
              />


            <p className="lead">
              {hero_para}
            </p>

            <div className="heroCtas">
              {heroButtons.map((btn: any, index: number) => {
                const label = btn?.button_text;
                const link = btn?.button_link || "#";
            
                return (
                  <a
                    key={index}
                    href={link}
                    className={`btn ${index === 0 ? "btnPrimary" : "btnGhost"}`}
                  >
                    {label}
                  </a>
                );
              })}
            </div>
            <div className="heroNote">
              <p>
                {hero_note}
              </p>
            </div>
          </div>

          <div className="heroRight">
            <div className="heroMediaCard">
              <div className="collage">
                <div className="collageTop">
                  <div className="imgWrap">
                  <Image
                    src={heroImage?.src}
                    alt={heroImage?.alt}
                    fill
                    className="collageImg"
                   
                  />
                  </div>
                </div>
              </div>
            </div>

            <div className="statusPill">
              <div className="statusIcon" aria-hidden="true" />
              <div className="statusText">
                <div className="statusLabel">STATUS</div>
                <div className="statusValue">Mail Received</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= WHY CHOOSE ================= */}
      <section className="section sectionWhy">
        <div className="container whyGrid">
          <div className="whyImages">
            <div className="whyCard whyCardTall">
              <div className="imgWrap">
                <Image
                src={whyImage1?.src || ""}
                alt={whyImage1?.alt || ""}
                fill
                className="whyImg"
              />
              </div>
            </div>

            <div className="whyCard whyCardTop">
              <div className="imgWrap">
                <Image
                  src={whyImage2?.src}
                  alt={whyImage2?.alt}
                  fill
                  className="whyImg"
                />
              </div>
            </div>
          </div>

          <div className="whyText">
            <h2 className="h2">{whyHeading}</h2>
            <h3 className="subhead">{whySubHeading}</h3>
            <p className="muted">{whyP1}</p>
            <p className="muted-two">{whyP2}</p>
          </div>
        </div>

        <div className="container benefitsCard">
          <div className="benefitsTitle">
            Benefits of choosing a virtual office with us
          </div>

          <div className="benefitsGrid">
            <ul className="checkList">
              {benefits.map((item: any, i: number) =>
                item?.benefit_content ? (
                  <li key={i}>{item.benefit_content}</li>
                ) : null
              )}
            </ul>            
          </div>
        </div>
      </section>

      {/* ================= WHAT YOU RECEIVE ================= */}
      <section className="section">
  <div className="container">
    <div className="centerTitle">
      <h2 className="h2">What You Receive</h2>
      <div className="titleUnderline" aria-hidden="true" />
    </div>

    <div className="cardsGrid">
      {receiveItems.map((item: any, idx: number) => {
        const icon = receiveIcons[idx];

        return (
          <FeatureCard
            key={idx}
            icon={
              <Image
                src={icon?.src }
                alt={icon?.alt || ""}
                width={40}
                height={40}
              />
            }
            title={item?.title || ""}
            q2={item?.question || ""}
            desc={item?.description || ""}
            note={item?.note || ""}
            noteText={item?.note_text || ""}
          />
        );
      })}
    </div>
  </div>
</section>

  <section className="business-address">
  <div className="container">
    <div className="left">
      <p  className="feature-location">Featured Location</p>
      <h2>Pick Your Perfect Business Address</h2>
      <p>Choose a professional location that supports the image you want for your business. Our Mayfair address is known for its reputation, stability, and high-quality surroundings.</p>
      <div className="mayfair"> 
        <div className="mygairimage"> 
          <Image
  src="/images/location.png"
  alt="Map icon"
  width={24}
  height={24}
  className="checkIcon"
/>


        </div>
        <div className="mayfair-content"> 
          <h3 className="address">Mayfair, London W1</h3>
          <p className="address">Mayfair, London W1</p>
        </div>

      </div>
      <a href="#" className="view-plans-btn">View Plans</a>
    </div>
    <div className="right">
   <Image
  src="/images/bg1.png"
  alt="Featured location"
  width={600}
  height={600}
  className="checkIcon"
/>

    </div>
  </div>
</section>

<section className="how-it-works">
  <div className="container">
    <p className="simple">Simple Process</p>
    <h2>How It Works</h2>
    <p>
      A simple walk-through process at every step. We help the process clear so
      you know what comes next.
    </p>

    <div className="steps">
      {howSteps.map((step: any, index: number) => (
        <div className="step" key={index}>
          <span className="step-number">
            {index === howSteps.length - 1 ? "✔" : index + 1}
          </span>

          <div className="step-inner">
            <h3>{step?.title || ""}</h3>
            <p>{step?.description || ""}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>


      {/* ================= PLATFORM FEATURES ================= */}
      <section className="section-platform">
  <div className="container platform">
    <div className="platformTitle">
      <h2 className="h2">Platform Features</h2>
      <p className="muted">
        Everything you need in one place. Your client dashboard gives you
        access to tools that make managing your virtual office simple.
      </p>
    </div>

    <div className="platformGrid">
      {platformItems.map((item: any, idx: number) => {
        const icon = platformIcons[idx];

        return (
          <PlatformCard
            key={idx}
            icon={
              <Image
                src={icon?.src || `/images/${idx + 1}.png`}
                alt={icon?.alt || ""}
                width={30}
                height={36}
              />
            }
            title={item?.feature_title || ""}
            subtitle={item?.feature_subtitle || ""}
            ghost={idx === platformItems.length - 1}
          />
        );
      })}
    </div>
  </div>
</section>

      {/* ================= TESTIMONIALS ================= */}
      <section className="section dark">
        <div className="container">
          <div className="centerTitle darkTitle">
            <h2 className="h2 light">Trusted by businesses of all sizes</h2>
          </div>

          <div className="testGrid">
            <TestimonialCard
              quote="Setting up our UK business address was quick and stress free. The team was incredibly helpful and the Mayfair location gives our company real presence."
              name="Daniel"
              role="Executive Owner"
              avatar="/images/Daniel.png"
            />
            <TestimonialCard
              quote="Mail handling has been smooth from the start. The dashboard makes everything easy to manage and support replies fast."
              name="Priya"
              role="Digital Consultant"
              avatar="/images/Priya.png"
            />
          </div>
        </div>
      </section>

      <section className="section-see-difference">
              <div className="container">
                <div className="diffHead">
                  <h2 className="h2 diffTitle">See the Difference</h2>
                  <p className="muted diffSub">Why businesses switch to Virtual Office Anywhere.</p>
                </div>

                <div className="diffWrap">
  {/* LEFT LABELS */}
  <div className="diffLeft">
    {Array.isArray(page?.acf?.first_difference_content?.difference_content) ? (
      page?.acf?.first_difference_content?.difference_content?.map((item: ContentBox, index: number) => (
        <div key={index} className="diffLabel">
          {item.content_box}
        </div>
      ))
    ) : (
      <div>No data available</div> // Display a fallback message if it's not an array
    )}
  </div>

  {/* CENTER MAIN CARD */}
  <div className="diffCenter">
    <div className="diffMainCard">
      <div className="diffBrand">
        <Image
          src="/images/logo2.png"
          alt="Virtual Office Anywhere"
          width={180}
          height={80}
          className="diffLogo"
          priority
        />
      </div>

      <div className="diffMainList">
        {Array.isArray(page?.acf?.second_difference_content?.difference_content) ? (
          page?.acf?.second_difference_content?.difference_content?.map((item: ContentBox, index: number) => (
            <div key={index} className="diffMainItem per-month">
              <div
                  dangerouslySetInnerHTML={{ __html: item.content_box }}
                />
            </div>
          ))
        ) : (
          <div>No data available</div>
        )}
      </div>

      <button className="btn btnPrimary full diffBtn">Choose Us</button>
    </div>
  </div>

  {/* RIGHT PROVIDERS CARD */}
  <div className="diffRight">
    <div className="diffOtherCard">
      <div className="diffOtherHead">Large Mass Providers</div>
      <div className="diffOtherList">
        {Array.isArray(page?.acf?.third_difference_content?.difference_content) ? (
          page?.acf?.third_difference_content?.difference_content?.map((item: ContentBox, index: number) => (
            <div key={index} className="diffOtherItem">
              {item.content_box}
            </div>
          ))
        ) : (
          <div>No data available</div>
        )}
      </div>
    </div>
  </div>
</div>

              </div>
      </section>

      <Footer />
    </div>
  );
}

/* ================= COMPONENTS ================= */

function FeatureCard(props: {
  icon: React.ReactNode;
  title: string;
  q2: string;
  desc: string;
  note: string;
  noteText: string;
}) {
  return (
    <div className="featureCard">
      <div className="featureIcon">{props.icon}</div>
      <div className="featureTitle">{props.title}</div>
      <div className="featureq2">{props.q2}</div>
      <div className="featureDesc">{props.desc}</div>
      <div className="featureNote">
        <div className="noteHead">{props.note}</div>
        <div className="noteText">{props.noteText}</div>
      </div>
    </div>
  );
}

function StepCard(props: { title: string; desc: string }) {
  return (
    <div className="stepCard">
      <div className="stepTitle">{props.title}</div>
      <div className="stepDesc">{props.desc}</div>
    </div>
  );
}

function TestimonialCard(props: {
  quote: string;
  name: string;
  role: string;
  avatar?: string;
}) {
  return (
    <div className="testCard">
      <div className="testStars" aria-hidden="true">
        ★★★★★
      </div>

      <div className="testQuote">“{props.quote}”</div>

      <div className="testPerson">
        <div className="testAvatar">
          {props.avatar ? (
            <Image
              src={props.avatar}
              alt=""
              width={28}
              height={28}
              className="testAvatarImg"
            />
          ) : (
            <span className="testAvatarFallback" aria-hidden="true" />
          )}
        </div>

        <div className="testMeta">
          <div className="testName">{props.name}</div>
          <div className="testRole">{props.role}</div>
        </div>
      </div>
    </div>
  );
}
