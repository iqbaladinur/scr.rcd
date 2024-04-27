<script lang="ts" setup>
import { db } from '@/db/db';
import { Button } from "@/components/ui/button";
import { onMounted, ref } from "vue";
import { useToast } from '@/components/ui/toast/use-toast';
import { Play, Trash } from "lucide-vue-next";
import { useVideo } from '@/composables/videoStore';

interface Props {
    mobile?: boolean;
}

defineProps<Props>();

const recordedVideoBlob = ref<Blob | null>(null);
const recordedVideos = ref<VideoSaved[]>([]);
const { toast } = useToast();
const { video: selectedVideo } = useVideo();
const isRecording = ref<boolean>(false);
const mediaRecorder = ref<MediaRecorder | null>(null)

const startRecording = () => {
    navigator.mediaDevices.getDisplayMedia({ video: true }).then(stream => {
        mediaRecorder.value = new MediaRecorder(stream);
        const recordedChunks: Blob[] = [];

        mediaRecorder.value.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.value.onstop = () => {
            isRecording.value = false;
            const recordedBlob = new Blob(recordedChunks, { type: 'video/webm' });
            recordedVideoBlob.value = recordedBlob;
            saveToIndexedDB(recordedBlob);
        };

        mediaRecorder.value.start();
        isRecording.value = true;
        // setTimeout(() => {
        //     mediaRecorder.stop();
        // }, 10000);
    }).catch(error => {
        console.error('Error accessing media devices:', error);
    });
};

// Function to save the recorded video to IndexedDB
const saveToIndexedDB = async (blob: Blob) => { 
    try {
        const now = new Date();
        const videoName = `vid_rcd_${now.toLocaleDateString()}-${now.toLocaleTimeString()}`;
        const data:VideoSaved = { name: videoName, blob };
        await db.videos.add(data);
        toast({
            title: 'Video Saved',
            description: 'Successfully saved a video'
        });
        getRecordedVideosFromIndexedDB();
    } catch (error: any) {
        toast({
            title: 'Failed Saving',
            description: error?.message,
        });
    }
};

const stopRecording = () => {
    if (mediaRecorder.value) {
        mediaRecorder.value.stop();
    }
}

// get data from indexed db

const getRecordedVideosFromIndexedDB = async() => {
    try {
        recordedVideos.value = await db.videos.reverse().toArray();
    } catch (error) {
        console.log(error);
    }
};

onMounted(() => {
    getRecordedVideosFromIndexedDB();
});
</script>
<template>
<div class="relative flex-col items-start gap-8 md:flex" :class="{ 'hidden': !mobile }">
    <div class="grid w-full items-start gap-6">
    <Button v-if="!isRecording" @click="startRecording()">
        Start Recording
    </Button>
    <Button v-if="isRecording" @click="stopRecording()" class="animate-pulse" variant="destructive">
        Stop Recording
    </Button>
    <fieldset class="rounded-lg border p-4">
        <legend class="-ml-1 px-1 text-sm font-medium">Recorded Videos</legend>
        <ul>
            <li
                v-for="video in recordedVideos"
            >
                <div class="flex items-center hover:bg-slate-100 py-2 px-3 rounded-md cursor-pointer">
                    <p class="flex-1 truncate">{{ video.name }}</p>
                    <div class="flex items-center gap-3 justify-end flex-shrink-0">
                        <Play class="w-4 h-4"></Play>
                        <Button size="icon" variant="ghost" class="w-4 h-4 text-red-500 hover:text-red-600">
                            <Trash class="w-4 h-4"></Trash>
                        </Button>
                    </div>
                </div>
            </li>
        </ul>
    </fieldset>
    </div>
</div>
</template>
