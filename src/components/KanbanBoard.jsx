import { getDeadlineInfo, formatDate } from "../utils/helpers";
import { PRIORITY_OPTIONS, OPERATIONAL_STATUS_OPTIONS, getOptionLabel } from "../constants/taskConstants";

const SvgIcon = ({ children, className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {children}
  </svg>
);

const UserIcon = () => (
  <SvgIcon className="kanban-meta-icon">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </SvgIcon>
);

const CalendarIcon = () => (
  <SvgIcon className="kanban-meta-icon">
    <rect width="18" height="18" x="3" y="4" rx="2" />
    <path d="M16 2v4" />
    <path d="M8 2v4" />
    <path d="M3 10h18" />
  </SvgIcon>
);

const getKanbanStatusBadgeValue = (status) =>
  status === "in_progress" ? "active" : status || "new";

const getKanbanStatusBadgeLabel = (status) =>
  status === "in_progress"
    ? getOptionLabel(OPERATIONAL_STATUS_OPTIONS, "active", "İcradadır")
    : getOptionLabel(OPERATIONAL_STATUS_OPTIONS, status, "Yeni");

const KanbanStatusIcon = ({ name }) => {
  const iconProps = {
    className: "kanban-column-icon",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    focusable: "false",
  };

  const icons = {
    planned: (
      <>
        <rect width="18" height="18" x="3" y="4" rx="2" />
        <path d="M3 10h18" />
        <path d="M8 2v4" />
        <path d="M16 2v4" />
      </>
    ),
    active: (
      <>
        <path d="m9 18 6-6-6-6" />
      </>
    ),
    completed: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    overdue: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6" />
        <path d="M12 17h.01" />
      </>
    ),
    waiting: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    within_deadline: (
      <>
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect width="18" height="18" x="3" y="4" rx="2" />
        <path d="M3 10h18" />
      </>
    ),
  };

  return <svg {...iconProps}>{icons[name] || icons.waiting}</svg>;
};

export default function KanbanBoard({
  tasks,
  filteredTasks,
  kanbanVisibleColumns,
  dragOverColumn,
  draggedTaskId,
  statusUpdatingId,
  isAdmin,
  onDragOver,
  onDrop,
  onDragStart,
  onDragEnd,
  onCardClick,
  onShowMore,
  onColumnLeave,
  canManageTask,
  getTaskAssigneeName,
}) {
  return (
    <div
      className={
        isAdmin
          ? "kanban-board"
          : "kanban-board employee-kanban-board"
      }
      aria-label="Kanban görünüşü"
    >
      {tasks.length === 0 ? (
        <div className="kanban-empty-state">Task tapılmadı</div>
      ) : filteredTasks.length === 0 ? (
        <div className="kanban-empty-state">Nəticə tapılmadı</div>
      ) : (
        kanbanVisibleColumns.map((column) => {
          const visibleTasks = column.tasks;
          const hasMoreTasks = false;

          return (
            <section
              className={`kanban-column kanban-column-${column.key}${
                dragOverColumn === column.key ? " kanban-column-drag-over" : ""
              }${column.targetStatus ? "" : " kanban-column-readonly"}`}
              key={column.key}
              onDragOver={(event) => onDragOver(event, column)}
              onDragLeave={onColumnLeave}
              onDrop={(event) => onDrop(event, column)}
            >
              <div className="kanban-column-header">
                <div className="kanban-column-header-left">
                  <KanbanStatusIcon name={column.key} />
                  <h3>{column.title}</h3>
                  {column.tasks.length > 25 && (
                    <span className="kanban-overloaded-badge">Çox yüklənib</span>
                  )}
                </div>
                <span className="kanban-column-count">{column.tasks.length}</span>
              </div>

              <div className="kanban-card-list">
                {visibleTasks.length === 0 ? (
                  <p className="kanban-column-empty">Bu sütunda tapşırıq yoxdur</p>
                ) : (
                  visibleTasks.map((task) => {
                    const deadlineInfo = getDeadlineInfo(task);
                    const projectName = task.project?.name || task.project_name;
                    const assigneeName = getTaskAssigneeName(task);
                    const hasAssignee = assigneeName && assigneeName !== "—";
                    const showComputedOverdueBadge =
                      task.kanbanLane === "overdue" && task.operational_status !== "overdue";
                    const statusBadgeValue = getKanbanStatusBadgeValue(
                      task.operational_status
                    );

                    return (
                    <article
                      className={`kanban-card${
                        draggedTaskId === task.id ? " kanban-card-dragging" : ""
                      }`}
                      key={task.id}
                      draggable={canManageTask(task) && statusUpdatingId !== task.id}
                      onDragStart={(event) =>
                        onDragStart(event, task.id)
                      }
                      onDragEnd={onDragEnd}
                      onClick={() => onCardClick(task)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onCardClick(task);
                        }
                      }}
                    >
                      <div className="kanban-card-header">
                        <h4 title={task.title}>{task.title || "Başlıqsız tapşırıq"}</h4>
                        {task.priority && (
                          <span className={`badge priority-${task.priority}`}>
                            {getOptionLabel(PRIORITY_OPTIONS, task.priority, task.priority)}
                          </span>
                        )}
                      </div>

                      <div className="kanban-card-status-row">
                        {showComputedOverdueBadge && (
                          <span className="kanban-status-badge kanban-status-overdue">
                            Gecikmə
                          </span>
                        )}
                        <span className={`kanban-status-badge kanban-status-${statusBadgeValue}`}>
                          {getKanbanStatusBadgeLabel(task.operational_status)}
                        </span>
                      </div>

                      {projectName && (
                        <div className="kanban-card-project-row">
                          <span className="kanban-project-pill" title={projectName}>
                            {projectName}
                          </span>
                        </div>
                      )}

                      <div className="kanban-card-meta">
                        {hasAssignee && (
                          <div className="kanban-meta-row">
                            <UserIcon />
                            <span className="kanban-meta-text">{assigneeName}</span>
                          </div>
                        )}

                        {task.deadline && (
                          <div className="kanban-meta-row">
                            <CalendarIcon />
                            <span className="kanban-meta-text">
                              Son tarix: {formatDate(task.deadline)}
                            </span>
                            {deadlineInfo && (
                              <span
                                className={`kanban-deadline-icon deadline-${deadlineInfo.className}`}
                                title={deadlineInfo.title}
                                aria-label={deadlineInfo.title}
                              >
                                {deadlineInfo.icon}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                    </article>
                    );
                  })
                )}
              </div>

              {hasMoreTasks && (
                <button
                  type="button"
                  className="kanban-show-more"
                  onClick={() => onShowMore(column.key)}
                >
                  Daha çox göstər
                </button>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}
