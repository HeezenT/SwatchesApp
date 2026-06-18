import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { useEffect, useState } from "react";
import { Form, useActionData, useLoaderData } from "react-router";
import { login } from "../../shopify.server";
import { loginErrorMessage } from "./error.server";

async function loginWithoutIframeRedirect(request) {
  try {
    const errors = loginErrorMessage(await login(request));
    return { errors };
  } catch (error) {
    if (error instanceof Response && error.status >= 300 && error.status < 400) {
      const redirectTo = error.headers.get("Location");

      if (redirectTo) {
        return { redirectTo };
      }
    }

    throw error;
  }
}

export const loader = async ({ request }) => {
  return loginWithoutIframeRedirect(request);
};

export const action = async ({ request }) => {
  return loginWithoutIframeRedirect(request);
};

export default function Auth() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const [shop, setShop] = useState("");
  const { errors = {}, redirectTo } = actionData || loaderData;

  useEffect(() => {
    if (!redirectTo) return;

    try {
      window.top.location.assign(redirectTo);
    } catch {
      window.location.assign(redirectTo);
    }
  }, [redirectTo]);

  return (
    <AppProvider embedded={false}>
      <s-page>
        {redirectTo ? (
          <s-section heading="Opening Shopify">
            <s-text>
              Shopify needs to finish this login outside the embedded app frame.
            </s-text>
            <s-button href={redirectTo} target="_top">
              Continue
            </s-button>
          </s-section>
        ) : (
          <Form method="post">
            <s-section heading="Log in">
              <s-text-field
                name="shop"
                label="Shop domain"
                details="example.myshopify.com"
                value={shop}
                onChange={(e) => setShop(e.currentTarget.value)}
                autocomplete="on"
                error={errors.shop}
              ></s-text-field>
              <s-button type="submit">Log in</s-button>
            </s-section>
          </Form>
        )}
      </s-page>
    </AppProvider>
  );
}
