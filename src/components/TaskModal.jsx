import { formatDate, getAttachmentFileName } from "../utils/helpers";
import {
  OPERATIONAL_STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  getOptionLabel,
} from "../constants/taskConstants";

const TaskModalIcon = ({ name }) => {
  const iconProps = {
    className: "task-modal-icon",
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
    calendar: (
      <>
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect width="18" height="18" x="3" y="4" rx="2" />
        <path d="M3 10h18" />
      </>
    ),
    clipboard: (
      <>
        <path d="M9 4h6" />
        <path d="M9 2h6v4H9z" />
        <rect width="16" height="18" x="4" y="4" rx="2" />
        <path d="M9 12h6" />
        <path d="M9 16h4" />
      </>
    ),
    close: (
      <>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </>
    ),
    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M8 13h8" />
        <path d="M8 17h5" />
      </>
    ),
    folder: (
      <>
        <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      </>
    ),
    flag: (
      <>
        <path d="M4 22V4" />
        <path d="M4 4h11l-1 5 1 5H4" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </>
    ),
    kanban: (
      <>
        <rect width="18" height="16" x="3" y="4" rx="2" />
        <path d="M3 10h18" />
        <path d="M9 10v10" />
        <path d="M15 10v10" />
      </>
    ),
    link: (
      <>
        <path d="M10 13a5 5 0 0 0 7.07 0l2.12-2.12a5 5 0 0 0-7.07-7.07L11 4.93" />
        <path d="M14 11a5 5 0 0 0-7.07 0L4.81 13.12a5 5 0 0 0 7.07 7.07L13 19.07" />
      </>
    ),
    message: (
      <>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
      </>
    ),
    paperclip: (
      <>
        <path d="m21.44 11.05-8.49 8.49a5 5 0 0 1-7.07-7.07l8.49-8.49a3 3 0 0 1 4.24 4.24l-8.49 8.49a1 1 0 0 1-1.41-1.41l7.78-7.78" />
      </>
    ),
    send: (
      <>
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </>
    ),
    status: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l3 2" />
      </>
    ),
    user: (
      <>
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    warning: (
      <>
        <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </>
    ),
    upload: (
      <>
        <path d="M12 3v12" />
        <path d="m17 8-5-5-5 5" />
        <path d="M5 21h14" />
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
  };

  return <svg {...iconProps}>{icons[name]}</svg>;
};

