<template>
  <q-page class="flex flex-center bg-dark text-white font-jakarta">
    <div class="text-center">
      <q-spinner-dots color="blue-5" size="4em" />
      <div class="q-mt-md text-h6">Confirming Payment...</div>
      <div class="text-grey-5">Please wait, redirecting to receipt...</div>
    </div>
  </q-page>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()

onMounted(async () => {
  const status = route.query.status
  let rawOrderId = route.query.order_id

  // convert to string safely
  if (Array.isArray(rawOrderId)) {
    rawOrderId = rawOrderId[0]
  }

const orderId = rawOrderId ? String(rawOrderId).split(',')[0] : null

  if (status === 'success' && orderId) {
    try {
      const token = localStorage.getItem('nexus_token') || localStorage.getItem('token')
      
      await axios.post('http://localhost:5005/api/payments/confirm', 
        { orderId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      $q.notify({
        type: 'positive',
        message: 'Payment confirmed!'
      })
      
      router.push(`/receipt/${orderId}`)
    } catch (error) {
      console.error('Payment confirm error:', error)
      $q.notify({
        type: 'negative',
        message: 'Payment confirmation failed'
      })
      router.push('/patient/dashboard')
    }
  } else {
    $q.notify({
      type: 'warning',
      message: 'Payment was cancelled or invalid.'
    })
    router.push('/patient/dashboard')
  }
})

</script>

<style scoped>
.font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }
</style>