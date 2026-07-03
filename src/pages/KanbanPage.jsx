import { useState } from "react";
import CustomSelect from "../components/CustomSelect";
import KanbanBoard from "../components/KanbanBoard";
import TaskModal from "../components/TaskModal";
import useBodyScrollLock from "../hooks/useBodyScrollLock";
import { KANBAN_PAGE_SIZE, KANBAN_GROUPED_COLUMNS } from "../constants/taskConstants";
import { getDayStart, sortKanbanTasksByUpdatedAt } from "../utils/helpers";

const getTaskDeadlineValue = (task) =>
  task?.current_deadline || task?.deadline || task?.initial_deadline || null;

const isTaskCompletedForKanban = (task) =>
  ["done", "completed"].includes(task?.status) ||
  ["done", "completed"].includes(task?.operational_status);

const isTaskDeadlineOverdueForKanban = (task) => {
  const deadlineValue = getTaskDeadlineValue(task);
  if (!deadlineValue) return false;

  const deadline = getDayStart(deadlineValue);
  if (Number.isNaN(deadline.getTime())) return false;

  return deadline < getDayStart();
};

const getKanbanLaneKey = (task) => {
  if (isTaskCompletedForKanban(task)) return "completed";

  if (
    task?.operational_status === "overdue" ||
    isTaskDeadlineOverdueForKanban(task)
  ) {
    return "overdue";
  }

  if (
    ["in_progress", "active"].includes(task?.status) ||
    ["in_progress", "active"].includes(task?.operational_status)
  ) {
    return "active";
  }

  return "planned";
};

const KANBAN_MANUAL_DROP_STATUSES = new Set(["new", "active", "completed"]);

