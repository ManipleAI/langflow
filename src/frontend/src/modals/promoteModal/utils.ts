import type { FlowPromotionStatus } from "@/controllers/API/queries/promote";

type StatusDisplay = {
  label: string;
  icon: string;
  variant:
    | "successStatic"
    | "errorStatic"
    | "secondaryStatic"
    | "outline"
    | "gray";
};

export const STATUS_DISPLAY: Record<FlowPromotionStatus, StatusDisplay> = {
  synced: { label: "In sync", icon: "Check", variant: "successStatic" },
  ahead: { label: "Local ahead", icon: "ArrowUp", variant: "outline" },
  behind: { label: "Remote ahead", icon: "ArrowDown", variant: "outline" },
  new: { label: "Not deployed", icon: "Plus", variant: "secondaryStatic" },
  "no-id": { label: "No ID", icon: "CircleHelp", variant: "gray" },
  "remote-only": { label: "Remote only", icon: "Cloud", variant: "gray" },
  error: { label: "Error", icon: "TriangleAlert", variant: "errorStatic" },
  unknown: { label: "Unknown", icon: "CircleHelp", variant: "gray" },
};

export function getStatusDisplay(status: FlowPromotionStatus): StatusDisplay {
  return STATUS_DISPLAY[status] ?? STATUS_DISPLAY.unknown;
}
