
"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

import AppFooter from "@/components/AppFooter";
import { AUTH_CREDENTIALS } from "@/lib/credentials";

function AuthForm() {
    const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
    const [isVisible, setIsVisible] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirect') || '/dashboard';

    // Form states
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [role, setRole] = useState("Citizen Contributor");
    const [authorityType, setAuthorityType] = useState<"citizen" | "municipal" | "traffic">("citizen");
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
            console.log('🔍 Login attempt:', { email, password, authorityType });
            
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, authorityType }),
            });
            
            const data = await res.json();
            console.log('🔍 Login response:', { status: res.status, data });
            
            if (res.ok) {
                toast.success(data.message || "Login successful!");
                // Role-based redirect takes priority; then the ?redirect= param
                if (data.redirectUrl && (data.redirectUrl === '/Municipal' || data.redirectUrl.startsWith('/admin'))) {
                    window.location.href = data.redirectUrl;
                } else {
                    window.location.href = redirectTo;
                }
            } else {
                toast.error(data.message || "Login failed");
            }
        } catch (error) {
            console.error('❌ Login error:', error);
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
                window.location.href = redirectTo;
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

            <main className="flex-grow">
                <section className="min-h-screen flex flex-col md:flex-row bg-white overflow-hidden">
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
                                <Link href="/" className="inline-flex items-center gap-2 mb-6 font-heading font-bold text-2xl hover:opacity-80 transition-opacity">
                                    <span>🛣️</span> SadakSathi
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
                                        <label className="text-xs font-bold uppercase text-text-secondary tracking-wider">Authority Type</label>
                                        <select 
                                            className="w-full px-4 py-3 rounded-lg border border-border-light bg-white focus:ring-2 focus:ring-brand-primary outline-none appearance-none" 
                                            value={authorityType} 
                                            onChange={(e) => setAuthorityType(e.target.value as "citizen" | "municipal" | "traffic")}
                                        >
                                            <option value="citizen">Citizen Contributor</option>
                                            <option value="municipal">Municipal Authority</option>
                                            <option value="traffic">Traffic Authority</option>
                                        </select>
                                    </div>
                                    
                                    {authorityType === "citizen" ? (
                                        <>
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
                                        </>
                                    ) : (
                                        <>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase text-text-secondary tracking-wider">Username</label>
                                                <input 
                                                    type="text" 
                                                    placeholder={authorityType === "municipal" ? "municipal-admin" : "traffic-officer"} 
                                                    className="w-full px-4 py-3 rounded-lg border border-border-light bg-white focus:ring-2 focus:ring-brand-primary outline-none transition-all" 
                                                    value={email} 
                                                    onChange={(e) => setEmail(e.target.value)} 
                                                    required 
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase text-text-secondary tracking-wider">Password</label>
                                                <input 
                                                    type="password" 
                                                    placeholder={authorityType === "municipal" ? "municipal123" : "traffic123"} 
                                                    className="w-full px-4 py-3 rounded-lg border border-border-light bg-white focus:ring-2 focus:ring-brand-primary outline-none transition-all" 
                                                    value={password} 
                                                    onChange={(e) => setPassword(e.target.value)} 
                                                    required 
                                                />
                                            </div>
                                            <div className="text-xs text-text-secondary bg-gray-50 p-3 rounded-lg">
                                                <strong>Hard-coded credentials:</strong><br />
                                                {authorityType === "municipal" ? (
                                                    <span>Municipal: username: municipal-admin, password: municipal123</span>
                                                ) : (
                                                    <span>Traffic: username: traffic-officer, password: traffic123</span>
                                                )}
                                            </div>
                                        </>
                                    )}
                                    
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
                                            <option>Municipal Administrator</option>
                                            <option>Traffic Department</option>
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

                                <button onClick={() => window.location.href = '/api/auth/google'} className="w-full flex items-center justify-center gap-3 py-3 border border-border-light rounded-lg hover:bg-white transition-all font-medium text-sm">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" loading="eager" /> Continue with Google
                                </button>
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
