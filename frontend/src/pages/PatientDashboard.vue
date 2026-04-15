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
                  <span class="rx-sub">Dr. {{ rx.doctorName || '—' }} · {{ fmtDate(rx.createdAt || rx.issuedAt) }}</span>
                </div>
                <span class="rx-count">{{ (rx._meds || rx.medicines || rx.medications || []).length }} meds</span>
              </div>
            </div>
          </div>

          <!-- Recent Reports Preview -->
          <div class="ov-card ov-reports-preview">
            <div class="card-header-flex">
              <div class="card-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                Recent Reports
                <span class="ov-section-count" v-if="reports.length">{{ reports.length }}</span>
              </div>
              <div class="ov-header-actions">
                <button class="ov-upload-btn" @click="uploadDialog = true">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/></svg>
                  Upload
                </button>
                <button class="view-all-btn" @click="activeTab = 'reports'">View all →</button>
              </div>
            </div>
            <div v-if="!reports.length" class="ov-mini-empty">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
              <div>
                <div class="ov-empty-title">No reports yet</div>
                <div class="ov-empty-sub">Upload lab results, scans or documents</div>
              </div>
            </div>
            <div v-else class="ov-reports-list">
              <div
                v-for="r in reports.slice(0, 4)"
                :key="r.reportId"
                class="ov-report-row"
                @click="openFile(r.fileUrl)"
              >
                <div class="ov-report-icon" :class="r.fileType === 'pdf' ? 'ov-icon-pdf' : 'ov-icon-img'">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path v-if="r.fileType === 'pdf'" d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/>
                    <path v-else d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                  </svg>
                </div>
                <div class="ov-report-info">
                  <span class="ov-report-name">{{ r.title }}</span>
                  <span class="ov-report-meta">
                    <span class="ov-report-type" :class="r.fileType === 'pdf' ? 'type-pdf' : 'type-img'">{{ (r.fileType || 'FILE').toUpperCase() }}</span>
                    {{ fmtDate(r.uploadedAt) }}
                  </span>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" class="ov-report-arrow"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
              </div>
            </div>
          </div>

          <!-- Upcoming Appointments -->
          <div class="ov-card ov-upcoming">
            <div class="card-header-flex">
              <div class="card-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
                Upcoming Appointments
                <span class="ov-section-count" v-if="upcomingAppointments.length">{{ upcomingAppointments.length }}</span>
              </div>
              <div class="ov-header-actions">
                <button class="ov-book-btn" @click="$router.push('/appointment')">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zm-7-7h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4h-2v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z"/></svg>
                  Book
                </button>
                <button class="view-all-btn" @click="activeTab = 'appointments'">View all →</button>
              </div>
            </div>
            <div v-if="!upcomingAppointments.length" class="ov-mini-empty">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
              <div>
                <div class="ov-empty-title">No upcoming appointments</div>
                <div class="ov-empty-sub">Book a consultation with a doctor</div>
              </div>
            </div>
            <div v-else class="ov-appt-list">
              <div v-for="ap in upcomingAppointments.slice(0, 3)" :key="ap._id" class="ov-appt-row" @click="activeTab = 'appointments'">
                <!-- Date badge -->
                <div class="ov-appt-date" :class="'ov-date-' + ap.status.toLowerCase()">
                  <span class="ov-appt-day">{{ fmtDay(ap.date) }}</span>
                  <span class="ov-appt-mon">{{ fmtMonth(ap.date) }}</span>
                </div>
                <!-- Info -->
                <div class="ov-appt-info">
                  <div class="ov-appt-doctor">
                    <span class="ov-appt-doctor-name">Dr. {{ ap.doctorName || '—' }}</span>
                    <span v-if="ap.doctorSpecialization" class="ov-appt-spec">{{ ap.doctorSpecialization }}</span>
                  </div>
                  <div class="ov-appt-meta">
                    <span class="ov-appt-chip">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {{ ap.time }}
                    </span>
                    <span class="ov-appt-chip" :class="ap.appointmentType === 'ONLINE' ? 'chip-online' : 'chip-physical'">
                      <svg v-if="ap.appointmentType === 'ONLINE'" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                      <svg v-else width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                      {{ ap.appointmentType === 'ONLINE' ? 'Online' : 'In-Person' }}
                    </span>
                    <span class="ov-appt-chip">Queue #{{ ap.queueNumber || '—' }}</span>
                  </div>
                </div>
                <!-- Status + action -->
                <div class="ov-appt-right">
                  <span class="status-pill" :class="statusClass(ap.status)">{{ ap.status }}</span>
                  <button
                    v-if="ap.status === 'CONFIRMED' && ap.paymentStatus !== 'PAID'"
                    class="ov-pay-btn"
                    @click.stop="goToPayment(ap)"
                  >Pay Now</button>
                  <button
                    v-else-if="ap.status === 'CONFIRMED' && ap.appointmentType === 'ONLINE' && ap.paymentStatus === 'PAID'"
                    class="ov-join-btn"
                    @click.stop="joinVideo(ap)"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                    Join
                  </button>
                </div>
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

        <!-- Section header -->
        <div class="rx-section-header">
          <div>
            <h2 class="rx-section-title">Prescription History</h2>
            <p class="rx-section-sub">{{ prescriptions.length }} prescription{{ prescriptions.length !== 1 ? 's' : '' }} on record</p>
          </div>
          <div class="rx-header-pills">
            <span class="rx-pill-active"><span class="rx-pill-dot"></span>{{ prescriptions.filter(r => r.status === 'active').length }} Active</span>
            <span class="rx-pill-total">{{ prescriptions.length }} Total</span>
          </div>
        </div>

        <!-- Empty -->
        <div v-if="!prescriptions.length" class="rx-empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>
          <p class="rx-empty-title">No prescriptions yet</p>
          <p class="rx-empty-sub">Your doctor's prescriptions will appear here after consultations</p>
        </div>

        <!-- Prescription documents -->
        <div v-else class="rx-doc-list">
          <div
            v-for="rx in prescriptions"
            :key="rx._id || rx.prescriptionId"
            class="rx-doc"
          >
            <!-- ── Prescription document card ── -->
            <div class="rx-doc-inner">

              <!-- Clinic letterhead -->
              <div class="rx-letterhead">
                <div class="rx-letterhead-left">
                  <div class="rx-clinic-logo">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg>
                  </div>
                  <div>
                    <div class="rx-clinic-name">NexusCare</div>
                    <div class="rx-clinic-sub">Electronic Medical Record System</div>
                  </div>
                </div>
                <div class="rx-letterhead-right">
                  <div class="rx-rx-symbol">℞</div>
                  <div class="rx-doc-meta">
                    <span>Ref: {{ String(rx._id || rx.prescriptionId || '').slice(-8).toUpperCase() || 'N/A' }}</span>
                    <span>{{ fmtDate(rx.createdAt) }}</span>
                  </div>
                </div>
              </div>

              <div class="rx-letterhead-rule"></div>

              <!-- Patient + Doctor strip -->
              <div class="rx-info-strip">
                <div class="rx-info-strip-col">
                  <span class="rx-strip-label">Patient</span>
                  <span class="rx-strip-name">{{ profileData.name || '—' }}</span>
                  <span class="rx-strip-detail">{{ profileData.patientId || '—' }} &nbsp;·&nbsp; {{ profileData.gender || '—' }} &nbsp;·&nbsp; {{ profileData.bloodGroup || '—' }}</span>
                </div>
                <div class="rx-info-strip-divider"></div>
                <div class="rx-info-strip-col">
                  <span class="rx-strip-label">Physician</span>
                  <span class="rx-strip-name">{{ rx.doctorName || 'Dr. Unknown' }}</span>
                  <span class="rx-strip-detail">NexusCare Registered Physician</span>
                </div>
                <div class="rx-info-strip-divider"></div>
                <div class="rx-info-strip-col">
                  <span class="rx-strip-label">Status</span>
                  <span class="rx-strip-status" :class="rx.status === 'active' ? 'strip-active' : rx.status === 'cancelled' ? 'strip-cancelled' : 'strip-done'">
                    <span class="strip-dot"></span>{{ rx.status || 'active' }}
                  </span>
                  <span v-if="rx.followUpDate" class="rx-strip-detail">Follow-up: {{ fmtDate(rx.followUpDate) }}</span>
                </div>
              </div>

              <!-- Diagnosis -->
              <div class="rx-diagnosis-block">
                <span class="rx-diag-label">Diagnosis</span>
                <span class="rx-diag-text">{{ rx.diagnosis || 'General Prescription' }}</span>
              </div>

              <!-- Symptoms -->
              <div v-if="rx.symptoms && (Array.isArray(rx.symptoms) ? rx.symptoms.length : rx.symptoms)" class="rx-symptoms-block">
                <span class="rx-block-label">Presenting Symptoms</span>
                <div class="rx-sym-tags">
                  <template v-if="Array.isArray(rx.symptoms)">
                    <span v-for="s in rx.symptoms" :key="s" class="rx-sym-tag">{{ s }}</span>
                  </template>
                  <template v-else>
                    <span v-for="s in rx.symptoms.split(',')" :key="s" class="rx-sym-tag">{{ s.trim() }}</span>
                  </template>
                </div>
              </div>

              <!-- Medicines table -->
              <div class="rx-meds-block">
                <span class="rx-block-label">Prescribed Medications</span>
                <div class="rx-meds-table">
                  <!-- Header -->
                  <div class="rx-meds-thead">
                    <span class="rxt-num">#</span>
                    <span class="rxt-name">Medicine</span>
                    <span class="rxt-dose">Dosage</span>
                    <span class="rxt-freq">Frequency</span>
                    <span class="rxt-dur">Duration</span>
                    <span class="rxt-inst">Instructions</span>
                  </div>
                  <!-- Rows -->
                  <div
                    v-for="(med, mi) in rx._meds"
                    :key="mi"
                    class="rx-meds-row"
                    :class="{ 'rx-meds-row--alt': mi % 2 !== 0 }"
                  >
                    <span class="rxt-num">{{ mi + 1 }}</span>
                    <span class="rxt-name rxt-name--val">{{ typeof med === 'string' ? med : (med.name || '—') }}</span>
                    <span class="rxt-dose">{{ typeof med === 'string' ? '—' : (med.dosage || '—') }}</span>
                    <span class="rxt-freq">{{ typeof med === 'string' ? '—' : (med.frequency || '—') }}</span>
                    <span class="rxt-dur rxt-dur--val">{{ typeof med === 'string' ? '—' : (med.duration || '—') }}</span>
                    <span class="rxt-inst">{{ typeof med === 'string' ? '—' : (med.instructions || med.notes || '—') }}</span>
                  </div>
                </div>
              </div>

              <!-- Advice + Notes -->
              <div class="rx-notes-strip" v-if="rx.advice || rx.notes">
                <div v-if="rx.advice" class="rx-notes-box rx-notes-box--advice">
                  <div class="rx-notes-label">Doctor's Advice</div>
                  <p class="rx-notes-text">{{ rx.advice }}</p>
                </div>
                <div v-if="rx.notes" class="rx-notes-box rx-notes-box--notes">
                  <div class="rx-notes-label">Clinical Notes</div>
                  <p class="rx-notes-text">{{ rx.notes }}</p>
                </div>
              </div>

              <!-- Signature + actions row -->
              <div class="rx-doc-footer">
                <div class="rx-sig-area">
                  <div class="rx-sig-line"></div>
                  <div class="rx-sig-name">{{ rx.doctorName || 'Physician' }}</div>
                  <div class="rx-sig-sub">Authorized Signature</div>
                </div>
                <div class="rx-doc-footer-right">
                  <span class="rx-emr-stamp">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
                    Digitally issued · NexusCare EMR
                  </span>
                  <button class="rx-dl-btn" @click="downloadRx(rx)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                    Download PDF
                  </button>
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

          <!-- Header -->
          <div class="appt-tab-header">
            <div class="appt-tab-title-group">
              <div class="content-card-title">My Appointments</div>
              <div class="content-card-sub">{{ appointments.length }} total · {{ upcomingAppointments.length }} upcoming</div>
            </div>
            <button class="btn-book-new" @click="$router.push('/appointment')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zm-7-7h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4h-2v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z"/></svg>
              Book Appointment
            </button>
          </div>

          <!-- Filter tabs -->
          <div class="appt-filter-tabs">
            <button
              v-for="f in apptFiltersComputed"
              :key="f.value"
              class="appt-filter-tab"
              :class="{ active: apptFilter === f.value, ['tab-' + f.value.toLowerCase()]: true }"
              @click="apptFilter = f.value"
            >
              {{ f.label }}
              <span class="appt-filter-count">{{ f.count }}</span>
            </button>
          </div>

          <!-- Loading -->
          <div v-if="loadingAppts" class="appt-loading">
            <q-spinner-dots color="cyan-5" size="2em" />
            <span>Loading appointments...</span>
          </div>

          <!-- Empty -->
          <div v-else-if="!filteredAppts.length" class="appt-empty">
            <div class="appt-empty-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
            </div>
            <div class="appt-empty-title">No {{ apptFilter === 'ALL' ? '' : apptFilter.toLowerCase() + ' ' }}appointments</div>
            <div class="appt-empty-sub" v-if="apptFilter === 'ALL'">Book your first appointment to get started</div>
            <button v-if="apptFilter === 'ALL'" class="btn-book-new" style="margin-top:12px" @click="$router.push('/appointment')">Book Now</button>
          </div>

          <!-- Appointment cards -->
          <div v-else class="appointments-list">
            <div
              v-for="ap in filteredAppts"
              :key="ap._id || ap.appointmentId"
              class="appt-card"
              :class="['appt-status-' + ap.status.toLowerCase(), { 'appt-cancelled-dim': ap.status === 'CANCELLED' }]"
            >
              <!-- Status accent bar -->
              <div class="appt-accent-bar" :class="'accent-' + ap.status.toLowerCase()"></div>

              <!-- Date column -->
              <div class="appt-date-col">
                <span class="appt-day">{{ fmtDay(ap.date) }}</span>
                <span class="appt-month">{{ fmtMonth(ap.date) }}</span>
                <span class="appt-year">{{ ap.date ? new Date(ap.date).getFullYear() : '' }}</span>
              </div>

              <!-- Main content -->
              <div class="appt-body">

                <!-- Doctor info row -->
                <div class="appt-row-top">
                  <div class="appt-doctor-avatar" v-if="ap.doctorProfileImage">
                    <img :src="ap.doctorProfileImage" :alt="ap.doctorName" @error="e => e.target.style.display='none'" />
                  </div>
                  <div class="appt-doctor-avatar appt-doctor-avatar-fallback" v-else>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                  </div>
                  <div class="appt-doctor-info">
                    <div class="appt-doctor-name">Dr. {{ ap.doctorName || doctorNames[ap.doctorId] || 'Unknown Physician' }}</div>
                    <div v-if="ap.doctorSpecialization" class="appt-specialization">{{ ap.doctorSpecialization }}</div>
                  </div>
                  <span class="appt-type-badge" :class="ap.appointmentType === 'ONLINE' ? 'type-online' : 'type-physical'">
                    <svg v-if="ap.appointmentType === 'ONLINE'" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                    <svg v-else width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                    {{ ap.appointmentType === 'ONLINE' ? 'Online' : 'In-Person' }}
                  </span>
                </div>

                <!-- Location / mode row -->
                <div class="appt-location-row">
                  <template v-if="ap.appointmentType === 'PHYSICAL'">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="color:#a78bfa;flex-shrink:0"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                    <span class="appt-location-text">{{ ap.doctorHospital || ap.venue || 'Hospital not specified' }}</span>
                  </template>
                  <template v-else>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="color:#60a5fa;flex-shrink:0"><path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/></svg>
                    <span class="appt-location-text" style="color:#60a5fa">Video Consultation</span>
                  </template>
                  <span class="appt-id-chip">
                    APT-{{ (ap.appointmentId || ap._id?.slice(-6) || '——').toUpperCase() }}
                  </span>
                </div>

                <!-- Time · Queue · Patient chips -->
                <div class="appt-meta-chips">
                  <span class="meta-chip">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {{ ap.time }}
                  </span>
                  <span class="meta-chip">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    Queue #{{ ap.queueNumber || '—' }}
                  </span>
                  <span class="meta-chip" v-if="ap.patientName">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    {{ ap.patientName }}
                  </span>
                </div>

                <!-- Fee summary row -->
                <div class="appt-fee-row" v-if="ap.charges?.total">
                  <div class="fee-breakdown">
                    <span class="fee-item-sm">
                      <span class="fee-lbl">Doctor</span>
                      <span class="fee-amt">LKR {{ (ap.charges.doctorFee || 0).toLocaleString() }}</span>
                    </span>
                    <span class="fee-plus">+</span>
                    <span class="fee-item-sm" v-if="ap.appointmentType === 'PHYSICAL' && ap.charges.hospitalFee">
                      <span class="fee-lbl">Hospital</span>
                      <span class="fee-amt">LKR {{ ap.charges.hospitalFee.toLocaleString() }}</span>
                    </span>
                    <span class="fee-plus" v-if="ap.appointmentType === 'PHYSICAL' && ap.charges.hospitalFee">+</span>
                    <span class="fee-item-sm">
                      <span class="fee-lbl">Service</span>
                      <span class="fee-amt">LKR {{ (ap.charges.serviceFee || 0).toLocaleString() }}</span>
                    </span>
                  </div>
                  <div class="fee-total-group">
                    <span class="fee-total-label">Total</span>
                    <span class="fee-total-amt">LKR {{ ap.charges.total.toLocaleString() }}</span>
                    <span class="pay-badge" :class="ap.paymentStatus === 'PAID' ? 'pay-paid' : 'pay-pending'">
                      {{ ap.paymentStatus === 'PAID' ? '✓ Paid' : 'Unpaid' }}
                    </span>
                  </div>
                </div>

                <!-- Cancellation reason -->
                <div v-if="ap.status === 'CANCELLED' && ap.rejectionReason" class="appt-rejection">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Reason: {{ ap.rejectionReason }}
                </div>
              </div>

              <!-- Right: status badge + CTA buttons -->
              <div class="appt-right-col">
                <span class="status-pill" :class="statusClass(ap.status)">
                  {{ ap.status === 'CONFIRMED' ? 'Confirmed' : ap.status === 'PENDING' ? 'Pending' : ap.status === 'COMPLETED' ? 'Completed' : ap.status === 'CANCELLED' ? 'Cancelled' : ap.status }}
                </span>

                <div class="appt-actions">
                  <!-- PENDING: waiting for doctor confirmation -->
                  <template v-if="ap.status === 'PENDING'">
                    <div class="appt-hint">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      Awaiting confirmation
                    </div>
                    <button class="btn-cancel-appt" @click="cancelAppt(ap._id || ap.appointmentId)">
                      Cancel
                    </button>
                  </template>

                  <!-- CONFIRMED + unpaid: prompt payment -->
                  <template v-else-if="ap.status === 'CONFIRMED' && ap.paymentStatus !== 'PAID'">
                    <div class="appt-hint appt-hint-warn">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      Payment required
                    </div>
                    <button class="btn-pay" @click="goToPayment(ap)">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                      Pay Now
                    </button>
                  </template>

                  <!-- CONFIRMED + paid: receipt + join -->
                  <template v-else-if="ap.status === 'CONFIRMED' && ap.paymentStatus === 'PAID'">
                    <button class="btn-receipt" @click="viewReceipt(ap)">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      Receipt
                    </button>
                    <button v-if="ap.appointmentType === 'ONLINE'" class="btn-join" @click="joinVideo(ap)">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                      Join Call
                    </button>
                  </template>

                  <!-- COMPLETED -->
                  <template v-else-if="ap.status === 'COMPLETED'">
                    <button class="btn-receipt" @click="viewReceipt(ap)">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      Receipt
                    </button>
                  </template>

                  <!-- CANCELLED -->
                  <template v-else-if="ap.status === 'CANCELLED'">
                    <div class="appt-hint appt-hint-cancel">Appointment cancelled</div>
                  </template>
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

    <!-- CANCEL APPOINTMENT DIALOG -->
    <q-dialog v-model="cancelApptDialog" persistent>
      <div class="dialog-box">
        <div class="dialog-header">
          <span>Cancel Appointment</span>
          <button class="dialog-close" @click="cancelApptDialog = false">✕</button>
        </div>
        <div class="dialog-body">
          <p style="color:#94a3b8; font-size:14px; margin:0;">
            Are you sure you want to cancel this appointment? This action cannot be undone.
          </p>
        </div>
        <div class="dialog-footer">
          <button class="btn-ghost" @click="cancelApptDialog = false" :disabled="cancellingAppt">
            Keep It
          </button>
          <button
            class="btn-save"
            style="background: linear-gradient(135deg, #dc2626, #ef4444); min-width: 140px;"
            @click="confirmCancelAppt"
            :disabled="cancellingAppt"
          >
            <span v-if="cancellingAppt" style="display:flex;align-items:center;gap:8px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="animation:spin 1s linear infinite">
                <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
              </svg>
              Cancelling...
            </span>
            <span v-else>Yes, Cancel</span>
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
const unreadCount = ref(2)
const avatarInputRef = ref(null)

