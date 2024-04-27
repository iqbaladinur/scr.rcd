<template>
    <div class="flex items-center justify-end gap-3">
        <Button size="sm" @click="downloadVideo()">
            Download video
        </Button>
    </div>
    
    <div class="flex-1 mt-4 overflow-y-auto">
        <div class="p-2 rounded-xl border">
            <video id="videoPlayer" controls :src="videoUrl" class="rounded-lg">
                Your browser does not support the video tag.
            </video>
        </div>
    </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { Button } from "@/components/ui/button";

interface Props {
    video?: VideoSaved
}

const props = defineProps<Props>();

const videoUrl = computed(() => {
    if (props.video) {
        const url = URL.createObjectURL(props.video.blob);
        return url;
    }
    return '';
});

const downloadVideo = () => {
    if (!videoUrl.value || !props.video) {
        return 
    }
    const a = <HTMLAnchorElement>document.createElement('a');
    document.body.appendChild(a);
    a.href = videoUrl.value;
    a.download = `${props.video.name}.webm`;
    a.click();
}
</script>