"use client";

import { useEffect, useRef, useState } from "react";
import { CircleCheck, Clock, Construction, Inbox, type LucideIcon } from "lucide-react";

type Stats = { total: number; pending: number; inProgress: number; resolved: number };

const TILES: { key: keyof Stats; label: string; icon: LucideIcon; tint: string }[] = [
    { key: "total", label: "Reports filed", icon: Inbox, tint: "text-text-secondary" },
    { key: "pending", label: "Waiting for review", icon: Clock, tint: "text-hazard-ink" },
    { key: "inProgress", label: "Being worked on", icon: Construction, tint: "text-text-secondary" },
    { key: "resolved", label: "Fixed", icon: CircleCheck, tint: "text-sign-green" },
];

const format = new Intl.NumberFormat("en-IN");

/** Counts from 0 up to `target` once `run` is true; jumps straight there under reduced motion. */
function CountUp({ target, run }: { target: number; run: boolean }) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        if (!run) return;
        const duration = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1200;
        const start = performance.now();
        let frame = requestAnimationFrame(function tick(now) {
            const p = duration ? Math.min(1, (now - start) / duration) : 1;
            setValue(Math.round(target * (1 - (1 - p) ** 3)));
            if (p < 1) frame = requestAnimationFrame(tick);
        });
        return () => cancelAnimationFrame(frame);
    }, [target, run]);
    // Screen readers get the final number, not the frames in between.
    return <><span className="sr-only">{format.format(target)}</span><span aria-hidden="true">{format.format(value)}</span></>;
}

/** Live report counts from the public stats endpoint. Shows "—" while loading or if it fails. */
export default function LiveStats() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [inView, setInView] = useState(false);
    const ref = useRef<HTMLDListElement>(null);

    useEffect(() => {
        let cancelled = false;
        fetch("/api/complaints/stats")
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (!cancelled && data && TILES.every((t) => Number.isFinite(data[t.key]))) setStats(data);
            })
            .catch(() => { /* keep the dashes */ });
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); io.disconnect(); } });
        io.observe(el);
        return () => io.disconnect();
    }, []);

    return (
        <dl ref={ref} aria-busy={!stats} className="grid grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden rounded-xl border border-border-light bg-border-light elevated">
            {TILES.map((t) => (
                <div key={t.key} className="bg-surface px-4 py-5 sm:px-6">
                    <dt className="flex items-center gap-2 text-sm font-semibold text-text-secondary">
                        <t.icon className={`size-4 shrink-0 ${t.tint}`} aria-hidden="true" />
                        {t.label}
                    </dt>
                    <dd className="mt-2 font-heading text-3xl sm:text-4xl font-normal tracking-tighter tabular-nums text-text-primary">
                        {stats ? <CountUp target={stats[t.key]} run={inView} /> : "—"}
                    </dd>
                </div>
            ))}
        </dl>
    );
}
