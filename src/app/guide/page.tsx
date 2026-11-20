import type { Metadata } from "next";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import GuideMotion from "./GuideMotion";
import { LABELS as L } from "./labels";
import {
    AccountScene, PhotoScene, DetectScene, LocationScene, DuplicateScene, TrackScene,
    ListScene, UpdateScene, FlagDuplicateScene, ResolutionScene, ChatScene,
    ViolationsScene, PlateScene, ChallanScene,
} from "./scenes";

export const metadata: Metadata = {
    title: "How to use SadakSathi",
    description: "Step-by-step guide: report a road hazard and follow the repair, or handle reports on the municipal and traffic desks.",
};

const TRACKS = [
    { id: "citizens", label: "For citizens" },
    { id: "staff", label: "For city staff" },
];

/** An on-screen label, so readers can match the words to the button. */
function Ui({ children }: { children: React.ReactNode }) {
    return <strong className="font-semibold text-text-primary">{children}</strong>;
}

function Step({ n, title, scene, children }: { n: number; title: string; scene: React.ReactNode; children: React.ReactNode }) {
    return (
        <li className="grid gap-6 border-t border-border-light py-10 lg:grid-cols-[5fr_6fr] lg:items-center lg:gap-12">
            <div>
                <span aria-hidden="true" className="road-sign inline-flex size-10 items-center justify-center font-heading text-xl font-bold">{n}</span>
                <h3 className="mt-4 font-heading text-2xl font-normal tracking-tighter">{title}</h3>
                <div className="mt-3 max-w-prose space-y-3 leading-relaxed text-text-secondary">{children}</div>
            </div>
            {scene}
        </li>
    );
}

const TROUBLE: { problem: React.ReactNode; fix: React.ReactNode }[] = [
    {
        problem: <><Ui>{L.scanFailed}</Ui> and it says it could not reach the ML backend</>,
        fix: "The detection server isn't running. Whoever runs your SadakSathi server needs to start it (it listens on port 8000). Then scan again.",
    },
    {
        problem: <><Ui>{L.scanFailed}</Ui> and it says the model isn&apos;t loaded</>,
        fix: "The detection server is running but has no model file. Whoever runs it needs to add the model file and restart it.",
    },
    {
        problem: <>The scan says <Ui>{L.nothingFound}</Ui>, but the problem is real</>,
        fix: <>Try a closer photo in daylight. You can also report it without a scan from <Ui>{L.navComplaints}</Ui>.</>,
    },
    {
        problem: <><Ui>{L.useMyLocation}</Ui> doesn&apos;t fill anything in</>,
        fix: "Your browser is blocking location for this site. Allow location, or type the street, city and pincode yourself.",
    },
    {
        problem: "Your report was marked as a duplicate",
        fix: <>Someone reported the same problem nearby first. Find it on <Ui>{L.navComplaints}</Ui> and upvote it, so the department sees how many people it affects.</>,
    },
    {
        problem: "You can't log in as staff",
        fix: <>Staff accounts aren&apos;t made with <Ui>{L.tabSignUp}</Ui>. Ask your admin to create a municipal or traffic account, then pick it under <Ui>{L.logInAs}</Ui>.</>,
    },
    {
        problem: <><Ui>{L.saveChanges}</Ui> is greyed out</>,
        fix: <>The status is set to <Ui>{L.statusCompleted}</Ui> without a resolution photo. Upload a photo of the repaired spot first.</>,
    },
];

