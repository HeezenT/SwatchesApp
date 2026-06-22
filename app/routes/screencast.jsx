export const loader = () => null;

const steps = [
  {
    title: "1. Sync and group products",
    body: "Merchants open Product groups, sync catalog items, and connect related products under one option such as color, model, or bundle.",
    image: "/screencast-assets/product-groups.png",
    alt: "Product groups list for swatch setup",
  },
  {
    title: "2. Customize storefront styling",
    body: "Appearance controls let merchants adjust active borders, inactive borders, radius, typography, helper text, and color presets without editing code.",
    image: "/screencast-assets/appearance.png",
    alt: "Appearance settings for storefront swatches",
  },
  {
    title: "3. Publish premium swatches",
    body: "The Online Store 2.0 theme app block renders large Lekker Bikes style swatches in the product information column with selected values aligned right.",
    image: "/screencast-assets/storefront.png",
    alt: "Storefront product page with premium swatches",
  },
];

export default function Screencast() {
  return (
    <main className="screencast-page">
      <section className="hero">
        <div>
          <p className="eyebrow">Shopify App Review Walkthrough</p>
          <h1>Deryan Variant Swatches</h1>
          <p>
            This public walkthrough shows the app setup flow and storefront
            result for reviewers: product groups, visual customization, and the
            theme app extension output.
          </p>
        </div>
        <img
          src="/screencast-assets/feature-media.png"
          alt="Premium variant swatches overview"
        />
      </section>

      <section className="steps" aria-label="App walkthrough">
        {steps.map((step) => (
          <article className="step" key={step.title}>
            <div className="copy">
              <h2>{step.title}</h2>
              <p>{step.body}</p>
            </div>
            <img src={step.image} alt={step.alt} />
          </article>
        ))}
      </section>

      <Style />
    </main>
  );
}

function Style() {
  return (
    <style>{`
      :root {
        color: #151515;
        background: #f6f4ef;
        font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      body { margin: 0; background: #f6f4ef; }

      .screencast-page {
        max-width: 1180px;
        margin: 0 auto;
        padding: 56px 24px 72px;
      }

      .hero {
        display: grid;
        grid-template-columns: minmax(0, 0.86fr) minmax(0, 1.14fr);
        gap: 34px;
        align-items: center;
        padding-bottom: 34px;
        border-bottom: 1px solid #d8d4cc;
      }

      .eyebrow {
        margin: 0 0 12px;
        color: #745d48;
        font-size: 14px;
        font-weight: 800;
        letter-spacing: 0;
        text-transform: uppercase;
      }

      h1 {
        margin: 0;
        font-size: 52px;
        line-height: 1;
        letter-spacing: 0;
      }

      .hero p:not(.eyebrow),
      .copy p {
        color: #514f4a;
        font-size: 19px;
        line-height: 1.55;
      }

      .hero img,
      .step img {
        display: block;
        width: 100%;
        height: auto;
        border: 1px solid #ded9d0;
        border-radius: 14px;
        background: #fff;
        box-shadow: 0 18px 50px rgba(34, 29, 22, 0.08);
      }

      .steps {
        display: grid;
        gap: 34px;
        margin-top: 34px;
      }

      .step {
        display: grid;
        grid-template-columns: 310px minmax(0, 1fr);
        gap: 32px;
        align-items: start;
        padding: 34px 0;
        border-bottom: 1px solid #d8d4cc;
      }

      .step:last-child { border-bottom: 0; }

      h2 {
        margin: 0 0 10px;
        font-size: 28px;
        line-height: 1.14;
        letter-spacing: 0;
      }

      .copy p { margin: 0; }

      @media (max-width: 820px) {
        .screencast-page { padding: 32px 16px 48px; }
        .hero,
        .step {
          grid-template-columns: 1fr;
        }
        h1 { font-size: 40px; }
      }
    `}</style>
  );
}
