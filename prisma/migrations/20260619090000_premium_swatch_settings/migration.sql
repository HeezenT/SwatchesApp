-- AlterTable
ALTER TABLE "ProductGroup" ADD COLUMN "helperText" TEXT;
ALTER TABLE "ProductGroup" ADD COLUMN "tooltipText" TEXT;

-- AlterTable
ALTER TABLE "AppearanceSetting" ADD COLUMN "activeBackgroundColor" TEXT NOT NULL DEFAULT '#ffffff';
ALTER TABLE "AppearanceSetting" ADD COLUMN "inactiveBackgroundColor" TEXT NOT NULL DEFAULT '#ffffff';
ALTER TABLE "AppearanceSetting" ADD COLUMN "activeTextColor" TEXT NOT NULL DEFAULT '#111111';
ALTER TABLE "AppearanceSetting" ADD COLUMN "inactiveTextColor" TEXT NOT NULL DEFAULT '#111111';
ALTER TABLE "AppearanceSetting" ADD COLUMN "headerFontSize" INTEGER NOT NULL DEFAULT 22;
ALTER TABLE "AppearanceSetting" ADD COLUMN "valueFontSize" INTEGER NOT NULL DEFAULT 22;
ALTER TABLE "AppearanceSetting" ADD COLUMN "buttonFontSize" INTEGER NOT NULL DEFAULT 20;
ALTER TABLE "AppearanceSetting" ADD COLUMN "headerFontWeight" INTEGER NOT NULL DEFAULT 800;
ALTER TABLE "AppearanceSetting" ADD COLUMN "valueFontWeight" INTEGER NOT NULL DEFAULT 800;
ALTER TABLE "AppearanceSetting" ADD COLUMN "buttonFontWeight" INTEGER NOT NULL DEFAULT 700;