export default function GuidePage() {
    return (
        <>
            <AppHeader />

            <main id="main-content" className="flex-grow">
                <section className="px-4 pb-10 pt-28 sm:px-6 md:pt-36">
                    <div className="mx-auto max-w-7xl">
                        <h1 className="font-heading text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">How to use SadakSathi</h1>
                        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-text-secondary">
                            Report a road problem with a photo and follow it until it&apos;s fixed, or, if you work for the city, handle those reports from your desk.
                        </p>
                    </div>
                </section>

                <GuideMotion tracks={TRACKS}>
                    <section id="citizens" aria-labelledby="citizens-title" className="scroll-mt-16 px-4 py-14 sm:px-6">
                        <div className="mx-auto max-w-7xl">
                            <h2 id="citizens-title" className="font-heading text-3xl font-normal tracking-tighter md:text-4xl">For citizens</h2>
                            <p className="mt-3 max-w-2xl leading-relaxed text-text-secondary">From the photo to the repair, in six steps.</p>
                            <ol className="mt-8">
                                <Step n={1} title="Create an account or log in" scene={<AccountScene />}>
                                    <p>
                                        Select <Ui>{L.tabLogIn}</Ui> at the top of any page. New here? Choose <Ui>{L.tabSignUp}</Ui>, enter your name, email and a password of at least 8 characters, and select <Ui>{L.createAccountButton}</Ui>.
                                    </p>
                                    <p>
                                        Coming back? Leave <Ui>{L.logInAs}</Ui> on <Ui>{L.roleCitizen}</Ui>, enter your username or email and password, and select <Ui>{L.logInButton}</Ui>.
                                    </p>
                                </Step>
                                <Step n={2} title="Add a photo or video and scan it" scene={<PhotoScene />}>
                                    <p>
                                        Select <Ui>{L.navReport}</Ui> in the menu. Under <Ui>{L.lookFor}</Ui>, choose <Ui>{L.roadHazards}</Ui> for potholes, garbage or open manholes, or <Ui>{L.trafficViolations}</Ui> for riders without helmets or triple riding.
                                    </p>
                                    <p>
                                        Pick <Ui>{L.mediaPhoto}</Ui> or <Ui>{L.mediaVideo}</Ui>, select <Ui>{L.chooseFile}</Ui> (on a phone you can take the photo right there), then select <Ui>{L.scanHazards}</Ui> or <Ui>{L.scanViolations}</Ui>.
                                    </p>
                                </Step>
                                <Step n={3} title="See what was found and how urgent it is" scene={<DetectScene />}>
                                    <p>
                                        The <Ui>{L.scanResult}</Ui> draws a box around each problem and gives it a priority from its size and depth: <Ui>High</Ui> in red, <Ui>Medium</Ui> in amber, <Ui>Low</Ui> in grey. Open manholes are always high.
                                    </p>
                                    <p>
                                        <Ui>{L.overallPriority}</Ui> is the most urgent one in the photo. If the scan finds nothing but the problem is real, you can still report it yourself.
                                    </p>
                                </Step>
                                <Step n={4} title="Send the report with its location" scene={<LocationScene />}>
                                    <p>
                                        Select <Ui>{L.reportThisHazard}</Ui>. Your photo comes with it. Check <Ui>{L.whatIsProblem}</Ui> and add a short <Ui>{L.description}</Ui> of what you saw.
                                    </p>
                                    <p>
                                        Under <Ui>{L.whereIsIt}</Ui>, select <Ui>{L.useMyLocation}</Ui> while you&apos;re at the spot, or type the <Ui>{L.street}</Ui>, <Ui>{L.city}</Ui>, <Ui>{L.state}</Ui> and <Ui>{L.pincode}</Ui>. Then select <Ui>{L.sendReport}</Ui>.
                                    </p>
                                </Step>
                                <Step n={5} title="Nearby reports are joined, not repeated" scene={<DuplicateScene />}>
                                    <p>
                                        When your report arrives, SadakSathi looks for the same kind of problem reported within about 100 m in the last 30 days. If there is one, your report is linked to it, so the crew gets one job instead of several copies.
                                    </p>
                                    <p>
                                        This check uses your phone&apos;s location, so it works best when you choose <Ui>{L.useMyLocation}</Ui>. There&apos;s nothing else for you to do.
                                    </p>
                                </Step>
                                <Step n={6} title="Follow the repair, upvote and chat" scene={<TrackScene />}>
                                    <p>
                                        Open <Ui>{L.navDashboard}</Ui> to see <Ui>{L.myReports}</Ui>. Each report moves from <Ui>{L.statusSubmitted}</Ui> (waiting for review) to <Ui>{L.statusApproved}</Ui> (work is planned) to <Ui>{L.statusCompleted}</Ui> (fixed). It can also be put <Ui>{L.statusOnHold}</Ui> or <Ui>{L.statusRejected}</Ui>; <Ui>{L.departmentRemarks}</Ui> tell you why.
                                    </p>
                                    <p>
                                        Open <Ui>{L.navComplaints}</Ui> to upvote problems near you that affect you too. To ask the department something, open <Ui>{L.supportChat}</Ui> and type in <Ui>{L.writeMessage}</Ui>.
                                    </p>
                                </Step>
                            </ol>
                        </div>
                    </section>

                    <section id="staff" aria-labelledby="staff-title" className="scroll-mt-16 border-t border-border-light bg-neutral-surface/50 px-4 py-14 sm:px-6">
                        <div className="mx-auto max-w-7xl">
                            <h2 id="staff-title" className="font-heading text-3xl font-normal tracking-tighter md:text-4xl">For city staff</h2>
                            <p className="mt-3 max-w-2xl leading-relaxed text-text-secondary">
                                Your admin creates staff accounts. On the log in page, set <Ui>{L.logInAs}</Ui> to <Ui>{L.roleMunicipal}</Ui> or <Ui>{L.roleTraffic}</Ui>, then log in. Your desk menu runs down the left side, or across the top on a phone.
                            </p>

                            <h3 className="mt-12 font-heading text-2xl font-normal tracking-tighter">{L.municipalDesk}</h3>
                            <ol className="mt-6">
                                <Step n={1} title="Open the complaints list" scene={<ListScene />}>
                                    <p>
                                        Select <Ui>{L.complaintsTitle}</Ui> in the desk menu. New reports from citizens appear here with their report ID, issue, location, who reported them and their status.
                                    </p>
                                    <p>Select <Ui>{L.manage}</Ui> on a row to open the report.</p>
                                </Step>
                                <Step n={2} title="Set the status and write remarks" scene={<UpdateScene />}>
                                    <p>
                                        Under <Ui>{L.status}</Ui>, choose <Ui>{L.approvedOption}</Ui> when work is planned, <Ui>{L.statusOnHold}</Ui> if it has to wait, or <Ui>{L.statusRejected}</Ui> if there is nothing to fix.
                                    </p>
                                    <p>
                                        Write what&apos;s happening in <Ui>{L.remarks}</Ui>. The citizen sees it on their dashboard. Select <Ui>{L.saveChanges}</Ui>.
                                    </p>
                                </Step>
                                <Step n={3} title="Flag a duplicate" scene={<FlagDuplicateScene />}>
                                    <p>
                                        If the same problem is already open, tick <Ui>{L.markDuplicate}</Ui> and, if you have it, paste the <Ui>{L.originalReportId}</Ui>.
                                    </p>
                                    <p>A duplicate is closed as {L.statusRejected}, so the crew only works on the original.</p>
                                </Step>
                                <Step n={4} title="Add a resolution photo, then mark it completed" scene={<ResolutionScene />}>
                                    <p>
                                        When the repair is done, set <Ui>{L.status}</Ui> to <Ui>{L.statusCompleted}</Ui> and select <Ui>{L.uploadResolutionPhoto}</Ui> to add a photo of the fixed spot.
                                    </p>
                                    <p><Ui>{L.saveChanges}</Ui> stays unavailable until the photo is in, so every completed report has proof of the work.</p>
                                </Step>
                                <Step n={5} title="Reply to the citizen" scene={<ChatScene />}>
                                    <p>
                                        Open <Ui>{L.chats}</Ui> in the desk menu, pick a conversation under <Ui>{L.citizenChats}</Ui>, and type in <Ui>{L.writeReply}</Ui>.
                                    </p>
                                    <p>Use it to ask for a clearer photo or the exact spot, or to say when the crew will come.</p>
                                </Step>
                            </ol>

                            <h3 className="mt-12 font-heading text-2xl font-normal tracking-tighter">{L.trafficDesk}</h3>
                            <ol className="mt-6">
                                <Step n={1} title="Review detected violations" scene={<ViolationsScene />}>
                                    <p>
                                        Your <Ui>{L.trafficTitle}</Ui> page lists <Ui>{L.recentViolations}</Ui> found in camera or dashcam footage: <Ui>{L.noHelmet}</Ui> and <Ui>{L.tripleRiding}</Ui>, each with how sure the AI is.
                                    </p>
                                    <p>To check new footage yourself, select <Ui>{L.runDetection}</Ui> in the desk menu.</p>
                                </Step>
                                <Step n={2} title="Check the number plate" scene={<PlateScene />}>
                                    <p>
                                        The detector reads each plate as text, for example <span className="plate text-sm">MH 12 AB 1234</span>. It follows the vehicle through the video and reads its plate once, so one rider isn&apos;t counted as many violations.
                                    </p>
                                    <p>Compare the plate with the frame before you act on it.</p>
                                </Step>
                                <Step n={3} title="Issue the challan" scene={<ChallanScene />}>
                                    <p>
                                        Rows with a striped edge are due a challan, with the fine shown: ₹1,000 for no helmet, ₹1,500 for triple riding, ₹2,000 for wrong-side riding.
                                    </p>
                                    <p>
                                        Select <Ui>{L.issueChallan}</Ui>. The violation then shows <Ui>{L.challanIssued}</Ui> and the amount.
                                    </p>
                                </Step>
                            </ol>
                        </div>
                    </section>

                    <section aria-labelledby="trouble-title" className="border-t border-border-light px-4 py-14 sm:px-6">
                        <div className="mx-auto max-w-7xl">
                            <h2 id="trouble-title" className="font-heading text-3xl font-normal tracking-tighter md:text-4xl">If something goes wrong</h2>
                            <dl className="mt-8 grid gap-x-12 gap-y-8 md:grid-cols-2">
                                {TROUBLE.map((t, i) => (
                                    <div key={i} className="border-l-2 border-border-light pl-5">
                                        <dt className="text-lg font-bold text-text-primary">{t.problem}</dt>
                                        <dd className="mt-1.5 leading-relaxed text-text-secondary">{t.fix}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    </section>
                </GuideMotion>
            </main>

            <AppFooter />
        </>
    );
}
