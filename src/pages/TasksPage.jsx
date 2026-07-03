import { Fragment, useState, useEffect } from "react";
import CustomSelect from "../components/CustomSelect";
import TaskModal from "../components/TaskModal";
import useBodyScrollLock from "../hooks/useBodyScrollLock";
import api from "../api";
import { isTaskCompleted } from "../utils/helpers";
import {
  TASK_TYPE_OPTIONS,
  PRIORITY_OPTIONS,
  OPERATIONAL_STATUS_OPTIONS,
  TASKS_PAGE_SIZE,
  manualTaskStatusOptions,
  taskStatusOptions,
  getOptionLabel,
} from "../constants/taskConstants";

const TaskFormCloseIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const taskTableColumnOptions = [
  { key: "assignee", label: "İcraçı", defaultVisible: true },
  { key: "task_type", label: "Tapşırıq növü", defaultVisible: false },
  { key: "status", label: "Status", defaultVisible: true },
  { key: "priority", label: "Prioritet", defaultVisible: true },
  { key: "category", label: "Kateqoriya", defaultVisible: false },
  { key: "deadline", label: "Son tarix", defaultVisible: true },
];

const defaultTaskTableColumns = taskTableColumnOptions.reduce(
  (columns, option) => ({
    ...columns,
    [option.key]: option.defaultVisible,
  }),
  {}
);

const TaskPageIcon = ({ name }) => {
  const commonProps = {
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
    search: (
      <svg {...commonProps}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    ),
    filter: (
      <svg {...commonProps}>
        <path d="M4 6h16" />
        <path d="M7 12h10" />
        <path d="M10 18h4" />
      </svg>
    ),
    reset: (
      <svg {...commonProps}>
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v6h6" />
      </svg>
    ),
    export: (
      <svg {...commonProps}>
        <path d="M14 3v4a2 2 0 0 0 2 2h4" />
        <path d="M5 12V5a2 2 0 0 1 2-2h7l6 6v10a2 2 0 0 1-2 2h-5" />
        <path d="M8 17H3" />
        <path d="m6 14 3 3-3 3" />
      </svg>
    ),
    import: (
      <svg {...commonProps}>
        <path d="M14 3v4a2 2 0 0 0 2 2h4" />
        <path d="M5 12V5a2 2 0 0 1 2-2h7l6 6v10a2 2 0 0 1-2 2h-5" />
        <path d="M3 17h6" />
        <path d="m6 14-3 3 3 3" />
      </svg>
    ),
    plus: (
      <svg {...commonProps}>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    ),
    prev: (
      <svg {...commonProps}>
        <path d="m15 18-6-6 6-6" />
      </svg>
    ),
    next: (
      <svg {...commonProps}>
        <path d="m9 18 6-6-6-6" />
      </svg>
    ),
    columns: (
      <svg {...commonProps}>
        <rect width="18" height="16" x="3" y="4" rx="2" />
        <path d="M9 4v16" />
        <path d="M15 4v16" />
      </svg>
    ),
  };

  return icons[name] || null;
};

