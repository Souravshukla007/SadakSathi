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
            toast.success('Profile saved');
            setEditing(false);
        } catch (err) {
            toast.error((err instanceof Error && err.message) || 'Profile not saved. Check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const fields = [
        { key: 'fullName', label: 'Full name', type: 'text', placeholder: 'Your full name' },
        { key: 'phone', label: 'Phone number', type: 'tel', placeholder: '+91 98765 43210' },
        { key: 'city', label: 'City', type: 'text', placeholder: 'Mumbai' },
        { key: 'state', label: 'State', type: 'text', placeholder: 'Maharashtra' },
    ] as const;

    const resetForm = () => setForm({ fullName: user.fullName, phone: user.phone ?? '', city: user.city ?? '', state: user.state ?? '' });
    const fieldClass = 'w-full px-3.5 py-2.5 rounded-lg border border-border-light text-base sm:text-sm focus:outline-none focus:border-sign-green';

    return (
        <div className="bg-surface rounded-xl border border-border-light elevated">
            <div className="px-4 sm:px-6 py-4 border-b border-border-light flex justify-between items-center gap-3">
                <div>
                    <h3 className="font-heading font-bold">Profile details</h3>
                    <p className="text-sm text-text-secondary mt-0.5">Your name, phone number and location</p>
                </div>
                {!editing && (
                    <button type="button" onClick={() => setEditing(true)} className="flex-shrink-0 min-h-11 px-4 text-sm font-bold border border-border-light rounded-lg hover:border-border-dark transition-colors">
                        Edit
                    </button>
                )}
            </div>
            <form onSubmit={handleSubmit} className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label htmlFor="profile-email" className="block text-sm font-semibold text-text-primary">Email</label>
                        <input
                            id="profile-email"
                            type="email"
                            readOnly
                            value={user.email ?? 'Not added'}
                            className={`${fieldClass} bg-neutral-surface text-text-secondary`}
                        />
                    </div>
                    {fields.map((f) => (
                        <div key={f.key} className="space-y-1.5">
                            <label htmlFor={`profile-${f.key}`} className="block text-sm font-semibold text-text-primary">{f.label}</label>
                            <input
                                id={`profile-${f.key}`}
                                type={f.type}
                                value={form[f.key]}
                                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                                placeholder={f.placeholder}
                                disabled={!editing}
                                className={`${fieldClass} ${editing ? 'bg-surface' : 'bg-neutral-surface text-text-secondary'}`}
                            />
                        </div>
                    ))}
                </div>
                {editing && (
                    <div className="flex gap-3 mt-6">
                        <button type="submit" disabled={loading} className="min-h-11 px-5 bg-text-primary hover:opacity-90 text-neutral-background text-sm font-bold rounded-lg transition-colors disabled:opacity-60">
                            {loading ? 'Saving…' : 'Save changes'}
                        </button>
                        <button type="button" onClick={() => { setEditing(false); resetForm(); }} className="min-h-11 px-5 border border-border-light text-sm font-bold rounded-lg hover:border-border-dark transition-colors">
                            Cancel
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
}
