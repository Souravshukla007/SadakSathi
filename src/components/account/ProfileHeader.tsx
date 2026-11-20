'use client';

import React, { useRef } from 'react';
import toast from 'react-hot-toast';
import { BadgeCheck, CalendarDays, Camera } from 'lucide-react';

interface User {
    fullName: string;
    email?: string;
    role?: string;
    profileImageUrl?: string;
    createdAt?: string;
}

interface ProfileHeaderProps {
    user: User;
    onAvatarChange: (url: string) => void;
}

// Server rejects avatars over 400,000 base64 chars (~300 KB); 290 KB keeps the encoded data URL under that.
const MAX_AVATAR_BYTES = 290 * 1024;
const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

export default function ProfileHeader({ user, onAvatarChange }: ProfileHeaderProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = (file: File) => {
        if (!AVATAR_TYPES.includes(file.type)) { toast.error('Choose a PNG, JPG, WEBP or GIF image.'); return; }
        if (file.size > MAX_AVATAR_BYTES) {
            toast.error(`This photo is ${Math.round(file.size / 1024)} KB. Profile photos must be under 290 KB: crop or resize it and try again.`);
            return;
        }

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
                toast.success('Profile photo updated');
            } catch (err) {
                toast.error((err instanceof Error && err.message) || 'Profile photo not saved. Try again.');
            }
        };
        reader.readAsDataURL(file);
    };

    const roleLabel: Record<string, string> = {
        user: 'Citizen',
        admin: 'Administrator',
        municipal: 'Municipal department',
        traffic: 'Traffic department',
    };

    const memberSince = user.createdAt
        ? new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date(user.createdAt))
        : null;

    return (
        <section aria-label="Profile" className="bg-surface rounded-xl border border-border-light elevated overflow-hidden">
            {/* Cover: the brand lavender wash */}
            <div className="h-24 sm:h-28 bg-gradient-to-r from-brand-secondary via-brand-primary to-brand-secondary/60" aria-hidden="true" />

            <div className="px-4 sm:px-6 pb-5 sm:pb-6 flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6">
                <div className="relative flex-shrink-0 -mt-12 sm:-mt-14">
                    <div className="rounded-full p-1 bg-sign-green elevated">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-neutral-surface ring-4 ring-surface flex items-center justify-center">
                            {user.profileImageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element -- dynamic data/API image
                                <img src={user.profileImageUrl} alt="Your profile photo" width={112} height={112} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl font-heading font-bold text-text-primary" aria-hidden="true">
                                    {user.fullName?.[0]?.toUpperCase() ?? 'U'}
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="absolute bottom-0 right-0 w-10 h-10 bg-asphalt text-white rounded-full flex items-center justify-center ring-4 ring-surface hover:bg-sign-green transition-colors"
                        aria-label="Change profile photo"
                    >
                        <Camera className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="hidden"
                        aria-label="Choose a profile photo"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
                    />
                </div>

                <div className="flex-1 min-w-0 sm:pb-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                        <h2 className="text-2xl font-heading font-normal tracking-tighter break-words">{user.fullName}</h2>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sign-green/10 text-sign-green text-xs font-semibold rounded">
                            <BadgeCheck className="w-3.5 h-3.5" aria-hidden="true" />
                            {roleLabel[user.role ?? 'user'] ?? user.role}
                        </span>
                    </div>
                    <p className="text-text-secondary text-sm break-all">{user.email ?? 'No email added'}</p>
                    {memberSince && (
                        <p className="text-text-secondary text-sm mt-1 inline-flex items-center gap-1.5">
                            <CalendarDays className="w-4 h-4" aria-hidden="true" />
                            Member since {memberSince}
                        </p>
                    )}
                </div>

                <div className="flex-shrink-0 sm:pb-1">
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="min-h-11 px-4 border border-border-light text-sm font-bold rounded-lg hover:border-border-dark transition-colors"
                    >
                        Change photo
                    </button>
                    <p className="text-xs text-text-secondary mt-1.5">PNG, JPG, WEBP or GIF, under 290&nbsp;KB</p>
                </div>
            </div>
        </section>
    );
}
