import { Header } from "../../header/ui/Header";
import { DataroomPanel } from "./DataroomPanel";
import { useWorkspaceDocuments } from "../model/useWorkspaceDocuments";
import { useWorkspaceActions } from "../model/workspaceActionsContext";
import { useWorkspaceDialogs } from "../model/useWorkspaceDialogs";

export function WorkspaceToolbar() {
  const { data } = useWorkspaceDocuments();
  const { handleCreateDemo } = useWorkspaceActions();
  const { openDialog } = useWorkspaceDialogs();
  const hasDatarooms = Object.keys(data.datarooms).length > 0;

  return (
    <div className="flex flex-col gap-8">
      <Header
        onCreateDataroom={() => openDialog({ type: "create-dataroom" })}
        onLoadDemo={handleCreateDemo}
      />
      {hasDatarooms && <DataroomPanel />}
    </div>
  );
}
