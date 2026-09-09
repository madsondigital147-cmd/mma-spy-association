-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "niche" TEXT NOT NULL,
    "markets" TEXT NOT NULL,
    "keywords" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastRunAt" TIMESTAMP(3),

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Run" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'running',
    "rawCount" INTEGER NOT NULL DEFAULT 0,
    "creativeCount" INTEGER NOT NULL DEFAULT 0,
    "candidateCount" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,

    CONSTRAINT "Run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MinedAd" (
    "id" TEXT NOT NULL,
    "adArchiveId" TEXT NOT NULL,
    "sourceId" TEXT,
    "pageId" TEXT NOT NULL,
    "pageName" TEXT NOT NULL,
    "body" TEXT,
    "linkTitle" TEXT,
    "linkCaption" TEXT,
    "linkUrl" TEXT,
    "ctaText" TEXT,
    "countries" TEXT NOT NULL DEFAULT '',
    "platforms" TEXT NOT NULL DEFAULT '',
    "deliveryStart" TIMESTAMP(3),
    "deliveryStop" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "snapshotUrl" TEXT,
    "mediaUrl" TEXT,
    "mediaType" TEXT,
    "mediaHash" TEXT,
    "euReach" INTEGER,
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creativeId" TEXT,

    CONSTRAINT "MinedAd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MinedCreative" (
    "id" TEXT NOT NULL,
    "mediaHash" TEXT NOT NULL,
    "mediaType" TEXT,
    "sampleMedia" TEXT,
    "sampleBody" TEXT,
    "adCount" INTEGER NOT NULL DEFAULT 0,
    "pageCount" INTEGER NOT NULL DEFAULT 0,
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "offerId" TEXT,

    CONSTRAINT "MinedCreative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT,
    "title" TEXT NOT NULL,
    "advertiser" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "niche" TEXT,
    "markets" TEXT NOT NULL DEFAULT '',
    "landingUrl" TEXT,
    "gateway" TEXT,
    "funnelType" TEXT,
    "language" TEXT,
    "adCount" INTEGER NOT NULL DEFAULT 0,
    "pageCount" INTEGER NOT NULL DEFAULT 0,
    "pageAdCount" INTEGER NOT NULL DEFAULT 0,
    "daysActive" INTEGER NOT NULL DEFAULT 0,
    "trend" TEXT NOT NULL DEFAULT 'new',
    "arbitrage" BOOLEAN NOT NULL DEFAULT false,
    "score" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'new',
    "verdict" TEXT,
    "verdictAngle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferSnapshot" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adCount" INTEGER NOT NULL,
    "pageAdCount" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL,
    "landingUrl" TEXT,
    "priceSeen" TEXT,

    CONSTRAINT "OfferSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferTest" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "angle" TEXT,
    "status" TEXT NOT NULL DEFAULT 'running',
    "note" TEXT,
    "roas" DOUBLE PRECISION,
    "profitCents" INTEGER,

    CONSTRAINT "OfferTest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MinedAd_adArchiveId_key" ON "MinedAd"("adArchiveId");

-- CreateIndex
CREATE INDEX "MinedAd_creativeId_idx" ON "MinedAd"("creativeId");

-- CreateIndex
CREATE INDEX "MinedAd_pageId_idx" ON "MinedAd"("pageId");

-- CreateIndex
CREATE UNIQUE INDEX "MinedCreative_mediaHash_key" ON "MinedCreative"("mediaHash");

-- CreateIndex
CREATE INDEX "MinedCreative_offerId_idx" ON "MinedCreative"("offerId");

-- CreateIndex
CREATE INDEX "Offer_status_score_idx" ON "Offer"("status", "score");

-- CreateIndex
CREATE UNIQUE INDEX "Offer_pageId_title_key" ON "Offer"("pageId", "title");

-- AddForeignKey
ALTER TABLE "Run" ADD CONSTRAINT "Run_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MinedAd" ADD CONSTRAINT "MinedAd_creativeId_fkey" FOREIGN KEY ("creativeId") REFERENCES "MinedCreative"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MinedCreative" ADD CONSTRAINT "MinedCreative_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferSnapshot" ADD CONSTRAINT "OfferSnapshot_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferTest" ADD CONSTRAINT "OfferTest_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
