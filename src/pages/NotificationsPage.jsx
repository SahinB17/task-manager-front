import { useEffect, useState } from "react";
import api from "../api";
import { formatDate, getErrorMessage } from "../utils/helpers";
import {
  OPERATIONAL_STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  getOptionLabel,
} from "../constants/taskConstants";

const notificationTypeLabels = {
  task_assigned: "Yeni tapşırıq",
  task_updated: "Tapşırıq yeniləndi",
  task_completed: "Tapşırıq tamamlandı",
  comment_added: "Şərh əlavə edildi",
};

const notificationTypeIcons = {
  task_assigned: "M",
  task_updated: "D",
  task_completed: "T",
  comment_added: "Ş",
};

const deadlineNotificationTypeLabels = {
  task_deadline_reminder: "Son tarix yaxınlaşır",
  task_overdue: "Tapşırıq gecikib",
};

const deadlineNotificationTypeIcons = {
  task_deadline_reminder: "!",
  task_overdue: "!",
};

Object.assign(notificationTypeLabels, deadlineNotificationTypeLabels);
Object.assign(notificationTypeIcons, deadlineNotificationTypeIcons);

const fieldLabels = {
  status: "Status",
  operational_status: "Status",
  priority: "Prioritet",
  assigned_to: "İcraçı",
};

const getTaskTitle = (notification) =>
  notification.task?.title || notification.metadata?.task_title || "";

const getActorName = (notification) =>
  notification.actor?.full_name || notification.actor?.email || "";

// Map canonical status values to operational equivalents for legacy notification data.
const CANONICAL_TO_OPERATIONAL = {
  todo: null,   // ambiguous — resolved below
  in_progress: "active",
  done: "completed",
};

const getValueLabel = (field, value) => {
  if (!value) return "Seçilməyib";

  // Both "status" and "operational_status" changes use the business label.
  if (field === "status" || field === "operational_status") {
    const mappedValue = CANONICAL_TO_OPERATIONAL[value] || value;
    return getOptionLabel(OPERATIONAL_STATUS_OPTIONS, mappedValue, mappedValue);
  }

  if (field === "priority") return getOptionLabel(PRIORITY_OPTIONS, value, value);
  return value;
};

const buildNotificationView = (notification) => {
  const taskTitle = getTaskTitle(notification);
  const actorName = getActorName(notification);
  const fallbackTitle = notificationTypeLabels[notification.type] || notification.title;

  if (notification.type === "task_completed") {
    return {
      title: actorName ? `${actorName} tapşırığı tamamladı` : "Tapşırıq tamamlandı",
      message: taskTitle
        ? `${taskTitle} tapşırığı tamamlandı`
        : notification.message || "Tapşırıq tamamlandı",
    };
  }

  if (notification.type === "task_assigned") {
    return {
      title: actorName ? `${actorName} sizə tapşırıq təyin etdi` : "Yeni tapşırıq",
      message: taskTitle
        ? `Sizə yeni tapşırıq təyin edildi: ${taskTitle}`
        : notification.message || "Sizə yeni tapşırıq təyin edildi",
    };
  }

  if (notification.type === "task_updated") {
    return {
      title: actorName ? `${actorName} tapşırığı yenilədi` : "Tapşırıq yeniləndi",
      message: taskTitle
        ? `${taskTitle} tapşırığında dəyişiklik edildi`
        : notification.message || "Tapşırıq yeniləndi",
    };
  }

  if (notification.type === "comment_added") {
    return {
      title: actorName ? `${actorName} şərh əlavə etdi` : "Şərh əlavə edildi",
      message: taskTitle
        ? `${taskTitle} tapşırığına yeni şərh əlavə edildi`
        : notification.message || "Şərh əlavə edildi",
    };
  }

  if (notification.type === "task_deadline_reminder") {
    return {
      title: "Son tarix yaxınlaşır",
      message: notification.message || "Tapşırığın son tarixi yaxınlaşır",
    };
  }

  if (notification.type === "task_overdue") {
    return {
      title: "Tapşırıq gecikib",
      message: notification.message || "Tapşırığın son tarixi keçib",
    };
  }

  return {
    title: fallbackTitle || "Bildiriş",
    message: notification.message || "Yeni bildiriş var",
  };
};

const isTaskNotification = (notification) =>
  notification.task_id || String(notification.type || "").startsWith("task_") ||
  notification.type === "comment_added";

