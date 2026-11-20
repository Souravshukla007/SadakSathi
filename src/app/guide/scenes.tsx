/**
 * Decorative, looping mocks of the real screens, one per guide step.
 * They are aria-hidden: the instruction always sits in the text beside them.
 */
import { Camera, Check, ChevronDown, ImageUp, LocateFixed, MessageSquare, Send, ThumbsUp } from "lucide-react";
import { LABELS as L } from "./labels";
import s from "./guide.module.css";

type Tone = "high" | "medium" | "low";

const PILL = "inline-flex items-center whitespace-nowrap rounded px-2 py-0.5 text-[11px] font-semibold";
const PILL_TONE = {
    amber: "bg-hazard/15 text-hazard-ink",
    neutral: "bg-surface text-text-primary border border-border-dark",
    green: "bg-sign-green/10 text-sign-green",
    red: "bg-signal-red/10 text-signal-red",
};
const BUTTON = "inline-block rounded-md bg-text-primary px-3 py-1.5 text-center text-xs font-bold text-neutral-background";
const MINI_LABEL = "block text-[11px] font-semibold text-text-primary";

function Scene({ children }: { children: React.ReactNode }) {
    return (
        <div
            data-scene
            aria-hidden="true"
            className={`${s.scene} relative flex h-80 select-none items-center justify-center overflow-hidden rounded-lg border border-border-light bg-neutral-surface p-4 sm:p-6`}
        >
            {children}
        </div>
    );
}

function Card({ children, className = "max-w-sm" }: { children: React.ReactNode; className?: string }) {
    return <div className={`w-full rounded-md border border-border-light bg-surface p-3 shadow-soft sm:p-4 ${className}`}>{children}</div>;
}

/** Staff screens: the asphalt desk menu on the left, content on the right. */
function StaffFrame({ children, active }: { children: React.ReactNode; active: number }) {
    return (
        <div className="flex w-full max-w-md overflow-hidden rounded-md border border-border-light bg-surface shadow-soft">
            <div className="flex w-9 shrink-0 flex-col items-center gap-2 bg-asphalt py-3">
                <span className="mb-1 size-5 rounded-sm bg-sign-green shadow-[inset_0_0_0_1.5px_var(--color-sign-green),inset_0_0_0_2.5px_#fff]" />
                {[0, 1, 2, 3].map((i) => (
                    <span key={i} className={`h-1.5 w-4 rounded-full ${i === active ? "bg-surface" : "bg-white/30"}`} />
                ))}
            </div>
            <div className="min-w-0 flex-1 p-3 sm:p-4">{children}</div>
        </div>
    );
}

function Field({ label, value, anim = "", select = false, mono = false }: { label: string; value: React.ReactNode; anim?: string; select?: boolean; mono?: boolean }) {
    return (
        <div className="min-w-0">
            <span className={MINI_LABEL}>{label}</span>
            <span className={`mt-1 flex h-7 items-center justify-between gap-1 overflow-hidden whitespace-nowrap rounded-md border border-border-light bg-surface px-2 text-xs text-text-primary ${mono ? "font-mono" : ""}`}>
                <span className={`min-w-0 ${anim}`}>{value}</span>
                {select && <ChevronDown className="size-3.5 shrink-0 text-text-secondary" />}
            </span>
        </div>
    );
}

/** Two values in the same spot; the CSS crossfades from the first to the second. */
function Swap({ before, after, beforeClass, afterClass }: { before: React.ReactNode; after: React.ReactNode; beforeClass: string; afterClass: string }) {
    return (
        <span className="grid">
            <span className={`col-start-1 row-start-1 truncate ${beforeClass}`}>{before}</span>
            <span className={`col-start-1 row-start-1 truncate ${afterClass}`}>{after}</span>
        </span>
    );
}

