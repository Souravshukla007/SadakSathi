'use client';

import StaffChat from '@/components/traffic/StaffChat';

export default function MunicipalChatPage() {
    return <StaffChat desk="municipal" complaintHref={(id) => `/Municipal/complaints?highlight=${id}`} />;
}
