import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// One points rule for the leaderboard and the profile rank:
// 10 per original report (duplicates and rejected reports earn nothing) + 5 per upvote *received* from someone else.
// Ties: earlier account first, then id, so both places always agree on a position.
const POINTS = Prisma.sql`
    SELECT u.id, u."fullName", u.role, u."createdAt",
           (u."profileImageUrl" IS NOT NULL) AS "hasAvatar",
           COALESCE(c.n, 0)::int AS reports,
           COALESCE(v.n, 0)::int AS upvotes,
           (COALESCE(c.n, 0) * 10 + COALESCE(v.n, 0) * 5)::int AS points
    FROM "User" u
    LEFT JOIN (SELECT "userId", COUNT(*) AS n FROM "Complaint" WHERE NOT "isDuplicate" AND status <> 'Rejected' GROUP BY "userId") c ON c."userId" = u.id
    LEFT JOIN (SELECT cp."userId", COUNT(*) AS n FROM "Upvote" up JOIN "Complaint" cp ON cp.id = up."complaintId" WHERE up."userId" <> cp."userId" GROUP BY cp."userId") v ON v."userId" = u.id
    WHERE u.role = 'user'`; // citizens only: staff and admin accounts don't compete

export type LeaderboardRow = {
    id: string; fullName: string; role: string;
    hasAvatar: boolean; reports: number; upvotes: number; points: number;
};

export async function topContributors(limit = 50): Promise<LeaderboardRow[]> {
    return prisma.$queryRaw<LeaderboardRow[]>`
        SELECT id, "fullName", role, "hasAvatar", reports, upvotes, points
        FROM (${POINTS}) p ORDER BY points DESC, "createdAt" ASC, id ASC LIMIT ${limit}`;
}

/** The user's leaderboard position and points; rank 0 means no points yet (unranked). */
export async function rankOf(userId: string): Promise<{ rank: number; points: number; upvotes: number }> {
    const rows = await prisma.$queryRaw<{ rank: number; points: number; upvotes: number }[]>`
        WITH p AS (${POINTS}), me AS (SELECT * FROM p WHERE id = ${userId})
        SELECT (SELECT COUNT(*) FROM p WHERE p.points > me.points
                   OR (p.points = me.points AND (p."createdAt" < me."createdAt" OR (p."createdAt" = me."createdAt" AND p.id < me.id))))::int + 1 AS rank,
               me.points, me.upvotes
        FROM me`;
    const me = rows[0];
    if (!me) return { rank: 0, points: 0, upvotes: 0 };
    return { rank: me.points > 0 ? me.rank : 0, points: me.points, upvotes: me.upvotes };
}