/** A street photo with a deep pothole, a small one, and a garbage pile on the verge. */
function RoadPhoto({ fixed = false }: { fixed?: boolean }) {
    return (
        <svg viewBox="0 0 320 200" preserveAspectRatio="none" className="absolute inset-0 size-full">
            <rect width="320" height="200" fill="#C9D3BF" />
            <rect width="320" height="38" fill="#E9ECE6" />
            <polygon points="60,60 260,60 330,200 -10,200" fill="#50565E" />
            <polyline points="68,60 5,200" stroke="#D9DCD5" strokeWidth="2" fill="none" />
            <polyline points="252,60 315,200" stroke="#D9DCD5" strokeWidth="2" fill="none" />
            <g fill="#F1F2EF">
                <polygon points="159,64 161,64 162,76 158,76" />
                <polygon points="158,90 162,90 163,108 157,108" />
                <polygon points="156,126 164,126 165,150 155,150" />
                <polygon points="154,170 166,170 168,200 152,200" />
            </g>
            {fixed ? (
                <rect x="80" y="136" width="80" height="28" rx="6" fill="#3E444B" stroke="#6B7079" strokeWidth="1.5" />
            ) : (
                <g>
                    <ellipse cx="120" cy="150" rx="38" ry="14" fill="#2A2E33" stroke="#7A8088" strokeWidth="1.5" />
                    <ellipse cx="120" cy="152" rx="28" ry="8" fill="#16191C" />
                </g>
            )}
            <ellipse cx="220" cy="98" rx="13" ry="5" fill="#2A2E33" stroke="#7A8088" strokeWidth="1" />
            <g>
                <circle cx="18" cy="90" r="9" fill="#8A7F6A" />
                <circle cx="31" cy="85" r="8" fill="#A39478" />
                <circle cx="27" cy="96" r="7" fill="#6E6656" />
                <circle cx="11" cy="97" r="6" fill="#B5A88C" />
            </g>
        </svg>
    );
}

/** Side view of a motorbike with three riders, one with a helmet. */
function BikeFrame() {
    return (
        <svg viewBox="0 0 320 200" preserveAspectRatio="none" className="absolute inset-0 size-full">
            <rect width="320" height="200" fill="#8A9097" />
            <rect width="320" height="46" fill="#C9D3BF" />
            <g fill="#F1F2EF">
                <rect x="0" y="182" width="40" height="5" />
                <rect x="80" y="182" width="40" height="5" />
                <rect x="160" y="182" width="40" height="5" />
                <rect x="240" y="182" width="40" height="5" />
            </g>
            <circle cx="125" cy="158" r="20" fill="#2A2E33" stroke="#1F2328" strokeWidth="6" />
            <circle cx="212" cy="158" r="20" fill="#2A2E33" stroke="#1F2328" strokeWidth="6" />
            <path d="M125 158 L150 128 L200 126 L212 158 Z" fill="#1F2328" />
            <rect x="196" y="112" width="8" height="18" rx="2" fill="#1F2328" />
            <rect x="112" y="138" width="24" height="9" rx="1" fill="#fff" stroke="#1F2328" strokeWidth="1.5" />
            <rect x="122" y="92" width="18" height="40" rx="6" fill="#8C6A5A" />
            <rect x="142" y="90" width="18" height="42" rx="6" fill="#B9A27E" />
            <rect x="162" y="88" width="20" height="42" rx="6" fill="#E8E6DF" />
            <circle cx="131" cy="80" r="10" fill="#8E5E3E" />
            <circle cx="151" cy="78" r="10" fill="#A8754F" />
            <path d="M144 74 a8 6 0 0 1 15 0 z" fill="#1F2328" />
            <circle cx="172" cy="76" r="12" fill="#1F2328" />
            <rect x="172" y="72" width="11" height="6" rx="2" fill="#5B616B" />
        </svg>
    );
}

