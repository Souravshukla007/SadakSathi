"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import s from "./guide.module.css";

type Track = { id: string; label: string };

/**
 * Wraps the guide: the sticky track switcher, the pause/play toggle, and an
 * IntersectionObserver that pauses scenes while they are off screen.
 */
export default function GuideMotion({ tracks, children }: { tracks: Track[]; children: React.ReactNode }) {
    const rootRef = useRef<HTMLDivElement>(null);
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        const scenes = rootRef.current?.querySelectorAll<HTMLElement>("[data-scene]");
        if (!scenes?.length || !("IntersectionObserver" in window)) return;
        const io = new IntersectionObserver((entries) => {
            for (const e of entries) e.target.toggleAttribute("data-offscreen", !e.isIntersecting);
        }, { rootMargin: "100px 0px" });
        scenes.forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, []);

    return (
        <div ref={rootRef} className={s.root} data-paused={paused || undefined}>
            <div className="sticky top-[61px] z-30 border-b border-border-light bg-surface">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2">
                    <nav aria-label="Guide sections" className="flex rounded-lg border border-border-light bg-neutral-surface p-1">
                        {tracks.map((t) => (
                            <a
                                key={t.id}
                                href={`#${t.id}`}
                                className="rounded-md px-2.5 sm:px-3 py-1.5 text-sm font-semibold text-text-primary whitespace-nowrap hover:bg-surface transition-colors"
                            >
                                {t.label}
                            </a>
                        ))}
                    </nav>
                    <button
                        type="button"
                        onClick={() => setPaused((p) => !p)}
                        className="motion-reduce:hidden inline-flex items-center gap-1.5 rounded-lg border border-border-light px-3 py-2 text-sm font-semibold text-text-secondary hover:text-text-primary hover:border-border-dark transition-colors whitespace-nowrap"
                    >
                        {paused ? <Play className="size-4" aria-hidden="true" /> : <Pause className="size-4" aria-hidden="true" />}
                        <span>{paused ? "Play" : "Pause"}<span className="sr-only sm:not-sr-only"> animations</span></span>
                    </button>
                </div>
            </div>
            {children}
        </div>
    );
}