const loadingAppts = ref(false)   // ← NEW (was missing)
const doctorNames  = ref({})      // ← NEW (for resolving doctorId → name)

const bloodGroups = ['A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown']


const apptFiltersComputed = computed(() => {
  const counts = { ALL: appointments.value.length }
  appointments.value.forEach(a => {
    counts[a.status] = (counts[a.status] || 0) + 1
  })
  return [
    { label: 'All',       value: 'ALL',       count: counts.ALL },
    { label: 'Pending',   value: 'PENDING',   count: counts.PENDING   || 0 },
    { label: 'Confirmed', value: 'CONFIRMED', count: counts.CONFIRMED || 0 },
    { label: 'Completed', value: 'COMPLETED', count: counts.COMPLETED || 0 },
    { label: 'Cancelled', value: 'CANCELLED', count: counts.CANCELLED || 0 }
  ].filter(f => f.value === 'ALL' || f.count > 0)
})
 
const filteredAppts = computed(() => {
  const sorted = [...appointments.value].sort((a, b) => new Date(b.date) - new Date(a.date))
  return apptFilter.value === 'ALL'
    ? sorted
    : sorted.filter(a => a.status === apptFilter.value)
})

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

/* ── PDF Download ── */
const downloadRx = async (rx) => {
  const { generatePrescriptionPDF } = await import('../utils/generatePrescriptionPDF.js')
  await generatePrescriptionPDF(rx, profileData.value, calcAge, fmtDate)
}