const BOX_TONE: Record<Tone, { box: string; tag: string }> = {
    high: { box: "border-signal-red", tag: "bg-signal-red text-white" },
    medium: { box: "border-hazard", tag: "bg-hazard text-asphalt" },
    low: { box: "border-white", tag: "bg-surface text-text-primary" },
};

function Box({ pos, tone, tag, className, below = false }: { pos: React.CSSProperties; tone: Tone; tag: string; className: string; below?: boolean }) {
    const t = BOX_TONE[tone];
    return (
        <span className={`absolute rounded-sm border-2 ${t.box} ${className}`} style={pos}>
            <span className={`absolute left-[-2px] whitespace-nowrap rounded-sm px-1 text-[10px] font-bold leading-4 ${t.tag} ${below ? "top-full mt-0.5" : "bottom-full mb-0.5"}`}>
                {tag}
            </span>
        </span>
    );
}

function Pin({ className = "", color = "#4F5DB0" }: { className?: string; color?: string }) {
    return (
        <svg viewBox="0 0 24 32" className={`block h-8 w-6 drop-shadow-sm ${className}`}>
            <path d="M12 31s10-11.2 10-19A10 10 0 0 0 2 12c0 7.8 10 19 10 19z" fill={color} stroke="#fff" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="3.5" fill="#fff" />
        </svg>
    );
}

function MapTile() {
    return (
        <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
            <rect width="200" height="200" fill="#E6E9E2" />
            <rect x="120" y="120" width="70" height="60" rx="4" fill="#D3DDC8" />
            <g stroke="#fff" fill="none" strokeLinecap="round">
                <path d="M-10 80 H210" strokeWidth="12" />
                <path d="M70 -10 V210" strokeWidth="10" />
                <path d="M-10 170 L210 40" strokeWidth="7" />
                <path d="M140 -10 V90" strokeWidth="5" />
            </g>
        </svg>
    );
}

/* ---------------- Citizens ---------------- */

export function AccountScene() {
    return (
        <Scene>
            <Card className="max-w-xs">
                <div className="flex rounded-md border border-border-light bg-neutral-surface p-0.5 text-xs font-semibold">
                    <span className="flex-1 rounded bg-surface py-1 text-center shadow-soft">{L.tabLogIn}</span>
                    <span className="flex-1 py-1 text-center text-text-secondary">{L.tabSignUp}</span>
                </div>
                <div className="mt-3 space-y-2.5">
                    <Field label={L.logInAs} value={L.roleCitizen} select />
                    <Field label={L.usernameOrEmail} value="asha@example.com" anim={s.typeEarly} />
                    <Field label={L.password} value="••••••••••" anim={s.typeMid} />
                </div>
                <span className={`${BUTTON} ${s.press} mt-3 block w-full`}>{L.logInButton}</span>
            </Card>
        </Scene>
    );
}

export function PhotoScene() {
    return (
        <Scene>
            <Card>
                <div className="flex border-b border-border-light text-xs font-semibold">
                    <span className="-mb-px border-b-2 border-sign-green px-3 pb-1.5 text-sign-green">{L.mediaPhoto}</span>
                    <span className="px-3 pb-1.5 text-text-secondary">{L.mediaVideo}</span>
                </div>
                <div className="relative mt-3 flex h-36 flex-col items-center justify-center gap-1.5 rounded-md border-2 border-dashed border-border-light text-xs">
                    <Camera className="size-5 text-text-secondary" />
                    <span className="font-bold">{L.uploadPhoto}</span>
                    <span className="rounded-md bg-asphalt px-3 py-1 font-bold text-white">{L.chooseFile}</span>
                    <div className={`${s.photoLand} absolute inset-1 overflow-hidden rounded shadow-medium`}>
                        <RoadPhoto />
                    </div>
                </div>
                <span className={`${BUTTON} ${s.press} mt-3 block w-full`}>{L.scanHazards}</span>
            </Card>
            <div className={`${s.flash} pointer-events-none absolute inset-0 bg-surface`} />
        </Scene>
    );
}

