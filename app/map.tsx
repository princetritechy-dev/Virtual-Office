// import { useEffect, useState } from "react";

interface ContentBox {
  content_box: string;
}

interface DifferenceContent {
  first_difference_content: {
    difference_content: ContentBox[];
  };
  second_difference_content: {
    difference_content: ContentBox[];
  };
  third_difference_content: {
    difference_content: ContentBox[];
  };
}

interface WPPage {
  acf?: {
    see_the_difference?: DifferenceContent;
    main_heading?: string;
  };
}

const OfficeComparisonSection: React.FC = () => {
  const [pageData, setPageData] = useState<WPPage | null>(null);

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        const response = await fetch('https://your-wordpress-site.com/wp-json/wp/v2/pages/your-page-id'); // Replace with your actual endpoint
        const data = await response.json();
        setPageData(data);
      } catch (error) {
        console.error('Error fetching ACF data: ', error);
      }
    };

    fetchPageData();
  }, []);

  if (!pageData) return <div>Loading...</div>;

  return (
    <section className="officeComparisonSection">
      <div className="container">
        <h2>{pageData.acf?.main_heading}</h2>

        <div className="diffWrap">
          {/* LEFT LABELS */}
          <div className="diffLeft">
            {pageData.acf?.see_the_difference?.first_difference_content?.difference_content?.map(
              (item: ContentBox, index: number) => (
                <div key={index} className="diffLabel">
                  {item.content_box}
                </div>
              )
            )}
          </div>

          {/* CENTER MAIN CARD (Virtual Office Anywhere) */}
          <div className="diffCenter">
            <div className="diffMainCard">
              <div className="diffBrand">
                <img src="/images/logo2.png" alt="Virtual Office Anywhere" width={180} height={80} />
              </div>

              <div className="diffMainList">
                {pageData.acf?.see_the_difference?.second_difference_content?.difference_content?.map(
                  (item: ContentBox, index: number) => (
                    <div key={index} className="diffMainItem">
                      {item.content_box}
                    </div>
                  )
                )}
              </div>

              <button className="btn btnPrimary full diffBtn">Choose Us</button>
            </div>
          </div>

          {/* RIGHT PROVIDERS CARD (Large Mass Providers) */}
          <div className="diffRight">
            <div className="diffOtherCard">
              <div className="diffOtherHead">Large Mass Providers</div>
              <div className="diffOtherList">
                {pageData.acf?.see_the_difference?.third_difference_content?.difference_content?.map(
                  (item: ContentBox, index: number) => (
                    <div key={index} className="diffOtherItem">
                      {item.content_box}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OfficeComparisonSection;
