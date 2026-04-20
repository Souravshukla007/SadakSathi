"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Loader2, Search, ChevronDown, ThumbsUp, X, AlertCircle, CheckCircle } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Complaint {
  id: string;
  issueType: string;
  description: string;
  street: string;
  city: string;
  state: string;
  status: string;
  evidenceUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  upvoteCount: number;
  submittedBy: string;
  hasVoted: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function statusStyle(status: string) {
  switch (status) {
    case "Submitted":  return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "Approved":   return "bg-blue-100 text-blue-700 border-blue-200";
    case "OnHold":     return "bg-orange-100 text-orange-700 border-orange-200";
    case "Rejected":   return "bg-red-100 text-red-700 border-red-200";
    case "Completed":
    case "ResolvedReviewed": return "bg-green-100 text-green-700 border-green-200";
    default:           return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

function statusLabel(status: string) {
  return status === "ResolvedReviewed" ? "Resolved" : status;
}

const ISSUE_TYPES = [
  "Pothole", "Garbage Accumulation", "Open Manhole", "Fallen Tree",
  "Broken Street Light", "Broken Sign", "Waterlogging", "Other"
];

const FILTER_OPTIONS = [
  { label: "All",        value: "" },
  { label: "Submitted",  value: "Submitted" },
  { label: "Approved",   value: "Approved" },
  { label: "In Progress",value: "OnHold" },
  { label: "Resolved",   value: "Completed" },
];

const SORT_OPTIONS = [
  { label: "Newest First", value: "newest" },
  { label: "Oldest First", value: "oldest" },
  { label: "Most Upvoted", value: "upvotes" },
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ComplaintsPage() {
  const router = useRouter();

  // Feed state
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch]         = useState("");
  const [activeStatus, setActiveStatus] = useState("");
  const [sort, setSort]             = useState("newest");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Form state
  const [issueType, setIssueType]     = useState("Pothole");
  const [description, setDescription] = useState("");
  const [street, setStreet]           = useState("");
  const [city, setCity]               = useState("");
  const [state, setState]             = useState("");
  const [zipcode, setZipcode]         = useState("");
  const [latitude, setLatitude]       = useState<number | null>(null);
  const [longitude, setLongitude]     = useState<number | null>(null);
  const [isLocating, setIsLocating]   = useState(false);
  const [locationError, setLocationError] = useState("");

  // Search debounce
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  // Fetch complaints
  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams({ sort });
      if (activeStatus) params.set("status", activeStatus);
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await fetch(`/api/complaints/feed?${params}`);
      if (!res.ok) throw new Error("Failed to load complaints");
      const data = await res.json();
      setComplaints(data);
    } catch (e: any) {
      setFetchError(e.message || "Could not load complaints");
    } finally {
      setLoading(false);
    }
  }, [sort, activeStatus, debouncedSearch]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  // Compute stats from live data
  const totalIssues  = complaints.length;
  const pending      = complaints.filter(c => c.status === "Submitted").length;
  const inProgress   = complaints.filter(c => c.status === "Approved" || c.status === "OnHold").length;
  const resolved     = complaints.filter(c => c.status === "Completed" || c.status === "ResolvedReviewed").length;

  // GPS location
  const handleGetLocation = () => {
    setLocationError("");
    if (!navigator.geolocation) { setLocationError("Geolocation not supported"); return; }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setLatitude(lat);
        setLongitude(lon);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const data = await res.json();
          if (data?.address) {
            setStreet(data.address.road || data.address.suburb || "");
            setCity(data.address.city || data.address.town || data.address.village || "");
            setState(data.address.state || "");
            setZipcode(data.address.postcode || "");
          }
        } catch { /* ignore geocode errors */ }
        finally { setIsLocating(false); }
      },
      (err) => { setIsLocating(false); setLocationError(err.message); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Submit complaint
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueType, description, street, city, state, zipcode, latitude, longitude }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Submission failed");
      setSubmitSuccess(true);
      // Reset form
      setIssueType("Pothole"); setDescription(""); setStreet(""); setCity("");
      setState(""); setZipcode(""); setLatitude(null); setLongitude(null);
      // Refresh feed and close modal after short delay
      setTimeout(() => { setSubmitSuccess(false); setIsModalOpen(false); fetchComplaints(); }, 2000);
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Upvote
  const handleVote = async (complaintId: string) => {
    try {
      const res = await fetch("/api/complaints/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaintId }),
      });
      if (res.status === 401) { router.push("/login"); return; }
      if (res.ok) {
        const { upvoteCount } = await res.json();
        setComplaints(prev => prev.map(c =>
          c.id === complaintId ? { ...c, upvoteCount, hasVoted: true } : c
        ));
      }
    } catch { /* noop */ }
  };

  return (
    <>
      <AppHeader />
      <main className="flex-grow pt-16">
        <section className="py-12 md:py-20 px-6 bg-neutral-surface min-h-screen">
          <div className="max-w-7xl mx-auto">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
              <div>
                <h1 className="text-4xl font-heading font-bold text-text-primary mb-2">Road Complaints</h1>
                <p className="text-text-secondary">Help us track and resolve road issues in your neighborhood.</p>
              </div>
              <button
                onClick={() => { setIsModalOpen(true); setSubmitError(null); setSubmitSuccess(false); }}
                className="px-6 py-3 bg-brand-primary text-text-primary font-bold rounded-lg shadow-soft hover:-translate-y-1 transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Submit Complaint
              </button>
            </div>

            {/* Live Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { label: "Total Issues",  value: totalIssues,  color: "text-text-primary" },
                { label: "Pending",       value: pending,      color: "text-yellow-500" },
                { label: "In Progress",   value: inProgress,   color: "text-blue-500" },
                { label: "Resolved",      value: resolved,     color: "text-green-500" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white p-6 rounded-2xl border border-border-light shadow-soft">
                  <div className={`text-xs font-bold uppercase mb-2 ${color}`}>{label}</div>
                  <div className={`text-3xl font-bold ${loading ? "opacity-30 animate-pulse" : ""}`}>
                    {loading ? "—" : value.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* Filters + Search + Sort */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              {/* Status tabs */}
              <div className="flex flex-wrap gap-2">
                {FILTER_OPTIONS.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setActiveStatus(f.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                      activeStatus === f.value
                        ? "bg-text-primary text-white"
                        : "bg-white border border-border-light text-text-secondary hover:bg-neutral-surface"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex-grow" />
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by location or issue..."
                  className="pl-10 pr-4 py-2 bg-white border border-border-light rounded-lg text-sm w-full md:w-64 outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>
              {/* Sort */}
              <div className="relative">
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value)}
                  className="pl-4 pr-8 py-2 bg-white border border-border-light rounded-lg text-sm outline-none focus:ring-1 focus:ring-brand-primary appearance-none"
                >
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
              </div>
            </div>

            {/* Error */}
            {fetchError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-8 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{fetchError}</span>
              </div>
            )}

            {/* Complaints Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-border-light shadow-soft overflow-hidden animate-pulse">
                    <div className="aspect-video bg-gray-200" />
                    <div className="p-6 space-y-3">
                      <div className="h-3 bg-gray-200 rounded w-1/3" />
                      <div className="h-5 bg-gray-200 rounded w-2/3" />
                      <div className="h-3 bg-gray-200 rounded w-full" />
                      <div className="h-3 bg-gray-200 rounded w-4/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : complaints.length === 0 ? (
              <div className="text-center py-24">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <h3 className="text-xl font-bold mb-2">No complaints found</h3>
                <p className="text-text-secondary">Try a different filter or be the first to report an issue.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {complaints.map(c => (
                  <div key={c.id} className="bg-white rounded-2xl border border-border-light shadow-soft overflow-hidden group hover:border-brand-primary transition-all flex flex-col">
                    {/* Evidence image or placeholder */}
                    <div className="aspect-video relative overflow-hidden bg-gray-100 flex items-center justify-center">
                      {c.evidenceUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.evidenceUrl} alt={c.issueType} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="flex flex-col items-center text-gray-300">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <span className="text-xs mt-1">No image</span>
                        </div>
                      )}
                      <div className={`absolute top-3 right-3 px-2.5 py-1 text-xs font-bold rounded-full border ${statusStyle(c.status)}`}>
                        {statusLabel(c.status)}
                      </div>
                    </div>

                    <div className="p-5 flex flex-col flex-grow">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-brand-primary uppercase tracking-wider truncate max-w-[60%]">{c.issueType}</span>
                        <span className="text-xs text-text-secondary">{relativeTime(c.createdAt)}</span>
                      </div>
                      <h3 className="text-base font-heading font-bold text-text-primary mb-1 truncate">{c.street}</h3>
                      <p className="text-sm text-text-secondary mb-3 line-clamp-2 flex-grow">{c.description}</p>

                      <div className="flex items-center justify-between pt-3 border-t border-border-light">
                        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate max-w-[120px]">{c.city}, {c.state}</span>
                        </div>
                        <button
                          onClick={() => handleVote(c.id)}
                          disabled={c.hasVoted}
                          title={c.hasVoted ? "Already upvoted" : "Upvote this complaint"}
                          className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-all ${
                            c.hasVoted
                              ? "border-brand-primary text-brand-primary bg-brand-primary/10 cursor-default"
                              : "border-border-light text-text-secondary hover:border-brand-primary hover:text-brand-primary hover:bg-brand-primary/5"
                          }`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          {c.upvoteCount}
                        </button>
                      </div>
                      <div className="text-[11px] text-text-secondary mt-2">
                        By <span className="font-medium">{c.submittedBy}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </section>
      </main>
      <AppFooter />

      {/* Submit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-neutral-dark/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="p-5 border-b border-border-light flex justify-between items-center bg-neutral-surface flex-shrink-0">
              <h2 className="text-xl font-heading font-bold text-text-primary">Submit Road Complaint</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-text-secondary hover:text-text-primary bg-white rounded-full p-1 border border-border-light transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable form body */}
            <div className="overflow-y-auto flex-grow">
              <form className="p-6 space-y-5" onSubmit={handleSubmit}>

                {/* Issue Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-text-secondary tracking-wider">Issue Type</label>
                  <select
                    className="w-full px-4 py-3 rounded-lg border border-border-light outline-none focus:ring-2 focus:ring-brand-primary bg-white appearance-none"
                    value={issueType}
                    onChange={e => setIssueType(e.target.value)}
                    required
                  >
                    {ISSUE_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-text-secondary tracking-wider">Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe the issue in detail..."
                    className="w-full px-4 py-3 rounded-lg border border-border-light outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                    required
                  />
                </div>

                {/* GPS button */}
                <button type="button" onClick={handleGetLocation} disabled={isLocating} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-brand-primary text-brand-primary rounded-lg font-bold text-sm hover:bg-brand-primary/5 transition-colors">
                  {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                  {isLocating ? "Detecting location…" : "Use My GPS Location"}
                </button>
                {locationError && <p className="text-xs text-red-500">{locationError}</p>}

                {/* Address fields */}
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-text-secondary tracking-wider">Street / Area</label>
                    <input type="text" value={street} onChange={e => setStreet(e.target.value)} placeholder="e.g. MG Road near Signal No. 5" className="w-full px-4 py-3 rounded-lg border border-border-light outline-none focus:ring-2 focus:ring-brand-primary" required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-text-secondary tracking-wider">City</label>
                      <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="City" className="w-full px-4 py-3 rounded-lg border border-border-light outline-none focus:ring-2 focus:ring-brand-primary" required />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-text-secondary tracking-wider">State</label>
                      <input type="text" value={state} onChange={e => setState(e.target.value)} placeholder="State" className="w-full px-4 py-3 rounded-lg border border-border-light outline-none focus:ring-2 focus:ring-brand-primary" required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-text-secondary tracking-wider">Pincode</label>
                    <input type="text" value={zipcode} onChange={e => setZipcode(e.target.value)} placeholder="e.g. 110001" className="w-full px-4 py-3 rounded-lg border border-border-light outline-none focus:ring-2 focus:ring-brand-primary" required />
                  </div>
                </div>

                {/* Errors / success */}
                {submitError && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {submitError}
                  </div>
                )}
                {submitSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    Complaint submitted successfully!
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || submitSuccess}
                  className="w-full py-4 bg-text-primary text-white font-bold rounded-lg hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? "Submitting…" : "Submit Complaint"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
