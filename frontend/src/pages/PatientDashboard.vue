<template>
  <q-page class="patient-dashboard-page">

    <!-- Background Orbs -->
    <div class="bg-orb orb-1"></div>
    <div class="bg-orb orb-2"></div>
    <div class="bg-orb orb-3"></div>

    <div class="dashboard-container">

      <!-- ═══════════════════════════════════════
           HEADER / HERO SECTION
      ═══════════════════════════════════════ -->
      <div class="dashboard-header">
        <div class="header-left">
          <div class="avatar-section" @click="triggerAvatarUpload">
            <div class="avatar-outer-ring">
              <q-avatar size="76px" class="patient-avatar">
                <img
                  v-if="profileData.profileImage?.url && !avatarErr"
                  :src="profileData.profileImage.url"
                  @error="avatarErr = true"
                />
                <div v-else class="avatar-fallback">
                  <span>{{ getInitials(profileData.name) }}</span>
                </div>
              </q-avatar>
            </div>
            <div class="avatar-cam">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 15.5a3.5 3.5 0 0 1 0-7 3.5 3.5 0 0 1 0 7zm7.5-11H17l-1.5-2h-7L7 4.5H4.5C3.1 4.5 2 5.6 2 7v13c0 1.4 1.1 2.5 2.5 2.5h15c1.4 0 2.5-1.1 2.5-2.5V7c0-1.4-1.1-2.5-2.5-2.5z"/>
              </svg>
            </div>
            <input ref="avatarInputRef" type="file" accept="image/*" class="d-none" @change="handleAvatarUpload" />
          </div>

          <div class="header-info">
            <div class="greeting-badge">
              <div class="badge-dot"></div>
              <span>Patient Portal</span>
            </div>
            <h1 class="welcome-title">
              Hey, <span class="name-highlight">{{ profileData.name?.split(' ')[0] || 'Patient' }}</span> 👋
            </h1>
            <div class="header-meta">
              <span class="meta-chip">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                {{ profileData.patientId || 'Loading...' }}
              </span>
              <span class="meta-chip" v-if="profileData.bloodGroup && profileData.bloodGroup !== 'Unknown'">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z"/></svg>
                {{ profileData.bloodGroup }}
              </span>
              <span class="meta-chip">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                {{ profileData.email || '—' }}
              </span>
            </div>
          </div>
        </div>

        <div class="header-actions">
          <q-btn flat round icon="notifications_none" class="header-icon-btn" @click="showNotifDialog = true">
            <q-badge v-if="unreadCount > 0" color="red" floating rounded style="font-size:9px">{{ unreadCount }}</q-badge>
            <q-tooltip>Notifications</q-tooltip>
          </q-btn>
          <q-btn flat round icon="settings" class="header-icon-btn" @click="activeTab = 'profile'">
            <q-tooltip>Settings</q-tooltip>
          </q-btn>
          <q-btn unelevated class="logout-btn" @click="logout">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
            Logout
          </q-btn>
        </div>
      </div>

      <!-- ═══════════════════════════════════════
           STAT CARDS ROW
      ═══════════════════════════════════════ -->
      <div class="stats-grid">
        <div class="stat-card" v-for="s in statCards" :key="s.label" :class="s.accentClass" @click="s.onClick && s.onClick()">
          <div class="stat-icon-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" v-html="s.icon"></svg>
          </div>
          <div class="stat-content">
            <div class="stat-num">{{ s.value }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
          <div class="stat-arrow" v-if="s.onClick">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════
           QUICK ACTION BUTTONS
      ═══════════════════════════════════════ -->
      <div class="quick-actions-row">
        <div
          class="quick-action-btn"
          v-for="qa in quickActions"
          :key="qa.label"
          :class="qa.colorClass"
          @click="qa.action"
        >
          <div class="qa-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" v-html="qa.icon"></svg>
          </div>
          <div class="qa-text">
            <span class="qa-label">{{ qa.label }}</span>
            <span class="qa-sub">{{ qa.sub }}</span>
          </div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" class="qa-chevron"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
        </div>
      </div>

      <!-- ═══════════════════════════════════════
           MAIN TABS
      ═══════════════════════════════════════ -->
      <div class="tabs-wrapper">
        <div class="custom-tabs">
          <button
            v-for="t in mainTabs"
            :key="t.value"
            class="custom-tab"
            :class="{ active: activeTab === t.value }"
            @click="activeTab = t.value"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" v-html="t.icon"></svg>
            {{ t.label }}
            <span v-if="t.badge" class="tab-badge">{{ t.badge }}</span>
          </button>
        </div>
      </div>

      <!-- ─────────────────────────────────────
           TAB: OVERVIEW
      ───────────────────────────────────── -->
      <div v-show="activeTab === 'overview'" class="tab-content">
        <div class="overview-grid">

          <!-- Health Summary -->
          <div class="ov-card ov-summary">
            <div class="card-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              Health Summary
            </div>
            <div class="summary-rows">
              <div class="summary-row"><span>Full Name</span><span>{{ profileData.name || '—' }}</span></div>
              <div class="summary-row"><span>Patient ID</span><span>{{ profileData.patientId || '—' }}</span></div>
              <div class="summary-row"><span>Age</span><span>{{ calcAge(profileData.dateOfBirth) ? calcAge(profileData.dateOfBirth) + ' yrs' : '—' }}</span></div>
              <div class="summary-row"><span>Gender</span><span class="capitalize">{{ profileData.gender || '—' }}</span></div>
              <div class="summary-row"><span>Blood Group</span><span>{{ profileData.bloodGroup || '—' }}</span></div>
              <div class="summary-row"><span>Phone</span><span>{{ profileData.phone || '—' }}</span></div>
              <div class="summary-row" v-if="profileData.address?.city"><span>City</span><span>{{ profileData.address.city }}</span></div>
              <div class="summary-row last" v-if="profileData.emergencyContact?.name">
                <span>Emergency</span>
                <span>{{ profileData.emergencyContact.name }}</span>
              </div>
            </div>
          </div>

          <!-- Conditions Card -->
          <div class="ov-card ov-conditions">
            <div class="card-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg>
              Medical Conditions
            </div>

            <div class="conditions-section">
              <div class="cond-label">Allergies</div>
              <div class="chip-group" v-if="profileData.allergies?.length">
                <span class="chip chip-red" v-for="a in profileData.allergies" :key="a">{{ a }}</span>
              </div>
              <p class="cond-empty" v-else>None recorded</p>
            </div>

            <div class="conditions-section">
              <div class="cond-label">Chronic Conditions</div>
              <div class="chip-group" v-if="profileData.chronicConditions?.length">
                <span class="chip chip-amber" v-for="c in profileData.chronicConditions" :key="c">{{ c }}</span>
              </div>
              <p class="cond-empty" v-else>None recorded</p>
            </div>
          </div>

          <!-- Recent Prescriptions Preview -->
          <div class="ov-card ov-rx">
            <div class="card-header-flex">
              <div class="card-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z"/></svg>
                Latest Prescriptions
              </div>
              <button class="view-all-btn" @click="activeTab = 'prescriptions'">View all →</button>
            </div>
            <div v-if="!prescriptions.length" class="mini-empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" style="opacity:0.25"><path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z"/></svg>
              <span>No prescriptions yet</span>
            </div>
            <div v-else class="rx-list">
              <div v-for="rx in prescriptions.slice(0, 3)" :key="rx.prescriptionId || rx._id" class="rx-mini-item">
                <div class="rx-dot"></div>
                <div class="rx-info">
                  <span class="rx-title">{{ rx.diagnosis || 'Prescription' }}</span>
                  <span class="rx-sub">Dr. {{ rx.doctorName || '—' }} · {{ fmtDate(rx.issuedAt) }}</span>
                </div>
                <span class="rx-count">{{ rx.medications?.length || 0 }} meds</span>
              </div>
            </div>
          </div>

          <!-- Recent Reports Preview -->
          <div class="ov-card ov-reports-preview">
            <div class="card-header-flex">
              <div class="card-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                Recent Reports
              </div>
              <button class="view-all-btn" @click="activeTab = 'reports'">View all →</button>
            </div>
            <div v-if="!reports.length" class="mini-empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" style="opacity:0.25"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
              <span>No reports uploaded</span>
            </div>
            <div v-else class="report-mini-grid">
              <div
                v-for="r in reports.slice(0, 4)"
                :key="r.reportId"
                class="report-mini-card"
                @click="openFile(r.fileUrl)"
              >
                <div class="report-mini-icon" :class="r.fileType === 'pdf' ? 'icon-red' : 'icon-blue'">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path v-if="r.fileType === 'pdf'" d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/>
                    <path v-else d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                  </svg>
                </div>
                <span class="report-mini-name">{{ r.title }}</span>
                <span class="report-mini-date">{{ fmtDate(r.uploadedAt) }}</span>
              </div>
            </div>
          </div>

          <!-- Upcoming Appointments -->
          <div class="ov-card ov-upcoming">
            <div class="card-header-flex">
              <div class="card-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
                Upcoming Appointments
              </div>
              <button class="view-all-btn" @click="activeTab = 'appointments'">View all →</button>
            </div>
            <div v-if="!upcomingAppointments.length" class="mini-empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" style="opacity:0.25"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
              <span>No upcoming appointments</span>
            </div>
            <div v-else class="upcoming-list">
              <div v-for="ap in upcomingAppointments.slice(0, 3)" :key="ap._id" class="upcoming-item">
                <div class="upcoming-date-box">
                  <span class="up-day">{{ fmtDay(ap.date) }}</span>
                  <span class="up-month">{{ fmtMonth(ap.date) }}</span>
                </div>
                <div class="upcoming-detail">
                  <span class="up-title">{{ ap.patientName || profileData.name }}</span>
                  <span class="up-sub">{{ ap.time }} · {{ ap.appointmentType }} · Queue #{{ ap.queueNumber || '—' }}</span>
                </div>
                <span class="status-pill" :class="statusClass(ap.status)">{{ ap.status }}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- ─────────────────────────────────────
           TAB: PROFILE
      ───────────────────────────────────── -->
      <div v-show="activeTab === 'profile'" class="tab-content">
        <div class="form-card">

          <!-- Avatar Section -->
          <div class="profile-avatar-center">
            <div class="large-avatar-wrap" @click="$refs.avatarInputRef.click()">
              <q-avatar size="100px" class="large-avatar">
                <img v-if="profileData.profileImage?.url && !avatarErr" :src="profileData.profileImage.url" @error="avatarErr = true" />
                <div v-else class="avatar-fallback large-fallback">
                  <span>{{ getInitials(profileData.name) }}</span>
                </div>
              </q-avatar>
              <div class="large-avatar-edit">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 15.5a3.5 3.5 0 0 1 0-7 3.5 3.5 0 0 1 0 7zm7.5-11H17l-1.5-2h-7L7 4.5H4.5C3.1 4.5 2 5.6 2 7v13c0 1.4 1.1 2.5 2.5 2.5h15c1.4 0 2.5-1.1 2.5-2.5V7c0-1.4-1.1-2.5-2.5-2.5z"/></svg>
                Change Photo
              </div>
            </div>
            <div class="profile-name-big">{{ profileData.name }}</div>
            <div class="profile-id-sub">{{ profileData.email }} · {{ profileData.patientId }}</div>
          </div>

          <div class="section-divider"></div>

          <!-- Personal Info Form -->
          <div class="form-section-title">Personal Information</div>
          <div class="form-grid">
            <div class="form-field">
              <label>Full Name</label>
              <q-input v-model="editForm.name" dark outlined dense color="cyan-5" class="neon-input" />
            </div>
            <div class="form-field">
              <label>Phone Number</label>
              <q-input v-model="editForm.phone" dark outlined dense color="cyan-5" class="neon-input" />
            </div>
            <div class="form-field">
              <label>Date of Birth</label>
              <q-input v-model="editForm.dateOfBirth" type="date" dark outlined dense color="cyan-5" class="neon-input" />
            </div>
            <div class="form-field">
              <label>Gender</label>
              <q-select v-model="editForm.gender" :options="['male','female','other']" dark outlined dense color="cyan-5" class="neon-input" />
            </div>
            <div class="form-field">
              <label>Blood Group</label>
              <q-select v-model="editForm.bloodGroup" :options="bloodGroups" dark outlined dense color="cyan-5" class="neon-input" />
            </div>
            <div class="form-field">
              <label>City</label>
              <q-input v-model="editForm.address.city" dark outlined dense color="cyan-5" class="neon-input" />
            </div>
            <div class="form-field">
              <label>District</label>
              <q-input v-model="editForm.address.district" dark outlined dense color="cyan-5" class="neon-input" />
            </div>
            <div class="form-field">
              <label>Postal Code</label>
              <q-input v-model="editForm.address.postalCode" dark outlined dense color="cyan-5" class="neon-input" />
            </div>
          </div>

          <div class="form-section-title" style="margin-top: 28px;">Emergency Contact</div>
          <div class="form-grid">
            <div class="form-field">
              <label>Name</label>
              <q-input v-model="editForm.emergencyContact.name" dark outlined dense color="cyan-5" class="neon-input" />
            </div>
            <div class="form-field">
              <label>Phone</label>
              <q-input v-model="editForm.emergencyContact.phone" dark outlined dense color="cyan-5" class="neon-input" />
            </div>
            <div class="form-field">
              <label>Relationship</label>
              <q-input v-model="editForm.emergencyContact.relationship" dark outlined dense color="cyan-5" class="neon-input" />
            </div>
          </div>

          <div class="form-section-title" style="margin-top: 28px;">Medical History</div>
          <div class="form-grid form-grid-full">
            <div class="form-field">
              <label>Known Allergies</label>
              <q-select v-model="editForm.allergies" multiple use-chips use-input new-value-mode="add-unique" placeholder="Type and press Enter..." dark outlined dense color="cyan-5" class="neon-input" />
            </div>
            <div class="form-field">
              <label>Chronic Conditions</label>
              <q-select v-model="editForm.chronicConditions" multiple use-chips use-input new-value-mode="add-unique" placeholder="Type and press Enter..." dark outlined dense color="cyan-5" class="neon-input" />
            </div>
          </div>

          <div class="form-actions">
            <button class="btn-save" @click="saveProfile" :disabled="savingProfile">
              <span v-if="savingProfile">Saving...</span>
              <span v-else>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="margin-right:6px;vertical-align:-2px"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>
                Save Changes
              </span>
            </button>
          </div>

          <div class="section-divider"></div>

          <!-- Change Password -->
          <div class="form-section-title">Change Password</div>
          <div class="form-grid">
            <div class="form-field">
              <label>Current Password</label>
              <q-input v-model="pwForm.current" type="password" dark outlined dense color="cyan-5" class="neon-input" />
            </div>
            <div class="form-field">
              <label>New Password</label>
              <q-input v-model="pwForm.newPw" type="password" dark outlined dense color="cyan-5" class="neon-input" />
            </div>
            <div class="form-field">
              <label>Confirm New Password</label>
              <q-input v-model="pwForm.confirm" type="password" dark outlined dense color="cyan-5" class="neon-input" />
            </div>
          </div>
          <div class="form-actions">
            <button class="btn-secondary" @click="changePassword" :disabled="changingPw">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="margin-right:6px;vertical-align:-2px"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
              {{ changingPw ? 'Updating...' : 'Update Password' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ─────────────────────────────────────
           TAB: REPORTS
      ───────────────────────────────────── -->
      <div v-show="activeTab === 'reports'" class="tab-content">
        <div class="content-card">
          <div class="content-card-header">
            <div>
              <div class="content-card-title">Medical Reports</div>
              <div class="content-card-sub">{{ reports.length }} document{{ reports.length !== 1 ? 's' : '' }}</div>
            </div>
            <button class="btn-action" @click="uploadDialog = true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/></svg>
              Upload Report
            </button>
          </div>

          <div v-if="!reports.length" class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
            <div class="empty-title">No medical reports</div>
            <div class="empty-sub">Upload your lab results, scans, and medical documents</div>
          </div>

          <div v-else class="reports-list">
            <div v-for="r in reports" :key="r.reportId" class="report-item">
              <div class="report-icon-big" :class="r.fileType === 'pdf' ? 'icon-bg-red' : 'icon-bg-blue'">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path v-if="r.fileType==='pdf'" d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/>
                  <path v-else d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
              </div>
              <div class="report-info">
                <div class="report-title">{{ r.title }}</div>
                <div class="report-desc">{{ r.description || 'No description' }}</div>
                <div class="report-meta">
                  <span class="type-badge" :class="r.fileType === 'pdf' ? 'badge-red' : 'badge-blue'">{{ (r.fileType || 'file').toUpperCase() }}</span>
                  <span class="report-date">{{ fmtDate(r.uploadedAt) }}</span>
                </div>
              </div>
              <div class="report-actions">
                <button class="icon-btn-view" @click="openFile(r.fileUrl)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                  </svg>
                </button>
                <button class="icon-btn-download" @click="openFile(r.fileUrl, true, r.title)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                  </svg>
                </button>
                <button class="icon-btn-del" @click="deleteReport(r.reportId)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ─────────────────────────────────────
           TAB: PRESCRIPTIONS
      ───────────────────────────────────── -->
      <div v-show="activeTab === 'prescriptions'" class="tab-content">
        <div class="content-card">
          <div class="content-card-header">
            <div>
              <div class="content-card-title">Prescriptions</div>
              <div class="content-card-sub">{{ prescriptions.length }} prescription{{ prescriptions.length !== 1 ? 's' : '' }}</div>
            </div>
          </div>

          <div v-if="!prescriptions.length" class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z"/></svg>
            <div class="empty-title">No prescriptions yet</div>
            <div class="empty-sub">Prescriptions issued by your doctors will appear here</div>
          </div>

          <div v-else class="prescriptions-list">
            <div v-for="rx in prescriptions" :key="rx.prescriptionId || rx._id" class="rx-accordion" :class="{ expanded: expandedRx === (rx.prescriptionId || rx._id) }">
              <div class="rx-accordion-header" @click="toggleRx(rx.prescriptionId || rx._id)">
                <div class="rx-header-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-2.18c.07-.44.18-.88.18-1.35C18 2.53 15.48 0 12.35 0c-1.7 0-3.23.72-4.35 1.85C6.98.72 5.45 0 3.75 0 .62 0-1.9 2.53-1.9 4.65c0 .47.11.91.18 1.35H-2v2h2v10h16V8h2V6zm-7.65-4c1.03 0 1.65.62 1.65 1.65S13.38 5.3 12.35 5.3c-1.03 0-1.65-.62-1.65-1.65S11.32 2 12.35 2zM6 16H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V6h2v2zm8 8h-6v-2h6v2zm0-4h-6v-2h6v2zm0-4h-6V6h6v2z"/></svg>
                </div>
                <div class="rx-header-info">
                  <span class="rx-h-title">{{ rx.diagnosis || 'Prescription' }}</span>
                  <span class="rx-h-sub">Dr. {{ rx.doctorName || '—' }} · {{ fmtDate(rx.issuedAt) }}</span>
                </div>
                <span class="rx-count-badge">{{ rx.medications?.length || 0 }} meds</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" class="rx-chevron"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>
              </div>

              <div class="rx-accordion-body" v-if="expandedRx === (rx.prescriptionId || rx._id)">
                <div class="meds-label">Medications</div>
                <div class="meds-grid">
                  <div v-for="(med, i) in rx.medications" :key="i" class="med-card">
                    <div class="med-name">{{ med.name }}</div>
                    <div class="med-chips">
                      <span v-if="med.dosage" class="med-chip">{{ med.dosage }}</span>
                      <span v-if="med.frequency" class="med-chip">{{ med.frequency }}</span>
                      <span v-if="med.duration" class="med-chip">{{ med.duration }}</span>
                    </div>
                    <div v-if="med.notes" class="med-notes">{{ med.notes }}</div>
                  </div>
                </div>
                <div v-if="rx.notes" class="rx-notes-box">
                  <div class="notes-label">Doctor's Notes</div>
                  <div class="notes-text">{{ rx.notes }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ─────────────────────────────────────
           TAB: APPOINTMENTS
      ───────────────────────────────────── -->
      <div v-show="activeTab === 'appointments'" class="tab-content">
        <div class="content-card">
          <div class="content-card-header">
            <div>
              <div class="content-card-title">My Appointments</div>
              <div class="content-card-sub">{{ appointments.length }} total</div>
            </div>
            <button class="btn-action" @click="$router.push('/appointment')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/></svg>
              Book New
            </button>
          </div>

          <!-- Status Filter -->
          <div class="filter-row">
            <button
              v-for="f in apptFilters"
              :key="f.value"
              class="filter-btn"
              :class="{ active: apptFilter === f.value }"
              @click="apptFilter = f.value"
            >{{ f.label }}</button>
          </div>

          <div v-if="!filteredAppts.length" class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
            <div class="empty-title">No appointments found</div>
          </div>

          <div v-else class="appointments-list">
            <div v-for="ap in filteredAppts" :key="ap._id || ap.appointmentId" class="appt-item">
              <div class="appt-date-block">
                <span class="appt-day">{{ fmtDay(ap.date) }}</span>
                <span class="appt-month">{{ fmtMonth(ap.date) }}</span>
              </div>
              <div class="appt-info">
                <div class="appt-title">{{ ap.patientName || profileData.name }}</div>
                <div class="appt-sub">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg>
                  {{ ap.time }} &nbsp;·&nbsp; {{ ap.appointmentType }} &nbsp;·&nbsp; Queue #{{ ap.queueNumber || '—' }}
                </div>
                <div class="appt-payment" v-if="ap.charges?.total">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>
                  LKR {{ ap.charges.total.toLocaleString() }}
                  <span class="pay-badge" :class="ap.paymentStatus === 'PAID' ? 'pay-paid' : 'pay-pending'">{{ ap.paymentStatus }}</span>
                </div>
              </div>
              <div class="appt-right">
                <span class="status-pill" :class="statusClass(ap.status)">{{ ap.status }}</span>
                <div class="appt-btns" v-if="['PENDING','CONFIRMED'].includes(ap.status)">
                  <button class="appt-edit-btn" @click="openEditAppt(ap)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                  </button>
                  <button class="appt-cancel-btn" @click="cancelAppt(ap._id || ap.appointmentId)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- ═══════════════════════════════════════
         UPLOAD REPORT DIALOG
    ═══════════════════════════════════════ -->
    <q-dialog v-model="uploadDialog" persistent>
      <div class="dialog-box">
        <div class="dialog-header">
          <span>Upload Medical Report</span>
          <button class="dialog-close" @click="uploadDialog = false; resetRForm()">✕</button>
        </div>
        <div class="dialog-body">
          <div class="form-field">
            <label>Report Title *</label>
            <q-input v-model="rForm.title" placeholder="e.g. Blood Test Results" dark outlined dense color="cyan-5" class="neon-input" />
          </div>
          <div class="form-field" style="margin-top:14px">
            <label>Description (optional)</label>
            <q-input v-model="rForm.description" type="textarea" rows="2" dark outlined dense color="cyan-5" class="neon-input" />
          </div>
          <div class="form-field" style="margin-top:14px">
            <label>File (PDF or Image, max 10MB) *</label>
            <q-file v-model="rForm.file" dark outlined dense color="cyan-5" class="neon-input" accept=".pdf,.jpg,.jpeg,.png" :max-file-size="10485760">
              <template #prepend><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="color:#22d3ee"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/></svg></template>
            </q-file>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-ghost" @click="uploadDialog = false; resetRForm()">Cancel</button>
          <button class="btn-save" @click="uploadReport" :disabled="uploadingReport">
            {{ uploadingReport ? 'Uploading...' : 'Upload Report' }}
          </button>
        </div>
      </div>
    </q-dialog>

    <!-- ═══════════════════════════════════════
         EDIT APPOINTMENT DIALOG
    ═══════════════════════════════════════ -->
    <q-dialog v-model="editApptDialog" persistent>
      <div class="dialog-box">
        <div class="dialog-header">
          <span>Edit Appointment</span>
          <button class="dialog-close" @click="editApptDialog = false">✕</button>
        </div>
        <div class="dialog-body">
          <div class="form-field">
            <label>New Date</label>
            <q-input v-model="editApptForm.date" type="date" dark outlined dense color="cyan-5" class="neon-input" />
          </div>
          <div class="form-field" style="margin-top:14px">
            <label>New Time</label>
            <q-input v-model="editApptForm.time" type="time" dark outlined dense color="cyan-5" class="neon-input" />
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-ghost" @click="editApptDialog = false">Cancel</button>
          <button class="btn-save" @click="updateAppt" :disabled="updatingAppt">
            {{ updatingAppt ? 'Updating...' : 'Update Appointment' }}
          </button>
        </div>
      </div>
    </q-dialog>

    <!-- DELETE CONFIRM DIALOG -->
    <q-dialog v-model="deleteConfirmDialog" persistent>
      <div class="dialog-box">
        <div class="dialog-header">
          <span>Delete Report</span>
          <button class="dialog-close" @click="deleteConfirmDialog = false">✕</button>
        </div>
        <div class="dialog-body">
          <p style="color:#94a3b8; font-size:14px; margin:0;">
            This report will be permanently deleted. This action cannot be undone.
          </p>
        </div>
        <div class="dialog-footer">
          <button class="btn-ghost" @click="deleteConfirmDialog = false" :disabled="deletingReport">
            Cancel
          </button>
          <button
            class="btn-save"
            style="background: linear-gradient(135deg, #dc2626, #ef4444); min-width: 130px;"
            @click="confirmDelete"
            :disabled="deletingReport"
          >
            <span v-if="deletingReport" style="display:flex;align-items:center;gap:8px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="animation:spin 1s linear infinite">
                <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
              </svg>
              Deleting...
            </span>
            <span v-else>Delete Report</span>
          </button>
        </div>
      </div>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import axios from 'axios'

const router = useRouter()
const $q = useQuasar()

const token = localStorage.getItem('nexus_token')
const storedUser = (() => { try { return JSON.parse(localStorage.getItem('nexus_user') || '{}') } catch { return {} } })()

/* ── State ── */
const activeTab = ref('overview')
const profileData = ref({})
const reports = ref([])
const prescriptions = ref([])
const appointments = ref([])
const avatarErr = ref(false)
const savingProfile = ref(false)
const changingPw = ref(false)
const uploadDialog = ref(false)
const uploadingReport = ref(false)
const editApptDialog = ref(false)
const updatingAppt = ref(false)
const apptFilter = ref('ALL')
const expandedRx = ref(null)
const unreadCount = ref(2)
const avatarInputRef = ref(null)

const bloodGroups = ['A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown']
const apptFilters = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' }
]

const editForm = reactive({
  name: '', phone: '', dateOfBirth: '', gender: '', bloodGroup: '',
  allergies: [], chronicConditions: [],
  address: { street: '', city: '', district: '', postalCode: '' },
  emergencyContact: { name: '', phone: '', relationship: '' }
})
const pwForm = reactive({ current: '', newPw: '', confirm: '' })
const rForm = reactive({ title: '', description: '', file: null })
const editApptForm = reactive({ date: '', time: '', apptId: '' })

/* ── Computed ── */
const upcomingAppointments = computed(() =>
  appointments.value.filter(a => ['PENDING','CONFIRMED'].includes(a.status))
)
const filteredAppts = computed(() =>
  apptFilter.value === 'ALL'
    ? appointments.value
    : appointments.value.filter(a => a.status === apptFilter.value)
)

/* ── Stat Cards ── */
const statCards = computed(() => [
  {
    label: 'Medical Reports',
    value: reports.value.length,
    accentClass: 'stat-blue',
    icon: '<path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>',
    onClick: () => activeTab.value = 'reports'
  },
  {
    label: 'Prescriptions',
    value: prescriptions.value.length,
    accentClass: 'stat-green',
    icon: '<path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z"/>',
    onClick: () => activeTab.value = 'prescriptions'
  },
  {
    label: 'Upcoming Appts',
    value: upcomingAppointments.value.length,
    accentClass: 'stat-purple',
    icon: '<path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>',
    onClick: () => activeTab.value = 'appointments'
  },
  {
    label: 'Total Appointments',
    value: appointments.value.length,
    accentClass: 'stat-amber',
    icon: '<path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>',
    onClick: () => activeTab.value = 'appointments'
  }
])

/* ── Quick Actions ── */
const quickActions = computed(() => [
  {
    label: 'AI Symptom Check',
    sub: 'Get instant AI analysis',
    colorClass: 'qa-blue',
    icon: '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/>',
    action: () => router.push('/symptoms')
  },
  {
    label: 'Video Consultation',
    sub: 'Connect with a doctor',
    colorClass: 'qa-teal',
    icon: '<path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>',
    action: () => {
      const pId = profileData.value.patientId || storedUser.roleId || ''
      router.push(`/patientVideo?patientId=${pId}&patientName=${encodeURIComponent(profileData.value.name || '')}`)
    }
  },
  {
    label: 'Book Appointment',
    sub: 'Find & book a doctor',
    colorClass: 'qa-purple',
    icon: '<path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>',
    action: () => router.push('/appointment')
  }
])

/* ── Tab Defs ── */
const mainTabs = computed(() => [
  { value: 'overview',       label: 'Overview',       icon: '<path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>' },
  { value: 'profile',        label: 'Profile',         icon: '<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>' },
  { value: 'reports',        label: 'Reports',         icon: '<path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>',
    badge: reports.value.length || null },
  { value: 'prescriptions',  label: 'Prescriptions',   icon: '<path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z"/>',
    badge: prescriptions.value.length || null },
  { value: 'appointments',   label: 'Appointments',    icon: '<path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>',
    badge: upcomingAppointments.value.length || null }
])

/* ── Helpers ── */
const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}
const calcAge = (dob) => {
  if (!dob) return null
  const b = new Date(dob), t = new Date()
  let age = t.getFullYear() - b.getFullYear()
  if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) age--
  return age
}
const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const fmtDay   = (d) => d ? new Date(d).getDate() : '—'
const fmtMonth = (d) => d ? new Date(d).toLocaleDateString('en-GB', { month: 'short' }).toUpperCase() : '—'
const openFile = (url, download = false, title = '') => {
  if (!url) return

  if (download) {
    fetch(url)
      .then(res => res.blob())
      .then(blob => {
        // 🔥 title eka use karanna filename widiyata
        const isPdf = url.includes('/raw/upload/') || url.endsWith('.pdf')
        const ext = isPdf ? '.pdf' : ('.' + url.split('.').pop().split('?')[0])
        const fileName = title ? (title + ext) : (url.split('/').pop().split('?')[0])

        const blobUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(blobUrl)
      })
      .catch(() => {
        window.open(url, '_blank', 'noopener,noreferrer')
      })
  } else {
    if (url.includes('/raw/upload/')) {
      const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=false`
      window.open(viewerUrl, '_blank', 'noopener,noreferrer')
    } else {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }
}
const resetRForm = () => { rForm.title = ''; rForm.description = ''; rForm.file = null }
const toggleRx = (id) => { expandedRx.value = expandedRx.value === id ? null : id }
const statusClass = (s) => ({
  PENDING: 'status-pending', VERIFIED: 'status-verified',
  CONFIRMED: 'status-confirmed', COMPLETED: 'status-completed', CANCELLED: 'status-cancelled'
}[s] || 'status-pending')

const notify = (msg, type = 'positive') => $q.notify({ message: msg, color: type === 'positive' ? 'teal-7' : 'red-7', position: 'top-right', timeout: 2500, icon: type === 'positive' ? 'check_circle' : 'error' })

/* ── API ── */
const api     = axios.create({ baseURL: 'http://localhost:5001', headers: { Authorization: `Bearer ${token}` } })
const apptApi = axios.create({ baseURL: 'http://localhost:5003', headers: { Authorization: `Bearer ${token}` } })

const loadProfile = async () => {
  try {
    const { data } = await api.get('/api/patient/profile')
    profileData.value = data.data
    const d = data.data
    editForm.name = d.name || ''
    editForm.phone = d.phone || ''
    editForm.dateOfBirth = d.dateOfBirth ? new Date(d.dateOfBirth).toISOString().split('T')[0] : ''
    editForm.gender = d.gender || ''
    editForm.bloodGroup = d.bloodGroup || ''
    editForm.allergies = d.allergies || []
    editForm.chronicConditions = d.chronicConditions || []
    editForm.address = { street: d.address?.street || '', city: d.address?.city || '', district: d.address?.district || '', postalCode: d.address?.postalCode || '' }
    editForm.emergencyContact = { name: d.emergencyContact?.name || '', phone: d.emergencyContact?.phone || '', relationship: d.emergencyContact?.relationship || '' }
  } catch (e) {
    if (e.response?.status === 401) router.push('/login')
  }
}

const loadReports = async () => {
  try { const { data } = await api.get('/api/patient/reports'); reports.value = data.data } catch (e) {
    console.error(e)
    notify('Failed to load reports', 'negative')
  }
}
const loadPrescriptions = async () => {
  try { const { data } = await api.get('/api/patient/prescriptions'); prescriptions.value = data.data } catch (e) {
    console.error(e)
    notify('Failed to load prescriptions', 'negative')
  }
}
const loadAppointments = async () => {
  try {
    const patId = profileData.value.patientId || storedUser.roleId || ''
    if (!patId) return
    const { data } = await apptApi.get(`/api/appointments/patient/${patId}`)
    appointments.value = (Array.isArray(data) ? data : data.data || []).sort((a, b) => new Date(b.date) - new Date(a.date))
  } catch (e) {
    console.error(e)
    notify('Failed to load appointments', 'negative')
  }
}

/* ── Actions ── */
const saveProfile = async () => {
  savingProfile.value = true
  try {
    await api.put('/api/patient/profile', editForm)
    await loadProfile()
    notify('Profile updated successfully')
  } catch (e) {
    notify(e.response?.data?.message || 'Update failed', 'negative')
  } finally { savingProfile.value = false }
}

const changePassword = async () => {
  if (pwForm.newPw !== pwForm.confirm) { notify('Passwords do not match', 'negative'); return }
  changingPw.value = true
  try {
    await api.patch('/api/auth/change-password', { currentPassword: pwForm.current, newPassword: pwForm.newPw })
    pwForm.current = ''; pwForm.newPw = ''; pwForm.confirm = ''
    notify('Password updated')
  } catch (e) {
    notify(e.response?.data?.message || 'Failed', 'negative')
  } finally { changingPw.value = false }
}

const triggerAvatarUpload = () => { avatarInputRef.value?.click() }

const handleAvatarUpload = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  const fd = new FormData(); fd.append('image', file)
  try {
    await api.post('/api/patient/profile/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    avatarErr.value = false
    await loadProfile()
    notify('Profile photo updated')
  } catch {
    notify('Image upload failed', 'negative')
  }
}

const uploadReport = async () => {
  if (!rForm.title || !rForm.file) { notify('Title and file required', 'negative'); return }
  uploadingReport.value = true
  const fd = new FormData()
  fd.append('report', rForm.file); fd.append('title', rForm.title); fd.append('description', rForm.description)
  try {
    await api.post('/api/patient/reports', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    uploadDialog.value = false; resetRForm()
    await loadReports()
    notify('Report uploaded')
  } catch {
    notify('Upload failed', 'negative')
  } finally { uploadingReport.value = false }
}

const deleteConfirmDialog = ref(false)
const reportToDelete = ref(null)
const deletingReport = ref(false)

const deleteReport = (reportId) => {
  reportToDelete.value = reportId
  deleteConfirmDialog.value = true
}

const confirmDelete = async () => {
  deletingReport.value = true
  try {
    await api.delete(`/api/patient/reports/${reportToDelete.value}`)
    deleteConfirmDialog.value = false
    await loadReports()
    notify('Report deleted')
  } catch (e) {
    console.error(e)
    notify('Delete failed', 'negative')
  } finally {
    deletingReport.value = false
    reportToDelete.value = null
  }
}

const openEditAppt = (ap) => {
  editApptForm.apptId = ap._id || ap.appointmentId
  editApptForm.date = ap.date?.split('T')[0] || ''
  editApptForm.time = ap.time || ''
  editApptDialog.value = true
}

const updateAppt = async () => {
  updatingAppt.value = true
  try {
    await apptApi.put(`/api/appointments/${editApptForm.apptId}`, { date: editApptForm.date, time: editApptForm.time })
    editApptDialog.value = false
    await loadAppointments()
    notify('Appointment updated')
  } catch (e) {
    notify(e.response?.data?.error || 'Update failed', 'negative')
  } finally { updatingAppt.value = false }
}

const cancelAppt = (id) => {
  $q.dialog({ title: 'Cancel Appointment', message: 'Cancel this appointment?', ok: { label: 'Yes, Cancel', color: 'red', flat: true }, cancel: { label: 'Keep It', flat: true }, dark: true })
    .onOk(async () => {
      try { await apptApi.delete(`/api/appointments/${id}`); await loadAppointments(); notify('Appointment cancelled') }
      catch (e) { notify(e.response?.data?.error || 'Cancel failed', 'negative') }
    })
}

const logout = () => {
  localStorage.removeItem('nexus_token')
  localStorage.removeItem('nexus_user')
  router.push('/login')
}

onMounted(async () => {
  if (!token) { router.push('/login'); return }
  if (storedUser.role !== 'patient') { router.push('/'); return }
  await loadProfile()
  await Promise.all([loadReports(), loadPrescriptions(), loadAppointments()])
})
</script>

<style scoped>
/* ════════════════════════════════════════════════════
   GLOBAL
════════════════════════════════════════════════════ */
.patient-dashboard-page {
  background: #060a14;
  min-height: 100vh;
  color: #e2e8f0;
  font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
  position: relative;
  overflow-x: hidden;
}
.d-none { display: none !important; }
.capitalize { text-transform: capitalize; }

/* Orbs */
.bg-orb {
  position: fixed;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
}
.orb-1 { width: 500px; height: 500px; background: rgba(6, 182, 212, 0.06); top: -100px; left: -100px; }
.orb-2 { width: 400px; height: 400px; background: rgba(139, 92, 246, 0.05); top: 300px; right: -80px; }
.orb-3 { width: 350px; height: 350px; background: rgba(16, 185, 129, 0.04); bottom: 100px; left: 30%; }

.dashboard-container {
  position: relative;
  z-index: 1;
  max-width: 1180px;
  margin: 0 auto;
  padding: 24px 20px 80px;
}

/* ════════════════════════════════════════════════════
   HEADER
════════════════════════════════════════════════════ */
.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28px 0 32px;
  gap: 20px;
  flex-wrap: wrap;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 18px;
}

/* Avatar */
.avatar-section {
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
}
.avatar-outer-ring {
  padding: 3px;
  border-radius: 50%;
  background: linear-gradient(135deg, #06b6d4, #8b5cf6);
}
.patient-avatar {
  border: 3px solid #060a14;
  border-radius: 50%;
}
.avatar-fallback {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0e7490, #6d28d9);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  font-weight: 700;
  color: #e2e8f0;
  border-radius: 50%;
}
.avatar-cam {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 22px;
  height: 22px;
  background: #06b6d4;
  border-radius: 50%;
  border: 2px solid #060a14;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

/* Header Info */
.greeting-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(6, 182, 212, 0.1);
  border: 1px solid rgba(6, 182, 212, 0.25);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  color: #22d3ee;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 8px;
}
.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #22d3ee;
  animation: pulse-dot 2s infinite;
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.welcome-title {
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 800;
  margin: 0 0 8px;
  color: #f1f5f9;
  letter-spacing: -0.5px;
}
.name-highlight {
  background: linear-gradient(90deg, #22d3ee, #a78bfa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.header-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 12px;
  color: #94a3b8;
}
.meta-chip svg { color: #64748b; }

/* Header Actions */
.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.header-icon-btn {
  color: #64748b !important;
  transition: color 0.2s, background 0.2s;
}
.header-icon-btn:hover { color: #22d3ee !important; background: rgba(6, 182, 212, 0.1) !important; }
.logout-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(239, 68, 68, 0.1) !important;
  border: 1px solid rgba(239, 68, 68, 0.2) !important;
  color: #f87171 !important;
  border-radius: 10px !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  padding: 8px 14px !important;
  transition: all 0.2s !important;
}
.logout-btn:hover { background: rgba(239, 68, 68, 0.2) !important; }

/* ════════════════════════════════════════════════════
   STAT CARDS
════════════════════════════════════════════════════ */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 20px;
}
@media (max-width: 900px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 500px) { .stats-grid { grid-template-columns: 1fr 1fr; } }

.stat-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 16px;
  padding: 18px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
}
.stat-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  border-radius: 16px 16px 0 0;
}
.stat-card:hover { transform: translateY(-3px); background: rgba(255,255,255,0.06); }
.stat-blue::before { background: linear-gradient(90deg, #06b6d4, #0284c7); }
.stat-blue .stat-icon-box { background: rgba(6,182,212,0.12); color: #22d3ee; }
.stat-green::before { background: linear-gradient(90deg, #10b981, #059669); }
.stat-green .stat-icon-box { background: rgba(16,185,129,0.12); color: #34d399; }
.stat-purple::before { background: linear-gradient(90deg, #8b5cf6, #6d28d9); }
.stat-purple .stat-icon-box { background: rgba(139,92,246,0.12); color: #a78bfa; }
.stat-amber::before { background: linear-gradient(90deg, #f59e0b, #d97706); }
.stat-amber .stat-icon-box { background: rgba(245,158,11,0.12); color: #fbbf24; }

.stat-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-content { flex: 1; min-width: 0; }
.stat-num {
  font-size: 1.6rem;
  font-weight: 800;
  color: #f1f5f9;
  line-height: 1.1;
}
.stat-label {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}
.stat-arrow { color: #334155; transition: color 0.2s; }
.stat-card:hover .stat-arrow { color: #94a3b8; }

/* ════════════════════════════════════════════════════
   QUICK ACTIONS
════════════════════════════════════════════════════ */
.quick-actions-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 28px;
}
@media (max-width: 700px) { .quick-actions-row { grid-template-columns: 1fr; } }

.quick-action-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.07);
  background: rgba(255,255,255,0.02);
  cursor: pointer;
  transition: all 0.25s;
  text-align: left;
}
.quick-action-btn:hover { transform: translateY(-2px); }
.qa-blue { border-color: rgba(6,182,212,0.15); }
.qa-blue:hover { background: rgba(6,182,212,0.08); border-color: rgba(6,182,212,0.3); }
.qa-blue .qa-icon { background: rgba(6,182,212,0.12); color: #22d3ee; }
.qa-teal { border-color: rgba(16,185,129,0.15); }
.qa-teal:hover { background: rgba(16,185,129,0.08); border-color: rgba(16,185,129,0.3); }
.qa-teal .qa-icon { background: rgba(16,185,129,0.12); color: #34d399; }
.qa-purple { border-color: rgba(139,92,246,0.15); }
.qa-purple:hover { background: rgba(139,92,246,0.08); border-color: rgba(139,92,246,0.3); }
.qa-purple .qa-icon { background: rgba(139,92,246,0.12); color: #a78bfa; }

.qa-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.qa-text { flex: 1; min-width: 0; }
.qa-label { display: block; font-size: 14px; font-weight: 700; color: #e2e8f0; }
.qa-sub { display: block; font-size: 12px; color: #64748b; margin-top: 2px; }
.qa-chevron { color: #475569; flex-shrink: 0; }

/* ════════════════════════════════════════════════════
   TABS
════════════════════════════════════════════════════ */
.tabs-wrapper { margin-bottom: 20px; }
.custom-tabs {
  display: flex;
  gap: 4px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 14px;
  padding: 5px;
  overflow-x: auto;
  scrollbar-width: none;
}
.custom-tabs::-webkit-scrollbar { display: none; }

.custom-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  position: relative;
}
.custom-tab:hover { color: #94a3b8; background: rgba(255,255,255,0.05); }
.custom-tab.active {
  background: rgba(6,182,212,0.12);
  color: #22d3ee;
  border: 1px solid rgba(6,182,212,0.2);
}
.tab-badge {
  background: #06b6d4;
  color: #030712;
  font-size: 10px;
  font-weight: 800;
  padding: 1px 5px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

/* ════════════════════════════════════════════════════
   OVERVIEW GRID
════════════════════════════════════════════════════ */
.overview-grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  grid-template-rows: auto auto auto;
  gap: 16px;
}
@media (max-width: 900px) { .overview-grid { grid-template-columns: 1fr; } }

.ov-card {
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 18px;
  padding: 22px;
}
.ov-summary { grid-row: 1 / 3; }
.ov-rx      { grid-column: 2; }
.ov-conditions { grid-column: 2; }
.ov-reports-preview { grid-column: 1 / 3; }
.ov-upcoming { grid-column: 1 / 3; }

@media (max-width: 900px) {
  .ov-summary, .ov-rx, .ov-conditions, .ov-reports-preview, .ov-upcoming {
    grid-column: 1; grid-row: auto;
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #cbd5e1;
  margin-bottom: 16px;
}
.card-header svg { color: #06b6d4; }
.card-header-flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.view-all-btn {
  background: none;
  border: none;
  color: #22d3ee;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  transition: opacity 0.2s;
}
.view-all-btn:hover { opacity: 0.7; }

/* Summary Rows */
.summary-rows { display: flex; flex-direction: column; gap: 0; }
.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  font-size: 13px;
}
.summary-row.last { border-bottom: none; }
.summary-row span:first-child { color: #64748b; }
.summary-row span:last-child { color: #e2e8f0; font-weight: 600; text-align: right; max-width: 60%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Conditions */
.conditions-section { margin-bottom: 16px; }
.conditions-section:last-child { margin-bottom: 0; }
.cond-label {
  font-size: 11px;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 8px;
}
.chip-group { display: flex; flex-wrap: wrap; gap: 6px; }
.chip {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}
.chip-red { background: rgba(239,68,68,0.12); color: #fca5a5; border: 1px solid rgba(239,68,68,0.2); }
.chip-amber { background: rgba(245,158,11,0.12); color: #fcd34d; border: 1px solid rgba(245,158,11,0.2); }
.cond-empty { font-size: 12px; color: #475569; font-style: italic; margin: 0; }

/* Mini Lists */
.mini-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 20px;
  gap: 8px;
  color: #334155;
  font-size: 13px;
}
.rx-list { display: flex; flex-direction: column; gap: 10px; }
.rx-mini-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 10px;
  padding: 10px 12px;
}
.rx-dot { width: 8px; height: 8px; border-radius: 50%; background: #06b6d4; flex-shrink: 0; }
.rx-info { flex: 1; min-width: 0; }
.rx-title { display: block; font-size: 13px; font-weight: 600; color: #e2e8f0; }
.rx-sub { display: block; font-size: 11px; color: #64748b; }
.rx-count { font-size: 11px; font-weight: 700; color: #22d3ee; background: rgba(6,182,212,0.1); padding: 2px 8px; border-radius: 10px; white-space: nowrap; }

/* Report Mini Grid */
.report-mini-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}
.report-mini-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 12px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s;
  text-align: center;
}
.report-mini-card:hover { background: rgba(6,182,212,0.08); border-color: rgba(6,182,212,0.2); transform: translateY(-2px); }
.report-mini-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon-red { background: rgba(239,68,68,0.12); color: #f87171; }
.icon-blue { background: rgba(6,182,212,0.12); color: #22d3ee; }
.report-mini-name { font-size: 12px; font-weight: 600; color: #e2e8f0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%; }
.report-mini-date { font-size: 11px; color: #64748b; }

/* Upcoming */
.upcoming-list { display: flex; flex-direction: column; gap: 10px; }
.upcoming-item {
  display: flex;
  align-items: center;
  gap: 14px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 12px;
  padding: 12px 14px;
  transition: all 0.2s;
}
.upcoming-item:hover { background: rgba(255,255,255,0.04); }
.upcoming-date-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(6,182,212,0.1);
  border: 1px solid rgba(6,182,212,0.15);
  border-radius: 10px;
  padding: 8px 14px;
  min-width: 52px;
}
.up-day { font-size: 1.3rem; font-weight: 800; color: #f1f5f9; line-height: 1; }
.up-month { font-size: 10px; font-weight: 700; color: #22d3ee; text-transform: uppercase; }
.upcoming-detail { flex: 1; min-width: 0; }
.up-title { display: block; font-size: 14px; font-weight: 600; color: #e2e8f0; }
.up-sub { display: block; font-size: 12px; color: #64748b; margin-top: 3px; }

/* Status Pills */
.status-pill {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}
.status-pending  { background: rgba(245,158,11,0.12); color: #fbbf24; border: 1px solid rgba(245,158,11,0.2); }
.status-verified { background: rgba(6,182,212,0.12);  color: #22d3ee; border: 1px solid rgba(6,182,212,0.2); }
.status-confirmed{ background: rgba(16,185,129,0.12); color: #34d399; border: 1px solid rgba(16,185,129,0.2); }
.status-completed{ background: rgba(148,163,184,0.1); color: #94a3b8; border: 1px solid rgba(148,163,184,0.15); }
.status-cancelled{ background: rgba(239,68,68,0.1);   color: #f87171; border: 1px solid rgba(239,68,68,0.15); }

/* ════════════════════════════════════════════════════
   PROFILE FORM
════════════════════════════════════════════════════ */
.form-card {
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 20px;
  padding: 32px;
}
.profile-avatar-center { text-align: center; margin-bottom: 28px; }
.large-avatar-wrap {
  position: relative;
  display: inline-block;
  cursor: pointer;
  margin-bottom: 14px;
}
.large-avatar { border: 3px solid rgba(6,182,212,0.3) !important; }
.large-fallback { font-size: 2rem; font-weight: 800; }
.large-avatar-edit {
  position: absolute;
  bottom: 4px;
  right: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(6,182,212,0.9);
  color: white;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  border: 2px solid #060a14;
}
.profile-name-big { font-size: 1.3rem; font-weight: 800; color: #f1f5f9; }
.profile-id-sub { font-size: 13px; color: #64748b; margin-top: 4px; }

.section-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 28px 0; }
.form-section-title { font-size: 15px; font-weight: 700; color: #cbd5e1; margin-bottom: 16px; }

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
.form-grid-full .form-field { grid-column: 1 / -1; }

.form-field label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 6px;
}

.neon-input :deep(.q-field__control) {
  background: rgba(0,0,0,0.3) !important;
  border-radius: 10px !important;
}
.neon-input :deep(.q-field__control:before) {
  border-color: rgba(255,255,255,0.1) !important;
}
.neon-input :deep(.q-field__control:hover:before) {
  border-color: rgba(6,182,212,0.3) !important;
}

.form-actions { margin-top: 22px; display: flex; justify-content: flex-end; }

.btn-save {
  display: inline-flex;
  align-items: center;
  background: linear-gradient(135deg, #0891b2, #06b6d4);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 11px 24px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-save:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(6,182,212,0.35); }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

.btn-secondary {
  display: inline-flex;
  align-items: center;
  background: rgba(139,92,246,0.12);
  color: #a78bfa;
  border: 1px solid rgba(139,92,246,0.25);
  border-radius: 10px;
  padding: 11px 24px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-secondary:hover { background: rgba(139,92,246,0.2); }
.btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }

/* ════════════════════════════════════════════════════
   REPORTS
════════════════════════════════════════════════════ */
.content-card {
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 20px;
  padding: 28px;
}
.content-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 22px;
  gap: 16px;
  flex-wrap: wrap;
}
.content-card-title { font-size: 18px; font-weight: 800; color: #f1f5f9; }
.content-card-sub { font-size: 13px; color: #64748b; margin-top: 3px; }

.btn-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(6,182,212,0.1);
  color: #22d3ee;
  border: 1px solid rgba(6,182,212,0.25);
  border-radius: 10px;
  padding: 9px 18px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.icon-btn-download {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(16,185,129,0.1);
  color: #34d399;
}
.icon-btn-download:hover { background: rgba(16,185,129,0.2); }

.btn-action:hover { background: rgba(6,182,212,0.2); transform: translateY(-1px); }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 10px;
  text-align: center;
}
.empty-state svg { color: #1e293b; }
.empty-title { font-size: 16px; font-weight: 700; color: #334155; }
.empty-sub { font-size: 13px; color: #1e293b; max-width: 300px; }

.reports-list { display: flex; flex-direction: column; gap: 12px; }
.report-item {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 14px;
  padding: 16px 18px;
  transition: all 0.25s;
}
.report-item:hover { background: rgba(255,255,255,0.04); transform: translateX(4px); }
.report-icon-big {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.icon-bg-red { background: rgba(239,68,68,0.12); color: #f87171; }
.icon-bg-blue { background: rgba(6,182,212,0.12); color: #22d3ee; }
.report-info { flex: 1; min-width: 0; }
.report-title { font-size: 14px; font-weight: 700; color: #e2e8f0; margin-bottom: 3px; }
.report-desc { font-size: 12px; color: #64748b; margin-bottom: 6px; }
.report-meta { display: flex; align-items: center; gap: 8px; }
.type-badge { font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 6px; }
.badge-red { background: rgba(239,68,68,0.12); color: #f87171; }
.badge-blue { background: rgba(6,182,212,0.12); color: #22d3ee; }
.report-date { font-size: 12px; color: #475569; }
.report-actions { display: flex; gap: 6px; flex-shrink: 0; }
.icon-btn-view, .icon-btn-del {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}
.icon-btn-view { background: rgba(6,182,212,0.1); color: #22d3ee; }
.icon-btn-view:hover { background: rgba(6,182,212,0.2); }
.icon-btn-del { background: rgba(239,68,68,0.1); color: #f87171; }
.icon-btn-del:hover { background: rgba(239,68,68,0.2); }

/* ════════════════════════════════════════════════════
   PRESCRIPTIONS
════════════════════════════════════════════════════ */
.prescriptions-list { display: flex; flex-direction: column; gap: 10px; }
.rx-accordion {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 14px;
  overflow: hidden;
  transition: border-color 0.25s;
}
.rx-accordion.expanded { border-color: rgba(6,182,212,0.25); }
.rx-accordion-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  cursor: pointer;
  transition: background 0.2s;
}
.rx-accordion-header:hover { background: rgba(255,255,255,0.03); }
.rx-header-icon {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: rgba(6,182,212,0.1);
  color: #22d3ee;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.rx-header-info { flex: 1; min-width: 0; }
.rx-h-title { display: block; font-size: 14px; font-weight: 700; color: #e2e8f0; }
.rx-h-sub { display: block; font-size: 12px; color: #64748b; }
.rx-count-badge {
  background: rgba(6,182,212,0.1);
  color: #22d3ee;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 10px;
  white-space: nowrap;
}
.rx-chevron { color: #475569; transition: transform 0.25s; flex-shrink: 0; }
.rx-accordion.expanded .rx-chevron { transform: rotate(180deg); }

.rx-accordion-body {
  padding: 16px 16px 20px;
  border-top: 1px solid rgba(255,255,255,0.05);
}
.meds-label {
  font-size: 11px;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 12px;
}
.meds-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
.med-card {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 10px;
  padding: 12px;
}
.med-name { font-size: 13px; font-weight: 700; color: #e2e8f0; margin-bottom: 6px; }
.med-chips { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 4px; }
.med-chip {
  background: rgba(255,255,255,0.05);
  color: #94a3b8;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 6px;
}
.med-notes { font-size: 11px; color: #64748b; font-style: italic; }
.rx-notes-box {
  margin-top: 16px;
  background: rgba(6,182,212,0.06);
  border: 1px solid rgba(6,182,212,0.12);
  border-radius: 10px;
  padding: 14px;
}
.notes-label { font-size: 11px; font-weight: 700; color: #22d3ee; text-transform: uppercase; margin-bottom: 6px; }
.notes-text { font-size: 13px; color: #cbd5e1; }

/* ════════════════════════════════════════════════════
   APPOINTMENTS
════════════════════════════════════════════════════ */
.filter-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.filter-btn {
  padding: 7px 14px;
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.08);
  background: transparent;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.filter-btn:hover { color: #94a3b8; border-color: rgba(255,255,255,0.15); }
.filter-btn.active {
  background: rgba(6,182,212,0.12);
  color: #22d3ee;
  border-color: rgba(6,182,212,0.25);
}

.appointments-list { display: flex; flex-direction: column; gap: 12px; }
.appt-item {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 14px;
  padding: 16px 18px;
  transition: all 0.25s;
  flex-wrap: wrap;
}
.appt-item:hover { background: rgba(255,255,255,0.04); }
.appt-date-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(139,92,246,0.1);
  border: 1px solid rgba(139,92,246,0.15);
  border-radius: 10px;
  padding: 8px 14px;
  min-width: 54px;
  flex-shrink: 0;
}
.appt-day { font-size: 1.4rem; font-weight: 800; color: #f1f5f9; line-height: 1; }
.appt-month { font-size: 10px; font-weight: 700; color: #a78bfa; text-transform: uppercase; }
.appt-info { flex: 1; min-width: 180px; }
.appt-title { font-size: 14px; font-weight: 700; color: #e2e8f0; margin-bottom: 4px; }
.appt-sub { font-size: 12px; color: #64748b; display: flex; align-items: center; gap: 4px; margin-bottom: 4px; }
.appt-sub svg { flex-shrink: 0; }
.appt-payment { font-size: 12px; color: #34d399; display: flex; align-items: center; gap: 6px; }
.pay-badge { font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 6px; }
.pay-paid { background: rgba(16,185,129,0.12); color: #34d399; }
.pay-pending { background: rgba(245,158,11,0.12); color: #fbbf24; }
.appt-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }
.appt-btns { display: flex; gap: 6px; }
.appt-edit-btn, .appt-cancel-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}
.appt-edit-btn { background: rgba(6,182,212,0.1); color: #22d3ee; }
.appt-edit-btn:hover { background: rgba(6,182,212,0.2); }
.appt-cancel-btn { background: rgba(239,68,68,0.1); color: #f87171; }
.appt-cancel-btn:hover { background: rgba(239,68,68,0.2); }

/* ════════════════════════════════════════════════════
   DIALOGS
════════════════════════════════════════════════════ */
.dialog-box {
  background: #0d1526;
  border: 1px solid rgba(6,182,212,0.2);
  border-radius: 18px;
  min-width: min(480px, 95vw);
  overflow: hidden;
}
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  font-size: 16px;
  font-weight: 800;
  color: #f1f5f9;
}
.dialog-close {
  background: rgba(255,255,255,0.05);
  border: none;
  color: #94a3b8;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}
.dialog-close:hover { background: rgba(239,68,68,0.15); color: #f87171; }
.dialog-body { padding: 22px 24px; }
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px 20px;
  border-top: 1px solid rgba(255,255,255,0.06);
}
.btn-ghost {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.1);
  color: #94a3b8;
  border-radius: 10px;
  padding: 9px 18px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-ghost:hover { border-color: rgba(255,255,255,0.2); color: #e2e8f0; }

/* ════════════════════════════════════════════════════
   RESPONSIVE
════════════════════════════════════════════════════ */
@media (max-width: 768px) {
  .dashboard-container { padding: 16px 14px 60px; }
  .dashboard-header { padding: 20px 0 24px; }
  .welcome-title { font-size: 1.4rem; }
  .form-card { padding: 20px; }
  .content-card { padding: 18px; }
  .header-actions .logout-btn span { display: none; }
  .appt-item { gap: 10px; }
}
@media (max-width: 500px) {
  .stats-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
  .quick-actions-row { grid-template-columns: 1fr; }
  .header-left { flex-direction: column; align-items: flex-start; gap: 12px; }
}

</style>