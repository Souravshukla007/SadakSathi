import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import IconTile from "./IconTile";

/** Page title band for the info pages, in the original style: hero wash, icon tile, normal-weight Outfit title. */
export default function PageHero({ title, lead, icon, wide = false, children }: {
    title: string; lead?: ReactNode; icon?: LucideIcon; wide?: boolean; children?: ReactNode;
}) {
    return (
        <section className="hero-gradient relative border-b border-border-light">
            <div className={`${wide ? "max-w-6xl" : "max-w-3xl"} mx-auto px-4 sm:px-6 pt-28 pb-12 md:pt-36 md:pb-16`}>
                {icon && <IconTile icon={icon} className="animate-pop mb-6" />}
                <h1 className="animate-rise text-4xl md:text-5xl font-heading font-normal tracking-tighter text-text-primary text-balance">{title}</h1>
                {lead && <p className="animate-rise [animation-delay:100ms] mt-4 max-w-2xl text-lg text-text-secondary leading-relaxed text-pretty">{lead}</p>}
                {children}
            </div>
        </section>
    );
}