const statusClass = (s) => ({
  PENDING: 'status-pending', VERIFIED: 'status-verified',
  CONFIRMED: 'status-confirmed', COMPLETED: 'status-completed', CANCELLED: 'status-cancelled'
}[s] || 'status-pending')

const notify = (msg, type = 'positive') => $q.notify({ message: msg, color: type === 'positive' ? 'teal-7' : 'red-7', position: 'top-right', timeout: 2500, icon: type === 'positive' ? 'check_circle' : 'error' })

/* ── API ── */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'
const api     = axios.create({ baseURL: API_URL, headers: { Authorization: `Bearer ${token}` } })
const apptApi = axios.create({ baseURL: API_URL, headers: { Authorization: `Bearer ${token}` } })

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
  try {
    const patId = profileData.value.patientId || storedUser.roleId || ''
    if (!patId) return
    // Use doctor-service endpoint — has medicines, symptoms, advice, followUpDate
    const { data } = await api.get(`/api/prescriptions/${patId}`)
    prescriptions.value = (data.data || []).map(rx => ({
      ...rx,
      // normalise: both 'medicines' (doctor-service) and 'medications' (patient-service)
      _meds: rx.medicines || rx.medications || []
    }))
  } catch (e) {
    console.error(e)
    notify('Failed to load prescriptions', 'negative')
  }
}
const loadAppointments = async () => {
  loadingAppts.value = true
  try {
    const patId = profileData.value.patientId || storedUser.roleId || ''
    if (!patId) return
 
    const { data } = await apptApi.get(`/api/appointments/patient/${patId}`)
    const appts = (Array.isArray(data) ? data : data.data || [])
      .sort((a, b) => new Date(b.date) - new Date(a.date))

    // ── Resolve channelling hospital names from hospitalId ───────
    // Always resolve for PHYSICAL appointments — venue = channelling hospital selected by patient
    try {
      const physicalAppts = appts.filter(a => a.hospitalId && a.appointmentType === 'PHYSICAL')
      if (physicalAppts.length > 0) {
        const hRes = await apptApi.get('/api/hospitals')
        const hospitals = hRes.data?.data || hRes.data || []
        const hospitalMap = {}
        hospitals.forEach(h => {
          if (h.hospitalId) hospitalMap[h.hospitalId] = h.name
          if (h._id) hospitalMap[h._id] = h.name
        })
        appts.forEach(a => {
          if (a.hospitalId && hospitalMap[a.hospitalId]) {
            a.venue = hospitalMap[a.hospitalId]  // always overwrite with authoritative name
          }
        })
      }
    } catch { /* hospital service down — keep existing venue value */ }

    appointments.value = appts
 
    // ── Resolve doctor names from payment history ───────
    try {
      const payApi = axios.create({
        baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
        headers: { Authorization: `Bearer ${token}` }
      })
      const pRes = await payApi.get('/api/payments/my')
      const payments = pRes.data?.data || []
      payments.forEach(p => {
        if (p.doctorId && p.doctorName) {
          doctorNames.value[p.doctorId] = p.doctorName
        }
      })
    } catch { /* payment service down — ignore */ }
 
  } catch (e) {
    console.error(e)
    notify('Failed to load appointments', 'negative')
  } finally {
    loadingAppts.value = false
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

// const openEditAppt = (ap) => {
//   editApptForm.apptId = ap._id || ap.appointmentId
//   editApptForm.date = ap.date?.split('T')[0] || ''
//   editApptForm.time = ap.time || ''
//   editApptDialog.value = true
// }

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

const cancelApptDialog = ref(false)
const apptToCancel = ref(null)
const cancellingAppt = ref(false)

const cancelAppt = (id) => {
  apptToCancel.value = id
  cancelApptDialog.value = true
}

const confirmCancelAppt = async () => {
  cancellingAppt.value = true
  try {
    await apptApi.delete(`/api/appointments/${apptToCancel.value}`)
    cancelApptDialog.value = false
    await loadAppointments()
    notify('Appointment cancelled')
  } catch (e) {
    console.error('Cancel error:', e.response?.data || e.message)
    notify(e.response?.data?.error || e.response?.data?.message || 'Cancel failed', 'negative')
  } finally {
    cancellingAppt.value = false
    apptToCancel.value = null
  }
}

onMounted(async () => {
  if (!token) { router.push('/login'); return }
  if (storedUser.role !== 'patient') { router.push('/'); return }
  await loadProfile()
  await Promise.all([loadReports(), loadPrescriptions(), loadAppointments()])
})


// (goToPayment + viewReceipt — the dashboard appt tab needs them)
 
const goToPayment = (ap) => {
  const resolvedDoctorName = doctorNames.value[ap.doctorId] || ap.doctorName || ''
  localStorage.setItem('appointmentId',   ap._id)
  localStorage.setItem('doctorName',      resolvedDoctorName)
  localStorage.setItem('amount',          ap.charges?.total || 0)
  localStorage.setItem('doctorFee',       ap.charges?.doctorFee   || 0)
  localStorage.setItem('hospitalFee',     ap.charges?.hospitalFee || 0)
  localStorage.setItem('serviceFee',      ap.charges?.serviceFee  || 0)
  localStorage.setItem('appointmentType', ap.appointmentType || 'PHYSICAL')
  localStorage.setItem('date',            ap.date)
  localStorage.setItem('time',            ap.time)
  localStorage.setItem('queueNumber',     ap.queueNumber || '-')
 
  router.push({
    path: '/appointment/payment',
    query: {
      appointmentId: ap._id,
      doctorId:      ap.doctorId,
      doctorName:    doctorNames.value[ap.doctorId] || ap.doctorName || '',
      doctorFee:     ap.charges?.doctorFee   || 0,
      hospitalFee:   ap.charges?.hospitalFee || 0,
      serviceFee:    ap.charges?.serviceFee  || 0,
      date:          ap.date,
      time:          ap.time,
      type:          ap.appointmentType
    }
  })
}
 
const viewReceipt = async (ap) => {
  try {
    const payApi = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
      headers: { Authorization: `Bearer ${token}` }
    })
    const { data } = await payApi.get('/api/payments/my')
    const payments = data.data || []
    const matched  = payments.find(p =>
      p.appointmentId === ap._id || p.appointmentId === ap.appointmentId
    )
    if (matched?.orderId) {
      router.push(`/receipt/${matched.orderId}`)
    } else {
      router.push('/appointment/payment')
    }
  } catch {
    router.push('/appointment/payment')
  }
}
 