export function DetectScene() {
    return (
        <Scene>
            <Card>
                <p className="font-heading text-sm font-bold">{L.scanResult}</p>
                <div className="relative mx-auto mt-2 aspect-[8/5] h-40 max-w-full overflow-hidden rounded">
                    <RoadPhoto />
                    <span className={`${s.scanLine} absolute inset-x-0 h-0.5 bg-hazard`} />
                    <Box className={s.popAt45} tone="high" tag="Pothole · High" pos={{ left: "24%", top: "64%", width: "27%", height: "22%" }} />
                    <Box className={s.popAt50} tone="medium" tag="Garbage pile · Medium" pos={{ left: "1.5%", top: "37%", width: "12%", height: "15%" }} />
                    <Box className={s.popAt56} tone="low" tag="Pothole · Low" pos={{ left: "63%", top: "44%", width: "11%", height: "9%" }} />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-text-secondary">{L.overallPriority}</span>
                    <span className={`${PILL} ${PILL_TONE.red} ${s.popAt62}`}>High</span>
                </div>
            </Card>
        </Scene>
    );
}

export function LocationScene() {
    return (
        <Scene>
            <Card className="max-w-md">
                <div className="flex gap-3">
                    <div className="min-w-0 flex-1 space-y-2">
                        <span className={MINI_LABEL}>{L.whereIsIt}</span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sign-green">
                            <LocateFixed className="size-3" />
                            {L.useMyLocation}
                        </span>
                        <Field label={L.street} value="MG Road near Signal No. 5" anim={s.typeEarly} />
                        <div className="grid grid-cols-2 gap-2">
                            <Field label={L.city} value="Pune" anim={s.typeMid} />
                            <Field label={L.pincode} value="411001" anim={s.typeLate} />
                        </div>
                        <span className={`${BUTTON} ${s.press} block w-full`}>{L.sendReport}</span>
                    </div>
                    <div className="relative w-24 shrink-0 overflow-hidden rounded-md border border-border-light sm:w-36">
                        <MapTile />
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
                            <Pin className={s.pinDrop} />
                        </div>
                    </div>
                </div>
            </Card>
        </Scene>
    );
}

export function DuplicateScene() {
    return (
        <Scene>
            <div className="relative h-full w-full max-w-sm overflow-hidden rounded-md border border-border-light bg-surface shadow-soft">
                <MapTile />
                <div className="absolute left-1/2 top-[44%] size-40 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-asphalt/60 bg-sign-green/5">
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded bg-surface px-1.5 text-[11px] font-bold text-text-primary">100 m</span>
                </div>
                <div className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-full">
                    <Pin />
                    <span className={`${s.popAt62} absolute -right-2.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-asphalt text-[11px] font-bold text-white`}>2</span>
                </div>
                <div className="absolute left-[calc(50%+44px)] top-[calc(44%+26px)] -translate-x-1/2 -translate-y-full">
                    <Pin className={s.pinMerge} color="#F5B700" />
                </div>
                <span className={`${s.popAt62} absolute inset-x-3 bottom-3 rounded-md border border-border-light bg-surface px-3 py-2 text-xs font-semibold text-text-primary shadow-soft`}>
                    Your report is linked to the earlier one
                </span>
            </div>
        </Scene>
    );
}

