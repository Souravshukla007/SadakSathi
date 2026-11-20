
"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { ArrowUp, ChevronDown, Eye, EyeOff, ListChecks, MessagesSquare, ThumbsUp, Trophy, type LucideIcon } from "lucide-react";

import AppFooter from "@/components/AppFooter";
import { BrandMark } from "@/components/AppHeader";

const inputClass = "w-full px-4 py-3 rounded-lg border border-border-light bg-surface text-text-primary placeholder:text-text-light focus:border-sign-green transition-colors";
const labelClass = "block text-sm font-semibold text-text-primary";

const BENEFITS: { icon: LucideIcon; text: string }[] = [
    { icon: ListChecks, text: "Track each report from submitted to completed" },
    { icon: MessagesSquare, text: "Answer questions from the department in the report chat" },
    { icon: ThumbsUp, text: "Upvote reports from your area so they get seen" },
    { icon: Trophy, text: "Earn leaderboard points: 10 for each report, 5 for each upvote" },
];

function PasswordToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
    return (
        <button type="button" aria-label={shown ? "Hide password" : "Show password"} onClick={onToggle} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded text-text-secondary hover:text-text-primary">
            {shown ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
        </button>
    );
}

function AuthForm() {
    const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
    const searchParams = useSearchParams();
    // Only follow same-site paths; "//evil.com" or "/\evil.com" would leave the site.
    const rawRedirect = searchParams.get('redirect') ?? '';
    const redirectTo = /^\/(?![/\\])/.test(rawRedirect) ? rawRedirect : '/dashboard';

    // Form states
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [authorityType, setAuthorityType] = useState<"citizen" | "municipal" | "traffic">("citizen");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Google sign-in sends people back here with ?error=<code> when it fails; say why.
    const oauthError = searchParams.get('error');
    useEffect(() => {
        if (!oauthError) return;
        const messages: Record<string, string> = {
            EmailRequired: "Google didn't confirm an email for that account. Use a verified Google account, or sign up with email.",
            UsePassword: "Staff accounts log in with their password, not Google.",
        };
        toast.error(messages[oauthError] ?? "Google sign-in didn't work. Try again, or log in with email.", { id: 'oauth-error' });
    }, [oauthError]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, authorityType }),
            });

            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || "Logged in");
                if (data.redirectUrl) {
                    window.location.href = data.redirectUrl;
                } else {
                    window.location.href = redirectTo;
                }
            } else {
                toast.error(data.message || "Couldn't log in. Check your email and password and try again.");
            }
        } catch {
            toast.error("Couldn't reach the server. Check your connection and try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ firstName, lastName, email, password }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Account created");
                window.location.href = redirectTo;
            } else {
                toast.error(data.message || "Couldn't create your account. Check the details and try again.");
            }
        } catch {
            toast.error("Couldn't reach the server. Check your connection and try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const tabClass = (on: boolean) => `flex-1 py-2.5 text-sm font-bold rounded-md transition-colors ${on ? 'bg-text-primary text-neutral-background' : 'text-text-secondary hover:bg-neutral-surface'}`;

    return (
        <>
            <Toaster position="top-center" />

            <main id="main-content" className="flex-grow">
                <section className="min-h-screen flex flex-col md:flex-row bg-surface">
                    {/* Left: asphalt at night with a direction sign saying what signing in is for */}
                    <div
                        className="relative hidden md:flex md:w-1/2 overflow-hidden bg-asphalt text-white items-center justify-center p-10 lg:p-16"
                        style={{ backgroundImage: "radial-gradient(70% 55% at 80% 15%, color-mix(in srgb, var(--color-sign-green) 38%, transparent), transparent 70%), radial-gradient(50% 40% at 10% 95%, color-mix(in srgb, var(--color-hazard) 18%, transparent), transparent 70%)" }}
                    >
                        <div className="relative w-full max-w-md">
                            <div className="animate-sign-raise road-sign elevated p-8 lg:p-10">
                                <ArrowUp className="size-14 lg:size-16" strokeWidth={2.75} aria-hidden="true" />
                                <p className="mt-6 font-heading text-3xl lg:text-4xl font-normal tracking-tighter leading-tight text-balance">
                                    Report a road problem, then follow it until the city fixes it.
                                </p>
                            </div>
                            <div aria-hidden="true" className="mx-auto flex w-2/3 justify-between">
                                <span className="h-10 w-2.5 bg-border-dark" />
                                <span className="h-10 w-2.5 bg-border-dark" />
                            </div>

                            <p className="mt-8 font-heading text-lg font-bold">With an account you can</p>
                            <ul className="mt-4 space-y-3">
                                {BENEFITS.map((b, i) => (
                                    <li key={b.text} className="animate-rise flex items-start gap-3" style={{ animationDelay: `${400 + i * 80}ms` }}>
                                        <span aria-hidden="true" className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-white/10">
                                            <b.icon className="size-5" />
                                        </span>
                                        <span className="pt-1.5 text-white/90 leading-snug">{b.text}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Right: auth form */}
                    <div className="w-full md:w-1/2 flex items-center justify-center px-4 py-12 sm:p-6 lg:p-12 bg-neutral-surface">
                        <div className="max-w-md w-full">
                            <div className="mb-8">
                                <Link href="/" aria-label="SadakSathi home" className="inline-flex text-2xl mb-8">
                                    <BrandMark />
                                </Link>
                                <h1 className="text-3xl font-heading font-normal tracking-tighter text-text-primary mb-2">{activeTab === "login" ? "Log in" : "Create your account"}</h1>
                                <p className="text-text-secondary">{activeTab === "login" ? "Pick how you use SadakSathi, then enter your details." : "Report road problems and track what happens to them."}</p>
                            </div>

                            {/* Auth Tabs */}
                            <div className="bg-surface p-1 rounded-lg border border-border-light flex mb-8">
                                <button type="button" aria-pressed={activeTab === "login"} onClick={() => setActiveTab("login")} className={tabClass(activeTab === "login")}>
                                    Log in
                                </button>
                                <button type="button" aria-pressed={activeTab === "signup"} onClick={() => setActiveTab("signup")} className={tabClass(activeTab === "signup")}>
                                    Sign up
                                </button>
                            </div>

                            {/* Login Form */}
                            {activeTab === 'login' && (
                                <form className="space-y-5" onSubmit={handleLogin}>
                                    <div className="space-y-2">
                                        <label htmlFor="auth-field-1" className={labelClass}>Log in as</label>
                                        <div className="relative">
                                            <select id="auth-field-1"
                                                className={`${inputClass} appearance-none pr-10`}
                                                value={authorityType}
                                                onChange={(e) => setAuthorityType(e.target.value as "citizen" | "municipal" | "traffic")}
                                            >
                                                <option value="citizen">Citizen</option>
                                                <option value="municipal">Municipal staff</option>
                                                <option value="traffic">Traffic police</option>
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" aria-hidden="true" />
                                        </div>
                                    </div>

                                    {authorityType === "citizen" ? (
                                        <>
                                            <div className="space-y-2">
                                                <label htmlFor="auth-field-2" className={labelClass}>Email address</label>
                                                <input id="auth-field-2" type="email" name="email" autoComplete="email" spellCheck={false} placeholder="you@example.com" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} required />
                                            </div>
                                            <div className="space-y-2">
                                                <label htmlFor="auth-field-3" className={labelClass}>Password</label>
                                                {/* No password-reset flow exists yet. */}
                                                <div className="relative">
                                                    <input id="auth-field-3" name="password" autoComplete="current-password" type={showPassword ? "text" : "password"} className={`${inputClass} pr-12`} value={password} onChange={(e) => setPassword(e.target.value)} required />
                                                    <PasswordToggle shown={showPassword} onToggle={() => setShowPassword(!showPassword)} />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="space-y-2">
                                                <label htmlFor="auth-field-4" className={labelClass}>Username or email</label>
                                                <input id="auth-field-4"
                                                    type="text"
                                                    name="username"
                                                    autoComplete="username"
                                                    spellCheck={false}
                                                    className={inputClass}
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label htmlFor="auth-field-5" className={labelClass}>Password</label>
                                                <div className="relative">
                                                    <input id="auth-field-5"
                                                        name="password"
                                                        autoComplete="current-password"
                                                        type={showPassword ? "text" : "password"}
                                                        className={`${inputClass} pr-12`}
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        required
                                                    />
                                                    <PasswordToggle shown={showPassword} onToggle={() => setShowPassword(!showPassword)} />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-text-primary text-neutral-background font-bold rounded-lg hover:opacity-90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
                                        {isLoading ? "Logging in…" : "Log in"}
                                    </button>
                                </form>
                            )}

                            {/* Signup Form */}
                            {activeTab === 'signup' && (
                                <form className="space-y-5" onSubmit={handleSignup}>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label htmlFor="auth-field-6" className={labelClass}>First name</label>
                                            <input id="auth-field-6" type="text" autoComplete="given-name" className={inputClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="auth-field-7" className={labelClass}>Last name</label>
                                            <input id="auth-field-7" type="text" autoComplete="family-name" className={inputClass} value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="auth-field-8" className={labelClass}>Email address</label>
                                        <input id="auth-field-8" type="email" name="email" autoComplete="email" spellCheck={false} placeholder="you@example.com" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="auth-field-9" className={labelClass}>Password</label>
                                        <div className="relative">
                                            <input id="auth-field-9" type={showPassword ? "text" : "password"} placeholder="At least 8 characters" minLength={8} autoComplete="new-password" className={`${inputClass} pr-12`} value={password} onChange={(e) => setPassword(e.target.value)} required />
                                            <PasswordToggle shown={showPassword} onToggle={() => setShowPassword(!showPassword)} />
                                        </div>
                                    </div>
                                    <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-text-primary text-neutral-background font-bold rounded-lg hover:opacity-90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed">
                                        {isLoading ? "Creating account…" : "Create account"}
                                    </button>
                                </form>
                            )}

                            <div className="mt-8">
                                <div className="relative flex items-center justify-center mb-6">
                                    <div className="absolute w-full h-px bg-border-light"></div>
                                    <span className="relative bg-neutral-surface px-4 text-sm text-text-secondary">or</span>
                                </div>

                                {/* A real link: OAuth needs a full-page navigation to the API route, not client-side routing. */}
                                <a href="/api/auth/google" className="w-full min-h-11 flex items-center justify-center gap-3 py-3 bg-surface border border-border-light rounded-lg hover:border-text-secondary transition-colors font-semibold text-sm">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="" loading="eager" /> Continue with Google
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <AppFooter />
        </>
    );
}

export default function AuthPage() {
    return (
        <Suspense fallback={null}>
            <AuthForm />
        </Suspense>
    );
}
