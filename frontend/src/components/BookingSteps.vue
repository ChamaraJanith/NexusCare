<template>
  <div class="booking-steps-wrapper q-py-md">
    <div class="q-px-md flex items-center justify-between text-white text-caption text-weight-medium">
      <div 
        v-for="(step, index) in steps" 
        :key="index"
        :class="['step-item flex column items-center cursor-pointer', { active: currentStep >= step.number, completed: currentStep > step.number }]"
        @click="goToStep(step)"
      >
        <div class="step-circle q-mb-xs flex flex-center">
          <q-icon v-if="currentStep > step.number" name="check" size="14px" color="white" />
          <span v-else>{{ step.number }}</span>
        </div>
        <div class="step-label text-center" :class="{ 'text-cyan-3': currentStep >= step.number, 'text-grey-6': currentStep < step.number }">
          {{ step.label }}
        </div>
      </div>
    </div>
    <div class="step-line-bg relative-position q-mt-md q-mx-md">
      <div class="step-line-fill" :style="{ width: progressWidth + '%' }"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps({
  currentStep: {
    type: Number,
    required: true
  }
});

const router = useRouter();

const steps = [
  { number: 1, label: 'Search', route: '/appointment' },
  { number: 2, label: 'Slots', route: null },
  { number: 3, label: 'Details', route: '/appointment/form' },
  { number: 4, label: 'Payment', route: '/appointment/summary' },
];

const progressWidth = computed(() => {
  if (props.currentStep <= 1) return 0;
  return ((props.currentStep - 1) / (steps.length - 1)) * 100;
});

const goToStep = (step) => {
  if (step.number < props.currentStep && step.route) {
    router.push(step.route);
  } else if (step.number === 1) {
    router.push('/appointment');
  }
};
</script>

<style scoped>
.booking-steps-wrapper {
  background: rgba(10, 15, 30, 0.6);
  backdrop-filter: blur(12px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}
.step-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  color: #9ca3af;
  font-size: 12px;
  border: 2px solid transparent;
}
.step-item.active .step-circle {
  background: linear-gradient(135deg, #0ea5e9, #14b8a6);
  color: white;
  box-shadow: 0 0 12px rgba(14, 165, 233, 0.4);
}
.step-item.completed .step-circle {
  background: #14b8a6;
}
.step-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
.step-line-bg { height: 4px; background: rgba(255, 255, 255, 0.08); border-radius: 2px; overflow: hidden; }
.step-line-fill { height: 100%; background: linear-gradient(90deg, #0ea5e9, #14b8a6); transition: width 0.4s ease; }
</style>
