'use client';

import React, { useState, useSyncExternalStore } from 'react';
import { ChevronDown, Languages } from 'lucide-react';

// Language the user picked previously, read from Google Translate's cookie.
function readLanguageCookie() {
    const match = document.cookie.match(/googtrans=\/en\/([a-z]{2})/);
    return match && ['hi', 'mr'].includes(match[1]) ? match[1] : 'en';
}
const noopSubscribe = () => () => {};

export default function LanguageSwitcher() {
    // Server render and hydration use 'en'; the cookie value applies right after.
    const cookieLanguage = useSyncExternalStore(noopSubscribe, readLanguageCookie, () => 'en');
    const [chosenLanguage, setSelectedLanguage] = useState<string | null>(null);
    const selectedLanguage = chosenLanguage ?? cookieLanguage;

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const lang = e.target.value;
        setSelectedLanguage(lang);

        if (lang === 'en') {
            // Clear cookies completely to revert to raw English template
            document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=' + window.location.hostname + '; path=/;';
            document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.' + window.location.hostname + '; path=/;';
        } else {
            // Embed targeted sub-language
            document.cookie = `googtrans=/en/${lang}; path=/;`;
            document.cookie = `googtrans=/en/${lang}; domain=${window.location.hostname}; path=/;`;
        }

        // Execute dynamic reload so React successfully paints the translated DOM elements
        window.location.reload();
    };

    return (
        <div className="relative inline-flex items-center rounded-lg border border-border-light bg-surface hover:border-text-secondary transition-colors">
            <Languages className="pointer-events-none absolute left-2.5 w-4 h-4 text-text-secondary" aria-hidden="true" />
            <select
                aria-label="Language"
                value={selectedLanguage}
                onChange={handleChange}
                className="appearance-none bg-transparent pl-8 pr-7 py-2 text-sm font-semibold text-text-primary cursor-pointer rounded-lg"
            >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="mr">मराठी</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 w-4 h-4 text-text-secondary" aria-hidden="true" />
        </div>
    );
}