const getInitials = (name) =>
  (name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "??";

const TaskSidebarRow = ({ icon, label, value, className = "" }) => (
  <div className={`task-info-item task-sidebar-row${className ? ` ${className}` : ""}`}>
    <TaskModalIcon name={icon} />
    <div className="task-sidebar-row-content">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  </div>
);

export default function TaskModal({
  task,
  onClose,
  getTaskAssigneeName,
  comments,
  newComment,
  onCommentChange,
  onAddComment,
  onDeleteComment,
  users,
  attachments,
  attachmentsLoading,
  attachmentsError,
  attachmentUploading,
  selectedFileName,
  onFileSelect,
  inputRef,
  onUploadAttachment,
  onDeleteAttachment,
  onDownloadAttachment,
}) {
  const assigneeName = getTaskAssigneeName(task);

  return (
    <div
      className="task-details-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-details-title"
      onClick={onClose}
    >
      <div
        className="task-details-modal"
        onClick={(e) => e.stopPropagation()}
      >
      <div className="task-details-panel">
        <div className="comments-header">
          <div className="task-details-heading">
            <span className="task-details-heading-icon">
              <TaskModalIcon name="clipboard" />
            </span>

            <div>
              <h3 id="task-details-title">Tapşırıq detalları</h3>
              <p className="task-details-subtitle">{task.title}</p>
            </div>
          </div>

          <div className="task-details-close-actions">
            <button
              className="details-close-btn"
              onClick={onClose}
              aria-label="Bağla"
            >
              <TaskModalIcon name="close" />
            </button>
          </div>
        </div>

        <div className="details-content-grid">
          <div className="task-main-details">
            <div className="task-info-card">
              <div className="task-section-heading">
                <TaskModalIcon name="clipboard" />
                <h4>Tapşırıq məlumatları</h4>
              </div>

              <div className="task-info-grid">
                <div className="task-info-item">
                  <span>Başlıq</span>
                  <strong>{task.title || "—"}</strong>
                </div>

                {task.created_at && (
                  <div className="task-info-item">
                    <span>Yaradılma tarixi</span>
                    <strong>{formatDate(task.created_at, true)}</strong>
                  </div>
                )}

                {task.updated_at && (
                  <div className="task-info-item">
                    <span>Yenilənmə tarixi</span>
                    <strong>{formatDate(task.updated_at, true)}</strong>
                  </div>
                )}
              </div>
            </div>

            <div className="task-info-card">
              <div className="task-section-heading">
                <TaskModalIcon name="file" />
                <h4>Təsvir</h4>
              </div>
              <div className={`task-description-box${task.description ? "" : " task-description-empty"}`}>
                {task.description || (
                  <>
                    <TaskModalIcon name="file" />
                    <span>Təsvir əlavə edilməyib</span>
                  </>
                )}
              </div>
            </div>

            <div className="comments-panel">
              <div className="task-section-heading">
                <TaskModalIcon name="message" />
                <h4>Şərhlər</h4>
              </div>

              <div className="comments-list">
                {comments.length === 0 ? (
                  <p className="empty-text task-comment-empty">
                    <TaskModalIcon name="message" />
                    Bu tapşırıq üçün hələ şərh yoxdur.
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div className="comment-card" key={comment.id}>
                      <div className="comment-body">
                        <div className="comment-meta">
                          <strong>
                            {users.find((u) => u.id === comment.user_id)?.full_name ||
                              comment.user?.full_name ||
                              comment.author?.full_name ||
                              comment.created_by?.full_name ||
                              comment.user_name ||
                              "Naməlum istifadəçi"}
                          </strong>

                          <span>
                            {comment.created_at
                              ? new Date(comment.created_at).toLocaleString("az-AZ")
                              : ""}
                          </span>
                        </div>

                        <p>{comment.comment || comment.content}</p>
                      </div>

                      <button
                        className="danger-btn"
                        onClick={() => onDeleteComment(comment.id)}
                      >
                        Sil
                      </button>
                    </div>
                  ))
                )}
              </div>

              <form className="comment-form" onSubmit={onAddComment}>
                <textarea
                  className="comment-textarea"
                  value={newComment}
                  onChange={onCommentChange}
                  placeholder="Yeni şərh yaz..."
                />

                <div className="comment-actions">
                  <button type="submit" className="comment-submit-btn">
                    <TaskModalIcon name="send" />
                    Şərh əlavə et
                  </button>
                </div>
              </form>
            </div>
          </div>

          <aside className="task-meta-sidebar">
            <div className="task-meta-card task-summary-card">
              <div className="task-section-heading">
                <TaskModalIcon name="info" />
                <h4>Qısa məlumat</h4>
              </div>

              <TaskSidebarRow
                icon="status"
                label="Status"
                value={
                  getOptionLabel(OPERATIONAL_STATUS_OPTIONS, task.operational_status, task.operational_status) ||
                  task.status ||
                  "—"
                }
                className="task-sidebar-row-status"
              />

              <TaskSidebarRow
                icon="flag"
                label="Prioritet"
                value={getOptionLabel(PRIORITY_OPTIONS, task.priority, task.priority) || "—"}
                className="task-sidebar-row-priority"
              />

              <TaskSidebarRow
                icon="calendar"
                label="Son tarix"
                value={formatDate(task.deadline)}
              />

              <TaskSidebarRow
                icon="kanban"
                label="Kanban"
                value={task.kanban_enabled === false ? "Xeyr" : "Bəli"}
              />

              {(task.category || task.direction_program) && (
                <TaskSidebarRow
                  icon="link"
                  label="Kateqoriya"
                  value={task.category || task.direction_program}
                />
              )}

              {task.custom_fields &&
                typeof task.custom_fields === "object" &&
                Object.keys(task.custom_fields).length > 0 && (
                  <div className="task-detail-custom-fields">
                    <h4>Əlavə sahələr</h4>
                    {Object.entries(task.custom_fields).map(([key, value]) => (
                      <div className="task-detail-custom-field-item" key={key}>
                        <span className="task-detail-custom-field-key">{key}</span>
                        <span className="task-detail-custom-field-value">{String(value ?? "—")}</span>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            <div className="task-meta-card">
              <div className="task-section-heading">
                <TaskModalIcon name="users" />
                <h4>Əlaqəli şəxslər</h4>
              </div>

              <div className="task-person-row">
                <span className="task-person-avatar">{getInitials(assigneeName)}</span>
                <div>
                  <span>İcraçı işçi</span>
                  <strong>{assigneeName}</strong>
                </div>
              </div>
            </div>

            <div className="attachments-panel attachments-section">
              <div className="task-section-heading">
                <TaskModalIcon name="paperclip" />
                <h4>Fayllar</h4>
              </div>

              <div className="attachment-upload-row">
                <div className="file-upload-box">
                  <input
                    id="attachment-file-input"
                    ref={inputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
                    className="file-input-hidden"
                    onChange={onFileSelect}
                  />

                  <label
                    htmlFor="attachment-file-input"
                    className="file-select-btn"
                    aria-label="Fayl seç"
                  >
                    <TaskModalIcon name="file" />
                  </label>

                  <span className="selected-file-name">
                    {selectedFileName}
                  </span>
                </div>

                <button
                  type="button"
                  className="attachment-upload-btn"
                  onClick={onUploadAttachment}
                  disabled={attachmentUploading}
                >
                  <TaskModalIcon name="upload" />
                  {attachmentUploading ? "Yüklənir..." : "Yüklə"}
                </button>
              </div>

              {attachmentsError && (
                <p className="empty-text">{attachmentsError}</p>
              )}

              {attachmentsLoading ? (
                <p className="empty-text">Fayllar yüklənir...</p>
              ) : (
                <div className="attachment-list">
                  {attachments.length === 0 ? (
                    <p className="empty-text task-file-empty">
                      <TaskModalIcon name="folder" />
                      Bu tapşırıq üçün hələ fayl yoxdur.
                    </p>
                  ) : (
                    attachments.map((attachment) => (
                      <div className="attachment-item" key={attachment.id}>
                        <div>
                          <strong>{getAttachmentFileName(attachment)}</strong>
                          <span>
                            {attachment.created_at
                              ? new Date(attachment.created_at).toLocaleString("az-AZ")
                              : ""}
                          </span>
                        </div>

                        <div className="attachment-actions">
                          <button
                            type="button"
                            className="attachment-download-btn"
                            onClick={() => onDownloadAttachment(attachment)}
                          >
                            Yüklə
                          </button>

                          <button
                            type="button"
                            className="attachment-delete-btn"
                            onClick={() => onDeleteAttachment(attachment.id)}
                          >
                            Sil
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
      </div>
    </div>
  );
}
