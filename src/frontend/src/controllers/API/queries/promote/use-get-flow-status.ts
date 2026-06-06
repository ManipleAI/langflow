import type { useMutationFunctionType } from "@/types/api";
import { api } from "../../api";
import { getURL } from "../../helpers/constants";
import { UseRequestProcessor } from "../../services/request-processor";
import type { FlowStatusResponse } from "./index";

interface IGetFlowStatus {
  flow_id: string;
  env: string;
}

// Status compares the local flow against a remote and may take a while
// (it can trigger an isolated subprocess), so it is exposed as a mutation
// the caller invokes per-environment rather than an always-on query.
export const useGetFlowStatus: useMutationFunctionType<
  undefined,
  IGetFlowStatus,
  FlowStatusResponse
> = (options) => {
  const { mutate } = UseRequestProcessor();

  const statusFn = async (
    payload: IGetFlowStatus,
  ): Promise<FlowStatusResponse> => {
    const { data } = await api.get<FlowStatusResponse>(
      `${getURL("PROMOTE")}/status`,
      { params: { flow_id: payload.flow_id, env: payload.env } },
    );
    return data;
  };

  return mutate(["useGetFlowStatus"], statusFn, { ...options });
};
