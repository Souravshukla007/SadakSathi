import type { Metadata, Viewport } from "next";
import "./globals.css";
import Script from "next/script";
import localFont from "next/font/local";

// The original type pair: Outfit for headings, DM Sans for body. Shipped in the repo
// (SIL Open Font License) so builds need no network: Docker/Raspberry Pi builds stay offline-safe.
const outfit = localFont({ src: "./fonts/outfit.woff2", weight: "100 900", variable: "--font-outfit", display: "swap" });
const dmSans = localFont({ src: "./fonts/dm-sans.woff2", weight: "100 1000", variable: "--font-dm-sans", display: "swap" });

export const metadata: Metadata = {
    title: "SadakSathi | AI-Powered Road Intelligence for Smart Cities",
    description: "SadakSathi — Detect potholes and traffic violations with AI. Geo-tagged reports, duplicate checks, complaint tracking, and e-challan tools for city staff.",
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
    openGraph: { type: "website", siteName: "SadakSathi", locale: "en_IN" },
    twitter: { card: "summary" },
};

export const viewport: Viewport = { themeColor: "#92A0E1" };

const THEME_SCRIPT = `document.documentElement.classList.add("js");try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`${outfit.variable} ${dmSans.variable}`} suppressHydrationWarning>
            <head>
                {/* Runs before first paint so dark mode never flashes white: saved choice, else the OS setting. */}
                <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
            </head>
            <body id="app-root" className="font-primary bg-neutral-background text-text-primary overflow-x-hidden min-h-screen flex flex-col">
                <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-sign-green focus:px-4 focus:py-2 focus:font-semibold focus:text-white">
                    Skip to content
                </a>
                <div id="google_translate_element" style={{ display: 'none' }}></div>
                {/* Google Translate loads only after someone picks Hindi or Marathi (the language menu sets
                    the googtrans cookie and reloads). English readers never download the third-party script. */}
                <Script id="google-translate-loader" strategy="afterInteractive">
                    {`
                        if (/googtrans=\\/en\\/(hi|mr)/.test(document.cookie)) {
                            window.googleTranslateElementInit = function () {
                                new window.google.translate.TranslateElement({
                                    pageLanguage: 'en',
                                    includedLanguages: 'en,hi,mr',
                                    layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                                    autoDisplay: false
                                }, 'google_translate_element');
                            };
                            var s = document.createElement('script');
                            s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
                            document.head.appendChild(s);
                        }
                    `}
                </Script>

                {children}
            </body>
        </html>
    );
}
