<template>
  <q-form @submit="submit">

    <q-input v-model="form.date" type="date" label="Date" />
    <q-input v-model="form.startTime" type="time" label="Start Time" />
    <q-input v-model="form.endTime" type="time" label="End Time" />

    <q-btn label="Save" type="submit" color="primary" />

  </q-form>
</template>

<script setup>
import { reactive } from "vue"

const form = reactive({
  date: "",
  startTime: "",
  endTime: ""
})

const submit = () => {
  console.log(form)
}
</script>