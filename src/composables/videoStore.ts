import { ref } from 'vue';
const video = ref<VideoSaved | null>(null);
const useVideo = () => ({
    video
})
export {
    useVideo
}