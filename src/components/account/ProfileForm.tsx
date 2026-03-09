'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';

interface UserProfile {
    fullName: string;
    email?: string;
    phone?: string;
    city?: string;
    state?: string;
}

interface ProfileFormProps {
    user: UserProfile;
    onSave: (updated: Partial<UserProfile>) => void;
}

export default function ProfileForm({ user, onSave }: ProfileFormProps) {
    const [form, setForm] = useState({ fullName: user.fullName, phone: user.phone ?? '', city: user.city ?? '', state: user.state ?? '' });
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/account/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            onSave(form);
            toast.success('Profile updated!');
            setEditing(false);
        } catch (err: any) {
            toast.error(err.message || 'Failed to save profile.');
        } finally {
            setLoading(false);
        }
    };

    const fields = [
        { key: 'fullName', label: 'Full Name', type: 'text', placeholder: 'Your full name' },
        { key: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+91 98765 43210' },
        { key: 'city', label: 'City', type: 'text', placeholder: 'Mumbai' },
        { key: 'state', label: 'State', type: 'text', placeholder: 'Maharashtra' },
    ] as const;

    return (
        <div className="bg-white rounded-2xl shadow-soft border border-border-light overflow-hidden">
            <div className="px-6 py-4 border-b border-border-light flex justify-between items-center">
                <div>
                    <h3 className="font-heading font-bold">Profile Information</h3>
                    <p className="text-xs text-text-secondary mt-0.5">Update your personal details</p>
                </div>
                {!editing && (
                    <button onClick={() => setEditing(true)} className="px-4 py-2 text-sm font-medium border border-border-light rounded-lg hover:border-brand-primary hover:text-brand-primary transition-all">
                        Edit Profile
                    </button>
                )}
            </div>
            <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Email — read-only */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-text-secondary tracking-wider">Email</label>
                        <div className="w-full px-4 py-3 rounded-lg border border-border-light bg-neutral-surface text-sm text-text-secondary">
                            {user.email ?? 'Not set'}
                        </div>
                    </div>
                    {fields.map((f) => (
                        <div key={f.key} className="space-y-1.5">
                            <label className="text-xs font-bold uppercase text-text-secondary tracking-wider">{f.label}</label>
                            <input
                                type={f.type}
                                value={form[f.key]}
                                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                                placeholder={f.placeholder}
                                disabled={!editing}
                                className={`w-full px-4 py-3 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary ${
                                    editing ? 'border-border-light bg-white' : 'border-border-light bg-neutral-surface text-text-secondary'
                                }`}
                            />
                        </div>
                    ))}
                </div>
                {editing && (
                    <div className="flex gap-3 mt-6">
                        <button type="submit" disabled={loading} className="px-5 py-2.5 bg-brand-primary hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60">
                            {loading ? 'Saving…' : 'Save Changes'}
                        </button>
                        <button type="button" onClick={() => { setEditing(false); setForm({ fullName: user.fullName, phone: user.phone ?? '', city: user.city ?? '', state: user.state ?? '' }); }} className="px-5 py-2.5 border border-border-light text-sm font-medium rounded-lg hover:border-gray-400 transition-colors">
                            Cancel
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
}
