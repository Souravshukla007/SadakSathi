import React from "react";
import Link from "next/link";

export default function AppFooter() {
    return (
        <footer className="bg-white pt-24 pb-12 border-t border-border-light">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-16">
                    <div className="col-span-1 md:col-span-1">
                        <Link href="/" className="text-xl font-heading font-bold text-text-primary flex items-center gap-2 mb-6" data-pixel-id="t9cle" data-pixel-kind="link">
                            <span className="text-2xl">🛣️</span> PotholeVision
                        </Link>
                        <p className="text-sm text-text-secondary leading-relaxed max-w-xs" data-pixel-id="g2czq" data-pixel-kind="text">
                            Next-generation road safety platform leveraging Specialized Computer Vision for municipal excellence.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-heading font-bold mb-6 text-sm uppercase tracking-widest text-text-primary" data-pixel-id="vkfng" data-pixel-kind="text">Platform</h4>
                        <ul className="space-y-3 text-sm text-text-secondary">
                            <li data-pixel-id="dotke" data-pixel-kind="text"><Link href="/traffic-violations" className="hover:text-brand-primary transition-colors" data-pixel-id="gmw8q" data-pixel-kind="link">Traffic AI</Link></li>
                            <li data-pixel-id="f65jq" data-pixel-kind="text"><Link href="/upload" className="hover:text-brand-primary transition-colors" data-pixel-id="c1yux" data-pixel-kind="link">Upload Portal</Link></li>
                            <li data-pixel-id="9y43p" data-pixel-kind="text"><Link href="/performance" className="hover:text-brand-primary transition-colors" data-pixel-id="zjfpi" data-pixel-kind="link">Model Analytics</Link></li>
                            <li data-pixel-id="jekyg" data-pixel-kind="text"><Link href="/admin" className="hover:text-brand-primary transition-colors" data-pixel-id="5ogx0" data-pixel-kind="link">Municipal Dashboard</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-heading font-bold mb-6 text-sm uppercase tracking-widest text-text-primary" data-pixel-id="6n1oh" data-pixel-kind="text">Resources</h4>
                        <ul className="space-y-3 text-sm text-text-secondary">
                            <li data-pixel-id="uhhdp" data-pixel-kind="text"><Link href="#" className="hover:text-brand-primary transition-colors" data-pixel-id="uq0sa" data-pixel-kind="link">Whitepapers</Link></li>
                            <li data-pixel-id="5k12e" data-pixel-kind="text"><Link href="#" className="hover:text-brand-primary transition-colors" data-pixel-id="ngz10" data-pixel-kind="link">API Docs</Link></li>
                            <li data-pixel-id="fb4ye" data-pixel-kind="text"><Link href="#" className="hover:text-brand-primary transition-colors" data-pixel-id="oz191" data-pixel-kind="link">Case Studies</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-heading font-bold mb-6 text-sm uppercase tracking-widest text-text-primary" data-pixel-id="78oz2" data-pixel-kind="text">Governance</h4>
                        <ul className="space-y-3 text-sm text-text-secondary">
                            <li data-pixel-id="lugaq" data-pixel-kind="text"><Link href="#" className="hover:text-brand-primary transition-colors" data-pixel-id="71mn9" data-pixel-kind="link">Safety Standards</Link></li>
                            <li data-pixel-id="8k0ls" data-pixel-kind="text"><Link href="#" className="hover:text-brand-primary transition-colors" data-pixel-id="g75w2" data-pixel-kind="link">Privacy Policy</Link></li>
                            <li data-pixel-id="19ovr" data-pixel-kind="text"><Link href="#" className="hover:text-brand-primary transition-colors" data-pixel-id="kig7m" data-pixel-kind="link">SLA Agreements</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-12 border-t border-border-light">
                    <p className="text-xs text-text-secondary font-mono uppercase tracking-tighter" data-pixel-id="qhuj2" data-pixel-kind="text">© 2025 PotholeVision AI. Engineered for Municipal Impact.</p>
                    <div className="flex gap-8">
                        <Link href="#" className="text-text-secondary hover:text-text-primary transition-colors"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path></svg></Link>
                        <Link href="#" className="text-text-secondary hover:text-text-primary transition-colors"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2 16h-2v-6h2v6zm-1-6.891c-.607 0-1.1-.493-1.1-1.1s.493-1.1 1.1-1.1 1.1.493 1.1 1.1-.493 1.1-1.1 1.1zm9 6.891h-2v-3.868c0-1.035-.53-1.34-1-1.34-.53 0-1 .415-1 1.34v3.868h-2v-6h2v.914c.391-.584 1.112-1.114 2-1.114 1.593 0 3 1.02 3 3.633v2.567z"></path></svg></Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
