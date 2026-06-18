-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,
    "refreshToken" TEXT,
    "refreshTokenExpires" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncedProduct" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "productGid" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "imageUrl" TEXT,
    "optionsJson" TEXT NOT NULL DEFAULT '[]',
    "variantsJson" TEXT NOT NULL DEFAULT '[]',
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncedProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductGroup" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'manual',
    "optionName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'synced',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupProduct" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "productGid" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT,
    "optionValue" TEXT NOT NULL,
    "color" TEXT,
    "swatchType" TEXT NOT NULL DEFAULT 'color',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GroupProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Swatch" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'color',
    "color" TEXT,
    "imageUrl" TEXT,
    "usedIn" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Swatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppearanceSetting" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "accentColor" TEXT NOT NULL DEFAULT '#ff7a2f',
    "borderColor" TEXT NOT NULL DEFAULT '#d5dae2',
    "textColor" TEXT NOT NULL DEFAULT '#111111',
    "blockHeight" INTEGER NOT NULL DEFAULT 108,
    "cornerRadius" INTEGER NOT NULL DEFAULT 10,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppearanceSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SyncedProduct_shop_productGid_key" ON "SyncedProduct"("shop", "productGid");

-- CreateIndex
CREATE INDEX "SyncedProduct_shop_handle_idx" ON "SyncedProduct"("shop", "handle");

-- CreateIndex
CREATE INDEX "ProductGroup_shop_idx" ON "ProductGroup"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "GroupProduct_groupId_productGid_key" ON "GroupProduct"("groupId", "productGid");

-- CreateIndex
CREATE INDEX "Swatch_shop_name_idx" ON "Swatch"("shop", "name");

-- CreateIndex
CREATE UNIQUE INDEX "AppearanceSetting_shop_key" ON "AppearanceSetting"("shop");

-- AddForeignKey
ALTER TABLE "GroupProduct" ADD CONSTRAINT "GroupProduct_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ProductGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
