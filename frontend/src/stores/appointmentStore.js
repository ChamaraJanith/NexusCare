import { defineStore } from 'pinia';
import { searchDoctors, bookAppointment, getNextQueueNumber } from '../services/appointmentService';

export const useAppointmentStore = defineStore('appointment', {
  state: () => ({
    searchFilters: {
      name: '',
      specialization: null, // Note: user's query calls it 'specialization' in instructions
      hospital: null,
      date: ''
    },
    doctors: [],
    loading: false,

    selectedDoctor: null,
    selectedDate: '',
    selectedSlot: null,
    consultationType: 'Physical',
    queueInfo: null,

    patientDetails: {
      title: 'Mr',
      name: '',
      mobile: '',
      email: '',
      nationality: 'Local',
      nic: ''
    },

    fees: {
      doctorFee: 0,
      bookingFee: 300,
      hospitalFee: 500,
    },

    appointmentId: null,

    timeLeft: 0,
    timer: null,
  }),

  getters: {
    formattedTimeLeft: (state) => {
      const minutes = Math.floor(state.timeLeft / 60);
      const seconds = state.timeLeft % 60;
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    },
    totalFee: (state) => {
      let t = Number(state.fees.doctorFee) + Number(state.fees.bookingFee);
      if (state.consultationType === 'Physical') {
        t += Number(state.fees.hospitalFee);
      }
      return t;
    }
  },

  actions: {
    async fetchDoctors(filters) {
      this.loading = true;
      try {
        const data = await searchDoctors(filters);
        this.doctors = data; // MUST use data, not data.data
      } catch (e) {
        console.error(e);
      } finally {
        this.loading = false;
      }
    },

    setSearchFilters(filters) {
      this.searchFilters = { ...this.searchFilters, ...filters };
    },

    clearFilters() {
      this.searchFilters = { name: '', specialization: null, hospital: null, date: '' };
      this.fetchDoctors(this.searchFilters);
    },

    selectDoctor(doctor) {
      this.selectedDoctor = doctor;
      this.selectedDate = this.searchFilters.date || new Date().toISOString().split('T')[0];
      this.fees.doctorFee = Number(doctor.fee) || 3000;
      this.selectedSlot = null;
    },

    selectSlot(slot, type) {
      this.selectedSlot = slot;
      this.consultationType = type;
    },
    
    async fetchQueueNumber() {
      if (this.selectedDoctor && this.selectedDate) {
        try {
           const res = await getNextQueueNumber(this.selectedDoctor._id || this.selectedDoctor.id, this.selectedDate);
           this.queueInfo = res;
        } catch(e) { console.error(e); }
      }
    },

    startTimer() {
      this.stopTimer();
      this.timeLeft = 600;
      this.timer = setInterval(() => {
        this.timeLeft--;
        if (this.timeLeft <= 0) {
          clearInterval(this.timer);
          alert("Session expired");
          window.location.href = "/search";
        }
      }, 1000);
    },

    stopTimer() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    },

    clearSession() {
      this.stopTimer();
      this.selectedDoctor = null;
      this.selectedSlot = null;
      this.queueInfo = null;
    },

    async submitBooking() {
      const payload = {
        doctorId: this.selectedDoctor._id || this.selectedDoctor.id,
        date: this.selectedDate,
        time: this.selectedSlot.startTime,
        type: this.consultationType,
        patient: this.patientDetails,
        totalFee: this.totalFee,
      };

      const result = await bookAppointment(payload);
      if (result && (result._id || result.id || result.appointmentId)) {
        this.appointmentId = result._id || result.id || result.appointmentId;
        this.stopTimer();
        return true;
      }
      return false;
    }
  }
});
