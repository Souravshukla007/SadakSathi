-- Chats about citizen traffic reports belong to the traffic desk (src/app/api/chat/route.ts now creates
-- them there). Move threads created before that change; the list matches TRAFFIC_ISSUE_TYPES in src/lib/traffic.ts.
UPDATE "ChatThread" AS t
SET "department" = 'traffic'
FROM "Complaint" AS c
WHERE t."complaintId" = c."id"
  AND t."department" = 'municipal'
  AND c."issueType" IN ('No Helmet', 'Triple Riding', 'Wrong Side Driving', 'Signal Jumping');
