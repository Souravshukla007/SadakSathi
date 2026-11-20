import type { Metadata } from "next";

// Account pages shouldn't appear in search results.
export const metadata: Metadata = {
    title: "Log in or sign up — SadakSathi",
    robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return children;
}
