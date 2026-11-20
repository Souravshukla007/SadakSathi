import type { LucideIcon } from "lucide-react";

/** A small road-sign tile behind an icon: green guide sign, amber warning sign or red regulatory sign. */
const TONES = {
    green: "bg-sign-green text-white shadow-[inset_0_0_0_2px_var(--color-sign-green),inset_0_0_0_3.5px_#fff]",
    amber: "bg-hazard text-asphalt shadow-[inset_0_0_0_2px_var(--color-hazard),inset_0_0_0_3.5px_var(--color-asphalt)]",
    red: "bg-signal-red text-white shadow-[inset_0_0_0_2px_var(--color-signal-red),inset_0_0_0_3.5px_#fff]",
};

export default function IconTile({ icon: Icon, tone = "green", small = false, className = "" }: { icon: LucideIcon; tone?: keyof typeof TONES; small?: boolean; className?: string }) {
    return (
        <span aria-hidden="true" className={`inline-flex ${small ? "size-10" : "size-12"} shrink-0 items-center justify-center rounded-lg ${TONES[tone]} ${className}`}>
            <Icon className={`${small ? "size-5" : "size-6"} transition-transform duration-300 ease-out group-hover:-rotate-6 group-hover:scale-110`} strokeWidth={2.25} />
        </span>
    );
}
