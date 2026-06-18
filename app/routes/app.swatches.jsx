import { Form, useActionData, useLoaderData, useNavigation, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { createSwatch, getDashboardData } from "../models/swatches.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  return getDashboardData(session.shop);
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  await createSwatch(session.shop, formData);
  return { ok: true, message: "Swatch created." };
};

export default function Swatches() {
  const { swatches, groups } = useLoaderData();
  const action = useActionData();
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";

  return (
    <s-page heading="Variant swatches">
      <s-section>
        <div className="ds-toolbar">
          <a className="ds-button" href="/app/product-groups">Product links</a>
          <a className="ds-button ds-button--dark" href="#create-swatch">Create swatch</a>
        </div>

        {action?.message ? <p className="ds-notice">{action.message}</p> : null}

        <div className="ds-card">
          <div className="ds-filter-row">
            <input className="ds-search" placeholder="Filter content" />
            <select defaultValue="">
              <option value="">Any usage</option>
              <option>Used</option>
              <option>Not used</option>
            </select>
            <select defaultValue="">
              <option value="">Any name</option>
              <option>Kleur</option>
              <option>Compleet</option>
            </select>
          </div>
          <table className="ds-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Used in</th>
              </tr>
            </thead>
            <tbody>
              {swatches.map((swatch) => (
                <tr key={swatch.id}>
                  <td>
                    <div className="ds-title-cell">
                      <span
                        className="ds-swatch-preview"
                        style={{
                          background: swatch.type === "image" && swatch.imageUrl
                            ? `url(${swatch.imageUrl}) center/cover`
                            : swatch.color || "#e4ddd4",
                        }}
                      />
                      <strong>{swatch.name}</strong>
                    </div>
                  </td>
                  <td>{swatch.type === "image" ? "Custom image" : "One color"}</td>
                  <td>{swatch.usedIn || "Not used"}</td>
                </tr>
              ))}
              {swatches.length === 0 ? (
                <tr>
                  <td colSpan="3"><div className="ds-empty">Create reusable colors or image swatches here.</div></td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </s-section>

      <s-section heading="Create swatch">
        <div className="ds-card ds-form-card" id="create-swatch">
          <Form method="post">
            <label>
              Name
              <input name="name" placeholder="Zwart" required />
            </label>
            <label>
              Type
              <select name="type" defaultValue="color">
                <option value="color">One color</option>
                <option value="image">Custom image</option>
              </select>
            </label>
            <label>
              Color
              <input name="color" placeholder="#111111" />
            </label>
            <label>
              Image URL
              <input name="imageUrl" placeholder="https://..." />
            </label>
            <p className="ds-help">Product links currently configured: {groups.length}.</p>
            <button className="ds-button ds-button--dark" disabled={busy}>Create swatch</button>
          </Form>
        </div>
      </s-section>
      <Style />
    </s-page>
  );
}

function Style() {
  return (
    <style>{`
      .ds-toolbar { display: flex; justify-content: flex-end; gap: 10px; margin-bottom: 18px; }
      .ds-button { appearance: none; border: 1px solid #cfd4dc; background: #fff; border-radius: 8px; padding: 9px 14px; color: #303030; font: inherit; text-decoration: none; cursor: pointer; }
      .ds-button--dark { background: #303030; color: #fff; border-color: #1f1f1f; }
      .ds-card { background: #fff; border: 1px solid #d9d9d9; border-radius: 12px; overflow: hidden; }
      .ds-filter-row { display: grid; grid-template-columns: 1fr 132px 132px; gap: 10px; padding: 18px; }
      .ds-search, .ds-filter-row select { padding: 11px 12px; border: 1px solid #aeb4bd; border-radius: 8px; font: inherit; }
      .ds-table { width: 100%; border-collapse: collapse; }
      .ds-table th, .ds-table td { padding: 14px 18px; border-top: 1px solid #e6e6e6; text-align: left; }
      .ds-title-cell { display: flex; align-items: center; gap: 14px; }
      .ds-swatch-preview { width: 32px; height: 32px; border-radius: 6px; border: 1px solid #d7d7d7; }
      .ds-form-card { padding: 18px; max-width: 760px; }
      .ds-form-card form { display: grid; gap: 14px; }
      .ds-form-card label { display: grid; gap: 6px; font-weight: 700; }
      .ds-form-card input, .ds-form-card select { padding: 11px 12px; border: 1px solid #aeb4bd; border-radius: 8px; font: inherit; }
      .ds-help, .ds-notice, .ds-empty { color: #5f6368; }
      .ds-empty { padding: 28px; text-align: center; }
    `}</style>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => boundary.headers(headersArgs);
