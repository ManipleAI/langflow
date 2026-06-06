export type EnvironmentInfo = {
  name: string;
  url: string;
  has_api_key: boolean;
};

export type EnvironmentInput = {
  name: string;
  url: string;
  api_key: string;
};

export type EnvironmentListResponse = {
  environments: EnvironmentInfo[];
};

export type LoginResponse = {
  ok: boolean;
  message: string;
};

export type FlowPromotionStatus =
  | "synced"
  | "ahead"
  | "behind"
  | "new"
  | "no-id"
  | "remote-only"
  | "error"
  | "unknown";

export type FlowStatusResponse = {
  env: string;
  flow_id: string;
  status: FlowPromotionStatus;
  detail: string;
};

export type PromoteResponse = {
  ok: boolean;
  message: string;
  output: string;
};

export { useAddEnvironment } from "./use-add-environment";
export { useGetEnvironments } from "./use-get-environments";
export { useGetFlowStatus } from "./use-get-flow-status";
export { useLoginEnvironment } from "./use-login-environment";
export { usePromoteFlow } from "./use-promote-flow";
export { useRemoveEnvironment } from "./use-remove-environment";
