import type { ComplaintStatus } from '@prisma/client';

/**
 * Where a report can go next. One table for the API and both staff desks, so a report can't jump
 * backwards (e.g. Completed → Submitted) or come back from the closed "reviewed" state.
 * Completed → Approved reopens a fix that didn't hold; Rejected → Approved reconsiders a rejection.
 */
export const NEXT_STATUSES: Record<ComplaintStatus, ComplaintStatus[]> = {
    Submitted: ['Approved', 'OnHold', 'Rejected'],
    Approved: ['OnHold', 'Completed', 'Rejected'],
    OnHold: ['Approved', 'Completed', 'Rejected'],
    Completed: ['ResolvedReviewed', 'Approved'],
    Rejected: ['Approved'],
    ResolvedReviewed: [],
};

/** Words staff see in the status pickers. */
export const STATUS_LABEL: Record<ComplaintStatus, string> = {
    Submitted: 'Submitted',
    Approved: 'Approved (task created)',
    OnHold: 'On hold',
    Completed: 'Completed',
    Rejected: 'Rejected',
    ResolvedReviewed: 'Resolved and reviewed',
};

/** Staying put is always allowed (staff may only be editing the remarks). */
export function canMoveStatus(from: ComplaintStatus, to: ComplaintStatus): boolean {
    return from === to || NEXT_STATUSES[from].includes(to);
}

/** The statuses to offer in a picker for a report currently in `from` (itself first). */
export function statusOptions(from: ComplaintStatus): ComplaintStatus[] {
    return [from, ...NEXT_STATUSES[from]];
}
