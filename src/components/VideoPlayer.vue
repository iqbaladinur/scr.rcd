<template>
    <div v-if="video">
        <div class="flex items-center justify-end gap-4">
            <div v-if="!isMobile" class="flex-1">
                <fieldset class="rounded-lg border px-3 py-1.5 -mt-1">
                    <legend class="px-1 text-xs font-medium">Logs</legend>
                    <p class="text-xs">
                        {{ loading.msg || '-' }}
                    </p>
                </fieldset>
            </div>  
            <div class="flex items-center justify-end gap-3">
                <template v-if="!isMobile">
                    <Button size="sm" @click="downloadFile(false)">
                        Download as webm
                    </Button>
                    <Button size="sm" @click="downloadAsMp4()" :disabled="disabledDownloadAsMp4" class="gap-2">
                        <Loader v-if="loading.converting || loading.loadingScript" class="size-4 animate-spin"></Loader>
                        {{ loading.loadingScript ? 'Loading ffmpeglib' : 'Download as mp4' }}
                    </Button>
                </template>
                <Button v-else size="sm" @click="downloadFile(true)">
                    Download
                </Button>
            </div>
        </div>
        <div class="flex-1 mt-4 overflow-y-auto">
            <div class="p-2 rounded-xl border flex items-start justify-center">
                <video v-if="!isMobile" id="videoPlayer" controls :src="videoUrl" class="rounded-lg">
                    Your browser does not support the video tag.
                </video>
                <div v-else class="w-full flex flex-col items-center gap-2">
                    <p>{{ video.name }}</p>
                    <audio controls :src="videoUrl">
                        Your browser does not support the audio tag.
                    </audio>
                </div>
            </div>
        </div>
    </div>
    <div v-else class="flex-1 flex items-center justify-center">
        No video selected
    </div>
</template>
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { Button } from "@/components/ui/button";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import type { Log } from '@ffmpeg/types/types/index';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { useToast } from '@/components/ui/toast/use-toast';
import { Loader } from "lucide-vue-next";

const baseURLFFmpeg = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm';

const ffmpeg = new FFmpeg(); 
const loading= reactive({
    converting: false,
    loadedScript: false,
    loadingScript: false,
    msg: ''
});
interface Props {
    video?: VideoSaved | null
}

const props = defineProps<Props>();
const { toast } = useToast();
const videoUrl = computed(() => {
    if (props.video) {
        const url = URL.createObjectURL(props.video.blob);
        return url;
    }
    return '';
});

const disabledDownloadAsMp4 = computed(() => {
    return loading.converting || !loading.loadedScript;
});

const isMobile = ref<boolean>(false);

function checkMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

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
        console.log(urlDownload)
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

onMounted(async() => {
    isMobile.value = checkMobile();
    if (!loading.loadedScript && !loading.loadingScript && !isMobile.value) {
        LoadFfmpeg();
    }
})
</script>