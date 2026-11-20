-- Remove duplicate upvotes, keeping the oldest row per (complaintId, userId)
DELETE FROM "Upvote" a
USING "Upvote" b
WHERE a."complaintId" = b."complaintId"
  AND a."userId" = b."userId"
  AND (a."createdAt", a."id") > (b."createdAt", b."id");

-- CreateIndex
CREATE UNIQUE INDEX "Upvote_complaintId_userId_key" ON "Upvote"("complaintId", "userId");
