'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';

export default function SecuritySettings() {
    const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const [show, setShow] = useState({ current: false, new_: false, confirm: false });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.newPassword !== form.confirmPassword) { toast.error('New passwords do not match.'); return; }
        if (form.newPassword.length < 8) { toast.error('Password must be at least 8 characters.'); return; }

        setLoading(true);
        try {
            const res = await fetch('/api/account/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            toast.success('Password updated successfully!');
            setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err: any) {
            toast.error(err.message || 'Failed to update password.');
        } finally {
            setLoading(false);
        }
    };

    const fields = [
        { key: 'currentPassword' as const, label: 'Current Password', showKey: 'current' as const },
        { key: 'newPassword' as const, label: 'New Password', showKey: 'new_' as const },
        { key: 'confirmPassword' as const, label: 'Confirm Password', showKey: 'confirm' as const },
    ];

    return (
        <div className="bg-white rounded-2xl shadow-soft border border-border-light overflow-hidden">
            <div className="px-6 py-4 border-b border-border-light">
                <h3 className="font-heading font-bold">Security Settings</h3>
                <p className="text-xs text-text-secondary mt-0.5">Change your account password</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {fields.map((f) => (
                    <div key={f.key} className="space-y-1.5">
                        <label className="text-xs font-bold uppercase text-text-secondary tracking-wider">{f.label}</label>
                        <div className="relative">
                            <input
                                type={show[f.showKey] ? 'text' : 'password'}
                                value={form[f.key]}
                                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                                required
                                placeholder="••••••••"
                                className="w-full px-4 py-3 pr-12 rounded-lg border border-border-light text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            />
                            <button
                                type="button"
                                onClick={() => setShow({ ...show, [f.showKey]: !show[f.showKey] })}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {show[f.showKey]
                                        ? <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></>
                                        : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                                    }
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
                <div className="pt-2">
                    <button type="submit" disabled={loading} className="px-5 py-2.5 bg-brand-primary hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60">
                        {loading ? 'Updating…' : 'Update Password'}
                    </button>
                </div>
            </form>
        </div>
    );
}
