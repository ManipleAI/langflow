import { useEffect, useState } from "react";
import ForwardedIconComponent from "@/components/common/genericIconComponent";
import ShadTooltip from "@/components/common/shadTooltipComponent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarGroupLabel } from "@/components/ui/sidebar";
import {
  type EnvironmentInfo,
  type FlowPromotionStatus,
  useAddEnvironment,
  useGetEnvironments,
  useGetFlowStatus,
  useRemoveEnvironment,
} from "@/controllers/API/queries/promote";
import PromoteModal from "@/modals/promoteModal";
import { getStatusDisplay } from "@/modals/promoteModal/utils";
import useAlertStore from "@/stores/alertStore";

type EnvironmentsPanelProps = {
  flowId: string;
  flowName: string;
};

function EnvironmentRow({
  env,
  flowId,
  onRemove,
  removing,
}: {
  env: EnvironmentInfo;
  flowId: string;
  onRemove: (name: string) => void;
  removing: boolean;
}) {
  const [status, setStatus] = useState<FlowPromotionStatus | undefined>();
  const { mutate: checkStatus, isPending } = useGetFlowStatus();

  useEffect(() => {
    if (env.has_api_key) {
      checkStatus(
        { flow_id: flowId, env: env.name },
        { onSuccess: (res) => setStatus(res.status) },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flowId, env.name, env.has_api_key]);

  const display = status ? getStatusDisplay(status) : null;

  return (
    <div className="flex flex-col gap-1 border-b border-border px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-medium text-sm">{env.name}</span>
        <div className="flex shrink-0 items-center gap-1">
          {display ? (
            <Badge variant={display.variant} size="sm">
              <ForwardedIconComponent
                name={display.icon}
                className="mr-1 h-3 w-3"
              />
              {display.label}
            </Badge>
          ) : isPending ? (
            <ForwardedIconComponent
              name="Loader2"
              className="h-3.5 w-3.5 animate-spin text-muted-foreground"
            />
          ) : null}
          <ShadTooltip content="Remove environment" side="bottom">
            <Button
              variant="ghost"
              size="iconSm"
              onClick={() => onRemove(env.name)}
              loading={removing}
            >
              <ForwardedIconComponent name="Trash2" className="h-3.5 w-3.5" />
            </Button>
          </ShadTooltip>
        </div>
      </div>
      <span className="truncate text-xs text-muted-foreground">{env.url}</span>
      {!env.has_api_key && (
        <span className="flex items-center gap-1 text-xs text-destructive">
          <ForwardedIconComponent name="TriangleAlert" className="h-3 w-3" />
          API key unavailable — remove and add this environment again
        </span>
      )}
    </div>
  );
}

export default function EnvironmentsPanel({
  flowId,
  flowName,
}: EnvironmentsPanelProps) {
  const { data: environments, isLoading } = useGetEnvironments();
  const { mutate: addEnvironment, isPending: isAdding } = useAddEnvironment();
  const { mutate: removeEnvironment, isPending: isRemoving } =
    useRemoveEnvironment();
  const setErrorData = useAlertStore((s) => s.setErrorData);

  const [showAdd, setShowAdd] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [form, setForm] = useState({ name: "", url: "", api_key: "" });

  const resetForm = () => setForm({ name: "", url: "", api_key: "" });

  const handleAdd = () => {
    if (!form.name.trim() || !form.url.trim() || !form.api_key.trim()) {
      setErrorData({ title: "All fields are required" });
      return;
    }
    if (environments?.some((e) => e.name === form.name.trim())) {
      setErrorData({ title: `Environment "${form.name}" already exists` });
      return;
    }
    addEnvironment(
      {
        name: form.name.trim(),
        url: form.url.trim(),
        api_key: form.api_key.trim(),
      },
      {
        onSuccess: () => {
          resetForm();
          setShowAdd(false);
        },
        onError: (e) =>
          setErrorData({ title: "Could not save", list: [e?.message] }),
      },
    );
  };

  const handleRemove = (name: string) => {
    removeEnvironment(
      { name },
      {
        onError: (e) =>
          setErrorData({ title: "Could not remove", list: [e?.message] }),
      },
    );
  };

  const hasEnvironments = !!environments && environments.length > 0;

  return (
    <div className="flex h-full flex-col">
      <SidebarGroupLabel className="flex items-center justify-between px-3 pt-3">
        <span>Environments</span>
        <ShadTooltip content="Add environment" side="bottom">
          <Button
            variant="ghost"
            size="iconSm"
            onClick={() => setShowAdd((v) => !v)}
            data-testid="add-environment-button"
          >
            <ForwardedIconComponent name="Plus" className="h-4 w-4" />
          </Button>
        </ShadTooltip>
      </SidebarGroupLabel>

      {showAdd && (
        <div className="flex flex-col gap-2 border-b border-border px-3 py-3">
          <Input
            value={form.name}
            placeholder="Name (e.g. production)"
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          <Input
            value={form.url}
            placeholder="URL (e.g. https://prod.example.com)"
            onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
          />
          <Input
            type="password"
            value={form.api_key}
            placeholder="API key (e.g. sk-...)"
            autoComplete="off"
            onChange={(e) =>
              setForm((p) => ({ ...p, api_key: e.target.value }))
            }
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                resetForm();
                setShowAdd(false);
              }}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleAdd} loading={isAdding}>
              Add
            </Button>
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <ForwardedIconComponent
              name="Loader2"
              className="h-5 w-5 animate-spin text-muted-foreground"
            />
          </div>
        ) : !hasEnvironments ? (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">
            No environments yet. Add a remote Langflow instance to promote this
            flow to staging or production.
          </div>
        ) : (
          environments!.map((env) => (
            <EnvironmentRow
              key={env.name}
              env={env}
              flowId={flowId}
              onRemove={handleRemove}
              removing={isRemoving}
            />
          ))
        )}
      </div>

      {hasEnvironments && (
        <div className="border-t border-border p-3">
          <Button
            className="w-full"
            onClick={() => setPromoteOpen(true)}
            data-testid="open-promote-modal"
          >
            <ForwardedIconComponent name="Rocket" className="mr-2 h-4 w-4" />
            Promote flow
          </Button>
        </div>
      )}

      <PromoteModal
        open={promoteOpen}
        setOpen={setPromoteOpen}
        flowId={flowId}
        flowName={flowName}
      />
    </div>
  );
}
