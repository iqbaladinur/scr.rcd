<template>
    <div v-if="video">
        <div v-if="!isMobile" class="flex items-center justify-end gap-4">
            <div class="flex-1">
                <fieldset class="rounded-lg border px-3 py-1.5 -mt-1">
                    <legend class="px-1 text-xs font-medium">Logs</legend>
                    <p class="text-xs">
                        {{ loading.msg || '-' }}
                    </p>
                </fieldset>
            </div>  
            <div class="flex items-center justify-end gap-3">
                <Button size="sm" @click="downloadFile(false)">
                    Download as webm
                </Button>
                <Button size="sm" @click="downloadAsMp4()" :disabled="disabledDownloadAsMp4" class="gap-2">
                    <Loader v-if="loading.converting || loading.loadingScript" class="size-4 animate-spin"></Loader>
                    {{ loading.loadingScript ? 'Loading ffmpeglib' : 'Download as mp4' }}
                </Button>
            </div>
        </div>
        <div class="flex-1 mt-4 overflow-y-auto">
            <div class="p-4 rounded-xl flex items-start justify-center" :class="{ 'border': !isMobile, 'flex-1 bg-blue-400': isMobile }">
                <video
                    v-if="!isMobile"
                    id="videoPlayer"
                    ref="videoPlayerRef"
                    controls
                    :src="videoUrl"
                    class="rounded-lg"
                    :class="{ 'vertical-video': isVertical, 'horizontal-video': !isVertical }"
                    @loadedmetadata="handleMetaData"
                >
                    Your browser does not support the video tag.
                </video>
                <div v-else class="w-full flex flex-col items-center gap-2 p-2">
                    <div class="w-full h-[200px] bg-black/50 rounded flex items-center justify-center">
                        <AudioLines class="size-20"></AudioLines>
                    </div>
                    <p class="w-full text-center">{{ video.name }}</p>
                    <audio ref="audioPlayer" controls :src="videoUrl" class="w-full mt-10">
                        Your browser does not support the audio tag.
                    </audio>
                </div>
            </div>
            <VideoCutter v-if="!isMobile && isFinite(videoDuration) && !resetVideoCutter" :duration="videoDuration" class="mt-4" @resize="handleSeek">
                <Button size="sm" @click="cutAndDownload()" :disabled="disabledDownloadCuttedDuration">
                    <Loader v-if="loading.cutting || loading.loadingScript" class="size-4 animate-spin"></Loader>
                    Download Cut Duration
                </Button>
            </VideoCutter>
            <Button v-show="isMobile" class="mt-5 rounded-full" size="sm" variant="outline" @click="downloadFile(true)">
                <ArrowBigDownDash class="size-4 mr-1"></ArrowBigDownDash>
                Download Audio
            </Button>
        </div>
    </div>
    <div v-else class="flex-1 flex items-center justify-center flex-col gap-2">
        <Rabbit class="size-16"></Rabbit>
        Nothing to display...
    </div>
</template>
<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { Button } from "@/components/ui/button";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import type { Log } from '@ffmpeg/types/types/index';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { useToast } from '@/components/ui/toast/use-toast';
import { Loader, Rabbit, AudioLines, ArrowBigDownDash } from "lucide-vue-next";
import { useIsMobile } from '@/composables/isMobileStore';
import VideoCutter from "@/components/VideoCutter.vue";

const baseURLFFmpeg = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm';

const ffmpeg = new FFmpeg(); 
const loading= reactive({
    converting: false,
    loadedScript: false,
    loadingScript: false,
    cutting: false,
    msg: ''
});
interface Props {
    video?: VideoSaved | null
}

const props = defineProps<Props>();
const { toast } = useToast();
const { isMobile } = useIsMobile();
const audioPlayer = ref<HTMLAudioElement | undefined>(undefined);
const videoPlayerRef = ref<HTMLVideoElement | undefined>();
const isVertical = ref<boolean>(false);
const videoDuration = ref<number>(0);
const durationCut = reactive({
    start: 0,
    end: 0
});
const resetVideoCutter = ref(false);
const timerResetVideoCutter = ref<NodeJS.Timeout | null>(null);

const videoUrl = computed(() => {
    if (props.video) {
        const url = URL.createObjectURL(props.video.blob);
        return url;
    }
    return '';
});

watch(() => props.video, () => {
    if (timerResetVideoCutter.value) {
        clearTimeout(timerResetVideoCutter.value);
    }
    resetVideoCutter.value = true;
    timerResetVideoCutter.value = setTimeout(() => {
        resetVideoCutter.value = false;
    }, 200);
});

