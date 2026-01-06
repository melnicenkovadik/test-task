import { EmptyDataroom } from "./EmptyDataroom";
import { useWorkspaceDocuments } from "../model/useWorkspaceDocuments";
import { useWorkspaceActions } from "../model/workspaceActionsContext";
import { useWorkspaceDialogs } from "../model/useWorkspaceDialogs";
import { WorkspaceExplorer } from "./WorkspaceExplorer";
import { WorkspaceDetailPanel } from "./WorkspaceDetailPanel";

export function WorkspaceContent() {
  const { data, activeDataroom, activeFolder } = useWorkspaceDocuments();
  const { handleCreateDemo } = useWorkspaceActions();
  const { openDialog } = useWorkspaceDialogs();
  const hasDatarooms = Object.keys(data.datarooms).length > 0;

  return (
    <main className="flex flex-col gap-6">
      {activeDataroom && activeFolder && hasDatarooms ? (
        <div className="grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)]">
          <div className="min-w-0 w-full lg:w-auto">
            <WorkspaceExplorer />
          </div>
          <div className="min-w-0">
            <WorkspaceDetailPanel />
          </div>
        </div>
      ) : (
        <EmptyDataroom
          onCreateDataroom={() => openDialog({ type: "create-dataroom" })}
          onLoadDemo={handleCreateDemo}
        />
      )}
    </main>
  );
}
