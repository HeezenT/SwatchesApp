import { Form, useActionData, useLoaderData, useNavigation, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import {
  getDashboardData,
  publishAppearanceMetafield,
  saveAppearance,
} from "../models/swatches.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  return getDashboardData(session.shop);
};

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const appearance = await saveAppearance(session.shop, formData);
  await publishAppearanceMetafield(admin, appearance);
  return { ok: true, message: "Appearance saved." };
};

export default function Appearance() {
  const { appearance } = useLoaderData();
  const action = useActionData();
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";

  return (
    <s-page heading="Appearance">
      <s-section heading="LekkerBikes-style storefront">
        {action?.message ? <p className="ds-notice">{action.message}</p> : null}
        <div className="ds-layout">
          <div className="ds-card ds-form-card">
            <Form method="post">
              <h3>State colors</h3>
              <div className="ds-field-grid">
                <label>
                  Active border
                  <input name="accentColor" type="color" defaultValue={appearance.accentColor} />
                </label>
                <label>
                  Inactive border
                  <input name="borderColor" type="color" defaultValue={appearance.borderColor} />
                </label>
                <label>
                  Active background
                  <input name="activeBackgroundColor" type="color" defaultValue={appearance.activeBackgroundColor} />
                </label>
                <label>
                  Inactive background
                  <input name="inactiveBackgroundColor" type="color" defaultValue={appearance.inactiveBackgroundColor} />
                </label>
                <label>
                  Active text
                  <input name="activeTextColor" type="color" defaultValue={appearance.activeTextColor} />
                </label>
                <label>
                  Inactive text
                  <input name="inactiveTextColor" type="color" defaultValue={appearance.inactiveTextColor} />
                </label>
              </div>

              <h3>Shape and size</h3>
              <div className="ds-field-grid">
                <label>
                  Block height
                  <input name="blockHeight" type="number" min="72" max="150" defaultValue={appearance.blockHeight} />
                </label>
                <label>
                  Border radius
                  <input name="cornerRadius" type="number" min="0" max="24" defaultValue={appearance.cornerRadius} />
                </label>
              </div>

              <h3>Typography</h3>
              <div className="ds-field-grid">
                <label>
                  Header size
                  <input name="headerFontSize" type="number" min="14" max="32" defaultValue={appearance.headerFontSize} />
                </label>
                <label>
                  Header weight
                  <input name="headerFontWeight" type="number" min="400" max="900" step="100" defaultValue={appearance.headerFontWeight} />
                </label>
                <label>
                  Value size
                  <input name="valueFontSize" type="number" min="14" max="32" defaultValue={appearance.valueFontSize} />
                </label>
                <label>
                  Value weight
                  <input name="valueFontWeight" type="number" min="400" max="900" step="100" defaultValue={appearance.valueFontWeight} />
                </label>
                <label>
                  Button text size
                  <input name="buttonFontSize" type="number" min="13" max="28" defaultValue={appearance.buttonFontSize} />
                </label>
                <label>
                  Button text weight
                  <input name="buttonFontWeight" type="number" min="400" max="900" step="100" defaultValue={appearance.buttonFontWeight} />
                </label>
              </div>

              <button className="ds-button ds-button--dark" disabled={busy}>Save appearance</button>
            </Form>
          </div>

          <div
            className="ds-preview"
            style={{
              "--accent": appearance.accentColor,
              "--border": appearance.borderColor,
              "--active-bg": appearance.activeBackgroundColor,
              "--inactive-bg": appearance.inactiveBackgroundColor,
              "--text": appearance.textColor,
              "--active-text": appearance.activeTextColor,
              "--inactive-text": appearance.inactiveTextColor,
              "--height": `${appearance.blockHeight}px`,
              "--radius": `${appearance.cornerRadius}px`,
              "--header-size": `${appearance.headerFontSize}px`,
              "--value-size": `${appearance.valueFontSize}px`,
              "--button-size": `${appearance.buttonFontSize}px`,
              "--header-weight": appearance.headerFontWeight,
              "--value-weight": appearance.valueFontWeight,
              "--button-weight": appearance.buttonFontWeight,
            }}
          >
            <div className="ds-preview-head">
              <strong>Kleur</strong>
              <strong>Zwart</strong>
            </div>
            <div className="ds-preview-grid">
              <div className="ds-preview-button ds-preview-button--active">
                <span className="ds-preview-dot ds-preview-dot--dark">✓</span>
              </div>
              <div className="ds-preview-button">
                <span className="ds-preview-dot" />
              </div>
            </div>
            <div className="ds-preview-head">
              <strong>Maat</strong>
              <strong>Voor fietsers 165-182 cm</strong>
            </div>
            <div className="ds-preview-grid">
              <div className="ds-preview-button ds-preview-button--active">56cm</div>
              <div className="ds-preview-button">60cm</div>
            </div>
          </div>
        </div>
      </s-section>
      <Style />
    </s-page>
  );
}

function Style() {
  return (
    <style>{`
      .ds-layout { display: grid; grid-template-columns: 380px minmax(0, 1fr); gap: 22px; align-items: start; }
      .ds-card { background: #fff; border: 1px solid #d9d9d9; border-radius: 12px; overflow: hidden; }
      .ds-form-card { padding: 18px; }
      .ds-form-card form { display: grid; gap: 16px; }
      .ds-form-card h3 { margin: 2px 0 -2px; font-size: 15px; }
      .ds-field-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
      .ds-form-card label { display: grid; gap: 6px; font-weight: 700; }
      .ds-form-card input { padding: 10px 12px; border: 1px solid #aeb4bd; border-radius: 8px; font: inherit; }
      .ds-button { border: 1px solid #cfd4dc; background: #fff; border-radius: 8px; padding: 10px 14px; color: #303030; font: inherit; cursor: pointer; }
      .ds-button--dark { background: #303030; color: #fff; border-color: #1f1f1f; }
      .ds-preview { border-top: 1px solid #d7d7d7; padding-top: 22px; color: var(--text); }
      .ds-preview-head { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; line-height: 1.1; margin: 0 0 14px; }
      .ds-preview-head strong:first-child { font-size: var(--header-size); font-weight: var(--header-weight); }
      .ds-preview-head strong:last-child { font-size: var(--value-size); font-weight: var(--value-weight); text-align: right; }
      .ds-preview-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px 24px; margin-bottom: 22px; }
      .ds-preview-button { min-height: var(--height); border: 1.5px solid var(--border); border-radius: var(--radius); display: flex; align-items: center; justify-content: center; font-size: var(--button-size); font-weight: var(--button-weight); background: var(--inactive-bg); color: var(--inactive-text); }
      .ds-preview-button--active { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); background: var(--active-bg); color: var(--active-text); }
      .ds-preview-dot { width: 52px; height: 52px; border-radius: 50%; background: #cfcfcd; border: 1px solid #bdbdbd; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 30px; line-height: 1; }
      .ds-preview-dot--dark { background: #333; }
      .ds-notice { color: #5f6368; }
      @media (max-width: 900px) { .ds-layout, .ds-field-grid { grid-template-columns: 1fr; } }
    `}</style>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => boundary.headers(headersArgs);
