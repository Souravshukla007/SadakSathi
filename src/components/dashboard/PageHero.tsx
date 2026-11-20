import React from 'react';

interface PageHeroProps {
    title: string;
    description: React.ReactNode;
    /** Buttons shown beside the title (right on desktop, below on mobile). */
    actions?: React.ReactNode;
    /** Small line above the title, e.g. a back link. */
    top?: React.ReactNode;
    /** Content width, matched to the page body below. */
    maxWidth?: string;
    /** Rounded card version for pages that sit beside the sidebar. */
    inset?: boolean;
}

// Page header in the original style: the white-to-cream hero wash and a normal-weight Outfit title.
export default function PageHero({ title, description, actions, top, maxWidth = 'max-w-6xl', inset = false }: PageHeroProps) {
    const inner = (
        <div className={`${inset ? '' : `${maxWidth} mx-auto`} relative flex flex-col md:flex-row md:items-end justify-between gap-5`}>
            <div className="min-w-0 animate-rise">
                {top && <div className="mb-3 text-sm">{top}</div>}
                <h1 className={`font-heading font-normal tracking-tighter text-balance text-text-primary ${inset ? 'text-3xl' : 'text-3xl md:text-5xl'}`}>
                    {title}
                </h1>
                <p className="text-text-secondary mt-2 max-w-2xl text-pretty">{description}</p>
            </div>
            {actions && <div className="animate-rise [animation-delay:120ms] flex flex-col sm:flex-row gap-2 w-full md:w-auto">{actions}</div>}
        </div>
    );

    return (
        <header
            className={`hero-gradient relative overflow-hidden border-border-light ${
                inset ? 'rounded-2xl border elevated p-5 sm:p-7 pb-8 sm:pb-9 mb-6' : 'border-b px-4 sm:px-6 pt-8 pb-10 md:pt-12 md:pb-14'
            }`}
        >
            {inner}
        </header>
    );
}
