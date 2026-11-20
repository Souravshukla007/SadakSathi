"use client";

import React, { Suspense, useState, useEffect, useCallback, useRef, DragEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, Loader2, Search, ChevronDown, ThumbsUp, X, CircleAlert, CircleCheck, ClipboardList, Clock, Construction, Plus, UploadCloud, ScanLine } from "lucide-react";
import StatusBadge, { statusAccent } from "@/components/dashboard/StatusBadge";
import StatTile from "@/components/dashboard/StatTile";
import PageHero from "@/components/dashboard/PageHero";
import EmptyState, { RoadIllustration } from "@/components/dashboard/EmptyState";
import Reveal from "@/components/Reveal";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import { getComplaintPrefill, clearComplaintPrefill } from "@/lib/mlApi";

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
  distanceKm?: number | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Server caps evidence at 4,000,000 base64 chars (~3,000,000 bytes); 2.8 MiB leaves room for the data-URL prefix.
const MAX_EVIDENCE_BYTES = 2.8 * 1024 * 1024;

const LABEL = "block text-sm font-semibold text-text-primary";
const FIELD = "w-full px-3.5 py-2.5 rounded-lg border border-border-light bg-surface text-base sm:text-sm outline-none focus:border-sign-green";

const ISSUE_TYPES = [
  "Pothole", "Garbage Accumulation", "Open Manhole", "Fallen Tree",
  "Signal Jumping", "Triple Riding", "No Helmet", "Wrong Side Driving"
];

const FILTER_OPTIONS = [
  { label: "All",        value: "" },
  { label: "Submitted",  value: "Submitted" },
  { label: "Approved",   value: "Approved" },
  { label: "In progress",value: "OnHold" },
  { label: "Resolved",   value: "Completed" },
];

const SORT_OPTIONS = [
  { label: "Newest first", value: "newest" },
  { label: "Oldest first", value: "oldest" },
  { label: "Most upvoted", value: "upvotes" },
  { label: "Near me (5 km)", value: "near" },
];

// ── Page ─────────────────────────────────────────────────────────────────────

function ComplaintsPageInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  // Feed state
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [search, setSearch]         = useState("");
  const [activeStatus, setActiveStatus] = useState("");
  const [sort, setSort]             = useState("newest");
  const [here, setHere]             = useState<{ lat: number; lng: number } | null>(null);
  const [locError, setLocError]     = useState<string | null>(null);

  // "Near me" needs the browser's location; ask only when the person picks it.
  const chooseSort = (value: string) => {
    setLocError(null);
    if (value !== "near" || here) { setSort(value); return; }
    if (!navigator.geolocation) { setLocError("This browser can't share your location."); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setHere({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setSort("near"); },
      () => setLocError("Location is blocked. Allow location for this site in your browser settings, then pick \"Near me\" again."),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  };

  // Real stats from DB (includes duplicates)
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

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

  // Media upload
  const [mediaFile, setMediaFile]       = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType]       = useState<"image" | "video" | null>(null);
  const [isDragging, setIsDragging]     = useState(false);
  const [mediaFileName, setMediaFileName] = useState<string | null>(null);  // display name for prefilled images
  const [prefillSource, setPrefillSource] = useState<string | null>(null); // non-null when image came from AI scan
  const [mediaError, setMediaError]     = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Which card's upvote button last played its pop (n bumps so repeat clicks replay it)
  const [voteBump, setVoteBump] = useState<{ id: string; n: number } | null>(null);

  // Search debounce
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // ── Prefill from AI detection ──────────────────────────────────────────────
  // One-time read of the AI-scan hand-off from sessionStorage. It must run after hydration (the
  // server render can't see sessionStorage), so these setStates in an effect are intentional.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (searchParams.get("prefill") !== "1") return;
    const prefill = getComplaintPrefill();
    if (!prefill) return;
    clearComplaintPrefill();

    // Map detected classes → issue type
    const CLASS_TO_ISSUE: Record<string, string> = {
      pothole: "Pothole", road_crack: "Pothole",
      garbage: "Garbage Accumulation", garbage_dump: "Garbage Accumulation", garbage_overflow: "Garbage Accumulation",
      open_manhole: "Open Manhole", manhole: "Open Manhole", manhole_cover: "Open Manhole",
      manhole_broken: "Open Manhole", manhole_lose: "Open Manhole", manhole_uncovered: "Open Manhole",
      // Bundled traffic model classes (backend/models/traffic_model_nano_worse.pt)
      withouthelmet: "No Helmet", no_helmet: "No Helmet", tripleriding: "Triple Riding", triple_riding: "Triple Riding",
      wrong_side_moving: "Wrong Side Driving",
      fallen_tree: "Fallen Tree",
      broken_light: "Broken Street Light",
      broken_sign: "Broken Sign",
      waterlogging: "Waterlogging",
    };
    let mapped = "Other";
    for (const cls of prefill.detectedClasses) {
      const m = CLASS_TO_ISSUE[cls.toLowerCase()];
      if (m) { mapped = m; break; }
    }
    setIssueType(mapped);

    // Pre-attach the annotated image
    setMediaPreview(prefill.imageDataUrl);
    setMediaType("image");
    setMediaFile(null);
    setMediaFileName(`AI scan — ${prefill.fileName}`);
    setPrefillSource(prefill.engine === "traffic" ? "your traffic scan" : "your road hazard scan");

    // Auto-open the modal
    setSubmitError(null);
    setSubmitSuccess(false);
    setIsModalOpen(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  // Fetch complaints
  // Loading starts true; refetches keep the current list on screen until the new one arrives.
  const fetchComplaints = useCallback(async () => {
    try {
      const params = new URLSearchParams({ sort: sort === "near" ? "newest" : sort });
      if (sort === "near" && here) params.set("near", `${here.lat},${here.lng}`);
      if (activeStatus) params.set("status", activeStatus);
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await fetch(`/api/complaints/feed?${params}`);
      if (!res.ok) throw new Error("Failed to load complaints");
      const data = await res.json();
      setFetchError(null);
      setComplaints(data);
    } catch (e) {
      setFetchError((e instanceof Error && e.message) || "Could not load complaints");
    } finally {
      setLoading(false);
    }
  }, [sort, here, activeStatus, debouncedSearch]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch; state is only set after the await
  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  // Fetch real stats from DB
  useEffect(() => {
    fetch('/api/complaints/stats')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setStats(data))
      .catch(() => {/* keep defaults */})
      .finally(() => setStatsLoading(false));
  }, [complaints]); // refresh whenever feed reloads

  // GPS location
  const handleGetLocation = () => {
    setLocationError("");
    if (!navigator.geolocation) { setLocationError("This browser cannot share your location. Enter the address below."); return; }
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

  // Handle file selection (from input or drop)
  const handleFileSelect = (file: File) => {
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isImage && !isVideo) { setMediaError("That file is not a photo or video. Choose a JPG, PNG, MP4 or MOV file."); return; }
    if (file.size > MAX_EVIDENCE_BYTES) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      setMediaError(isVideo
        ? `This video is ${mb} MB. The limit is 2.8 MB, so most videos are too large: trim it to a few seconds or attach a photo instead.`
        : `This photo is ${mb} MB. The limit is 2.8 MB: take a lower-resolution photo or crop it, then try again.`);
      return;
    }
    setMediaError(null);
    setMediaFile(file);
    setMediaFileName(file.name);
    setMediaType(isVideo ? "video" : "image");
    setPrefillSource(null); // user chose their own file
    const reader = new FileReader();
    reader.onload = (e) => setMediaPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    setMediaFileName(null);
    setPrefillSource(null);
    setMediaError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Submit complaint
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      const evidenceUrl = mediaType === "image" ? mediaPreview : null;
      const videoUrl    = mediaType === "video" ? mediaPreview : null;
      const res = await fetch("/api/complaints", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueType, description, street, city, state, zipcode, latitude, longitude, evidenceUrl, videoUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Submission failed");
      setSubmitSuccess(true);
      // Reset form
      setIssueType("Pothole"); setDescription(""); setStreet(""); setCity("");
      setState(""); setZipcode(""); setLatitude(null); setLongitude(null);
      clearMedia();
      // Refresh feed and close modal after short delay
      setTimeout(() => { setSubmitSuccess(false); setIsModalOpen(false); fetchComplaints(); }, 2000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Upvote
  const handleVote = async (complaintId: string) => {
    setVoteBump(b => ({ id: complaintId, n: (b?.n ?? 0) + 1 }));
    try {
      const res = await fetch("/api/complaints/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaintId }),
      });
      if (res.status === 401) { router.push("/auth?redirect=/complaints"); return; }
      if (res.ok) {
        const { upvoteCount } = await res.json();
        setComplaints(prev => prev.map(c =>
          c.id === complaintId ? { ...c, upvoteCount, hasVoted: true } : c
        ));
      }
    } catch { /* noop */ }
  };

  // Browsing is public; filing needs an account, so send guests to log in first (and back here after).
  const openModal = async () => {
    const me = await fetch("/api/auth/me", { cache: "no-store" }).catch(() => null);
    if (!me?.ok) { router.push("/auth?redirect=/complaints"); return; }
    setIsModalOpen(true); setSubmitError(null); setSubmitSuccess(false);
  };

  return (
    <>
      <AppHeader />
      <main id="main-content" className="flex-grow pt-16 bg-neutral-surface">
        <PageHero
          title="Road reports"
          description="See what has been reported near you, upvote what affects you, or report something new."
          actions={
            <button
              type="button"
              onClick={openModal}
              className="w-full md:w-auto justify-center min-h-12 px-5 bg-text-primary text-neutral-background font-bold rounded-lg hover:opacity-90 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" aria-hidden="true" />
              Report a hazard
            </button>
          }
        />
        <section className="py-8 md:py-12 px-4 sm:px-6 min-h-screen">
          <div className="max-w-6xl mx-auto">

            {/* Live stats */}
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
              {[
                { label: "All reports",  value: stats.total,       icon: ClipboardList, tone: "neutral" as const },
                { label: "Awaiting review", value: stats.pending, icon: Clock,         tone: "amber" as const },
                { label: "In progress",  value: stats.inProgress,  icon: Construction,  tone: "neutral" as const },
                { label: "Resolved",     value: stats.resolved,    icon: CircleCheck,   tone: "green" as const },
              ].map(({ label, value, icon, tone }, i) => (
                <StatTile key={label} icon={icon} label={label} tone={tone} value={statsLoading ? "–" : value.toLocaleString()} delay={i * 70} />
              ))}
            </dl>

            {/* Filters + Search + Sort */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
                {FILTER_OPTIONS.map(f => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setActiveStatus(f.value)}
                    aria-pressed={activeStatus === f.value}
                    className={`min-h-11 px-4 rounded-full text-sm font-bold border transition-colors ${
                      activeStatus === f.value
                        ? "bg-asphalt border-asphalt text-white"
                        : "bg-surface border-border-light text-text-secondary hover:text-text-primary hover:border-border-dark"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex-grow" />
              <div className="flex gap-2">
                <div className="relative flex-1 md:flex-none">
                  <label htmlFor="report-search" className="sr-only">Search by location or issue</label>
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
                  <input
                    id="report-search"
                    type="search"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search location or issue…"
                    autoComplete="off"
                    className="min-h-11 pl-9 pr-3 bg-surface border border-border-light rounded-lg text-sm w-full md:w-64 outline-none focus:border-sign-green"
                  />
                </div>
                <div className="relative">
                  <label htmlFor="report-sort" className="sr-only">Sort reports</label>
                  <select
                    id="report-sort"
                    value={sort}
                    onChange={e => chooseSort(e.target.value)}
                    className="min-h-11 pl-3 pr-8 bg-surface text-text-primary border border-border-light rounded-lg text-sm outline-none focus:border-sign-green appearance-none"
                  >
                    {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" aria-hidden="true" />
                </div>
              </div>
            </div>
            {locError && <p role="alert" className="mt-3 text-sm font-semibold text-signal-red">{locError}</p>}
            {sort === "near" && here && !locError && (
              <p className="mt-3 text-sm text-text-secondary">Showing reports within 5 km of you, closest first.</p>
            )}

            {/* Error */}
            {fetchError && (
              <div role="alert" className="bg-surface border border-signal-red/40 border-l-4 border-l-signal-red rounded-lg p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <CircleAlert className="w-5 h-5 flex-shrink-0 text-signal-red mt-0.5" aria-hidden="true" />
                  <p className="text-sm text-text-primary"><span className="font-semibold">Reports did not load.</span> Check your connection and try again.</p>
                </div>
                <button type="button" onClick={() => { setLoading(true); fetchComplaints(); }} className="self-start sm:self-auto min-h-11 px-4 text-sm font-bold border border-border-light rounded-lg hover:border-border-dark transition-colors">
                  Try again
                </button>
              </div>
            )}

            {/* Report grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6" aria-busy="true" aria-label="Loading reports">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-surface rounded-xl border border-border-light overflow-hidden animate-pulse">
                    <div className="aspect-video bg-neutral-surface" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-neutral-surface rounded w-1/2" />
                      <div className="h-3 bg-neutral-surface rounded w-full" />
                      <div className="h-3 bg-neutral-surface rounded w-4/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : complaints.length === 0 ? (
              !fetchError && (
                <div className="bg-surface border border-border-light rounded-xl elevated">
                  <EmptyState
                    headingLevel={2}
                    title={search || activeStatus ? "No reports match these filters" : "No reports yet"}
                    action={
                      <button type="button" onClick={openModal} className="inline-flex items-center gap-2 min-h-11 px-5 bg-text-primary text-neutral-background font-bold rounded-lg text-sm hover:opacity-90 transition-colors">
                        <Plus className="w-4 h-4" aria-hidden="true" />
                        Report a hazard
                      </button>
                    }
                  >
                    {search || activeStatus ? "Change the filter or search, or report the hazard yourself." : "Be the first to report a hazard in your area."}
                  </EmptyState>
                </div>
              )
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {complaints.map((c, i) => {
                  const popping = voteBump?.id === c.id;
                  return (
                  <Reveal as="li" key={c.id} delay={(i % 3) * 70} className="h-full">
                    <article className="group lift elevated h-full bg-surface rounded-xl border border-border-light overflow-hidden flex flex-col">
                      <div className="relative aspect-video bg-neutral-surface flex items-center justify-center overflow-hidden">
                        {c.evidenceUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.evidenceUrl} alt={`Photo of ${c.issueType} on ${c.street}`} width={480} height={270} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <RoadIllustration className="w-28 h-auto" />
                            <span className="text-xs text-text-secondary">No photo attached</span>
                          </div>
                        )}
                        <span className={`absolute inset-x-0 bottom-0 h-1 ${statusAccent(c.status)}`} aria-hidden="true" />
                      </div>

                      <div className="p-4 flex flex-col flex-grow">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-heading font-bold text-text-primary">{c.issueType}</h3>
                          <StatusBadge status={c.status} />
                        </div>
                        <p className="flex items-start gap-1.5 text-sm text-text-secondary mt-1">
                          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
                          <span className="min-w-0 break-words">{c.street}, {c.city}, {c.state}</span>
                        </p>
                        {c.distanceKm != null && (
                          <p className="text-sm font-semibold text-sign-green mt-1">{c.distanceKm < 1 ? `${Math.round(c.distanceKm * 1000)} m away` : `${c.distanceKm} km away`}</p>
                        )}
                        <p className="text-sm text-text-primary mt-2 line-clamp-2 flex-grow">{c.description}</p>

                        <div className="flex items-center justify-between gap-3 pt-3 mt-3 border-t border-border-light">
                          <p className="text-xs text-text-secondary min-w-0 truncate">
                            {c.submittedBy}, {relativeTime(c.createdAt)}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleVote(c.id)}
                            disabled={c.hasVoted}
                            aria-pressed={c.hasVoted}
                            aria-label={c.hasVoted ? `Upvoted, ${c.upvoteCount} upvotes` : `Upvote this report, ${c.upvoteCount} upvotes`}
                            className={`flex-shrink-0 flex items-center gap-1.5 min-h-11 px-3 text-sm font-bold rounded-lg border transition-[color,background-color,border-color,transform] duration-200 active:scale-95 ${
                              c.hasVoted
                                ? "border-sign-green text-sign-green bg-sign-green/10 cursor-default"
                                : "border-border-light text-text-secondary hover:border-sign-green hover:text-sign-green"
                            }`}
                          >
                            <ThumbsUp key={popping ? voteBump?.n : 0} className={`w-4 h-4 ${popping ? "animate-pop" : ""}`} fill={c.hasVoted ? "currentColor" : "none"} aria-hidden="true" />
                            <span key={`n${c.upvoteCount}`} className={`tabular-nums ${popping ? "animate-pop" : ""}`}>{c.upvoteCount}</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  </Reveal>
                  );
                })}
              </ul>
            )}

          </div>
        </section>
      </main>
      <AppFooter />

      {/* Report modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
          <div className="absolute inset-0 bg-asphalt/50" onClick={() => setIsModalOpen(false)} />
          <div role="dialog" aria-modal="true" aria-labelledby="report-modal-title" className="relative bg-surface w-full max-w-lg rounded-t-xl sm:rounded-xl shadow-medium overflow-hidden max-h-[92vh] sm:max-h-[90vh] flex flex-col">
            <div className="px-4 sm:px-6 py-4 border-b border-border-light flex justify-between items-center gap-3 flex-shrink-0">
              <h2 id="report-modal-title" className="text-xl font-heading font-normal tracking-tighter text-text-primary">Report a hazard</h2>
              <button type="button" aria-label="Close" onClick={() => setIsModalOpen(false)} className="w-11 h-11 -mr-2 grid place-items-center text-text-secondary hover:text-text-primary rounded-lg hover:bg-neutral-surface transition-colors">
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="overflow-y-auto flex-grow">
              <form className="px-4 sm:px-6 py-5 space-y-5" onSubmit={handleSubmit}>

                <div className="space-y-1.5">
                  <label htmlFor="report-issue-type" className={LABEL}>What is the problem?</label>
                  <div className="relative">
                    <select
                      id="report-issue-type"
                      className={`${FIELD} appearance-none pr-9`}
                      value={issueType}
                      onChange={e => setIssueType(e.target.value)}
                      required
                    >
                      {/* AI prefill can map to a type outside the list; show it so the select matches what gets sent */}
                      {!ISSUE_TYPES.includes(issueType) && <option>{issueType}</option>}
                      {ISSUE_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" aria-hidden="true" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="report-description" className={LABEL}>Description</label>
                  <textarea
                    id="report-description"
                    rows={3}
                    value={description}
                    maxLength={2000}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="What did you see, and how bad is it? For example: deep pothole in the left lane, two-wheelers swerving."
                    className={`${FIELD} resize-none`}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <span id="report-media-label" className={LABEL}>
                    Photo or video <span className="font-normal text-text-secondary">(optional)</span>
                  </span>

                  {prefillSource && (
                    <div className="flex items-start gap-2 px-3 py-2 bg-hazard/15 rounded-lg text-sm text-hazard-ink">
                      <ScanLine className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <span>Photo attached from <strong>{prefillSource}</strong>. Remove it below if you want to use a different one.</span>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    aria-labelledby="report-media-label"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                  />
                  {!mediaPreview ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      aria-describedby="report-media-hint"
                      className={`flex flex-col items-center justify-center gap-1.5 w-full border-2 border-dashed rounded-lg py-6 px-4 *:pointer-events-none transition-[border-color,background-color,transform] duration-200 ${
                        isDragging ? "border-sign-green bg-sign-green/8 scale-[1.01]" : "border-border-light hover:border-sign-green hover:bg-sign-green/5"
                      }`}
                    >
                      <span key={isDragging ? "drag" : "idle"} className={`w-12 h-12 rounded-xl grid place-items-center mb-1 ${isDragging ? "animate-pop bg-text-primary text-neutral-background" : "bg-neutral-surface text-text-secondary border border-border-light"}`}>
                        <UploadCloud className="w-6 h-6" aria-hidden="true" />
                      </span>
                      <span className="text-sm font-semibold text-text-primary">
                        {isDragging ? "Drop to attach" : "Upload photo or video"}
                      </span>
                      <span id="report-media-hint" className="text-xs text-text-secondary text-center">
                        JPG, PNG, MP4 or MOV, up to 2.8 MB. Videos over 2.8 MB are rejected, so keep clips to a few seconds.
                      </span>
                    </button>
                  ) : (
                    <div className="animate-pop relative rounded-lg overflow-hidden border border-border-light">
                      {mediaType === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={mediaPreview} alt="Attached evidence" className="w-full max-h-48 object-cover" />
                      ) : (
                        <video src={mediaPreview} controls className="w-full max-h-48 object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={clearMedia}
                        aria-label="Remove attachment"
                        className="absolute top-2 right-2 w-11 h-11 grid place-items-center bg-asphalt/80 text-white rounded-full hover:bg-asphalt transition-colors"
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <div className="px-3 py-1.5 bg-neutral-surface border-t border-border-light text-xs text-text-secondary truncate">
                        {mediaFileName ?? mediaFile?.name ?? "Attached image"}
                      </div>
                    </div>
                  )}
                  {mediaError && (
                    <p role="alert" className="flex items-start gap-1.5 text-sm text-signal-red">
                      <CircleAlert className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
                      {mediaError}
                    </p>
                  )}
                </div>

                <fieldset className="space-y-3">
                  <legend className={`${LABEL} mb-1.5`}>Where is it?</legend>
                  <button type="button" onClick={handleGetLocation} disabled={isLocating} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-sign-green text-sign-green rounded-lg font-bold text-sm hover:bg-sign-green/5 transition-colors disabled:opacity-60">
                    {isLocating ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <MapPin className="w-4 h-4" aria-hidden="true" />}
                    {isLocating ? "Finding your location…" : "Use my current location"}
                  </button>
                  {locationError && <p role="alert" className="text-sm text-signal-red">{locationError}</p>}

                  <div className="space-y-1.5">
                    <label htmlFor="report-street" className={LABEL}>Street or area</label>
                    <input id="report-street" type="text" value={street} onChange={e => setStreet(e.target.value)} placeholder="e.g. MG Road near Signal No. 5" className={FIELD} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label htmlFor="report-city" className={LABEL}>City</label>
                      <input id="report-city" type="text" value={city} onChange={e => setCity(e.target.value)} className={FIELD} required />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="report-state" className={LABEL}>State</label>
                      <input id="report-state" type="text" value={state} onChange={e => setState(e.target.value)} className={FIELD} required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="report-pincode" className={LABEL}>Pincode</label>
                    <input id="report-pincode" type="text" inputMode="numeric" value={zipcode} onChange={e => setZipcode(e.target.value)} placeholder="e.g. 110001" className={FIELD} required />
                  </div>
                </fieldset>

                {submitError && (
                  <div role="alert" className="flex items-start gap-2 p-3 border border-signal-red/40 bg-signal-red/5 rounded-lg text-sm text-signal-red">
                    <CircleAlert className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span>Report not sent: {submitError}</span>
                  </div>
                )}
                {submitSuccess && (
                  <div role="status" className="animate-pop flex items-center gap-2 p-3 bg-sign-green/10 rounded-lg text-sm text-sign-green font-semibold">
                    <CircleCheck className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                    Report sent. You can track it on your dashboard.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || submitSuccess}
                  className="w-full py-3.5 bg-text-primary text-neutral-background font-bold rounded-lg hover:opacity-90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                  {submitting ? "Sending report…" : "Send report"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function ComplaintsPage() {
  return (
    <Suspense fallback={null}>
      <ComplaintsPageInner />
    </Suspense>
  );
}
