import CustomSelect from "../components/CustomSelect";
import useBodyScrollLock from "../hooks/useBodyScrollLock";

const ProjectDetailIcon = ({ name }) => {
  const iconProps = {
    className: "project-detail-icon",
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
    project: (
      <>
        <path d="M4 5a2 2 0 0 1 2-2h8l6 6v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
        <path d="M14 3v6h6" />
      </>
    ),
    code: (
      <>
        <path d="M8 9 4 12l4 3" />
        <path d="m16 9 4 3-4 3" />
        <path d="m14 5-4 14" />
      </>
    ),
    owner: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    name: (
      <>
        <path d="M4 7h16" />
        <path d="M4 12h12" />
        <path d="M4 17h10" />
      </>
    ),
    approach: (
      <>
        <path d="M4 19V5" />
        <path d="M4 7h11l-2 4 2 4H4" />
      </>
    ),
    direction: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </>
    ),
    description: (
      <>
        <path d="M6 4h12v16H6z" />
        <path d="M9 9h6" />
        <path d="M9 13h6" />
        <path d="M9 17h4" />
      </>
    ),
    tasks: (
      <>
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </>
    ),
    active: <path d="M4 12h4l3 8 5-16 3 8h1" />,
    completed: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m9 12 2 2 4-5" />
      </>
    ),
    delay: (
      <>
        <path d="M10.3 4.3 2.5 18a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </>
    ),
    kanban: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M9 4v16" />
        <path d="M15 4v16" />
      </>
    ),
  };

  return <svg {...iconProps}>{icons[name] || icons.project}</svg>;
};

