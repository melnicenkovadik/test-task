import { Toaster } from "sonner";
import { Loader } from "../../../shared/ui/Loader";
import { useLoadingStore } from "../../../shared/model/loadingStore";
import { WorkspaceActionsProvider } from "../../../widgets/workspace/model/workspaceActionsContext";
import { useWorkspaceActionHandlers } from "../model/useWorkspaceActionHandlers";
import { useWorkspaceData } from "../model/useWorkspaceData";
import { useWorkspaceFileCleanup } from "../model/useWorkspaceFileCleanup";
import { useWorkspaceViewMode } from "../../../widgets/workspace/model/useWorkspaceViewMode";
import { WorkspaceToolbar } from "../../../widgets/workspace/ui/WorkspaceToolbar";
import { WorkspaceContent } from "../../../widgets/workspace/ui/WorkspaceContent";
import { WorkspaceDialogs } from "../../../widgets/workspace/ui/WorkspaceDialogs";

type WorkspacePageProps = {
  userId: string | null;
};

export function WorkspacePage({ userId }: WorkspacePageProps) {
  const firestore = useWorkspaceData(userId);
  useWorkspaceViewMode();
  useWorkspaceFileCleanup();
  const { actions, moveItemsToFolder, performBulkDelete } =
    useWorkspaceActionHandlers(userId, firestore);
  const { isLoading } = useLoadingStore();

  return (
    <WorkspaceActionsProvider value={actions}>
      <div className="min-h-screen text-ink">
        <div className="mx-auto flex max-w-10xl flex-col gap-8 px-6 py-10">
          <WorkspaceToolbar />
          <WorkspaceContent />
        </div>

        <Toaster position="top-right" richColors />
        <WorkspaceDialogs
          moveItemsToFolder={moveItemsToFolder}
          performBulkDelete={performBulkDelete}
        />
        {isLoading && <Loader />}
      </div>
    </WorkspaceActionsProvider>
  );
}
