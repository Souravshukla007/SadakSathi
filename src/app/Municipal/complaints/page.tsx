'use client';

import React, { useEffect, useRef, useState } from 'react';
import AppHeader from '@/components/AppHeader';
import { useRouter, useSearchParams } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';
import { Suspense } from 'react';
import StaffNav from '@/components/traffic/StaffNav';
import StatusBadge from '@/components/dashboard/StatusBadge';
import { CalendarDays, CircleCheck, ClipboardList, Clock, Copy, ImageOff, ImagePlus, LoaderCircle, MapPin, Save, ThumbsUp, Trash2, User, X, ZoomIn } from 'lucide-react';
import { complaintTone, DeskHeader, RowStripe } from '@/components/traffic/DeskUI';
import type { ComplaintStatus } from '@prisma/client';
import { STATUS_LABEL, statusOptions } from '@/lib/complaintStatus';

interface Complaint {
    id: string;
    issueType: string;
    description: string;
    street: string;
    city: string;
    state: string;
    zipcode: string;
    status: string;
    remarks: string | null;
    isDuplicate: boolean;
    originalReportId: string | null;
    evidenceUrl: string | null;
    videoUrl: string | null;
    resolutionImageUrl: string | null;
    createdAt: string;
    submittedBy: string;
    submitterEmail: string;
    upvoteCount: number;
}

export default function MunicipalComplaintsPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center text-sm text-text-secondary">Loading complaints…</div>}>
            <ComplaintsContent />
        </Suspense>
    );
}

function ComplaintsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const highlightId = searchParams.get('highlight');
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    // Auto-open the ?highlight complaint only once, not again after the user closes it.
    const openedHighlightRef = useRef<string | null>(null);
    
    // Modal Form State
    const [status, setStatus] = useState('');
    const [remarks, setRemarks] = useState('');
    const [isDuplicate, setIsDuplicate] = useState(false);
    const [originalReportId, setOriginalReportId] = useState('');
    const [resolutionImageBase64, setResolutionImageBase64] = useState('');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const fetchComplaints = async () => {
            try {
                const res = await fetch('/api/municipal/complaints');
                if (res.status === 401 || res.status === 403) {
                    router.push('/auth');
                    return;
                }
                if (res.ok) {
                    const data = await res.json();
                    setComplaints(data);
                } else {
                    setLoadError(true);
                }
            } catch (error) {
                console.error(error);
                setLoadError(true);
                toast.error("Couldn't load complaints. Check your connection and refresh the page.");
            } finally {
                setLoading(false);
            }
        };
        fetchComplaints();
    }, [router]);


    const openModal = (c: Complaint) => {
        setSelectedComplaint(c);
        setStatus(c.status);
        setRemarks(c.remarks || '');
        setIsDuplicate(c.isDuplicate);
        setOriginalReportId(c.originalReportId || '');
        setResolutionImageBase64(c.resolutionImageUrl || '');
        setIsModalOpen(true);
    };

    useEffect(() => {
        if (highlightId && highlightId !== openedHighlightRef.current && complaints.length > 0 && !isModalOpen) {
            const target = complaints.find(c => c.id === highlightId);
            if (target) {
                openedHighlightRef.current = highlightId;
                // eslint-disable-next-line react-hooks/set-state-in-effect -- opens the report named in ?highlight= once its data arrives
                openModal(target);
            }
        }
    }, [highlightId, complaints, isModalOpen]);

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedComplaint(null);
    };

    // Escape closes the dialog, like its Close button.
    useEffect(() => {
        if (!isModalOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setIsModalOpen(false); setSelectedComplaint(null); } };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isModalOpen]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setResolutionImageBase64(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        if (!selectedComplaint) return;
        
        let finalStatus = status;
        if (isDuplicate) {
            finalStatus = 'Rejected';
        }

        if (finalStatus === 'Completed' && !resolutionImageBase64) {
            toast.error('Add a resolution photo before marking this complaint completed.');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`/api/municipal/complaints/${selectedComplaint.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: finalStatus,
                    remarks,
                    isDuplicate,
                    originalReportId,
                    resolutionImageUrl: resolutionImageBase64
                })
            });

            if (res.ok) {
                const data = await res.json();
                toast.success('Changes saved');
                setComplaints(prev => prev.map(c => c.id === data.complaint.id ? { ...c, ...data.complaint } : c));
                closeModal();
            } else {
                const err = await res.json();
                toast.error(err.message || "Couldn't save changes. Try again.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Couldn't reach the server. Check your connection and try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedComplaint) return;
        if (!confirm('Are you sure you want to permanently delete this complaint? This cannot be undone.')) return;

        setDeleting(true);
        try {
            const res = await fetch(`/api/municipal/complaints/${selectedComplaint.id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                toast.success('Complaint deleted');
                setComplaints(prev => prev.filter(c => c.id !== selectedComplaint.id));
                closeModal();
            } else {
                toast.error("Couldn't delete this complaint. Try again.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Couldn't reach the server. Check your connection and try again.");
        } finally {
            setDeleting(false);
        }
    };

    const th = 'px-4 py-3 whitespace-nowrap';
    const label = 'mb-1.5 block text-sm font-semibold text-text-primary';
    const field = 'w-full rounded-md border border-border-light bg-surface px-3 py-2.5 text-sm focus:border-sign-green';
    const waiting = complaints.filter(c => c.status === 'Submitted').length;
    const resolvedCount = complaints.filter(c => c.status === 'Completed' || c.status === 'ResolvedReviewed').length;
    const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
    const chip = 'inline-flex items-center gap-1.5 rounded-full border border-border-light bg-surface px-2.5 py-1 text-xs font-semibold text-text-primary';

    return (
        <>
            <AppHeader dashboardMode={true} />
            <Toaster position="top-center" />
            <main id="main-content" className="flex-grow pt-16 h-screen flex flex-col overflow-hidden bg-neutral-surface lg:pl-64">
                <StaffNav desk="municipal" />

                <div className="flex-shrink-0 px-4 pt-5 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-7xl [&>header]:mb-4">
                        <DeskHeader
                            icon={ClipboardList}
                            title="Complaints"
                            description={loading ? 'Set status, add remarks, or flag duplicates.' : 'Open one to set its status, add remarks, or flag a duplicate.'}
                        >
                            {!loading && !loadError && (
                                <ul className="flex flex-wrap gap-2" aria-label="Complaint counts">
                                    <li className={chip}><ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />{complaints.length} in total</li>
                                    <li className="inline-flex items-center gap-1.5 rounded-full bg-hazard/15 px-2.5 py-1 text-xs font-semibold text-hazard-ink"><Clock className="h-3.5 w-3.5" aria-hidden="true" />{waiting} waiting for review</li>
                                    <li className="inline-flex items-center gap-1.5 rounded-full bg-sign-green/10 px-2.5 py-1 text-xs font-semibold text-sign-green"><CircleCheck className="h-3.5 w-3.5" aria-hidden="true" />{resolvedCount} resolved</li>
                                </ul>
                            )}
                        </DeskHeader>
                    </div>
                </div>

                <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 sm:px-6 sm:pb-6 lg:px-8">
                    <section className="elevated mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col overflow-hidden rounded-xl border border-border-light bg-surface">
                        {loading ? (
                            <div className="flex flex-1 items-center justify-center gap-2 py-16 text-sm text-text-secondary">
                                <LoaderCircle className="h-5 w-5 animate-spin text-sign-green" aria-hidden="true" />
                                Loading complaints…
                            </div>
                        ) : loadError ? (
                            <div role="alert" className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
                                <p className="font-semibold text-signal-red">Couldn&apos;t load complaints</p>
                                <p className="mt-1 text-sm text-text-secondary">The server returned an error. Refresh the page; if it keeps happening, check that the database is running.</p>
                                <button type="button" onClick={() => window.location.reload()} className="mt-4 rounded-lg bg-text-primary px-4 py-2 text-sm font-semibold text-neutral-background hover:opacity-90">Refresh</button>
                            </div>
                        ) : complaints.length === 0 ? (
                            <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
                                <span className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-sign-green/10 text-sign-green" aria-hidden="true">
                                    <ClipboardList className="h-7 w-7" />
                                </span>
                                <p className="font-semibold text-text-primary">No complaints to review</p>
                                <p className="mt-1 text-sm text-text-secondary">New citizen reports appear here as soon as they are submitted.</p>
                            </div>
                        ) : (
                            <div className="relative min-h-0 flex-1 overflow-auto">{/* relative: keeps the sr-only header label from widening the page */}
                                <table className="w-full min-w-[760px] text-left">
                                    <thead className="sticky top-0 z-10 border-b border-border-light bg-neutral-surface">
                                        <tr className="text-sm font-semibold text-text-secondary">
                                            <th scope="col" className={`${th} sm:pl-6`}>Report ID</th>
                                            <th scope="col" className={th}>Issue</th>
                                            <th scope="col" className={th}>Location</th>
                                            <th scope="col" className={th}>Reported by</th>
                                            <th scope="col" className={th}>Reported</th>
                                            <th scope="col" className={th}>Status</th>
                                            <th scope="col" className={`${th} sm:pr-6`}><span className="sr-only">Actions</span></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-light">
                                        {complaints.map(c => (
                                            <tr key={c.id} className={`text-sm transition-colors hover:bg-sign-green/5 ${c.id === highlightId ? 'bg-hazard/10' : ''}`}>
                                                <td className="relative max-w-[8rem] truncate px-4 py-3 font-mono text-xs text-text-secondary sm:pl-6" title={c.id}>
                                                    <RowStripe tone={complaintTone(c.status)} />
                                                    {c.id}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-2.5 font-semibold text-text-primary">
                                                    <span className="flex items-center gap-3">
                                                        <span className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-neutral-surface">
                                                            {c.evidenceUrl ? (
                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                <img src={c.evidenceUrl} alt="" width={40} height={40} loading="lazy" className="h-full w-full object-cover" />
                                                            ) : (
                                                                <ImageOff className="absolute inset-0 m-auto h-4 w-4 text-text-secondary" aria-hidden="true" />
                                                            )}
                                                        </span>
                                                        {c.issueType}
                                                    </span>
                                                </td>
                                                <td className="max-w-[220px] truncate px-4 py-3 text-text-secondary">
                                                    {c.street ? `${c.street}, ` : ''}{c.city}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{c.submittedBy}</td>
                                                <td className="whitespace-nowrap px-4 py-3 tabular-nums text-text-secondary">
                                                    {fmtDate(c.createdAt)}
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3">
                                                    <span className="flex items-center gap-1.5">
                                                        <StatusBadge status={c.status} />
                                                        {c.isDuplicate && <span className="rounded bg-signal-red/10 px-2 py-0.5 text-xs font-semibold text-signal-red">Duplicate</span>}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-3 text-right sm:pr-6">
                                                    <button
                                                        type="button"
                                                        onClick={() => openModal(c)}
                                                        className="inline-flex min-h-11 items-center rounded-lg border border-border-light px-3.5 text-sm font-semibold text-text-primary transition-colors hover:border-sign-green hover:bg-sign-green/5 hover:text-sign-green"
                                                    >
                                                        Manage<span className="sr-only"> {c.issueType} complaint</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </div>
            </main>

            {isModalOpen && selectedComplaint && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-asphalt/70 p-3 backdrop-blur-sm sm:p-4">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="manage-complaint-title"
                        className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-y-auto overscroll-contain rounded-xl bg-surface shadow-medium animate-pop md:flex-row"
                    >
                        <button
                            type="button"
                            onClick={closeModal}
                            aria-label="Close"
                            className="absolute right-3 top-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border-light bg-surface text-text-secondary transition-colors hover:bg-neutral-surface hover:text-text-primary"
                        >
                            <X className="h-5 w-5" aria-hidden="true" />
                        </button>

                        {/* Citizen report */}
                        <div className="border-b border-border-light bg-neutral-surface p-5 sm:p-6 md:w-1/2 md:border-b-0 md:border-r">
                            <h2 id="manage-complaint-title" className="pr-12 font-heading text-xl font-normal tracking-tighter">{selectedComplaint.issueType}</h2>
                            <p className="mt-0.5 break-all font-mono text-xs text-text-secondary">{selectedComplaint.id}</p>

                            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Report details">
                                <li><StatusBadge status={selectedComplaint.status} /></li>
                                {selectedComplaint.isDuplicate && (
                                    <li className="inline-flex items-center gap-1.5 rounded-full bg-signal-red/10 px-2.5 py-1 text-xs font-semibold text-signal-red"><Copy className="h-3.5 w-3.5" aria-hidden="true" />Duplicate</li>
                                )}
                                <li className={chip}><CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />{fmtDate(selectedComplaint.createdAt)}</li>
                                <li className={chip}><ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />{selectedComplaint.upvoteCount} upvotes</li>
                                {selectedComplaint.city && <li className={chip}><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{selectedComplaint.city}</li>}
                            </ul>

                            <div className="group relative mt-4 aspect-video overflow-hidden rounded-lg bg-asphalt">
                                {selectedComplaint.evidenceUrl ? (
                                    <a href={selectedComplaint.evidenceUrl} target="_blank" rel="noopener noreferrer" className="block h-full w-full" aria-label={`Open the citizen photo of ${selectedComplaint.issueType} full size in a new tab`}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={selectedComplaint.evidenceUrl} alt={`Citizen photo of ${selectedComplaint.issueType}`} className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-110 group-focus-within:scale-110" />
                                        <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded bg-black/70 px-2 py-1 text-xs font-semibold text-white" aria-hidden="true">
                                            <ZoomIn className="h-3.5 w-3.5" />Full size
                                        </span>
                                    </a>
                                ) : (
                                    <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-white/70">
                                        <ImageOff className="h-6 w-6" aria-hidden="true" />
                                        No photo attached
                                    </div>
                                )}
                            </div>

                            <dl className="mt-4 space-y-4 text-sm">
                                <div>
                                    <dt className="font-semibold text-text-secondary">Description</dt>
                                    <dd className="mt-0.5 text-text-primary">{selectedComplaint.description || 'No description given.'}</dd>
                                </div>
                                <div className="grid grid-cols-1 gap-4 border-t border-border-light pt-4 sm:grid-cols-2">
                                    <div>
                                        <dt className="font-semibold text-text-secondary">Location</dt>
                                        <dd className="mt-0.5">{selectedComplaint.street}, {selectedComplaint.city}, {selectedComplaint.state} {selectedComplaint.zipcode}</dd>
                                    </div>
                                    <div className="min-w-0">
                                        <dt className="font-semibold text-text-secondary">Reported by</dt>
                                        <dd className="mt-0.5 flex items-center gap-1.5 font-semibold"><User className="h-4 w-4 flex-shrink-0 text-text-secondary" aria-hidden="true" />{selectedComplaint.submittedBy}</dd>
                                        <dd className="break-all text-xs text-text-secondary">{selectedComplaint.submitterEmail}</dd>
                                    </div>
                                </div>
                            </dl>
                        </div>

                        {/* Desk actions */}
                        <div className="flex flex-col p-5 sm:p-6 md:w-1/2">
                            <h3 className="pr-12 font-heading text-lg font-bold">Update complaint</h3>

                            <div className="mt-4 flex-grow space-y-5">
                                <div>
                                    <label htmlFor="complaint-status" className={label}>Status</label>
                                    <select
                                        id="complaint-status"
                                        value={isDuplicate ? 'Rejected' : status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        disabled={isDuplicate}
                                        className={`${field} font-semibold disabled:bg-neutral-surface disabled:text-text-secondary`}
                                    >
                                        {/* Only the moves the server allows from the report's saved status. */}
                                        {[...new Set([...statusOptions(selectedComplaint.status as ComplaintStatus), ...(isDuplicate ? ['Rejected' as const] : [])])].map((s) => (
                                            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="rounded-md border border-border-light p-3">
                                    <label className="flex cursor-pointer items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={isDuplicate}
                                            onChange={(e) => setIsDuplicate(e.target.checked)}
                                            className="h-4 w-4 cursor-pointer accent-signal-red"
                                        />
                                        <span className="text-sm font-semibold">Mark as duplicate</span>
                                    </label>
                                    <p className="mt-1 pl-7 text-xs text-text-secondary">A duplicate is closed as Rejected.</p>

                                    {isDuplicate && (
                                        <div className="mt-3 border-t border-border-light pt-3">
                                            <label htmlFor="original-report-id" className={label}>Original report ID <span className="font-normal text-text-secondary">(optional)</span></label>
                                            <input
                                                id="original-report-id"
                                                type="text"
                                                value={originalReportId}
                                                onChange={(e) => setOriginalReportId(e.target.value)}
                                                className={`${field} font-mono`}
                                                placeholder="e.g. cm01xk…"
                                            />
                                        </div>
                                    )}
                                </div>

                                {(!isDuplicate && status === 'Completed') && (
                                    <div>
                                        <span className={label}>Resolution photo <span className="font-normal text-text-secondary">(required to complete)</span></span>
                                        {resolutionImageBase64 ? (
                                            <div className="relative aspect-video overflow-hidden rounded-md border border-border-light">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={resolutionImageBase64} alt="Resolution photo preview" className="h-full w-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => setResolutionImageBase64('')}
                                                    className="absolute right-2 top-2 rounded-md bg-asphalt/80 px-2 py-1 text-xs font-semibold text-white hover:bg-asphalt"
                                                >
                                                    Remove photo
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="flex cursor-pointer flex-col items-center rounded-md border-2 border-dashed border-border-light p-5 text-center transition-colors hover:border-sign-green focus-within:border-sign-green">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    className="sr-only"
                                                />
                                                <ImagePlus className="mb-1.5 h-6 w-6 text-sign-green" aria-hidden="true" />
                                                <span className="text-sm font-semibold">Upload resolution photo</span>
                                                <span className="mt-0.5 text-xs text-text-secondary">A photo of the repaired spot, JPG or PNG</span>
                                            </label>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <label htmlFor="complaint-remarks" className={label}>Remarks for the citizen</label>
                                    <textarea
                                        id="complaint-remarks"
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                        placeholder="Progress updates, or why the complaint was rejected"
                                        rows={4}
                                        className={`${field} resize-none`}
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-border-light pt-5 sm:flex-row sm:items-center sm:justify-between">
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={saving || deleting}
                                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-signal-red px-4 py-2.5 text-sm font-bold text-signal-red transition-colors hover:bg-signal-red hover:text-white disabled:opacity-50"
                                >
                                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                                    {deleting ? 'Deleting…' : 'Delete complaint'}
                                </button>
                                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="min-h-11 rounded-lg border border-border-light px-4 py-2.5 text-sm font-semibold text-text-primary hover:bg-neutral-surface"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSave}
                                        disabled={saving || deleting || (status === 'Completed' && !resolutionImageBase64)}
                                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-text-primary px-5 py-2.5 text-sm font-bold text-neutral-background transition-colors hover:opacity-90 disabled:opacity-50"
                                    >
                                        <Save className="h-4 w-4" aria-hidden="true" />
                                        {saving ? 'Saving…' : 'Save changes'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
