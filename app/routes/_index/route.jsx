import { redirect, useLoaderData } from "react-router";

const DEV_STORE = "heezen-c6bzl5ce";

function shopifyAdminAppUrl(shop) {
  const cleanShop = shop
    ?.replace(/^https?:\/\//, "")
    .replace(/\/$/, "")
    .replace(".myshopify.com", "");

  return `https://admin.shopify.com/store/${cleanShop || DEV_STORE}/apps/deryan-variant-swatches/app/product-groups`;
}

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (shop && url.searchParams.get("host")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return {
    adminUrl: shopifyAdminAppUrl(shop),
  };
};

export default function App() {
  const { adminUrl } = useLoaderData();

  return (
    <main style={{ fontFamily: "Inter, sans-serif", padding: "3rem" }}>
      <h1>Deryan Variant Swatches</h1>
      <p>
        Open this embedded app from Shopify Admin so Shopify can provide a
        session token. No third-party cookies are required.
      </p>
      <p>
        <a href={adminUrl} target="_top">
          Open in Shopify Admin
        </a>
      </p>
    </main>
  );
}