function ProjectsPage({
  projects,
  tasks,
  selectedProject,
  projectStages,
  projectSearch,
  projectDirectionFilter,
  projectApproachFilter,
  projectActiveFilter,
  projectOwnerFilter,
  showProjectForm,
  editingProjectId,
  projectForm,
  projectFormErrors,
  showStageForm,
  editingStageId,
  stageForm,
  stageFormErrors,
  directionPrograms,
  projectStageStatusOptions,
  projectStageNameOptions,
  projectApproachFallbacks,
  getProjectStageStatusLabel,
  getProjectStageStatusBadgeClass,
  getTaskAssigneeName,
  operationalStatusLabels,
  priorityLabels,
  taskTypeLabels,
  formatDate,
  ActionIcon,
  getTaskOperationalStatus,
  onOpenProjectDetails,
  onCloseProjectDetails,
  onSaveProject,
  onEditProject,
  onDeleteProject,
  onResetProjectForm,
  onSaveStage,
  onEditStage,
  onDeleteStage,
  onResetStageForm,
  onFilterReset,
  setProjectSearch,
  setProjectDirectionFilter,
  setProjectApproachFilter,
  setProjectActiveFilter,
  setProjectOwnerFilter,
  setProjectForm,
  setStageForm,
  setShowProjectForm,
  setShowStageForm,
}) {
  useBodyScrollLock(showProjectForm);
  useBodyScrollLock(showStageForm);

  /* ---------- Approach label mapping ---------- */
  const approachLabels = {
    "Predictive": "Proqnozlaşdırıcı",
    "Hybrid": "Hibrid",
    "Agile": "Çevik (Agile)",
    "Waterfall": "Proqnozlaşdırıcı",
  };

  /* ---------- Project computations ---------- */

  const projectDirectionValues = [...new Set(
    projects.map((project) => project.direction_program).filter(Boolean)
  )].sort((first, second) => first.localeCompare(second, "az"));
  const projectApproachValues = [...new Set(
    projects.map((project) => project.approach).filter(Boolean)
  )].sort((first, second) => first.localeCompare(second, "az"));
  const projectOwnerValues = [...new Set(
    projects.map((project) => project.owner).filter(Boolean)
  )].sort((first, second) => first.localeCompare(second, "az"));

  const getProjectTasks = (project) => {
    const projectId = String(project.id || "");
    const projectName = String(project.name || "").trim().toLocaleLowerCase("az");

    return tasks.filter((task) => {
      const taskProjectId = String(task.project_id || task.projectId || task.project?.id || "");
      const taskProjectName = String(
        task.project_name ||
          task.project?.name ||
          (typeof task.project === "string" ? task.project : "")
      )
        .trim()
        .toLocaleLowerCase("az");

      return (
        (projectId && taskProjectId === projectId) ||
        (projectName && taskProjectName === projectName)
      );
    });
  };

  const filteredProjects = projects.filter((project) => {
    const searchValue = projectSearch.trim().toLowerCase();
    const matchesSearch =
      !searchValue ||
      [project.code, project.name, project.owner]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchValue));
    const matchesDirection =
      !projectDirectionFilter || project.direction_program === projectDirectionFilter;
    const matchesApproach =
      !projectApproachFilter || project.approach === projectApproachFilter;
    const matchesOwner = !projectOwnerFilter || project.owner === projectOwnerFilter;
    const matchesActive =
      projectActiveFilter === "all" ||
      (projectActiveFilter === "active" && project.is_active !== false) ||
      (projectActiveFilter === "inactive" && project.is_active === false);

    return matchesSearch && matchesDirection && matchesApproach && matchesOwner && matchesActive;
  });

  const activeProjectCount = new Set(
    tasks
      .map((task) => {
        const projectName =
          task.project_name ??
          task.project?.name ??
          (typeof task.project === "string" ? task.project : "");
        const normalizedProjectName = String(projectName || "").trim();
        const projectId = task.project_id ?? task.projectId ?? task.project?.id;
        const projectKey = normalizedProjectName || projectId;
        const statusValue =
          task.status_name ?? task.status?.name ?? task.status ?? "";
        const status = String(statusValue).trim();
        const normalizedStatus = status.toLocaleLowerCase("az");
        const normalizedOperationalStatus = String(
          task.operational_status || ""
        )
          .trim()
          .toLocaleLowerCase("az");

        return {
          projectKey,
          status,
          isCompleted:
            ["tam icra", "tamamlanıb", "completed"].includes(
              normalizedStatus
            ) || normalizedOperationalStatus === "completed",
        };
      })
      .filter(
        ({ projectKey, status, isCompleted }) =>
          projectKey !== null &&
          projectKey !== undefined &&
          String(projectKey).trim() !== "" &&
          status !== "" &&
          !isCompleted
      )
      .map(({ projectKey }) => String(projectKey).trim())
  ).size;

  const selectedProjectTasks = selectedProject
    ? tasks.filter(
        (task) =>
          String(task.project_id || "") === String(selectedProject.id) ||
          String(task.project?.id || "") === String(selectedProject.id)
      )
    : [];
  const selectedProjectInProgressTasks = selectedProjectTasks.filter(
    (task) => getTaskOperationalStatus(task) === "active"
  ).length;
  const selectedProjectCompletedTasks = selectedProjectTasks.filter(
    (task) => getTaskOperationalStatus(task) === "completed"
  ).length;
  const selectedProjectOverdueTasks = selectedProjectTasks.filter(
    (task) =>
      getTaskOperationalStatus(task) === "overdue" ||
      (task.deadline &&
        new Date(task.deadline) < new Date() &&
        getTaskOperationalStatus(task) !== "completed")
  ).length;
  const selectedProjectKanbanTasks = selectedProjectTasks.filter(
    (task) => task.kanban_enabled !== false
  ).length;
  const clampPercent = (value) => {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) {
      return null;
    }
    return Math.min(100, Math.max(0, numberValue));
  };
  const renderStagePercent = (value) => {
    const percent = clampPercent(value);
    if (percent == null || value === null || value === undefined || value === "") {
      return "—";
    }

    return (
      <div className="project-detail-progress">
        <div className="project-detail-progress-track" aria-hidden="true">
          <span
            className="project-detail-progress-fill"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="project-detail-progress-value">{percent}%</span>
      </div>
    );
  };

  /* ---------- Render ---------- */

  return (
    <>
      {selectedProject && (
        <div className="project-detail-card">
          {/* Back button */}
          <button
            type="button"
            className="project-detail-back"
            onClick={onCloseProjectDetails}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            Layihələrə qayıt
          </button>

          {/* Header: title + status badge */}
          <div className="project-detail-header">
            <div className="project-detail-heading">
              <span className="project-detail-avatar">
                <ProjectDetailIcon name="project" />
              </span>
              <div className="project-detail-heading-text">
                <span className="project-detail-eyebrow">Layihə profili</span>
                <h2 className="project-detail-title">{selectedProject.name}</h2>
              </div>
            </div>
            <span className={`project-detail-badge ${selectedProject.is_active !== false ? "active" : "inactive"}`}>
              {selectedProject.is_active !== false ? "Aktiv" : "Deaktiv"}
            </span>
          </div>

          {/* Info grid */}
          <div className="project-detail-info-grid">
            <div className="project-detail-info-item">
              <span className="project-detail-info-label">Layihə_İD / Kod</span>
              <span className="project-detail-info-icon"><ProjectDetailIcon name="code" /></span>
              <strong className="project-detail-info-value">{selectedProject.code || selectedProject.id || "—"}</strong>
            </div>
            <div className="project-detail-info-item">
              <span className="project-detail-info-label">Layihənin adı</span>
              <span className="project-detail-info-icon"><ProjectDetailIcon name="name" /></span>
              <strong className="project-detail-info-value">{selectedProject.name || "—"}</strong>
            </div>
            <div className="project-detail-info-item">
              <span className="project-detail-info-label">İstiqamət/Proqram</span>
              <span className="project-detail-info-icon"><ProjectDetailIcon name="direction" /></span>
              <strong className="project-detail-info-value">{selectedProject.direction_program || "—"}</strong>
            </div>
            <div className="project-detail-info-item">
              <span className="project-detail-info-label">Sahibi</span>
              <span className="project-detail-info-icon"><ProjectDetailIcon name="owner" /></span>
              <strong className="project-detail-info-value">{selectedProject.owner || "—"}</strong>
            </div>
            <div className="project-detail-info-item">
              <span className="project-detail-info-label">Yanaşma</span>
              <span className="project-detail-info-icon"><ProjectDetailIcon name="approach" /></span>
              <strong className="project-detail-info-value">{approachLabels[selectedProject.approach] || selectedProject.approach || "—"}</strong>
            </div>
            <div className="project-detail-info-item project-detail-info-item-full project-detail-description-item">
              <span className="project-detail-info-label">Təsvir</span>
              <span className="project-detail-info-icon"><ProjectDetailIcon name="description" /></span>
              <strong className="project-detail-info-value">
                {selectedProject.description && selectedProject.description !== "—"
                  ? selectedProject.description
                  : <span className="project-detail-description-empty">Təsvir əlavə edilməyib</span>
                }
              </strong>
            </div>
          </div>

          {/* Stats grid */}
          <div className="project-detail-stats-grid">
            {[
              ["Ümumi tapşırıq", selectedProjectTasks.length],
              ["İcradadır", selectedProjectInProgressTasks],
              ["Tam icra", selectedProjectCompletedTasks],
              ["Gecikmə", selectedProjectOverdueTasks],
              ["Kanbanda", selectedProjectKanbanTasks],
            ].map(([label, value], index) => (
              <div
                className={`project-detail-stat-card ${["", "project-detail-stat-card-info", "project-detail-stat-card-success", "project-detail-stat-card-warning", "project-detail-stat-card-neutral"][index]}`}
                key={label}
                title={index === 3 ? "Son tarixi keçmiş aktiv tapşırıq" : undefined}
              >
                <span className="project-detail-stat-icon">
                  <ProjectDetailIcon name={["tasks", "active", "completed", "delay", "kanban"][index]} />
                </span>
                <span className="project-detail-stat-label">{label}</span>
                <strong className="project-detail-stat-value">{value}</strong>
              </div>
            ))}
          </div>

          {/* Stages section */}
          <section className="project-detail-stages-section">
            <div className="project-detail-stages-header">
              <div>
                <h3 className="project-detail-stages-title">Mərhələlər</h3>
                <span className="project-detail-stages-count">{projectStages.length} mərhələ göstərilir</span>
              </div>
              <button
                type="button"
                className="project-detail-stages-btn"
                onClick={() => {
                  if (showStageForm) {
                    onResetStageForm();
                  } else {
                    setShowStageForm(true);
                  }
                }}
              >
                {showStageForm ? "Formu bağla" : "Yeni mərhələ"}
              </button>
            </div>

            {showStageForm && (
              <div
                className="task-form-overlay"
                role="dialog"
                aria-modal="true"
                aria-labelledby="stage-form-title"
                onClick={onResetStageForm}
              >
                <div className="task-modal" onClick={(event) => event.stopPropagation()}>
                  <form className="task-form" onSubmit={onSaveStage}>
                    <div className="modal-header">
                      <h3 id="stage-form-title">
                        {editingStageId ? "Mərhələni redaktə et" : "Yeni mərhələ"}
                      </h3>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={onResetStageForm}
                      >
                        Ləğv et
                      </button>
                    </div>

                    <div className="modal-form-grid">
                      <div className="form-field">
                        <label>Mərhələ adı</label>
                        <CustomSelect
                          value={stageForm.name}
                          onChange={(nextValue) =>
                            setStageForm({ ...stageForm, name: nextValue })
                          }
                          options={projectStageNameOptions}
                          placeholder="Mərhələ seç"
                          className={!stageForm.name ? "placeholder-active" : ""}
                        />
                        {stageFormErrors.name && (
                          <p className="form-error-text">{stageFormErrors.name}</p>
                        )}
                      </div>

                      <div className="form-field">
                        <label>Çəki (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={stageForm.weight_percent}
                          onChange={(event) =>
                            setStageForm({
                              ...stageForm,
                              weight_percent: event.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="form-field">
                        <label>Plan başlanğıc</label>
                        <input
                          type="date"
                          value={stageForm.planned_start}
                          onChange={(event) =>
                            setStageForm({
                              ...stageForm,
                              planned_start: event.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="form-field">
                        <label>Plan son</label>
                        <input
                          type="date"
                          value={stageForm.planned_end}
                          onChange={(event) =>
                            setStageForm({
                              ...stageForm,
                              planned_end: event.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="form-field">
                        <label>Faktiki son</label>
                        <input
                          type="date"
                          value={stageForm.actual_end}
                          onChange={(event) =>
                            setStageForm({ ...stageForm, actual_end: event.target.value })
                          }
                        />
                      </div>

                      <div className="form-field">
                        <label>Status</label>
                        <CustomSelect
                          value={stageForm.status}
                          onChange={(nextValue) =>
                            setStageForm({ ...stageForm, status: nextValue })
                          }
                          options={projectStageStatusOptions}
                          className={!stageForm.status ? "placeholder-active" : ""}
                        />
                      </div>

                      <div className="form-field">
                        <label>Tamamlanma (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={stageForm.completion_percent}
                          onChange={(event) =>
                            setStageForm({
                              ...stageForm,
                              completion_percent: event.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="form-field form-field-full">
                      <label>Gecikmə səbəbi</label>
                      <textarea
                        value={stageForm.delay_reason}
                        onChange={(event) =>
                          setStageForm({ ...stageForm, delay_reason: event.target.value })
                        }
                      />
                    </div>

                    <div className="modal-footer">
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={onResetStageForm}
                      >
                        Ləğv et
                      </button>
                      <button type="submit" className="primary-btn">
                        Yadda saxla
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="project-detail-stages-table-card">
              <table className="project-detail-stages-table">
                <thead>
                  <tr>
                    <th>Mərhələ</th>
                    <th>Çəki</th>
                    <th>Plan başlanğıc</th>
                    <th>Plan son</th>
                    <th>Faktiki son</th>
                    <th>Status</th>
                    <th>Tamamlanma</th>
                    <th className="th-muted">Gecikmə səbəbi</th>
                    <th>Əməliyyat</th>
                  </tr>
                </thead>
                <tbody>
                  {projectStages.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="project-detail-empty-cell">
                        Bu layihə üçün mərhələ yoxdur
                      </td>
                    </tr>
                  ) : (
                    projectStages.map((stage) => (
                      <tr key={stage.id}>
                        <td><strong>{stage.name}</strong></td>
                        <td>{renderStagePercent(stage.weight_percent)}</td>
                        <td>{formatDate(stage.planned_start)}</td>
                        <td>{formatDate(stage.planned_end)}</td>
                        <td>{formatDate(stage.actual_end)}</td>
                        <td>
                          <span className={`stage-status-badge ${getProjectStageStatusBadgeClass(stage.status)}`}>
                            {getProjectStageStatusLabel(stage.status)}
                          </span>
                        </td>
                        <td>{renderStagePercent(stage.completion_percent)}</td>
                        <td className={`project-detail-stage-delay${!stage.delay_reason ? " td-muted" : ""}`}>
                          {stage.delay_reason || "—"}
                        </td>
                        <td>
                          <div className="project-detail-stage-actions">
                            <button
                              type="button"
                              className="project-detail-stage-btn project-detail-stage-edit"
                              onClick={() => onEditStage(stage)}
                              aria-label="Redaktə et"
                              title="Redaktə et"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="project-detail-stage-btn project-detail-stage-delete"
                              onClick={() => onDeleteStage(stage)}
                              aria-label="Sil"
                              title="Sil"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18" />
                                <path d="M8 6V4h8v2" />
                                <path d="M19 6l-1 14H6L5 6" />
                                <path d="M10 11v5" />
                                <path d="M14 11v5" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Tasks section */}
          <div className="project-detail-tasks-header">
            <div>
              <h3 className="project-detail-tasks-title">Layihəyə bağlı tapşırıqlar</h3>
              <span className="project-detail-tasks-count">{selectedProjectTasks.length} task göstərilir</span>
            </div>
          </div>

          <div className="project-detail-tasks-table-card">
            <table className="project-detail-tasks-table">
              <thead>
                <tr>
                  <th>Tapşırıq adı</th>
                  <th>İcraçı</th>
                  <th>İcra statusu</th>
                  <th>Prioritet</th>
                  <th>Tapşırığın növü</th>
                  <th>İstiqamət/Proqram</th>
                  <th>Son tarix</th>
                  <th>Kanbanda</th>
                </tr>
              </thead>
              <tbody>
                {selectedProjectTasks.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="project-detail-empty-cell">
                      Bu layihəyə bağlı tapşırıq yoxdur
                    </td>
                  </tr>
                ) : (
                  selectedProjectTasks.map((task) => (
                    <tr key={task.id}>
                      <td><strong>{task.title || "—"}</strong></td>
                      <td>{getTaskAssigneeName(task)}</td>
                      <td>
                        <span className={`badge status-${task.operational_status || "new"}`}>
                          {operationalStatusLabels[task.operational_status] ||
                            task.operational_status ||
                            "—"}
                        </span>
                      </td>
                      <td>
                        <span className={`badge priority-${task.priority}`}>
                          {priorityLabels[task.priority] || task.priority || "—"}
                        </span>
                      </td>
                      <td>{taskTypeLabels[task.task_type] || task.task_type || "—"}</td>
                      <td>{task.category || task.direction_program || "—"}</td>
                      <td>{formatDate(task.deadline)}</td>
                      <td>
                        <span className={`project-detail-kanban-status ${
                          task.kanban_enabled !== false ? "enabled" : "disabled"
                        }`}>
                          {task.kanban_enabled !== false ? "Bəli" : "Xeyr"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      
      )}

      {!selectedProject && (
        <div className="projects-page">
          <div className="projects-main-card">
            {/* Section Header */}
            <div className="projects-section-header">
              <p className="projects-section-title">
                Layihələrin siyahısı və idarə edilməsi
              </p>
              <button
                type="button"
                className="projects-create-btn"
                onClick={() => {
                  if (showProjectForm) {
                    onResetProjectForm();
                  } else {
                    onResetProjectForm();
                    // Auto-generate next L-code for new projects
                    const maxCode = projects.reduce((max, p) => {
                      const match = (p.code || "").match(/^L(\d+)$/i);
                      return match ? Math.max(max, parseInt(match[1], 10)) : max;
                    }, 0);
                    const nextCode = `L${String(maxCode + 1).padStart(3, "0")}`;
                    setProjectForm((prev) => ({ ...prev, code: nextCode }));
                    setShowProjectForm(true);
                  }
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                {showProjectForm ? "Formu bağla" : "Yeni layihə"}
              </button>
            </div>

            {showProjectForm && (
              <div
                className="task-form-overlay"
                role="dialog"
                aria-modal="true"
                aria-labelledby="project-form-title"
                onClick={onResetProjectForm}
              >
                <div className="task-modal" onClick={(event) => event.stopPropagation()}>
                  <form className="task-form" onSubmit={onSaveProject}>
                    <div className="modal-header">
                      <h3 id="project-form-title">
                        {editingProjectId ? "Layihəni redaktə et" : "Yeni layihə"}
                      </h3>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={onResetProjectForm}
                      >
                        Ləğv et
                      </button>
                    </div>

                    <div className="modal-form-grid">
                      <div className="form-field">
                        <label>Layihə adı</label>
                        <input
                          type="text"
                          value={projectForm.name}
                          autoFocus
                          onChange={(event) =>
                            setProjectForm({ ...projectForm, name: event.target.value })
                          }
                        />
                        {projectFormErrors.name && (
                          <p className="form-error-text">{projectFormErrors.name}</p>
                        )}
                      </div>

                      <div className="form-field">
                        <label>Kod</label>
                        <input
                          type="text"
                          value={projectForm.code}
                          readOnly={!editingProjectId}
                          onChange={(event) =>
                            setProjectForm({ ...projectForm, code: event.target.value })
                          }
                          className={!editingProjectId ? "readonly-field" : ""}
                        />
                        {!editingProjectId && (
                          <p className="field-helper-text">Kod avtomatik yaradılır</p>
                        )}
                      </div>

                      <div className="form-field">
                        <label>İstiqamət/Proqram</label>
                        <CustomSelect
                          value={projectForm.direction_program}
                          onChange={(nextValue) =>
                            setProjectForm({ ...projectForm, direction_program: nextValue })
                          }
                          options={[
                            { value: "", label: "Seçilməyib" },
                            ...directionPrograms.map((v) => ({ value: v, label: v })),
                          ]}
                        />
                      </div>

                      <div className="form-field">
                        <label>Sahib</label>
                        <input
                          type="text"
                          value={projectForm.owner}
                          onChange={(event) =>
                            setProjectForm({ ...projectForm, owner: event.target.value })
                          }
                        />
                      </div>

                      <div className="form-field">
                        <label>Yanaşma</label>
                        <CustomSelect
                          value={projectForm.approach}
                          onChange={(nextValue) =>
                            setProjectForm({ ...projectForm, approach: nextValue })
                          }
                          options={(() => {
                            const vals = [...new Set(projects.map(p => p.approach).filter(Boolean))].sort();
                            const items = vals.length > 0 ? vals : projectApproachFallbacks;
                            return [
                              { value: "", label: "Seçilməyib" },
                              ...items.map(v => ({ value: v, label: v })),
                            ];
                          })()}
                        />
                      </div>

                      <div className="form-field">
                        <label>Aktiv</label>
                        <CustomSelect
                          value={projectForm.is_active ? "true" : "false"}
                          onChange={(nextValue) =>
                            setProjectForm({
                              ...projectForm,
                              is_active: nextValue === "true",
                            })
                          }
                          options={[
                            { value: "true", label: "Aktiv" },
                            { value: "false", label: "Deaktiv" },
                          ]}
                        />
                      </div>
                    </div>

                    <div className="form-field form-field-full">
                      <label>Təsvir</label>
                      <textarea
                        value={projectForm.description}
                        onChange={(event) =>
                          setProjectForm({ ...projectForm, description: event.target.value })
                        }
                      />
                    </div>

                    <div className="modal-footer">
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={onResetProjectForm}
                      >
                        Ləğv et
                      </button>
                      <button type="submit" className="primary-btn">
                        Yadda saxla
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* KPI Cards */}
            <div className="projects-stats-grid">
              <div className="projects-stat-card">
                <div className="projects-stat-icon projects-stat-icon-blue">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div className="projects-stat-info">
                  <span className="projects-stat-label">Ümumi layihələr</span>
                  <strong className="projects-stat-value">{projects.length}</strong>
                </div>
              </div>
              <div className="projects-stat-card">
                <div className="projects-stat-icon projects-stat-icon-green">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <div className="projects-stat-info">
                  <span className="projects-stat-label">Aktiv layihələr</span>
                  <strong className="projects-stat-value">{activeProjectCount}</strong>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="projects-filters-bar">
              <div className="projects-search">
                <svg className="projects-filter-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="search"
                  placeholder="Layihə adı, kod və ya sahib üzrə axtar"
                  value={projectSearch}
                  onChange={(event) => setProjectSearch(event.target.value)}
                />
              </div>

              <div className="projects-filter-control">
                <svg className="projects-filter-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                </svg>
                <CustomSelect
                  className="projects-filter-select"
                  value={projectDirectionFilter}
                  onChange={setProjectDirectionFilter}
                  options={[
                    { value: "", label: "İstiqamət seç" },
                    ...projectDirectionValues.map((value) => ({ value, label: value })),
                  ]}
                  typeaheadTimeout={3000}
                />
              </div>

              <div className="projects-filter-control">
                <svg className="projects-filter-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
                <CustomSelect
                  className="projects-filter-select"
                  value={projectApproachFilter}
                  onChange={setProjectApproachFilter}
                  options={[
                    { value: "", label: "Yanaşma seç" },
                    ...projectApproachValues.map((value) => ({ value, label: value })),
                  ]}
                  typeaheadTimeout={3000}
                />
              </div>

              <div className="projects-filter-control">
                <svg className="projects-filter-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="20" x2="12" y2="10" />
                  <line x1="18" y1="20" x2="18" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="16" />
                </svg>
                <CustomSelect
                  className="projects-filter-select"
                  value={projectActiveFilter}
                  onChange={setProjectActiveFilter}
                  options={[
                    { value: "all", label: "Aktivlik: Hamısı" },
                    { value: "active", label: "Aktiv" },
                    { value: "inactive", label: "Passiv" },
                  ]}
                />
              </div>

              <div className="projects-filter-control">
                <svg className="projects-filter-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <CustomSelect
                  className="projects-filter-select"
                  value={projectOwnerFilter}
                  onChange={setProjectOwnerFilter}
                  options={[
                    { value: "", label: "Sahib seç" },
                    ...projectOwnerValues.map((value) => ({ value, label: value })),
                  ]}
                  typeaheadTimeout={3000}
                />
              </div>

              <button
                type="button"
                className="projects-reset-btn"
                onClick={onFilterReset}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                Sıfırla
              </button>
            </div>

            {/* Table */}
            <div className="projects-table-card">
              <table className="projects-table">
                <thead>
                  <tr>
                    <th>Layihə adı</th>
                    <th>Kod</th>
                    <th>İstiqamət/Proqram</th>
                    <th>Sahib</th>
                    <th>Yanaşma</th>
                    <th>Status</th>
                    <th>Əməliyyat</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="projects-empty-cell">Layihə tapılmadı</td>
                    </tr>
                  ) : filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="projects-empty-cell">Nəticə tapılmadı</td>
                    </tr>
                  ) : (
                    filteredProjects.map((project) => (
                      <tr key={project.id}>
                        <td>
                          <div className="projects-name-cell">
                            <strong>{project.name}</strong>
                            {project.description && <span>{project.description}</span>}
                          </div>
                        </td>
                        <td>{project.code || "—"}</td>
                        <td>{project.direction_program || "—"}</td>
                        <td>{project.owner || "—"}</td>
                        <td>{approachLabels[project.approach] || project.approach || "—"}</td>
                        <td>
                          <span className={`projects-status-badge ${project.is_active !== false ? "active" : "inactive"}`}>
                            {project.is_active !== false ? "Aktiv" : "Deaktiv"}
                          </span>
                        </td>
                        <td>
                          <div className="projects-action-buttons">
                            <button
                              type="button"
                              className="projects-action-btn projects-action-view"
                              onClick={() => void onOpenProjectDetails(project)}
                              aria-label="Detallar"
                              title="Detallar"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="projects-action-btn projects-action-edit"
                              onClick={() => onEditProject(project)}
                              aria-label="Redaktə et"
                              title="Redaktə et"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="projects-action-btn projects-action-delete"
                              onClick={() => onDeleteProject(project)}
                              aria-label="Sil"
                              title="Sil"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18" />
                                <path d="M8 6V4h8v2" />
                                <path d="M19 6l-1 14H6L5 6" />
                                <path d="M10 11v5" />
                                <path d="M14 11v5" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ProjectsPage;
