"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";

export default function AuthPage() {
    const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
    const [isVisible, setIsVisible] = useState(false);
    const router = useRouter();

    // Form states
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [role, setRole] = useState("Citizen Contributor");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Small delay to allow initial animation on mount
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Login successful!");
                router.push("/");
                router.refresh(); // Ensure the layout picks up the new auth state
            } else {
                toast.error(data.message || "Login failed");
            }
        } catch (error) {
            toast.error("An error occurred during login");
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
                body: JSON.stringify({ firstName, lastName, email, role, password }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Signup successful! Welcome.");
                router.push("/");
                router.refresh();
            } else {
                toast.error(data.message || "Signup failed");
            }
        } catch (error) {
            toast.error("An error occurred during signup");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Toaster position="top-center" />
            <AppHeader />
            <main className="flex-grow pt-16">
                <section className="min-h-[calc(100vh-64px)] flex flex-col md:flex-row bg-white overflow-hidden">
                    {/* Left Side: Illustration / Gradient */}
                    <div className="hidden md:flex md:w-1/2 bg-neutral-dark relative items-center justify-center p-12 overflow-hidden">
                        <div className="absolute inset-0 blur-gradient opacity-40"></div>
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-primary/20 via-transparent to-transparent"></div>

                        <div className={`relative z-10 text-center space-y-8 animate-on-scroll-hidden ${isVisible ? 'animate-on-scroll-visible' : ''}`}>
                            <div className="space-y-4">
                                <h2 className="text-4xl lg:text-5xl font-heading font-bold text-white leading-tight">
                                    Smarter Roads,<br /><span className="text-brand-primary">Safer Cities.</span>
                                </h2>
                                <p className="text-gray-400 max-w-sm mx-auto">
                                    Join thousands of citizens helping city councils detect and repair road infrastructure in real-time.
                                </p>
                            </div>

                            {/* Floating Icons Simulation */}
                            <div className="relative w-64 h-64 mx-auto">
                                <div className="absolute top-0 left-1/4 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 animate-float">
                                    <span className="text-3xl">📷</span>
                                </div>
                                <div className="absolute bottom-10 right-0 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 animate-float" style={{ animationDelay: "1s" }}>
                                    <span className="text-3xl">🤖</span>
                                </div>
                                <div className="absolute top-1/2 left-0 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 animate-float" style={{ animationDelay: "1.5s" }}>
                                    <span className="text-3xl">🛣️</span>
                                </div>
                                <div className="absolute bottom-0 left-1/2 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 animate-float" style={{ animationDelay: "0.5s" }}>
                                    <span className="text-3xl">🛡️</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Auth Form */}
                    <div className="w-full md:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-neutral-surface">
                        <div className={`max-w-md w-full animate-on-scroll-hidden ${isVisible ? 'animate-on-scroll-visible' : ''}`}>
                            <div className="mb-10 text-center md:text-left">
                                <Link href="/" className="md:hidden inline-flex items-center gap-2 mb-6 font-heading font-bold text-2xl">
                                    <span>🛣️</span> PotholeVision
                                </Link>
                                <h1 className="text-3xl font-heading font-bold text-text-primary mb-2">Welcome Back</h1>
                                <p className="text-text-secondary">Sign in to your account to continue</p>
                            </div>

                            {/* Auth Tabs */}
                            <div className="bg-white p-2 rounded-xl border border-border-light flex mb-8">
                                <button
                                    onClick={() => setActiveTab("login")}
                                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'login' ? 'bg-text-primary text-white' : 'text-text-secondary hover:bg-neutral-surface'}`}
                                >
                                    Login
                                </button>
                                <button
                                    onClick={() => setActiveTab("signup")}
                                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'signup' ? 'bg-text-primary text-white' : 'text-text-secondary hover:bg-neutral-surface'}`}
                                >
                                    Signup
                                </button>
                            </div>

                            {/* Login Form */}
                            {activeTab === 'login' && (
                                <form className="space-y-5" onSubmit={handleLogin}>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-text-secondary tracking-wider">Email Address</label>
                                        <input type="email" placeholder="name@company.com" className="w-full px-4 py-3 rounded-lg border border-border-light bg-white focus:ring-2 focus:ring-brand-primary outline-none transition-all" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-bold uppercase text-text-secondary tracking-wider">Password</label>
                                            <a href="#" className="text-xs text-brand-primary font-bold hover:underline">Forgot?</a>
                                        </div>
                                        <input type="password" placeholder="••••••••" className="w-full px-4 py-3 rounded-lg border border-border-light bg-white focus:ring-2 focus:ring-brand-primary outline-none transition-all" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                    </div>
                                    <button type="submit" disabled={isLoading} className="w-full py-4 bg-text-primary text-white font-bold rounded-lg hover:shadow-soft transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                                        <span>{isLoading ? "Signing In..." : "Sign In"}</span>
                                        {!isLoading && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>}
                                    </button>
                                </form>
                            )}

                            {/* Signup Form */}
                            {activeTab === 'signup' && (
                                <form className="space-y-5" onSubmit={handleSignup}>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase text-text-secondary tracking-wider">First Name</label>
                                            <input type="text" placeholder="John" className="w-full px-4 py-3 rounded-lg border border-border-light bg-white focus:ring-2 focus:ring-brand-primary outline-none" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase text-text-secondary tracking-wider">Last Name</label>
                                            <input type="text" placeholder="Doe" className="w-full px-4 py-3 rounded-lg border border-border-light bg-white focus:ring-2 focus:ring-brand-primary outline-none" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-text-secondary tracking-wider">Email</label>
                                        <input type="email" placeholder="name@company.com" className="w-full px-4 py-3 rounded-lg border border-border-light bg-white focus:ring-2 focus:ring-brand-primary outline-none" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-text-secondary tracking-wider">Role</label>
                                        <select className="w-full px-4 py-3 rounded-lg border border-border-light bg-white focus:ring-2 focus:ring-brand-primary outline-none appearance-none" value={role} onChange={(e) => setRole(e.target.value)}>
                                            <option>Citizen Contributor</option>
                                            <option>City Administrator</option>
                                            <option>Maintenance Contractor</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-text-secondary tracking-wider">Password</label>
                                        <input type="password" placeholder="••••••••" className="w-full px-4 py-3 rounded-lg border border-border-light bg-white focus:ring-2 focus:ring-brand-primary outline-none" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                    </div>
                                    <button type="submit" disabled={isLoading} className="w-full py-4 bg-brand-primary text-text-primary font-bold rounded-lg hover:shadow-soft transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed">
                                        {isLoading ? "Creating Account..." : "Create Account"}
                                    </button>
                                </form>
                            )}

                            <div className="mt-8">
                                <div className="relative flex items-center justify-center mb-6">
                                    <div className="absolute w-full h-px bg-border-light"></div>
                                    <span className="relative bg-neutral-surface px-4 text-xs font-bold text-text-secondary uppercase">Or continue with</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button className="flex items-center justify-center gap-3 py-3 border border-border-light rounded-lg hover:bg-white transition-all font-medium text-sm">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" loading="eager" /> Google
                                    </button>
                                    <button className="flex items-center justify-center gap-3 py-3 border border-border-light rounded-lg hover:bg-white transition-all font-medium text-sm">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 3.293-.015 5.942-.015 6.746 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"></path></svg> GitHub
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <AppFooter />
        </>
    );
}
