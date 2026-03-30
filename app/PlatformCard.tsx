import type { ReactNode } from "react";

type PlatformCardProps = {
  icon: ReactNode;
  title: string;
  subtitle: string;
  ghost?: boolean;
};

export default function PlatformCard({
  icon,
  title,
  subtitle,
  ghost,
}: PlatformCardProps) {
  return (
    <div className={`platformCard ${ghost ? "ghost" : ""}`}>
      <div className="platformIconBox">
        {icon}
      </div>

      <div className="platformCardTitle">{title}</div>
      <div className="platformCardSub">{subtitle}</div>
    </div>
  );
}
