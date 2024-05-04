import { ref } from "vue";

const isMobile = ref<boolean>(false);

function setMobile() {
     isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

const useIsMobile = () => ({
  isMobile,
  setMobile
});

export {
  useIsMobile
}