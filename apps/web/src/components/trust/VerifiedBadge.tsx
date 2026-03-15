import { BadgeCheck } from "lucide-react";

type VerifiedBadgeProps = {
  isVerified: boolean;
  verifiedAt?: string | null;
  className?: string;
};

export default function VerifiedBadge({
  isVerified,
  verifiedAt,
  className = "",
}: VerifiedBadgeProps) {
  if (isVerified) {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full border border-[#009E49]/15 bg-[#009E49]/10 px-3 py-1 text-xs font-semibold text-[#0b7a40] ${className}`.trim()}
      >
        <BadgeCheck className="h-3.5 w-3.5" />
        <span>Verified company</span>
        {verifiedAt ? (
          <span className="text-[#0b7a40]/75">
            {new Date(verifiedAt).toLocaleDateString()}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-[var(--tifawin-neutral-200)] bg-[var(--tifawin-neutral-50)] px-3 py-1 text-xs font-semibold text-[var(--tifawin-neutral-700)] ${className}`.trim()}
    >
      <BadgeCheck className="h-3.5 w-3.5" />
      <span>Verification pending</span>
    </div>
  );
}
