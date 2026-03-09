'use client';

import React, { useState, useEffect } from 'react';

const PREFS = [
    { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive status updates via email.' },
    { key: 'complaintUpdates', label: 'Complaint Updates', desc: 'Get notified when your complaint status changes.' },
    { key: 'trafficAlerts', label: 'Traffic Alerts', desc: 'Receive alerts for high-violation zones near you.' },
];

export default function NotificationSettings() {
    const [prefs, setPrefs] = useState<Record<string, boolean>>({
        emailNotifications: true, complaintUpdates: true, trafficAlerts: false,
    });

    useEffect(() => {
        try {
            const saved = localStorage.getItem('sadaksathi_notif_prefs');
            if (saved) setPrefs(JSON.parse(saved));
        } catch {}
    }, []);

    const toggle = (key: string) => {
        const next = { ...prefs, [key]: !prefs[key] };
        setPrefs(next);
        try { localStorage.setItem('sadaksathi_notif_prefs', JSON.stringify(next)); } catch {}
    };

    return (
        <div className="bg-white rounded-2xl shadow-soft border border-border-light overflow-hidden">
            <div className="px-6 py-4 border-b border-border-light">
                <h3 className="font-heading font-bold">Notification Preferences</h3>
                <p className="text-xs text-text-secondary mt-0.5">Choose what you want to hear about</p>
            </div>
            <div className="p-6 space-y-4">
                {PREFS.map((p) => (
                    <div key={p.key} className="flex items-center justify-between py-3 border-b border-border-light last:border-0">
                        <div>
                            <div className="text-sm font-medium">{p.label}</div>
                            <div className="text-xs text-text-secondary mt-0.5">{p.desc}</div>
                        </div>
                        <button
                            role="switch"
                            aria-checked={prefs[p.key]}
                            onClick={() => toggle(p.key)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-4 ${prefs[p.key] ? 'bg-brand-primary' : 'bg-gray-200'}`}
                        >
                            <span className={`inline-block w-4 h-4 transform bg-white rounded-full shadow transition-transform ${prefs[p.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
