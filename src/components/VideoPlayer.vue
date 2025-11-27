<template>
    <div v-if="video">
        <div v-if="!isMobile" class="flex items-center justify-end gap-4">
            <div class="flex-1">
                <fieldset class="rounded-lg border px-3 py-1.5 -mt-1">
                    <legend class="px-1 text-xs font-medium">Logs</legend>
                    <p class="text-xs">
                        {{ loading.msg || "-" }}
                    </p>
                </fieldset>
            </div>
            <div class="flex items-center justify-end gap-3">
                <Button
                    @click="downloadFile(false)"
                    class="flex items-center gap-2 px-3 py-2 text-sm bg-gradient-to-r from-green-400 to-green-600 text-white font-semibold rounded-[10px] transition-all duration-300"
                >
                    <Download class="size-4"></Download>
                    <span>Webm</span>
                </Button>
                <Button
                    @click="downloadAsMp4()"
                    :disabled="disabledDownloadAsMp4"
                    class="flex items-center gap-2 px-3 py-2 text-sm bg-gradient-to-r from-green-400 to-green-600 text-white font-semibold rounded-[10px] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Loader
                        v-if="loading.converting || loading.loadingScript"
                        class="size-4 animate-spin"
                    ></Loader>
                    <Download v-else class="size-4"></Download>
                    <span>{{
                        loading.loadingScript ? "Loading..." : "Mp4"
                    }}</span>
                </Button>
            </div>
        </div>
        <div class="flex-1 mt-4 overflow-y-auto">
            <div class="flex gap-4">
                <div
                    class="flex-1 p-4 rounded-lg flex items-start justify-center"
                    :class="{
                        border: !isMobile,
                        'flex-1 bg-blue-400': isMobile,
                    }"
                >
                    <video
                        v-if="!isMobile"
                        id="videoPlayer"
                        ref="videoPlayerRef"
                        controls
                        :src="videoUrl"
                        class="rounded-lg"
                        :class="{
                            'vertical-video': isVertical,
                            'horizontal-video': !isVertical,
                        }"
                        @loadedmetadata="handleMetaData"
                        @timeupdate="handleVideoPlayback"
                        @playing="isVideoPlaying = true"
                        @pause="isVideoPlaying = false"
                    >
                        Your browser does not support the video tag.
                    </video>
                    <div
                        v-else
                        class="w-full flex flex-col items-center gap-2 p-2"
                    >
                        <div
                            class="w-full h-[200px] bg-black/50 rounded flex items-center justify-center"
                        >
                            <AudioLines class="size-20"></AudioLines>
                        </div>
                        <p class="w-full text-center">{{ video.name }}</p>
                        <audio
                            ref="audioPlayer"
                            controls
                            :src="videoUrl"
                            class="w-full mt-10"
                        >
                            Your browser does not support the audio tag.
                        </audio>
                    </div>
                </div>

                <!-- Video Metadata Sidebar -->
                <div
                    v-if="!isMobile"
                    class="w-80 p-4 rounded-lg"
                    style="
                        background: rgba(255, 255, 255, 0.08);
                        backdrop-filter: blur(20px) saturate(180%);
                        -webkit-backdrop-filter: blur(20px) saturate(180%);
                        border-radius: 12px;
                        border: 1px solid rgba(255, 255, 255, 0.12);
                        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
                    "
                >
                    <div class="relative">
                        <!-- Decorative gradient -->

                        <h3
                            class="text-lg font-semibold mb-4 relative dark:text-white text-black"
                        >
                            Video Information
                        </h3>
                        <div class="grid grid-cols-1 gap-2 relative">
                            <div
                                class="flex items-center justify-between p-2 rounded-lg"
                                style="
                                    background: rgba(255, 255, 255, 0.05);
                                    backdrop-filter: blur(10px);
                                    border: 1px solid rgba(255, 255, 255, 0.08);
                                "
                            >
                                <span class="text-muted-foreground/80 text-xs"
                                    >Name</span
                                >
                                <span
                                    class="font-medium text-foreground/90 text-xs truncate ml-2"
                                    >{{ video.name }}</span
                                >
                            </div>
                            <div
                                class="flex items-center justify-between p-2 rounded-lg"
                                style="
                                    background: rgba(255, 255, 255, 0.05);
                                    backdrop-filter: blur(10px);
                                    border: 1px solid rgba(255, 255, 255, 0.08);
                                "
                            >
                                <span class="text-muted-foreground/80 text-xs"
                                    >Duration</span
                                >
                                <span
                                    class="font-medium text-foreground/90 text-xs"
                                    >{{ formatDuration(videoDuration) }}</span
                                >
                            </div>
                            <div
                                class="flex items-center justify-between p-2 rounded-lg"
                                style="
                                    background: rgba(255, 255, 255, 0.05);
                                    backdrop-filter: blur(10px);
                                    border: 1px solid rgba(255, 255, 255, 0.08);
                                "
                            >
                                <span class="text-muted-foreground/80 text-xs"
                                    >Dimensions</span
                                >
                                <span
                                    class="font-medium text-foreground/90 text-xs"
                                    >{{ videoDimensions }}</span
                                >
                            </div>
                            <div
                                class="flex items-center justify-between p-2 rounded-lg"
                                style="
                                    background: rgba(255, 255, 255, 0.05);
                                    backdrop-filter: blur(10px);
                                    border: 1px solid rgba(255, 255, 255, 0.08);
                                "
                            >
                                <span class="text-muted-foreground/80 text-xs"
                                    >Format</span
                                >
                                <span
                                    class="font-medium text-foreground/90 text-xs"
                                    >{{ videoFormat }}</span
                                >
                            </div>
                            <div
                                class="flex items-center justify-between p-2 rounded-lg"
                                style="
                                    background: rgba(255, 255, 255, 0.05);
                                    backdrop-filter: blur(10px);
                                    border: 1px solid rgba(255, 255, 255, 0.08);
                                "
                            >
                                <span class="text-muted-foreground/80 text-xs"
                                    >Size</span
                                >
                                <span
                                    class="font-medium text-foreground/90 text-xs"
                                    >{{ formatFileSize(videoSize) }}</span
                                >
                            </div>
                            <div
                                class="flex items-center justify-between p-2 rounded-lg"
                                style="
                                    background: rgba(255, 255, 255, 0.05);
                                    backdrop-filter: blur(10px);
                                    border: 1px solid rgba(255, 255, 255, 0.08);
                                "
                            >
                                <span class="text-muted-foreground/80 text-xs"
                                    >Audio</span
                                >
                                <span
                                    class="font-medium text-foreground/90 text-xs"
                                    >{{ video.audio ? "Yes" : "No" }}</span
                                >
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <VideoCutter
                v-if="!isMobile && isFinite(videoDuration) && !resetVideoCutter"
                :duration="videoDuration"
                :current-time="currentTime"
                :audio-url="videoUrl"
                class="mt-4"
                @resize="handleSeek"
                @speed-change="handleSpeedChange"
            >
                <div class="flex-1 flex items-center justify-end">
                    <Button
                        @click="cutAndDownload()"
                        :disabled="disabledDownloadCuttedDuration"
                        class="flex items-center gap-2 px-3 py-2 text-sm bg-gradient-to-r from-green-400 to-green-600 text-white font-semibold rounded-[10px] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Loader
                            v-if="loading.cutting || loading.loadingScript"
                            class="size-4 animate-spin"
                        ></Loader>
                        <Download v-else class="size-4"></Download>
                        {{ loading.loadingScript ? "Getting ready" : "Export" }}
                    </Button>
                </div>
            </VideoCutter>
            <Button
                v-show="isMobile"
                @click="downloadFile(true)"
                class="mt-5 flex items-center gap-2 px-3 py-2 text-sm bg-gradient-to-r from-green-400 to-green-600 text-white font-semibold rounded-[10px] transition-all duration-300"
            >
                <ArrowBigDownDash class="size-4"></ArrowBigDownDash>
                Download Audio
            </Button>
        </div>
    </div>
    <div
        v-else
        class="flex-1 flex items-center justify-center flex-col gap-8 p-8"
    >
        <div class="relative">
            <!-- Animated background glow -->
            <div
                class="absolute -inset-8 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse"
            ></div>

            <!-- Equalizer Container - Rectangle Shape -->
            <div
                class="relative w-80 h-32 rounded-3xl flex items-center justify-center overflow-hidden"
            >
                <!-- Background Pattern -->

                <!-- Equalizer Bars Container -->
                <div
                    class="relative flex items-end justify-center gap-2.5 h-20 px-8"
                >
                    <div
                        class="equalizer-bar w-3 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-full shadow-md shadow-blue-500/20"
                        style="animation-delay: 0ms"
                    ></div>
                    <div
                        class="equalizer-bar w-3 bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-full shadow-md shadow-purple-500/20"
                        style="animation-delay: 150ms"
                    ></div>
                    <div
                        class="equalizer-bar w-3 bg-gradient-to-t from-pink-500 to-pink-400 rounded-t-full shadow-md shadow-pink-500/20"
                        style="animation-delay: 300ms"
                    ></div>
                    <div
                        class="equalizer-bar w-3 bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-full shadow-md shadow-indigo-500/20"
                        style="animation-delay: 450ms"
                    ></div>
                    <div
                        class="equalizer-bar w-3 bg-gradient-to-t from-violet-500 to-violet-400 rounded-t-full shadow-md shadow-violet-500/20"
                        style="animation-delay: 600ms"
                    ></div>
                    <div
                        class="equalizer-bar w-3 bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t-full shadow-md shadow-cyan-500/20"
                        style="animation-delay: 200ms"
                    ></div>
                    <div
                        class="equalizer-bar w-3 bg-gradient-to-t from-fuchsia-500 to-fuchsia-400 rounded-t-full shadow-md shadow-fuchsia-500/20"
                        style="animation-delay: 350ms"
                    ></div>
                    <div
                        class="equalizer-bar w-3 bg-gradient-to-t from-rose-500 to-rose-400 rounded-t-full shadow-md shadow-rose-500/20"
                        style="animation-delay: 500ms"
                    ></div>
                    <div
                        class="equalizer-bar w-3 bg-gradient-to-t from-sky-500 to-sky-400 rounded-t-full shadow-md shadow-sky-500/20"
                        style="animation-delay: 100ms"
                    ></div>
                    <div
                        class="equalizer-bar w-3 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-full shadow-md shadow-emerald-500/20"
                        style="animation-delay: 400ms"
                    ></div>
                </div>
            </div>
        </div>

        <div class="text-center space-y-4 max-w-lg">
            <h3
                class="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent"
            >
                No Video Selected
            </h3>
            <p class="text-base text-muted-foreground/80 leading-relaxed">
                Select a recording from the sidebar to preview, edit, and
                download
            </p>
            <div class="flex items-center justify-center gap-2 pt-2">
                <div
                    class="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-white/10 flex items-center gap-2"
                >
                    <kbd
                        class="px-2 py-1 text-xs font-semibold bg-white/10 rounded border border-white/20"
                        >Space</kbd
                    >
                    <span class="text-xs text-muted-foreground/70"
                        >Play / Pause</span
                    >
                </div>
            </div>
        </div>

        <!-- Minimalist indicator dots -->
        <div class="flex items-center gap-2">
            <div
                class="w-1.5 h-1.5 bg-blue-500/60 rounded-full animate-pulse-slow"
            ></div>
            <div
                class="w-1.5 h-1.5 bg-purple-500/60 rounded-full animate-pulse-slow"
                style="animation-delay: 300ms"
            ></div>
            <div
                class="w-1.5 h-1.5 bg-pink-500/60 rounded-full animate-pulse-slow"
                style="animation-delay: 600ms"
            ></div>
        </div>
    </div>