const joinVideo = (ap) => {
  router.push({
    path: '/patientVideo',
    query: {
      appointmentId: ap._id,
      patientId:     profileData.value.patientId || '',
      patientName:   encodeURIComponent(profileData.value.name || ''),
      doctorId:      ap.doctorId
    }
  })
}


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

/* Mini Lists — kept for prescriptions preview */
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

/* Report Mini Grid — kept for reference, replaced by ov-reports-list */

/* ── Overview: shared header extras ── */
.ov-section-count {
  background: rgba(6,182,212,0.15);
  color: #22d3ee;
  font-size: 10px;
  font-weight: 800;
  padding: 1px 7px;
  border-radius: 10px;
  margin-left: 4px;
}
.ov-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ov-upload-btn, .ov-book-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  padding: 5px 11px;
  border-radius: 7px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}
.ov-upload-btn {
  background: rgba(6,182,212,0.1);
  color: #22d3ee;
  border: 1px solid rgba(6,182,212,0.2);
}
.ov-upload-btn:hover { background: rgba(6,182,212,0.2); }
.ov-book-btn {
  background: rgba(139,92,246,0.1);
  color: #a78bfa;
  border: 1px solid rgba(139,92,246,0.2);
}
.ov-book-btn:hover { background: rgba(139,92,246,0.2); }

