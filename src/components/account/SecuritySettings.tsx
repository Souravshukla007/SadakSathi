'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

export default function SecuritySettings() {
    const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const [show, setShow] = useState({ current: false, new_: false, confirm: false });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.newPassword !== form.confirmPassword) { toast.error('The new passwords do not match. Type the same password in both fields.'); return; }
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
            toast.success('Password changed');
            setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            toast.error((err instanceof Error && err.message) || 'Password not changed. Check your current password and try again.');
        } finally {
            setLoading(false);
        }
    };

    const fields = [
        { key: 'currentPassword' as const, label: 'Current password', showKey: 'current' as const, autoComplete: 'current-password' },
        { key: 'newPassword' as const, label: 'New password', showKey: 'new_' as const, autoComplete: 'new-password' },
        { key: 'confirmPassword' as const, label: 'Confirm new password', showKey: 'confirm' as const, autoComplete: 'new-password' },
    ];

    return (
        <div className="bg-surface rounded-xl border border-border-light elevated">
            <div className="px-4 sm:px-6 py-4 border-b border-border-light">
                <h3 className="font-heading font-bold">Password</h3>
                <p className="text-sm text-text-secondary mt-0.5">Use at least 8 characters</p>
            </div>
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                {fields.map((f) => (
                    <div key={f.key} className="space-y-1.5">
                        <label htmlFor={`security-${f.key}`} className="block text-sm font-semibold text-text-primary">{f.label}</label>
                        <div className="relative">
                            <input
                                id={`security-${f.key}`}
                                type={show[f.showKey] ? 'text' : 'password'}
                                value={form[f.key]}
                                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                                required
                                autoComplete={f.autoComplete}
                                className="w-full px-3.5 py-2.5 pr-11 rounded-lg border border-border-light text-base sm:text-sm focus:outline-none focus:border-sign-green"
                            />
                            <button
                                type="button"
                                onClick={() => setShow({ ...show, [f.showKey]: !show[f.showKey] })}
                                aria-label={show[f.showKey] ? `Hide ${f.label.toLowerCase()}` : `Show ${f.label.toLowerCase()}`}
                                className="absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 grid place-items-center rounded text-text-secondary hover:text-text-primary"
                            >
                                {show[f.showKey] ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                            </button>
                        </div>
                    </div>
                ))}
                <div className="pt-1">
                    <button type="submit" disabled={loading} className="min-h-11 px-5 bg-text-primary hover:opacity-90 text-neutral-background text-sm font-bold rounded-lg transition-colors disabled:opacity-60">
                        {loading ? 'Changing password…' : 'Change password'}
                    </button>
                </div>
            </form>
        </div>
    );
}
