import { memo } from "react";
import { DocumentsPanelHeader } from "./DocumentsPanelHeader";
import { DocumentsPanelControls } from "./DocumentsPanelControls";
import { DocumentsPanelBody } from "./DocumentsPanelBody";
import { useWorkspaceDocuments } from "../../model/useWorkspaceDocuments";

export const DocumentsPanel = memo(function DocumentsPanel() {
  const { activeDataroom, activeFolder } = useWorkspaceDocuments();

  if (!activeDataroom || !activeFolder) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-border bg-white/80 p-6 shadow-card">
      <DocumentsPanelHeader />
      <DocumentsPanelControls />
      <DocumentsPanelBody />
    </section>
  );
});
