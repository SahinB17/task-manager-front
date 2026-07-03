export const operationalStatusLabels = {
  new: "Yeni",
  waiting: "Gözləmədə",
  within_deadline: "İcra müddətinə var",
  active: "İcradadır",
  overdue: "Gecikmə",
  completed: "Tam icra",
};

export const priorityLabels = {
  low: "Aşağı",
  medium: "Orta",
  high: "Yüksək",
};

export const KANBAN_PAGE_SIZE = 20;
export const TASKS_PAGE_SIZE = 10;

export const taskTypeLabels = {
  general: "Ümumi",
  one_time: "Birdəfəlik",
  recurring: "Təkrarlanan",
  project: "Layihə",
};

export const actionLabels = {
  GLOBAL_EXCEL_IMPORT: "Excel import edildi",
  TASK_CREATED: "Tapşırıq yaradıldı",
  TASK_UPDATED: "Tapşırıq yeniləndi",
  TASK_STATUS_UPDATED: "Tapşırıq statusu dəyişdirildi",
  TASK_DELETED: "Tapşırıq silindi",
  USER_UPDATED: "İstifadəçi yeniləndi",

  task_created: "Tapşırıq yaradıldı",
  task_updated: "Tapşırıq yeniləndi",
  task_deleted: "Tapşırıq silindi",
  user_updated: "İstifadəçi yeniləndi",

  USER_CREATED: "İstifadəçi yaradıldı",
  USER_DELETED: "İstifadəçi silindi",

  COMMENT_CREATED: "Şərh əlavə edildi",
  COMMENT_UPDATED: "Şərh yeniləndi",
  COMMENT_DELETED: "Şərh silindi",

  FILE_UPLOADED: "Fayl yükləndi",
  FILE_DELETED: "Fayl silindi",
  ATTACHMENT_UPLOADED: "Fayl yükləndi",
  ATTACHMENT_DELETED: "Fayl silindi",
};

export const entityLabels = {
  user: "İstifadəçi",
  task: "Tapşırıq",
  comment: "Şərh",
  attachment: "Fayl",
  task_attachment: "Fayl",
};

export const KANBAN_GROUPED_COLUMNS = [
  {
    key: "planned",
    title: "Plan üzrə",
    statuses: ["new", "waiting", "within_deadline"],
    targetStatus: "new",
  },
  {
    key: "active",
    title: "İcradadır",
    statuses: ["active"],
    targetStatus: "active",
  },
  {
    key: "overdue",
    title: "Gecikmə",
    statuses: ["overdue"],
    targetStatus: null,
  },
  {
    key: "completed",
    title: "Tam icra",
    statuses: ["completed"],
    targetStatus: "completed",
  },
];

export const taskStatusOptions = [
  { value: "new", label: "Yeni" },
  { value: "waiting", label: "Gözləmədə" },
  { value: "within_deadline", label: "İcra müddətinə var" },
  { value: "active", label: "İcradadır" },
  { value: "overdue", label: "Gecikmə" },
  { value: "completed", label: "Tam icra" },
];

export const manualTaskStatusOptions = taskStatusOptions.filter(
  (option) => !["within_deadline", "overdue"].includes(option.value)
);

export const priorityOptions = [
  { value: "low", label: "Aşağı" },
  { value: "medium", label: "Orta" },
  { value: "high", label: "Yüksək" },
];

export const taskTypeOptions = [
  { value: "one_time", label: "Birdəfəlik" },
  { value: "recurring", label: "Təkrarlanan" },
  { value: "project", label: "Layihə" },
];

export const frequencyLabels = {
  none: "Yox",
  monthly: "Hər ay",
  quarterly: "Hər rüb",
  semiannual: "Hər yarımil",
  yearly: "Hər il",
};

export const frequencyOptions = Object.entries(frequencyLabels).map(
  ([value, label]) => ({ value, label })
);

export const riskStatusLabels = {
  low: "Aşağı",
  medium: "Orta",
  high: "Yüksək",
};

export const riskStatusOptions = [
  { value: "", label: "Seçilməyib" },
  ...Object.entries(riskStatusLabels).map(([value, label]) => ({ value, label })),
];