export function TrackScene() {
    return (
        <Scene>
            <Card>
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-sm font-bold">Pothole</p>
                        <p className="truncate text-xs text-text-secondary">MG Road near Signal No. 5, Pune</p>
                    </div>
                    <span className="grid shrink-0 justify-items-end">
                        <span className={`col-start-1 row-start-1 ${PILL} ${PILL_TONE.amber} ${s.pillSubmitted}`}>{L.statusSubmitted}</span>
                        <span className={`col-start-1 row-start-1 ${PILL} ${PILL_TONE.neutral} ${s.pillApproved}`}>{L.statusApproved}</span>
                        <span className={`col-start-1 row-start-1 ${PILL} ${PILL_TONE.green} ${s.pillCompleted}`}>{L.statusCompleted}</span>
                    </span>
                </div>
                <div className="mt-4">
                    <div className="relative h-1.5 overflow-hidden rounded-full bg-border-light">
                        <span className={`${s.progress} absolute inset-0 rounded-full bg-sign-green`} />
                    </div>
                    <div className="mt-1.5 flex justify-between text-[11px] font-semibold text-text-secondary">
                        <span>{L.statusSubmitted}</span>
                        <span>{L.statusApproved}</span>
                        <span>{L.statusCompleted}</span>
                    </div>
                </div>
                <p className="mt-4 rounded-md bg-neutral-surface p-2.5 text-xs leading-relaxed">
                    <span className="font-semibold">{L.departmentRemarks}: </span>
                    Patched on Friday. Thanks for reporting it.
                </p>
                <div className="mt-3 flex items-center justify-between gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-md border border-border-light px-2 py-1 font-semibold">
                        <ThumbsUp className="size-3.5" />
                        14
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-sign-green">
                        <MessageSquare className="size-3.5" />
                        {L.supportChat}
                    </span>
                </div>
            </Card>
        </Scene>
    );
}

/* ---------------- Municipal desk ---------------- */

const ROWS = [
    { id: "cm01xk…", issue: "Open manhole", status: L.statusApproved, tone: PILL_TONE.neutral },
    { id: "cm02pq…", issue: "Pothole", status: L.statusSubmitted, tone: PILL_TONE.amber, picked: true },
    { id: "cm03rt…", issue: "Garbage pile", status: L.statusCompleted, tone: PILL_TONE.green },
];

export function ListScene() {
    return (
        <Scene>
            <StaffFrame active={1}>
                <p className="font-heading text-sm font-bold">{L.complaintsTitle}</p>
                <p className="text-[11px] text-text-secondary">3 in total, 1 waiting for review</p>
                <ul className="mt-3 divide-y divide-border-light border-y border-border-light text-xs">
                    {ROWS.map((r) => (
                        <li key={r.id} className={`flex items-center gap-2 px-1.5 py-2.5 ${r.picked ? s.rowPick : ""}`}>
                            <span className="hidden w-14 shrink-0 font-mono text-[10px] text-text-secondary sm:block">{r.id}</span>
                            <span className="min-w-0 flex-1 truncate font-semibold">{r.issue}</span>
                            <span className={`${PILL} ${r.tone}`}>{r.status}</span>
                            <span className={`rounded border border-border-light bg-surface px-1.5 py-0.5 text-[11px] font-semibold ${r.picked ? s.press : ""}`}>{L.manage}</span>
                        </li>
                    ))}
                </ul>
            </StaffFrame>
        </Scene>
    );
}

export function UpdateScene() {
    return (
        <Scene>
            <StaffFrame active={1}>
                <p className="font-heading text-sm font-bold">{L.updateComplaint}</p>
                <div className="mt-2 space-y-2.5">
                    <Field
                        label={L.status}
                        select
                        value={<Swap before={L.statusSubmitted} after={L.approvedOption} beforeClass={s.beforeAt25} afterClass={s.afterAt25} />}
                    />
                    <div>
                        <span className={MINI_LABEL}>{L.remarks}</span>
                        <span className="mt-1 block h-14 overflow-hidden whitespace-nowrap rounded-md border border-border-light bg-surface p-2 text-xs">
                            <span className={`inline-block ${s.typeMid}`}>Crew assigned for Friday.</span>
                        </span>
                    </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <span className={`${s.popAt88} inline-flex items-center gap-1 rounded-md border border-border-light bg-surface px-2 py-1 text-[11px] font-semibold shadow-soft`}>
                        <Check className="size-3.5 text-sign-green" strokeWidth={3} />
                        {L.changesSaved}
                    </span>
                    <span className={`${BUTTON} ${s.press} ml-auto`}>{L.saveChanges}</span>
                </div>
            </StaffFrame>
        </Scene>
    );
}