</template>
<script setup lang="ts">
import {
    computed,
    onBeforeUnmount,
    onMounted,
    reactive,
    ref,
    watch,
} from "vue";
import { Button } from "@/components/ui/button";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import type { Log } from "@ffmpeg/types/types/index";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { useToast } from "@/components/ui/toast/use-toast";
import {
    Loader,
    AudioLines,
    ArrowBigDownDash,
    Download,
} from "lucide-vue-next";
import { useIsMobile } from "@/composables/isMobileStore";
import VideoCutter from "@/components/VideoCutter.vue";

const baseURLFFmpeg = "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm";

const ffmpeg = new FFmpeg();
const loading = reactive({
    converting: false,
    loadedScript: false,
    loadingScript: false,
    cutting: false,
    msg: "",
});
interface Props {
    video?: VideoSaved | null;
}

const props = defineProps<Props>();
const { toast } = useToast();
const { isMobile } = useIsMobile();
const audioPlayer = ref<HTMLAudioElement | undefined>(undefined);
const videoPlayerRef = ref<HTMLVideoElement | undefined>();
const isVertical = ref<boolean>(false);
const videoDuration = ref<number>(0);
const videoWidth = ref<number>(0);
const videoHeight = ref<number>(0);
const durationCut = reactive({
    start: 0,
    end: 0,
});
const currentTime = ref(0);
const resetVideoCutter = ref(false);
const timerResetVideoCutter = ref<NodeJS.Timeout | null>(null);
const isVideoPlaying = ref(false);
const playbackSpeed = ref("1");