function TasksPage({
  user,
  isAdminOrManager,
  canManageTask,
  tasks,
  users,
  directionPrograms,
  taskSearch,
  setTaskSearch,
  operationalStatusFilter,
  setOperationalStatusFilter,
  assigneeFilter,
  setAssigneeFilter,
  showAdvancedTaskFilters,
  setShowAdvancedTaskFilters,
  directionFilter,
  setDirectionFilter,
  taskTypeFilter,
  setTaskTypeFilter,
  priorityFilter,
  setPriorityFilter,
  kanbanEnabledFilter,
  setKanbanEnabledFilter,
  deadlineFilter,
  setDeadlineFilter,
  taskAssigneeFilterOptions,
  activeAdvancedTaskFilterCount,
  taskDirectionValues,
  filteredTasks,
  totalTaskPages,
  safeCurrentPage,
  paginatedTasks,
  updateTaskFilter,
  resetTaskFilters,
  showTaskForm,
  setShowTaskForm,
  editingTaskId,
  setEditingTaskId,
  newTask,
  setNewTask,
  taskFormErrors,
  statusControlTaskId,
  setStatusControlTaskId,
  statusUpdatingId,
  saveTask,
  resetTaskForm,
  startEditTask,
  deleteTask,
  handleChangeTaskStatus,
  selectedTaskForComments,
  taskComments,
  newComment,
  setNewComment,
  taskAttachments,
  attachmentsLoading,
  attachmentsError,
  attachmentUploading,
  selectedFile,
  setSelectedFile,
  fileInputRef,
  openTaskComments,
  closeTaskComments,
  addTaskComment,
  deleteTaskComment,
  handleUploadAttachment,
  handleDeleteAttachment,
  handleDownloadAttachment,
  getTaskAssigneeName,
  ActionIcon,
  effectiveTaskTypeOptions,
  effectivePriorityOptions,
  excelExporting,
  excelImporting,
  downloadTasksExcel,
  openExcelImportPicker,
  importTasksExcel,
  excelImportInputRef,
  currentPage,
  setCurrentPage,
  loadUsers,
}) {
  useBodyScrollLock(!!selectedTaskForComments);
  useBodyScrollLock(showTaskForm);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [visibleTaskColumns, setVisibleTaskColumns] = useState(defaultTaskTableColumns);

  // Managed category options — Phase 6D
  const [categoryOptions, setCategoryOptions] = useState(
    () => directionPrograms.map((v) => ({ value: v, label: v, source: "legacy" }))
  );
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryCreateError, setCategoryCreateError] = useState("");

  useEffect(() => {
    api.get("/options/categories").then((res) => {
      if (res.data?.length) setCategoryOptions(res.data);
    }).catch(() => {});
  }, []);

  const handleCreateCategory = async (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const res = await api.post("/options/categories", { name: trimmed });
      const created = res.data; // { value, label, source }
      setCategoryOptions((prev) => {
        const exists = prev.some((c) => c.value.toLowerCase() === created.value.toLowerCase());
        if (!exists) return [...prev, created];
        return prev;
      });
      setNewTask((prev) => ({ ...prev, category: created.value }));
      setShowNewCategoryInput(false);
      setNewCategoryName("");
      setCategoryCreateError("");
    } catch (err) {
      if (err.response?.status === 409) {
        // Already exists — find and select it
        const found = categoryOptions.find(
          (c) => c.value.toLowerCase() === trimmed.toLowerCase()
        );
        if (found) {
          setNewTask((prev) => ({ ...prev, category: found.value }));
          setShowNewCategoryInput(false);
          setNewCategoryName("");
          setCategoryCreateError("");
          return;
        }
      }
      setCategoryCreateError(
        err.response?.data?.detail || "Kateqoriya yaradıla bilmədi"
      );
    }
  };
  const visibleColumnCount =
    2 + taskTableColumnOptions.filter((option) => visibleTaskColumns[option.key]).length;

  const toggleTaskColumn = (columnKey) => {
    setVisibleTaskColumns((currentColumns) => ({
      ...currentColumns,
      [columnKey]: !currentColumns[columnKey],
    }));
  };

  return (
    <div className="section-card">
      <div
        className={[
          "task-filters",
          isAdminOrManager() ? "" : "employee-task-filters",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="task-filter-controls task-header-actions">
          <label className="task-search-field">
            <TaskPageIcon name="search" />
            <input
              type="search"
              className="filter-input"
              placeholder="Tapşırıq, ID və ya təsvir üzrə axtar"
              value={taskSearch}
              onChange={(event) =>
                updateTaskFilter(setTaskSearch, event.target.value)
              }
            />
          </label>

          <CustomSelect
            className="filter-select task-main-status-filter"
            value={operationalStatusFilter}
            onChange={(nextValue) =>
              updateTaskFilter(setOperationalStatusFilter, nextValue)
            }
            options={[
              { value: "", label: "Status seç" },
              ...taskStatusOptions,
            ]}
          />

          <CustomSelect
            className="filter-select task-main-assignee-filter"
            value={assigneeFilter}
            onChange={(nextValue) =>
              updateTaskFilter(setAssigneeFilter, nextValue)
            }
            options={[
              { value: "", label: "İcraçı seç" },
              ...taskAssigneeFilterOptions.map((item) => ({
                value: String(item.id),
                label: item.full_name,
              })),
            ]}
          />

          <button
            type="button"
            className={`advanced-filter-btn${
              activeAdvancedTaskFilterCount ? " has-active-filters" : ""
            }`}
            onClick={() => setShowAdvancedTaskFilters(true)}
          >
            <TaskPageIcon name="filter" />
            Daha çox filter
            {activeAdvancedTaskFilterCount > 0 && (
              <span>{activeAdvancedTaskFilterCount}</span>
            )}
          </button>

          <button
            type="button"
            className="reset-filters-btn"
            onClick={resetTaskFilters}
          >
            <TaskPageIcon name="reset" />
            Sıfırla
          </button>
          <div className="task-column-settings">
            <button
              type="button"
              className="secondary-btn task-column-settings-btn"
              onClick={() => setShowColumnSettings((current) => !current)}
              aria-expanded={showColumnSettings}
            >
              <TaskPageIcon name="columns" />
              Sütunlar
            </button>

            {showColumnSettings && (
              <div className="task-column-menu">
                {taskTableColumnOptions.map((option) => (
                  <label className="task-column-option" key={option.key}>
                    <input
                      type="checkbox"
                      checked={visibleTaskColumns[option.key]}
                      onChange={() => toggleTaskColumn(option.key)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            className="secondary-btn excel-export-btn"
            onClick={downloadTasksExcel}
            disabled={excelExporting || excelImporting}
          >
            <TaskPageIcon name="export" />
            Excel ixracı
          </button>
          {isAdminOrManager() && (
            <>
              <button
                type="button"
                className="secondary-btn excel-import-btn"
                onClick={openExcelImportPicker}
                disabled={excelExporting || excelImporting}
              >
                <TaskPageIcon name="import" />
                Excel importu
              </button>
              <input
                ref={excelImportInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="visually-hidden-file"
                onChange={importTasksExcel}
              />
              <button
                className="primary-btn"
                onClick={() => {
                  if (showTaskForm) {
                    resetTaskForm();
                  } else {
                    setEditingTaskId(null);
                    setShowTaskForm(true);
                    loadUsers();
                  }
                }}
              >
                <TaskPageIcon name="plus" />
                {showTaskForm ? "Formu bağla" : "Yeni tapşırıq"}
              </button>
            </>
          )}
        </div>
      </div>

      {showAdvancedTaskFilters && (
        <div
          className="filter-drawer-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowAdvancedTaskFilters(false);
            }
          }}
        >
          <aside
            className="filter-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="advanced-filter-title"
          >
            <div className="filter-drawer-header">
              <div>
                <p>Tapşırıq filterləri</p>
                <h3 id="advanced-filter-title">Daha çox filter</h3>
              </div>
              <button
                type="button"
                className="filter-drawer-close"
                aria-label="Filter panelini bağla"
                onClick={() => setShowAdvancedTaskFilters(false)}
              >
                ×
              </button>
            </div>

            <div className="filter-drawer-body">
              <label className="filter-drawer-field">
                <span>Kateqoriya</span>
                <CustomSelect
                  className="filter-select"
                  value={directionFilter}
                  onChange={(nextValue) =>
                    updateTaskFilter(setDirectionFilter, nextValue)
                  }
                  options={[
                    { value: "", label: "Kateqoriya seç" },
                    ...categoryOptions.map((c) => ({ value: c.value, label: c.label })),
                  ]}
                />
              </label>

              <label className="filter-drawer-field">
                <span>Prioritet</span>
                <CustomSelect
                  className="filter-select"
                  value={priorityFilter}
                  onChange={(nextValue) =>
                    updateTaskFilter(setPriorityFilter, nextValue)
                  }
                  options={[
                    { value: "", label: "Prioritet seç" },
                    ...PRIORITY_OPTIONS,
                  ]}
                />
              </label>

              <label className="filter-drawer-field">
                <span>Kanban</span>
                <CustomSelect
                  className="filter-select"
                  value={kanbanEnabledFilter}
                  onChange={(nextValue) =>
                    updateTaskFilter(setKanbanEnabledFilter, nextValue)
                  }
                  options={[
                    { value: "all", label: "Hamısı" },
                    { value: "true", label: "Kanbanda göstərilir" },
                    { value: "false", label: "Kanbanda göstərilmir" },
                  ]}
                />
              </label>

              <label className="filter-drawer-field">
                <span>Deadline</span>
                <CustomSelect
                  className="filter-select"
                  value={deadlineFilter}
                  onChange={(nextValue) =>
                    updateTaskFilter(setDeadlineFilter, nextValue)
                  }
                  options={[
                    { value: "all", label: "Hamısı" },
                    { value: "overdue", label: "Gecikmiş" },
                    { value: "this_week", label: "Bu həftə" },
                    { value: "this_month", label: "Bu ay" },
                    { value: "without_deadline", label: "Deadline olmayanlar" },
                  ]}
                />
              </label>
            </div>

            <div className="filter-drawer-footer">
              <button
                type="button"
                className="reset-filters-btn"
                onClick={resetTaskFilters}
              >
                Sıfırla
              </button>
              <button
                type="button"
                className="primary-btn"
                onClick={() => setShowAdvancedTaskFilters(false)}
              >
                Hazırdır
              </button>
            </div>
          </aside>
        </div>
      )}

      {showTaskForm && (isAdminOrManager() || (user.role_id === 3 && editingTaskId)) && (
        <div
          className="task-form-overlay task-edit-form-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-form-title"
          onClick={resetTaskForm}
        >
          <div className="task-modal task-edit-modal" onClick={(e) => e.stopPropagation()}>
            <form className="task-form task-edit-form" onSubmit={saveTask}>
              <div className="modal-header task-edit-modal-header">
                <h3 id="task-form-title">
                  {editingTaskId
                    ? user.role_id === 3
                      ? "Tapşırıq statusunu dəyiş"
                      : "Tapşırığı redaktə et"
                    : "Yeni tapşırıq"}
                </h3>

                <button
                  type="button"
                  className="task-edit-close-btn"
                  onClick={resetTaskForm}
                  aria-label="Formu bağla"
                >
                  <TaskFormCloseIcon />
                </button>
              </div>
              <div className="modal-form-grid task-edit-form-grid">
                <div className="form-field">
                  <label>Başlıq</label>
                  <input
                    type="text"
                    value={newTask.title}
                    autoFocus={user.role_id !== 3}
                    maxLength={120}
                    placeholder="Məsələn: Aylıq hesabatı hazırla"
                    onChange={(e) =>
                      setNewTask({ ...newTask, title: e.target.value })
                    }
                    disabled={user.role_id === 3}
                  />
                  {taskFormErrors.title && (
                    <p className="form-error-text">{taskFormErrors.title}</p>
                  )}
                </div>

                <div className="form-field">
                  <label>Status</label>
                  <CustomSelect
                    value={newTask.operational_status}
                    onChange={(nextValue) =>
                      setNewTask({ ...newTask, operational_status: nextValue })
                    }
                    options={manualTaskStatusOptions}
                  />
                  {taskFormErrors.operational_status && (
                    <p className="form-error-text">{taskFormErrors.operational_status}</p>
                  )}
                </div>

                <div className="form-field">
                  <label>Prioritet</label>
                  <CustomSelect
                    value={newTask.priority}
                    onChange={(nextValue) =>
                      setNewTask({ ...newTask, priority: nextValue })
                    }
                    options={PRIORITY_OPTIONS}
                    disabled={user.role_id === 3}
                  />
                  {taskFormErrors.priority && (
                    <p className="form-error-text">{taskFormErrors.priority}</p>
                  )}
                </div>

                <div className="form-field">
                  <label>Kateqoriya</label>
                  <CustomSelect
                    value={newTask.category}
                    onChange={(nextValue) => {
                      if (nextValue === "__new__") {
                        setShowNewCategoryInput(true);
                        setNewCategoryName("");
                        setCategoryCreateError("");
                        return;
                      }
                      setNewTask({ ...newTask, category: nextValue });
                    }}
                    options={[
                      { value: "", label: "Seçilməyib" },
                      ...categoryOptions.map((c) => ({ value: c.value, label: c.label })),
                      ...(user.role_id !== 3
                        ? [{ value: "__new__", label: "+ Yeni kateqoriya əlavə et" }]
                        : []),
                    ]}
                    disabled={user.role_id === 3}
                    typeaheadTimeout={3000}
                  />
                  {showNewCategoryInput && (
                    <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                      <input
                        type="text"
                        className="custom-field-key"
                        placeholder="Kateqoriya adı"
                        value={newCategoryName}
                        autoFocus
                        onChange={(e) => {
                          setNewCategoryName(e.target.value);
                          setCategoryCreateError("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const trimmed = newCategoryName.trim();
                            if (!trimmed) return;
                            handleCreateCategory(trimmed);
                          }
                          if (e.key === "Escape") {
                            setShowNewCategoryInput(false);
                            setNewCategoryName("");
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="custom-field-add-btn"
                        onClick={() => {
                          const trimmed = newCategoryName.trim();
                          if (!trimmed) return;
                          handleCreateCategory(trimmed);
                        }}
                      >
                        Əlavə et
                      </button>
                      <button
                        type="button"
                        className="custom-field-remove-btn"
                        onClick={() => {
                          setShowNewCategoryInput(false);
                          setNewCategoryName("");
                          setCategoryCreateError("");
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  {categoryCreateError && (
                    <p className="form-error-text" style={{ marginTop: 4 }}>{categoryCreateError}</p>
                  )}
                </div>

                <div className="form-field">
                  <label>Kanban</label>
                  <label className="filter-checkbox">
                    <input
                      type="checkbox"
                      checked={newTask.kanban_enabled}
                      onChange={(event) =>
                        setNewTask({
                          ...newTask,
                          kanban_enabled: event.target.checked,
                        })
                      }
                      disabled={user.role_id === 3}
                    />
                    <span>{newTask.kanban_enabled ? "Bəli" : "Xeyr"}</span>
                  </label>
                </div>

                <div className="form-field">
                  <label>İcraçı işçi</label>
                  <CustomSelect
                    value={newTask.assigned_to_id}
                    onChange={(nextValue) =>
                      setNewTask({ ...newTask, assigned_to_id: nextValue })
                    }
                    options={[
                      { value: "", label: "İşçi seç" },
                      ...users.map((item) => ({
                        value: String(item.id),
                        label: item.full_name || item.name || item.email || "İstifadəçi",
                      })),
                    ]}
                    disabled={user.role_id === 3}
                    typeaheadTimeout={3000}
                  />
                  {taskFormErrors.assigned_to_id && (
                    <p className="form-error-text">{taskFormErrors.assigned_to_id}</p>
                  )}
                </div>

                <div className="form-field">
                  <label>Son tarix</label>
                  <input
                    type="date"
                    value={newTask.deadline}
                    onChange={(e) =>
                      setNewTask({ ...newTask, deadline: e.target.value })
                    }
                    disabled={user.role_id === 3}
                  />
                  {taskFormErrors.deadline && (
                    <p className="form-error-text">{taskFormErrors.deadline}</p>
                  )}
                </div>
              </div>

              <div className="form-field form-field-full">
                <label>Təsvir</label>
                <textarea
                  value={newTask.description}
                  placeholder="Tapşırıq haqqında qısa qeyd yaz..."
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  disabled={user.role_id === 3}
                />
              </div>

              {/* ── Əlavə sahələr (custom_fields) ── */}
              {user.role_id !== 3 && (
                <div className="form-field form-field-full">
                  <label>Əlavə sahələr</label>
                  <div className="custom-fields-list">
                    {Object.keys(newTask.custom_fields || {}).length === 0 && (
                      <p className="custom-fields-empty">Əlavə sahə yoxdur</p>
                    )}
                    {Object.entries(newTask.custom_fields || {}).map(([key, value], idx) => (
                      <div className="custom-field-row" key={idx}>
                        <input
                          type="text"
                          className="custom-field-key"
                          placeholder="Sahə adı"
                          value={key}
                          onChange={(e) => {
                            const newKey = e.target.value;
                            const fields = { ...(newTask.custom_fields || {}) };
                            const oldValue = fields[key];
                            delete fields[key];
                            if (newKey.trim()) {
                              fields[newKey.trim()] = oldValue;
                            } else if (oldValue) {
                              fields[key] = oldValue;
                            }
                            setNewTask({ ...newTask, custom_fields: fields });
                          }}
                        />
                        <input
                          type="text"
                          className="custom-field-value"
                          placeholder="Dəyər"
                          value={value}
                          onChange={(e) => {
                            const fields = { ...(newTask.custom_fields || {}) };
                            if (e.target.value.trim()) {
                              fields[key] = e.target.value;
                            } else {
                              delete fields[key];
                            }
                            setNewTask({ ...newTask, custom_fields: fields });
                          }}
                        />
                        <button
                          type="button"
                          className="custom-field-remove-btn"
                          title="Sahəni sil"
                          onClick={() => {
                            const fields = { ...(newTask.custom_fields || {}) };
                            delete fields[key];
                            setNewTask({ ...newTask, custom_fields: fields });
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="custom-field-add-btn"
                    onClick={() => {
                      const fields = { ...(newTask.custom_fields || {}) };
                      if (!fields[""]) {
                        fields[""] = "";
                        setNewTask({ ...newTask, custom_fields: fields });
                      }
                    }}
                  >
                    + Əlavə et
                  </button>
                </div>
              )}

              <div className="modal-footer task-edit-modal-footer">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={resetTaskForm}
                >
                  Ləğv et
                </button>
                <button type="submit" className="primary-btn">
                  {editingTaskId ? "Tapşırığı yenilə" : "Tapşırığı yarat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTaskForComments && (
        <TaskModal
          task={selectedTaskForComments}
          onClose={closeTaskComments}
          getTaskAssigneeName={getTaskAssigneeName}
          comments={taskComments}
          newComment={newComment}
          onCommentChange={(e) => setNewComment(e.target.value)}
          onAddComment={addTaskComment}
          onDeleteComment={deleteTaskComment}
          users={users}
          attachments={taskAttachments}
          attachmentsLoading={attachmentsLoading}
          attachmentsError={attachmentsError}
          attachmentUploading={attachmentUploading}
          selectedFileName={selectedFile ? selectedFile.name : "Fayl seçilməyib"}
          onFileSelect={(e) => setSelectedFile(e.target.files?.[0] || null)}
          inputRef={fileInputRef}
          onUploadAttachment={handleUploadAttachment}
          onDeleteAttachment={handleDeleteAttachment}
          onDownloadAttachment={handleDownloadAttachment}
        />
      )}

      <>
        <div className="tasks-table-wrapper">
          <table className="tasks-table">
            <thead>
              <tr>
                <th className="task-col-title">Başlıq</th>
                {visibleTaskColumns.assignee && <th className="task-col-assignee">İcraçı</th>}
                {visibleTaskColumns.task_type && <th className="task-col-type">Tapşırıq növü</th>}
                {visibleTaskColumns.status && <th className="task-col-status">Status</th>}
                {visibleTaskColumns.priority && <th className="task-col-priority">Prioritet</th>}
                {visibleTaskColumns.category && <th className="task-col-category">Kateqoriya</th>}
                {visibleTaskColumns.deadline && <th className="task-col-deadline">Son tarix</th>}
                <th className="task-col-actions">Əməliyyat</th>
              </tr>
            </thead>

            <tbody>
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumnCount} className="empty-cell">
                    Task tapılmadı
                  </td>
                </tr>
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumnCount} className="empty-cell">
                    Nəticə tapılmadı
                  </td>
                </tr>
              ) : (
                <>
                  {paginatedTasks.map((task) => {
                    const assigneeName = getTaskAssigneeName(task);
                    const taskEditActionLabel = user.role_id === 3 ? "Status" : "Redaktə";
                    const taskEditActionIcon = user.role_id === 3 ? "status" : "edit";

                    return (
                      <Fragment key={task.id}>
                        <tr className="task-table-row">
                          <td className="task-col-title">
                            <div className="task-title-cell">
                              <strong>{task.title}</strong>
                            </div>
                          </td>

                          {visibleTaskColumns.assignee && (
                            <td className="task-col-assignee">{assigneeName}</td>
                          )}

                          {visibleTaskColumns.task_type && (
                            <td className="task-col-type">{getOptionLabel(TASK_TYPE_OPTIONS, task.task_type, task.task_type)}</td>
                          )}

                          {visibleTaskColumns.status && (
                            <td className="task-col-status">
                              <span className={`badge status-${task.operational_status || "new"}`}>
                                {getOptionLabel(OPERATIONAL_STATUS_OPTIONS, task.operational_status, task.operational_status) ||
                                  "Yeni"}
                              </span>
                            </td>
                          )}

                          {visibleTaskColumns.priority && (
                            <td className="task-col-priority">
                              <span className={`badge priority-${task.priority}`}>
                                {getOptionLabel(PRIORITY_OPTIONS, task.priority, task.priority)}
                              </span>
                            </td>
                          )}

                          {visibleTaskColumns.category && (
                            <td className="task-col-category">{task.category || task.direction_program || "—"}</td>
                          )}

                          {visibleTaskColumns.deadline && (
                            <td className="task-col-deadline">
                              {task.deadline
                                ? (
                                  <span
                                    className={
                                      new Date(task.deadline) < new Date() &&
                                      !isTaskCompleted(task)
                                        ? "deadline-overdue-pill"
                                        : "deadline-normal"
                                    }
                                  >
                                    {new Date(task.deadline).toLocaleDateString("az-AZ")}
                                  </span>
                                )
                                : "-"}
                            </td>
                          )}

                            <td className="task-col-actions">
                              <div className="table-actions">
                                {canManageTask(task) && (
                                  <button
                                    type="button"
                                    className="action-btn details-btn icon-only-btn"
                                    onClick={() => openTaskComments(task)}
                                    aria-label="Detallar"
                                    title="Detallar"
                                  >
                                    <ActionIcon name="details" />
                                  </button>
                                )}

                                {canManageTask(task) && (
                                  <button
                                    type="button"
                                    className="action-btn edit-btn icon-only-btn"
                                    onClick={() => {
                                      if (user.role_id === 3) {
                                        setStatusControlTaskId((currentId) =>
                                          currentId === task.id ? null : task.id
                                        );
                                      } else {
                                        startEditTask(task);
                                      }
                                    }}
                                    aria-label={taskEditActionLabel}
                                    title={taskEditActionLabel}
                                  >
                                    <ActionIcon name={taskEditActionIcon} />
                                  </button>
                                )}

                                {isAdminOrManager() && (
                                  <button
                                    type="button"
                                    className="action-btn delete-btn icon-only-btn"
                                    onClick={() => deleteTask(task.id)}
                                    aria-label="Sil"
                                    title="Sil"
                                  >
                                    <ActionIcon name="delete" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                          {user.role_id === 3 && statusControlTaskId === task.id && (
                            <tr className="status-control-row">
                              <td colSpan={visibleColumnCount}>
                                <div className="inline-status-control">
                                  <span className="status-control-label">
                                    Statusu dəyiş
                                  </span>

                                  <CustomSelect
                                    className="status-select"
                                    value={task.operational_status || "waiting"}
                                    disabled={statusUpdatingId === task.id}
                                    onChange={(nextValue) =>
                                      handleChangeTaskStatus(
                                        task.id,
                                        nextValue,
                                        "operational_status"
                                      )
                                    }
                                    options={manualTaskStatusOptions}
                                  />

                                  {statusUpdatingId === task.id && (
                                    <small className="status-update-hint">
                                      Status yenilənir...
                                    </small>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                    );
                  })}
                  {paginatedTasks.length < TASKS_PAGE_SIZE &&
                    Array.from(
                      { length: TASKS_PAGE_SIZE - paginatedTasks.length },
                      (_, i) => (
                        <tr key={`ph-${i}`} className="tasks-placeholder-row">
                          <td colSpan={visibleColumnCount} aria-hidden="true" />
                        </tr>
                      )
                    )}
                </>
              )}
            </tbody>
          </table>
        </div>
        {filteredTasks.length > TASKS_PAGE_SIZE && (
          <div className="pagination-controls">
            <button
              type="button"
              className="pagination-btn"
              disabled={safeCurrentPage === 1}
              onClick={() =>
                setCurrentPage((pageNumber) => Math.max(1, pageNumber - 1))
              }
            >
              <TaskPageIcon name="prev" />
              Əvvəlki
            </button>

            <span className="pagination-status">
              Səhifə {safeCurrentPage} / {totalTaskPages}
            </span>

            <button
              type="button"
              className="pagination-btn"
              disabled={safeCurrentPage === totalTaskPages}
              onClick={() =>
                setCurrentPage((pageNumber) =>
                  Math.min(totalTaskPages, pageNumber + 1)
                )
              }
            >
              Növbəti
              <TaskPageIcon name="next" />
            </button>
          </div>
        )}
      </>
    </div>
  );
}

export default TasksPage;
