<script lang="ts" setup>
import { db } from '@/db/db';
import { Button } from "@/components/ui/button";
import { onMounted, ref } from "vue";
import { useToast } from '@/components/ui/toast/use-toast';
import { Play, StopCircle, Trash, Mic } from "lucide-vue-next";
import { useVideo } from '@/composables/videoStore';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider
} from "@/components/ui/tooltip";

interface Props {
    mobile?: boolean;
}

defineProps<Props>();

const recordedVideos = ref<VideoSaved[]>([]);
const { toast } = useToast();
const { video: selectedVideo } = useVideo();
const isRecording = ref<boolean>(false);
const mediaRecorder = ref<MediaRecorder | null>(null);
const recordedType = ref<'scr' | 'scr_mic'>('scr');

// get media screen recorder
async function captureScreen(audio: boolean = false) {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: audio ? {
            echoCancellation: true,
            noiseSuppression: true,
        } : false
    });
    return screenStream;
}

async function captureAudio() {
    const config = {
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100,
        },
        video: false,
    };
    const audioStream = await navigator.mediaDevices.getUserMedia(config);
    return audioStream;
}

const startRecordingWithAudioMic = async () => {
    try {
        recordedType.value = 'scr_mic';
        const audioStream = await captureAudio();
        const screenStream = await captureScreen();
        const stream = new MediaStream([...screenStream.getTracks(), ...audioStream.getTracks()]);
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
            const tracks = stream.getTracks();
            tracks.forEach((tr) => tr.stop());
            saveToIndexedDB(recordedBlob, true);
        };

        mediaRecorder.value.start(200);
        isRecording.value = true;
    } catch (error: any) {
        toast({
            title: 'Failed',
            description: error?.message,
            variant: 'destructive'
        });
    }
}

const startRecording = async() => {
    try {
        recordedType.value = 'scr';
        const stream = await captureScreen(true);
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
            const tracks = stream.getTracks();
            let audioEnable = false;
            tracks.forEach((tr) => {
                if (tr.kind === 'audio') {
                    audioEnable = true;
                };
                tr.stop();
            });
            saveToIndexedDB(recordedBlob, audioEnable);
        };

        mediaRecorder.value.start(200);
        isRecording.value = true;
    } catch (error: any) {
        toast({
            title: 'Failed',
            description: error?.message,
            variant: 'destructive'
        });
    }
};

// Function to save the recorded video to IndexedDB
const saveToIndexedDB = async (blob: Blob, audio: boolean = false) => { 
    try {
        const now = new Date();
        const videoName = `vid-rcd-${now.toLocaleDateString().replace(/\//gi, '-')}-${now.toLocaleTimeString().replace(/:/gi, '-')}`;
        const data:VideoSaved = { name: videoName, blob, audio: audio };
        const id = await db.videos.add(data);
        toast({
            title: 'Video Saved',
            description: 'Successfully saved a video'
        });
        getRecordedVideosFromIndexedDB(id);
    } catch (error: any) {
        toast({
            title: 'Failed Saving',
            description: error?.message,
            variant: 'destructive'
        });
    }
};

const stopRecording = () => {
    if (mediaRecorder.value) {
        mediaRecorder.value?.stop();
    }
}

// get data from indexed db

const getRecordedVideosFromIndexedDB = async(id?: number) => {
    try {
        recordedVideos.value = await db.videos.reverse().toArray();
        if (id) {
            const data = recordedVideos.value.find(dt => dt.id === id) || null;
            selectedVideo.value = <VideoSaved | null>data;
        }
    } catch (error) {
        console.log(error);
    }
};

const deleteData = async (video: VideoSaved) => {
    try {
        const id = <number>video.id;
        await db.videos.where('id').equals(id).delete();
        if (id === selectedVideo?.value?.id) {
            selectedVideo.value = null;
        }
        toast({
            title: 'Data deleted',
            description: 'Successfully delete a video'
        });
        getRecordedVideosFromIndexedDB();
    } catch (error: any) {
        toast({
            title: 'Failed',
            description: error?.message,
            variant: 'destructive'
        });
    }
}

onMounted(() => {
    getRecordedVideosFromIndexedDB();
});
</script>
<template>
<div class="relative flex-col items-start gap-8 md:flex" :class="{ 'hidden': !mobile }">
    <div class="grid w-full items-start gap-6">
    <div class="w-full grid gap-2">
        <template v-if="!isRecording">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger as-child>
                        <Button @click="startRecording()">
                            <Play class="size-5 mr-4"></Play>
                            Start Recording Screen Only
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" :side-offset="5" :class="{ 'hidden': mobile }">
                        Audio only available on chrome tab.
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <Button @click="startRecordingWithAudioMic()">
                <Mic class="size-5 mr-4"></Mic>
                Start Recording with Mic
            </Button>
        </template>
        <Button v-if="isRecording" @click="stopRecording()" variant="destructive" class="animate-pulse">
            <StopCircle class="size-5 mr-4"></StopCircle>
            Stop Recording {{ recordedType === 'scr_mic' ? 'with Mic' : 'Screen' }}
        </Button>
    </div>
    <fieldset class="rounded-lg border p-4">
        <legend class="-ml-1 px-1 text-sm font-medium">Recorded Videos</legend>
        <ul>
            <li
                v-for="video in recordedVideos"
                class="flex items-center hover:bg-slate-100 py-2 px-3 rounded-md cursor-pointer gap-3"
                :class="{ 'bg-slate-100': selectedVideo?.id === video.id }"
                @click="selectedVideo = video"
            >
                <p class="truncate flex-1">{{ video.name }}</p>
                <Button size="icon" variant="ghost" class="w-4 h-4 text-red-500 hover:text-red-700" @click.stop="deleteData(video)">
                    <Trash class="w-4 h-4"></Trash>
                </Button>
            </li>
            <li v-if="recordedVideos.length === 0">
                No data saved.
            </li>
        </ul>
    </fieldset>
    </div>
</div>
</template>
