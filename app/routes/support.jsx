export const loader = () => null;

export default function Support() {
  return (
    <main className="legal-page">
      <h1>Support</h1>
      <p>
        For help with Deryan Variant Swatches, installation, appearance settings,
        product links, swatch setup, or troubleshooting, contact support by
        email.
      </p>
      <p>
        Email: <a href="mailto:timheezen@gmail.com">timheezen@gmail.com</a>
      </p>
      <p>Typical response time: 2 business days.</p>
      <Style />
    </main>
  );
}

function Style() {
  return (
    <style>{`
      .legal-page { max-width: 760px; margin: 48px auto; padding: 0 20px; color: #111; font-family: system-ui, sans-serif; line-height: 1.6; }
      .legal-page h1 { font-size: 34px; line-height: 1.15; }
      .legal-page a { color: #315d92; }
    `}</style>
  );
}
