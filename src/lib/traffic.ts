/** Citizen complaint types that belong to the traffic desk rather than the municipal desk. */
export const TRAFFIC_ISSUE_TYPES = ['No Helmet', 'Triple Riding', 'Wrong Side Driving', 'Signal Jumping'];

type Box = { x1: number; y1: number; x2: number; y2: number };
/** One object from a traffic scan (photo detection or tracked video violation). */
export type ScanDetection = { class_name: string; confidence: number; plate_text?: string | null; bbox?: Box };

const centre = (b: Box) => [(b.x1 + b.x2) / 2, (b.y1 + b.y2) / 2];

/**
 * The plate for a violation. The model finds plates as separate objects, so: a plate read on the same
 * tracked vehicle (video), else the only plate in the scan, else the plate whose box is closest to the
 * violation in the same photo. A best guess for the officer to confirm, never proof on its own.
 */
export function plateFor(v: ScanDetection, plates: ScanDetection[]): string | null {
    if (v.plate_text) return v.plate_text;
    if (plates.length === 1) return plates[0].plate_text ?? null;
    if (!v.bbox) return null;
    const [vx, vy] = centre(v.bbox);
    let best: ScanDetection | null = null, bestD = Infinity;
    for (const p of plates) {
        if (!p.bbox) continue;
        const [px, py] = centre(p.bbox);
        const d = (px - vx) ** 2 + (py - vy) ** 2;
        if (d < bestD) { bestD = d; best = p; }
    }
    return best?.plate_text ?? null;
}
