import { Form, useActionData, useLoaderData, useNavigation, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import {
  createGroupFromForm,
  deleteGroup,
  getDashboardData,
  syncProducts,
} from "../models/swatches.server";

const COLOR_PRESETS = [
  ["Black", "#111111"],
  ["Graphite", "#3b3b3b"],
  ["Grey", "#c9c9c7"],
  ["Sand", "#e7dccc"],
  ["Taupe", "#b8aea2"],
  ["Cream", "#f4efe7"],
  ["Olive", "#68745a"],
  ["Navy", "#1f3558"],
  ["Sky", "#b8c8d9"],
  ["Blush", "#dfb7ad"],
  ["Terracotta", "#bb6b4c"],
  ["White", "#ffffff"],
];

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  return getDashboardData(session.shop);
};

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "sync") {
    const count = await syncProducts(admin, session.shop);
    return { ok: true, message: `${count} products synced.` };
  }

  if (intent === "delete") {
    await deleteGroup(admin, session.shop, String(formData.get("id")));
    return { ok: true, message: "Product group deleted." };
  }

  await createGroupFromForm(admin, session.shop, formData);
  return { ok: true, message: "Product group created and synced to product metafields." };
};

export default function ProductGroups() {
  const { groups, products } = useLoaderData();
  const action = useActionData();
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";

  return (
    <s-page heading="Product links">
      <s-section>
        {action?.message ? <p className="ds-notice">{action.message}</p> : null}

        <div className="ds-hero">
          <div>
            <p className="ds-kicker">Storefront color switches</p>
            <h2>Link products that are the same item in different colors.</h2>
            <p>
              Pick the products, choose a swatch color, and publish. The app writes
              the swatch group to each product automatically.
            </p>
          </div>
          <Form method="post">
            <input type="hidden" name="intent" value="sync" />
            <button className="ds-button ds-button--dark" disabled={busy}>
              {busy ? "Syncing..." : "Sync products"}
            </button>
          </Form>
        </div>

        <div className="ds-steps" aria-label="Workflow">
          <div><strong>1</strong><span>Sync Shopify products</span></div>
          <div><strong>2</strong><span>Select matching products</span></div>
          <div><strong>3</strong><span>Click color presets</span></div>
          <div><strong>4</strong><span>Create link group</span></div>
        </div>
      </s-section>

      <s-section heading="Create product link">
        <div className="ds-card ds-create-card" id="create-group">
          <Form method="post">
            <div className="ds-form-grid">
              <label>
                Group name
                <input name="title" placeholder="Easy Buggy colors" required />
              </label>
              <label>
                Storefront option label
                <input name="optionName" defaultValue="Kleur" required />
              </label>
            </div>

            <div className="ds-preset-reference">
              <span>Color presets</span>
              <div>
                {COLOR_PRESETS.map(([name, color]) => (
                  <span className="ds-reference-chip" key={name}>
                    <i style={{ background: color }} />
                    {name}
                  </span>
                ))}
              </div>
            </div>

            <div className="ds-product-list">
              {products.slice(0, 80).map((product) => (
                <article className="ds-product-card" key={product.id}>
                  <label className="ds-product-main">
                    <input name="productGid" type="checkbox" value={product.productGid} />
                    {product.imageUrl ? <img alt="" src={product.imageUrl} /> : <span className="ds-thumb" />}
                    <span>
                      <strong>{product.title}</strong>
                      <small>{product.handle}</small>
                    </span>
                  </label>

                  <div className="ds-product-details">
                    <label>
                      Swatch label
                      <input name={`value-${product.id}`} placeholder="Auto, or type Zwart" />
                    </label>
                    <fieldset>
                      <legend>Swatch color</legend>
                      <label className="ds-use-image">
                        <input name={`color-${product.id}`} type="radio" value="" defaultChecked />
                        Product image
                      </label>
                      <div className="ds-color-grid">
                        {COLOR_PRESETS.map(([name, color]) => (
                          <label className="ds-color-choice" title={name} key={name}>
                            <input name={`color-${product.id}`} type="radio" value={color} />
                            <span style={{ background: color }} />
                            <em>{name}</em>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  </div>
                </article>
              ))}
              {products.length === 0 ? (
                <div className="ds-empty">
                  Sync products first. Then you can create links by clicking the products and choosing preset colors.
                </div>
              ) : null}
            </div>

            <details className="ds-advanced">
              <summary>Advanced manual entry</summary>
              <textarea
                name="products"
                rows="4"
                placeholder={"product-handle|Zwart|#111111\nproduct-handle-sand|Sand|#e8ddcf"}
              />
            </details>

            <div className="ds-submit-row">
              <p>{products.length} synced products available.</p>
              <button className="ds-button ds-button--dark" disabled={busy}>
                {busy ? "Creating..." : "Create and publish"}
              </button>
            </div>
          </Form>
        </div>
      </s-section>

      <s-section heading="Existing links">
        <div className="ds-card">
          <div className="ds-list-header">
            <div>
              <strong>{groups.length} product links</strong>
              <p>Each link creates one swatch selector on the storefront.</p>
            </div>
            <a className="ds-button" href="#create-group">New link</a>
          </div>
          <table className="ds-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Option name</th>
                <th>Products</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr key={group.id}>
                  <td>
                    <div className="ds-title-cell">
                      {group.products[0]?.imageUrl ? (
                        <img alt="" src={group.products[0].imageUrl} />
                      ) : (
                        <span className="ds-thumb" />
                      )}
                      <strong>{group.title}</strong>
                    </div>
                  </td>
                  <td>{group.type === "manual" ? "Manual" : "Automated"}</td>
                  <td>{group.optionName}</td>
                  <td>{group.products.length} products</td>
                  <td>
                    <span className="ds-status">Synced</span>
                  </td>
                  <td>
                    <Form method="post">
                      <input type="hidden" name="intent" value="delete" />
                      <input type="hidden" name="id" value={group.id} />
                      <button className="ds-small-button" disabled={busy}>Delete</button>
                    </Form>
                  </td>
                </tr>
              ))}
              {groups.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className="ds-empty">
                      No product links yet. Create your first link above.
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </s-section>

      <Style />
    </s-page>
  );
}

function Style() {
  return (
    <style>{`
      .ds-button, .ds-small-button { appearance: none; border: 1px solid #cfd4dc; background: #fff; border-radius: 8px; padding: 9px 14px; color: #303030; font: inherit; text-decoration: none; cursor: pointer; }
      .ds-button--dark { background: #303030; color: #fff; border-color: #1f1f1f; box-shadow: inset 0 0 0 1px rgba(255,255,255,.18); }
      .ds-hero { display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; padding: 22px; background: #fff; border: 1px solid #d9d9d9; border-radius: 12px; }
      .ds-hero h2 { margin: 0 0 8px; font-size: 22px; line-height: 1.2; }
      .ds-hero p { margin: 0; color: #5f6368; max-width: 720px; line-height: 1.45; }
      .ds-kicker { margin: 0 0 8px !important; color: #7c5b38 !important; font-weight: 700; text-transform: uppercase; font-size: 12px; }
      .ds-steps { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-top: 12px; }
      .ds-steps div { display: flex; align-items: center; gap: 10px; padding: 12px; background: #f7f7f7; border-radius: 8px; color: #4f565e; }
      .ds-steps strong { display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; background: #303030; color: #fff; font-size: 13px; flex: 0 0 auto; }
      .ds-card { background: #fff; border: 1px solid #d9d9d9; border-radius: 12px; overflow: hidden; }
      .ds-create-card { padding: 18px; }
      .ds-create-card form { display: grid; gap: 18px; }
      .ds-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
      .ds-create-card label { display: grid; gap: 6px; font-weight: 700; }
      .ds-create-card input, .ds-create-card textarea { padding: 11px 12px; border: 1px solid #aeb4bd; border-radius: 8px; font: inherit; }
      .ds-preset-reference { display: grid; gap: 8px; }
      .ds-preset-reference > span { font-weight: 700; }
      .ds-preset-reference > div { display: flex; flex-wrap: wrap; gap: 8px; }
      .ds-reference-chip { display: inline-flex; align-items: center; gap: 7px; padding: 6px 10px; border: 1px solid #d8dce2; border-radius: 999px; color: #42474d; background: #fafafa; }
      .ds-reference-chip i { width: 16px; height: 16px; border: 1px solid #c7ccd3; border-radius: 50%; }
      .ds-product-list { display: grid; gap: 10px; max-height: 660px; overflow: auto; padding-right: 4px; }
      .ds-product-card { display: grid; grid-template-columns: minmax(260px, .9fr) minmax(360px, 1.1fr); gap: 16px; align-items: start; padding: 14px; border: 1px solid #e3e6ea; border-radius: 8px; background: #fff; }
      .ds-product-main { display: grid !important; grid-template-columns: auto 54px 1fr; align-items: center; gap: 10px !important; margin: 0; font-weight: 400 !important; }
      .ds-product-main img, .ds-thumb { width: 54px; height: 54px; border-radius: 8px; border: 1px solid #ddd; object-fit: cover; background: #f2f2f2; }
      .ds-product-main span { display: grid; gap: 3px; }
      .ds-product-main small { color: #6a6f76; font-weight: 400; }
      .ds-product-details { display: grid; grid-template-columns: minmax(150px, 210px) 1fr; gap: 12px; }
      .ds-product-details fieldset { min-width: 0; margin: 0; padding: 0; border: 0; display: grid; gap: 8px; }
      .ds-product-details legend { padding: 0; font-weight: 700; }
      .ds-use-image { display: inline-flex !important; grid-auto-flow: column; width: max-content; align-items: center; gap: 6px !important; color: #4f565e; font-weight: 600 !important; }
      .ds-color-grid { display: flex; flex-wrap: wrap; gap: 7px; }
      .ds-color-choice { display: block !important; cursor: pointer; }
      .ds-color-choice input { position: absolute; opacity: 0; pointer-events: none; }
      .ds-color-choice span { display: block; width: 30px; height: 30px; border-radius: 50%; border: 1px solid #c8ced6; box-shadow: inset 0 0 0 2px #fff; }
      .ds-color-choice em { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
      .ds-color-choice input:checked + span { outline: 2px solid #303030; outline-offset: 2px; }
      .ds-advanced { border-top: 1px solid #edf0f2; padding-top: 14px; }
      .ds-advanced summary { cursor: pointer; font-weight: 700; }
      .ds-advanced textarea { margin-top: 10px; width: 100%; box-sizing: border-box; }
      .ds-submit-row, .ds-list-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
      .ds-submit-row p, .ds-list-header p { margin: 4px 0 0; color: #5f6368; }
      .ds-list-header { padding: 16px 18px; border-bottom: 1px solid #e6e6e6; }
      .ds-table { width: 100%; border-collapse: collapse; }
      .ds-table th, .ds-table td { padding: 14px 18px; border-top: 1px solid #e6e6e6; text-align: left; }
      .ds-table thead th { border-top: 0; }
      .ds-title-cell { display: flex; align-items: center; gap: 14px; }
      .ds-title-cell img { width: 48px; height: 48px; border-radius: 8px; border: 1px solid #ddd; object-fit: cover; background: #f2f2f2; }
      .ds-status { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 999px; background: #bff4d3; color: #154c2f; }
      .ds-status::before { content: ""; width: 9px; height: 9px; border-radius: 50%; background: #168a57; }
      .ds-notice, .ds-empty { color: #5f6368; }
      .ds-notice { margin: 0 0 14px; }
      .ds-empty { padding: 28px; text-align: center; }
      @media (max-width: 900px) {
        .ds-hero, .ds-submit-row, .ds-list-header { flex-direction: column; align-items: stretch; }
        .ds-steps, .ds-form-grid, .ds-product-card, .ds-product-details { grid-template-columns: 1fr; }
      }
    `}</style>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => boundary.headers(headersArgs);
