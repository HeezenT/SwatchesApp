import { useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getDashboardData } from "../models/swatches.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  return getDashboardData(session.shop);
};

export default function Settings() {
  const { groups, swatches, products } = useLoaderData();

  return (
    <s-page heading="Settings">
      <s-section heading="General">
        <div className="ds-settings-grid">
          <aside>
            <h3>Product links</h3>
            <p>Products sharing the same link are shown together as storefront swatches.</p>
          </aside>
          <div className="ds-card">
            <label>
              Default option name
              <input defaultValue="Kleur" readOnly />
            </label>
            <label className="ds-check">
              <input type="checkbox" checked readOnly />
              Enable public product metafields
            </label>
            <p>
              Group data is published under <code>deryan_swatches.group</code> on each product.
            </p>
          </div>
        </div>
      </s-section>

      <s-section heading="Status">
        <div className="ds-card ds-stats">
          <div><strong>{products.length}</strong><span>Synced products</span></div>
          <div><strong>{groups.length}</strong><span>Product links</span></div>
          <div><strong>{swatches.length}</strong><span>Swatches</span></div>
        </div>
      </s-section>

      <Style />
    </s-page>
  );
}

function Style() {
  return (
    <style>{`
      .ds-settings-grid { display: grid; grid-template-columns: 340px minmax(0, 1fr); gap: 28px; align-items: start; }
      .ds-settings-grid aside p { color: #5f6368; line-height: 1.45; }
      .ds-card { background: #fff; border: 1px solid #d9d9d9; border-radius: 12px; padding: 22px; }
      .ds-card label { display: grid; gap: 6px; font-weight: 700; margin-bottom: 18px; }
      .ds-card input[type="text"], .ds-card input:not([type]) { padding: 11px 12px; border: 1px solid #aeb4bd; border-radius: 8px; font: inherit; }
      .ds-check { display: flex !important; grid-template-columns: auto 1fr; align-items: center; gap: 10px !important; }
      .ds-card code { background: #ededed; padding: 2px 5px; border-radius: 4px; }
      .ds-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
      .ds-stats div { display: grid; gap: 4px; }
      .ds-stats strong { font-size: 28px; }
      .ds-stats span { color: #5f6368; }
      @media (max-width: 900px) { .ds-settings-grid, .ds-stats { grid-template-columns: 1fr; } }
    `}</style>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => boundary.headers(headersArgs);
