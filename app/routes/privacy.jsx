export const loader = () => null;

export default function Privacy() {
  return (
    <main className="legal-page">
      <h1>Privacy Policy</h1>
      <p>
        Deryan Variant Swatches stores Shopify shop session data, synced product
        identifiers, product handles, titles, image URLs, swatch settings, and
        appearance settings needed to render and manage product swatches.
      </p>
      <p>
        The app does not require protected customer data and does not sell
        personal data. Shopify compliance webhooks are implemented for customer
        data requests, customer redaction requests, and shop redaction requests.
      </p>
      <p>
        When a shop redaction request is received, shop-specific sessions,
        synced products, product links, swatches, and appearance settings are
        deleted from the app database.
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
