import type { useQueryFunctionType } from "@/types/api";
import { api } from "../../api";
import { getURL } from "../../helpers/constants";
import { UseRequestProcessor } from "../../services/request-processor";
import type { EnvironmentInfo, EnvironmentListResponse } from "./index";

export const useGetEnvironments: useQueryFunctionType<
  undefined,
  EnvironmentInfo[]
> = (options) => {
  const { query } = UseRequestProcessor();

  const responseFn = async (): Promise<EnvironmentInfo[]> => {
    const { data } = await api.get<EnvironmentListResponse>(
      `${getURL("PROMOTE")}/environments`,
    );
    return data.environments ?? [];
  };

  return query(["useGetEnvironments"], responseFn, { ...options });
};