export function FlagDuplicateScene() {
    return (
        <Scene>
            <StaffFrame active={1}>
                <p className="font-heading text-sm font-bold">{L.updateComplaint}</p>
                <div className="mt-2">
                    <Field
                        label={L.status}
                        select
                        value={<Swap before={L.statusSubmitted} after={L.statusRejected} beforeClass={s.beforeAt35} afterClass={s.afterAt35} />}
                    />
                </div>
                <span className="mt-3 flex items-center gap-2 text-xs font-semibold">
                    <span className={`${s.tick} flex size-4 shrink-0 items-center justify-center rounded border-2`}>
                        <Check className="size-3 text-white" strokeWidth={3.5} />
                    </span>
                    {L.markDuplicate}
                </span>
                <p className="mt-1 pl-6 text-[11px] text-text-secondary">{L.duplicateNote}</p>
                <div className={`${s.popAt45} mt-2.5`}>
                    <Field label={`${L.originalReportId} (optional)`} value="cm01xk…" anim={s.typeLate} mono />
                </div>
            </StaffFrame>
        </Scene>
    );
}

export function ResolutionScene() {
    return (
        <Scene>
            <StaffFrame active={1}>
                <Field label={L.status} value={L.statusCompleted} select />
                <div className="mt-2.5">
                    <span className={MINI_LABEL}>
                        {L.resolutionPhoto} <span className="font-normal text-text-secondary">(required to complete)</span>
                    </span>
                    <div className="relative mt-1 flex h-28 flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-border-light text-xs">
                        <ImageUp className="size-5 text-text-secondary" />
                        <span className="font-semibold">{L.uploadResolutionPhoto}</span>
                        <div className={`${s.photoLand} absolute inset-1 overflow-hidden rounded shadow-medium`}>
                            <RoadPhoto fixed />
                        </div>
                    </div>
                </div>
                <div className="mt-3 flex justify-end">
                    <span className={`${BUTTON} ${s.enableAt45}`}>{L.saveChanges}</span>
                </div>
            </StaffFrame>
        </Scene>
    );
}

export function ChatScene() {
    return (
        <Scene>
            <StaffFrame active={2}>
                <p className="font-heading text-sm font-bold">{L.citizenChats}</p>
                <div className="mt-2 flex items-center gap-2 border-b border-border-light pb-2 text-xs">
                    <span className="flex size-6 items-center justify-center rounded-full bg-neutral-surface font-bold">A</span>
                    <span className="font-semibold">Asha K.</span>
                </div>
                <div className="mt-3 space-y-2 text-xs leading-snug">
                    <p className="max-w-[85%] rounded-lg rounded-bl-sm bg-neutral-surface px-2.5 py-1.5">Is the pothole near Signal No. 5 on the repair list?</p>
                    <p className={`${s.popAt45} ml-auto max-w-[85%] origin-bottom-right rounded-lg rounded-br-sm bg-text-primary px-2.5 py-1.5 text-neutral-background`}>
                        Yes. The crew is booked for Friday morning.
                    </p>
                </div>
                <div className="mt-3 flex items-center gap-2">
                    <span className="flex h-7 min-w-0 flex-1 items-center rounded-md border border-border-light px-2 text-xs text-text-light">{L.writeReply}</span>
                    <span className="flex size-7 items-center justify-center rounded-md bg-text-primary text-neutral-background">
                        <Send className="size-3.5" />
                    </span>
                </div>
            </StaffFrame>
        </Scene>
    );
}

/* ---------------- Traffic desk ---------------- */

