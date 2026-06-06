import { useEffect, useState } from "react";
import ForwardedIconComponent from "@/components/common/genericIconComponent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  type EnvironmentInfo,
  type FlowPromotionStatus,
  useGetEnvironments,
  useGetFlowStatus,
  useLoginEnvironment,
  usePromoteFlow,
} from "@/controllers/API/queries/promote";
import useAlertStore from "@/stores/alertStore";
import BaseModal from "../baseModal";
import { getStatusDisplay } from "./utils";

type PromoteModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  flowId: string;
  flowName: string;
};

type EnvRowState = {
  status?: FlowPromotionStatus;
  detail?: string;
  output?: string;
  promoted?: boolean;
};

function EnvironmentCard({
  env,
  flowId,
}: {
  env: EnvironmentInfo;
  flowId: string;
}) {
  const [state, setState] = useState<EnvRowState>({});
  const [confirming, setConfirming] = useState(false);
  const setSuccessData = useAlertStore((s) => s.setSuccessData);
  const setErrorData = useAlertStore((s) => s.setErrorData);

  const { mutate: checkStatus, isPending: isChecking } = useGetFlowStatus();
  const { mutate: testLogin, isPending: isTesting } = useLoginEnvironment();
  const { mutate: promote, isPending: isPromoting } = usePromoteFlow();

  // Auto-check status when the card mounts (best-effort).
  useEffect(() => {
    if (env.has_api_key) {
      checkStatus(
        { flow_id: flowId, env: env.name },
        {
          onSuccess: (res) =>
            setState((p) => ({
              ...p,
              status: res.status,
              detail: res.detail,
            })),
        },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTest = () => {
    testLogin(
      { env: env.name },
      {
        onSuccess: (res) =>
          res.ok
            ? setSuccessData({ title: `Connected to ${env.name}` })
            : setErrorData({ title: `Could not connect`, list: [res.message] }),
        onError: (e) =>
          setErrorData({ title: "Connection failed", list: [e?.message] }),
      },
    );
  };

  const handlePromote = () => {
    promote(
      { flow_id: flowId, env: env.name },
      {
        onSuccess: (res) => {
          setState((p) => ({
            ...p,
            output: res.output,
            promoted: res.ok,
            status: res.ok ? "synced" : p.status,
          }));
          if (res.ok) {
            setSuccessData({ title: res.message });
          } else {
            setErrorData({ title: res.message, list: [res.output] });
          }
          setConfirming(false);
        },
        onError: (e) => {
          setErrorData({ title: "Promotion failed", list: [e?.message] });
          setConfirming(false);
        },
      },
    );
  };

  const display = state.status ? getStatusDisplay(state.status) : null;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-sm">{env.name}</span>
          <span className="truncate text-xs text-muted-foreground">
            {env.url}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {display ? (
            <Badge variant={display.variant} size="sm">
              <ForwardedIconComponent
                name={display.icon}
                className="mr-1 h-3 w-3"
              />
              {display.label}
            </Badge>
          ) : (
            isChecking && (
              <ForwardedIconComponent
                name="Loader2"
                className="h-4 w-4 animate-spin text-muted-foreground"
              />
            )
          )}
        </div>
      </div>

      {!env.has_api_key && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
          <ForwardedIconComponent name="TriangleAlert" className="h-3 w-3" />
          No usable API key for this environment. Remove it and add it again
          with a valid key.
        </div>
      )}

      {state.detail && (
        <p className="text-xs text-muted-foreground">{state.detail}</p>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleTest}
          loading={isTesting}
          disabled={!env.has_api_key}
        >
          Test
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            checkStatus(
              { flow_id: flowId, env: env.name },
              {
                onSuccess: (res) =>
                  setState((p) => ({
                    ...p,
                    status: res.status,
                    detail: res.detail,
                  })),
              },
            )
          }
          loading={isChecking}
          disabled={!env.has_api_key}
        >
          Refresh
        </Button>
        {confirming ? (
          <>
            <Button
              variant="destructive"
              size="sm"
              onClick={handlePromote}
              loading={isPromoting}
            >
              Confirm promote
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirming(false)}
              disabled={isPromoting}
            >
              Cancel
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            onClick={() => setConfirming(true)}
            disabled={!env.has_api_key}
            data-testid={`promote-to-${env.name}`}
          >
            <ForwardedIconComponent
              name="Rocket"
              className="mr-1 h-3.5 w-3.5"
            />
            Promote
          </Button>
        )}
      </div>
    </div>
  );
}

export default function PromoteModal({
  open,
  setOpen,
  flowId,
  flowName,
}: PromoteModalProps) {
  const { data: environments, isLoading } = useGetEnvironments({
    enabled: open,
  });

  return (
    <BaseModal open={open} setOpen={setOpen} size="small-h-full">
      <BaseModal.Header
        description={`Promote "${flowName}" to a remote environment. The flow graph is pushed (upsert by stable ID); secrets are stripped and supplied per environment.`}
      >
        <span className="flex items-center gap-2">
          <ForwardedIconComponent name="Rocket" className="h-5 w-5" />
          Promote flow
        </span>
      </BaseModal.Header>
      <BaseModal.Content>
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <ForwardedIconComponent
              name="Loader2"
              className="h-5 w-5 animate-spin text-muted-foreground"
            />
          </div>
        ) : !environments || environments.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <ForwardedIconComponent
              name="Rocket"
              className="h-8 w-8 text-muted-foreground"
            />
            <p className="text-sm font-medium">No environments configured</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Open the Environments tab in the left sidebar to add a remote
              Langflow instance (e.g. staging or production).
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {environments.map((env) => (
              <EnvironmentCard key={env.name} env={env} flowId={flowId} />
            ))}
          </div>
        )}
      </BaseModal.Content>
      <BaseModal.Footer close />
    </BaseModal>
  );
}
