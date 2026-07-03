import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts";
import {
  taskStatusOptions,
  PRIORITY_OPTIONS,
  OPERATIONAL_STATUS_OPTIONS,
  getOptionLabel,
  getOptionColor,
} from "../constants/taskConstants";
import {
  isTaskOverdue,
  isTaskDueThisWeek,
} from "../utils/helpers";

function DashboardPage({
  tasks,
  projects,
  users,
  stats,
  isAdmin,
  onOpenTasksView,
  onOpenUsersView,
  onNewTask,
  onNewClient,
  onTaskComments,
  getTaskAssigneeName,
  getTaskOperationalStatus,
  getEffectiveTaskDeadline,
  hasTaskAssignee,
  excelImportInputRef,
  excelExporting,
  excelImporting,
  onImportExcel,
  onExportExcel,
}) {
  /* ---------- Dashboard computations ---------- */

  const dashboardTotalTasks =
    tasks.length > 0 ? tasks.length : stats?.total_tasks || 0;
  const dashboardStatusKeys = taskStatusOptions.map((o) => o.value);
  const normalizeDashboardValue = (value) =>
    String(value || "").trim().toLocaleLowerCase("az");
  const getDashboardOperationalStatusKey = (task) => {
    const value = getTaskOperationalStatus(task);
    const normalizedValue = normalizeDashboardValue(value);
    const statusAliasMap = {
      yeni: "new",
      "gözləmədə": "waiting",
      gozlemede: "waiting",
      "icra müddətində": "within_deadline",
      "icra müddətinə var": "within_deadline",
      "icra muddetinde": "within_deadline",
      "icradadır": "active",
      icradadir: "active",
      "gecikmə": "overdue",
      gecikme: "overdue",
      "tam icra": "completed",
      "tamamlanıb": "completed",
      tamamlanib: "completed",
      completed: "completed",
    };

    if (dashboardStatusKeys.includes(value)) return value;
    return statusAliasMap[normalizedValue] || "new";
  };
  const dashboardOperationalStatusCounts = tasks.reduce(
    (counts, task) => {
      const operationalStatus = getDashboardOperationalStatusKey(task);
      if (Object.hasOwn(counts, operationalStatus)) {
        counts[operationalStatus] += 1;
      }
      return counts;
    },
    {
      new: 0,
      waiting: 0,
      within_deadline: 0,
      active: 0,
      overdue: 0,
      completed: 0,
    }
  );
  const overdueTasks = tasks.filter(
    (task) => isTaskOverdue(task)
  );
  const dashboardOverdueTasks =
    tasks.length > 0 ? overdueTasks.length : stats?.overdue_tasks || 0;
  const dueThisWeekTasks = tasks.filter(
    (task) =>
      isTaskDueThisWeek(task) && getDashboardOperationalStatusKey(task) !== "completed"
  );
  const unassignedTasks = tasks.filter((task) => !hasTaskAssignee(task));
  const getDashboardTaskStatus = (task) => {
    const statusValue =
      task.status_name ??
      task.status?.name ??
      task.status ??
      task.operational_status ??
      "";
    return String(statusValue).trim();
  };
  const isDashboardTaskCompleted = (task) => {
    const normalizedStatus = getDashboardTaskStatus(task).toLocaleLowerCase("az");
    return (
      ["tam icra", "tamamlanıb", "completed"].includes(normalizedStatus) ||
      getDashboardOperationalStatusKey(task) === "completed"
    );
  };
  const getDashboardTaskProjectKey = (task) => {
    const projectName =
      task.project_name ??
      task.project?.name ??
      (typeof task.project === "string" ? task.project : "");
    const normalizedProjectName = String(projectName || "").trim();
    if (normalizedProjectName) return normalizedProjectName;

    const projectId = task.project_id ?? task.projectId ?? task.project?.id;
    return projectId === null || projectId === undefined
      ? ""
      : String(projectId).trim();
  };
  const getDashboardTaskDeadline = (task) =>
    getEffectiveTaskDeadline(task);
  const isDashboardTaskOverdue = (task) => {
    const deadlineValue = getDashboardTaskDeadline(task);
    return (
      Boolean(deadlineValue) &&
        new Date(deadlineValue) < new Date() &&
        !isDashboardTaskCompleted(task)
    );
  };
  const getDashboardPriorityKey = (priority) => {
    const normalizedPriority = normalizeDashboardValue(priority);
    const priorityAliasMap = {
      "yüksək": "high",
      yuksek: "high",
      orta: "medium",
      "aşağı": "low",
      asagi: "low",
    };

    if (["high", "medium", "low"].includes(normalizedPriority)) {
      return normalizedPriority;
    }
    return priorityAliasMap[normalizedPriority] || "empty";
  };
  const highPriorityOpenTasks = tasks.filter((task) => {
    const normalizedPriority = String(task.priority || "")
      .trim()
      .toLocaleLowerCase("az");
    return (
      ["high", "yüksək", "yuksek"].includes(normalizedPriority) &&
      !isDashboardTaskCompleted(task)
    );
  });
  const dashboardActiveProjectCount = new Set(
    tasks
      .filter(
        (task) =>
          getDashboardTaskProjectKey(task) &&
          getDashboardTaskStatus(task) &&
          !isDashboardTaskCompleted(task)
      )
      .map((task) => getDashboardTaskProjectKey(task))
  ).size;
  const dashboardOverdueProjectCount = new Set(
    tasks
      .filter(
        (task) =>
          getDashboardTaskProjectKey(task) && isDashboardTaskOverdue(task)
      )
      .map((task) => getDashboardTaskProjectKey(task))
  ).size;
  const dashboardCompletedProjectCount = new Set(
    tasks
      .filter(
        (task) =>
          getDashboardTaskProjectKey(task) && isDashboardTaskCompleted(task)
      )
      .map((task) => getDashboardTaskProjectKey(task))
  ).size;
  const assigneeWorkload = Object.values(
    tasks.reduce((workload, task) => {
      if (isDashboardTaskCompleted(task)) return workload;

      const resolvedAssigneeId =
        task.assigned_user?.id ??
        task.assigned_to_user?.id ??
        task.assignee?.id ??
        task.assigned_to_id ??
        (typeof task.assigned_to === "string" || typeof task.assigned_to === "number"
          ? task.assigned_to
          : "");
      if (!resolvedAssigneeId) return workload;

      const resolvedName =
        task.assignee_name ||
        task.assigned_to_name ||
        task.assigned_user?.full_name ||
        task.assigned_to_user?.full_name ||
        task.assignee?.full_name ||
        getTaskAssigneeName(task);
      const assigneeName =
        resolvedName && resolvedName !== "—"
          ? resolvedName
          : "İcraçı təyin edilməyib";
      const assigneeKey = String(resolvedAssigneeId);

      if (!workload[assigneeKey]) {
        workload[assigneeKey] = {
          id: assigneeKey,
          name: assigneeName,
          openCount: 0,
          overdueCount: 0,
        };
      }

      workload[assigneeKey].openCount += 1;
      if (isDashboardTaskOverdue(task)) {
        workload[assigneeKey].overdueCount += 1;
      }
      return workload;
    }, {})
  )
    .sort(
      (first, second) =>
        second.openCount - first.openCount ||
        second.overdueCount - first.overdueCount ||
        first.name.localeCompare(second.name, "az")
    )
    .slice(0, 5);
  const maxAssigneeOpenCount = Math.max(
    1,
    ...assigneeWorkload.map((item) => item.openCount)
  );
  const priorityDistribution = [
    {
      key: "high",
      label: getOptionLabel(PRIORITY_OPTIONS, "high", "Yüksək"),
      count: tasks.filter((task) => getDashboardPriorityKey(task.priority) === "high").length,
      filter: { priority: "high" },
    },
    {
      key: "medium",
      label: getOptionLabel(PRIORITY_OPTIONS, "medium", "Orta"),
      count: tasks.filter((task) => getDashboardPriorityKey(task.priority) === "medium").length,
      filter: { priority: "medium" },
    },
    {
      key: "low",
      label: getOptionLabel(PRIORITY_OPTIONS, "low", "Aşağı"),
      count: tasks.filter((task) => getDashboardPriorityKey(task.priority) === "low").length,
      filter: { priority: "low" },
    },
    {
      key: "empty",
      label: "Boş / təyin edilməyib",
      count: tasks.filter((task) => getDashboardPriorityKey(task.priority) === "empty").length,
      filter: {},
    },
  ];
  const maxPriorityCount = Math.max(
    1,
    ...priorityDistribution.map((item) => item.count)
  );
  const getDashboardChartLabel = (value, maxLength = 28) => {
    const label = String(value || "Naməlum").trim();
    return label.length > maxLength ? `${label.slice(0, maxLength - 3)}...` : label;
  };
  const getShortDirectionName = (name) => {
    const shortNames = {
      "Elektron transformasiya": "Elektron trans.",
      "Sosial xidmətlərin inkişafı": "Sosial xidmətlər",
      "Dövlət proqramları və strateji sənədlər": "Dövlət proqramları",
      "Əməkdaşlıq və koordinasiya": "Əməkdaşlıq",
    };
    return shortNames[name] || getDashboardChartLabel(name, 16);
  };
  /* ---------- Apple-style muted palette ---------- */
  const mainBlue = "#3B82F6";
  const deepBlue = "#2563EB";
  const indigo = "#6366F1";
  const softIndigo = "#818CF8";
  const teal = "#0EA5A8";
  const softRed = "#EF6A6A";
  const deepRed = "#DC4C4C";
  const amber = "#D9902F";
  const green = "#22A06B";
  const slate = "#7C8A9B";

  const dashboardStatusDistribution = [
    {
      key: "new",
      label: getOptionLabel(OPERATIONAL_STATUS_OPTIONS, "new", "Yeni"),
      count: dashboardOperationalStatusCounts.new,
      filter: { operationalStatus: "new" },
    },
    {
      key: "waiting",
      label: getOptionLabel(OPERATIONAL_STATUS_OPTIONS, "waiting", "Gözləmədə"),
      count: dashboardOperationalStatusCounts.waiting,
      filter: { operationalStatus: "waiting" },
    },
    {
      key: "active",
      label: getOptionLabel(OPERATIONAL_STATUS_OPTIONS, "active", "İcradadır"),
      count: dashboardOperationalStatusCounts.active,
      filter: { operationalStatus: "active" },
    },
    {
      key: "completed",
      label: getOptionLabel(OPERATIONAL_STATUS_OPTIONS, "completed", "Tam icra"),
      count: dashboardOperationalStatusCounts.completed,
      filter: { operationalStatus: "completed" },
    },
  ];
  const maxDashboardStatusCount = Math.max(
    1,
    ...dashboardStatusDistribution.map((item) => item.count)
  );
  const statusChartData = dashboardStatusDistribution.map((item) => ({
    ...item,
    name: item.label,
    value: item.count,
    percent: dashboardTotalTasks
      ? Math.round((item.count / dashboardTotalTasks) * 100)
      : 0,
    fill: getOptionColor(OPERATIONAL_STATUS_OPTIONS, item.key, "#3b82f6"),
  }));
  const priorityChartData = priorityDistribution
    .filter((item) => item.key !== "empty" || item.count > 0)
    .map((item) => ({
      ...item,
      name: item.label,
      count: item.count,
      fill: getOptionColor(PRIORITY_OPTIONS, item.key, "#3b82f6"),
    }));
  const azMonthAbbreviations = [
    "Yan", "Fev", "Mar", "Apr", "May", "İyn",
    "İyl", "Avq", "Sen", "Okt", "Noy", "Dek",
  ];
  const overdueTrendData = Object.values(
    tasks.reduce((items, task) => {
      const deadlineValue = getDashboardTaskDeadline(task);
      const deadlineDate = deadlineValue ? new Date(deadlineValue) : null;

      if (
        !deadlineDate ||
        Number.isNaN(deadlineDate.getTime()) ||
        !isTaskOverdue(task)
      ) {
        return items;
      }

      const monthStart = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), 1);
      const monthKey = `${monthStart.getFullYear()}-${String(
        monthStart.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!items[monthKey]) {
        items[monthKey] = {
          key: monthKey,
          name: `${azMonthAbbreviations[monthStart.getMonth()]} ${monthStart.getFullYear()}`,
          count: 0,
          timestamp: monthStart.getTime(),
          fill: softRed,
        };
      }

      items[monthKey].count += 1;
      return items;
    }, {})
  ).sort((first, second) => first.timestamp - second.timestamp);
  const directionChartData = Object.values(
    tasks.reduce((items, task) => {
      const direction = (task.category || task.direction_program)?.trim() || "Təyin edilməyib";
      if (!items[direction]) {
        items[direction] = {
          name: direction,
          count: 0,
          fill: indigo,
        };
      }
      items[direction].count += 1;
      return items;
    }, {})
  )
    .sort((first, second) => second.count - first.count)
    .slice(0, 5)
    .map((item) => ({
      ...item,
      displayName: getShortDirectionName(item.name),
    }));
  const assigneeLoadChartData = assigneeWorkload.map((item) => ({
    ...item,
    name: item.name || "Naməlum",
    displayName: getDashboardChartLabel(item.name || "Naməlum icraçı", 28),
    count: item.openCount || 0,
    overdueCount: item.overdueCount || 0,
    openFill: deepBlue,
    overdueFill: amber,
  }));
  const statusChartHasData = statusChartData.some((item) => item.value > 0);
  const priorityChartHasData = priorityChartData.some((item) => item.count > 0);
  const overdueTrendChartHasData = overdueTrendData.some((item) => item.count > 0);
  const directionChartHasData = directionChartData.some((item) => item.count > 0);
  const assigneeChartHasData = assigneeLoadChartData.some((item) => item.count > 0);
  const directionAllUncategorized =
    directionChartData.length === 1 &&
    directionChartData[0].name === "Təyin edilməyib";
  const renderDashboardTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const item = payload[0]?.payload || {};
    const value = payload[0]?.value ?? item.value ?? item.count ?? 0;
    const tooltipRows = payload.filter((entry) => entry.value !== undefined);

    return (
      <div className="dashboard-chart-tooltip">
        <strong>{item.name || label}</strong>
        {item.overdueCount !== undefined ? (
          <>
            <span>Açıq tapşırıq: {item.count || 0}</span>
            <span>Gecikən tapşırıq: {item.overdueCount || 0}</span>
          </>
        ) : item.percent !== undefined ? (
          <span>
            {value} tapşırıq · {item.percent}%
          </span>
        ) : tooltipRows.length > 1 ? (
          tooltipRows.map((entry) => (
            <span key={entry.dataKey}>
              {entry.name}: {entry.value}
            </span>
          ))
        ) : (
          <span>{value} tapşırıq</span>
        )}
        {item.overdueCount > 0 && <small>{item.overdueCount} gecikən tapşırıq</small>}
      </div>
    );
  };
  const dashboardTooltipProps = {
    content: renderDashboardTooltip,
    cursor: false,
    allowEscapeViewBox: { x: true, y: true },
    wrapperStyle: {
      outline: "none",
      border: 0,
      borderRadius: 12,
      pointerEvents: "none",
      zIndex: 20,
    },
    contentStyle: {
      outline: "none",
      border: 0,
      borderRadius: 12,
      background: "rgba(255, 255, 255, 0.96)",
      backdropFilter: "blur(14px)",
      boxShadow: "0 18px 42px rgba(15, 23, 42, 0.10)",
      pointerEvents: "none",
    },
  };
  const getDashboardChartEntry = (entry) => entry?.payload || entry || {};
  const projectOverviewItems = [
    {
      key: "total",
      label: "Ümumi layihələr",
      count: projects.length,
    },
    {
      key: "active",
      label: "Aktiv layihələr",
      count: dashboardActiveProjectCount,
    },
    {
      key: "overdue",
      label: "Gecikməsi olan layihələr",
      count: dashboardOverdueProjectCount,
    },
    {
      key: "completed",
      label: "Tam icralı layihələr",
      count: dashboardCompletedProjectCount,
    },
  ];
  const maxProjectOverviewCount = Math.max(
    1,
    ...projectOverviewItems.map((item) => item.count)
  );
  const dashboardUsersCount =
    users.length > 0 ? users.length : stats?.total_users || 0;
  const getDashboardPercent = (count) =>
    dashboardTotalTasks ? Math.round((count / dashboardTotalTasks) * 100) : 0;

  /* ---------- Render ---------- */

  if (!stats) {
    return <p className="loading-state">Yüklənir...</p>;
  }

  return (
    <>
      <div className="dashboard-action-row" aria-label="Dashboard sürətli əməliyyatlar">
        <div className="dashboard-header-meta">
          <div className="dashboard-summary-pill">
            {dashboardTotalTasks} tapşırıq · {dashboardOperationalStatusCounts.active} icrada ·{" "}
            {dashboardOverdueTasks} gecikir
          </div>
        </div>

        <div className="dashboard-header-actions">
          {isAdmin && (
            <>
              <button
                type="button"
                className="quick-action-btn primary"
                onClick={() => void onNewTask()}
              >
                + Yeni tapşırıq
              </button>
              <input
                ref={excelImportInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="visually-hidden-file"
                onChange={onImportExcel}
              />
            </>
          )}
          <button
            type="button"
            className="quick-action-btn export"
            onClick={onExportExcel}
            disabled={excelExporting || excelImporting}
          >
            Hesabat ixracı
          </button>
        </div>
      </div>

      <div className="dashboard-view">
        <section className="dashboard-grid">
          <button
            type="button"
            className="dashboard-card dashboard-action-card card-total"
            onClick={() => void onOpenTasksView()}
          >
            <div className="dashboard-card-header">
              <span className="dashboard-card-title">Ümumi tapşırıqlar</span>
              <span className="card-icon-box">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="2" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.6"/>
                  <line x1="5" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  <line x1="5" y1="10.5" x2="10" y2="10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </span>
            </div>
            <div className="dashboard-card-body">
              <strong className="dashboard-card-value">{dashboardTotalTasks}</strong>
            </div>
            <div className="dashboard-card-progress" aria-hidden="true">
              <span className="metric-total" style={{ width: "100%" }} />
            </div>
          </button>

          <button
            type="button"
            className="dashboard-card dashboard-action-card card-active"
            onClick={() => void onOpenTasksView({ operationalStatus: "active" })}
          >
            <div className="dashboard-card-header">
              <span className="dashboard-card-title">İcradadır</span>
              <span className="card-icon-box">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M9 5.5V9L11.5 11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </span>
            </div>
            <div className="dashboard-card-body">
              <strong className="dashboard-card-value">
                {dashboardOperationalStatusCounts.active}
              </strong>
            </div>
            <div className="dashboard-card-progress" aria-hidden="true">
              <span
                className="metric-progress"
                style={{
                  width: `${getDashboardPercent(
                    dashboardOperationalStatusCounts.active
                  )}%`,
                }}
              />
            </div>
          </button>

          <button
            type="button"
            className="dashboard-card dashboard-action-card card-overdue"
            onClick={() => void onOpenTasksView({ overdue: true })}
          >
            <div className="dashboard-card-header">
              <span className="dashboard-card-title">Son tarixi keçənlər</span>
              <span className="card-icon-box">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.6"/>
                  <line x1="9" y1="5.5" x2="9" y2="9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  <circle cx="9" cy="12.5" r="0.9" fill="currentColor"/>
                </svg>
              </span>
            </div>
            <div className="dashboard-card-body">
              <strong className="dashboard-card-value">{dashboardOverdueTasks}</strong>
            </div>
            <div className="dashboard-card-progress" aria-hidden="true">
              <span
                className="metric-danger"
                style={{ width: `${getDashboardPercent(dashboardOverdueTasks)}%` }}
              />
            </div>
          </button>

          <button
            type="button"
            className="dashboard-card dashboard-action-card card-weekly"
            onClick={() => void onOpenTasksView({ dueThisWeek: true })}
          >
            <div className="dashboard-card-header">
              <span className="dashboard-card-title">Bu həftə bitməli</span>
              <span className="card-icon-box">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="2" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.6"/>
                  <line x1="2" y1="7" x2="16" y2="7" stroke="currentColor" strokeWidth="1.6"/>
                  <line x1="5.5" y1="1" x2="5.5" y2="4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  <line x1="12.5" y1="1" x2="12.5" y2="4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  <line x1="10" y1="10.5" x2="13" y2="10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </span>
            </div>
            <div className="dashboard-card-body">
              <strong className="dashboard-card-value">
                {dueThisWeekTasks.length}
              </strong>
            </div>
            <div className="dashboard-card-progress" aria-hidden="true">
              <span
                className="metric-new"
                style={{
                  width: `${getDashboardPercent(dueThisWeekTasks.length)}%`,
                }}
              />
            </div>
          </button>

          <button
            type="button"
            className="dashboard-card dashboard-action-card card-high-priority"
            onClick={() => void onOpenTasksView({ priority: "high" })}
          >
            <div className="dashboard-card-header">
              <span className="dashboard-card-title">Yüksək prioritetli açıq</span>
              <span className="card-icon-box">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 2L2 16H16L9 2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
                  <line x1="9" y1="7" x2="9" y2="11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  <circle cx="9" cy="13.5" r="0.9" fill="currentColor"/>
                </svg>
              </span>
            </div>
            <div className="dashboard-card-body">
              <strong className="dashboard-card-value">
                {highPriorityOpenTasks.length}
              </strong>
            </div>
            <div className="dashboard-card-progress" aria-hidden="true">
              <span
                className="metric-high-priority"
                style={{
                  width: `${getDashboardPercent(highPriorityOpenTasks.length)}%`,
                }}
              />
            </div>
          </button>
        </section>

        <section className="dashboard-insights-grid">
          <div className="dashboard-panel dashboard-status-panel">
            <div className="dashboard-panel-heading">
              <h3 className="dashboard-panel-title">Status bölgüsü</h3>
            </div>

            <div className="dashboard-chart-body dashboard-donut-chart">
              {statusChartHasData ? (
                <div className="dashboard-donut-layout">
                  <div className="dashboard-donut-visual">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip {...dashboardTooltipProps} />
                        <Pie
                          data={statusChartData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius="62%"
                          outerRadius="88%"
                          paddingAngle={2}
                          stroke="rgba(255,255,255,0.82)"
                          strokeWidth={2}
                          isAnimationActive
                          animationDuration={850}
                          onClick={(entry) =>
                            void onOpenTasksView(getDashboardChartEntry(entry).filter)
                          }
                        >
                          {statusChartData.map((entry) => (
                            <Cell
                              key={entry.key}
                              fill={entry.fill}
                              className="dashboard-chart-slice"
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="dashboard-donut-center" aria-hidden="true">
                      <strong>{dashboardTotalTasks}</strong>
                      <span>tapşırıq</span>
                    </div>
                  </div>
                  <div className="dashboard-chart-legend">
                    {statusChartData.map((item) => (
                      <button
                        type="button"
                        className="dashboard-legend-pill"
                        key={item.key}
                        onClick={() => void onOpenTasksView(item.filter)}
                      >
                        <i style={{ background: item.fill }} />
                        <span>{item.name}</span>
                        <strong>{item.value}</strong>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="dashboard-chart-empty">Məlumat yoxdur</div>
              )}
            </div>
          </div>

          <div className="dashboard-panel dashboard-direction-panel">
            <div className="dashboard-panel-heading">
              <h3 className="dashboard-panel-title">Kateqoriyalar üzrə yük</h3>
            </div>

            <div className="dashboard-chart-body">
              {directionAllUncategorized ? (
                <div className="dashboard-chart-notice">
                  <span className="dashboard-chart-notice-text">Kateqoriya təyin edilməyib</span>
                </div>
              ) : directionChartHasData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={directionChartData}
                    layout="vertical"
                    margin={{ top: 10, right: 26, bottom: 0, left: 6 }}
                    barCategoryGap={10}
                  >
                    <defs>
                      <linearGradient id="dirGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={indigo} stopOpacity={1} />
                        <stop offset="100%" stopColor={softIndigo} stopOpacity={0.88} />
                      </linearGradient>
                    </defs>
                    <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={false} height={0} />
                    <YAxis
                      type="category"
                      dataKey="displayName"
                      width={95}
                      tick={{ fontSize: 11 }}
                      tickMargin={6}
                      interval={0}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip {...dashboardTooltipProps} />
                    <Bar
                      dataKey="count"
                      name="Tapşırıq sayı"
                      fill="url(#dirGrad)"
                      radius={[0, 10, 10, 0]}
                      barSize={20}
                      maxBarSize={26}
                      isAnimationActive
                      animationDuration={800}
                      onClick={(entry) =>
                        void onOpenTasksView({
                          direction: getDashboardChartEntry(entry).name || "",
                        })
                      }
                    >
                      <LabelList dataKey="count" position="right" className="dashboard-bar-label" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="dashboard-chart-empty">Məlumat yoxdur</div>
              )}
            </div>
          </div>

          {/* ---------- Attention panel ---------- */}
          <div className="dashboard-panel dashboard-attention-panel">
            <div className="dashboard-panel-heading">
              <h3 className="dashboard-panel-title">Diqqət tələb edənlər</h3>
            </div>
            <div className="dashboard-attention-body">
              {dashboardOverdueTasks > 0 && (
                <button
                  type="button"
                  className="dashboard-attention-item attention-overdue"
                  onClick={() => void onOpenTasksView({ overdue: true })}
                >
                  <span className="attention-item-icon attention-icon-overdue">!</span>
                  <span className="attention-item-label">Gecikən tapşırıqlar</span>
                  <strong className="attention-item-count">{dashboardOverdueTasks}</strong>
                </button>
              )}
              <button
                type="button"
                className={`dashboard-attention-item ${dueThisWeekTasks.length > 0 ? 'attention-weekly' : 'attention-weekly-zero'}`}
                onClick={() => void onOpenTasksView({ dueThisWeek: true })}
              >
                <span className={`attention-item-icon ${dueThisWeekTasks.length > 0 ? 'attention-icon-weekly' : 'attention-icon-weekly-zero'}`}>!</span>
                <span className="attention-item-label">Bu həftə bitməli</span>
                <strong className="attention-item-count">{dueThisWeekTasks.length}</strong>
              </button>
              {highPriorityOpenTasks.length > 0 && (
                <button
                  type="button"
                  className="dashboard-attention-item attention-high-priority"
                  onClick={() => void onOpenTasksView({ priority: "high" })}
                >
                  <span className="attention-item-icon attention-icon-high">!</span>
                  <span className="attention-item-label">Yüksək prioritetli açıq</span>
                  <strong className="attention-item-count">{highPriorityOpenTasks.length}</strong>
                </button>
              )}
              {unassignedTasks.length > 0 && (
                <button
                  type="button"
                  className="dashboard-attention-item attention-unassigned"
                  onClick={() => void onOpenTasksView({ unassigned: true })}
                >
                  <span className="attention-item-icon attention-icon-unassigned">!</span>
                  <span className="attention-item-label">İcraçısı olmayan</span>
                  <strong className="attention-item-count">{unassignedTasks.length}</strong>
                </button>
              )}
              {dashboardOverdueTasks === 0 && highPriorityOpenTasks.length === 0 && unassignedTasks.length === 0 && (
                <div className="dashboard-attention-empty">
                  Diqqət tələb edən tapşırıq yoxdur
                </div>
              )}
            </div>
          </div>

        </section>

        <section className="dashboard-charts-grid">
          <div className="dashboard-panel dashboard-priority-panel">
            <div className="dashboard-panel-heading">
              <h3 className="dashboard-panel-title">Prioritet bölgüsü</h3>
            </div>

            <div className="dashboard-chart-body">
              {priorityChartHasData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={priorityChartData}
                    layout="vertical"
                    margin={{ top: 10, right: 26, bottom: 0, left: 6 }}
                    barCategoryGap={10}
                  >
                    <defs>
                      <linearGradient id="priHighGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={deepRed} stopOpacity={1} />
                        <stop offset="100%" stopColor={softRed} stopOpacity={0.86} />
                      </linearGradient>
                      <linearGradient id="priMediumGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={amber} stopOpacity={1} />
                        <stop offset="100%" stopColor="#FBBF24" stopOpacity={0.88} />
                      </linearGradient>
                      <linearGradient id="priLowGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={deepBlue} stopOpacity={1} />
                        <stop offset="100%" stopColor={mainBlue} stopOpacity={0.86} />
                      </linearGradient>
                      <linearGradient id="priEmptyGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={slate} stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#94A3B8" stopOpacity={0.72} />
                      </linearGradient>
                    </defs>
                    <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={false} height={0} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={85}
                      tick={{ fontSize: 11 }}
                      tickMargin={6}
                      interval={0}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip {...dashboardTooltipProps} />
                    <Bar
                      dataKey="count"
                      name="Tapşırıq sayı"
                      radius={[0, 10, 10, 0]}
                      barSize={20}
                      maxBarSize={26}
                      isAnimationActive
                      animationDuration={800}
                      onClick={(entry) =>
                        void onOpenTasksView(getDashboardChartEntry(entry).filter)
                      }
                    >
                      <LabelList dataKey="count" position="right" className="dashboard-bar-label" />
                      {priorityChartData.map((entry) => {
                        const gradMap = {
                          high: "url(#priHighGrad)",
                          medium: "url(#priMediumGrad)",
                          low: "url(#priLowGrad)",
                          empty: "url(#priEmptyGrad)",
                        };
                        return (
                          <Cell key={entry.key} fill={gradMap[entry.key] || entry.fill} />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="dashboard-chart-empty">Məlumat yoxdur</div>
              )}
            </div>
          </div>

          <div className="dashboard-panel dashboard-overdue-trend">
            <div className="dashboard-panel-heading">
              <h3 className="dashboard-panel-title">Gecikmələr aylar üzrə</h3>
            </div>

            <div className="dashboard-chart-body dashboard-chart-body-tall">
              {overdueTrendChartHasData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={overdueTrendData}
                    layout="vertical"
                    margin={{ top: 10, right: 26, bottom: 0, left: 6 }}
                    barCategoryGap={8}
                  >
                    <defs>
                      <linearGradient id="overdueGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={deepRed} stopOpacity={1} />
                        <stop offset="100%" stopColor={softRed} stopOpacity={0.86} />
                      </linearGradient>
                    </defs>
                    <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={false} height={0} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={80}
                      tick={{ fontSize: 11 }}
                      tickMargin={6}
                      interval={0}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip {...dashboardTooltipProps} />
                    <Bar
                      dataKey="count"
                      name="Gecikən tapşırıq"
                      fill="url(#overdueGrad)"
                      radius={[0, 10, 10, 0]}
                      barSize={18}
                      maxBarSize={24}
                      isAnimationActive
                      animationDuration={850}
                      onClick={(entry) =>
                        void onOpenTasksView({
                          overdue: true,
                          deadlineMonth: getDashboardChartEntry(entry).key || "",
                        })
                      }
                    >
                      <LabelList dataKey="count" position="right" className="dashboard-bar-label" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="dashboard-empty-state">
                  <div className="dashboard-empty-icon">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="8" y="6" width="24" height="28" rx="3" stroke="#94A3B8" strokeWidth="2" fill="none"/>
                      <line x1="14" y1="16" x2="26" y2="16" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="14" y1="22" x2="22" y2="22" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="26" cy="26" r="7" fill="#FEE2E2" stroke="#FCA5A5" strokeWidth="1.5"/>
                      <line x1="23" y1="26" x2="29" y2="26" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <span className="dashboard-empty-title">Gecikmə yoxdur</span>
                  <span className="dashboard-empty-subtitle">Hal-hazırda gecikmiş tapşırıq yoxdur.</span>
                </div>
              )}
            </div>
          </div>

          <div className="dashboard-panel dashboard-workload-panel">
            <div className="dashboard-panel-heading">
              <h3 className="dashboard-panel-title">İcraçı yükü</h3>
              <div className="dashboard-mini-legend">
                <span><i className="legend-blue" />Açıq</span>
                <span><i className="legend-red" />Gecikən</span>
              </div>
            </div>

            <div
              className="dashboard-chart-body"
            >
              {assigneeChartHasData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={assigneeLoadChartData}
                    layout="vertical"
                    margin={{ top: 10, right: 26, bottom: 0, left: 6 }}
                    barCategoryGap={8}
                    barGap={3}
                  >
                    <defs>
                      <linearGradient id="workOpenGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={deepBlue} stopOpacity={1} />
                        <stop offset="100%" stopColor={mainBlue} stopOpacity={0.84} />
                      </linearGradient>
                      <linearGradient id="workOverdueGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={amber} stopOpacity={1} />
                        <stop offset="100%" stopColor="#F97316" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={false} height={0} />
                    <YAxis
                      type="category"
                      dataKey="displayName"
                      width={100}
                      tick={{ fontSize: 11 }}
                      tickMargin={6}
                      interval={0}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip {...dashboardTooltipProps} />
                    <Bar
                      dataKey="count"
                      name="Açıq tapşırıq"
                      fill="url(#workOpenGrad)"
                      radius={[0, 10, 10, 0]}
                      barSize={18}
                      maxBarSize={22}
                      isAnimationActive
                      animationDuration={850}
                      onClick={(entry) =>
                        void onOpenTasksView({
                          assignee: getDashboardChartEntry(entry).id || "",
                        })
                      }
                    >
                      <LabelList dataKey="count" position="right" className="dashboard-bar-label" />
                    </Bar>
                    <Bar
                      dataKey="overdueCount"
                      name="Gecikən"
                      fill="url(#workOverdueGrad)"
                      radius={[0, 10, 10, 0]}
                      barSize={10}
                      maxBarSize={14}
                      isAnimationActive
                      animationDuration={850}
                      onClick={(entry) =>
                        void onOpenTasksView({
                          assignee: getDashboardChartEntry(entry).id || "",
                        })
                      }
                    >
                      <LabelList dataKey="overdueCount" position="right" className="dashboard-bar-label dashboard-warning-label" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="dashboard-chart-empty">Məlumat yoxdur</div>
              )}
            </div>
          </div>
        </section>

      </div>
    </>
  );
}

export default DashboardPage;