export function ViolationsScene() {
    return (
        <Scene>
            <StaffFrame active={0}>
                <p className="font-heading text-sm font-bold">{L.recentViolations}</p>
                <div className="relative mx-auto mt-2 aspect-[8/5] h-40 max-w-full overflow-hidden rounded">
                    <BikeFrame />
                    <span className={`${s.scanLine} absolute inset-x-0 h-0.5 bg-hazard`} />
                    <Box className={s.popAt45} tone="high" below tag={`${L.tripleRiding} 92%`} pos={{ left: "36%", top: "31%", width: "24%", height: "37%" }} />
                    <Box className={s.popAt56} tone="high" tag={`${L.noHelmet} 98%`} pos={{ left: "43%", top: "32%", width: "8%", height: "13%" }} />
                </div>
            </StaffFrame>
        </Scene>
    );
}

export function PlateScene() {
    return (
        <Scene>
            <StaffFrame active={0}>
                <p className="text-xs text-text-secondary">
                    Track <span className="font-mono">#7</span>
                </p>
                <div className="relative mt-2 flex h-24 items-end justify-center overflow-hidden rounded bg-[#8A9097]">
                    <div className="flex h-16 w-40 items-center justify-center rounded-t-xl bg-asphalt">
                        <span className="plate text-sm font-semibold">
                            <span className={`inline-block ${s.typeEarly}`}>MH 12 AB 1234</span>
                        </span>
                    </div>
                    <span className={`${s.scanLine} absolute inset-x-0 h-0.5 bg-hazard`} />
                </div>
                <ul className="mt-2 divide-y divide-border-light text-xs">
                    <li className="flex items-center justify-between gap-2 py-1.5">
                        <span className="text-text-secondary">Frame 12</span>
                        <span className={s.popAt45}><span className="plate text-[11px]">MH 12 AB 1234</span></span>
                    </li>
                    <li className="flex items-center justify-between gap-2 py-1.5">
                        <span className="text-text-secondary">Frame 18</span>
                        <span className={`${s.popAt50} text-text-secondary`}>Same vehicle, not read again</span>
                    </li>
                    <li className="flex items-center justify-between gap-2 py-1.5">
                        <span className="text-text-secondary">Frame 24</span>
                        <span className={`${s.popAt56} text-text-secondary`}>Same vehicle, not read again</span>
                    </li>
                </ul>
            </StaffFrame>
        </Scene>
    );
}

export function ChallanScene() {
    return (
        <Scene>
            <StaffFrame active={0}>
                <p className="font-heading text-sm font-bold">{L.recentViolations}</p>
                <div className="relative mt-2 overflow-hidden rounded-md border border-border-light">
                    <span className="hazard-stripe absolute inset-y-0 left-0 w-1.5" />
                    <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5 p-3 pb-11 pl-5 text-xs">
                        <div>
                            <dt className="text-text-secondary">Violation</dt>
                            <dd className="font-semibold">{L.noHelmet}</dd>
                        </div>
                        <div>
                            <dt className="text-text-secondary">Vehicle</dt>
                            <dd><span className="plate text-[11px]">MH 12 AB 1234</span></dd>
                        </div>
                        <div>
                            <dt className="text-text-secondary">Confidence</dt>
                            <dd className="font-semibold">98%</dd>
                        </div>
                        <div>
                            <dt className="text-text-secondary">Challan</dt>
                            <dd className="font-semibold">
                                <Swap before={<span className="text-signal-red">₹1,000 due</span>} after="₹1,000" beforeClass={s.beforeAt68} afterClass={s.afterAt68} />
                            </dd>
                        </div>
                    </dl>
                    <span className={`${s.stamp} absolute bottom-2.5 left-5 rounded border-2 border-sign-green bg-white/90 px-2 py-0.5 font-heading text-sm font-bold text-sign-green`}>
                        {L.challanIssued}
                    </span>
                </div>
                <div className="mt-3 flex justify-end">
                    <span className={`${BUTTON} ${s.pressEarly}`}>{L.issueChallan}</span>
                </div>
            </StaffFrame>
        </Scene>
    );
}
