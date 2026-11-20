-- Session revocation and login lockout
ALTER TABLE "User" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "failedLogins" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lockedUntil" TIMESTAMP(3);

-- Google sign-ups used to get the role "Citizen Contributor"; every other citizen is "user".
UPDATE "User" SET "role" = 'user' WHERE "role" = 'Citizen Contributor';
