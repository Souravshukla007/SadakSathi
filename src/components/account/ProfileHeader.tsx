'use client';

import React, { useRef } from 'react';
import toast from 'react-hot-toast';

interface User {
    fullName: string;
    email?: string;
    role?: string;
    profileImageUrl?: string;
}

interface ProfileHeaderProps {
    user: User;
    onAvatarChange: (url: string) => void;
}

export default function ProfileHeader({ user, onAvatarChange }: ProfileHeaderProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = (file: File) => {
        if (!file.type.startsWith('image/')) { toast.error('Please select an image file.'); return; }
        if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB.'); return; }

        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64 = e.target?.result as string;
            try {
                const res = await fetch('/api/account/upload-avatar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageBase64: base64 }),
                });
                if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
                onAvatarChange(base64);
                toast.success('Avatar updated!');
            } catch (err: any) {
                toast.error(err.message || 'Failed to upload avatar.');
            }
        };
        reader.readAsDataURL(file);
    };

    const roleLabel: Record<string, string> = {
        user: 'Citizen Contributor',
        admin: 'Administrator',
        municipal: 'Municipal Administrator',
        traffic: 'Traffic Department',
    };

    return (
        <div className="bg-white rounded-2xl shadow-soft border border-border-light p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-soft bg-brand-primary/10 flex items-center justify-center">
                        {user.profileImageUrl ? (
                            <img src={user.profileImageUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-3xl font-bold text-brand-primary">
                                {user.fullName?.[0]?.toUpperCase() ?? 'U'}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => inputRef.current?.click()}
                        className="absolute bottom-0 right-0 w-8 h-8 bg-text-primary text-white rounded-full flex items-center justify-center shadow-md hover:opacity-90 transition-opacity"
                        title="Upload photo"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                    />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-1">
                        <h2 className="text-2xl font-heading font-bold truncate">{user.fullName}</h2>
                        <span className="px-2.5 py-1 bg-brand-primary/10 text-brand-primary text-[10px] font-bold uppercase tracking-wider rounded">
                            {roleLabel[user.role ?? 'user'] ?? user.role}
                        </span>
                    </div>
                    <p className="text-text-secondary text-sm">{user.email ?? 'No email set'}</p>
                    <p className="text-text-secondary/60 text-xs mt-1 font-mono">Member of SadakSathi</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 flex-shrink-0">
                    <button
                        onClick={() => inputRef.current?.click()}
                        className="px-4 py-2 bg-text-primary text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                    >
                        Upload Photo
                    </button>
                </div>
            </div>
        </div>
    );
}
