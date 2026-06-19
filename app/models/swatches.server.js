import prisma from "../db.server";

const PRODUCT_QUERY = `#graphql
  query DeryanProducts($cursor: String) {
    products(first: 100, after: $cursor, sortKey: UPDATED_AT, reverse: true) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        title
        handle
        status
        featuredImage {
          url(transform: { maxWidth: 120, maxHeight: 120 })
        }
        options {
          name
          values
        }
        variants(first: 100) {
          nodes {
            id
            title
            availableForSale
            image {
              url(transform: { maxWidth: 120, maxHeight: 120 })
            }
            selectedOptions {
              name
              value
            }
          }
        }
      }
    }
  }
`;

const SHOP_QUERY = `#graphql
  query DeryanShop {
    shop {
      id
    }
  }
`;

const METAFIELDS_SET = `#graphql
  mutation DeryanMetafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        id
        key
        namespace
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export async function syncProducts(admin, shop) {
  let cursor;
  let count = 0;

  do {
    const response = await admin.graphql(PRODUCT_QUERY, { variables: { cursor } });
    const payload = await response.json();
    const products = payload.data.products;

    for (const product of products.nodes) {
      await prisma.syncedProduct.upsert({
        where: {
          shop_productGid: {
            shop,
            productGid: product.id,
          },
        },
        create: productRecord(shop, product),
        update: productRecord(shop, product),
      });
      count += 1;
    }

    cursor = products.pageInfo.hasNextPage ? products.pageInfo.endCursor : undefined;
  } while (cursor);

  return count;
}

export async function getDashboardData(shop) {
  const [groups, products, swatches, appearance] = await Promise.all([
    prisma.productGroup.findMany({
      where: { shop },
      include: { products: { orderBy: { sortOrder: "asc" } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.syncedProduct.findMany({
      where: { shop },
      orderBy: { title: "asc" },
      take: 250,
    }),
    prisma.swatch.findMany({
      where: { shop },
      orderBy: [{ name: "asc" }, { updatedAt: "desc" }],
    }),
    getAppearance(shop),
  ]);

  return { groups, products, swatches, appearance };
}

export async function getAppearance(shop) {
  return prisma.appearanceSetting.upsert({
    where: { shop },
    create: { shop },
    update: {},
  });
}

export async function createGroupFromForm(admin, shop, formData) {
  const title = String(formData.get("title") || "").trim();
  const optionName = String(formData.get("optionName") || "Kleur").trim();
  const helperText = String(formData.get("helperText") || "").trim();
  const tooltipText = String(formData.get("tooltipText") || "").trim();
  const selectedProductGids = formData.getAll("productGid").map(String);
  const productLines = String(formData.get("products") || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!title || (productLines.length === 0 && selectedProductGids.length === 0)) {
    throw new Response("Title and products are required.", { status: 400 });
  }

  const syncedProducts = await productsForGroupForm(shop, productLines, selectedProductGids);
  const byHandle = new Map(syncedProducts.map((product) => [product.handle, product]));
  const byGid = new Map(syncedProducts.map((product) => [product.productGid, product]));
  const groupProducts = selectedProductGids.length > 0
    ? selectedProductGids.flatMap((productGid, index) => {
        const product = byGid.get(productGid);

        if (!product) return [];

        return {
          productGid: product.productGid,
          handle: product.handle,
          title: product.title,
          imageUrl: product.imageUrl,
          optionValue: String(formData.get(`value-${product.id}`) || "").trim() || inferValue(product.title, title),
          color: normalizeColor(String(formData.get(`color-${product.id}`) || "").trim()),
          swatchType: String(formData.get(`color-${product.id}`) || "").trim() ? "color" : "product",
          sortOrder: index,
        };
      })
    : productLines.flatMap((line, index) => {
        const [handleRaw, valueRaw, colorRaw] = line.split("|");
        const handle = handleRaw?.trim();
        const product = byHandle.get(handle);

        if (!product) return [];

        return {
          productGid: product.productGid,
          handle: product.handle,
          title: product.title,
          imageUrl: product.imageUrl,
          optionValue: valueRaw?.trim() || inferValue(product.title, title),
          color: normalizeColor(colorRaw?.trim()),
          swatchType: colorRaw?.trim() ? "color" : "product",
          sortOrder: index,
        };
      });

  const group = await prisma.productGroup.create({
    data: {
      shop,
      title,
      optionName,
      helperText: helperText || null,
      tooltipText: tooltipText || null,
      type: "manual",
      products: {
        create: groupProducts,
      },
    },
    include: { products: { orderBy: { sortOrder: "asc" } } },
  });

  await publishGroupMetafields(admin, group);

  return group;
}

export async function deleteGroup(admin, shop, id) {
  const group = await prisma.productGroup.findFirst({
    where: { id, shop },
    include: { products: true },
  });

  if (!group) return;

  await clearGroupMetafields(admin, group.products.map((product) => product.productGid));
  await prisma.productGroup.delete({ where: { id } });
}

export async function createSwatch(shop, formData) {
  const name = String(formData.get("name") || "").trim();
  const type = String(formData.get("type") || "color");
  const color = String(formData.get("color") || "").trim();
  const imageUrl = String(formData.get("imageUrl") || "").trim();

  if (!name) throw new Response("Swatch name is required.", { status: 400 });

  return prisma.swatch.create({
    data: {
      shop,
      name,
      type,
      color: color || null,
      imageUrl: imageUrl || null,
    },
  });
}

export async function saveAppearance(shop, formData) {
  return prisma.appearanceSetting.upsert({
    where: { shop },
    create: appearanceFromForm(shop, formData),
    update: appearanceFromForm(shop, formData),
  });
}

export async function publishAppearanceMetafield(admin, appearance) {
  const shopId = await getShopId(admin);

  await metafieldsSet(admin, [
    {
      ownerId: shopId,
      namespace: "deryan_swatches",
      key: "appearance",
      type: "json",
      value: JSON.stringify({
        accentColor: appearance.accentColor,
        borderColor: appearance.borderColor,
        activeBackgroundColor: appearance.activeBackgroundColor,
        inactiveBackgroundColor: appearance.inactiveBackgroundColor,
        textColor: appearance.textColor,
        activeTextColor: appearance.activeTextColor,
        inactiveTextColor: appearance.inactiveTextColor,
        blockHeight: appearance.blockHeight,
        cornerRadius: appearance.cornerRadius,
        headerFontSize: appearance.headerFontSize,
        valueFontSize: appearance.valueFontSize,
        buttonFontSize: appearance.buttonFontSize,
        headerFontWeight: appearance.headerFontWeight,
        valueFontWeight: appearance.valueFontWeight,
        buttonFontWeight: appearance.buttonFontWeight,
      }),
    },
  ]);
}

async function publishGroupMetafields(admin, group) {
  const products = group.products.map((product) => ({
    productId: product.productGid,
    handle: product.handle,
    title: product.title,
    imageUrl: product.imageUrl,
    value: product.optionValue,
    color: product.color,
    swatchType: product.swatchType,
    url: `/products/${product.handle}`,
  }));

  await metafieldsSet(
    admin,
    group.products.map((product) => ({
      ownerId: product.productGid,
      namespace: "deryan_swatches",
      key: "group",
      type: "json",
      value: JSON.stringify({
        id: group.id,
        title: group.title,
        optionName: group.optionName,
        helperText: group.helperText,
        tooltipText: group.tooltipText,
        products,
      }),
    })),
  );
}

async function clearGroupMetafields(admin, productIds) {
  if (productIds.length === 0) return;

  await metafieldsSet(
    admin,
    productIds.map((ownerId) => ({
      ownerId,
      namespace: "deryan_swatches",
      key: "group",
      type: "json",
      value: JSON.stringify(null),
    })),
  );
}

async function getShopId(admin) {
  const response = await admin.graphql(SHOP_QUERY);
  const payload = await response.json();
  return payload.data.shop.id;
}

async function metafieldsSet(admin, metafields) {
  if (metafields.length === 0) return;

  const response = await admin.graphql(METAFIELDS_SET, {
    variables: { metafields },
  });
  const payload = await response.json();
  const errors = payload.data.metafieldsSet.userErrors;

  if (errors.length > 0) {
    throw new Response(errors.map((error) => error.message).join(", "), { status: 400 });
  }
}

function productRecord(shop, product) {
  return {
    shop,
    productGid: product.id,
    handle: product.handle,
    title: product.title,
    status: product.status,
    imageUrl: product.featuredImage?.url || null,
    optionsJson: JSON.stringify(product.options || []),
    variantsJson: JSON.stringify(product.variants?.nodes || []),
    syncedAt: new Date(),
  };
}

async function productsForGroupForm(shop, productLines, selectedProductGids) {
  if (selectedProductGids.length > 0) {
    return prisma.syncedProduct.findMany({
      where: {
        shop,
        productGid: { in: selectedProductGids },
      },
    });
  }

  const handles = productLines.map((line) => line.split("|")[0]?.trim()).filter(Boolean);

  return prisma.syncedProduct.findMany({
    where: {
      shop,
      handle: { in: handles },
    },
  });
}

function inferValue(title, groupTitle) {
  return title.replace(groupTitle, "").replace(/[-–|]/g, " ").trim() || title;
}

function normalizeColor(color) {
  if (!color) return null;
  return color.startsWith("#") ? color : `#${color}`;
}

function appearanceFromForm(shop, formData) {
  return {
    shop,
    accentColor: String(formData.get("accentColor") || "#ff7a2f"),
    borderColor: String(formData.get("borderColor") || "#d5dae2"),
    activeBackgroundColor: String(formData.get("activeBackgroundColor") || "#ffffff"),
    inactiveBackgroundColor: String(formData.get("inactiveBackgroundColor") || "#ffffff"),
    textColor: String(formData.get("textColor") || "#111111"),
    activeTextColor: String(formData.get("activeTextColor") || "#111111"),
    inactiveTextColor: String(formData.get("inactiveTextColor") || "#111111"),
    blockHeight: Number(formData.get("blockHeight") || 108),
    cornerRadius: Number(formData.get("cornerRadius") || 10),
    headerFontSize: Number(formData.get("headerFontSize") || 22),
    valueFontSize: Number(formData.get("valueFontSize") || 22),
    buttonFontSize: Number(formData.get("buttonFontSize") || 20),
    headerFontWeight: Number(formData.get("headerFontWeight") || 800),
    valueFontWeight: Number(formData.get("valueFontWeight") || 800),
    buttonFontWeight: Number(formData.get("buttonFontWeight") || 700),
  };
}
