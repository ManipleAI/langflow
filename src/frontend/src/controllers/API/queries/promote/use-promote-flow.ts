import type { useMutationFunctionType } from "@/types/api";
import { api } from "../../api";
import { getURL } from "../../helpers/constants";
import { UseRequestProcessor } from "../../services/request-processor";
import type { PromoteResponse } from "./index";

interface IPromoteFlow {
  flow_id: string;
  env: string;
  project?: string | null;
}

export const usePromoteFlow: useMutationFunctionType<
  undefined,
  IPromoteFlow,
  PromoteResponse
> = (options) => {
  const { mutate } = UseRequestProcessor();

  const promoteFn = async (payload: IPromoteFlow): Promise<PromoteResponse> => {
    const { data } = await api.post<PromoteResponse>(
      `${getURL("PROMOTE")}/apply`,
      payload,
    );
    return data;
  };

  return mutate(["usePromoteFlow"], promoteFn, { ...options });
};
