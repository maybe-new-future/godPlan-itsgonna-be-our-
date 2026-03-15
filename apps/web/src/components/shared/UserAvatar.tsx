import { useEffect, useState } from "react";
import { resolveMediaUrl } from "../../lib/media";

type UserAvatarProps = {
  imageUrl?: string | null;
  label: string;
  sizeClassName?: string;
  textClassName?: string;
};

function getInitials(label: string) {
  const cleaned = label.trim();
  if (!cleaned) return "?";

  return cleaned
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function UserAvatar({
  imageUrl,
  label,
  sizeClassName = "h-11 w-11",
  textClassName = "text-sm",
}: UserAvatarProps) {
  const resolvedSrc = resolveMediaUrl(imageUrl);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [resolvedSrc]);

  const shouldRenderImage = Boolean(resolvedSrc);
  const showFallback = !resolvedSrc || imageFailed;

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[linear-gradient(135deg,rgba(0,102,204,0.12),rgba(0,158,73,0.12),rgba(255,209,0,0.18),rgba(225,29,72,0.12))] font-semibold text-[var(--tifawin-primary)] ring-1 ring-black/5 ${sizeClassName} ${textClassName}`.trim()}
    >
      {shouldRenderImage ? (
        <img
          key={resolvedSrc}
          src={resolvedSrc}
          alt={label}
          className={`absolute inset-0 z-10 h-full w-full rounded-[inherit] object-cover ${
            imageFailed ? "opacity-0" : "opacity-100"
          }`}
          onLoad={() => undefined}
          onError={() => setImageFailed(true)}
        />
      ) : null}

      {showFallback ? (
        <span className="relative z-[1]">{getInitials(label)}</span>
      ) : null}
    </div>
  );
}