export default function KanbanPage({
  taskSearch,
  setTaskSearch,
  operationalStatusFilter,
  setOperationalStatusFilter,
  assigneeFilter,
  setAssigneeFilter,
  taskAssigneeFilterOptions,
  taskStatusOptions,
  resetTaskFilters,
  updateTaskFilter,
  directionFilter,
  setDirectionFilter,
  taskDirectionValues,
  priorityFilter,
  setPriorityFilter,
  priorityOptions,
  deadlineFilter,
  setDeadlineFilter,
  tasks,
  filteredTasks,
  statusUpdatingId,
  isAdmin,
  getTaskOperationalStatus,
  handleChangeTaskStatus,
  openTaskComments,
  canManageTask,
  getTaskAssigneeName,
  selectedTaskForComments,
  closeTaskComments,
  taskComments,
  newComment,
  setNewComment,
  addTaskComment,
  deleteTaskComment,
  users,
  taskAttachments,
  attachmentsLoading,
  attachmentsError,
  attachmentUploading,
  selectedFile,
  setSelectedFile,
  fileInputRef,
  handleUploadAttachment,
  handleDeleteAttachment,
  handleDownloadAttachment,
}) {
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState("");
  const [kanbanVisibleCounts, setKanbanVisibleCounts] = useState({});
  const [kanbanDragClickBlocked, setKanbanDragClickBlocked] = useState(false);

  useBodyScrollLock(!!selectedTaskForComments);

  const kanbanTasks = filteredTasks.filter((task) => task.kanban_enabled !== false);
  const newKanbanTasksCount = tasks.filter(
    (task) =>
      task.kanban_enabled !== false && getTaskOperationalStatus(task) === "new"
  ).length;
  const kanbanVisibleColumns = KANBAN_GROUPED_COLUMNS.map((group) => ({
    key: group.key,
    title: group.title,
    targetStatus: group.targetStatus,
    tasks: sortKanbanTasksByUpdatedAt(
      kanbanTasks
        .filter((task) => getKanbanLaneKey(task) === group.key)
        .map((task) => ({ ...task, kanbanLane: group.key }))
    ),
  }));
  const getKanbanVisibleCount = (columnKey) =>
    kanbanVisibleCounts[columnKey] || KANBAN_PAGE_SIZE;
  const showMoreKanbanTasks = (columnKey) => {
    setKanbanVisibleCounts((current) => ({
      ...current,
      [columnKey]: getKanbanVisibleCount(columnKey) + KANBAN_PAGE_SIZE,
    }));
  };
  const handleKanbanDragStart = (event, taskId) => {
    setKanbanDragClickBlocked(true);
    setDraggedTaskId(taskId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(taskId));
  };
  const handleKanbanDragOver = (event, column) => {
    if (!KANBAN_MANUAL_DROP_STATUSES.has(column.targetStatus)) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverColumn(column.key);
  };
  const handleKanbanDrop = async (event, column) => {
    event.preventDefault();

    if (!KANBAN_MANUAL_DROP_STATUSES.has(column.targetStatus)) {
      setDraggedTaskId(null);
      setDragOverColumn("");
      return;
    }

    const taskId = event.dataTransfer.getData("text/plain") || String(draggedTaskId || "");
    const task = tasks.find((item) => String(item.id) === String(taskId));

    setDraggedTaskId(null);
    setDragOverColumn("");

    if (!task || getTaskOperationalStatus(task) === column.targetStatus) return;

    await handleChangeTaskStatus(task.id, column.targetStatus, "operational_status");
  };
  const handleKanbanDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumn("");
    window.setTimeout(() => {
      setKanbanDragClickBlocked(false);
    }, 0);
  };
  const handleKanbanCardClick = (task) => {
    if (kanbanDragClickBlocked) return;

    openTaskComments(task);
  };

  return (
    <div className="section-card kanban-section-card">
        <div className="kanban-filters">
          <div className="kanban-filter-search">
            <svg className="kanban-filter-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="search"
              className="kanban-filter-input"
              placeholder="Tapşırıq, ID və ya təsvir üzrə axtar"
              value={taskSearch}
              onChange={(event) => updateTaskFilter(setTaskSearch, event.target.value)}
            />
          </div>

          <div className="kanban-filter-control kanban-filter-status">
            <svg className="kanban-filter-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
            <CustomSelect
              className="kanban-filter-select"
              value={operationalStatusFilter}
              onChange={(nextValue) =>
                updateTaskFilter(setOperationalStatusFilter, nextValue)
              }
              options={[{ value: "", label: "Status: Hamısı" }, ...taskStatusOptions]}
            />
          </div>

          <div className="kanban-filter-control kanban-filter-assignee">
            <svg className="kanban-filter-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <CustomSelect
              className="kanban-filter-select"
              value={assigneeFilter}
              onChange={(nextValue) => updateTaskFilter(setAssigneeFilter, nextValue)}
              options={[
                { value: "", label: "İcraçı: Hamısı" },
                ...taskAssigneeFilterOptions.map((item) => ({
                  value: String(item.id),
                  label: item.full_name,
                })),
              ]}
            />
          </div>

          <div className="kanban-filter-control kanban-filter-category">
            <svg className="kanban-filter-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
            <CustomSelect
              className="kanban-filter-select"
              value={directionFilter}
              onChange={(nextValue) => updateTaskFilter(setDirectionFilter, nextValue)}
              options={[
                { value: "", label: "Kateqoriya: Hamısı" },
                ...taskDirectionValues.map((value) => ({ value, label: value })),
              ]}
            />
          </div>

          <div className="kanban-filter-control kanban-filter-priority">
            <svg className="kanban-filter-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <CustomSelect
              className="kanban-filter-select"
              value={priorityFilter}
              onChange={(nextValue) => updateTaskFilter(setPriorityFilter, nextValue)}
              options={[{ value: "", label: "Prioritet: Hamısı" }, ...priorityOptions]}
            />
          </div>

          <div className="kanban-filter-control kanban-filter-deadline">
            <svg className="kanban-filter-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <CustomSelect
              className="kanban-filter-select"
              value={deadlineFilter}
              onChange={(nextValue) => updateTaskFilter(setDeadlineFilter, nextValue)}
              options={[
                { value: "all", label: "Deadline: Hamısı" },
                { value: "overdue", label: "Gecikmiş" },
                { value: "this_week", label: "Bu həftə" },
                { value: "this_month", label: "Bu ay" },
                { value: "without_deadline", label: "Deadline olmayanlar" },
              ]}
            />
          </div>

          <button type="button" className="kanban-reset-btn" onClick={resetTaskFilters}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            Sıfırla
          </button>
          <div className="kanban-filter-info kanban-filter-summary">
            <span className="kanban-filter-count">
              {kanbanTasks.length} tapşırıq göstərilir
            </span>
            <span className="kanban-new-count">
              Yeni tapşırıqlar: {newKanbanTasksCount}
            </span>
          </div>
        </div>

      {selectedTaskForComments && (
        <TaskModal
          task={selectedTaskForComments}
          onClose={closeTaskComments}
          getTaskAssigneeName={getTaskAssigneeName}
          comments={taskComments}
          newComment={newComment}
          onCommentChange={(event) => setNewComment(event.target.value)}
          onAddComment={addTaskComment}
          onDeleteComment={deleteTaskComment}
          users={users}
          attachments={taskAttachments}
          attachmentsLoading={attachmentsLoading}
          attachmentsError={attachmentsError}
          attachmentUploading={attachmentUploading}
          selectedFileName={selectedFile ? selectedFile.name : "Fayl seçilməyib"}
          onFileSelect={(event) => setSelectedFile(event.target.files?.[0] || null)}
          inputRef={fileInputRef}
          onUploadAttachment={handleUploadAttachment}
          onDeleteAttachment={handleDeleteAttachment}
          onDownloadAttachment={handleDownloadAttachment}
        />
      )}

      <KanbanBoard
        tasks={tasks.filter((task) => task.kanban_enabled !== false)}
        filteredTasks={kanbanTasks}
        kanbanVisibleColumns={kanbanVisibleColumns}
        dragOverColumn={dragOverColumn}
        draggedTaskId={draggedTaskId}
        statusUpdatingId={statusUpdatingId}
        isAdmin={isAdmin}
        onDragOver={handleKanbanDragOver}
        onDrop={handleKanbanDrop}
        onDragStart={handleKanbanDragStart}
        onDragEnd={handleKanbanDragEnd}
        onCardClick={handleKanbanCardClick}
        onShowMore={showMoreKanbanTasks}
        onColumnLeave={() => setDragOverColumn("")}
        canManageTask={canManageTask}
        getTaskAssigneeName={getTaskAssigneeName}
      />
    </div>
  );
}
