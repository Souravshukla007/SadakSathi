"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Menu, X, MapPin, Loader2 } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";

export default function ComplaintsPage() {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [activeFilter, setActiveFilter] = useState("All Issues");
    const [issueType, setIssueType] = useState("Pothole");
    
    // Geolocation state
    const [location, setLocation] = useState("");
    const [isLocating, setIsLocating] = useState(false);
    const [locationError, setLocationError] = useState("");

    const handleGetLocation = () => {
        setLocationError("");
        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by your browser");
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    // Connect to Nominatim OpenStreetMap for free reverse geocoding
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    if (!res.ok) throw new Error("Failed to reverse geocode");
                    
                    const data = await res.json();
                    if (data && data.display_name) {
                        setLocation(data.display_name);
                    } else {
                        // Fallback to coordinates if address isn't found
                        setLocation(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
                    }
                } catch (err) {
                    console.error(err);
                    setLocationError("Could not determine street address");
                } finally {
                    setIsLocating(false);
                }
            },
            (error) => {
                setIsLocating(false);
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        setLocationError("Location permission denied");
                        break;
                    case error.POSITION_UNAVAILABLE:
                        setLocationError("Location information is unavailable");
                        break;
                    case error.TIMEOUT:
                        setLocationError("The request to get user location timed out");
                        break;
                    default:
                        setLocationError("An unknown error occurred");
                        break;
                }
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleComplaintSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsModalOpen(false);
        
        const municipalIssues = ["Pothole", "Garbage Accumulation", "Open Manhole", "Fallen Trees"];
        
        if (municipalIssues.includes(issueType)) {
            router.push("/Municipal");
        } else {
            router.push("/traffic-violations");
        }
    };

    useEffect(() => {
        // Small delay to allow initial animation on mount
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            <AppHeader />
            <main className="flex-grow pt-16">
                <section className="py-12 md:py-20 px-6 bg-neutral-surface min-h-screen relative">
                    <div className="max-w-7xl mx-auto relative z-10">
                        {/* Page Header */}
                        <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 animate-on-scroll-hidden ${isVisible ? 'animate-on-scroll-visible' : ''}`}>
                            <div>
                                <h1 className="text-4xl font-heading font-bold text-text-primary mb-2">Road Complaints</h1>
                                <p className="text-text-secondary">Help us track and resolve road issues in your neighborhood.</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="px-6 py-3 bg-brand-primary text-text-primary font-bold rounded-lg shadow-soft hover:-translate-y-1 transition-all flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                                Submit Complaint
                            </button>
                        </div>

                        {/* Stats & Filters */}
                        <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 animate-on-scroll-hidden ${isVisible ? 'animate-on-scroll-visible' : ''}`} style={{ transitionDelay: '100ms' }}>
                            <div className="bg-white p-6 rounded-2xl border border-border-light shadow-soft">
                                <div className="text-xs font-bold text-text-secondary uppercase mb-2">Total Issues</div>
                                <div className="text-3xl font-bold">1,284</div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-border-light shadow-soft">
                                <div className="text-xs font-bold text-yellow-500 uppercase mb-2">Pending</div>
                                <div className="text-3xl font-bold">452</div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-border-light shadow-soft">
                                <div className="text-xs font-bold text-brand-primary uppercase mb-2">In Progress</div>
                                <div className="text-3xl font-bold">128</div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-border-light shadow-soft">
                                <div className="text-xs font-bold text-green-500 uppercase mb-2">Resolved</div>
                                <div className="text-3xl font-bold">704</div>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className={`flex flex-wrap gap-4 mb-8 animate-on-scroll-hidden ${isVisible ? 'animate-on-scroll-visible' : ''}`} style={{ transitionDelay: '200ms' }}>
                            {['All Issues', 'Pending', 'Resolved'].map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setActiveFilter(filter)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeFilter === filter
                                        ? 'bg-text-primary text-white'
                                        : 'bg-white border border-border-light text-text-secondary hover:bg-neutral-surface font-medium'
                                        }`}
                                >
                                    {filter}
                                </button>
                            ))}
                            <div className="flex-grow"></div>
                            <div className="relative">
                                <input type="text" placeholder="Search location..." className="pl-10 pr-4 py-2 bg-white border border-border-light rounded-lg text-sm w-full md:w-64 outline-none focus:ring-1 focus:ring-brand-primary" />
                                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth="2"></path></svg>
                            </div>
                        </div>

                        {/* Complaints Grid */}
                        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-on-scroll-hidden ${isVisible ? 'animate-on-scroll-visible' : ''}`} style={{ transitionDelay: '300ms' }}>
                            {/* Complaint Card 1 */}
                            <div className="bg-white rounded-2xl border border-border-light shadow-soft overflow-hidden group hover:border-brand-primary transition-all flex flex-col h-full">
                                <div className="aspect-video relative overflow-hidden">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="https://images.unsplash.com/photo-1765300013135-e047e42de2ea?ixid=M3w4NjU0NDF8MHwxfHNlYXJjaHwxfHxSb2FkJTIwcG90aG9sZSUyMG9uJTIwY2l0eSUyMHN0cmVldHxlbnwwfHx8fDE3NzI0NzQ2MTJ8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&fm=jpg&q=80" alt="Pothole" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="eager" />
                                    <div className="absolute top-4 right-4 px-3 py-1 bg-yellow-100 text-yellow-600 text-xs font-bold rounded-full border border-yellow-200">Pending</div>
                                </div>
                                <div className="p-6 flex flex-col flex-grow">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">Deep Pothole</span>
                                        <span className="text-xs text-text-secondary">2 hours ago</span>
                                    </div>
                                    <h3 className="text-xl font-heading font-bold text-text-primary mb-2">Main St near Central Park</h3>
                                    <p className="text-sm text-text-secondary mb-4 line-clamp-2 flex-grow">Hazardous deep pothole causing vehicle damage in the fast lane.</p>
                                    <div className="flex items-center gap-2 text-xs text-text-secondary mt-auto pt-2 border-t border-border-light">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeWidth="2"></path><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2"></path></svg>
                                        40.7128° N, 74.0060° W
                                    </div>
                                </div>
                            </div>

                            {/* Complaint Card 2 */}
                            <div className="bg-white rounded-2xl border border-border-light shadow-soft overflow-hidden group hover:border-brand-primary transition-all flex flex-col h-full">
                                <div className="aspect-video relative overflow-hidden">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="https://images.unsplash.com/photo-1561525667-6e3a337d183f?ixid=M3w4NjU0NDF8MHwxfHNlYXJjaHwxfHxGbG9vZGVkJTIwc3RyZWV0JTIwYWZ0ZXIlMjByYWlufGVufDB8fHx8MTc3MjQ3NDYxMnww&ixlib=rb-4.1.0&w=600&h=400&fit=crop&fm=jpg&q=80" alt="Waterlogging" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="eager" />
                                    <div className="absolute top-4 right-4 px-3 py-1 bg-brand-primary/20 text-brand-primary text-xs font-bold rounded-full border border-brand-primary/30">In Progress</div>
                                </div>
                                <div className="p-6 flex flex-col flex-grow">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">Waterlogging</span>
                                        <span className="text-xs text-text-secondary">Yesterday</span>
                                    </div>
                                    <h3 className="text-xl font-heading font-bold text-text-primary mb-2">Subway Underpass B</h3>
                                    <p className="text-sm text-text-secondary mb-4 line-clamp-2 flex-grow">Severe water accumulation after morning showers, affecting two-wheelers.</p>
                                    <div className="flex items-center gap-2 text-xs text-text-secondary mt-auto pt-2 border-t border-border-light">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeWidth="2"></path><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2"></path></svg>
                                        40.7251° N, 73.9973° W
                                    </div>
                                </div>
                            </div>

                            {/* Complaint Card 3 */}
                            <div className="bg-white rounded-2xl border border-border-light shadow-soft overflow-hidden group hover:border-brand-primary transition-all flex flex-col h-full">
                                <div className="aspect-video relative overflow-hidden">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src="https://images.unsplash.com/photo-1767119454121-d57a4b61311e?ixid=M3w4NjU0NDF8MHwxfHNlYXJjaHwxfHxGaXhlZCUyMHJvYWQlMjBzdXJmYWNlJTIwd2l0aCUyMGZyZXNoJTIwYXNwaGFsdHxlbnwwfHx8fDE3NzI0NzQ2MTJ8MA&ixlib=rb-4.1.0&w=600&h=400&fit=crop&fm=jpg&q=80" alt="Resolved" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="eager" />
                                    <div className="absolute top-4 right-4 px-3 py-1 bg-green-100 text-green-600 text-xs font-bold rounded-full border border-green-200">Resolved</div>
                                </div>
                                <div className="p-6 flex flex-col flex-grow">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">Broken Barrier</span>
                                        <span className="text-xs text-text-secondary">3 days ago</span>
                                    </div>
                                    <h3 className="text-xl font-heading font-bold text-text-primary mb-2">Highway Exit 12</h3>
                                    <p className="text-sm text-text-secondary mb-4 line-clamp-2 flex-grow">Crash barrier damaged last week has been completely replaced and painted.</p>
                                    <div className="flex items-center gap-2 text-xs text-text-secondary mt-auto pt-2 border-t border-border-light">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeWidth="2"></path><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2"></path></svg>
                                        40.7484° N, 73.9857° W
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Complaint Modal */}
                    {isModalOpen && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
                            <div
                                className="absolute inset-0 bg-neutral-dark/40 backdrop-blur-sm"
                                onClick={() => setIsModalOpen(false)}
                            ></div>
                            <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
                                <div className="p-6 border-b border-border-light flex justify-between items-center bg-neutral-surface">
                                    <h2 className="text-2xl font-heading font-bold text-text-primary">Submit Road Complaint</h2>
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="text-text-secondary hover:text-text-primary bg-white rounded-full p-1 border border-border-light shadow-sm transition-colors"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                                    </button>
                                </div>
                                <form className="p-8 space-y-5" onSubmit={handleComplaintSubmit}>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-text-secondary tracking-wider">Issue Type</label>
                                        <select 
                                            className="w-full px-4 py-3 rounded-lg border border-border-light outline-none focus:ring-2 focus:ring-brand-primary appearance-none bg-white"
                                            value={issueType}
                                            onChange={(e) => setIssueType(e.target.value)}
                                        >
                                            <option>Pothole</option>
                                            <option>Garbage Accumulation</option>
                                            <option>Open Manhole</option>
                                            <option>Fallen Trees</option>
                                            <option>No Helmet Usage</option>
                                            <option>Triple Riding</option>
                                            <option>Traffic Signal Violation</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-text-secondary tracking-wider">Severity</label>
                                        <div className="flex gap-4">
                                            <label className="flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-neutral-surface transition-all">
                                                <input type="radio" name="severity" className="accent-brand-primary" />
                                                <span className="text-sm">Low</span>
                                            </label>
                                            <label className="flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-neutral-surface transition-all">
                                                <input type="radio" name="severity" className="accent-brand-primary" defaultChecked />
                                                <span className="text-sm">Medium</span>
                                            </label>
                                            <label className="flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-neutral-surface transition-all">
                                                <input type="radio" name="severity" className="accent-brand-primary" />
                                                <span className="text-sm text-red-500 font-bold">Critical</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-text-secondary tracking-wider">Upload Evidence</label>
                                        <div className="border-2 border-dashed border-border-light rounded-xl p-8 text-center hover:bg-neutral-surface transition-all cursor-pointer bg-neutral-surface/50">
                                            <svg className="w-10 h-10 mx-auto text-text-secondary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                                            <p className="text-sm font-medium text-text-secondary">Drag &amp; drop photo or video</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-text-secondary tracking-wider flex justify-between">
                                            Location (Address or Coordinates)
                                            {locationError && <span className="text-red-500 normal-case">{locationError}</span>}
                                        </label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                value={location}
                                                onChange={(e) => setLocation(e.target.value)}
                                                placeholder="e.g. 123 Main St near Central Park..." 
                                                className={`w-full pl-4 pr-12 py-3 rounded-lg border outline-none focus:ring-2 transition-all ${
                                                    locationError ? "border-red-300 focus:ring-red-400 bg-red-50" : "border-border-light focus:ring-brand-primary bg-white"
                                                }`}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleGetLocation}
                                                disabled={isLocating}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md bg-neutral-surface hover:bg-gray-200 text-text-secondary transition-colors"
                                                title="Use my current GPS location"
                                            >
                                                {isLocating ? (
                                                    <Loader2 className="w-5 h-5 text-brand-primary animate-spin" />
                                                ) : (
                                                    <MapPin className="w-5 h-5 text-brand-primary" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-text-secondary tracking-wider">Description</label>
                                        <textarea rows={3} placeholder="Tell us more about the issue..." className="w-full px-4 py-3 rounded-lg border border-border-light outline-none focus:ring-2 focus:ring-brand-primary resize-none"></textarea>
                                    </div>

                                    <button type="submit" className="w-full py-4 bg-text-primary text-white font-bold rounded-lg hover:shadow-soft transition-all active:scale-[0.98]">
                                        Submit Complaint
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </section>
            </main>
            <AppFooter />
        </>
    );
}
