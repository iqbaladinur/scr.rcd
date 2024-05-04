<template>
  <Home />
  <Toaster />
</template>
<script setup lang="ts">
import Home from '@/components/page/Home.vue';
import Toaster from '@/components/ui/toast/Toaster.vue';
import { useIsMobile } from './composables/isMobileStore';
import { onMounted } from 'vue';

const { setMobile } = useIsMobile();

onMounted(() => {
  setMobile();
});

</script>