import type { useMutationFunctionType } from "@/types/api";
import { api } from "../../api";
import { getURL } from "../../helpers/constants";
import { UseRequestProcessor } from "../../services/request-processor";
import type { EnvironmentInfo, EnvironmentListResponse } from "./index";

interface IRemoveEnvironment {
  name: string;
}

export const useRemoveEnvironment: useMutationFunctionType<
  undefined,
  IRemoveEnvironment,
  EnvironmentInfo[]
> = (options) => {
  const { mutate, queryClient } = UseRequestProcessor();

  const removeFn = async ({
    name,
  }: IRemoveEnvironment): Promise<EnvironmentInfo[]> => {
    const { data } = await api.delete<EnvironmentListResponse>(
      `${getURL("PROMOTE")}/environments/${encodeURIComponent(name)}`,
    );
    return data.environments ?? [];
  };

  return mutate(["useRemoveEnvironment"], removeFn, {
    ...options,
    onSettled: () => {
      queryClient.refetchQueries({ queryKey: ["useGetEnvironments"] });
    },
  });
};
