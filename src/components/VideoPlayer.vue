<template>
    <div v-if="video">
        <div class="flex items-center justify-end gap-4">
            <div v-if="!video.audio" class="flex-1">
                <fieldset class="rounded-lg border px-3 py-1.5 -mt-1">
                    <legend class="px-1 text-xs font-medium">Logs</legend>
                    <p class="text-xs">
                        {{ loading.msg || '-' }}
                    </p>
                </fieldset>
            </div>  
            <div class="flex items-center justify-end gap-3">
                <Button size="sm" @click="downloadVideo()">
                    Download as webm
                </Button>
                <div class="flex gap-2 relative items-center">
                    <Button size="sm" @click="downloadAsMp4()" :disabled="disabledDownloadAsMp4" class="gap-2">
                        <Loader v-if="loading.converting || loading.loadingScript" class="size-4 animate-spin"></Loader>
                        <span class="mr-3">
                            {{ loading.loadingScript ? 'Loading ffmpeglib' : 'Download as mp4' }}
                        </span>
                    </Button>
                    <TooltipProvider v-if="!!video.audio">
                        <Tooltip>
                            <TooltipTrigger as-child>
                                <Info class="size-3 absolute right-0 mr-2 text-white"></Info>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" :side-offset="5">
                                Available only for non audio video.
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
        </div>
        <div class="flex-1 mt-4 overflow-y-auto">
            <div class="p-2 rounded-xl border">
                <video id="videoPlayer" controls :src="videoUrl" class="rounded-lg">
                    Your browser does not support the video tag.
                </video>
            </div>
        </div>
    </div>
    <div v-else class="flex-1 flex items-center justify-center">
        No video selected
    </div>
</template>
<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue';
import { Button } from "@/components/ui/button";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import type { Log } from '@ffmpeg/types/types/index';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { useToast } from '@/components/ui/toast/use-toast';
import { Loader, Info } from "lucide-vue-next";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider
} from "@/components/ui/tooltip";

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
        if (!loading.loadedScript && !props.video.audio && !loading.loadingScript) {
            LoadFfmpeg();
        }
        const url = URL.createObjectURL(props.video.blob);
        return url;
    }
    return '';
});

const disabledDownloadAsMp4 = computed(() => {
    return loading.converting || props.video?.audio || !loading.loadedScript;
});

async function LoadFfmpeg() {
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
        const execute = await ffmpeg.exec(['-i', webmName, mp4Name]);
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

onMounted(async() => {
    
})
</script>