<template>
  <div class="consultation-grid">

    <!-- LEFT PANEL -->
    <div class="left-panel">
      <PatientContextPanel :patient="patient" />
    </div>

    <!-- CENTER PANEL -->
    <div class="center-panel">

      <ClinicalNotesEditor />

      <div class="q-mt-md">
        <PrescriptionForm />
      </div>

    </div>

    <!-- RIGHT PANEL -->
    <div class="right-panel">
      <MedicalImageViewer />
    </div>

  </div>
</template>

<script setup>
import PatientContextPanel from "src/components/consultation/PatientContextPanel.vue"
import ClinicalNotesEditor from "src/components/consultation/ClinicalNotesEditor.vue"
import PrescriptionForm from "src/components/consultation/PrescriptionForm.vue"
import MedicalImageViewer from "src/components/consultation/MedicalImageViewer.vue"

const patient = {
  name: "John Doe",
  age: 32,
  bloodGroup: "O+",
  avatar: "https://cdn.quasar.dev/img/avatar.png",
  allergies: ["Penicillin", "Dust"],
  medicalHistory: [
    { id: 1, date: "2024", type: "Checkup" },
    { id: 2, date: "2023", type: "Flu" }
  ]
}
</script>

<style scoped>
.consultation-grid {
  display: grid;
  grid-template-columns: 300px 1fr 300px;
  gap: 16px;
}

.left-panel,
.center-panel,
.right-panel {
  height: 100%;
}
</style>