const disabledDownloadAsMp4 = computed(() => {
    return loading.converting || !loading.loadedScript;
});

const disabledDownloadCuttedDuration = computed(() => {
    return loading.cutting || !loading.loadedScript;
});

async function LoadFfmpeg() {
    try {
        loading.loadedScript = false;
        loading.loadingScript = true;
        ffmpeg.on('log', ({ message: msg }: Log) => {
            console.log(msg);
            loading.msg = msg;
        });
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURLFFmpeg}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURLFFmpeg}/ffmpeg-core.wasm`, 'application/wasm'),
            workerURL: await toBlobURL(`${baseURLFFmpeg}/ffmpeg-core.worker.js`, 'text/javascript')
        });
        loading.loadingScript = false;
        loading.loadedScript = true;
    } catch (error: any) {
        console.log(error);
        toast({
            title: 'Failed',
            description: error?.message,
            variant: 'destructive'
        });
    }
}

async function downloadAsMp4() {
    if (!props.video) {
        return
    }
    try {
        loading.converting = true;
        const webmName = `${props.video.name}.webm`;
        const mp4Name = `${props.video.name}.mp4`;
        const dataFile = await fetchFile(props.video.blob);
        const res = await ffmpeg.writeFile(webmName, dataFile);
        console.log('write:', res);
        const execute = await ffmpeg.exec([
            '-i',
            webmName,
            '-c:v',
            'copy',
            '-c:a',
            'aac',
            '-strict',
            'experimental',
            mp4Name
        ]);
        console.log('exec:', execute);
        const data = await ffmpeg.readFile(mp4Name);
        const urlDownload = URL.createObjectURL(new Blob([(data as Uint8Array).buffer], { type: 'video/mp4' }));
        const a = <HTMLAnchorElement>document.createElement('a');
        document.body.appendChild(a);
        a.href = urlDownload;
        a.download = mp4Name;
        a.click();
        loading.converting = false;
    } catch (error: any) {
        console.log(error);
        toast({
            title: 'Failed',
            description: error?.message,
            variant: 'destructive'
        });
        loading.converting = false;
        loading.msg = '';
    }
}

async function cutAndDownload() {
    if (!props.video || durationCut.end === 0) {
        toast({
            title: 'Error',
            description: 'End duration cut not setted',
            variant: 'destructive'
        });
        return
    }

    try {
        loading.cutting = true;
        const webmName = `${props.video.name}.webm`;
        const cuttedName = `${props.video.name}-cutted.mp4`;
        const dataFile = await fetchFile(props.video.blob);
        const res = await ffmpeg.writeFile(webmName, dataFile);
        console.log('write:', res);
        const execute = await ffmpeg.exec([
            '-i',
            webmName,
            '-ss',
            `${durationCut.start}`,
            '-to',
            `${durationCut.end}`,
            '-c:v',
            'copy',
            '-c:a',
            'aac',
            '-strict',
            'experimental',
            cuttedName
        ]);
        console.log('exec:', execute);
        const data = await ffmpeg.readFile(cuttedName);
        const urlDownload = URL.createObjectURL(new Blob([(data as Uint8Array).buffer], { type: 'video/mp4' }));
        const a = <HTMLAnchorElement>document.createElement('a');
        document.body.appendChild(a);
        a.href = urlDownload;
        a.download = cuttedName;
        a.click();
        loading.cutting = false;
    } catch (error: any) {
        console.log(error);
        toast({
            title: 'Failed',
            description: error?.message,
            variant: 'destructive'
        });
        loading.cutting = false;
        loading.msg = '';
    }
}

const downloadFile = (audio: boolean = false) => {
    if (!videoUrl.value || !props.video) {
        return 
    }
    const a = <HTMLAnchorElement>document.createElement('a');
    document.body.appendChild(a);
    a.href = videoUrl.value;
    a.download = `${props.video.name}.${audio ? 'wav' : 'webm'}`;
    a.click();
}

function handleMetaData(e: Event) {
    const vidEl = <HTMLVideoElement>e.target;
    isVertical.value = vidEl.videoWidth < vidEl.videoHeight;
    videoDuration.value = vidEl.duration;
}

function handleSeek(time: { start: number, end: number }) {
    if (videoPlayerRef.value) {
        videoPlayerRef.value.currentTime = time.start;
    }
    durationCut.start = time.start;
    durationCut.end = time.end;
}

onMounted(async() => {
    if (!loading.loadedScript && !loading.loadingScript && !isMobile.value) {
        LoadFfmpeg();
    }
})
</script>

<style scoped lang="css">
.vertical-video {
    height: calc(100vh - 360px);
}
.horizontal-video {
    height: calc(100vh - 360px);
}
</style>