"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

/**
 * Fades/slides its content in the first time it scrolls into view.
 * `delay` (ms) staggers siblings. Content stays visible without JS and under reduced motion.
 */
export default function Reveal({ children, delay = 0, as: Tag = "div", className = "" }: {
    children: ReactNode; delay?: number; as?: ElementType; className?: string;
}) {
    const ref = useRef<HTMLElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                el.classList.add("is-visible");
                observer.disconnect();
            }
        }, { rootMargin: "0px 0px -10% 0px" });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <Tag ref={ref} className={`reveal ${className}`} style={delay ? { ["--reveal-delay" as string]: `${delay}ms` } : undefined}>
            {children}
        </Tag>
    );
}
