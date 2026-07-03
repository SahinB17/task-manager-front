import { actionLabels, entityLabels, operationalStatusLabels } from "../constants/taskConstants";

// Azerbaijani labels for all possible status values (both canonical and operational).
const STATUS_VALUE_LABELS = {
  // Operational (business) values
  ...operationalStatusLabels,
  // Canonical (legacy) values — map to business labels
  todo: "Yeni",
  in_progress: "İcradadır",
  done: "Tam icra",
};

export const isValidEmail = (value) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

export const formatDate = (value, withTime = false) => {
  if (!value) return "—";

  return withTime
    ? new Date(value).toLocaleString("az-AZ")
    : new Date(value).toLocaleDateString("az-AZ");
};

export const formatLogDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const pad = (part) => String(part).padStart(2, "0");

  return `${pad(date.getDate())}.${pad(
    date.getMonth() + 1
  )}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const getDayStart = (value) => {
  const date = value ? new Date(value) : new Date();
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

export const getErrorMessage = (err, fallback = "Əməliyyat tamamlanmadı") => {
  const detail = err.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item.msg || item.message || JSON.stringify(item))
      .join("\n");
  }

  if (err.response?.status === 403) {
    return "Bu əməliyyat üçün icazəniz yoxdur.";
  }

  if (err.response?.status === 404) {
    return "Məlumat tapılmadı.";
  }

  if (err.response?.status === 500) {
    return "Serverdə xəta baş verdi. Bir az sonra yenidən yoxlayın.";
  }

  return err.message || fallback;
};

export const getUserRoleValue = (item) => {
  if (item.role) return item.role;
  if (item.role_id === 1) return "admin";
  if (item.role_id === 2) return "manager";
  return "employee";
};

export const getUserRoleLabel = (item) => {
  const roleValue = getUserRoleValue(item);

  if (roleValue === "admin") return "Admin";
  if (roleValue === "manager") return "Menecer";
  return "İşçi";
};

export const isUserActive = (item) => {
  if (typeof item.is_active === "boolean") return item.is_active;
  if (typeof item.active === "boolean") return item.active;
  return item.status ? item.status === "active" : true;
};

export const getAttachmentFileName = (attachment) => {
  return (
    attachment.filename ||
    attachment.original_filename ||
    attachment.file_name ||
    "Fayl"
  );
};

export const isTaskCompleted = (task) => {
  if (!task) return false;

  return task.operational_status === "completed" || task.status === "done";
};

export const getDeadlineInfo = (task) => {
  if (!task?.deadline || isTaskCompleted(task)) {
    return null;
  }

  const today = getDayStart();
  const deadline = getDayStart(task.deadline);
  const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return {
      icon: "!",
      className: "overdue",
      title: "Tapşırıq gecikib",
    };
  }

  if (daysLeft === 1) {
    return {
      icon: "!",
      className: "urgent",
      title: "Son tarixə 1 gün qalıb",
    };
  }

  if (daysLeft >= 2 && daysLeft <= 3) {
    return {
      icon: "!",
      className: "soon",
      title: `Son tarixə ${daysLeft} gün qalıb`,
    };
  }

  if (daysLeft >= 4 && daysLeft <= 7) {
    return {
      icon: "!",
      className: "watch",
      title: `Son tarixə ${daysLeft} gün qalıb`,
    };
  }

  return null;
};

export const isTaskOverdue = (task) => {
  const deadline = task.current_deadline || task.deadline || task.initial_deadline || null;
  return (
    deadline &&
    new Date(deadline) < new Date() &&
    !isTaskCompleted(task)
  );
};

export const isTaskDueThisWeek = (task) => {
  if (
    !task?.deadline ||
    isTaskCompleted(task)
  ) {
    return false;
  }

  const today = getDayStart();
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);
  const deadline = getDayStart(task.deadline);

  return deadline >= today && deadline <= weekEnd;
};

export const getDashboardDeadlineClass = (task) => {
  if (
    !task?.deadline ||
    isTaskCompleted(task)
  ) {
    return "normal";
  }

  const today = getDayStart();
  const deadline = getDayStart(task.deadline);
  const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) return "overdue";
  if (daysLeft <= 3) return "soon";
  return "normal";
};

export const getLogActionLabel = (action) => {
  if (!action) return "—";
  const normalizedAction = String(action).trim();
  return (
    actionLabels[normalizedAction] ||
    actionLabels[normalizedAction.toUpperCase()] ||
    normalizedAction
  );
};

const logObjectLabels = {
  task: "Tapşırıq",
  user: "İstifadəçi",
  excel_import: "Excel import",
  project: "Layihə",
};

const logFieldLabels = {
  email: "Email",
  role_id: "Rol",
  full_name: "Tam ad",
  is_active: "Aktivlik",
  title: "Başlıq",
  status: "Status",
  operational_status: "Status",
  category: "Kateqoriya",
  priority: "Prioritet",
  deadline: "Son tarix",
  custom_fields: "Əlavə sahələr",
  description: "Açıqlama",
  assignee_id: "İcraçı",
  project_id: "Layihə",
  due_date: "Son tarix",
  task_id: "Tapşırıq ID",
  file_name: "Fayl adı",
  file_path: "Fayl yolu",
  file_type: "Fayl tipi",
  created_count: "Yaradıldı",
  updated_count: "Yeniləndi",
  unchanged_count: "Dəyişmədi",
  deleted_count: "Silindi",
};

const getLogFieldLabel = (field) => {
  return logFieldLabels[field] || field;
};

export const getLogEntityValue = (log) => {
  const rawValue =
    log.entity_type ||
    log.object_type ||
    log.target_type ||
    log.entity ||
    log.object ||
    "";
  const value = String(rawValue).toLowerCase();

  if (value === "task_attachment" || value === "attachment") return "file";
  if (value === "task") return "task";
  if (value === "user") return "user";
  if (value === "client") return "client";
  if (value === "project") return "project";
  if (value === "excel_import") return "excel_import";

  return value || "unknown";
};

export const getLogEntityLabel = (log) => {
  const rawValue =
    log.entity_type ||
    log.object_type ||
    log.target_type ||
    log.entity ||
    log.object ||
    "";
  const value = String(rawValue).toLowerCase();

  if (value === "task_attachment" || value === "attachment") return "Fayl";

  if (logObjectLabels[value]) return logObjectLabels[value];

  return entityLabels[value] || entityLabels[rawValue] || rawValue || "—";
};

export const getLogActionFilterValue = (action) => {
  const value = String(action || "").toUpperCase();

  if (value.includes("GLOBAL_EXCEL_IMPORT") || value.includes("IMPORT")) {
    return "import";
  }
  if (value.includes("FILE_UPLOADED") || value.includes("ATTACHMENT_UPLOADED")) {
    return "file_upload";
  }
  if (value.includes("FILE_DELETED") || value.includes("ATTACHMENT_DELETED")) {
    return "file_delete";
  }
  if (value.includes("STATUS")) return "status";
  if (value.includes("CREATED")) return "create";
  if (value.includes("UPDATED")) return "update";
  if (value.includes("DELETED")) return "delete";

  return "other";
};

export const getLogActionClass = (action) => {
  const value = getLogActionFilterValue(action);

  if (value === "create") return "log-action-create";
  if (value === "update") return "log-action-update";
  if (value === "delete" || value === "file_delete") return "log-action-delete";
  if (value === "import") return "log-action-import";
  if (value === "file_upload") return "log-action-file";
  if (value === "status") return "log-action-status";

  return "log-action-update";
};

export const getLogDetailsLabel = (log) => {
  const details = log.new_data || log.old_data;
  if (!details || typeof details !== "object") return "";

  if (log.action === "GLOBAL_EXCEL_IMPORT") {
    const parts = [
      details.created_tasks ? `${details.created_tasks} yaradıldı` : "",
      details.updated_tasks ? `${details.updated_tasks} yeniləndi` : "",
      details.no_change_count ? `${details.no_change_count} dəyişmədi` : "",
      details.skipped_rows ? `${details.skipped_rows} sətir keçildi` : "",
    ].filter(Boolean);

    return parts.join(" · ");
  }

  const changedKeys = Object.keys(log.new_data || {}).filter(
    (key) => key !== "password" && key !== "password_hash"
  );

  // When both canonical status and operational_status exist in the same log,
  // hide canonical status — the business (operational) status is sufficient.
  const hasBothStatuses = changedKeys.includes("operational_status") && changedKeys.includes("status");
  const displayKeys = hasBothStatuses
    ? changedKeys.filter((key) => key !== "status")
    : changedKeys;

  if (displayKeys.length === 0) return "";

  const parts = displayKeys.slice(0, 4).map((key) => {
    const label = getLogFieldLabel(key);
    const oldData = log.old_data;

    // Status-related fields show the old → new transition with business labels.
    if (key === "status" || key === "operational_status") {
      const newVal = log.new_data?.[key];
      const oldVal = oldData?.[key];

      if (oldVal !== undefined && newVal !== undefined && String(oldVal) !== String(newVal)) {
        const oldLabel = STATUS_VALUE_LABELS[oldVal] || oldVal;
        const newLabel = STATUS_VALUE_LABELS[newVal] || newVal;
        return `${label}: ${oldLabel} → ${newLabel}`;
      }

      if (newVal !== undefined) {
        const newLabel = STATUS_VALUE_LABELS[newVal] || newVal;
        return `${label}: ${newLabel}`;
      }

      return `${label} dəyişdi`;
    }

    // Non-status fields: keep current behavior (field label chip).
    return label;
  });

  return parts.join(", ");
};

export const getTaskUpdatedTime = (task) => {
  const updatedTime = task.updated_at ? new Date(task.updated_at).getTime() : 0;
  return Number.isNaN(updatedTime) ? 0 : updatedTime;
};

export const sortKanbanTasksByUpdatedAt = (items) => {
  return [...items].sort((firstTask, secondTask) => {
    return getTaskUpdatedTime(secondTask) - getTaskUpdatedTime(firstTask);
  });
};
