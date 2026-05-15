'use client';

import React, { useEffect, useState } from 'react';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';
import { Suspense } from 'react';
import LogoutConfirmModal from '@/components/LogoutConfirmModal';

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
        <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading dashboard...</div>}>
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
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
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
                }
            } catch (error) {
                console.error(error);
                toast.error('Failed to load complaints');
            } finally {
                setLoading(false);
            }
        };
        fetchComplaints();
    }, [router]);

    useEffect(() => {
        if (highlightId && complaints.length > 0 && !isModalOpen) {
            const target = complaints.find(c => c.id === highlightId);
            if (target) {
                openModal(target);
            }
        }
    }, [highlightId, complaints]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    const openModal = (c: Complaint) => {
        setSelectedComplaint(c);
        setStatus(c.status);
        setRemarks(c.remarks || '');
        setIsDuplicate(c.isDuplicate);
        setOriginalReportId(c.originalReportId || '');
        setResolutionImageBase64(c.resolutionImageUrl || '');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedComplaint(null);
    };

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
            toast.error('Resolution Image is mandatory when completing a task.');
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
                toast.success('Complaint updated successfully');
                setComplaints(prev => prev.map(c => c.id === data.complaint.id ? { ...c, ...data.complaint } : c));
                closeModal();
            } else {
                const err = await res.json();
                toast.error(err.message || 'Failed to update');
            }
        } catch (error) {
            console.error(error);
            toast.error('Internal error occurred');
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
                toast.error('Failed to delete');
            }
        } catch (error) {
            console.error(error);
            toast.error('Internal error occurred');
        } finally {
            setDeleting(false);
        }
    };

    const statusStyle = (s: string) => {
        switch (s) {
            case "Submitted": return "bg-yellow-100 text-yellow-700";
            case "Approved": return "bg-blue-100 text-blue-700";
            case "OnHold": return "bg-orange-100 text-orange-700";
            case "Rejected": return "bg-red-100 text-red-700";
            case "Completed":
            case "ResolvedReviewed": return "bg-green-100 text-green-700";
            default: return "bg-gray-100 text-gray-600";
        }
    };

    return (
        <>
            <AppHeader dashboardMode={true} />
            <Toaster position="top-center" />
            <LogoutConfirmModal 
                isOpen={showLogoutConfirm} 
                onClose={() => setShowLogoutConfirm(false)} 
                onConfirm={handleLogout} 
            />
            <main className="flex-grow pt-16 h-screen flex flex-col bg-neutral-surface overflow-hidden">
                <div className="flex w-full h-full">

                    {/* Sidebar */}
                    <aside className="w-64 bg-text-primary text-white hidden lg:flex flex-col flex-shrink-0 relative z-[60]">
                        <div className="p-6 border-b border-white/10">
                            <div className="text-xl font-heading font-bold flex items-center gap-2">
                                <span className="text-2xl">🛣️</span> SadakSathi
                            </div>
                        </div>
                        <nav className="flex-grow p-4 space-y-1 overflow-y-auto custom-scrollbar">
                            <Link href="/Municipal" className="flex items-center gap-3 px-4 py-3 text-white opacity-70 hover:opacity-100 hover:bg-white/5 rounded-lg transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                Dashboard
                            </Link>
                            <Link href="/Municipal/complaints" className="flex items-center gap-3 px-4 py-3 bg-brand-primary text-text-primary font-bold rounded-lg transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                                Manage Complaints
                            </Link>
                            <Link href="/upload" className="flex items-center gap-3 px-4 py-3 text-white opacity-70 hover:opacity-100 hover:bg-white/5 rounded-lg transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                Run Detection
                            </Link>
                            <Link href="/results?engine=road" className="flex items-center gap-3 px-4 py-3 text-white opacity-70 hover:opacity-100 hover:bg-white/5 rounded-lg transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                Last Report
                            </Link>
                            <Link href="/Municipal/chat" className="flex items-center gap-3 px-4 py-3 text-white opacity-70 hover:opacity-100 hover:bg-white/5 rounded-lg transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                Chats
                            </Link>
                            <Link href="/Municipal/insights" className="flex items-center gap-3 px-4 py-3 text-white opacity-70 hover:opacity-100 hover:bg-white/5 rounded-lg transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                Insights
                            </Link>
                        </nav>
                        <div className="p-4 border-t border-white/10 mt-auto">
                            <button 
                                onClick={() => setShowLogoutConfirm(true)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-white opacity-70 hover:opacity-100 hover:bg-white/5 rounded-lg transition-all"
                            >
                                <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-text-primary font-bold">M</div>
                                <div className="min-w-0 text-left">
                                    <div className="text-xs font-bold truncate">Sign Out</div>
                                    <div className="text-[10px] opacity-60 truncate">Municipal Desk</div>
                                </div>
                            </button>
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <div className="flex-grow flex flex-col h-full overflow-hidden">
                        <div className="p-8 flex-shrink-0">
                            <div className="flex justify-between items-center max-w-7xl mx-auto">
                                <h1 className="text-3xl font-heading font-normal tracking-tight">Manage Complaints</h1>
                                <span className="text-sm font-bold text-text-primary">SADAKSATHI.AI</span>
                            </div>
                        </div>

                        {/* Data Table */}
                        <div className="flex-grow overflow-y-auto px-8 pb-8 custom-scrollbar">
                            <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-soft border border-border-light overflow-hidden h-full flex flex-col">
                                {loading ? (
                                    <div className="flex-grow flex justify-center items-center h-64">
                                        <div className="animate-spin w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full" />
                                    </div>
                                ) : complaints.length === 0 ? (
                                    <div className="flex-grow flex flex-col justify-center items-center h-64 text-text-secondary">
                                        <div className="text-4xl mb-4">📋</div>
                                        <p>No complaints found in the system.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-neutral-surface border-b border-border-light sticky top-0 z-10">
                                                <tr className="text-[10px] font-mono text-text-secondary uppercase">
                                                    <th className="px-6 py-4 whitespace-nowrap">ID</th>
                                                    <th className="px-6 py-4 whitespace-nowrap">Issue Type</th>
                                                    <th className="px-6 py-4">Location</th>
                                                    <th className="px-6 py-4 whitespace-nowrap">Reported By</th>
                                                    <th className="px-6 py-4 whitespace-nowrap">Status</th>
                                                    <th className="px-6 py-4 whitespace-nowrap">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border-light">
                                                {complaints.map(c => (
                                                    <tr key={c.id} className="hover:bg-neutral-surface transition-colors">
                                                        <td className="px-6 py-4 text-xs font-mono text-text-secondary max-w-[80px] truncate">{c.id}</td>
                                                        <td className="px-6 py-4 text-sm font-semibold text-text-primary whitespace-nowrap">{c.issueType}</td>
                                                        <td className="px-6 py-4 text-sm text-text-secondary max-w-[200px] truncate">
                                                            {c.street ? `${c.street}, ` : ''}{c.city}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-text-secondary whitespace-nowrap">{c.submittedBy}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${statusStyle(c.status)}`}>
                                                                {c.status === 'ResolvedReviewed' ? 'Resolved' : c.status}
                                                            </span>
                                                            {c.isDuplicate && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded font-bold uppercase">Duplicate</span>}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <button onClick={() => openModal(c)} className="text-sm font-bold text-brand-primary hover:underline">Manage →</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modal for Managing Complaint */}
            {isModalOpen && selectedComplaint && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row shadow-2xl relative">
                        
                        <button onClick={closeModal} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary bg-white rounded-full p-2 z-10 shadow-sm border border-border-light">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        {/* Left Side: Citizen Evidence */}
                        <div className="md:w-1/2 p-8 bg-neutral-surface/50 border-r border-border-light">
                            <h3 className="font-heading font-bold text-xl mb-6">Citizen Report</h3>
                            
                            <div className="aspect-video bg-black rounded-xl mb-6 overflow-hidden relative shadow-inner">
                                {selectedComplaint.evidenceUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={selectedComplaint.evidenceUrl} alt="Evidence" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-white/50 text-sm">No Image Provided</div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="text-[10px] font-mono uppercase text-text-secondary mb-1">Issue Details</div>
                                    <div className="font-bold text-lg">{selectedComplaint.issueType}</div>
                                    <p className="text-sm text-text-secondary mt-1">{selectedComplaint.description}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border-light">
                                    <div>
                                        <div className="text-[10px] font-mono uppercase text-text-secondary mb-1">Location</div>
                                        <div className="text-sm">{selectedComplaint.street}, {selectedComplaint.city}, {selectedComplaint.state} - {selectedComplaint.zipcode}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-mono uppercase text-text-secondary mb-1">Reported By</div>
                                        <div className="text-sm font-semibold">{selectedComplaint.submittedBy}</div>
                                        <div className="text-xs text-text-secondary">{selectedComplaint.submitterEmail}</div>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-mono uppercase text-text-secondary mb-1">Original Status</div>
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase inline-block ${statusStyle(selectedComplaint.status)}`}>
                                        {selectedComplaint.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Authority Actions */}
                        <div className="md:w-1/2 p-8 flex flex-col">
                            <h3 className="font-heading font-bold text-xl mb-6">Authority Actions</h3>
                            
                            <div className="space-y-6 flex-grow">
                                
                                {/* Duplicate Toggle */}
                                <div className="p-4 bg-red-50/50 border border-red-100 rounded-xl">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={isDuplicate}
                                            onChange={(e) => setIsDuplicate(e.target.checked)}
                                            className="w-5 h-5 rounded border-red-200 text-red-500 focus:ring-red-500 cursor-pointer"
                                        />
                                        <span className="font-bold text-red-700 text-sm">Mark as Duplicate Complaint</span>
                                    </label>
                                    
                                    {isDuplicate && (
                                        <div className="mt-4 pt-4 border-t border-red-100">
                                            <label className="block text-xs font-bold text-red-700 mb-2">Original Report ID (Optional)</label>
                                            <input 
                                                type="text"
                                                value={originalReportId}
                                                onChange={(e) => setOriginalReportId(e.target.value)}
                                                className="w-full px-3 py-2 text-sm border border-red-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 bg-white"
                                                placeholder="e.g. cm01xk..."
                                            />
                                            <p className="text-[10px] text-red-500 mt-2">Checking this will automatically set the status to Rejected.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Status Update */}
                                <div>
                                    <label className="block text-xs font-mono font-bold text-text-secondary uppercase mb-2">Update Status</label>
                                    <select
                                        value={isDuplicate ? 'Rejected' : status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        disabled={isDuplicate}
                                        className="w-full px-4 py-3 bg-neutral-surface border border-border-light rounded-xl focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-sm font-semibold disabled:opacity-50"
                                    >
                                        <option value="Submitted">Submitted</option>
                                        <option value="Approved">Approved (Task Created)</option>
                                        <option value="OnHold">On Hold</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Rejected">Rejected</option>
                                    </select>
                                </div>

                                {/* Image Upload if Completed */}
                                {(!isDuplicate && status === 'Completed') && (
                                    <div className="p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-xl">
                                        <label className="block text-xs font-bold text-text-primary mb-2">Mandatory Resolution Image</label>
                                        {resolutionImageBase64 ? (
                                            <div className="relative aspect-video rounded-lg overflow-hidden border border-border-light mb-3">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={resolutionImageBase64} alt="Resolution Preview" className="w-full h-full object-cover" />
                                                <button 
                                                    onClick={() => setResolutionImageBase64('')}
                                                    className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-md text-xs hover:bg-red-500 transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="border-2 border-dashed border-border-light rounded-lg p-6 text-center hover:border-brand-primary hover:bg-brand-primary/5 transition-colors cursor-pointer relative">
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    onChange={handleImageUpload}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                />
                                                <svg className="w-8 h-8 mx-auto text-brand-primary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                <p className="text-sm font-semibold">Click to upload resolution evidence</p>
                                                <p className="text-xs text-text-secondary mt-1">Image must be a valid file format</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Remarks Textarea */}
                                <div>
                                    <label className="block text-xs font-mono font-bold text-text-secondary uppercase mb-2">Authority Remarks</label>
                                    <textarea
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                        placeholder="Add notes, updates, or reasons for rejection..."
                                        rows={4}
                                        className="w-full px-4 py-3 bg-neutral-surface border border-border-light rounded-xl focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-sm resize-none custom-scrollbar"
                                    />
                                </div>
                            </div>

                            {/* Actions Footer */}
                            <div className="mt-8 pt-6 border-t border-border-light flex items-center justify-between">
                                <button 
                                    onClick={handleDelete}
                                    disabled={saving || deleting}
                                    className="text-red-500 text-sm font-bold px-4 py-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {deleting ? 'Deleting...' : 'Delete Complaint'}
                                </button>
                                
                                <button 
                                    onClick={handleSave}
                                    disabled={saving || deleting || (status === 'Completed' && !resolutionImageBase64)}
                                    className="bg-brand-primary text-text-primary font-bold px-6 py-3 rounded-xl hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                    {!saving && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
