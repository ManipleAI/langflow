import type { useMutationFunctionType } from "@/types/api";
import { api } from "../../api";
import { getURL } from "../../helpers/constants";
import { UseRequestProcessor } from "../../services/request-processor";
import type {
  EnvironmentInfo,
  EnvironmentInput,
  EnvironmentListResponse,
} from "./index";

export const useAddEnvironment: useMutationFunctionType<
  undefined,
  EnvironmentInput,
  EnvironmentInfo[]
> = (options) => {
  const { mutate, queryClient } = UseRequestProcessor();

  const addFn = async (
    payload: EnvironmentInput,
  ): Promise<EnvironmentInfo[]> => {
    const { data } = await api.post<EnvironmentListResponse>(
      `${getURL("PROMOTE")}/environments`,
      payload,
    );
    return data.environments ?? [];
  };

  return mutate(["useAddEnvironment"], addFn, {
    ...options,
    onSettled: () => {
      queryClient.refetchQueries({ queryKey: ["useGetEnvironments"] });
    },
  });
};