function NotificationsPage({ onUnreadCountChange, onOpenTask, showAppAlert }) {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = async () => {
    setLoading(true);

    try {
      const response = await api.get("/notifications/", {
        params: {
          limit: 50,
        },
      });
      setNotifications(response.data.items || []);
      onUnreadCountChange(response.data.unread_count || 0);
    } catch (err) {
      showAppAlert(getErrorMessage(err, "Bildirişlər yüklənmədi."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const todayKey = new Date().toLocaleDateString("az-AZ");
  const unreadCount = notifications.filter((item) => !item.is_read).length;
  const todayCount = notifications.filter(
    (item) => item.created_at && new Date(item.created_at).toLocaleDateString("az-AZ") === todayKey
  ).length;
  const filteredNotifications = notifications.filter((item) => {
    if (filter === "unread") return !item.is_read;
    if (filter === "tasks") return isTaskNotification(item);
    if (filter === "system") return !isTaskNotification(item);
    return true;
  });

  const markAsRead = async (notification) => {
    if (notification.is_read) return notification;

    const response = await api.patch(`/notifications/${notification.id}/read`);
    const updated = response.data;

    setNotifications((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
    onUnreadCountChange((prev) => Math.max(0, prev - 1));

    return updated;
  };

  const handleNotificationClick = async (notification) => {
    try {
      await markAsRead(notification);
    } catch (err) {
      showAppAlert(getErrorMessage(err, "Bildiriş yenilənmədi."));
    }
  };

  const openNotificationTask = async (notification) => {
    try {
      await markAsRead(notification);
      await onOpenTask(notification.task_id);
    } catch (err) {
      showAppAlert(getErrorMessage(err, "Tapşırıq açılmadı."));
    }
  };

  const markAllAsRead = async () => {
    setMarkingAll(true);

    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) =>
        prev.map((item) => ({
          ...item,
          is_read: true,
          read_at: item.read_at || new Date().toISOString(),
        }))
      );
      onUnreadCountChange(0);
    } catch (err) {
      showAppAlert(getErrorMessage(err, "Bildirişlər yenilənmədi."));
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="notifications-page">
      <div className="notifications-page-header">
        <div>
          <h2>Bildirişlər</h2>
          <p>Tapşırıqlar və sistem hadisələri üzrə yeniliklər</p>
        </div>

        <button
          type="button"
          className="secondary-btn"
          onClick={markAllAsRead}
          disabled={markingAll || notifications.every((item) => item.is_read)}
        >
          Hamısını oxunmuş et
        </button>
      </div>

      <div className="notifications-summary-grid">
        <div className="notifications-summary-card">
          <span>Ümumi bildirişlər</span>
          <strong>{notifications.length}</strong>
        </div>
        <div className="notifications-summary-card unread">
          <span>Oxunmamış</span>
          <strong>{unreadCount}</strong>
        </div>
        <div className="notifications-summary-card">
          <span>Bu gün</span>
          <strong>{todayCount}</strong>
        </div>
      </div>

      <div className="notifications-toolbar">
        <div className="notifications-tabs" aria-label="Bildiriş filtri">
          <button
            type="button"
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            Hamısı
          </button>
          <button
            type="button"
            className={filter === "unread" ? "active" : ""}
            onClick={() => setFilter("unread")}
          >
            Oxunmamış
          </button>
          <button
            type="button"
            className={filter === "tasks" ? "active" : ""}
            onClick={() => setFilter("tasks")}
          >
            Tapşırıqlar
          </button>
          <button
            type="button"
            className={filter === "system" ? "active" : ""}
            onClick={() => setFilter("system")}
          >
            Sistem
          </button>
        </div>
      </div>

      <div className="notifications-list">
        {loading ? (
          <div className="notifications-empty">Yüklənir...</div>
        ) : filteredNotifications.length === 0 ? (
          <div className="notifications-empty">
            <span className="notifications-empty-icon" aria-hidden="true">
              !
            </span>
            <strong>Bildiriş yoxdur</strong>
            <span>Yeni hadisələr burada görünəcək</span>
          </div>
        ) : (
          filteredNotifications.map((notification) => {
            const view = buildNotificationView(notification);
            const taskTitle = getTaskTitle(notification);
            const actorName = getActorName(notification);
            const changes = notification.metadata?.changes || [];

            return (
              <article
                key={notification.id}
                className={`notification-item${notification.is_read ? "" : " unread"}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <span className="notification-type-icon" aria-hidden="true">
                  {notificationTypeIcons[notification.type] || "B"}
                </span>

                <div className="notification-content">
                  <div className="notification-title-row">
                    <h3 className="notification-title">{view.title}</h3>
                    {!notification.is_read && (
                      <span className="notification-status">Yeni</span>
                    )}
                  </div>

                  <p className="notification-message">{view.message}</p>

                  {(actorName || taskTitle) && (
                    <div className="notification-meta-grid">
                      {actorName && (
                        <span>
                          <strong>İcra edən:</strong> {actorName}
                        </span>
                      )}
                      {taskTitle && (
                        <span>
                          <strong>Tapşırıq:</strong> {taskTitle}
                        </span>
                      )}
                    </div>
                  )}

                  {changes.length > 0 && (
                    <div className="notification-change-list">
                      {changes.map((change, index) => (
                        <span key={`${change.field}-${index}`}>
                          <strong>{fieldLabels[change.field] || change.field}:</strong>{" "}
                          {getValueLabel(change.field, change.old)} →{" "}
                          {getValueLabel(change.field, change.new)}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="notification-footer">
                    <span className="notification-date">
                      {formatDate(notification.created_at, true)}
                    </span>

                    {notification.task_id && (
                      <button
                        type="button"
                        className="notification-task-link"
                        onClick={async (event) => {
                          event.stopPropagation();
                          await openNotificationTask(notification);
                        }}
                      >
                        Tapşırığa bax
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

export default NotificationsPage;
