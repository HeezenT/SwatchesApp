export const loader = () => null;

export default function Terms() {
  return (
    <main className="legal-page">
      <h1>Terms of Service</h1>
      <p>
        Deryan Variant Swatches is a Shopify app for creating and displaying
        premium storefront product swatches and product links.
      </p>
      <p>
        Merchants are responsible for the swatch content, product data, colors,
        helper text, and theme placement they configure in the app.
      </p>
      <p>
        The app is provided for use with Shopify stores and may be updated to
        improve reliability, compatibility, and compliance with Shopify platform
        requirements.
      </p>
      <p>Contact: timheezen@gmail.com</p>
      <Style />
    </main>
  );
}

function Style() {
  return (
    <style>{`
      .legal-page { max-width: 760px; margin: 48px auto; padding: 0 20px; color: #111; font-family: system-ui, sans-serif; line-height: 1.6; }
      .legal-page h1 { font-size: 34px; line-height: 1.15; }
    `}</style>
  );
}
