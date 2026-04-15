<template>
  <q-page class="admin-page">

    <!-- ── User Detail Drawer ──────────────────────────────── -->
    <q-drawer
      v-model="detailOpen"
      side="right"
      :width="480"
      overlay
      class="user-detail-drawer"
    >
      <div v-if="detailLoading" class="drawer-loading">
        <q-spinner-dots color="green-5" size="40px" />
        <p>Loading user details...</p>
      </div>

      <div v-else-if="selectedUser" class="drawer-content">

        <!-- Drawer Header -->
        <div class="drawer-header">
          <div class="drawer-avatar-wrap">
            <!-- Profile image if available, else gradient initials -->
            <img
              v-if="getProfileImageUrl(selectedUser.user)"
              :src="getProfileImageUrl(selectedUser.user)"
              class="drawer-avatar drawer-avatar--img"
              :alt="selectedUser.user?.name"
              @error="onImgError($event, selectedUser.user)"
            />
            <div
              v-else
              class="drawer-avatar"
              :style="{ background: getRoleGradient(selectedUser.user?.role) }"
            >
              {{ getInitials(selectedUser.user?.name) }}
            </div>
            <div class="drawer-avatar-badge" :class="selectedUser.user?.isActive ? 'badge--active' : 'badge--inactive'">
              <q-icon :name="selectedUser.user?.isActive ? 'check' : 'close'" size="10px" color="white" />
            </div>
          </div>
          <div class="drawer-header-info">
            <h3 class="drawer-name">{{ selectedUser.user?.name }}</h3>
            <p class="drawer-email">{{ selectedUser.user?.email }}</p>
            <div class="drawer-badges">
              <span class="role-pill" :class="`role-pill--${selectedUser.user?.role}`">{{ selectedUser.user?.role }}</span>
              <span class="verif-pill" :class="selectedUser.user?.isVerified ? 'verif-pill--yes' : 'verif-pill--no'">
                <q-icon :name="selectedUser.user?.isVerified ? 'verified' : 'pending'" size="12px" />
                {{ selectedUser.user?.isVerified ? 'Verified' : 'Unverified' }}
              </span>
            </div>
          </div>
          <q-btn flat round dense icon="close" color="grey-5" class="drawer-close" @click="detailOpen = false" />
        </div>

        <!-- Quick Actions -->
        <div class="drawer-actions">
          <q-btn
            unelevated no-caps size="sm"
            :icon="selectedUser.user?.isActive ? 'block' : 'check_circle'"
            :label="selectedUser.user?.isActive ? 'Deactivate' : 'Activate'"
            :color="selectedUser.user?.isActive ? 'orange-6' : 'green-6'"
            :loading="processingId === selectedUser.user?.userId"
            @click="toggleStatusFromDrawer"
          />
          <q-btn
            unelevated no-caps size="sm"
            icon="delete_outline"
            label="Delete User"
            color="red-5"
            outline
            @click="confirmDeleteFromDrawer"
          />
        </div>

        <!-- Core Identity -->
        <div class="drawer-section">
          <div class="section-title">
            <q-icon name="badge" size="16px" color="green-6" />
            Identity
          </div>
          <div class="info-grid">
            <div class="info-row">
              <span class="info-key">User ID</span>
              <span class="info-val info-val--mono">{{ selectedUser.user?.userId }}</span>
            </div>
            <div class="info-row" v-if="selectedUser.user?.roleId">
              <span class="info-key">Role ID</span>
              <span class="info-val info-val--mono">{{ selectedUser.user?.roleId }}</span>
            </div>
            <div class="info-row">
              <span class="info-key">Phone</span>
              <span class="info-val">{{ selectedUser.user?.phone || '—' }}</span>
            </div>
            <div class="info-row">
              <span class="info-key">Joined</span>
              <span class="info-val">{{ formatDate(selectedUser.user?.createdAt) }}</span>
            </div>
            <div class="info-row">
              <span class="info-key">Last Updated</span>
              <span class="info-val">{{ formatDate(selectedUser.user?.updatedAt) }}</span>
            </div>
          </div>
        </div>

        <!-- Patient Profile -->
        <template v-if="selectedUser.user?.role === 'patient' && selectedUser.profile">
          <div class="drawer-section">
            <div class="section-title">
              <q-icon name="personal_injury" size="16px" color="teal-6" />
              Patient Profile
            </div>
            <div class="info-grid">
              <div class="info-row">
                <span class="info-key">Patient ID</span>
                <span class="info-val info-val--mono">{{ selectedUser.profile?.patientId }}</span>
              </div>
              <div class="info-row">
                <span class="info-key">Date of Birth</span>
                <span class="info-val">{{ selectedUser.profile?.dateOfBirth ? formatDate(selectedUser.profile.dateOfBirth) : '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-key">Gender</span>
                <span class="info-val" style="text-transform:capitalize">{{ selectedUser.profile?.gender || '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-key">Blood Group</span>
                <span class="info-val blood-group">{{ selectedUser.profile?.bloodGroup || '—' }}</span>
              </div>
            </div>
          </div>

          <!-- Address -->
          <div class="drawer-section" v-if="selectedUser.profile?.address?.city || selectedUser.profile?.address?.street">
            <div class="section-title">
              <q-icon name="location_on" size="16px" color="blue-6" />
              Address
            </div>
            <div class="address-block">
              <p v-if="selectedUser.profile?.address?.street">{{ selectedUser.profile.address.street }}</p>
              <p v-if="selectedUser.profile?.address?.city">{{ selectedUser.profile.address.city }}<span v-if="selectedUser.profile?.address?.district">, {{ selectedUser.profile.address.district }}</span></p>
              <p v-if="selectedUser.profile?.address?.postalCode">{{ selectedUser.profile.address.postalCode }}</p>
            </div>
          </div>

          <!-- Emergency Contact -->
          <div class="drawer-section" v-if="selectedUser.profile?.emergencyContact?.name">
            <div class="section-title">
              <q-icon name="emergency" size="16px" color="red-5" />
              Emergency Contact
            </div>
            <div class="info-grid">
              <div class="info-row">
                <span class="info-key">Name</span>
                <span class="info-val">{{ selectedUser.profile.emergencyContact.name }}</span>
              </div>
              <div class="info-row">
                <span class="info-key">Phone</span>
                <span class="info-val">{{ selectedUser.profile.emergencyContact.phone || '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-key">Relationship</span>
                <span class="info-val" style="text-transform:capitalize">{{ selectedUser.profile.emergencyContact.relationship || '—' }}</span>
              </div>
            </div>
          </div>

          <!-- Medical Info -->
          <div class="drawer-section" v-if="selectedUser.profile?.allergies?.length || selectedUser.profile?.chronicConditions?.length">
            <div class="section-title">
              <q-icon name="medical_information" size="16px" color="orange-6" />
              Medical Information
            </div>
            <div v-if="selectedUser.profile?.allergies?.length" class="chip-group">
              <span class="chip-group-label">Allergies</span>
              <div class="chip-list">
                <span v-for="a in selectedUser.profile.allergies" :key="a" class="med-chip med-chip--red">{{ a }}</span>
              </div>
            </div>
            <div v-if="selectedUser.profile?.chronicConditions?.length" class="chip-group q-mt-sm">
              <span class="chip-group-label">Chronic Conditions</span>
              <div class="chip-list">
                <span v-for="c in selectedUser.profile.chronicConditions" :key="c" class="med-chip med-chip--orange">{{ c }}</span>
              </div>
            </div>
          </div>

          <!-- Medical Reports -->
          <div class="drawer-section" v-if="selectedUser.profile?.medicalReports?.length">
            <div class="section-title">
              <q-icon name="folder_open" size="16px" color="purple-6" />
              Medical Reports ({{ selectedUser.profile.medicalReports.length }})
            </div>
            <div class="report-list">
              <a
                v-for="r in selectedUser.profile.medicalReports.slice(0, 5)"
                :key="r.reportId"
                :href="r.fileUrl"
                target="_blank"
                class="report-item"
              >
                <div class="report-icon">
                  <q-icon :name="r.fileType === 'pdf' ? 'picture_as_pdf' : 'image'" size="16px" :color="r.fileType === 'pdf' ? 'red-5' : 'blue-5'" />
                </div>
                <div class="report-info">
                  <span class="report-title">{{ r.title }}</span>
                  <span class="report-date">{{ formatDate(r.uploadedAt) }}</span>
                </div>
                <q-icon name="open_in_new" size="14px" color="grey-4" />
              </a>
            </div>
          </div>
        </template>

        <!-- Doctor Profile -->
        <template v-if="selectedUser.user?.role === 'doctor' && selectedUser.profile">
          <div class="drawer-section">
            <div class="section-title">
              <q-icon name="medical_services" size="16px" color="blue-6" />
              Doctor Profile
            </div>
            <div class="info-grid">
              <div class="info-row">
                <span class="info-key">Doctor ID</span>
                <span class="info-val info-val--mono">{{ selectedUser.profile?.doctorId }}</span>
              </div>
              <div class="info-row">
                <span class="info-key">Specialty</span>
                <span class="info-val info-val--specialty">{{ selectedUser.profile?.specialty || '—' }}</span>
              </div>
              <div class="info-row" v-if="selectedUser.profile?.subSpecialty">
                <span class="info-key">Sub-Specialty</span>
                <span class="info-val">{{ selectedUser.profile.subSpecialty }}</span>
              </div>
              <div class="info-row">
                <span class="info-key">Reg. Number</span>
                <span class="info-val info-val--mono">{{ selectedUser.profile?.registrationNumber }}</span>
              </div>
              <div class="info-row">
                <span class="info-key">Hospital</span>
                <span class="info-val">{{ selectedUser.profile?.hospital || '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-key">Experience</span>
                <span class="info-val">{{ selectedUser.profile?.experience != null ? selectedUser.profile.experience + ' years' : '—' }}</span>
              </div>
              <div class="info-row">
                <span class="info-key">Consultation Fee</span>
                <span class="info-val info-val--fee">LKR {{ (selectedUser.profile?.consultationFee || 0).toLocaleString() }}</span>
              </div>
              <div class="info-row">
                <span class="info-key">Verification</span>
                <span class="info-val" :class="selectedUser.profile?.isVerified ? 'text-green-6' : 'text-orange-6'">
                  {{ selectedUser.profile?.isVerified ? 'Verified' : 'Pending' }}
                </span>
              </div>
              <div class="info-row" v-if="selectedUser.profile?.verifiedAt">
                <span class="info-key">Verified At</span>
                <span class="info-val">{{ formatDate(selectedUser.profile.verifiedAt) }}</span>
              </div>
            </div>
          </div>

          <!-- Qualifications -->
          <div class="drawer-section" v-if="selectedUser.profile?.qualifications?.length">
            <div class="section-title">
              <q-icon name="school" size="16px" color="indigo-6" />
              Qualifications
            </div>
            <div class="chip-list">
              <span v-for="q in selectedUser.profile.qualifications" :key="q" class="qual-chip">{{ q }}</span>
            </div>
          </div>

          <!-- Bio -->
          <div class="drawer-section" v-if="selectedUser.profile?.bio">
            <div class="section-title">
              <q-icon name="info" size="16px" color="grey-6" />
              Bio
            </div>
            <p class="bio-text">{{ selectedUser.profile.bio }}</p>
          </div>

          <!-- Verification Documents -->
          <div class="drawer-section" v-if="selectedUser.profile?.verificationDocuments?.length">
            <div class="section-title">
              <q-icon name="description" size="16px" color="teal-6" />
              Verification Documents ({{ selectedUser.profile.verificationDocuments.length }})
            </div>
            <div class="report-list">
              <a
                v-for="(d, i) in selectedUser.profile.verificationDocuments"
                :key="i"
                :href="d.fileUrl"
                target="_blank"
                class="report-item"
              >
                <div class="report-icon">
                  <q-icon name="description" size="16px" color="teal-5" />
                </div>
                <div class="report-info">
                  <span class="report-title">{{ d.title || `Document ${i + 1}` }}</span>
                  <span class="report-date">{{ formatDate(d.uploadedAt) }}</span>
                </div>
                <q-icon name="open_in_new" size="14px" color="grey-4" />
              </a>
            </div>
          </div>

          <!-- Rejection Reason -->
          <div class="drawer-section" v-if="selectedUser.profile?.rejectionReason">
            <div class="rejection-banner">
              <q-icon name="warning" size="16px" color="orange-7" />
              <div>
                <span class="rejection-label">Rejection Reason</span>
                <p class="rejection-text">{{ selectedUser.profile.rejectionReason }}</p>
              </div>
            </div>
          </div>
        </template>

      </div>
    </q-drawer>

    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h2 class="page-title">{{ pageConfig.title }}</h2>
        <p class="page-subtitle">{{ pageConfig.subtitle }}</p>
      </div>
      <div class="header-actions">
        <div class="total-badge">
          <q-icon :name="pageConfig.icon" size="16px" :color="pageConfig.iconColor" />
          <span>{{ totalUsers }} {{ pageConfig.countLabel }}</span>
        </div>
      </div>
    </div>

    <!-- Filters Bar -->
    <q-card class="filter-bar">
      <div class="filter-inner">
        <div class="search-wrap">
          <q-icon name="search" size="16px" color="grey-5" />
          <input
            v-model="search"
            :placeholder="pageConfig.searchPlaceholder"
            class="search-input"
            @input="debouncedSearch"
          />
          <q-icon
            v-if="search"
            name="close"
            size="14px"
            color="grey-5"
            class="cursor-pointer"
            @click="search = ''; loadUsers()"
          />
        </div>

        <template v-if="!isDoctorPage && !isPatientPage">
          <q-select
            v-model="roleFilter"
            :options="roleOptions"
            outlined dense
            label="Role"
            class="filter-select"
            emit-value map-options clearable
            @update:model-value="loadUsers"
          />
        </template>

        <q-select
          v-model="statusFilter"
          :options="statusOptions"
          outlined dense
          label="Status"
          class="filter-select"
          emit-value map-options clearable
          @update:model-value="loadUsers"
        />

        <q-btn
          unelevated no-caps
          icon="refresh"
          label="Refresh"
          color="green-6"
          size="sm"
          class="refresh-btn"
          :loading="loading"
          @click="loadUsers"
        />
      </div>
    </q-card>

    <!-- Table Card -->
    <q-card class="table-card">
      <q-table
        :rows="users"
        :columns="columns"
        :row-key="isDoctorPage ? 'doctorId' : 'userId'"
        :loading="loading"
        flat
        class="nexus-table"
        :rows-per-page-options="[10, 20, 50]"
        :pagination="{ rowsPerPage: perPage, page: currentPage }"
        @request="onRequest"
      >
        <!-- Header -->
        <template #header="props">
          <q-tr :props="props" class="table-header-row">
            <q-th v-for="col in props.cols" :key="col.name" :props="props" class="table-th">
              {{ col.label }}
            </q-th>
          </q-tr>
        </template>

        <!-- Body -->
        <template #body="props">
          <q-tr :props="props" class="table-row" @click="openUserDetail(props.row)" style="cursor:pointer">

            <!-- User Info -->
            <q-td key="name" :props="props">
              <div class="user-cell">
                <div class="user-avatar-wrap">
                  <img
                    v-if="getProfileImageUrl(props.row)"
                    :src="getProfileImageUrl(props.row)"
                    class="user-avatar user-avatar--img"
                    :alt="props.row.name"
                    @error="onImgError($event, props.row)"
                  />
                  <div
                    v-else
                    class="user-avatar"
                    :style="{ background: getRoleGradient(props.row.role) }"
                  >
                    {{ getInitials(props.row.name) }}
                  </div>
                </div>
                <div class="user-cell-info">
                  <span class="user-cell-name">{{ props.row.name }}</span>
                  <span class="user-cell-id">{{ props.row.userId || props.row.doctorId }}</span>
                </div>
              </div>
            </q-td>

            <!-- Email -->
            <q-td key="email" :props="props">
              <span class="cell-email">{{ props.row.email }}</span>
            </q-td>

            <!-- Role -->
            <q-td key="role" :props="props">
              <span class="table-role-pill" :class="`table-role-pill--${props.row.role}`">
                {{ props.row.role }}
              </span>
            </q-td>

            <!-- Status -->
            <q-td key="status" :props="props">
              <div class="status-cell" :class="props.row.isActive ? 'status-cell--active' : 'status-cell--inactive'">
                <span class="status-dot-sm"></span>
                {{ props.row.isActive ? 'Active' : 'Inactive' }}
              </div>
            </q-td>

            <!-- Verified -->
            <q-td key="verified" :props="props">
              <div class="verified-cell" :class="props.row.isVerified ? 'verified-cell--yes' : 'verified-cell--no'">
                <q-icon :name="props.row.isVerified ? 'verified' : 'pending'" size="16px" />
                {{ props.row.isVerified ? 'Verified' : 'Pending' }}
              </div>
            </q-td>

            <!-- Joined -->
            <q-td key="createdAt" :props="props">
              <span class="date-cell">{{ formatDate(props.row.createdAt) }}</span>
            </q-td>

            <!-- Actions -->
            <q-td key="actions" :props="props">
              <div class="row-actions" @click.stop>
                <button
                  class="action-btn action-btn--toggle"
                  :class="props.row.isActive ? 'action-btn--deactivate' : 'action-btn--activate'"
                  :disabled="processingId === (props.row.userId || props.row.doctorId)"
                  @click.stop="toggleStatus(props.row)"
                >
                  <q-icon :name="props.row.isActive ? 'block' : 'check_circle'" size="13px" />
                  {{ props.row.isActive ? 'Deactivate' : 'Activate' }}
                </button>
                <button
                  class="action-btn action-btn--delete"
                  @click.stop="confirmDelete(props.row)"
                >
                  <q-icon name="delete_outline" size="13px" />
                  Delete
                </button>
                <button
                  class="action-btn action-btn--view"
                  @click.stop="openUserDetail(props.row)"
                >
                  <q-icon name="visibility" size="13px" />
                  View
                </button>
              </div>
            </q-td>

          </q-tr>
        </template>

        <!-- No Data -->
        <template #no-data>
          <div class="no-data-state">
            <q-icon name="search_off" size="44px" color="grey-3" />
            <p>No {{ pageConfig.countLabel }} found</p>
          </div>
        </template>

        <!-- Loading -->
        <template #loading>
          <q-inner-loading showing color="green-6" />
        </template>
      </q-table>

      <!-- Footer -->
      <div class="table-footer">
        <span class="footer-total">{{ totalUsers }} {{ pageConfig.countLabel }} total</span>
        <q-pagination
          v-model="currentPage"
          :max="totalPages"
          :max-pages="7"
          direction-links
          color="green-6"
          @update:model-value="loadUsers"
        />
      </div>
    </q-card>

    <!-- Delete Dialog -->
    <q-dialog v-model="deleteDialog" persistent>
      <q-card class="nexus-dialog">
        <div class="dialog-header">
          <div class="dialog-icon dialog-icon--red">
            <q-icon name="delete_forever" size="20px" color="white" />
          </div>
          <div>
            <div class="dialog-title">Delete User</div>
            <div class="dialog-sub">This action cannot be undone</div>
          </div>
        </div>
        <q-card-section class="q-pt-sm">
          <p class="delete-confirm-text">
            Are you sure you want to permanently delete
            <strong>{{ deleteTarget?.name }}</strong>?
          </p>
          <div class="delete-warning">
            <q-icon name="warning" size="14px" color="red-5" />
            All associated data will be removed.
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-px-md q-pb-md">
          <q-btn flat no-caps label="Cancel" color="grey-6" v-close-popup />
          <q-btn
            unelevated no-caps
            label="Delete Permanently"
            color="red-5"
            icon="delete_forever"
            :loading="processingId === deleteTarget?.userId"
            @click="deleteUser"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { adminApi } from '../../services/adminApi'
import { searchDoctorProfiles, getDoctorPublicProfile } from '../../services/doctorApi'

const $q    = useQuasar()
const route = useRoute()

const isDoctorPage  = computed(() => route.name === 'AdminDoctors')
const isPatientPage = computed(() => route.name === 'AdminPatients')

const pageConfig = computed(() => {
  if (isDoctorPage.value) return {
    title: 'Doctor Management',
    subtitle: 'Browse and manage all registered doctors on the platform',
    icon: 'medical_services', iconColor: 'blue-6',
    countLabel: 'doctors',
    searchPlaceholder: 'Search doctors by name, email or ID...',
  }
  if (isPatientPage.value) return {
    title: 'Patient Management',
    subtitle: 'Browse and manage all registered patients on the platform',
    icon: 'people', iconColor: 'teal-6',
    countLabel: 'patients',
    searchPlaceholder: 'Search patients by name, email or ID...',
  }
  return {
    title: 'User Management',
    subtitle: 'Manage all platform users — patients, doctors, and admins',
    icon: 'manage_accounts', iconColor: 'green-6',
    countLabel: 'users',
    searchPlaceholder: 'Search by name, email or ID...',
  }
})

// State
const users        = ref([])
const loading      = ref(true)
const processingId = ref(null)
const search       = ref('')
const roleFilter   = ref(isPatientPage.value ? 'patient' : null)
const statusFilter = ref(null)
const currentPage  = ref(1)
const perPage      = ref(10)
const totalUsers   = ref(0)
const totalPages   = computed(() => Math.ceil(totalUsers.value / perPage.value))

const deleteDialog = ref(false)
const deleteTarget = ref(null)

// Detail Drawer
const detailOpen    = ref(false)
const detailLoading = ref(false)
const selectedUser  = ref(null)

const roleOptions = [
  { label: 'Patient', value: 'patient' },
  { label: 'Doctor',  value: 'doctor'  },
  { label: 'Admin',   value: 'admin'   },
]
const statusOptions = [
  { label: 'Active',   value: 'true'  },
  { label: 'Inactive', value: 'false' },
]

const columns = [
  { name: 'name',      label: 'User',     align: 'left',   field: 'name'       },
  { name: 'email',     label: 'Email',    align: 'left',   field: 'email'      },
  { name: 'role',      label: 'Role',     align: 'center', field: 'role'       },
  { name: 'status',    label: 'Status',   align: 'center', field: 'isActive'   },
  { name: 'verified',  label: 'Verified', align: 'center', field: 'isVerified' },
  { name: 'createdAt', label: 'Joined',   align: 'left',   field: 'createdAt'  },
  { name: 'actions',   label: 'Actions',  align: 'center', field: 'actions', style: 'width: 220px' },
]

// Helpers
const getInitials    = (n = '') => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
const getRoleGradient = (r) => ({ doctor: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', patient: 'linear-gradient(135deg,#0d9488,#14b8a6)', admin: 'linear-gradient(135deg,#7c3aed,#a78bfa)' }[r] || 'linear-gradient(135deg,#475569,#64748b)')
const formatDate     = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

// Resolve profileImage — handles both { url, publicId } object and plain string
// Also checks doctorProfile.profileImage for doctor rows from searchDoctorProfiles
const getProfileImageUrl = (user) => {
  if (!user) return null
  // Check top-level profileImage first (User model or merged MS2 image)
  const img = user.profileImage
  if (img) {
    if (typeof img === 'string' && img.trim()) return img
    if (img?.url && img.url.trim()) return img.url
  }
  // For doctor table rows from searchDoctorProfiles, image may be a plain string directly
  if (typeof user.profileImage === 'string' && user.profileImage.trim()) return user.profileImage
  return null
}

// On image load error, clear the src so the initials fallback shows
const onImgError = (event, user) => {
  event.target.style.display = 'none'
  if (user) user._imgFailed = true
}

let searchTimer
const debouncedSearch = () => { clearTimeout(searchTimer); searchTimer = setTimeout(loadUsers, 350) }

async function loadUsers() {
  loading.value = true
  try {
    if (isDoctorPage.value) {
      const params = {}
      if (search.value) params.search = search.value

      // Fetch MS2 doctor profiles (has profileImage) and MS1 users (has real userId) in parallel
      const [doctors, usersRes] = await Promise.allSettled([
        searchDoctorProfiles(params),
        adminApi.getUsers({ role: 'doctor', limit: 100 })
      ])

      const doctorList = doctors.status === 'fulfilled' ? (Array.isArray(doctors.value) ? doctors.value : []) : []
      const userList   = usersRes.status === 'fulfilled'  ? (usersRes.value.data?.data || []) : []

      // Build roleId → userId map from MS1 so we always have the real USER-XXXX
      const roleIdToUserId = {}
      const roleIdToMeta   = {}
      userList.forEach(u => {
        if (u.roleId) {
          roleIdToUserId[u.roleId] = u.userId
          roleIdToMeta[u.roleId]   = { createdAt: u.createdAt, updatedAt: u.updatedAt, phone: u.phone }
        }
      })

      users.value = doctorList.map(doc => ({
        userId:     roleIdToUserId[doc.doctorId] || doc.userId || doc.doctorId,
        doctorId:   doc.doctorId,
        name:       doc.name || '',
        email:      doc.email || '',
        role:       'doctor',
        isActive:   doc.isActive !== undefined ? doc.isActive : true,
        isVerified: doc.isVerified !== undefined ? doc.isVerified : false,
        createdAt:  roleIdToMeta[doc.doctorId]?.createdAt || doc.createdAt || null,
        profileImage: doc.profileImage || null,
      }))
      totalUsers.value = users.value.length
    } else {
      const params = { page: currentPage.value, limit: perPage.value }
      if (search.value)       params.search   = search.value
      if (isPatientPage.value) params.role    = 'patient'
      else if (roleFilter.value) params.role  = roleFilter.value
      if (statusFilter.value) params.isActive = statusFilter.value

      const { data } = await adminApi.getUsers(params)
      const rawUsers = data.data || []
      totalUsers.value = data.total || 0

      // For doctor rows in the all-users list, MS1 doesn't have profileImage.
      // Batch-fetch from MS2 and merge in — fire all requests in parallel.
      const doctorRows = rawUsers.filter(u => u.role === 'doctor' && u.roleId)
      if (doctorRows.length > 0) {
        const imageResults = await Promise.allSettled(
          doctorRows.map(u => getDoctorPublicProfile(u.roleId))
        )
        const imageMap = {}
        doctorRows.forEach((u, i) => {
          const result = imageResults[i]
          if (result.status === 'fulfilled' && result.value?.profileImage) {
            imageMap[u.roleId] = result.value.profileImage
          }
        })
        users.value = rawUsers.map(u =>
          u.role === 'doctor' && imageMap[u.roleId]
            ? { ...u, profileImage: imageMap[u.roleId] }
            : u
        )
      } else {
        users.value = rawUsers
      }
    }
  } catch {
    users.value = []
    totalUsers.value = 0
  } finally {
    loading.value = false
  }
}

function onRequest(props) {
  currentPage.value = props.pagination.page
  perPage.value     = props.pagination.rowsPerPage
  loadUsers()
}

// Open user detail drawer — fetch full profile from GET /api/admin/users/:userId
async function openUserDetail(user) {
  detailOpen.value    = true
  detailLoading.value = true
  selectedUser.value  = null

  try {
    let realUserId = user.userId

    // Doctor tab rows have userId = doctorId (DOC-XXXX) because searchDoctorProfiles
    // doesn't return the USER-XXXX id. Resolve it via the admin users endpoint.
    if (!realUserId || realUserId.startsWith('DOC-')) {
      const doctorId = user.doctorId || user.userId
      const { data: listData } = await adminApi.getUsers({ role: 'doctor', limit: 100 })
      const match = (listData.data || []).find(u => u.roleId === doctorId)
      realUserId = match?.userId || null
    }

    if (!realUserId) {
      selectedUser.value = { user, profile: null }
      return
    }

    const { data } = await adminApi.getUser(realUserId)
    const result = data.data || { user, profile: null }

    // For doctors, also fetch MS2 profile image
    if (result.user?.role === 'doctor') {
      const roleId = result.user?.roleId || user.doctorId
      if (roleId) {
        const ms2Profile = await getDoctorPublicProfile(roleId)
        if (ms2Profile?.profileImage) {
          result.user = { ...result.user, profileImage: ms2Profile.profileImage }
        }
      }
    }

    selectedUser.value = result
  } catch {
    selectedUser.value = { user, profile: null }
  } finally {
    detailLoading.value = false
  }
}

async function toggleStatus(user) {
  const id = user.userId || user.doctorId
  processingId.value = id
  try {
    await adminApi.toggleUserStatus(id, !user.isActive)
    $q.notify({ type: 'positive', message: `User ${user.isActive ? 'deactivated' : 'activated'}`, position: 'top-right' })
    await loadUsers()
    // Refresh drawer if open for same user
    if (detailOpen.value && selectedUser.value?.user?.userId === id) {
      await openUserDetail(user)
    }
  } catch (err) {
    $q.notify({ type: 'negative', message: err.response?.data?.message || 'Action failed', position: 'top-right' })
  } finally { processingId.value = null }
}

async function toggleStatusFromDrawer() {
  if (!selectedUser.value?.user) return
  await toggleStatus(selectedUser.value.user)
}

function confirmDelete(user) {
  deleteTarget.value = user
  deleteDialog.value = true
}

function confirmDeleteFromDrawer() {
  if (!selectedUser.value?.user) return
  detailOpen.value = false
  confirmDelete(selectedUser.value.user)
}

async function deleteUser() {
  const id = deleteTarget.value.userId || deleteTarget.value.doctorId
  processingId.value = id
  try {
    await adminApi.deleteUser(id)
    $q.notify({ type: 'positive', message: 'User deleted successfully', position: 'top-right' })
    deleteDialog.value = false
    detailOpen.value   = false
    await loadUsers()
  } catch (err) {
    $q.notify({ type: 'negative', message: err.response?.data?.message || 'Delete failed', position: 'top-right' })
  } finally { processingId.value = null }
}

onMounted(loadUsers)
</script>

<style lang="scss" scoped>
.admin-page { padding: 28px 28px 48px; }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;

  .page-title    { font-family: 'Poppins', sans-serif; font-size: 24px; font-weight: 700; color: #0f172a; margin: 0 0 4px; }
  .page-subtitle { font-size: 14px; color: #64748b; margin: 0; }
}

.header-actions { display: flex; align-items: center; gap: 12px; }

.total-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

/* Filter Bar */
.filter-bar {
  border-radius: 12px;
  border: 1px solid #eef0f4;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  margin-bottom: 16px;
}

.filter-inner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  flex-wrap: wrap;
}

.search-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px 14px;
  flex: 1;
  min-width: 240px;
  transition: border-color 0.15s;

  &:focus-within { border-color: #10b981; }

  .search-input {
    border: none; outline: none; background: transparent;
    font-size: 13px; color: #334155; flex: 1;
    &::placeholder { color: #94a3b8; }
  }
}

.filter-select { width: 140px; }
.refresh-btn   { height: 38px; border-radius: 8px; }

/* Table */
.table-card {
  border-radius: 14px;
  border: 1px solid #eef0f4;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  overflow: hidden;
}

.nexus-table { font-family: 'Inter', sans-serif; }

.table-header-row { background: #f8fafc; }
.table-th {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  padding: 14px 20px !important;
  border-bottom: 2px solid #eef0f4 !important;
}

.table-row {
  transition: background 0.12s;
  border-bottom: 1px solid #f8fafc;

  td { padding: 14px 20px !important; vertical-align: middle; }
  &:hover td { background: #f8fafc !important; }
  &:last-child { border-bottom: none; }
}

/* User cell */
.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar-wrap { position: relative; flex-shrink: 0; }

.user-avatar {
  width: 40px; height: 40px;
  border-radius: 10px;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0,0,0,0.12);

  &--img { object-fit: cover; background: #f0f4f8; }
}

.user-cell-info {
  .user-cell-name { display: block; font-size: 14px; font-weight: 600; color: #0f172a; line-height: 1.3; }
  .user-cell-id   { display: block; font-size: 11px; color: #94a3b8; font-family: monospace; margin-top: 2px; }
}

/* Email */
.cell-email { font-size: 13px; color: #475569; }

/* Role pill — table (solid vivid colors, white text) */
.table-role-pill {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 700;
  padding: 5px 14px;
  border-radius: 20px;
  text-transform: capitalize;
  letter-spacing: 0.3px;
  color: #ffffff;

  &--doctor  { background: #1d4ed8; box-shadow: 0 2px 6px rgba(29,78,216,0.35); }
  &--patient { background: #0f766e; box-shadow: 0 2px 6px rgba(15,118,110,0.35); }
  &--admin   { background: #6d28d9; box-shadow: 0 2px 6px rgba(109,40,217,0.35); }
}

/* Status cell */
.status-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;

  &--active   { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; .status-dot-sm { background: #22c55e; } }
  &--inactive { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; .status-dot-sm { background: #ef4444; } }

  .status-dot-sm {
    width: 7px; height: 7px; border-radius: 50%;
    animation: statusPulse 2s ease infinite;
  }
}

@keyframes statusPulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}

/* Verified cell */
.verified-cell {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;

  &--yes { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
  &--no  { background: #fff7ed; color: #ea580c; border: 1px solid #fed7aa; }
}

/* Date cell */
.date-cell { font-size: 13px; color: #64748b; font-weight: 500; }

/* Actions */
.row-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 7px;
  font-size: 11px;
  font-weight: 600;
  border: 1.5px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  line-height: 1;

  &:disabled { opacity: 0.5; cursor: not-allowed; }

  &--deactivate {
    background: #fff7ed;
    color: #c2410c;
    border-color: #fed7aa;
    &:hover { background: #ea580c; color: #fff; border-color: #ea580c; transform: translateY(-1px); box-shadow: 0 3px 8px rgba(234,88,12,0.25); }
  }

  &--activate {
    background: #f0fdf4;
    color: #15803d;
    border-color: #bbf7d0;
    &:hover { background: #16a34a; color: #fff; border-color: #16a34a; transform: translateY(-1px); box-shadow: 0 3px 8px rgba(22,163,74,0.25); }
  }

  &--delete {
    background: #fef2f2;
    color: #b91c1c;
    border-color: #fecaca;
    &:hover { background: #dc2626; color: #fff; border-color: #dc2626; transform: translateY(-1px); box-shadow: 0 3px 8px rgba(220,38,38,0.25); }
  }

  &--view {
    background: #f8fafc;
    color: #475569;
    border-color: #e2e8f0;
    &:hover { background: #0f172a; color: #fff; border-color: #0f172a; transform: translateY(-1px); box-shadow: 0 3px 8px rgba(15,23,42,0.2); }
  }
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid #f0f4f8;
  background: #fafbfc;

  .footer-total { font-size: 13px; color: #64748b; font-weight: 500; }
}

.no-data-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px;
  color: #94a3b8;
  p { margin: 10px 0 0; font-size: 14px; }
}

/* Dialog */
.nexus-dialog { min-width: 400px; border-radius: 16px !important; overflow: hidden; }

.dialog-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 20px 16px;
  border-bottom: 1px solid #f0f4f8;
}

.dialog-icon {
  width: 44px; height: 44px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;

  &--red { background: linear-gradient(135deg, #ef4444, #dc2626); }
}

.dialog-title { font-size: 16px; font-weight: 700; color: #0f172a; }
.dialog-sub   { font-size: 12px; color: #94a3b8; margin-top: 2px; }

.delete-confirm-text { font-size: 14px; color: #334155; margin: 0 0 10px; }
.delete-warning {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #dc2626;
  background: #fef2f2;
  padding: 8px 12px;
  border-radius: 7px;
}

/* ── User Detail Drawer ──────────────────────────────────── */
.user-detail-drawer {
  background: #ffffff !important;
  border-left: 1px solid #eef0f4 !important;
  box-shadow: -8px 0 32px rgba(0,0,0,0.1) !important;
}

.drawer-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
  color: #94a3b8;
  font-size: 14px;
}

.drawer-content {
  height: 100%;
  overflow-y: auto;
  padding-bottom: 32px;
}

.drawer-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 24px 20px 20px;
  background: linear-gradient(135deg, #0a1628 0%, #1e3a5f 100%);
  position: relative;
}

.drawer-avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.drawer-avatar {
  width: 64px; height: 64px;
  border-radius: 16px;
  color: #fff;
  font-size: 22px;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);

  &--img {
    object-fit: cover;
    background: rgba(255,255,255,0.1);
  }
}

.drawer-avatar-badge {
  position: absolute;
  bottom: -4px; right: -4px;
  width: 20px; height: 20px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid #0a1628;

  &.badge--active   { background: #22c55e; }
  &.badge--inactive { background: #ef4444; }
}

.drawer-header-info {
  flex: 1;
  min-width: 0;

  .drawer-name  { font-family: 'Poppins', sans-serif; font-size: 18px; font-weight: 700; color: #ffffff; margin: 0 0 4px; }
  .drawer-email { font-size: 13px; color: rgba(255,255,255,0.55); margin: 0 0 10px; }
}

.drawer-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.role-pill {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  text-transform: capitalize;

  &--doctor  { background: rgba(37,99,235,0.2); color: #93c5fd; border: 1px solid rgba(37,99,235,0.3); }
  &--patient { background: rgba(13,148,136,0.2); color: #5eead4; border: 1px solid rgba(13,148,136,0.3); }
  &--admin   { background: rgba(124,58,237,0.2); color: #c4b5fd; border: 1px solid rgba(124,58,237,0.3); }
}

.verif-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;

  &--yes { background: rgba(34,197,94,0.2); color: #86efac; border: 1px solid rgba(34,197,94,0.3); }
  &--no  { background: rgba(249,115,22,0.2); color: #fdba74; border: 1px solid rgba(249,115,22,0.3); }
}

.drawer-close {
  color: rgba(255,255,255,0.5) !important;
  flex-shrink: 0;
  &:hover { color: #fff !important; background: rgba(255,255,255,0.1) !important; }
}

.drawer-actions {
  display: flex;
  gap: 10px;
  padding: 14px 20px;
  border-bottom: 1px solid #f0f4f8;
  background: #f8fafc;
}

.drawer-section {
  padding: 16px 20px;
  border-bottom: 1px solid #f8fafc;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.7px;
  margin-bottom: 12px;
}

.info-grid { display: flex; flex-direction: column; gap: 8px; }

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid #f8fafc;

  &:last-child { border-bottom: none; }
}

.info-key {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
  flex-shrink: 0;
  min-width: 110px;
}

.info-val {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  text-align: right;
  word-break: break-all;

  &--mono     { font-family: monospace; font-size: 12px; color: #475569; }
  &--specialty{ color: #2563eb; }
  &--fee      { color: #16a34a; }
}

.blood-group {
  background: #fef2f2;
  color: #dc2626;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
}

.address-block {
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px 14px;

  p { font-size: 13px; color: #334155; margin: 0 0 2px; line-height: 1.5; }
}

.chip-group { display: flex; flex-direction: column; gap: 6px; }
.chip-group-label { font-size: 11px; color: #94a3b8; font-weight: 600; }

.chip-list { display: flex; flex-wrap: wrap; gap: 6px; }

.med-chip {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;

  &--red    { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
  &--orange { background: #fff7ed; color: #ea580c; border: 1px solid #fed7aa; }
}

.qual-chip {
  background: #eff6ff;
  color: #2563eb;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
  border: 1px solid #bfdbfe;
}

.bio-text {
  font-size: 13px;
  color: #475569;
  line-height: 1.6;
  margin: 0;
  background: #f8fafc;
  padding: 12px 14px;
  border-radius: 8px;
}

.report-list { display: flex; flex-direction: column; gap: 6px; }

.report-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #f8fafc;
  border: 1px solid #eef0f4;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.15s;

  &:hover { background: #f0f4f8; border-color: #cbd5e1; }
}

.report-icon {
  width: 32px; height: 32px;
  background: #fff;
  border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  border: 1px solid #eef0f4;
}

.report-info {
  flex: 1;
  min-width: 0;
  .report-title { display: block; font-size: 13px; font-weight: 600; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .report-date  { display: block; font-size: 11px; color: #94a3b8; margin-top: 1px; }
}

.rejection-banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 8px;
  padding: 12px 14px;

  .rejection-label { display: block; font-size: 11px; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .rejection-text  { font-size: 13px; color: #92400e; margin: 0; line-height: 1.5; }
}
</style>
