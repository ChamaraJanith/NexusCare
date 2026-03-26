const mongoose = require('mongoose');

const videoSessionSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true // එකම Room ID එක දෙපාරක් එන්න බැහැ
  },
  patientId: {
    type: String,
    required: true
  },
  doctorId: {
    type: String,
    required: true
  },
  patientEmail: {
    type: String,
    default: ''
  },
  doctorEmail: {
    type: String,
    default: ''
  },
  patientPhone: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
    default: 'ACTIVE'
  }
}, { 
  timestamps: true // මෙයින් createdAt සහ updatedAt ස්වයංක්‍රීයව හැදෙනවා (History එකට වැදගත්)
});

module.exports = mongoose.model('VideoSession', videoSessionSchema);