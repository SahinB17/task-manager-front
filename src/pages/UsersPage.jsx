import CustomSelect from "../components/CustomSelect";
import { userRoleFilterOptions, userStatusFilterOptions, userStatusOptions } from "../constants/taskConstants";

function UsersPage({
  users,
  user,
  userSearch,
  roleFilter,
  userStatusFilter,
  userPasswordChangeFilter,
  showUserForm,
  editingUserId,
  userForm,
  userFormErrors,
  getUserRoleValue,
  getUserRoleLabel,
  isUserActive,
  ActionIcon,
  toggleUserActive,
  resetUserPassword,
  resetUserPasswordLoadingId,
  saveUser,
  startEditUser,
  resetUserForm,
  resetUserFilters,
  setUserSearch,
  setRoleFilter,
  setUserStatusFilter,
  setUserPasswordChangeFilter,
  setUserForm,
  setShowUserForm,
  setEditingUserId,
}) {
  /* ---------- User computations ---------- */

  const filteredUsers = users.filter((item) => {
    const searchValue = userSearch.trim().toLowerCase();
    const roleValue = getUserRoleValue(item);
    const roleLabel = getUserRoleLabel(item);
    const active = isUserActive(item);

    const matchesSearch =
      !searchValue ||
      [
        item.full_name,
        item.name,
        item.username,
        item.email,
        item.role,
        roleLabel,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchValue));
    const matchesRole = roleFilter === "all" || roleValue === roleFilter;
    const matchesStatus =
      userStatusFilter === "all" ||
      (userStatusFilter === "active" && active) ||
      (userStatusFilter === "inactive" && !active);
    const matchesPasswordChange =
      userPasswordChangeFilter === "all" ||
      String(Boolean(item.must_change_password)) === userPasswordChangeFilter;

    return matchesSearch && matchesRole && matchesStatus && matchesPasswordChange;
  });

  const adminUsers = users.filter((item) => getUserRoleValue(item) === "admin")
    .length;
  const employeeUsers = users.filter(
    (item) => getUserRoleValue(item) === "employee"
  ).length;
  const activeUsers = users.filter((item) => isUserActive(item)).length;
  const inactiveUsers = users.length - activeUsers;

  /* ---------- Render ---------- */

  return (
    <div className="section-card">
      {/* Page header */}
      <div className="users-page-header">
        <div className="users-page-header-left">
          <div className="users-page-header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <h2 className="users-page-header-title">İstifadəçi idarəetməsi</h2>
            <p className="users-page-header-subtitle">Sistemdəki istifadəçiləri, rolları və aktivlik statuslarını idarə edin.</p>
          </div>
        </div>
        <button
          className="primary-btn"
          onClick={() => {
            if (showUserForm) {
              resetUserForm();
            } else {
              setEditingUserId(null);
              setUserForm({
                full_name: "",
                email: "",
                password: "",
                role_id: 3,
                is_active: true,
              });
              setShowUserForm(true);
            }
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {showUserForm ? "Formu bağla" : "Yeni istifadəçi"}
        </button>
      </div>

      {showUserForm && (
        <div
          className="task-form-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-form-title"
          onClick={resetUserForm}
        >
          <div className="task-modal" onClick={(e) => e.stopPropagation()}>
            <form className="task-form" onSubmit={saveUser}>
              <div className="modal-header">
                <h3 id="user-form-title">
                  {editingUserId ? "İstifadəçini redaktə et" : "Yeni istifadəçi"}
                </h3>

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={resetUserForm}
                >
                  Bağla
                </button>
              </div>

              <div className="modal-form-grid">
                <div className="form-field">
                  <label>Ad soyad</label>
                  <input
                    type="text"
                    value={userForm.full_name}
                    autoFocus
                    autoComplete="name"
                    placeholder="Ad Soyad"
                    onChange={(e) =>
                      setUserForm({
                        ...userForm,
                        full_name: e.target.value,
                      })
                    }
                  />
                  {userFormErrors.full_name && (
                    <p className="form-error-text">
                      {userFormErrors.full_name}
                    </p>
                  )}
                </div>

                <div className="form-field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={userForm.email}
                    autoComplete="email"
                    placeholder="user@example.com"
                    onChange={(e) =>
                      setUserForm({
                        ...userForm,
                        email: e.target.value,
                      })
                    }
                  />
                  {userFormErrors.email && (
                    <p className="form-error-text">{userFormErrors.email}</p>
                  )}
                </div>

                <div className="form-field">
                  <label>
                    Password {editingUserId && "(boş buraxsan dəyişməyəcək)"}
                  </label>
                  <input
                    type="password"
                    value={userForm.password}
                    autoComplete="new-password"
                    placeholder={editingUserId ? "Yeni password" : "Minimum 6 simvol"}
                    onChange={(e) =>
                      setUserForm({
                        ...userForm,
                        password: e.target.value,
                      })
                    }
                  />
                  {userFormErrors.password && (
                    <p className="form-error-text">
                      {userFormErrors.password}
                    </p>
                  )}
                </div>

                <div className="form-field">
                  <label>Rol</label>
                  <CustomSelect
                    value={userForm.role_id}
                    onChange={(nextValue) =>
                      setUserForm({
                        ...userForm,
                        role_id: nextValue,
                      })
                    }
                    disabled={user.role_id === 2}
                    options={[
                      ...(user.role_id === 1
                        ? [
                            { value: "1", label: "Admin" },
                            { value: "2", label: "Menecer" },
                          ]
                        : []),
                      { value: "3", label: "İşçi" },
                    ]}
                  />
                  {userFormErrors.role_id && (
                    <p className="form-error-text">
                      {userFormErrors.role_id}
                    </p>
                  )}
                </div>

                <div className="form-field">
                  <label>Status</label>
                  <CustomSelect
                    value={userForm.is_active ? "true" : "false"}
                    onChange={(nextValue) =>
                      setUserForm({
                        ...userForm,
                        is_active: nextValue === "true",
                      })
                    }
                    options={userStatusOptions}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={resetUserForm}
                >
                  Ləğv et
                </button>
                <button type="submit" className="primary-btn">
                  {editingUserId ? "İstifadəçini yenilə" : "İstifadəçini yarat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="users-summary-grid">
        <div className="users-summary-card users-summary-card-total">
          <span className="users-summary-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </span>
          <div className="users-summary-text">
            <span className="users-summary-title">Ümumi istifadəçilər</span>
            <strong className="users-summary-value">{users.length}</strong>
          </div>
        </div>

        <div className="users-summary-card users-summary-card-admin">
          <span className="users-summary-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </span>
          <div className="users-summary-text">
            <span className="users-summary-title">Adminlər</span>
            <strong className="users-summary-value">{adminUsers}</strong>
          </div>
        </div>

        <div className="users-summary-card users-summary-card-employee">
          <span className="users-summary-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </span>
          <div className="users-summary-text">
            <span className="users-summary-title">İşçilər</span>
            <strong className="users-summary-value">{employeeUsers}</strong>
          </div>
        </div>

        <div className="users-summary-card users-summary-card-active">
          <span className="users-summary-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </span>
          <div className="users-summary-text">
            <span className="users-summary-title">Aktiv istifadəçilər</span>
            <strong className="users-summary-value">{activeUsers}</strong>
          </div>
        </div>

        <div className="users-summary-card users-summary-card-inactive">
          <span className="users-summary-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </span>
          <div className="users-summary-text">
            <span className="users-summary-title">Deaktiv istifadəçilər</span>
            <strong className="users-summary-value">{inactiveUsers}</strong>
          </div>
        </div>
      </div>

      <div className="users-filters-card">
        <div className="users-filters">
          <div className="user-filter-search">
            <svg className="user-filter-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="search"
              className="user-filter-input"
              placeholder="Ad və ya email üzrə axtar"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
          </div>

          <div className="user-filter-control">
            <svg className="user-filter-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <CustomSelect
              className="user-filter-select"
              value={roleFilter}
              onChange={(nextValue) => setRoleFilter(nextValue)}
              options={userRoleFilterOptions}
            />
          </div>

          <div className="user-filter-control">
            <svg className="user-filter-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="4" />
            </svg>
            <CustomSelect
              className="user-filter-select"
              value={userStatusFilter}
              onChange={(nextValue) => setUserStatusFilter(nextValue)}
              options={userStatusFilterOptions}
            />
          </div>

          <div className="user-filter-control">
            <svg className="user-filter-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
            </svg>
            <CustomSelect
              className="user-filter-select"
              value={userPasswordChangeFilter}
              onChange={(nextValue) => setUserPasswordChangeFilter(nextValue)}
              options={[
                { value: "all", label: "Şifrə: Hamısı" },
                { value: "true", label: "Dəyişməlidir" },
                { value: "false", label: "Dəyişməli deyil" },
              ]}
            />
          </div>

          <button
            type="button"
            className="users-reset-btn"
            onClick={resetUserFilters}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            Sıfırla
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>Ad</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Status</th>
              <th>Əməliyyat</th>
            </tr>
          </thead>

          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="5" className="users-empty-row">
                  <div className="users-empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <p className="users-empty-title">İstifadəçi tapılmadı</p>
                    <p className="users-empty-hint">Filterləri sıfırlayaraq yenidən cəhd edə bilərsiniz.</p>
                  </div>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="5" className="users-empty-row">
                  <div className="users-empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <p className="users-empty-title">Nəticə tapılmadı</p>
                    <p className="users-empty-hint">Axtarış şərtlərinizə uyğun istifadəçi yoxdur.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredUsers.map((item) => {
                const initial = (item.full_name || item.name || item.username || "?")[0].toUpperCase();
                const roleValue = getUserRoleValue(item);
                const active = isUserActive(item);
                return (
                <tr key={item.id}>
                  <td>
                    <div className="user-name-cell">
                      <span className={`user-avatar user-avatar-${roleValue}${active ? "" : " inactive"}`}>
                        {initial}
                      </span>
                      <span className="user-name-text">{item.full_name || item.name || item.username || "—"}</span>
                    </div>
                  </td>
                  <td>
                    <span className="user-email-text">
                      {item.email ? (
                        <a className="user-email-link" href={`mailto:${item.email}`}>
                          {item.email}
                        </a>
                      ) : (
                        "—"
                      )}
                    </span>
                  </td>
                  <td>
                    <span className={`role-badge role-${roleValue}`}>
                      {getUserRoleLabel(item)}
                    </span>
                  </td>
                  <td>
                    <span className={`user-status-dot status-${active ? "active" : "inactive"}`}>
                      <span className={`user-status-indicator ${active ? "dot-active" : "dot-inactive"}`} />
                      {active ? "Aktiv" : "Deaktiv"}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions users-actions">
                      <button
                        type="button"
                        className="action-btn edit-btn icon-only-btn"
                        onClick={() => startEditUser(item)}
                        aria-label="Redaktə"
                        title="Redaktə"
                      >
                        <ActionIcon name="edit" />
                      </button>

                      {item.id !== user.id && !(!active && item.must_change_password) && (
                        <button
                          className={`action-btn ${
                            active ? "deactivate-btn" : "activate-btn"
                          }`}
                          onClick={() => toggleUserActive(item)}
                        >
                          {active ? "Deaktiv et" : "Aktiv et"}
                        </button>
                      )}

                      {user.role_id === 1 && item.id !== user.id && (
                        <button
                          type="button"
                          className="action-btn password-reset-btn"
                          onClick={() => resetUserPassword(item)}
                          disabled={resetUserPasswordLoadingId === item.id}
                        >
                          {resetUserPasswordLoadingId === item.id
                            ? "Yaradılır..."
                            : active
                              ? "Şifrə sıfırla"
                              : "Aktiv et və şifrə yarat"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );})
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UsersPage;
