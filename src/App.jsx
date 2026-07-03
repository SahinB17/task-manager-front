import { useEffect, useRef, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts";
import api from "./api";
import CustomSelect from "./components/CustomSelect";
import DeleteModal from "./components/DeleteModal";
import useBodyScrollLock from "./hooks/useBodyScrollLock";
import KanbanPage from "./pages/KanbanPage";
import DashboardPage from "./pages/DashboardPage";
import ProjectsPage from "./pages/ProjectsPage";
import UsersPage from "./pages/UsersPage";
import LogsPage from "./pages/LogsPage";
import TasksPage from "./pages/TasksPage";
import AIAssistantPage from "./pages/AIAssistantPage";
import NotificationsPage from "./pages/NotificationsPage";
import "./App.css";

import {
  operationalStatusLabels,
  priorityLabels,
  TASKS_PAGE_SIZE,
  taskTypeLabels,
  taskStatusOptions,
  priorityOptions,
  taskTypeOptions,
  frequencyOptions,
  riskStatusOptions,
  riskStatusLabels,
  frequencyLabels,
  reportingRequiredOptions,
} from "./constants/taskConstants";
import {
  formatDate,
  isValidEmail,
  getErrorMessage,
  getUserRoleValue,
  getUserRoleLabel,
  isUserActive,
  getAttachmentFileName,
  isTaskCompleted,
  isTaskOverdue,
  isTaskDueThisWeek,
} from "./utils/helpers";

const logDevError = (...args) => {
  if (import.meta.env.DEV) {
    console.error(...args);
  }
};

const projectStageStatusOptions = [
  { value: "", label: "Seçilməyib" },
  { value: "not_started", label: "Başlanmayıb" },
  { value: "in_progress", label: "İcradadır" },
  { value: "partial", label: "Qismən icra" },
  { value: "within_deadline", label: "İcra müddətinə var" },
  { value: "waiting", label: "Gözləmədə" },
  { value: "delayed", label: "Gecikmə" },
  { value: "completed", label: "Tam icra" },
];

const projectStageNameOptions = [
  { value: "", label: "Mərhələ seç" },
  { value: "Təşəbbüs", label: "Təşəbbüs" },
  { value: "Planlaşdırma", label: "Planlaşdırma" },
  { value: "İcra", label: "İcra" },
  { value: "Monitorinq və Nəzarət", label: "Monitorinq və Nəzarət" },
  { value: "Bağlanış", label: "Bağlanış" },
];

const projectApproachFallbacks = [
  "Proqnozlaşdırıcı",
  "Hibrid",
  "Çevik (Agile)",
];

const normalizeProjectStageName = (value) => String(value || "").trim();
const getProjectStageSortOrder = (name) =>
  projectStageNameOptions.findIndex((option) => option.value === name) + 1;

const projectStageStatusAliases = {
  Başlanmayıb: "not_started",
  İcradadır: "in_progress",
  "Qismən icra": "partial",
  "İcra müddətinə var": "within_deadline",
  Gözləmədə: "waiting",
  Gecikmə: "delayed",
  "Tam icra": "completed",
  Tamamlanıb: "completed",
};

const normalizeProjectStageStatus = (value) => {
  if (!value) return "";
  const normalizedValue = String(value).trim();
  return projectStageStatusAliases[normalizedValue] || normalizedValue;
};

const getProjectStageStatusLabel = (value) => {
  const normalizedValue = normalizeProjectStageStatus(value);
  return (
    projectStageStatusOptions.find((option) => option.value === normalizedValue)?.label ||
    value ||
    "—"
  );
};

const getProjectStageStatusBadgeClass = (status) => {
  const normalized = normalizeProjectStageStatus(status);
  const map = {
    not_started: "stage-status-not-started",
    in_progress: "stage-status-in-progress",
    partial: "stage-status-partial",
    within_deadline: "stage-status-within-deadline",
    waiting: "stage-status-waiting",
    delayed: "stage-status-delayed",
    completed: "stage-status-completed",
  };
  return map[normalized] || "";
};

const ActionIcon = ({ name }) => {
  const iconProps = {
    className: "action-icon",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    focusable: "false",
  };

  if (name === "details") {
    return (
      <svg {...iconProps}>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  if (name === "edit") {
    return (
      <svg {...iconProps}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    );
  }

  if (name === "delete") {
    return (
      <svg {...iconProps}>
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v5" />
        <path d="M14 11v5" />
      </svg>
    );
  }

  if (name === "status") {
    return (
      <svg {...iconProps}>
        <path d="M4 7h9" />
        <path d="M17 7h3" />
        <path d="M4 17h3" />
        <path d="M11 17h9" />
        <circle cx="15" cy="7" r="2" />
        <circle cx="9" cy="17" r="2" />
      </svg>
    );
  }

  return null;
};

const SidebarIcon = ({ name }) => {
  const iconProps = {
    className: "nav-icon",
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
    dashboard: (
      <>
        <path d="M3 11l9-8 9 8" />
        <path d="M5 10v10h14V10" />
        <path d="M9 20v-6h6v6" />
      </>
    ),
    tasks: (
      <>
        <rect width="16" height="18" x="4" y="3" rx="2" />
        <path d="M8 8h8" />
        <path d="M8 12h8" />
        <path d="M8 16h5" />
      </>
    ),
    kanban: (
      <>
        <rect width="18" height="16" x="3" y="4" rx="2" />
        <path d="M9 4v16" />
        <path d="M15 4v16" />
      </>
    ),
    ai: (
      <>
        <path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8Z" />
        <path d="M19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9Z" />
      </>
    ),
    projects: (
      <>
        <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      </>
    ),
    excel: (
      <>
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M3 9h18" />
        <path d="M9 3v18" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    logs: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v5h5" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    notifications: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </>
    ),
    logout: (
      <>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="M16 17l5-5-5-5" />
        <path d="M21 12H9" />
      </>
    ),
  };

  return <svg {...iconProps}>{icons[name]}</svg>;
};


function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [authChecking, setAuthChecking] = useState(() => Boolean(localStorage.getItem("token")));
  const [forcePasswordChange, setForcePasswordChange] = useState(false);
  const [passwordChangeCurrent, setPasswordChangeCurrent] = useState("");
  const [passwordChangeNew, setPasswordChangeNew] = useState("");
  const [passwordChangeConfirm, setPasswordChangeConfirm] = useState("");
  const [passwordChangeError, setPasswordChangeError] = useState("");
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [selectedTaskForComments, setSelectedTaskForComments] = useState(null);
  const [taskComments, setTaskComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [taskAttachments, setTaskAttachments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [attachmentsError, setAttachmentsError] = useState("");
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [statusControlTaskId, setStatusControlTaskId] = useState(null);
  const [taskSearch, setTaskSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [directionFilter, setDirectionFilter] = useState("");
  const [taskTypeFilter, setTaskTypeFilter] = useState("");
  const [operationalStatusFilter, setOperationalStatusFilter] = useState("");
  const [frequencyFilter, setFrequencyFilter] = useState("");
  const [riskStatusFilter, setRiskStatusFilter] = useState("all");
  const [reportingRequiredFilter, setReportingRequiredFilter] = useState("all");
  const [kanbanEnabledFilter, setKanbanEnabledFilter] = useState("all");
  const [deadlineFilter, setDeadlineFilter] = useState("all");
  const [deadlineMonthFilter, setDeadlineMonthFilter] = useState("");
  const [showAdvancedTaskFilters, setShowAdvancedTaskFilters] = useState(false);
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [showDueThisWeekOnly, setShowDueThisWeekOnly] = useState(false);
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [projectSearch, setProjectSearch] = useState("");
  const [projectDirectionFilter, setProjectDirectionFilter] = useState("");
  const [projectApproachFilter, setProjectApproachFilter] = useState("");
  const [projectActiveFilter, setProjectActiveFilter] = useState("all");
  const [projectOwnerFilter, setProjectOwnerFilter] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [userPasswordChangeFilter, setUserPasswordChangeFilter] = useState("all");
  const [logSearch, setLogSearch] = useState("");
  const [logEntityFilter, setLogEntityFilter] = useState("all");
  const [logActionFilter, setLogActionFilter] = useState("all");
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectStages, setProjectStages] = useState([]);
  const [users, setUsers] = useState([]);
  const [resetUserPasswordLoadingId, setResetUserPasswordLoadingId] = useState(null);
  const [resetUserPasswordResult, setResetUserPasswordResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [page, setPage] = useState("dashboard");

  const [directionPrograms, setDirectionPrograms] = useState([]);
  const [taskTypeValues, setTaskTypeValues] = useState([]);
  const [priorityValues, setPriorityValues] = useState([]);
  const [frequencyValues, setFrequencyValues] = useState([]);
  const [riskStatusValues, setRiskStatusValues] = useState([]);

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    task_type: "one_time",
    status: "new",
    operational_status: "new",
    priority: "medium",
    kanban_enabled: true,
    frequency: "none",
    risk_status: "",
    reporting_required: "",
    category: "",
    deadline: "",
    client_id: "",
    project_id: "",
    assigned_to_id: "",
    custom_fields: {},
  });


  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [projectForm, setProjectForm] = useState({
    code: "",
    name: "",
    direction_program: "",
    owner: "",
    approach: "",
    description: "",
    is_active: true,
  });
  const [showStageForm, setShowStageForm] = useState(false);
  const [editingStageId, setEditingStageId] = useState(null);
  const [stageForm, setStageForm] = useState({
    name: "",
    weight_percent: "",
    planned_start: "",
    planned_end: "",
    actual_end: "",
    status: "",
    delay_reason: "",
    completion_percent: "",
  });

  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);

  const [userForm, setUserForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role_id: 3,
    is_active: true,
  });
  const [taskFormErrors, setTaskFormErrors] = useState({});
  const [projectFormErrors, setProjectFormErrors] = useState({});
  const [stageFormErrors, setStageFormErrors] = useState({});
  const [userFormErrors, setUserFormErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [excelExporting, setExcelExporting] = useState(false);
  const [excelImporting, setExcelImporting] = useState(false);
  const fileInputRef = useRef(null);
  const excelImportInputRef = useRef(null);

  // Global Excel import state (new task-first flow)
  const [globalPreview, setGlobalPreview] = useState(null);
  const [globalPreviewLoading, setGlobalPreviewLoading] = useState(false);
  const [globalPreviewError, setGlobalPreviewError] = useState("");
  const [globalImporting, setGlobalImporting] = useState(false);
  const [globalImportResult, setGlobalImportResult] = useState(null);
  const [globalFile, setGlobalFile] = useState(null);
  const [globalFileName, setGlobalFileName] = useState("");
  const [globalShowImportReport, setGlobalShowImportReport] = useState(false);
  const globalFileInputRef = useRef(null);

  const getToken = () => localStorage.getItem("token");

  const replaceAppPath = (path) => {
    if (window.location.pathname !== path) {
      window.history.replaceState(null, "", path);
    }
  };

  const resetSession = () => {
    localStorage.removeItem("token");
    replaceAppPath("/");
    setUser(null);
    setForcePasswordChange(false);
    setPasswordChangeCurrent("");
    setPasswordChangeNew("");
    setPasswordChangeConfirm("");
    setPasswordChangeError("");
    setResetUserPasswordResult(null);
    setStats(null);
    setTasks([]);
    setProjects([]);
    setSelectedProject(null);
    setProjectStages([]);
    setGlobalPreview(null);
    setGlobalPreviewError("");
    setGlobalImportResult(null);
    setGlobalFile(null);
    setGlobalFileName("");
    setGlobalShowImportReport(false);
    setUsers([]);
    setLogs([]);
    setUnreadNotifications(0);
    setTaskComments([]);
    setTaskAttachments([]);
    setSelectedTaskForComments(null);
    setPage("dashboard");
    window.dispatchEvent(new Event("auth:logout"));
  };

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
  });
  const appDialogResolverRef = useRef(null);
  const [appDialog, setAppDialog] = useState({
    open: false,
    title: "",
    message: "",
    variant: "info",
    confirm: false,
    confirmText: "Bağla",
    cancelText: "Ləğv et",
  });

  // Shared body scroll lock — prevents background scrolling when any modal is open
  useBodyScrollLock(globalShowImportReport);
  useBodyScrollLock(appDialog.open);
  useBodyScrollLock(deleteModal.open);

  const getDialogVariant = (message) => {
    const lowerMessage = String(message || "").toLocaleLowerCase("az-AZ");

    if (
      lowerMessage.includes("alınmadı") ||
      lowerMessage.includes("silinmədi") ||
      lowerMessage.includes("dəyişmədi") ||
      lowerMessage.includes("saxlanmadı") ||
      lowerMessage.includes("xəta")
    ) {
      return "error";
    }

    if (
      lowerMessage.includes("tamamlandı") ||
      lowerMessage.includes("uğurla")
    ) {
      return "success";
    }

    if (
      lowerMessage.includes("əminsiniz") ||
      lowerMessage.includes("boş") ||
      lowerMessage.includes("seçin") ||
      lowerMessage.includes("deaktiv")
    ) {
      return "warning";
    }

    return "info";
  };

  const getDialogTitle = (variant) => {
    if (variant === "success") return "Tamamlandı";
    if (variant === "error") return "Xəta";
    if (variant === "warning") return "Diqqət";
    return "Bildiriş";
  };

  const closeAppDialog = (result = false) => {
    const resolver = appDialogResolverRef.current;
    appDialogResolverRef.current = null;
    setAppDialog((prev) => ({ ...prev, open: false }));

    if (resolver) {
      resolver(result);
    }
  };

  const showAppAlert = (message, options = {}) => {
    const variant = options.variant || getDialogVariant(message);
    setAppDialog({
      open: true,
      title: options.title || getDialogTitle(variant),
      message,
      variant,
      confirm: false,
      confirmText: options.confirmText || "Bağla",
      cancelText: options.cancelText || "Ləğv et",
    });
  };

  const showAppConfirm = (message, options = {}) => {
    const variant = options.variant || "warning";
    return new Promise((resolve) => {
      appDialogResolverRef.current = resolve;
      setAppDialog({
        open: true,
        title: options.title || getDialogTitle(variant),
        message,
        variant,
        confirm: true,
        confirmText: options.confirmText || "Təsdiqlə",
        cancelText: options.cancelText || "Ləğv et",
      });
    });
  };

  const openDeleteModal = ({ title, message, onConfirm }) => {
    setDeleteModal({
      open: true,
      title,
      message,
      onConfirm,
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      open: false,
      title: "",
      message: "",
      onConfirm: null,
    });
  };

  const handleDeleteConfirm = async () => {
    if (deleteModal.onConfirm) {
      await deleteModal.onConfirm();
    }
    closeDeleteModal();
  };

  const isAdminOrManager = () => {
    return user && (user.role_id === 1 || user.role_id === 2);
  };

  const downloadTasksExcel = async () => {
    setExcelExporting(true);

    try {
      const response = await api.get("/excel/tasks/export", {
        responseType: "blob",
      });
      const contentDisposition = response.headers["content-disposition"] || "";
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      const filename = filenameMatch?.[1] || "tasks-export.xlsx";
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      logDevError("Excel export error:", err.response?.data || err);
      showAppAlert(getErrorMessage(err, "Excel export alınmadı."));
    } finally {
      setExcelExporting(false);
    }
  };

  const openExcelImportPicker = () => {
    if (excelImportInputRef.current) {
      excelImportInputRef.current.value = "";
      excelImportInputRef.current.click();
    }
  };

  const importTasksExcel = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;
    const confirmed = await showAppConfirm("Excel faylı import ediləcək.");
    if (!confirmed) {
      if (excelImportInputRef.current) {
        excelImportInputRef.current.value = "";
      }
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setExcelImporting(true);

    try {
      const response = await api.post("/excel/global/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await Promise.all([loadTasks(), loadUsers()]);
      await loadDashboard();

      const created = response.data?.created_tasks ?? 0;
      const skipped = response.data?.skipped_rows ?? 0;

      let msg = `Excel import tamamlandı.\n${created} tapşırıq yaradıldı.`;
      if (skipped > 0) {
        msg += `\n${skipped} sətir keçirildi (boş başlıq).`;
      }
      showAppAlert(msg);
    } catch (err) {
      logDevError("Excel import error:", err.response?.data || err);
      const detail = err.response?.data?.detail;

      if (detail?.errors?.length) {
        const rowErrors = detail.errors
          .slice(0, 8)
          .map((item) => (typeof item === "string" ? item : `Sətir ${item.row}: ${item.message}`))
          .join("\n");
        const moreText =
          detail.errors.length > 8
            ? `\n... və ${detail.errors.length - 8} əlavə xəta`
            : "";

        showAppAlert(`${detail.message || "Excel import alınmadı."}\n${rowErrors}${moreText}`);
      } else if (detail?.message) {
        showAppAlert(detail.message);
      } else {
        showAppAlert(getErrorMessage(err, "Excel import alınmadı."));
      }
    } finally {
      setExcelImporting(false);
      if (excelImportInputRef.current) {
        excelImportInputRef.current.value = "";
      }
    }
  };

  const validateTaskForm = () => {
    const errors = {};

    if (!newTask.title.trim()) errors.title = "Başlıq boş ola bilməz";
    if (!newTask.task_type) errors.task_type = "Tapşırıq növü seçilməlidir";
    if (!newTask.priority) errors.priority = "Prioritet seçilməlidir";
    if (!newTask.operational_status) errors.operational_status = "Status seçilməlidir";
    if (!newTask.deadline) errors.deadline = "Son tarix seçilməlidir";
    if (!newTask.assigned_to_id) errors.assigned_to_id = "İcraçı seçilməlidir";

    setTaskFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const globalPriorityAzLabels = {
    high: "Yüksək", medium: "Orta", low: "Aşağı",
  };
  const globalOpStatusAzLabels = {
    new: "Yeni", active: "İcradadır", waiting: "Gözləmədə",
    overdue: "Gecikmə", completed: "Tam icra", within_deadline: "İcra müddətində",
  };

  const loadGlobalPreview = async () => {
    if (!globalFile) return;
    setGlobalPreviewLoading(true);
    setGlobalPreviewError("");
    setGlobalImportResult(null);

    const formData = new FormData();
    formData.append("file", globalFile);

    try {
      const response = await api.post("/excel/global/preview", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setGlobalPreview(response.data);
    } catch (err) {
      logDevError("Global preview error:", err.response?.data || err);
      setGlobalPreviewError(getErrorMessage(err, "Excel baxış alınmadı."));
    } finally {
      setGlobalPreviewLoading(false);
    }
  };

  const importGlobalExcel = async () => {
    if (!globalFile) return;
    const confirmed = await showAppConfirm(
      "Excel məlumatları sistemə import ediləcək."
    );
    if (!confirmed) return;

    setGlobalImporting(true);
    setGlobalImportResult(null);

    const formData = new FormData();
    formData.append("file", globalFile);

    try {
      const response = await api.post("/excel/global/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setGlobalImportResult({ success: true, data: response.data });
      setGlobalShowImportReport(true);
      await Promise.all([loadTasks(), loadUsers()]);
      await loadDashboard();
    } catch (err) {
      logDevError("Global import error:", err.response?.data || err);
      const detail = err.response?.data?.detail;
      let errorMessage = "Excel import alınmadı.";
      let errorList = [];
      if (typeof detail === "string") {
        errorMessage = detail;
      } else if (detail?.errors?.length) {
        errorMessage = detail.message || errorMessage;
        errorList = detail.errors;
      } else if (detail?.message) {
        errorMessage = detail.message;
      } else {
        errorMessage = getErrorMessage(err, errorMessage);
      }
      setGlobalImportResult({
        success: false,
        message: errorMessage,
        errors: errorList,
      });
      loadTasks().catch(() => {});
    } finally {
      setGlobalImporting(false);
    }
  };

  const validateProjectForm = () => {
    const errors = {};

    if (!projectForm.name.trim()) {
      errors.name = "Layihə adı boş ola bilməz";
    }

    setProjectFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateUserForm = () => {
    const errors = {};

    if (!userForm.full_name.trim()) errors.full_name = "Ad boş ola bilməz";
    if (!userForm.email.trim()) {
      errors.email = "Email boş ola bilməz";
    } else if (!isValidEmail(userForm.email.trim())) {
      errors.email = "Email düzgün formatda deyil";
    }
    if (!userForm.role_id) errors.role_id = "Rol seçilməlidir";
    const passwordValue = userForm.password.trim();

    if (!editingUserId && !passwordValue) {
      errors.password = "Şifrə boş ola bilməz";
    } else if (passwordValue && passwordValue.length < 6) {
      errors.password = "Şifrə minimum 6 simvol olmalıdır";
    }

    setUserFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

const canManageTask = () => {
  if (!user) return false;

  if (user.role_id === 1 || user.role_id === 2) {
    return true;
  }

  if (user.role_id === 3) {
    return true;
  }

  return false;
};


  const loadDashboard = async () => {
    const meResponse = await api.get(`/auth/me`);
    const currentUser = meResponse.data;
    setUser(currentUser);

    if (currentUser.must_change_password) {
      setForcePasswordChange(true);
      replaceAppPath("/change-password");
      return;
    }

    setForcePasswordChange(false);
    replaceAppPath("/");

    const statsResponse = await api.get(
      `/dashboard/stats`
    );
    setStats(statsResponse.data);

    if (currentUser.role_id !== 1 && currentUser.role_id !== 2) {
      setProjects([]);
      setUsers([]);
      setLogs([]);
    }

    if (currentUser.role_id === 1 || currentUser.role_id === 2) {
      await Promise.all([loadTasks(), loadProjects()]);
    } else {
      await loadTasks();
    }

    await Promise.all([
      loadDirectionPrograms(),
      loadFieldOptions(),
      loadUnreadNotifications(),
    ]);
  };

  const loadTasks = async () => {
    const response = await api.get(`/tasks/`);
    setTasks(response.data);
  };

  const loadProjects = async () => {
    const response = await api.get(`/projects/`);
    setProjects(response.data);
  };

  const loadProjectStages = async (projectId) => {
    const response = await api.get(`/project-stages/`, {
      params: { project_id: projectId },
    });
    setProjectStages(response.data);
  };

  const loadUsers = async () => {
    const response = await api.get(`/users/`);
    setUsers(response.data);
  };

  const loadLogs = async () => {
    const response = await api.get(`/logs/`);
    setLogs(response.data);
  };

  const loadUnreadNotifications = async () => {
    try {
      const response = await api.get("/notifications/unread-count");
      setUnreadNotifications(response.data.unread_count || 0);
    } catch {
      setUnreadNotifications(0);
    }
  };

  const loadDirectionPrograms = async () => {
    try {
      const response = await api.get("/options/direction-programs");
      setDirectionPrograms(response.data || []);
    } catch {
      // Keep current state (empty) — fallback handled at usage site
    }
  };

  const loadFieldOptions = async () => {
    try {
      const [tt, pri, freq, risk] = await Promise.all([
        api.get("/options/task-types"),
        api.get("/options/priorities"),
        api.get("/options/frequencies"),
        api.get("/options/risk-statuses"),
      ]);
      setTaskTypeValues(tt.data || []);
      setPriorityValues(pri.data || []);
      setFrequencyValues(freq.data || []);
      setRiskStatusValues(risk.data || []);
    } catch {
      // Keep current state (empty) — fallback handled at usage site
    }
  };

  // Computed dropdown options: dynamic values from DB with label mapping,
  // falling back to static taskConstants when DB has no values for a field.
  const toLabeledOptions = (values, labelMap) =>
    values.map((v) => ({ value: v, label: labelMap[v] || v }));

  const effectiveTaskTypeOptions =
    taskTypeValues.length > 0
      ? toLabeledOptions(taskTypeValues, taskTypeLabels)
      : taskTypeOptions;

  const effectivePriorityOptions =
    priorityValues.length > 0
      ? toLabeledOptions(priorityValues, priorityLabels)
      : priorityOptions;

  const effectiveFrequencyOptions =
    frequencyValues.length > 0
      ? toLabeledOptions(frequencyValues, frequencyLabels)
      : frequencyOptions;

  const effectiveRiskStatusOptionsForm =
    riskStatusValues.length > 0
      ? [
          { value: "", label: "Seçilməyib" },
          ...toLabeledOptions(riskStatusValues, riskStatusLabels),
        ]
      : riskStatusOptions;

  const toRiskFilterOptions = (values) => [
    { value: "all", label: "Hamısı" },
    { value: "unassigned", label: "Təyin edilməyib" },
    ...values.map((v) => ({ value: v, label: riskStatusLabels[v] || v })),
  ];

  const effectiveRiskFilterOptions =
    riskStatusValues.length > 0
      ? toRiskFilterOptions(riskStatusValues)
      : [
          { value: "all", label: "Hamısı" },
          { value: "unassigned", label: "Təyin edilməyib" },
          { value: "low", label: "Aşağı" },
          { value: "medium", label: "Orta" },
          { value: "high", label: "Yüksək" },
        ];

const resetTaskForm = () => {
  setNewTask({
    title: "",
    description: "",
    task_type: "one_time",
    status: "new",
    operational_status: "new",
    priority: "medium",
    kanban_enabled: true,
    frequency: "none",
    risk_status: "",
    reporting_required: "",
    category: "",
    deadline: "",
    client_id: "",
    project_id: "",
    assigned_to_id: "",
    custom_fields: {},
  });

  setEditingTaskId(null);
  setShowTaskForm(false);
  setTaskFormErrors({});
};

const saveTask = async (e) => {
  e.preventDefault();

  if (!(editingTaskId && user.role_id === 3) && !validateTaskForm()) {
    return;
  }

  try {
    let payload;

    // Employee yalnız mövcud taskın statusunu dəyişə bilər
    if (editingTaskId && user.role_id === 3) {
      payload = {
        operational_status: newTask.operational_status,
      };
    } else {
      // Admin/manager task yarada və tam redaktə edə bilər
      payload = {
        title: newTask.title,
        description: newTask.description || null,
        task_type: newTask.task_type,
        operational_status: newTask.operational_status,
        priority: newTask.priority,
        kanban_enabled: newTask.kanban_enabled,
        frequency: newTask.frequency || null,
        risk_status: newTask.risk_status || null,
        reporting_required:
          newTask.reporting_required === ""
            ? null
            : newTask.reporting_required === true || newTask.reporting_required === "true",
        category: newTask.category || null,
        deadline: newTask.deadline || null,
        assigned_to: newTask.assigned_to_id || null,
        custom_fields:
          newTask.custom_fields && Object.keys(newTask.custom_fields).length > 0
            ? newTask.custom_fields
            : null,
      };

      if (newTask.project_id) {
        payload.project_id = newTask.project_id;
      } else if (editingTaskId) {
        payload.project_id = null;
      }

    }

    const wasEditingTask = Boolean(editingTaskId);

    if (wasEditingTask) {
      await api.put(
        `/tasks/${editingTaskId}`,
        payload
      );
    } else {
      await api.post(`/tasks/`, payload);
    }

    resetTaskForm();
    await loadTasks();
    await loadDashboard();
    showAppAlert(
      wasEditingTask
        ? "Tapşırıq uğurla yeniləndi."
        : "Tapşırıq uğurla əlavə edildi.",
      { variant: "success" }
    );
  } catch (err) {
    logDevError("Backend error:", err.response?.data || err);

    showAppAlert(getErrorMessage(err, "Tapşırıq yadda saxlanmadı."));
  }
};

const startEditTask = (task) => {
  setEditingTaskId(task.id);
  setTaskFormErrors({});

  setNewTask({
    title: task.title || "",
    description: task.description || "",
    task_type: task.task_type || "one_time",
    status: task.status || "pending",
    operational_status: task.operational_status || "new",
    priority: task.priority || "medium",
    kanban_enabled: task.kanban_enabled !== false,
    frequency: task.frequency || "none",
    risk_status: task.risk_status || "",
    reporting_required:
      typeof task.reporting_required === "boolean"
        ? String(task.reporting_required)
        : "",
    category: task.category || task.direction_program || "",
    deadline: task.deadline || "",
    client_id: task.client_id || "",
    project_id: task.project_id || task.project?.id || "",
    assigned_to_id:
      task.assigned_to ||
      task.assigned_to_id ||
      task.assigned_user?.id ||
      task.assigned_to_user?.id ||
      "",
    custom_fields: task.custom_fields && typeof task.custom_fields === "object" ? { ...task.custom_fields } : {},
  });

  setShowTaskForm(true);

  // Əgər şərhlər paneli açıqdırsa, bağlansın
  setSelectedTaskForComments(null);
  setTaskAttachments([]);
  setSelectedFile(null);
  setAttachmentsError("");
};


const deleteTask = async (taskId) => {
  openDeleteModal({
    title: "Tapşırığı sil",
    message: "Bu tapşırıq silinəcək. Bu əməliyyat geri qaytarılmır.",
    onConfirm: async () => {
      try {
        await api.delete(`/tasks/${taskId}`);

        setTasks((prevTasks) =>
          prevTasks.filter((task) => task.id !== taskId)
        );

        await loadDashboard();
      } catch (err) {
        logDevError("Task delete error:", err.response?.data || err);
        showAppAlert(getErrorMessage(err, "Tapşırıq silinmədi."));
      }
    },
  });
};

const openTaskComments = async (task) => {
  try {
    setSelectedTaskForComments(task);
    setTaskAttachments([]);
    setSelectedFile(null);
    setAttachmentsError("");

    const response = await api.get(
      `/tasks/${task.id}/comments`
    );

    setTaskComments(response.data);
    await fetchTaskAttachments(task.id);
  } catch (err) {
    logDevError("Comments load error:", err.response?.data || err);
    showAppAlert(getErrorMessage(err, "Şərhlər yüklənmədi."));
  }
};

const openTaskFromNotification = async (taskId) => {
  try {
    const existingTask = tasks.find((task) => task.id === taskId);
    const task =
      existingTask ||
      (await api.get(`/tasks/${taskId}`)).data;

    setPage("tasks");
    await openTaskComments(task);
  } catch (err) {
    logDevError("Notification task open error:", err.response?.data || err);
    showAppAlert(getErrorMessage(err, "Tapşırıq açılmadı."));
  }
};

const handleChangeTaskStatus = async (taskId, newStatus, field = "status") => {
  const previousTask = tasks.find((task) => task.id === taskId);
  const previousStatus =
    selectedTaskForComments?.id === taskId
      ? selectedTaskForComments[field]
      : previousTask?.[field];

  if (!taskId || newStatus === previousStatus) return;

  try {
    setStatusUpdatingId(taskId);

    const payload = { [field]: newStatus };

    const response = await api.put(
      `/tasks/${taskId}`,
      payload
    );

    const updatedTask = response.data;

    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, ...updatedTask } : task
      )
    );

    setSelectedTaskForComments((prevTask) =>
      prevTask && prevTask.id === taskId
        ? { ...prevTask, ...updatedTask }
        : prevTask
    );

    setStatusControlTaskId(null);
    await loadDashboard();
  } catch (err) {
    logDevError("Task status update error:", err.response?.data || err);
    showAppAlert(getErrorMessage(err, "Status dəyişdirilmədi."));

    if (previousStatus) {
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, [field]: previousStatus } : task
        )
      );

      setSelectedTaskForComments((prevTask) =>
        prevTask && prevTask.id === taskId
          ? { ...prevTask, [field]: previousStatus }
          : prevTask
      );
    }
  } finally {
    setStatusUpdatingId(null);
  }
};

const closeTaskComments = () => {
  setSelectedTaskForComments(null);
  setTaskComments([]);
  setNewComment("");
  setTaskAttachments([]);
  setSelectedFile(null);
  setAttachmentsLoading(false);
  setAttachmentUploading(false);
  setAttachmentsError("");
  if (fileInputRef.current) {
    fileInputRef.current.value = "";
  }
};

const addTaskComment = async (e) => {
  e.preventDefault();

  if (!selectedTaskForComments) return;

  if (!newComment.trim()) {
    showAppAlert("Şərh boş ola bilməz.");
    return;
  }

  try {
   const payload = {
  comment: newComment,
};

const response = await api.post(
  `/tasks/${selectedTaskForComments.id}/comments`,
  payload
);
    setTaskComments((prev) => [...prev, response.data]);
    setNewComment("");
  } catch (err) {
    logDevError("Comment create error:", err.response?.data || err);
    showAppAlert(getErrorMessage(err, "Şərh əlavə olunmadı."));
  }
};

const deleteTaskComment = async (commentId) => {
  openDeleteModal({
    title: "Şərhi sil",
    message: "Bu şərh silinəcək.",
    onConfirm: async () => {
      try {
        await api.delete(
          `/tasks/comments/${commentId}`
        );

        setTaskComments((prev) =>
          prev.filter((comment) => comment.id !== commentId)
        );
      } catch (err) {
        logDevError("Comment delete error:", err.response?.data || err);
        showAppAlert(getErrorMessage(err, "Şərh silinmədi."));
      }
    },
  });
};

const getTaskProjectName = (task) => {
  if (!task) return "—";

  return (
    task.project?.name ||
    task.project_name ||
    projects.find((project) => project.id === task.project_id)?.name ||
    "—"
  );
};

const getTaskAssigneeName = (task) => {
  if (!task) return "—";

  return (
    task.assigned_user?.full_name ||
    task.assigned_user?.name ||
    task.assigned_to_user?.full_name ||
    task.assigned_to_user?.name ||
    task.assigned_to?.full_name ||
    task.assigned_to?.name ||
    task.assigned_to_name ||
    task.user?.full_name ||
    task.user?.name ||
    users.find((item) => item.id === (task.assigned_to || task.assigned_to_id))
      ?.full_name ||
    (task.assigned_to === user?.id ? user.full_name : null) ||
    "—"
  );
};

const hasTaskAssignee = (task) => {
  if (!task) return false;

  return Boolean(
    task.assigned_to_id ||
      (typeof task.assigned_to === "number" && task.assigned_to) ||
      task.assigned_user?.id ||
      task.assigned_to_user?.id ||
      task.user?.id ||
      task.assigned_to_name ||
      (getTaskAssigneeName(task) && getTaskAssigneeName(task) !== "—")
  );
};

const resetTaskFilters = () => {
  setTaskSearch("");
  setStatusFilter("");
  setPriorityFilter("");
  setClientFilter("");
  setAssigneeFilter("");
  setDirectionFilter("");
  setTaskTypeFilter("");
  setOperationalStatusFilter("");
  setFrequencyFilter("");
  setRiskStatusFilter("all");
  setReportingRequiredFilter("all");
  setKanbanEnabledFilter("all");
  setDeadlineFilter("all");
  setDeadlineMonthFilter("");
  setShowOverdueOnly(false);
  setShowDueThisWeekOnly(false);
  setShowUnassignedOnly(false);
  setCurrentPage(1);
};

const updateTaskFilter = (setter, value) => {
  setter(value);
  setCurrentPage(1);
};

const resetUserFilters = () => {
  setUserSearch("");
  setRoleFilter("all");
  setUserStatusFilter("all");
  setUserPasswordChangeFilter("all");
};

const resetProjectFilters = () => {
  setProjectSearch("");
  setProjectDirectionFilter("");
  setProjectApproachFilter("");
  setProjectActiveFilter("all");
  setProjectOwnerFilter("");
};


const fetchTaskAttachments = async (taskId) => {
  setAttachmentsLoading(true);
  setAttachmentsError("");

  try {
    const response = await api.get(
      `/tasks/${taskId}/attachments`
    );

    setTaskAttachments(response.data);
  } catch (err) {
    logDevError("Attachments load error:", err.response?.data || err);
    setAttachmentsError("Fayllar yüklənmədi");
  } finally {
    setAttachmentsLoading(false);
  }
};

const handleUploadAttachment = async () => {
  if (attachmentUploading) return;

  if (!selectedFile) {
    showAppAlert("Zəhmət olmasa fayl seçin");
    return;
  }

  if (!selectedTaskForComments) return;

  const formData = new FormData();
  formData.append("file", selectedFile);

  try {
    setAttachmentUploading(true);

    await api.post(
      `/tasks/${selectedTaskForComments.id}/attachments`,
      formData
    );

    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    await fetchTaskAttachments(selectedTaskForComments.id);
  } catch (err) {
    logDevError("Attachment upload error:", err.response?.data || err);
    showAppAlert(getErrorMessage(err, "Fayl yüklənmədi."));
  } finally {
    setAttachmentUploading(false);
  }
};

const handleDeleteAttachment = async (attachmentId) => {
  openDeleteModal({
    title: "Faylı sil",
    message: "Bu fayl silinəcək.",
    onConfirm: async () => {
      if (!selectedTaskForComments) return;

      try {
        await api.delete(
          `/attachments/${attachmentId}`
        );

        await fetchTaskAttachments(selectedTaskForComments.id);
      } catch (err) {
        logDevError("Attachment delete error:", err.response?.data || err);
        showAppAlert(getErrorMessage(err, "Fayl silinmədi."));
      }
    },
  });
};

const handleDownloadAttachment = async (attachment) => {
  try {
    const response = await api.get(
      `/attachments/${attachment.id}/download`,
      {
        responseType: "blob",
      }
    );

    const fileUrl = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = getAttachmentFileName(attachment);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(fileUrl);
  } catch (err) {
    logDevError("Attachment download error:", err.response?.data || err);
    showAppAlert(getErrorMessage(err, "Fayl yüklənmədi."));
  }
};

const resetProjectForm = () => {
  setProjectForm({
    code: "",
    name: "",
    direction_program: "",
    owner: "",
    approach: "",
    description: "",
    is_active: true,
  });
  setEditingProjectId(null);
  setShowProjectForm(false);
  setProjectFormErrors({});
};

const startEditProject = (project) => {
  setEditingProjectId(project.id);
  setProjectFormErrors({});
  setProjectForm({
    code: project.code || "",
    name: project.name || "",
    direction_program: project.direction_program || "",
    owner: project.owner || "",
    approach: project.approach || "",
    description: project.description || "",
    is_active: project.is_active !== false,
  });
  setShowProjectForm(true);
};

const saveProject = async (event) => {
  event.preventDefault();

  if (!validateProjectForm()) return;

  const payload = {
    code: projectForm.code.trim() || null,
    name: projectForm.name.trim(),
    direction_program: projectForm.direction_program.trim() || null,
    owner: projectForm.owner.trim() || null,
    approach: projectForm.approach.trim() || null,
    description: projectForm.description.trim() || null,
    is_active: projectForm.is_active,
  };

  try {
    const wasEditingProject = Boolean(editingProjectId);

    if (wasEditingProject) {
      await api.put(`/projects/${editingProjectId}`, payload);
    } else {
      await api.post(`/projects/`, payload);
    }

    resetProjectForm();
    await Promise.all([loadProjects(), loadTasks()]);
    showAppAlert(
      wasEditingProject
        ? "Layihə uğurla yeniləndi."
        : "Layihə uğurla əlavə edildi.",
      { variant: "success" }
    );
  } catch (err) {
    logDevError("Project error:", err.response?.data || err);
    showAppAlert(getErrorMessage(err, "Layihə yadda saxlanmadı."));
  }
};

const deleteProject = (project) => {
  openDeleteModal({
    title: "Layihəni sil",
    message: `"${project.name}" layihəsi silinəcək.`,
    onConfirm: async () => {
      try {
        await api.delete(`/projects/${project.id}`);
        setProjects((currentProjects) =>
          currentProjects.filter((item) => item.id !== project.id)
        );
      } catch (err) {
        logDevError("Project delete error:", err.response?.data || err);
        showAppAlert(getErrorMessage(err, "Layihə silinmədi."));
      }
    },
  });
};

const resetStageForm = () => {
  setStageForm({
    name: "",
    weight_percent: "",
    planned_start: "",
    planned_end: "",
    actual_end: "",
    status: "",
    delay_reason: "",
    completion_percent: "",
  });
  setEditingStageId(null);
  setShowStageForm(false);
  setStageFormErrors({});
};

const startEditStage = (stage) => {
  setEditingStageId(stage.id);
  setStageFormErrors({});
  setStageForm({
    name: normalizeProjectStageName(stage.name),
    weight_percent: stage.weight_percent ?? "",
    planned_start: stage.planned_start || "",
    planned_end: stage.planned_end || "",
    actual_end: stage.actual_end || "",
    status: normalizeProjectStageStatus(stage.status),
    delay_reason: stage.delay_reason || "",
    completion_percent: stage.completion_percent ?? "",
  });
  setShowStageForm(true);
};

const saveProjectStage = async (event) => {
  event.preventDefault();

  if (!stageForm.name.trim()) {
    setStageFormErrors({ name: "Mərhələ adı boş ola bilməz" });
    return;
  }

  const payload = {
    project_id: selectedProject.id,
    name: stageForm.name.trim(),
    weight_percent:
      stageForm.weight_percent === "" ? null : Number(stageForm.weight_percent),
    planned_start: stageForm.planned_start || null,
    planned_end: stageForm.planned_end || null,
    actual_end: stageForm.actual_end || null,
    status: normalizeProjectStageStatus(stageForm.status) || null,
    delay_reason: stageForm.delay_reason.trim() || null,
    completion_percent:
      stageForm.completion_percent === ""
        ? null
        : Number(stageForm.completion_percent),
    sort_order: getProjectStageSortOrder(stageForm.name),
  };

  try {
    const wasEditingStage = Boolean(editingStageId);

    if (wasEditingStage) {
      await api.put(`/project-stages/${editingStageId}`, payload);
    } else {
      await api.post(`/project-stages/`, payload);
    }
    resetStageForm();
    await loadProjectStages(selectedProject.id);
    showAppAlert(
      wasEditingStage
        ? "Mərhələ uğurla yeniləndi."
        : "Mərhələ uğurla əlavə edildi.",
      { variant: "success" }
    );
  } catch (err) {
    logDevError("Project stage error:", err.response?.data || err);
    showAppAlert(getErrorMessage(err, "Mərhələ yadda saxlanmadı."));
  }
};

const deleteProjectStage = (stage) => {
  openDeleteModal({
    title: "Mərhələni sil",
    message: `"${stage.name}" mərhələsi silinəcək.`,
    onConfirm: async () => {
      try {
        await api.delete(`/project-stages/${stage.id}`);
        setProjectStages((currentStages) =>
          currentStages.filter((item) => item.id !== stage.id)
        );
      } catch (err) {
        logDevError("Project stage delete error:", err.response?.data || err);
        showAppAlert(getErrorMessage(err, "Mərhələ silinmədi."));
      }
    },
  });
};



const resetUserForm = () => {
  setUserForm({
    full_name: "",
    email: "",
    password: "",
    role_id: 3,
    is_active: true,
  });

  setEditingUserId(null);
  setShowUserForm(false);
  setUserFormErrors({});
};

const saveUser = async (e) => {
  e.preventDefault();

  if (!validateUserForm()) {
    return;
  }

  try {
    const payload = {
      full_name: userForm.full_name,
      email: userForm.email,
      role_id: Number(userForm.role_id),
      is_active: userForm.is_active,
    };

    // Yeni istifadəçi yaradanda password mütləq göndərilir.
    // Redaktədə password boşdursa göndərmirik, yəni dəyişmir.
    if (!editingUserId || userForm.password.trim() !== "") {
      payload.password = userForm.password;
    }

    // Manager admin və ya manager yaratmasın, yalnız employee yaratsın.
    if (user.role_id === 2) {
      payload.role_id = 3;
    }

    const wasEditingUser = Boolean(editingUserId);

    if (wasEditingUser) {
      const response = await api.put(
        `/users/${editingUserId}`,
        payload
      );

      setUsers((prevUsers) =>
        prevUsers.map((item) =>
          item.id === editingUserId ? response.data : item
        )
      );
    } else {
      const response = await api.post(
        `/users/`,
        payload
      );

      setUsers((prevUsers) => [...prevUsers, response.data]);
    }

    resetUserForm();
    await loadUsers();
    await loadDashboard();
    showAppAlert(
      wasEditingUser
        ? "İstifadəçi uğurla yeniləndi."
        : "İstifadəçi uğurla əlavə edildi.",
      { variant: "success" }
    );
  } catch (err) {
    logDevError("User error:", err.response?.data || err);
    showAppAlert(getErrorMessage(err, "İstifadəçi yadda saxlanmadı."));
  }
};

const startEditUser = (item) => {
  setEditingUserId(item.id);
  setUserFormErrors({});

  setUserForm({
    full_name: item.full_name || "",
    email: item.email || "",
    password: "",
    role_id: item.role_id || 3,
    is_active: item.is_active,
  });

  setShowUserForm(true);
};

const toggleUserActive = async (item) => {
  if (item.id === user.id) {
    showAppAlert("Öz hesabını deaktiv edə bilməzsən.");
    return;
  }

  const newStatus = !item.is_active;

  const confirmChange = await showAppConfirm(
    newStatus
      ? "Bu istifadəçi aktiv ediləcək."
      : "Bu istifadəçi deaktiv ediləcək."
  );

  if (!confirmChange) {
    return;
  }

  try {
    const payload = {
      full_name: item.full_name,
      email: item.email,
      role_id: item.role_id,
      is_active: newStatus,
    };

    const response = await api.put(
      `/users/${item.id}`,
      payload
    );

    setUsers((prevUsers) =>
      prevUsers.map((u) => (u.id === item.id ? response.data : u))
    );

    await loadDashboard();
  } catch (err) {
    logDevError("User active/deactive error:", err.response?.data || err);

    showAppAlert(getErrorMessage(err, "İstifadəçi statusu dəyişmədi."));
  }
};

const resetUserPassword = async (item) => {
  if (item.id === user.id) {
    showAppAlert("Öz hesabınız üçün bu əməliyyatı istifadə edə bilməzsiniz.");
    return;
  }

  const confirmed = await showAppConfirm(
    "Bu istifadəçi aktiv ediləcək və yeni müvəqqəti şifrə yaradılacaq.",
    {
      title: "Şifrə sıfırlansın?",
      confirmText: "Şifrə yarat",
    }
  );

  if (!confirmed) {
    return;
  }

  setResetUserPasswordLoadingId(item.id);
  try {
    const response = await api.post(`/users/${item.id}/reset-password`);
    const updatedUser = response.data.user;

    if (updatedUser) {
      setUsers((prevUsers) =>
        prevUsers.map((currentItem) =>
          currentItem.id === updatedUser.id ? updatedUser : currentItem
        )
      );
    }

    setResetUserPasswordResult({
      user: updatedUser || item,
      temporaryPassword: response.data.temporary_password,
    });
    await loadUsers();
  } catch (err) {
    showAppAlert(getErrorMessage(err, "Müvəqqəti şifrə yaradıla bilmədi."));
  } finally {
    setResetUserPasswordLoadingId(null);
  }
};

  useEffect(() => {
    const handleAuthLogout = () => {
      resetSession();
      setAuthChecking(false);
      setError("Sessiyanız bitib. Zəhmət olmasa yenidən daxil olun.");
    };

    window.addEventListener("auth:logout", handleAuthLogout);

    return () => {
      window.removeEventListener("auth:logout", handleAuthLogout);
    };
  }, []);

  useEffect(() => {
    const token = getToken();

    if (!token) {
      return;
    }

    queueMicrotask(() => {
      loadDashboard()
        .catch(() => {
          localStorage.removeItem("token");
          setUser(null);
          setStats(null);
        })
        .finally(() => {
          setAuthChecking(false);
        });
    });
    // This intentionally runs once to restore an existing login token on app start.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const response = await api.post(`/auth/login`, formData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      localStorage.setItem("token", response.data.access_token);
      if (response.data.user?.must_change_password) {
        setUser(response.data.user);
        setForcePasswordChange(true);
        replaceAppPath("/change-password");
        setPage("change-password");
      } else {
        await loadDashboard();
        replaceAppPath("/");
        setPage("dashboard");
      }
    } catch (err) {
      setError(getErrorMessage(err, "Email və ya password yanlışdır."));
    } finally {
      setLoading(false);
    }
  };

  const getTaskOperationalStatus = (task) => task.operational_status || "new";
  const getEffectiveTaskDeadline = (task) =>
    task.current_deadline || task.deadline || task.initial_deadline || null;
  const taskDirectionValues = [...new Set(
    tasks.map((task) => task.category || task.direction_program).filter(Boolean)
  )].sort((first, second) => first.localeCompare(second, "az"));
  const taskAssigneeFilterOptions = tasks.reduce((options, task) => {
    const assigneeId =
      task.assigned_user?.id || task.assigned_to_user?.id || task.assigned_to_id || task.assigned_to;
    const assigneeName = getTaskAssigneeName(task);

    if (!assigneeId || assigneeName === "—") return options;
    if (!options.some((item) => String(item.id) === String(assigneeId))) {
      options.push({ id: assigneeId, full_name: assigneeName });
    }
    return options;
  }, []);

  const filteredTasks = tasks.filter((task) => {
    const searchValue = taskSearch.trim().toLowerCase();

    const matchesSearch =
      !searchValue ||
      [
        task.title,
        task.external_id,
        task.description,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchValue));

    const matchesStatus = !statusFilter || task.status === statusFilter;
    const matchesOperationalStatus =
      !operationalStatusFilter ||
      getTaskOperationalStatus(task) === operationalStatusFilter;
    const matchesPriority = !priorityFilter || task.priority === priorityFilter;
    const matchesAssignee =
      !assigneeFilter ||
      String(task.assigned_to || "") === String(assigneeFilter) ||
      String(task.assigned_to_id || "") === String(assigneeFilter) ||
      String(task.assigned_user?.id || "") === String(assigneeFilter) ||
      String(task.assigned_to_user?.id || "") === String(assigneeFilter);
    const matchesDirection =
      !directionFilter || (task.category || task.direction_program) === directionFilter;
    const matchesTaskType = !taskTypeFilter || task.task_type === taskTypeFilter;
    const matchesFrequency = !frequencyFilter || task.frequency === frequencyFilter;
    const matchesRisk =
      riskStatusFilter === "all" ||
      (riskStatusFilter === "unassigned"
        ? !task.risk_status
        : task.risk_status === riskStatusFilter);
    const matchesReporting =
      reportingRequiredFilter === "all" ||
      (reportingRequiredFilter === "unassigned"
        ? task.reporting_required == null
        : String(task.reporting_required) === reportingRequiredFilter);
    const matchesKanban =
      page === "kanban" ||
      kanbanEnabledFilter === "all" ||
      String(task.kanban_enabled !== false) === kanbanEnabledFilter;
    const effectiveDeadline = getEffectiveTaskDeadline(task);
    const deadlineDate = effectiveDeadline ? new Date(effectiveDeadline) : null;
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + 7);
    const matchesDeadline =
      deadlineFilter === "all" ||
      (deadlineFilter === "overdue" &&
        (getTaskOperationalStatus(task) === "overdue" ||
          (deadlineDate && deadlineDate < now && !isTaskCompleted(task)))) ||
      (deadlineFilter === "this_week" &&
        deadlineDate && deadlineDate >= now && deadlineDate <= weekEnd) ||
      (deadlineFilter === "this_month" &&
        deadlineDate &&
        deadlineDate.getFullYear() === now.getFullYear() &&
        deadlineDate.getMonth() === now.getMonth()) ||
      (deadlineFilter === "without_deadline" && !effectiveDeadline);
    const matchesDeadlineMonth =
      !deadlineMonthFilter ||
      (effectiveDeadline &&
        deadlineDate.getFullYear() === parseInt(deadlineMonthFilter.split("-")[0]) &&
        deadlineDate.getMonth() === parseInt(deadlineMonthFilter.split("-")[1]) - 1);
    const matchesOverdue = !showOverdueOnly || isTaskOverdue(task);
    const matchesDueThisWeek = !showDueThisWeekOnly || isTaskDueThisWeek(task);
    const matchesUnassigned = !showUnassignedOnly || !hasTaskAssignee(task);

    return (
      matchesSearch &&
      matchesStatus &&
      matchesOperationalStatus &&
      matchesPriority &&
      matchesAssignee &&
      matchesDirection &&
      matchesTaskType &&
      matchesFrequency &&
      matchesRisk &&
      matchesReporting &&
      matchesKanban &&
      matchesDeadline &&
      matchesDeadlineMonth &&
      matchesOverdue &&
      matchesDueThisWeek &&
      matchesUnassigned
    );
  });

  const totalTaskPages = Math.max(1, Math.ceil(filteredTasks.length / TASKS_PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalTaskPages);
  const paginatedTasks = filteredTasks.slice(
    (safeCurrentPage - 1) * TASKS_PAGE_SIZE,
    safeCurrentPage * TASKS_PAGE_SIZE
  );

  const activeAdvancedTaskFilterCount = [
    Boolean(directionFilter),
    Boolean(taskTypeFilter),
    Boolean(priorityFilter),
    kanbanEnabledFilter !== "all",
    deadlineFilter !== "all",
  ].filter(Boolean).length;

  const openTasksView = async ({
    status = "",
    operationalStatus = "",
    priority = "",
    assignee = "",
    direction = "",
    taskType = "",
    deadlineMonth = "",
    overdue = false,
    dueThisWeek = false,
    unassigned = false,
  } = {}) => {
    setTaskSearch("");
    setStatusFilter(status);
    setOperationalStatusFilter(operationalStatus);
    setPriorityFilter(priority);
    setAssigneeFilter(assignee);
    setDirectionFilter(direction);
    setTaskTypeFilter(taskType);
    setDeadlineMonthFilter(deadlineMonth);
    setShowOverdueOnly(overdue);
    setShowDueThisWeekOnly(dueThisWeek);
    setShowUnassignedOnly(unassigned);
    setPage("tasks");

    await loadTasks();

    if (isAdminOrManager()) {
      await Promise.all([loadProjects(), loadUsers()]);
    }
  };

  const openProjectsView = async ({ search = "" } = {}) => {
    setProjectSearch(search);
    setSelectedProject(null);
    setProjectStages([]);
    resetStageForm();
    setPage("projects");
    await Promise.all([loadProjects(), loadTasks()]);
  };

  const openProjectDetails = async (project) => {
    resetStageForm();
    setSelectedProject(project);
    await Promise.all([loadTasks(), loadProjectStages(project.id)]);
  };

  const closeProjectDetails = () => {
    resetStageForm();
    setProjectStages([]);
    setSelectedProject(null);
  };

  const openUsersView = async () => {
    setPage("users");
    await loadUsers();
  };

  const openNewTaskFromDashboard = async () => {
    resetTaskForm();
    setShowTaskForm(true);
    setPage("tasks");
    await Promise.all([loadProjects(), loadUsers()]);
  };

  const logout = () => {
    resetSession();
    setEmail("");
    setPassword("");
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordChangeError("");

    if (!passwordChangeCurrent.trim()) {
      setPasswordChangeError("Cari şifrə boş ola bilməz.");
      return;
    }
    if (!passwordChangeNew.trim()) {
      setPasswordChangeError("Yeni şifrə boş ola bilməz.");
      return;
    }
    if (passwordChangeNew.length < 8) {
      setPasswordChangeError("Şifrə minimum 8 simvol olmalıdır.");
      return;
    }
    if (passwordChangeCurrent === passwordChangeNew) {
      setPasswordChangeError("Yeni şifrə cari şifrədən fərqli olmalıdır.");
      return;
    }
    if (passwordChangeNew !== passwordChangeConfirm) {
      setPasswordChangeError("Şifrələr uyğun gəlmir.");
      return;
    }

    setPasswordChanging(true);
    try {
      await api.post("/auth/change-password", {
        current_password: passwordChangeCurrent,
        new_password: passwordChangeNew,
      });
      setPasswordChangeCurrent("");
      setPasswordChangeNew("");
      setPasswordChangeConfirm("");
      setForcePasswordChange(false);
      setUser((prev) => (prev ? { ...prev, must_change_password: false } : prev));
      replaceAppPath("/");
      setPage("dashboard");
      await loadDashboard();
    } catch (err) {
      setPasswordChangeError(getErrorMessage(err, "Şifrə yenilənə bilmədi."));
    } finally {
      setPasswordChanging(false);
    }
  };

  if (authChecking) {
    return (
      <div className="login-page">
        <div className="login-card auth-loading-card">
          <div className="login-brand">
            <span className="login-brand-logo brand-mark" aria-hidden="true">TM</span>
            <div>
              <h1>Task Manager</h1>
              <span>Tapşırıq idarəetmə sistemi</span>
            </div>
          </div>
          <p>Giriş məlumatları yoxlanılır...</p>
        </div>
      </div>
    );
  }

  if (user) {
    if (user.must_change_password || forcePasswordChange) {
      return (
        <div className="login-page">
          <form className="login-card" onSubmit={handleChangePassword}>
            <div className="login-brand">
              <span className="login-brand-logo brand-mark" aria-hidden="true">TM</span>
              <div>
                <h1>Task Manager</h1>
                <span>Tapşırıq idarəetmə sistemi</span>
              </div>
            </div>
            <p style={{ marginBottom: 10, fontSize: 16, color: "#475569", fontWeight: 500 }}>
              Şifrəni dəyişin
            </p>
            <p style={{ marginBottom: 24, fontSize: 13, color: "#94a3b8" }}>
              İlk giriş üçün yeni şifrə təyin etməlisiniz.
            </p>

            {passwordChangeError && <div className="error">{passwordChangeError}</div>}

            <label>Cari şifrə</label>
            <input
              type="password"
              placeholder="Cari şifrəni daxil edin"
              autoComplete="current-password"
              value={passwordChangeCurrent}
              onChange={(e) => setPasswordChangeCurrent(e.target.value)}
            />

            <label>Yeni şifrə</label>
            <input
              type="password"
              placeholder="Yeni şifrə daxil edin"
              autoComplete="new-password"
              value={passwordChangeNew}
              onChange={(e) => setPasswordChangeNew(e.target.value)}
            />

            <label>Yeni şifrəni təkrar daxil edin</label>
            <input
              type="password"
              placeholder="Yeni şifrəni təkrar daxil edin"
              autoComplete="new-password"
              value={passwordChangeConfirm}
              onChange={(e) => setPasswordChangeConfirm(e.target.value)}
            />

            <button type="submit" disabled={passwordChanging}>
              {passwordChanging ? "Yenilənir..." : "Şifrəni yenilə"}
            </button>

            <button
              type="button"
              className="login-secondary-btn"
              onClick={logout}
            >
              Çıxış et
            </button>
          </form>
        </div>
      );
    }

    return (
      <div className="app-layout">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <span className="sidebar-brand-mark" aria-hidden="true">TM</span>
            <div>
              <h2>Task Manager</h2>
              <span>Tapşırıq idarəetmə sistemi</span>
            </div>
          </div>

          <nav className="sidebar-nav" aria-label="Əsas naviqasiya">
            <span className="sidebar-group-label">ÜMUMİ</span>
            <button
              className={page === "dashboard" ? "nav-btn active" : "nav-btn"}
              onClick={() => setPage("dashboard")}
            >
              <SidebarIcon name="dashboard" />
              İdarə paneli
            </button>

            <button
              className={page === "tasks" ? "nav-btn active" : "nav-btn"}
              onClick={() => {
                resetTaskFilters();
                setPage("tasks");
                loadTasks();

  if (isAdminOrManager()) {
    loadProjects();
    loadUsers();
  }
}}
            >
              <SidebarIcon name="tasks" />
              Tapşırıqlar
            </button>

            <button
              className={page === "kanban" ? "nav-btn active" : "nav-btn"}
              onClick={() => {
                resetTaskFilters();
                setPage("kanban");
                loadTasks();

  if (isAdminOrManager()) {
    loadProjects();
    loadUsers();
  }
}}
            >
              <SidebarIcon name="kanban" />
              Kanban
            </button>

            <button
              className={page === "ai_assistant" ? "nav-btn active" : "nav-btn"}
              onClick={() => setPage("ai_assistant")}
            >
              <SidebarIcon name="ai" />
              AI köməkçi
            </button>

            <button
              className={page === "notifications" ? "nav-btn active" : "nav-btn"}
              onClick={() => {
                setPage("notifications");
                loadUnreadNotifications();
              }}
            >
              <SidebarIcon name="notifications" />
              <span className="notification-nav-label">
                Bildirişlər
                {unreadNotifications > 0 && (
                  <span className="notification-nav-badge">
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </span>
                )}
              </span>
            </button>

            {isAdminOrManager() && (
              <>
                <span className="sidebar-group-label">İDARƏETMƏ</span>
                <button
                  className={page === "excel_preview" ? "nav-btn active" : "nav-btn"}
                  onClick={() => setPage("excel_preview")}
                >
                  <SidebarIcon name="excel" />
                  Excel baxış
                </button>

                <button
                  className={page === "users" ? "nav-btn active" : "nav-btn"}
                  onClick={() => {
                    setPage("users");
                    loadUsers();
                  }}
                >
                  <SidebarIcon name="users" />
                  İstifadəçilər
                </button>

                <button
                  className={page === "logs" ? "nav-btn active" : "nav-btn"}
                  onClick={() => {
                    setPage("logs");
                    loadLogs();
                  }}
                >
                  <SidebarIcon name="logs" />
                  Əməliyyat tarixçəsi
                </button>
              </>
            )}
          </nav>

          <div className="sidebar-footer">
            <button className="logout-btn" onClick={logout}>
              <SidebarIcon name="logout" />
              Çıxış et
            </button>
          </div>
        </aside>

        <main
          className={`main-content${
            page === "kanban"
              ? " kanban-main-content"
              : page === "tasks"
              ? " tasks-main-content"
              : page === "projects"
              ? " projects-main-content"
              : page === "excel_preview"
              ? " excel-main-content"
              : page === "users"
              ? " users-main-content"
              : page === "logs"
              ? " logs-main-content"
              : page === "notifications"
              ? " notifications-main-content"
              : ""
          }`}
        >
          <header className="topbar">
            <div className="topbar-inner">
            <div className="topbar-intro">
              <span className="topbar-kicker">İdarəetmə sahəsi</span>
              <div className="topbar-title-row">
                <h1 className="topbar-title">
                  {page === "dashboard" && "İdarə paneli"}
                  {page === "tasks" && "Tapşırıqlar"}
                  {page === "kanban" && "Kanban"}
                  {page === "ai_assistant" && "AI köməkçi"}
                  {page === "notifications" && "Bildirişlər"}
                  {page === "excel_preview" && "Excel importu"}
                  {page === "users" && "İstifadəçilər"}
                  {page === "logs" && "Əməliyyat tarixçəsi"}
                </h1>
                {page === "dashboard" && (
                  <div className="dashboard-summary-pill topbar-summary-pill">
                    {tasks.length > 0 ? tasks.length : stats?.total_tasks || 0} task ·{" "}
                    {tasks.filter((t) => (t.operational_status || "new") === "active").length} icrada ·{" "}
                    {tasks.length > 0
                      ? tasks.filter(
                          (t) => isTaskOverdue(t)
                        ).length
                      : stats?.overdue_tasks || 0}{" "}
                    gecikir
                  </div>
                )}
              </div>
            </div>

            <div className="topbar-side">
              {page === "dashboard" && (
                <div className="topbar-quick-actions" aria-label="Dashboard sürətli əməliyyatlar">
                  {isAdminOrManager() && (
                    <>
                      <button
                        type="button"
                        className="quick-action-btn primary"
                        onClick={() => void openNewTaskFromDashboard()}
                      >
                        + Yeni tapşırıq
                      </button>
                      <input
                        ref={excelImportInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        className="visually-hidden-file"
                        onChange={importTasksExcel}
                      />
                    </>
                  )}
                  <button
                    type="button"
                    className="quick-action-btn export"
                    onClick={downloadTasksExcel}
                    disabled={excelExporting || excelImporting}
                  >
                    Hesabat ixracı
                  </button>
                </div>
              )}

              {page === "dashboard" && isAdminOrManager() && (
                <div className="topbar-mini-stats" aria-label="Dashboard qisa göstəricilər">
                  <button
                    type="button"
                    className="mini-stat-card"
                    onClick={() => void openUsersView()}
                  >
                    <span className="mini-stat-icon">◎</span>
                    <span className="mini-stat-content">
                      <span className="mini-stat-label">İstifadəçilər</span>
                      <strong className="mini-stat-value">{users.length > 0 ? users.length : stats?.total_users || 0}</strong>
                    </span>
                  </button>
                </div>
              )}

              <div className="profile-box">
                <div className="profile-avatar" aria-hidden="true">
                  {(user.full_name || user.email || "U").charAt(0).toUpperCase()}
                </div>
                <div className="profile-info">
                  <strong>{user.full_name || user.email || "İstifadəçi"}</strong>
                  <span>
                    {getUserRoleLabel(user)} · {user.email}
                  </span>
                </div>
              </div>
            </div>
            </div>
          </header>

          {page === "dashboard" && (
            <DashboardPage
              tasks={tasks}
              projects={projects}
              users={users}
              stats={stats}
              isAdmin={isAdminOrManager()}
              onOpenTasksView={openTasksView}
              onOpenProjectsView={openProjectsView}
              onOpenUsersView={openUsersView}
              onNewTask={openNewTaskFromDashboard}
              onTaskComments={openTaskComments}
              getTaskAssigneeName={getTaskAssigneeName}
              getTaskOperationalStatus={getTaskOperationalStatus}
              getEffectiveTaskDeadline={getEffectiveTaskDeadline}
              hasTaskAssignee={hasTaskAssignee}
              excelImportInputRef={excelImportInputRef}
              excelExporting={excelExporting}
              excelImporting={excelImporting}
              onImportExcel={importTasksExcel}
              onExportExcel={downloadTasksExcel}
            />
          )}

          {page === "ai_assistant" && (
            <AIAssistantPage
              loadDashboard={loadDashboard}
              loadUsers={loadUsers}
              isAdminOrManager={isAdminOrManager}
            />
          )}

          {page === "notifications" && (
            <div className="section-card">
              <NotificationsPage
                onUnreadCountChange={setUnreadNotifications}
                onOpenTask={openTaskFromNotification}
                showAppAlert={showAppAlert}
              />
            </div>
          )}

          {page === "kanban" && (
            <KanbanPage
              taskSearch={taskSearch}
              setTaskSearch={setTaskSearch}
              operationalStatusFilter={operationalStatusFilter}
              setOperationalStatusFilter={setOperationalStatusFilter}
              assigneeFilter={assigneeFilter}
              setAssigneeFilter={setAssigneeFilter}
              taskAssigneeFilterOptions={taskAssigneeFilterOptions}
              taskStatusOptions={taskStatusOptions}
              showAdvancedTaskFilters={showAdvancedTaskFilters}
              setShowAdvancedTaskFilters={setShowAdvancedTaskFilters}
              resetTaskFilters={resetTaskFilters}
              updateTaskFilter={updateTaskFilter}
              directionFilter={directionFilter}
              setDirectionFilter={setDirectionFilter}
              taskDirectionValues={taskDirectionValues}
              taskTypeFilter={taskTypeFilter}
              setTaskTypeFilter={setTaskTypeFilter}
              taskTypeOptions={effectiveTaskTypeOptions}
              priorityFilter={priorityFilter}
              setPriorityFilter={setPriorityFilter}
              priorityOptions={effectivePriorityOptions}
              frequencyFilter={frequencyFilter}
              setFrequencyFilter={setFrequencyFilter}
              frequencyOptions={effectiveFrequencyOptions}
              riskStatusFilter={riskStatusFilter}
              setRiskStatusFilter={setRiskStatusFilter}
              riskFilterOptions={effectiveRiskFilterOptions}
              reportingRequiredFilter={reportingRequiredFilter}
              setReportingRequiredFilter={setReportingRequiredFilter}
              kanbanEnabledFilter={kanbanEnabledFilter}
              setKanbanEnabledFilter={setKanbanEnabledFilter}
              deadlineFilter={deadlineFilter}
              setDeadlineFilter={setDeadlineFilter}
              tasks={tasks}
              filteredTasks={filteredTasks}
              statusUpdatingId={statusUpdatingId}
              isAdmin={isAdminOrManager()}
              getTaskOperationalStatus={getTaskOperationalStatus}
              handleChangeTaskStatus={handleChangeTaskStatus}
              openTaskComments={openTaskComments}
              canManageTask={canManageTask}
              getTaskAssigneeName={getTaskAssigneeName}
              selectedTaskForComments={selectedTaskForComments}
              closeTaskComments={closeTaskComments}
              taskComments={taskComments}
              newComment={newComment}
              setNewComment={setNewComment}
              addTaskComment={addTaskComment}
              deleteTaskComment={deleteTaskComment}
              users={users}
              taskAttachments={taskAttachments}
              attachmentsLoading={attachmentsLoading}
              attachmentsError={attachmentsError}
              attachmentUploading={attachmentUploading}
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              fileInputRef={fileInputRef}
              handleUploadAttachment={handleUploadAttachment}
              handleDeleteAttachment={handleDeleteAttachment}
              handleDownloadAttachment={handleDownloadAttachment}
            />
          )}

          {page === "tasks" && (
            <TasksPage
              user={user}
              isAdminOrManager={isAdminOrManager}
              canManageTask={canManageTask}
              tasks={tasks}
              users={users}
              projects={projects}
              directionPrograms={directionPrograms}
              taskSearch={taskSearch}
              setTaskSearch={setTaskSearch}
              operationalStatusFilter={operationalStatusFilter}
              setOperationalStatusFilter={setOperationalStatusFilter}
              assigneeFilter={assigneeFilter}
              setAssigneeFilter={setAssigneeFilter}
              showAdvancedTaskFilters={showAdvancedTaskFilters}
              setShowAdvancedTaskFilters={setShowAdvancedTaskFilters}
              directionFilter={directionFilter}
              setDirectionFilter={setDirectionFilter}
              taskTypeFilter={taskTypeFilter}
              setTaskTypeFilter={setTaskTypeFilter}
              priorityFilter={priorityFilter}
              setPriorityFilter={setPriorityFilter}
              frequencyFilter={frequencyFilter}
              setFrequencyFilter={setFrequencyFilter}
              riskStatusFilter={riskStatusFilter}
              setRiskStatusFilter={setRiskStatusFilter}
              reportingRequiredFilter={reportingRequiredFilter}
              setReportingRequiredFilter={setReportingRequiredFilter}
              kanbanEnabledFilter={kanbanEnabledFilter}
              setKanbanEnabledFilter={setKanbanEnabledFilter}
              deadlineFilter={deadlineFilter}
              setDeadlineFilter={setDeadlineFilter}
              taskAssigneeFilterOptions={taskAssigneeFilterOptions}
              activeAdvancedTaskFilterCount={activeAdvancedTaskFilterCount}
              taskDirectionValues={taskDirectionValues}
              filteredTasks={filteredTasks}
              totalTaskPages={totalTaskPages}
              safeCurrentPage={safeCurrentPage}
              paginatedTasks={paginatedTasks}
              updateTaskFilter={updateTaskFilter}
              resetTaskFilters={resetTaskFilters}
              showTaskForm={showTaskForm}
              setShowTaskForm={setShowTaskForm}
              editingTaskId={editingTaskId}
              setEditingTaskId={setEditingTaskId}
              newTask={newTask}
              setNewTask={setNewTask}
              taskFormErrors={taskFormErrors}
              statusControlTaskId={statusControlTaskId}
              setStatusControlTaskId={setStatusControlTaskId}
              statusUpdatingId={statusUpdatingId}
              saveTask={saveTask}
              resetTaskForm={resetTaskForm}
              startEditTask={startEditTask}
              deleteTask={deleteTask}
              handleChangeTaskStatus={handleChangeTaskStatus}
              selectedTaskForComments={selectedTaskForComments}
              taskComments={taskComments}
              newComment={newComment}
              setNewComment={setNewComment}
              taskAttachments={taskAttachments}
              attachmentsLoading={attachmentsLoading}
              attachmentsError={attachmentsError}
              attachmentUploading={attachmentUploading}
              selectedFile={selectedFile}
              setSelectedFile={setSelectedFile}
              fileInputRef={fileInputRef}
              openTaskComments={openTaskComments}
              closeTaskComments={closeTaskComments}
              addTaskComment={addTaskComment}
              deleteTaskComment={deleteTaskComment}
              handleUploadAttachment={handleUploadAttachment}
              handleDeleteAttachment={handleDeleteAttachment}
              handleDownloadAttachment={handleDownloadAttachment}
              getTaskAssigneeName={getTaskAssigneeName}
              getTaskProjectName={getTaskProjectName}
              ActionIcon={ActionIcon}
              effectiveTaskTypeOptions={effectiveTaskTypeOptions}
              effectivePriorityOptions={effectivePriorityOptions}
              effectiveFrequencyOptions={effectiveFrequencyOptions}
              effectiveRiskFilterOptions={effectiveRiskFilterOptions}
              effectiveRiskStatusOptionsForm={effectiveRiskStatusOptionsForm}
              excelExporting={excelExporting}
              excelImporting={excelImporting}
              downloadTasksExcel={downloadTasksExcel}
              openExcelImportPicker={openExcelImportPicker}
              importTasksExcel={importTasksExcel}
              excelImportInputRef={excelImportInputRef}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              loadUsers={loadUsers}
            />
          )}

          {page === "excel_preview" && isAdminOrManager() && (
            <div className="excel-page">
              {/* ── Main white content card ── */}
              <div className="excel-main-card">
                {/* ── Upload panel ── */}
                <div className="excel-upload-panel">
                  <div className="excel-upload-left">
                    <div className="excel-file-icon">
                      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                        <path d="M14 2v6h6" fill="none" stroke="#fff" strokeWidth="2"/>
                        <path d="M8 13l2.5 3-2.5 3" fill="none" stroke="#2e7d32" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M13 19h3" fill="none" stroke="#2e7d32" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div className="excel-upload-info">
                      <h3>Excel faylını seçin</h3>
                      <p>Tapşırıqları Excel faylından sistemə əlavə edin.</p>
                    </div>
                  </div>
                  <div className="excel-upload-actions">
                    <label className="excel-browse-btn">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      Gözdən keçirin
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        ref={globalFileInputRef}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setGlobalFile(file);
                            setGlobalFileName(file.name);
                            setGlobalPreview(null);
                            setGlobalImportResult(null);
                          }
                        }}
                      />
                    </label>
                    {globalFileName && (
                      <span className="excel-file-name-tag">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                        {globalFileName}
                      </span>
                    )}
                    <button
                      type="button"
                      className="excel-analyze-btn"
                      onClick={() => void loadGlobalPreview()}
                      disabled={globalPreviewLoading || !globalFile}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="16 16 12 12 16 8"/>
                        <line x1="12" y1="12" x2="21" y2="12"/>
                        <path d="M20.39 18.39A10 10 0 0 1 4 12a10 10 0 0 1 16.39-6.39"/>
                      </svg>
                      {globalPreviewLoading ? "Yüklənir..." : "Excel baxış"}
                    </button>
                    <button
                      type="button"
                      className="excel-analyze-btn"
                      onClick={() => void importGlobalExcel()}
                      disabled={globalImporting || !globalFile}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      {globalImporting ? "İdxal edilir..." : "Sistemə import et"}
                    </button>
                  </div>
                </div>

                {/* ── Info alert ── */}
                <div className="excel-info-alert">
                  <div className="excel-info-alert-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="16" x2="12" y2="12"/>
                      <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                  </div>
                  <p>Excel faylını analiz etmək üçün fayl seçin və &ldquo;Excel baxış&rdquo; düyməsinə kliklə.</p>
                  <p style={{marginTop: 8, fontSize: 13, color: "#475569"}}>
                    Mövcud tapşırıqları yeniləmək üçün <strong>Xarici ID</strong> sütunundan istifadə edin.
                  </p>
                </div>

                {/* ── Import process card ── */}
                <div className="excel-process-card">
                  <h3>İdxal prosesi</h3>
                  <div className="excel-process-steps">
                    <div className="excel-process-step">
                      <span className="excel-step-number">1</span>
                      <div className="excel-step-icon excel-step-icon--blue">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="17 8 12 3 7 8"/>
                          <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                      </div>
                      <p className="excel-step-title">Fayl seçin</p>
                      <p className="excel-step-desc">Excel faylınızı seçin (.xlsx və ya .xls)</p>
                    </div>

                    <div className="excel-step-connector" aria-hidden="true"></div>

                    <div className="excel-process-step">
                      <span className="excel-step-number">2</span>
                      <div className="excel-step-icon excel-step-icon--green">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                          <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                      </div>
                      <p className="excel-step-title">Analiz edilir</p>
                      <p className="excel-step-desc">Faylın strukturu və məlumatları yoxlanılır</p>
                    </div>

                    <div className="excel-step-connector" aria-hidden="true"></div>

                    <div className="excel-process-step">
                      <span className="excel-step-number">3</span>
                      <div className="excel-step-icon excel-step-icon--purple">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <line x1="3" y1="9" x2="21" y2="9"/>
                          <line x1="9" y1="21" x2="9" y2="9"/>
                        </svg>
                      </div>
                      <p className="excel-step-title">Nəticələri baxın</p>
                      <p className="excel-step-desc">Məlumatları nəzərdən keçirin və idxal edin</p>
                    </div>
                  </div>
                </div>

                {/* ── Supported formats / requirements card ── */}
                <div className="excel-requirements-card">
                  <div className="excel-requirements-left">
                    <div className="excel-requirements-header">
                      <div className="excel-requirements-header-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                          <path d="M9 18h6"/>
                          <path d="M10 22h4"/>
                          <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
                        </svg>
                      </div>
                      <h3>Dəstək olunan format və tələblər</h3>
                    </div>
                    <ul className="excel-requirements-list">
                      <li>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        .xlsx və .xls dəstəklənir
                      </li>
                      <li>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        İlk sətirdə sütun başlıqları olmalıdır
                      </li>
                      <li>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Minimum tələb olunan sütun: Tapşırıq / Title / Başlıq
                      </li>
                      <li>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Layihə və mərhələ tələb olunmur
                      </li>
                      <li>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Tanınmayan sütunlar xəbərdarlıq kimi göstərilir
                      </li>
                    </ul>
                  </div>
                  <div className="excel-requirements-right">
                    <div className="excel-requirements-illustration">
                      <div className="excel-badge-icon">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                          <path d="M14 2v6h6" fill="none" stroke="#fff" strokeWidth="2"/>
                        </svg>
                        Excel
                      </div>
                      <table className="excel-mini-table">
                        <thead>
                          <tr>
                            <th>Tapşırıq</th>
                            <th>İcraçı</th>
                            <th>Prioritet</th>
                            <th>Son tarix</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Yeni tapşırıq</td>
                            <td>Aysel</td>
                            <td>Yüksək</td>
                            <td>2026-07-15</td>
                            <td>İcradadır</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* ── Preview & results area ── */}
                <div className="excel-preview-area">
                  {globalImportResult && globalImportResult.success && (
                    <div className="excel-import-banner excel-import-banner--success">
                      <div className="excel-import-banner-left">
                        <span className="excel-import-banner-icon">✓</span>
                        <div>
                          <strong>Import tamamlandı</strong>
                          <span className="excel-import-banner-counts">
                            {globalImportResult.data.created_tasks} yeni{" "}
                            {globalImportResult.data.updated_tasks > 0 && `· ${globalImportResult.data.updated_tasks} yeniləndi`}{" "}
                            {globalImportResult.data.no_change_count > 0 && `· ${globalImportResult.data.no_change_count} dəyişiklik yoxdur`}{" "}
                            {globalImportResult.data.ambiguous_rows > 0 && `· ${globalImportResult.data.ambiguous_rows} qeyri-müəyyən`}{" "}
                            {globalImportResult.data.skipped_rows > 0 && `· ${globalImportResult.data.skipped_rows} keçirildi`}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="excel-import-banner-btn"
                        onClick={() => setGlobalShowImportReport(true)}
                      >
                        Hesabata bax
                      </button>
                    </div>
                  )}
                  {globalImportResult && !globalImportResult.success && (
                    <div className="excel-import-result error">
                      <div className="excel-import-error-detail">
                        <h4>Import xətası</h4>
                        <p>{globalImportResult.message}</p>
                        {globalImportResult.errors.length > 0 && (
                          <ul>
                            {globalImportResult.errors.slice(0, 10).map((err, idx) => (
                              <li key={idx}>{err}</li>
                            ))}
                            {globalImportResult.errors.length > 10 && (
                              <li>... və {globalImportResult.errors.length - 10} əlavə xəta</li>
                            )}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}

                  {globalPreviewError && (
                    <div className="excel-preview-error">{globalPreviewError}</div>
                  )}

                  {globalPreview && (
                    <>
                      <div className="excel-preview-counts">
                        <div className="excel-preview-count-card">
                          <span>Tapşırıqlar</span>
                          <strong>{globalPreview.tasks_count ?? 0}</strong>
                        </div>
                      </div>

                      {(globalPreview.warnings?.length > 0 || (globalPreview.unknown_columns?.length > 0)) && (
                        <div className="excel-preview-warnings-bar">
                          {globalPreview.warnings?.map((w, i) => (
                            <div key={i} className="excel-preview-warning-item">⚠ {w}</div>
                          ))}
                        </div>
                      )}

                      <div className="excel-preview-table-wrap">
                        <div className="excel-preview-scroll">
                          <table className="excel-preview-data-table">
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>Əməliyyat</th>
                                {globalPreview.tasks?.some(t => t.external_id) && (
                                  <th>Xarici ID</th>
                                )}
                                <th>Tapşırıq</th>
                                <th>Təsvir</th>
                                <th>İcraçı</th>
                                <th>Prioritet</th>
                                <th>Status</th>
                                <th>Son tarix</th>
                                <th>Kateqoriya</th>
                              {globalPreview.custom_field_columns?.length > 0 && (
                                <th>Əlavə sahələr</th>
                              )}
                              </tr>
                            </thead>
                            <tbody>
                              {(globalPreview.tasks || []).map((task, idx) => {
                                const actionLabel =
                                  task.action === "update" ? "Yenilənəcək" :
                                  task.action === "no_change" ? "Dəyişiklik yoxdur" :
                                  task.action === "ambiguous" ? "Dəqiqləşdirmə lazımdır" :
                                  task.action === "skipped" ? "Keçiləcək" :
                                  "Yeni yaradılacaq";
                                const actionColor =
                                  task.action === "update" ? "#2563eb" :
                                  task.action === "no_change" ? "#94a3b8" :
                                  task.action === "ambiguous" ? "#d97706" :
                                  task.action === "skipped" ? "#94a3b8" :
                                  "#16a34a";
                                return (
                                <tr key={task._row || idx}>
                                  <td>{idx + 1}</td>
                                  <td><span style={{fontSize: 12, fontWeight: 600, color: actionColor}}>{actionLabel}</span></td>
                                  {globalPreview.tasks?.some(t => t.external_id) && (
                                    <td style={{fontSize: 12, fontFamily: "monospace", color: "#64748b"}}>{task.external_id || "—"}</td>
                                  )}
                                  <td><strong>{task.title || "—"}</strong></td>
                                  <td>{task.description || "—"}</td>
                                  <td>{task.assignee || "—"}</td>
                                  <td>{task.priority || "—"}</td>
                                  <td>{task.operational_status || "—"}</td>
                                  <td>{task.deadline ? formatDate(task.deadline) : "—"}</td>
                                  <td>{task.category || "—"}</td>
                                  {globalPreview.custom_field_columns?.length > 0 && (
                                    <td style={{fontSize: 12, color: "#475569", maxWidth: 200}}>
                                      {task.custom_fields && Object.keys(task.custom_fields).length > 0
                                        ? Object.entries(task.custom_fields).map(([k, v]) => (
                                            <div key={k} style={{marginBottom: 2}}>
                                              <span style={{fontWeight: 600, color: "#64748b"}}>{k}:</span>{" "}
                                              {String(v ?? "—")}
                                            </div>
                                          ))
                                        : "—"}
                                    </td>
                                  )}
                                </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}

                  {!globalPreview && !globalPreviewError && !globalPreviewLoading && !globalImportResult && (
                    <div className="excel-info-alert" style={{marginTop: 16}}>
                      <p style={{margin: 0, color: "#475569", fontSize: 14}}>
                        Fayl seçdikdən sonra &ldquo;Excel baxış&rdquo; düyməsi ilə məlumatları analiz edin.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {page === "projects" && isAdminOrManager() && (
            <ProjectsPage
              projects={projects}
              tasks={tasks}
              selectedProject={selectedProject}
              projectStages={projectStages}
              projectSearch={projectSearch}
              projectDirectionFilter={projectDirectionFilter}
              projectApproachFilter={projectApproachFilter}
              projectActiveFilter={projectActiveFilter}
              projectOwnerFilter={projectOwnerFilter}
              showProjectForm={showProjectForm}
              editingProjectId={editingProjectId}
              projectForm={projectForm}
              projectFormErrors={projectFormErrors}
              showStageForm={showStageForm}
              editingStageId={editingStageId}
              stageForm={stageForm}
              stageFormErrors={stageFormErrors}
              directionPrograms={directionPrograms}
              projectStageStatusOptions={projectStageStatusOptions}
              projectStageNameOptions={projectStageNameOptions}
              projectApproachFallbacks={projectApproachFallbacks}
              getProjectStageStatusLabel={getProjectStageStatusLabel}
              getProjectStageStatusBadgeClass={getProjectStageStatusBadgeClass}
              getTaskAssigneeName={getTaskAssigneeName}
              getTaskOperationalStatus={getTaskOperationalStatus}
              operationalStatusLabels={operationalStatusLabels}
              priorityLabels={priorityLabels}
              taskTypeLabels={taskTypeLabels}
              formatDate={formatDate}
              ActionIcon={ActionIcon}
              onOpenProjectDetails={openProjectDetails}
              onCloseProjectDetails={closeProjectDetails}
              onSaveProject={saveProject}
              onEditProject={startEditProject}
              onDeleteProject={deleteProject}
              onResetProjectForm={resetProjectForm}
              onSaveStage={saveProjectStage}
              onEditStage={startEditStage}
              onDeleteStage={deleteProjectStage}
              onResetStageForm={resetStageForm}
              onFilterReset={resetProjectFilters}
              setProjectSearch={setProjectSearch}
              setProjectDirectionFilter={setProjectDirectionFilter}
              setProjectApproachFilter={setProjectApproachFilter}
              setProjectActiveFilter={setProjectActiveFilter}
              setProjectOwnerFilter={setProjectOwnerFilter}
              setProjectForm={setProjectForm}
              setStageForm={setStageForm}
              setShowProjectForm={setShowProjectForm}
              setShowStageForm={setShowStageForm}
            />
          )}

          {page === "users" && isAdminOrManager() && (
            <UsersPage
              users={users}
              user={user}
              userSearch={userSearch}
              roleFilter={roleFilter}
              userStatusFilter={userStatusFilter}
              userPasswordChangeFilter={userPasswordChangeFilter}
              showUserForm={showUserForm}
              editingUserId={editingUserId}
              userForm={userForm}
              userFormErrors={userFormErrors}
              getUserRoleValue={getUserRoleValue}
              getUserRoleLabel={getUserRoleLabel}
              isUserActive={isUserActive}
              ActionIcon={ActionIcon}
              toggleUserActive={toggleUserActive}
              resetUserPassword={resetUserPassword}
              resetUserPasswordLoadingId={resetUserPasswordLoadingId}
              saveUser={saveUser}
              startEditUser={startEditUser}
              resetUserForm={resetUserForm}
              resetUserFilters={resetUserFilters}
              setUserSearch={setUserSearch}
              setRoleFilter={setRoleFilter}
              setUserStatusFilter={setUserStatusFilter}
              setUserPasswordChangeFilter={setUserPasswordChangeFilter}
              setUserForm={setUserForm}
              setShowUserForm={setShowUserForm}
              setEditingUserId={setEditingUserId}
            />
          )}

          {page === "logs" && isAdminOrManager() && (
            <LogsPage
              logs={logs}
              tasks={tasks}
              logSearch={logSearch}
              logEntityFilter={logEntityFilter}
              logActionFilter={logActionFilter}
              setLogSearch={setLogSearch}
              setLogEntityFilter={setLogEntityFilter}
              setLogActionFilter={setLogActionFilter}
            />
          )}
        </main>

        <DeleteModal
          open={deleteModal.open}
          title={deleteModal.title}
          message={deleteModal.message}
          onConfirm={handleDeleteConfirm}
          onClose={closeDeleteModal}
        />

        {resetUserPasswordResult && (
          <div className="app-alert-overlay" onClick={() => setResetUserPasswordResult(null)}>
            <div
              className="app-alert-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="temporary-password-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="app-alert-header">
                <span className="app-alert-icon" aria-hidden="true">i</span>
                <h3 id="temporary-password-title">Müvəqqəti şifrə yaradıldı</h3>
              </div>

              <div className="app-alert-message">
                <p>
                  {resetUserPasswordResult.user?.full_name || resetUserPasswordResult.user?.email || "İstifadəçi"}
                  {" "}aktiv edildi. Bu şifrə yalnız indi göstərilir.
                </p>
                <p>İstifadəçi ilk girişdə şifrəni dəyişməlidir.</p>
              </div>

              <div className="temporary-password-box">
                <code>{resetUserPasswordResult.temporaryPassword}</code>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(resetUserPasswordResult.temporaryPassword);
                      showAppAlert("Şifrə kopyalandı.", { variant: "success" });
                    } catch {
                      showAppAlert("Şifrə kopyalanmadı. Zəhmət olmasa əl ilə kopyalayın.");
                    }
                  }}
                >
                  Kopyala
                </button>
              </div>

              <div className="app-alert-actions">
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => setResetUserPasswordResult(null)}
                >
                  Bağla
                </button>
              </div>
            </div>
          </div>
        )}

        {appDialog.open && (
          <div className="app-alert-overlay" onClick={() => closeAppDialog(false)}>
            <div
              className={`app-alert-dialog ${appDialog.variant}`}
              role="dialog"
              aria-modal="true"
              aria-labelledby="app-alert-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="app-alert-header">
                <span className="app-alert-icon" aria-hidden="true">
                  {appDialog.variant === "success"
                    ? "✓"
                    : appDialog.variant === "error"
                      ? "!"
                      : appDialog.variant === "warning"
                        ? "!"
                        : "i"}
                </span>
                <h3 id="app-alert-title">{appDialog.title}</h3>
              </div>

              <div className="app-alert-message">
                {String(appDialog.message || "")
                  .split("\n")
                  .map((line, index) => (
                    <p key={`${line}-${index}`}>{line}</p>
                  ))}
              </div>

              <div className="app-alert-actions">
                {appDialog.confirm && (
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => closeAppDialog(false)}
                  >
                    {appDialog.cancelText}
                  </button>
                )}
                <button
                  type="button"
                  className={appDialog.variant === "error" ? "danger-btn" : "primary-btn"}
                  onClick={() => closeAppDialog(true)}
                >
                  {appDialog.confirmText}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Import report modal ── */}
        {/* ── Global import report modal ── */}
        {globalShowImportReport && globalImportResult?.success && (
          <div className="import-report-overlay" onClick={() => setGlobalShowImportReport(false)}>
            <div
              className="import-report-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="global-import-report-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="import-report-header">
                <h2 id="global-import-report-title">İdxal hesabatı</h2>
                <button
                  type="button"
                  className="import-report-close"
                  onClick={() => setGlobalShowImportReport(false)}
                  aria-label="Bağla"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              <div className="import-report-body">
                {/* Summary counts */}
                <div className="import-report-summary">
                  <div className="import-report-stat">
                    <span className="import-report-stat-label">Tapşırıqlar</span>
                    <div className="import-report-stat-values">
                      <span className="import-report-stat-green">{globalImportResult.data.created_tasks} yeni</span>
                      {globalImportResult.data.updated_tasks > 0 && (
                        <span className="import-report-stat-blue">{globalImportResult.data.updated_tasks} yenilənən</span>
                      )}
                      {globalImportResult.data.no_change_count > 0 && (
                        <span className="import-report-stat-gray">{globalImportResult.data.no_change_count} dəyişiklik yoxdur</span>
                      )}
                      {globalImportResult.data.ambiguous_rows > 0 && (
                        <span className="import-report-stat-gray">{globalImportResult.data.ambiguous_rows} qeyri-müəyyən</span>
                      )}
                      {globalImportResult.data.skipped_rows > 0 && (
                        <span className="import-report-stat-gray">{globalImportResult.data.skipped_rows} keçirilən</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Warnings */}
                {globalImportResult.data.warnings?.length > 0 && (
                  <div className="import-report-warnings">
                    <h3>Xəbərdarlıqlar</h3>
                    <ul>
                      {globalImportResult.data.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Custom field columns (unknown → saved as custom_fields) */}
                {globalImportResult.data.custom_field_columns && globalImportResult.data.custom_field_columns.length > 0 && (
                  <div className="import-report-unknown-columns">
                    <h3>Əlavə sahə kimi saxlanacaq sütunlar</h3>
                    <ul>
                      {globalImportResult.data.custom_field_columns.map((col, i) => (
                        <li key={i}>Əlavə sahə: &ldquo;{col}&rdquo;</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Imported tasks table */}
                {globalImportResult.data.tasks?.length > 0 && (
                  <div className="import-report-tables">
                    <div className="import-report-table-section">
                      <h3>İdxal olunan tapşırıqlar</h3>
                      <div className="excel-preview-scroll">
                        <table className="excel-preview-data-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              {globalImportResult.data.tasks?.some(t => t.external_id) && (
                                <th>Xarici ID</th>
                              )}
                              <th>Tapşırıq</th>
                              <th>İcraçı</th>
                              <th>Prioritet</th>
                              <th>Status</th>
                              <th>Son tarix</th>
                              {globalImportResult.data.custom_field_columns?.length > 0 && (
                                <th>Əlavə sahələr</th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {globalImportResult.data.tasks.map((task, idx) => (
                              <tr key={task.id || idx}>
                                <td>{idx + 1}</td>
                                {globalImportResult.data.tasks?.some(t => t.external_id) && (
                                  <td style={{fontSize: 12, fontFamily: "monospace", color: "#64748b"}}>{task.external_id || "—"}</td>
                                )}
                                <td><strong>{task.title || "—"}</strong></td>
                                <td>{task.assignee || "—"}</td>
                                <td>{globalPriorityAzLabels[task.priority] || task.priority || "—"}</td>
                                <td>{globalOpStatusAzLabels[task.operational_status] || task.operational_status || "—"}</td>
                                <td>{task.deadline ? new Date(task.deadline).toLocaleDateString("az") : "—"}</td>
                                {globalImportResult.data.custom_field_columns?.length > 0 && (
                                  <td style={{fontSize: 12, color: "#475569", maxWidth: 200}}>
                                    {task.custom_fields && Object.keys(task.custom_fields).length > 0
                                      ? Object.entries(task.custom_fields).map(([k, v]) => (
                                          <div key={k} style={{marginBottom: 2}}>
                                            <span style={{fontWeight: 600, color: "#64748b"}}>{k}:</span>{" "}
                                            {String(v ?? "—")}
                                          </div>
                                        ))
                                      : "—"}
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

   return (
    <div className="login-page">
      <form className="login-card" onSubmit={login}>
        <div className="login-brand">
          <div className="login-brand-logo"><span className="brand-mark" aria-hidden="true">TM</span></div>
          <div>
            <h1>Task Manager</h1>
            <span>Tapşırıq idarəetmə sistemi</span>
          </div>
        </div>
        <p>Tapşırıq idarəetmə sisteminə giriş</p>

        {error && <div className="error">{error}</div>}

        <label>Email</label>
        <input
          type="email"
          placeholder="Email daxil et"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>Şifrə</label>
        <input
          type="password"
          placeholder="Şifrə daxil et"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Giriş edilir..." : "Daxil ol"}
        </button>
      </form>
    </div>
  );
}

export default App;