const videoUrl = computed(() => {
    if (props.video) {
        const url = URL.createObjectURL(props.video.blob);
        return url;
    }
    return "";
});

watch(
    () => props.video,
    () => {
        if (timerResetVideoCutter.value) {
            clearTimeout(timerResetVideoCutter.value);
        }
        resetVideoCutter.value = true;
        timerResetVideoCutter.value = setTimeout(() => {
            resetVideoCutter.value = false;
        }, 200);
    },
);

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
        ffmpeg.on("log", ({ message: msg }: Log) => {
            console.log(msg);
            loading.msg = msg;
        });
        await ffmpeg.load({
            coreURL: await toBlobURL(
                `${baseURLFFmpeg}/ffmpeg-core.js`,
                "text/javascript",
            ),
            wasmURL: await toBlobURL(
                `${baseURLFFmpeg}/ffmpeg-core.wasm`,
                "application/wasm",
            ),
            workerURL: await toBlobURL(
                `${baseURLFFmpeg}/ffmpeg-core.worker.js`,
                "text/javascript",
            ),
        });
        loading.loadingScript = false;
        loading.loadedScript = true;
    } catch (error: any) {
        console.log(error);
        toast({
            title: "Failed",
            description: error?.message,
            variant: "destructive",
        });
    }
}

