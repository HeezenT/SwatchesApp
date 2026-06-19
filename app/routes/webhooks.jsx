import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  const { shop, topic } = await authenticate.webhook(request);
  const normalizedTopic = String(topic).toLowerCase().replaceAll("_", "/");

  if (normalizedTopic === "shop/redact") {
    await Promise.all([
      db.session.deleteMany({ where: { shop } }),
      db.syncedProduct.deleteMany({ where: { shop } }),
      db.productGroup.deleteMany({ where: { shop } }),
      db.swatch.deleteMany({ where: { shop } }),
      db.appearanceSetting.deleteMany({ where: { shop } }),
    ]);
  }

  return new Response(null, { status: 200 });
};