export const reportingRequiredOptions = [
  { value: "", label: "Seçilməyib" },
  { value: "true", label: "Bəli" },
  { value: "false", label: "Xeyr" },
];

export const userRoleFilterOptions = [
  { value: "all", label: "Rol: Hamısı" },
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Menecer" },
  { value: "employee", label: "İşçi" },
];

export const userStatusFilterOptions = [
  { value: "all", label: "Status: Hamısı" },
  { value: "active", label: "Aktiv" },
  { value: "inactive", label: "Deaktiv" },
];

export const userStatusOptions = [
  { value: "true", label: "Aktiv" },
  { value: "false", label: "Deaktiv" },
];

export const logEntityFilterOptions = [
  { value: "all", label: "Obyekt: Hamısı" },
  { value: "task", label: "Tapşırıq" },
  { value: "user", label: "İstifadəçi" },
  { value: "file", label: "Fayl" },
];

export const logActionFilterOptions = [
  { value: "all", label: "Əməliyyat: Hamısı" },
  { value: "create", label: "Yaradıldı" },
  { value: "update", label: "Yeniləndi" },
  { value: "delete", label: "Silindi" },
  { value: "status", label: "Status dəyişdirildi" },
  { value: "import", label: "Excel import" },
  { value: "file_upload", label: "Fayl yükləndi" },
  { value: "file_delete", label: "Fayl silindi" },
];

export const PRIORITY_OPTIONS = [
  { value: "high", label: "Yüksək", color: "#DC4C4C" },
  { value: "medium", label: "Orta", color: "#D9902F" },
  { value: "low", label: "Aşağı", color: "#3B82F6" },
];

export const TASK_TYPE_OPTIONS = [
  { value: "project", label: "Layihə", color: "#2563EB" },
  { value: "one_time", label: "Birdəfəlik", color: "#6366F1" },
  { value: "recurring", label: "Təkrarlanan", color: "#0EA5A8" },
  { value: "general", label: "Ümumi", color: "#7C8A9B" },
];

export const OPERATIONAL_STATUS_OPTIONS = [
  { value: "new", label: "Yeni", color: "#3B82F6" },
  { value: "waiting", label: "Gözləmədə", color: "#7C8A9B" },
  { value: "within_deadline", label: "İcra müddətinə var", color: "#0EA5A8" },
  { value: "active", label: "İcradadır", color: "#D9902F" },
  { value: "overdue", label: "Gecikmə", color: "#EF6A6A" },
  { value: "completed", label: "Tam icra", color: "#22A06B" },
];

export const getOptionLabel = (options, value, fallback = "") => {
  if (!options || !value) return fallback;
  const found = options.find((o) => o.value === value);
  return found ? found.label : fallback;
};

export const getOptionColor = (options, value, fallback = "#3B82F6") => {
  if (!options || !value) return fallback;
  const found = options.find((o) => o.value === value);
  return found ? found.color : fallback;
};

export const STATUS_OPTIONS = [
  { value: "todo", label: "Gözləmədə", color: "#94A3B8" },
  { value: "in_progress", label: "İcradadır", color: "#3B82F6" },
  { value: "done", label: "Tamamlandı", color: "#22C55E" },
];

export const FREQUENCY_OPTIONS = [
  { value: "none", label: "Yox", color: "#94A3B8" },
  { value: "monthly", label: "Hər ay", color: "#3B82F6" },
  { value: "quarterly", label: "Hər rüb", color: "#8B5CF6" },
  { value: "semiannual", label: "Hər yarımil", color: "#F59E0B" },
  { value: "yearly", label: "Hər il", color: "#EC4899" },
];

export const RISK_STATUS_OPTIONS = [
  { value: "low", label: "Aşağı", color: "#22C55E" },
  { value: "medium", label: "Orta", color: "#F59E0B" },
  { value: "high", label: "Yüksək", color: "#EF4444" },
];

export const REPORTING_OPTIONS = [
  { value: "true", label: "Bəli", color: "#22C55E" },
  { value: "false", label: "Xeyr", color: "#EF4444" },
];
