'use client';

import StaffChat from '@/components/traffic/StaffChat';

export default function TrafficChatPage() {
    return <StaffChat desk="traffic" complaintHref={(id) => `/dashboard?highlight=${id}`} />;
}
