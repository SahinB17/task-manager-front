import CustomSelect from "../components/CustomSelect";
import {
  logEntityFilterOptions,
  logActionFilterOptions,
} from "../constants/taskConstants";
import {
  getLogActionLabel,
  getLogEntityValue,
  getLogEntityLabel,
  getLogActionFilterValue,
  getLogActionClass,
  getLogDetailsLabel,
  formatLogDate,
} from "../utils/helpers";

function AuditStatIcon({ type }) {
  const commonProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
  };

  if (type === "task") {
    return (
      <svg {...commonProps}>
        <path d="M9 11l2 2 4-4" />
        <path d="M8 4h8" />
        <path d="M9 2h6a2 2 0 0 1 2 2v1H7V4a2 2 0 0 1 2-2Z" />
        <path d="M7 5H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      </svg>
    );
  }

  if (type === "user") {
    return (
      <svg {...commonProps}>
        <path d="M16 21v-2a4 4 0 0 0-8 0v2" />
        <circle cx="12" cy="7" r="4" />
        <path d="M19 8v6" />
        <path d="M22 11h-6" />
      </svg>
    );
  }

  if (type === "file") {
    return (
      <svg {...commonProps}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6" />
        <path d="M12 18v-6" />
        <path d="M9 15l3-3 3 3" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function LogsPage({
  logs,
  tasks,
  logSearch,
  logEntityFilter,
  logActionFilter,
  setLogSearch,
  setLogEntityFilter,
  setLogActionFilter,
}) {
  const getLogTargetLabel = (log) => {
    const data = {
      ...(log.old_data || {}),
      ...(log.new_data || {}),
    };
    const relatedTask = tasks.find(
      (task) => task.id === log.entity_id || task.id === data.task_id
    );
    const targetName =
      data.title ||
      relatedTask?.title ||
      data.company_name ||
      data.full_name ||
      data.file_name ||
      log.description;

    if (targetName && data.task_id) {
      return targetName;
    }

    if (targetName) return targetName;

    if (data.task_id) return "Tapşırıq";
    if (log.entity_id) return `ID: ${log.entity_id}`;

    return "—";
  };

  const getLogActorLabel = (log) => {
    if (log.actor?.full_name) return log.actor.full_name;
    if (log.actor?.email) return log.actor.email;
    if (log.user_id) return `İstifadəçi ID: ${String(log.user_id).slice(0, 8)}`;
    return "—";
  };

  const getLogActorInitial = (log) => {
    const actorLabel = log.actor?.full_name || log.actor?.email;
    return actorLabel ? actorLabel.trim().charAt(0).toUpperCase() : "";
  };

  const renderLogActor = (log) => {
    const initial = getLogActorInitial(log);

    if (!initial) {
      return <span className="log-actor-text">{getLogActorLabel(log)}</span>;
    }

    return (
      <span className="log-actor">
        <span className="log-actor-avatar" aria-hidden="true">
          {initial}
        </span>
        <span className="log-actor-text">{getLogActorLabel(log)}</span>
      </span>
    );
  };

  const renderLogDetails = (detailsLabel) => {
    if (!detailsLabel) {
      return <span className="log-details-empty">—</span>;
    }

    const parts = detailsLabel
      .split(/\s·\s|,\s/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length <= 1) {
      return <span className="log-details-text">{detailsLabel}</span>;
    }

    return (
      <span className="log-details-chips">
        {parts.map((part) => (
          <span className="log-detail-chip" key={part}>
            {part}
          </span>
        ))}
      </span>
    );
  };

  const resetLogFilters = () => {
    setLogSearch("");
    setLogEntityFilter("all");
    setLogActionFilter("all");
  };

  const filteredLogs = logs.filter((log) => {
    if (getLogEntityValue(log) === "client") return false;

    const searchValue = logSearch.trim().toLowerCase();
    const actionLabel = getLogActionLabel(log.action);
    const entityLabel = getLogEntityLabel(log);
    const targetLabel = getLogTargetLabel(log);
    const actorLabel = getLogActorLabel(log);
    const detailsLabel = getLogDetailsLabel(log);
    const logDate = formatLogDate(log.created_at);
    const matchesSearch =
      !searchValue ||
      [
        log.action,
        actionLabel,
        entityLabel,
        log.entity_type,
        log.object_type,
        log.target_type,
        log.description,
        log.entity_id,
        actorLabel,
        targetLabel,
        detailsLabel,
        logDate,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchValue));
    const matchesEntity =
      logEntityFilter === "all" || getLogEntityValue(log) === logEntityFilter;
    const matchesAction =
      logActionFilter === "all" ||
      getLogActionFilterValue(log.action) === logActionFilter;

    return matchesSearch && matchesEntity && matchesAction;
  });

  const taskLogCount = logs.filter((log) => getLogEntityValue(log) === "task")
    .length;
  const userLogCount = logs.filter((log) => getLogEntityValue(log) === "user")
    .length;
  const fileLogCount = logs.filter((log) => getLogEntityValue(log) === "file")
    .length;

  return (
    <div className="section-card">
      <div className="section-header">
        <div>
          <p className="section-subtitle">Sistemdə edilmiş əsas əməliyyatlar</p>
        </div>
      </div>

      <div className="logs-summary-grid">
        <div className="logs-summary-card">
          <span className="logs-summary-icon" aria-hidden="true">
            <AuditStatIcon type="activity" />
          </span>
          <span>
            <span className="logs-summary-title">Ümumi əməliyyatlar</span>
            <strong className="logs-summary-value">{logs.length}</strong>
          </span>
        </div>

        <div className="logs-summary-card">
          <span className="logs-summary-icon" aria-hidden="true">
            <AuditStatIcon type="task" />
          </span>
          <span>
            <span className="logs-summary-title">Tapşırıq əməliyyatları</span>
            <strong className="logs-summary-value">{taskLogCount}</strong>
          </span>
        </div>

        <div className="logs-summary-card">
          <span className="logs-summary-icon" aria-hidden="true">
            <AuditStatIcon type="user" />
          </span>
          <span>
            <span className="logs-summary-title">İstifadəçi əməliyyatları</span>
            <strong className="logs-summary-value">{userLogCount}</strong>
          </span>
        </div>

        <div className="logs-summary-card">
          <span className="logs-summary-icon" aria-hidden="true">
            <AuditStatIcon type="file" />
          </span>
          <span>
            <span className="logs-summary-title">Fayl əməliyyatları</span>
            <strong className="logs-summary-value">{fileLogCount}</strong>
          </span>
        </div>
      </div>

      <div className="logs-filters">
        <input
          type="search"
          className="log-filter-input"
          placeholder="Əməliyyat axtar..."
          value={logSearch}
          onChange={(e) => setLogSearch(e.target.value)}
        />

        <CustomSelect
          className="log-filter-select"
          value={logEntityFilter}
          onChange={(nextValue) => setLogEntityFilter(nextValue)}
          options={logEntityFilterOptions}
        />

        <CustomSelect
          className="log-filter-select"
          value={logActionFilter}
          onChange={(nextValue) => setLogActionFilter(nextValue)}
          options={logActionFilterOptions}
        />

        <button
          type="button"
          className="reset-filters-btn"
          onClick={resetLogFilters}
        >
          Sıfırla
        </button>
      </div>

      <div className="table-wrapper">
        <table className="logs-table">
          <thead>
            <tr>
              <th>Əməliyyat</th>
              <th>Kim etdi</th>
              <th>Obyekt</th>
              <th>Aid olduğu</th>
              <th>Detallar</th>
              <th>Tarix</th>
            </tr>
          </thead>

          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-cell">
                  Əməliyyat tapılmadı
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-cell no-results">
                  Nəticə tapılmadı
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const detailsLabel = getLogDetailsLabel(log);

                return (
                  <tr key={log.id}>
                    <td>
                      <span
                        className={`log-action-badge ${getLogActionClass(
                          log.action
                        )}`}
                      >
                        {getLogActionLabel(log.action)}
                      </span>
                    </td>
                    <td>
                      {renderLogActor(log)}
                    </td>
                    <td>
                      <span className="log-entity-badge">
                        {getLogEntityLabel(log)}
                      </span>
                    </td>
                    <td>
                      <span className="log-target-text">
                        {getLogTargetLabel(log)}
                      </span>
                    </td>
                    <td>
                      {renderLogDetails(detailsLabel)}
                    </td>
                    <td>{formatLogDate(log.created_at)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LogsPage;