async function downloadAsMp4() {
    if (!props.video) {
        return;
    }
    try {
        loading.converting = true;
        const webmName = `${props.video.name}.webm`;
        const mp4Name = `${props.video.name}.mp4`;
        const dataFile = await fetchFile(props.video.blob);
        const res = await ffmpeg.writeFile(webmName, dataFile);
        console.log("write:", res);
        const execute = await ffmpeg.exec([
            "-i",
            webmName,
            "-c:v",
            "copy",
            "-c:a",
            "aac",
            "-strict",
            "experimental",
            mp4Name,
        ]);
        console.log("exec:", execute);
        const data = await ffmpeg.readFile(mp4Name);
        const urlDownload = URL.createObjectURL(
            new Blob([(data as Uint8Array).buffer], { type: "video/mp4" }),
        );
        const a = <HTMLAnchorElement>document.createElement("a");
        document.body.appendChild(a);
        a.href = urlDownload;
        a.download = mp4Name;
        a.click();
        loading.converting = false;
    } catch (error: any) {
        console.log(error);
        toast({
            title: "Failed",
            description: error?.message,
            variant: "destructive",
        });
        loading.converting = false;
        loading.msg = "";
    }
}

async function cutAndDownload() {
    if (!props.video || durationCut.end === 0) {
        toast({
            title: "Error",
            description: "End duration cut not setted",
            variant: "destructive",
        });
        return;
    }

    try {
        loading.cutting = true;
        const webmName = `${props.video.name}.webm`;
        const cuttedName = `${props.video.name}-cutted.mp4`;
        const dataFile = await fetchFile(props.video.blob);
        const res = await ffmpeg.writeFile(webmName, dataFile);
        console.log("write:", res);
        const ffmpegArgs = [
            "-ss",
            `${durationCut.start}`,
            "-i",
            webmName,
            "-t",
            `${durationCut.end - durationCut.start}`,
            "-map",
            "0:v",
        ];

        // Only add audio mapping if video has audio
        if (props.video.audio) {
            ffmpegArgs.push("-map", "0:a", "-c:a", "aac", "-b:a", "128k");
        }

        ffmpegArgs.push(
            "-c:v",
            "copy",
            "-avoid_negative_ts",
            "make_zero",
            cuttedName,
        );

        const execute = await ffmpeg.exec(ffmpegArgs);
        console.log("exec:", execute);
        const data = await ffmpeg.readFile(cuttedName);
        const urlDownload = URL.createObjectURL(
            new Blob([(data as Uint8Array).buffer], { type: "video/mp4" }),
        );
        const a = <HTMLAnchorElement>document.createElement("a");
        document.body.appendChild(a);
        a.href = urlDownload;
        a.download = cuttedName;
        a.click();
        loading.cutting = false;
    } catch (error: any) {
        console.log(error);
        toast({
            title: "Failed",
            description: error?.message,
            variant: "destructive",
        });
        loading.cutting = false;
        loading.msg = "";
    }
}

