import { cn } from "@/lib/utils";

type Zone = "A" | "B" | "C" | "D";

const zoneOrder: Zone[] = ["A", "B", "C", "D"];

const selectedZoneClasses: Record<Zone, string> = {
  A: "fill-red-500 stroke-red-700",
  B: "fill-orange-400 stroke-orange-600",
  C: "fill-yellow-300 stroke-yellow-500",
  D: "fill-blue-300 stroke-blue-500",
};

const defaultZoneClass = "fill-muted/45 stroke-slate-600";

export type UspsaTargetProps = {
  selectedZones?: string[];
  targetZones?: string[];
  onToggleZone?: (zone: string) => void;
  interactive?: boolean;
  className?: string;
};

function getZoneClass(zone: Zone, isSelected: boolean, interactive: boolean) {
  return cn(
    "stroke-[2.5] transition-colors duration-150",
    isSelected ? selectedZoneClasses[zone] : defaultZoneClass,
    interactive && "cursor-pointer hover:fill-accent hover:stroke-foreground",
  );
}

function normalizeZones(zones?: string[]) {
  return new Set(
    (zones ?? [])
      .map((zone) => zone.toUpperCase())
      .filter((zone): zone is Zone => zoneOrder.includes(zone as Zone)),
  );
}

export default function UspsaTarget({
  selectedZones = [],
  targetZones,
  onToggleZone,
  interactive = false,
  className,
}: UspsaTargetProps) {
  const activeZones = normalizeZones(targetZones ?? selectedZones);

  function handleZoneClick(zone: Zone) {
    if (!interactive || !onToggleZone) {
      return;
    }

    onToggleZone(zone);
  }

  function getAccessibilityProps(zone: Zone) {
    if (!interactive) {
      return {
        role: "img" as const,
      };
    }

    return {
      role: "button" as const,
      tabIndex: 0,
      onClick: () => handleZoneClick(zone),
      onKeyDown: (event: React.KeyboardEvent<SVGElement>) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleZoneClick(zone);
        }
      },
      "aria-pressed": activeZones.has(zone),
    };
  }

  return (
    <div className={cn("w-full", className)}>
      <svg
        viewBox="0 0 200 340"
        className="h-auto w-full max-w-[18rem] drop-shadow-sm"
        aria-label="USPSA silhouette target"
      >
        <title>USPSA silhouette target</title>

        <rect x="72" y="16" width="56" height="46" rx="8" className="fill-muted stroke-slate-700 stroke-[3]" />
        <path
          d="M56 80 L144 80 L166 98 L172 124 L170 154 L162 188 L156 214 L149 300 L51 300 L44 214 L38 188 L30 154 L28 124 L34 98 Z"
          className="fill-muted stroke-slate-700 stroke-[3]"
        />

        <rect
          x="80"
          y="23"
          width="40"
          height="32"
          rx="6"
          className={getZoneClass("B", activeZones.has("B"), interactive)}
          {...getAccessibilityProps("B")}
        />

        <path
          d="M76 98 L124 98 L136 112 L136 146 L124 162 L76 162 L64 146 L64 112 Z"
          className={getZoneClass("A", activeZones.has("A"), interactive)}
          {...getAccessibilityProps("A")}
        />

        <path
          d="M66 88 L134 88 L148 104 L150 164 L136 182 L64 182 L50 164 L52 104 Z"
          className={getZoneClass("C", activeZones.has("C"), interactive)}
          {...getAccessibilityProps("C")}
        />

        <path
          d="M56 80 L144 80 L166 98 L172 124 L170 154 L162 188 L156 214 L149 288 L51 288 L44 214 L38 188 L30 154 L28 124 L34 98 Z"
          className={getZoneClass("D", activeZones.has("D"), interactive)}
          {...getAccessibilityProps("D")}
        />

        <text x="100" y="44" textAnchor="middle" className="fill-slate-900 text-[18px] font-semibold">
          B
        </text>
        <text x="100" y="135" textAnchor="middle" className="fill-slate-900 text-[20px] font-bold">
          A
        </text>
        <text x="100" y="176" textAnchor="middle" className="fill-slate-900 text-[18px] font-semibold">
          C
        </text>
        <text x="100" y="250" textAnchor="middle" className="fill-slate-900 text-[18px] font-semibold">
          D
        </text>
      </svg>
    </div>
  );
}
