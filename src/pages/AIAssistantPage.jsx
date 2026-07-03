import AIAssistantPanel from "../components/AIAssistantPanel";

function AIAssistantPage({ loadDashboard, loadUsers, isAdminOrManager }) {
  return (
    <div className="ai-page-wrap">
      <AIAssistantPanel
        onActionComplete={async () => {
          await loadDashboard();

          if (isAdminOrManager()) {
            await loadUsers();
          }
        }}
      />
    </div>
  );
}

export default AIAssistantPage;