const downloadFile = (audio: boolean = false) => {
    if (!videoUrl.value || !props.video) {
        return;
    }
    const a = <HTMLAnchorElement>document.createElement("a");
    document.body.appendChild(a);
    a.href = videoUrl.value;
    a.download = `${props.video.name}.${audio ? "wav" : "webm"}`;
    a.click();
};

function handleMetaData(e: Event) {
    const vidEl = <HTMLVideoElement>e.target;
    isVertical.value = vidEl.videoWidth < vidEl.videoHeight;
    videoDuration.value = vidEl.duration;
    videoWidth.value = vidEl.videoWidth;
    videoHeight.value = vidEl.videoHeight;
}

function handleSeek(time: { start: number; end: number }) {
    if (videoPlayerRef.value) {
        videoPlayerRef.value.currentTime = time.start;
    }
    durationCut.start = time.start;
    durationCut.end = time.end;
}

function handleVideoPlayback() {
    if (durationCut.end === 0 || !videoPlayerRef.value) {
        return;
    }
    if (videoPlayerRef.value.currentTime < Math.floor(durationCut.start)) {
        videoPlayerRef.value.currentTime = durationCut.start;
    }
    if (videoPlayerRef.value.currentTime >= durationCut.end) {
        videoPlayerRef.value.pause();
        videoPlayerRef.value.currentTime = durationCut.start;
    }
    currentTime.value = videoPlayerRef.value.currentTime;
}

function listenKeyPress(e: KeyboardEvent) {
    if (e.code !== "Space" || !videoPlayerRef.value) {
        return;
    }

    if (isVideoPlaying.value) {
        videoPlayerRef.value.pause();
        return;
    }

    videoPlayerRef.value.play();
}

function handleSpeedChange(speed: number) {
    if (videoPlayerRef.value) {
        videoPlayerRef.value.playbackRate = speed;
    }
    playbackSpeed.value = speed.toString();
}

const videoDimensions = computed(() => {
    if (videoWidth.value === 0 || videoHeight.value === 0) return "-";
    return `${videoWidth.value} x ${videoHeight.value}`;
});

const videoFormat = computed(() => {
    if (!props.video) return "-";
    return props.video.blob.type.split("/")[1].toUpperCase();
});

const videoSize = computed(() => {
    if (!props.video) return 0;
    return props.video.blob.size;
});

function formatDuration(seconds: number): string {
    if (!isFinite(seconds)) return "-";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return "-";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

onMounted(async () => {
    if (!loading.loadedScript && !loading.loadingScript && !isMobile.value) {
        LoadFfmpeg();
    }

    window.addEventListener("keypress", listenKeyPress);
});

onBeforeUnmount(() => {
    window.removeEventListener("keypress", listenKeyPress);
});
</script>

<style scoped lang="css">
.vertical-video {
    height: calc(100vh - 375px);
}
.horizontal-video {
    height: calc(100vh - 375px);
    object-fit: contain;
}

/* Equalizer Animation */
@keyframes equalizer {
    0%,
    100% {
        height: 20%;
    }
    10% {
        height: 60%;
    }
    20% {
        height: 35%;
    }
    30% {
        height: 80%;
    }
    40% {
        height: 45%;
    }
    50% {
        height: 95%;
    }
    60% {
        height: 50%;
    }
    70% {
        height: 75%;
    }
    80% {
        height: 40%;
    }
    90% {
        height: 65%;
    }
}

.equalizer-bar {
    animation: equalizer 1.5s ease-in-out infinite;
    box-shadow: 0 0 4px currentColor;
}

/* Pulse Animation */
@keyframes pulse-slow {
    0%,
    100% {
        opacity: 1;
        transform: scale(1);
    }
    50% {
        opacity: 0.4;
        transform: scale(0.8);
    }
}

.animate-pulse-slow {
    animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
