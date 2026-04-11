'use client';

import React, { useEffect, useState } from 'react';

export default function LanguageSwitcher() {
    const [selectedLanguage, setSelectedLanguage] = useState('en');

    useEffect(() => {
        // Evaluate currently active cookie if user had selected a language previously
        const match = document.cookie.match(/googtrans=\/en\/([a-z]{2})/);
        if (match && match[1]) {
            if (['hi', 'mr'].includes(match[1])) setSelectedLanguage(match[1]);
        }
    }, []);

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
        <div className="relative inline-block mr-2 ml-4">
            <div className="flex items-center px-2 py-1 rounded-lg border border-border-light hover:border-brand-primary transition-colors bg-neutral-surface">
                <svg className="w-3.5 h-3.5 text-text-secondary mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                <select
                    value={selectedLanguage}
                    onChange={handleChange}
                    className="appearance-none bg-transparent text-xs font-semibold text-text-secondary hover:text-text-primary cursor-pointer outline-none transition-colors pr-4 uppercase tracking-wider"
                >
                    <option value="en" className="text-black font-sans">EN (English)</option>
                    <option value="hi" className="text-black font-sans">HI (हिन्दी)</option>
                    <option value="mr" className="text-black font-sans">MR (मराठी)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-text-secondary">
                    <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                    </svg>
                </div>
            </div>
        </div>
    );
}
