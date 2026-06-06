import type { useMutationFunctionType } from "@/types/api";
import { api } from "../../api";
import { getURL } from "../../helpers/constants";
import { UseRequestProcessor } from "../../services/request-processor";
import type { LoginResponse } from "./index";

interface ILoginEnvironment {
  env: string;
}

export const useLoginEnvironment: useMutationFunctionType<
  undefined,
  ILoginEnvironment,
  LoginResponse
> = (options) => {
  const { mutate } = UseRequestProcessor();

  const loginFn = async (
    payload: ILoginEnvironment,
  ): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>(
      `${getURL("PROMOTE")}/login`,
      payload,
    );
    return data;
  };

  return mutate(["useLoginEnvironment"], loginFn, { ...options });
};
