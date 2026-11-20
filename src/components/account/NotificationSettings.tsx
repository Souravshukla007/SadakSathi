'use client';

import React, { useState } from 'react';

const PREFS = [
    { key: 'emailNotifications', label: 'Email updates', desc: 'Get status updates by email.' },
    { key: 'complaintUpdates', label: 'Report status changes', desc: 'Hear when a department approves, rejects or resolves your report.' },
    { key: 'trafficAlerts', label: 'Traffic alerts', desc: 'Get alerts about areas near you with many violations.' },
];

export default function NotificationSettings() {
    // Lazy init is hydration-safe: my-account mounts this only after its client-side profile fetch.
    const [prefs, setPrefs] = useState<Record<string, boolean>>(() => {
        try {
            const saved = typeof window !== 'undefined' ? localStorage.getItem('sadaksathi_notif_prefs') : null;
            if (saved) return JSON.parse(saved);
        } catch {}
        return { emailNotifications: true, complaintUpdates: true, trafficAlerts: false };
    });

    const toggle = (key: string) => {
        const next = { ...prefs, [key]: !prefs[key] };
        setPrefs(next);
        try { localStorage.setItem('sadaksathi_notif_prefs', JSON.stringify(next)); } catch {}
    };

    return (
        <div className="bg-surface rounded-xl border border-border-light elevated">
            <div className="px-4 sm:px-6 py-4 border-b border-border-light">
                <h3 className="font-heading font-bold">Notifications</h3>
                <p className="text-sm text-text-secondary mt-0.5">Saved on this device</p>
            </div>
            <ul className="px-4 sm:px-6 divide-y divide-border-light">
                {PREFS.map((p) => (
                    <li key={p.key} className="flex items-center justify-between gap-4 py-4">
                        <div>
                            <div id={`pref-${p.key}`} className="text-sm font-semibold">{p.label}</div>
                            <div className="text-sm text-text-secondary mt-0.5">{p.desc}</div>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={prefs[p.key]}
                            aria-labelledby={`pref-${p.key}`}
                            onClick={() => toggle(p.key)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${prefs[p.key] ? 'bg-sign-green' : 'bg-asphalt/30'}`}
                        >
                            <span className={`inline-block w-4 h-4 transform bg-surface rounded-full transition-transform ${prefs[p.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