/* ── Overview: empty state ── */
.ov-mini-empty {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 22px 8px;
  color: #334155;
}
.ov-mini-empty svg { flex-shrink: 0; opacity: 0.3; }
.ov-empty-title { font-size: 13px; font-weight: 600; color: #475569; }
.ov-empty-sub { font-size: 11px; color: #334155; margin-top: 2px; }

/* ── Overview: Reports list ── */
.ov-reports-list { display: flex; flex-direction: column; gap: 2px; }
.ov-report-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 8px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.18s;
}
.ov-report-row:hover { background: rgba(255,255,255,0.04); }
.ov-report-icon {
  width: 36px; height: 36px;
  border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.ov-icon-pdf { background: rgba(239,68,68,0.1); color: #f87171; }
.ov-icon-img { background: rgba(6,182,212,0.1); color: #22d3ee; }
.ov-report-info { flex: 1; min-width: 0; }
.ov-report-name {
  display: block;
  font-size: 13px; font-weight: 600; color: #e2e8f0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.ov-report-meta {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; color: #64748b; margin-top: 2px;
}
.ov-report-type {
  font-size: 9px; font-weight: 800;
  padding: 1px 6px; border-radius: 4px;
}
.type-pdf { background: rgba(239,68,68,0.1); color: #f87171; }
.type-img { background: rgba(6,182,212,0.1); color: #22d3ee; }
.ov-report-arrow { color: #1e293b; flex-shrink: 0; transition: color 0.2s; }
.ov-report-row:hover .ov-report-arrow { color: #475569; }

/* ── Overview: Upcoming Appointments list ── */
.ov-appt-list { display: flex; flex-direction: column; gap: 6px; }
.ov-appt-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 10px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.04);
  background: rgba(255,255,255,0.015);
  cursor: pointer;
  transition: all 0.2s;
}
.ov-appt-row:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.08); }

.ov-appt-date {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-width: 46px; padding: 8px 10px;
  border-radius: 10px;
  flex-shrink: 0;
}
.ov-date-pending   { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); }
.ov-date-confirmed { background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2); }
.ov-date-verified  { background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.2); }
.ov-appt-day  { font-size: 1.25rem; font-weight: 900; color: #f1f5f9; line-height: 1; }
.ov-appt-mon  { font-size: 9px; font-weight: 700; color: #818cf8; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }

.ov-appt-info { flex: 1; min-width: 0; }
.ov-appt-doctor { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; margin-bottom: 5px; }
.ov-appt-doctor-name { font-size: 13.5px; font-weight: 700; color: #e2e8f0; }
.ov-appt-spec { font-size: 11px; color: #38bdf8; font-weight: 600; }
.ov-appt-meta { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
.ov-appt-chip {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 600; color: #64748b;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.06);
  padding: 3px 8px; border-radius: 6px;
}
.chip-online   { color: #60a5fa; background: rgba(59,130,246,0.08); border-color: rgba(59,130,246,0.15); }
.chip-physical { color: #a78bfa; background: rgba(139,92,246,0.08); border-color: rgba(139,92,246,0.15); }

.ov-appt-right {
  display: flex; flex-direction: column; align-items: flex-end; gap: 6px;
  flex-shrink: 0;
}
.ov-pay-btn {
  font-size: 11px; font-weight: 700;
  padding: 5px 12px; border-radius: 7px; border: none;
  background: linear-gradient(135deg, #1d4ed8, #3b82f6);
  color: #fff; cursor: pointer; transition: all 0.2s;
  white-space: nowrap;
}
.ov-pay-btn:hover { filter: brightness(1.1); }
.ov-join-btn {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 700;
  padding: 5px 12px; border-radius: 7px; border: none;
  background: linear-gradient(135deg, #059669, #10b981);
  color: #fff; cursor: pointer; transition: all 0.2s;
  white-space: nowrap;
}
.ov-join-btn:hover { filter: brightness(1.1); }

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
   APPOINTMENTS TAB
════════════════════════════════════════════════════ */

/* Header */
.appt-tab-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 16px;
  flex-wrap: wrap;
}
.btn-book-new {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: linear-gradient(135deg, #0891b2, #06b6d4);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 10px 20px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}
.btn-book-new:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(6,182,212,0.35); }

/* Filter tabs */
.appt-filter-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.appt-filter-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.07);
  background: transparent;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.appt-filter-tab:hover { color: #94a3b8; border-color: rgba(255,255,255,0.14); background: rgba(255,255,255,0.03); }
.appt-filter-tab.active { background: rgba(6,182,212,0.1); color: #22d3ee; border-color: rgba(6,182,212,0.25); }
.appt-filter-tab.tab-pending.active  { background: rgba(245,158,11,0.1); color: #fbbf24; border-color: rgba(245,158,11,0.25); }
.appt-filter-tab.tab-confirmed.active{ background: rgba(59,130,246,0.1); color: #60a5fa; border-color: rgba(59,130,246,0.25); }
.appt-filter-tab.tab-completed.active{ background: rgba(16,185,129,0.1); color: #34d399; border-color: rgba(16,185,129,0.25); }
.appt-filter-tab.tab-cancelled.active{ background: rgba(107,114,128,0.1); color: #9ca3af; border-color: rgba(107,114,128,0.2); }

.appt-filter-count {
  background: rgba(255,255,255,0.08);
  color: #94a3b8;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}
.appt-filter-tab.active .appt-filter-count { background: rgba(255,255,255,0.15); color: inherit; }

/* Loading / Empty */
.appt-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 50px 20px;
  color: #475569;
  font-size: 14px;
}
.appt-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 10px;
  text-align: center;
}
.appt-empty-icon {
  width: 72px; height: 72px;
  border-radius: 20px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  display: flex; align-items: center; justify-content: center;
  color: #1e293b;
  margin-bottom: 4px;
}
.appt-empty-title { font-size: 16px; font-weight: 700; color: #334155; }
.appt-empty-sub { font-size: 13px; color: #1e293b; }

/* List */
.appointments-list { display: flex; flex-direction: column; gap: 12px; }

/* ══════════════════════════════════════════
   APPOINTMENT CARD
══════════════════════════════════════════ */
.appt-card {
  display: flex;
  align-items: stretch;
  background: rgba(8, 15, 35, 0.7);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.22s ease;
  position: relative;
}
.appt-card:hover {
  border-color: rgba(99,179,237,0.25);
  background: rgba(8, 15, 35, 0.9);
  transform: translateY(-2px);
  box-shadow: 0 10px 36px rgba(0,0,0,0.3);
}
.appt-cancelled-dim { opacity: 0.65; }
.appt-cancelled-dim:hover { opacity: 0.85; }

/* Accent bar */
.appt-accent-bar { width: 4px; flex-shrink: 0; }
.accent-pending   { background: linear-gradient(180deg, #f59e0b, #d97706); }
.accent-confirmed { background: linear-gradient(180deg, #3b82f6, #2563eb); }
.accent-completed { background: linear-gradient(180deg, #10b981, #059669); }
.accent-cancelled { background: #374151; }
.accent-verified  { background: linear-gradient(180deg, #8b5cf6, #7c3aed); }

/* Date column */
.appt-date-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 14px;
  min-width: 64px;
  background: rgba(255,255,255,0.02);
  border-right: 1px solid rgba(255,255,255,0.05);
  flex-shrink: 0;
  gap: 1px;
}
.appt-day   { font-size: 1.8rem; font-weight: 900; color: #f1f5f9; line-height: 1; }
.appt-month { font-size: 10px; font-weight: 700; color: #818cf8; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px; }
.appt-year  { font-size: 9px; color: #334155; margin-top: 2px; }

/* Body */
.appt-body {
  flex: 1;
  padding: 14px 16px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* Doctor row */
.appt-row-top {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.appt-doctor-avatar {
  width: 38px; height: 38px; border-radius: 50%; overflow: hidden; flex-shrink: 0;
  border: 2px solid rgba(99,179,237,0.2);
}
.appt-doctor-avatar img { width: 100%; height: 100%; object-fit: cover; }
.appt-doctor-avatar-fallback {
  background: rgba(99,179,237,0.08);
  display: flex; align-items: center; justify-content: center;
  color: #60a5fa;
}
.appt-doctor-info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.appt-doctor-name {
  font-size: 15px; font-weight: 800; color: #f1f5f9;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.appt-specialization { font-size: 11.5px; color: #38bdf8; font-weight: 600; }
.appt-type-badge {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 10px; font-weight: 700;
  padding: 3px 10px; border-radius: 20px;
  flex-shrink: 0;
}
.type-online   { background: rgba(59,130,246,0.12); color: #60a5fa; border: 1px solid rgba(59,130,246,0.25); }
.type-physical { background: rgba(139,92,246,0.12); color: #a78bfa; border: 1px solid rgba(139,92,246,0.25); }

/* Location row */
.appt-location-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.appt-location-text {
  font-size: 12px; font-weight: 600; color: #a78bfa;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  max-width: 260px;
}
.appt-id-chip {
  font-size: 10px; font-weight: 700; font-family: monospace;
  color: #475569;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 5px; padding: 2px 7px;
  letter-spacing: 0.5px;
  margin-left: auto;
}

/* Meta chips */
.appt-meta-chips {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.meta-chip {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11.5px; color: #94a3b8;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  padding: 4px 10px; border-radius: 7px; font-weight: 600;
}
.meta-chip svg { color: #64748b; }

/* Fee row */
.appt-fee-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 9px;
  padding: 8px 12px;
  flex-wrap: wrap;
}
.fee-breakdown {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
}
.fee-item-sm { display: flex; flex-direction: column; align-items: center; gap: 1px; }
.fee-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; }
.fee-amt { font-size: 11px; font-weight: 700; color: #94a3b8; }
.fee-plus { font-size: 11px; color: #334155; font-weight: 700; }
.fee-total-group { display: flex; align-items: center; gap: 8px; }
.fee-total-label { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #475569; }
.fee-total-amt { font-size: 14px; font-weight: 900; color: #e2e8f0; }
.pay-badge {
  font-size: 10px; font-weight: 800;
  padding: 3px 9px; border-radius: 6px; letter-spacing: 0.5px;
}
.pay-paid    { background: rgba(16,185,129,0.12); color: #34d399; border: 1px solid rgba(16,185,129,0.2); }
.pay-pending { background: rgba(245,158,11,0.12); color: #fbbf24; border: 1px solid rgba(245,158,11,0.2); }

/* Rejection */
.appt-rejection {
  display: flex; align-items: flex-start; gap: 6px;
  font-size: 11.5px; color: #f87171;
  background: rgba(239,68,68,0.06);
  border: 1px solid rgba(239,68,68,0.12);
  border-radius: 7px; padding: 6px 10px;
}
.appt-rejection svg { flex-shrink: 0; margin-top: 1px; }

/* Right column */
.appt-right-col {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  padding: 14px 16px;
  gap: 10px;
  flex-shrink: 0;
  min-width: 128px;
  border-left: 1px solid rgba(255,255,255,0.04);
  background: rgba(255,255,255,0.01);
}
.appt-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 7px;
  width: 100%;
}
.appt-hint {
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; color: #475569; font-style: italic;
}
.appt-hint-warn { color: #f59e0b; font-style: normal; font-weight: 600; }
.appt-hint-cancel { color: #6b7280; }

/* Action buttons */
.btn-pay, .btn-receipt, .btn-join, .btn-cancel-appt {
  display: inline-flex; align-items: center; justify-content: center; gap: 5px;
  font-size: 12px; font-weight: 700;
  padding: 8px 14px; border-radius: 9px; border: none;
  cursor: pointer; transition: all 0.2s;
  white-space: nowrap; width: 100%;
}
.btn-pay {
  background: linear-gradient(135deg, #1d4ed8, #3b82f6);
  color: #fff;
  box-shadow: 0 3px 12px rgba(37,99,235,0.3);
}
.btn-pay:hover { filter: brightness(1.1); transform: translateY(-1px); }
.btn-receipt {
  background: rgba(255,255,255,0.05);
  color: #94a3b8;
  border: 1px solid rgba(255,255,255,0.09);
}
.btn-receipt:hover { background: rgba(255,255,255,0.09); color: #e2e8f0; }
.btn-join {
  background: linear-gradient(135deg, #059669, #10b981);
  color: #fff;
  box-shadow: 0 3px 12px rgba(16,185,129,0.28);
}
.btn-join:hover { filter: brightness(1.1); transform: translateY(-1px); }
.btn-cancel-appt {
  background: rgba(239,68,68,0.07);
  color: #f87171;
  border: 1px solid rgba(239,68,68,0.14);
}
.btn-cancel-appt:hover { background: rgba(239,68,68,0.15); }

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
  .appt-card { gap: 0; }
  .appt-right-col { min-width: 100px; }
}
@media (max-width: 500px) {
  .stats-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
  .quick-actions-row { grid-template-columns: 1fr; }
  .header-left { flex-direction: column; align-items: flex-start; gap: 12px; }
}

/* old status border overrides — handled by accent bar */
.appt-status-pending   { opacity: 1; }
.appt-status-confirmed { opacity: 1; }
.appt-status-completed { opacity: 1; }
.appt-status-cancelled { opacity: 1; }

/* ════════════════════════════════════════════════════
   PRESCRIPTIONS TAB
════════════════════════════════════════════════════ */

/* ── Page header ── */
.rx-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 28px;
  padding: 22px 24px;
  background: linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.05) 100%);
  border: 1px solid rgba(99,102,241,0.15);
  border-radius: 16px;
}
.rx-page-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.rx-page-icon {
  width: 42px; height: 42px;
  border-radius: 11px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  display: flex; align-items: center; justify-content: center;
  color: #fff; flex-shrink: 0;
}
.rx-page-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #f1f5f9;
  letter-spacing: -0.01em;
}
.rx-page-sub {
  font-size: 0.8rem;
  color: #64748b;
  margin-top: 3px;
}
.rx-page-stats { display: flex; gap: 8px; }
.rx-stat-pill {
  display: flex; align-items: center; gap: 7px;
  padding: 7px 14px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 600;
}
.rx-stat-active {
  background: rgba(16,185,129,0.1);
  color: #34d399;
  border: 1px solid rgba(16,185,129,0.22);
}
.rx-stat-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #10b981;
  animation: rx-pulse 2s infinite;
}
@keyframes rx-pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
.rx-stat-total {
  background: rgba(99,102,241,0.1);
  color: #a5b4fc;
  border: 1px solid rgba(99,102,241,0.2);
}

/* ── Empty state ── */
.rx-empty {
  text-align: center;
  padding: 64px 24px;
  background: rgba(255,255,255,0.02);
  border: 1px dashed rgba(255,255,255,0.08);
  border-radius: 16px;
}
.rx-empty-icon {
  width: 72px; height: 72px;
  margin: 0 auto 18px;
  border-radius: 18px;
  background: rgba(99,102,241,0.08);
  border: 1px solid rgba(99,102,241,0.15);
  display: flex; align-items: center; justify-content: center;
  color: #4f46e5;
  opacity: 0.6;
}
.rx-empty-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #94a3b8;
  margin-bottom: 6px;
}
.rx-empty-sub {
  font-size: 0.82rem;
  color: #475569;
  max-width: 320px;
  margin: 0 auto;
  line-height: 1.6;
}

/* ── Cards list ── */
.rx-cards-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ── Individual card ── */
.rx-card {
  background: rgba(15,23,42,0.7);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 16px;
  overflow: hidden;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
  backdrop-filter: blur(4px);
}
.rx-card:hover {
  border-color: rgba(99,102,241,0.28);
  transform: translateY(-1px);
  box-shadow: 0 6px 24px rgba(0,0,0,0.25);
}
.rx-card--open {
  border-color: rgba(99,102,241,0.4);
  box-shadow: 0 0 0 1px rgba(99,102,241,0.12), 0 8px 32px rgba(0,0,0,0.3);
  transform: none;
}

/* ── Card top (header row) ── */
.rx-card-top {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}
.rx-card-top:hover { background: rgba(255,255,255,0.015); }

.rx-index-badge {
  width: 38px; height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #312e81, #4c1d95);
  border: 1px solid rgba(99,102,241,0.3);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.68rem;
  font-weight: 800;
  color: #a5b4fc;
  flex-shrink: 0;
  letter-spacing: 0.5px;
}

.rx-card-main {
  flex: 1;
  min-width: 0;
}
.rx-diagnosis {
  font-size: 1.02rem;
  font-weight: 650;
  color: #e2e8f0;
  line-height: 1.3;
  margin-bottom: 5px;
}
.rx-card-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
}
.rx-meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.77rem;
  color: #64748b;
}
.rx-meta-item svg { color: #475569; flex-shrink: 0; }
.rx-meta-dot {
  width: 3px; height: 3px;
  border-radius: 50%;
  background: #334155;
  flex-shrink: 0;
}
.rx-followup-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  font-weight: 600;
  color: #fbbf24;
  background: rgba(251,191,36,0.08);
  border: 1px solid rgba(251,191,36,0.2);
  padding: 2px 9px;
  border-radius: 20px;
}

.rx-card-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.rx-med-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #818cf8;
  background: rgba(99,102,241,0.1);
  border: 1px solid rgba(99,102,241,0.2);
  padding: 5px 11px;
  border-radius: 20px;
  white-space: nowrap;
}
.rx-med-pill svg { color: #6366f1; }

.rx-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 11px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: capitalize;
  letter-spacing: 0.02em;
  white-space: nowrap;
}
.rx-status-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.rx-status-active {
  background: rgba(16,185,129,0.1);
  color: #34d399;
  border: 1px solid rgba(16,185,129,0.22);
}
.rx-status-active .rx-status-dot { background: #10b981; }
.rx-status-done {
  background: rgba(100,116,139,0.1);
  color: #94a3b8;
  border: 1px solid rgba(100,116,139,0.18);
}
.rx-status-done .rx-status-dot { background: #64748b; }
.rx-status-cancelled {
  background: rgba(239,68,68,0.08);
  color: #f87171;
  border: 1px solid rgba(239,68,68,0.18);
}
.rx-status-cancelled .rx-status-dot { background: #ef4444; }

.rx-chevron-wrap {
  width: 30px; height: 30px;
  border-radius: 8px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  display: flex; align-items: center; justify-content: center;
  color: #475569;
  transition: all 0.25s ease;
  flex-shrink: 0;
}
.rx-chevron-wrap--open {
  background: rgba(99,102,241,0.12);
  border-color: rgba(99,102,241,0.3);
  color: #818cf8;
  transform: rotate(180deg);
}

/* ── Expanded body ── */
.rx-card-body {
  border-top: 1px solid rgba(255,255,255,0.06);
  padding: 22px 22px 18px;
  display: flex;
  flex-direction: column;
  gap: 22px;
  background: rgba(0,0,0,0.18);
}

/* ── Section label ── */
.rx-section-label {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #475569;
  margin-bottom: 12px;
}
.rx-section-label svg { color: #6366f1; flex-shrink: 0; }

/* ── Symptom tags ── */
.rx-symptom-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}
.rx-symptom-tag {
  font-size: 0.8rem;
  font-weight: 500;
  color: #fca5a5;
  background: rgba(239,68,68,0.07);
  border: 1px solid rgba(239,68,68,0.16);
  padding: 5px 12px;
  border-radius: 20px;
}

/* ── Medicine list ── */
.rx-med-list { display: flex; flex-direction: column; gap: 8px; }
.rx-med-row {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 10px; overflow: hidden;
  transition: border-color 0.15s;
}
.rx-med-row:hover { border-color: rgba(99,102,241,0.2); }
.rx-med-row-header {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 14px;
  background: rgba(99,102,241,0.05);
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.rx-med-num {
  width: 22px; height: 22px; border-radius: 6px;
  background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.25);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.65rem; font-weight: 800; color: #818cf8; flex-shrink: 0;
}
.rx-med-name { font-size: 0.92rem; font-weight: 650; color: #e2e8f0; }
.rx-med-row-details { display: flex; flex-wrap: wrap; padding: 2px 0; }
.rx-detail-chip {
  display: flex; flex-direction: column; gap: 2px;
  padding: 9px 14px;
  border-right: 1px solid rgba(255,255,255,0.05);
  min-width: 100px;
}
.rx-detail-chip:last-child { border-right: none; }
.rx-detail-chip--note { flex: 1; min-width: 180px; border-right: none; }
.rx-detail-chip-label {
  font-size: 0.62rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.07em; color: #475569;
}
.rx-detail-chip-val { font-size: 0.83rem; font-weight: 500; color: #cbd5e1; margin-top: 1px; }
.rx-detail-chip--duration .rx-detail-chip-val { color: #6ee7b7; font-weight: 600; }
.rx-detail-chip--note .rx-detail-chip-val { color: #94a3b8; font-style: italic; line-height: 1.5; }

/* ── Advice + Notes ── */
.rx-info-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.rx-info-box {
  border-radius: 10px; padding: 14px 16px;
  background: rgba(255,255,255,0.025);
  border: 1px solid rgba(255,255,255,0.07);
}
.rx-info-box--advice { border-left: 3px solid #10b981; }
.rx-info-box--notes  { border-left: 3px solid #6366f1; }
.rx-info-label {
  font-size: 0.65rem; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.09em;
  margin-bottom: 8px;
}
.rx-info-box--advice .rx-info-label { color: #059669; }
.rx-info-box--notes  .rx-info-label { color: #6366f1; }
.rx-info-text { font-size: 0.84rem; color: #94a3b8; line-height: 1.65; margin: 0; }

/* ── Footer stamp ── */
.rx-card-footer {
  display: flex; align-items: center; justify-content: space-between;
  gap: 10px; padding-top: 12px;
  border-top: 1px solid rgba(255,255,255,0.05);
}
.rx-footer-stamp {
  display: flex; align-items: center; gap: 5px;
  font-size: 0.67rem; color: #475569;
}
.rx-footer-stamp svg { color: #475569; }
.rx-download-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
  white-space: nowrap;
  flex-shrink: 0;
}
.rx-download-btn:hover { opacity: 0.88; transform: translateY(-1px); }
/* ════════════════════════════════════════════════════
   PRESCRIPTIONS TAB
════════════════════════════════════════════════════ */

/* Section header */
.rx-section-header {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 12px; margin-bottom: 24px;
}
.rx-section-title { font-size: 1.15rem; font-weight: 700; color: #f1f5f9; margin: 0; }
.rx-section-sub { font-size: 0.78rem; color: #64748b; margin: 3px 0 0; }
.rx-header-pills { display: flex; gap: 8px; flex-wrap: wrap; }
.rx-pill-active {
  display: flex; align-items: center; gap: 6px;
  padding: 5px 12px; border-radius: 20px; font-size: 0.74rem; font-weight: 600;
  background: rgba(16,185,129,0.1); color: #34d399; border: 1px solid rgba(16,185,129,0.2);
}
.rx-pill-dot { width: 7px; height: 7px; border-radius: 50%; background: #10b981; animation: rx-pulse 2s infinite; }
@keyframes rx-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
.rx-pill-total {
  padding: 5px 12px; border-radius: 20px; font-size: 0.74rem; font-weight: 600;
  background: rgba(99,102,241,0.1); color: #a5b4fc; border: 1px solid rgba(99,102,241,0.2);
}

/* Empty */
.rx-empty-state {
  text-align: center; padding: 60px 24px;
  background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.08); border-radius: 16px;
}
.rx-empty-state svg { opacity: 0.3; color: #64748b; margin-bottom: 14px; }
.rx-empty-title { font-size: 1rem; font-weight: 600; color: #64748b; margin: 0 0 6px; }
.rx-empty-sub { font-size: 0.8rem; color: #475569; margin: 0; }

/* Document list */
.rx-doc-list { display: flex; flex-direction: column; gap: 20px; }

/* Prescription document */
.rx-doc-inner {
  background: #0d1117;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  overflow: hidden;
}

/* Letterhead */
.rx-letterhead {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 22px 16px; gap: 16px;
  background: linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.1) 100%);
  border-bottom: 1px solid rgba(99,102,241,0.2);
}
.rx-letterhead-left { display: flex; align-items: center; gap: 12px; }
.rx-clinic-logo {
  width: 42px; height: 42px; border-radius: 10px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  display: flex; align-items: center; justify-content: center;
  color: #fff; flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(99,102,241,0.4);
}
.rx-clinic-name { font-size: 1.15rem; font-weight: 800; color: #f1f5f9; letter-spacing: -0.01em; }
.rx-clinic-sub { font-size: 0.7rem; color: #64748b; margin-top: 2px; }
.rx-letterhead-right { display: flex; align-items: center; gap: 14px; flex-shrink: 0; }
.rx-rx-symbol { font-size: 2.2rem; font-weight: 900; color: rgba(99,102,241,0.3); line-height: 1; font-style: italic; }
.rx-doc-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }
.rx-doc-meta span { font-size: 0.7rem; color: #64748b; }
.rx-letterhead-rule { height: 2px; background: linear-gradient(90deg, #4f46e5, #7c3aed, #06b6d4); opacity: 0.6; }

/* Patient + Doctor strip */
.rx-info-strip {
  display: flex; align-items: stretch; gap: 0;
  padding: 16px 22px;
  background: rgba(255,255,255,0.02);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.rx-info-strip-col { display: flex; flex-direction: column; gap: 3px; flex: 1; padding: 0 18px; }
.rx-info-strip-col:first-child { padding-left: 0; }
.rx-info-strip-col:last-child { padding-right: 0; }
.rx-info-strip-divider { width: 1px; background: rgba(255,255,255,0.07); flex-shrink: 0; }
.rx-strip-label { font-size: 0.6rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #475569; }
.rx-strip-name { font-size: 0.92rem; font-weight: 700; color: #e2e8f0; }
.rx-strip-detail { font-size: 0.73rem; color: #64748b; }
.rx-strip-status {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 0.72rem; font-weight: 700; text-transform: capitalize;
  padding: 3px 9px; border-radius: 20px; width: fit-content; margin-top: 2px;
}
.strip-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.strip-active { background: rgba(16,185,129,0.12); color: #34d399; border: 1px solid rgba(16,185,129,0.2); }
.strip-active .strip-dot { background: #10b981; }
.strip-done { background: rgba(100,116,139,0.1); color: #94a3b8; border: 1px solid rgba(100,116,139,0.18); }
.strip-done .strip-dot { background: #64748b; }
.strip-cancelled { background: rgba(239,68,68,0.1); color: #f87171; border: 1px solid rgba(239,68,68,0.18); }
.strip-cancelled .strip-dot { background: #ef4444; }

/* Diagnosis */
.rx-diagnosis-block {
  display: flex; align-items: baseline; gap: 14px;
  padding: 14px 22px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  background: rgba(99,102,241,0.04);
}
.rx-diag-label {
  font-size: 0.6rem; font-weight: 800; text-transform: uppercase;
  letter-spacing: 0.1em; color: #6366f1; white-space: nowrap; flex-shrink: 0;
}
.rx-diag-text { font-size: 1rem; font-weight: 700; color: #f1f5f9; }

/* Symptoms */
.rx-symptoms-block {
  padding: 12px 22px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.rx-block-label {
  display: block; font-size: 0.6rem; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.1em; color: #475569; margin-bottom: 8px;
}
.rx-sym-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.rx-sym-tag {
  font-size: 0.76rem; font-weight: 500; color: #fca5a5;
  background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.18);
  padding: 3px 10px; border-radius: 20px;
}

/* Medicines table */
.rx-meds-block { padding: 16px 22px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.rx-meds-table { width: 100%; border-radius: 10px; overflow: hidden; border: 1px solid rgba(255,255,255,0.07); }
.rx-meds-thead {
  display: grid;
  grid-template-columns: 32px 1fr 80px 110px 80px 1fr;
  background: rgba(99,102,241,0.15);
  padding: 9px 12px; gap: 8px;
  border-bottom: 1px solid rgba(99,102,241,0.2);
}
.rx-meds-thead span {
  font-size: 0.6rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.08em; color: #818cf8;
}
.rx-meds-row {
  display: grid;
  grid-template-columns: 32px 1fr 80px 110px 80px 1fr;
  padding: 10px 12px; gap: 8px;
  border-top: 1px solid rgba(255,255,255,0.04);
  align-items: center;
  transition: background 0.15s;
}
.rx-meds-row:hover { background: rgba(255,255,255,0.02); }
.rx-meds-row--alt { background: rgba(255,255,255,0.015); }
.rxt-num { font-size: 0.75rem; font-weight: 700; color: #475569; }
.rxt-name { font-size: 0.78rem; color: #94a3b8; }
.rxt-name--val { font-size: 0.88rem; font-weight: 700; color: #e2e8f0; }
.rxt-dose { font-size: 0.82rem; color: #cbd5e1; }
.rxt-freq { font-size: 0.82rem; color: #cbd5e1; }
.rxt-dur { font-size: 0.82rem; color: #cbd5e1; }
.rxt-dur--val { font-weight: 700; color: #6ee7b7; }
.rxt-inst { font-size: 0.76rem; color: #64748b; font-style: italic; }

/* Advice + Notes */
.rx-notes-strip {
  display: grid; grid-template-columns: 1fr 1fr;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.rx-notes-box { padding: 14px 22px; }
.rx-notes-box--advice {
  border-right: 1px solid rgba(255,255,255,0.05);
  border-left: 3px solid #10b981;
  background: rgba(16,185,129,0.04);
}
.rx-notes-box--notes {
  border-left: 3px solid #6366f1;
  background: rgba(99,102,241,0.04);
}
.rx-notes-label {
  font-size: 0.6rem; font-weight: 800; text-transform: uppercase;
  letter-spacing: 0.1em; margin-bottom: 7px;
}
.rx-notes-box--advice .rx-notes-label { color: #10b981; }
.rx-notes-box--notes  .rx-notes-label { color: #818cf8; }
.rx-notes-text { font-size: 0.83rem; line-height: 1.65; margin: 0; }
.rx-notes-box--advice .rx-notes-text { color: #a7f3d0; }
.rx-notes-box--notes  .rx-notes-text { color: #c7d2fe; }

/* Signature + footer */
.rx-doc-footer {
  display: flex; align-items: flex-end; justify-content: space-between;
  padding: 14px 22px; gap: 16px; flex-wrap: wrap;
  background: rgba(255,255,255,0.02);
}
.rx-sig-area { display: flex; flex-direction: column; gap: 4px; }
.rx-sig-line { width: 130px; height: 1px; background: rgba(255,255,255,0.15); margin-bottom: 4px; }
.rx-sig-name { font-size: 0.82rem; font-weight: 700; color: #e2e8f0; }
.rx-sig-sub { font-size: 0.65rem; color: #475569; }
.rx-doc-footer-right { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
.rx-emr-stamp {
  display: flex; align-items: center; gap: 5px;
  font-size: 0.65rem; color: #334155;
}
.rx-emr-stamp svg { color: #334155; }
.rx-dl-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: 8px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: #fff; font-size: 0.76rem; font-weight: 600;
  border: none; cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(99,102,241,0.3);
}
.rx-dl-btn:hover { opacity: 0.88; transform: translateY(-1px); }
.rx-dl-btn:active { transform: translateY(0); }

/* Responsive */
@media (max-width: 700px) {
  .rx-meds-thead, .rx-meds-row { grid-template-columns: 28px 1fr 70px 90px; }
  .rxt-dur, .rxt-inst { display: none; }
  .rx-notes-strip { grid-template-columns: 1fr; }
  .rx-notes-box--advice { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.05); }
  .rx-info-strip { flex-direction: column; gap: 12px; }
  .rx-info-strip-divider { width: 100%; height: 1px; }
  .rx-info-strip-col { padding: 0; }
  .rx-letterhead { flex-direction: column; align-items: flex-start; gap: 10px; }
}

</style>