<script lang="ts" setup>
import { db } from '@/db/db';
import { Button } from "@/components/ui/button";
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useToast } from '@/components/ui/toast/use-toast';
import { Play, StopCircle, Trash, Mic, Pause } from "lucide-vue-next";
import { useVideo } from '@/composables/videoStore';
import { Switch } from "@/components/ui/switch";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider
} from "@/components/ui/tooltip";
import { use60FPS } from '@/composables/videoSettingStore';
import fixWebmDuration from "fix-webm-duration";
import { useCameraMicSetting } from '@/composables/cameraMicSetting';
import { convertBytesAdaptive } from '@/lib/utils';

interface Props {
    mobile?: boolean;
}

defineProps<Props>();

const recordedVideos = ref<VideoSaved[]>([]);
const { toast } = useToast();
const { video: selectedVideo } = useVideo();
const { forced60fpsFHD, forceEncodeWithH264 } = use60FPS();
const isRecording = ref<boolean>(false);
const mediaRecorder = ref<MediaRecorder | null>(null);
const recordedType = ref<'scr' | 'scr_mic'>('scr');
const enableCameraView = ref<boolean>(false);
const disableCameraView = ref<boolean>(false);
const webcamStream = ref<MediaStream | null>(null);
const webcamSrc = ref<HTMLVideoElement | null>(null);
const webcamContainer = ref<HTMLDivElement | null>(null);
const webcamContainerParent = ref<HTMLDivElement | null>(null);
const startTime = ref<number>(0);
const { camChanged, defaultCamera, defaultMic } = useCameraMicSetting();
const isPausedRecord = ref<boolean>(false);

const checkCameraAvailability = async () => {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasWebcam = devices.some(device => device.kind === 'videoinput');
        disableCameraView.value = !hasWebcam;
    } catch (err) {
        console.error('Error accessing media devices.', err);
        disableCameraView.value = true;
    }
};

// get media screen recorder
const audioConstraints:MediaTrackConstraints = {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
}

const videoConstrainsForce60FpsFHD: MediaTrackConstraints = {
    width: { ideal: 1920, max: 1920 },
    height: { ideal: 1080, max: 1080 },
    frameRate: { ideal: 60, max: 60, },
}

const PIPWINDOW = ref<any>(null);

const codech264ForceOptions = { mimeType: 'video/webm;codecs=h264' };

async function captureScreen(audio: boolean = false) {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: forced60fpsFHD.value ? videoConstrainsForce60FpsFHD : true,
        audio: audio ? audioConstraints : false
    });
    return screenStream;
}

async function captureAudio() {
    const config = {
        audio: {
            ...audioConstraints,
            sampleRate: 44100,
            deviceId: defaultMic.value ? defaultMic.value.deviceId : undefined
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
        mediaRecorder.value = new MediaRecorder(stream, forceEncodeWithH264.value ? codech264ForceOptions : undefined);
        const recordedChunks: Blob[] = [];
        const pausedDurations: number[] = [];
        let pausedStart = Date.now();

        mediaRecorder.value.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.value.onstop = async() => {
            isRecording.value = false;
            if (isPausedRecord.value) {
                pausedDurations.push(Date.now() - pausedStart);
                isPausedRecord.value = false;
            }
            const recordedBlob = new Blob(recordedChunks, { type: 'video/webm' });
            const tracks = stream.getTracks();
            tracks.forEach((tr) => tr.stop());
            stopWebCam();
            const duration = (Date.now() - startTime.value) - pausedDurations.reduce((acc, cur) => acc + cur, 0);
            const blobWithDuration = await fixWebmDuration(recordedBlob, duration, { logger: false });
            saveToIndexedDB(blobWithDuration, true);
        };

        mediaRecorder.value.onpause = () => {
            pausedStart = Date.now(); 
            isPausedRecord.value = true;
        }

        mediaRecorder.value.onresume = () => {
            pausedDurations.push(Date.now() - pausedStart);
            isPausedRecord.value = false;
        }

        mediaRecorder.value.start(200);
        startTime.value = Date.now();
        isRecording.value = true;
    } catch (error: any) {
        stopWebCam();
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
        mediaRecorder.value = new MediaRecorder(stream, forceEncodeWithH264.value ? codech264ForceOptions : undefined);
        const recordedChunks: Blob[] = [];
        const pausedDurations: number[] = [];
        let pausedStart = Date.now();

        mediaRecorder.value.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.value.onstop = async () => {
            isRecording.value = false;
            if (isPausedRecord.value) {
                pausedDurations.push(Date.now() - pausedStart);
                isPausedRecord.value = false;
            }
            const recordedBlob = new Blob(recordedChunks, { type: 'video/webm' });
            const tracks = stream.getTracks();
            let audioEnable = false;
            tracks.forEach((tr) => {
                if (tr.kind === 'audio') {
                    audioEnable = true;
                };
                tr.stop();
            });
            const duration = (Date.now() - startTime.value) - pausedDurations.reduce((acc, cur) => acc + cur, 0);
            const blobWithDuration = await fixWebmDuration(recordedBlob, duration, { logger: false });
            stopWebCam();
            saveToIndexedDB(blobWithDuration, audioEnable);
        };

        mediaRecorder.value.onpause = () => {
            pausedStart = Date.now(); 
            isPausedRecord.value = true;
        }

        mediaRecorder.value.onresume = () => {
            pausedDurations.push(Date.now() - pausedStart);
            isPausedRecord.value = false;
        }

        mediaRecorder.value.start(200);
        startTime.value = Date.now();
        isRecording.value = true;
    } catch (error: any) {
        stopWebCam();
        toast({
            title: 'Failed',
            description: error?.message,
            variant: 'destructive'
        });
    }
};

const startRecordingOnlyAudioMic = async () => {
    try {
        recordedType.value = 'scr_mic';
        const audioStream = await captureAudio();
        const stream = new MediaStream([...audioStream.getTracks()]);
        mediaRecorder.value = new MediaRecorder(stream);
        const recordedChunks: Blob[] = [];

        mediaRecorder.value.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.value.onstop = () => {
            isRecording.value = false;
            const recordedBlob = new Blob(recordedChunks, { type: 'audio/wav' });
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

async function startWebcam() {
    if (!enableCameraView.value) {
        return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({
        video: defaultCamera?.value?.deviceId ? {
            deviceId: { exact: defaultCamera.value.deviceId }
        }: true,
        audio: false
    });
    webcamStream.value = stream;
    if (webcamSrc.value && webcamContainer.value) {
        try {
            webcamSrc.value.srcObject = stream;
            await webcamSrc.value.play();

            // Open a Picture-in-Picture window.
            const Globalwindow = window as any;

            if (!PIPWINDOW.value) {
                PIPWINDOW.value = await Globalwindow.documentPictureInPicture.requestWindow({
                    width: webcamContainer.value.clientWidth,
                    height: webcamContainer.value.clientHeight + 20,
                });

                PIPWINDOW.value.document.body.style.background = 'black';
                PIPWINDOW.value.document.body.append(webcamContainer.value);

                PIPWINDOW.value.addEventListener("pagehide", () => {
                    stopWebCam();
                });

                PIPWINDOW.value.document.querySelector('#stopButton')?.addEventListener('click', () => {
                    stopWebCam();
                })
            }
        } catch (error: any) {
            toast({
                title: 'Error starting web cam.',
                description: error?.message,
                variant: 'destructive'
            });
        }
    }
}

function stopWebCam() {
    enableCameraView.value = false;
    if (webcamStream.value) {
        const tracks = webcamStream.value.getTracks();
        tracks.forEach(tr => tr.stop());
    }
    if (webcamSrc.value) {
        webcamSrc.value.srcObject = null;
        try {
            if (PIPWINDOW.value && webcamContainer.value) {
                webcamContainerParent.value?.append(webcamContainer.value);
                const Globalwindow = window as any;
                Globalwindow.documentPictureInPicture.window.close();
                PIPWINDOW.value = null;
            }    
        } catch (error: any) {
            toast({
                title: 'Error closing window.',
                description: error?.message,
                variant: 'destructive'
            });
        }
    }
}

function toggleWebCamp() {
    if (!enableCameraView.value) {
        stopWebCam();
        return;
    }
    startWebcam();
}

function handleWebcamPiPLeave() {
    enableCameraView.value = false;
    stopWebCam();
}

// Function to save the recorded video to IndexedDB
const saveToIndexedDB = async (blob: Blob, audio: boolean = false) => { 
    try {
        const now = new Date();
        const prefix = blob.type === 'audio/wav' ? 'aud' : 'vid';
        const videoName = `${prefix}-rcd-${now.toLocaleDateString().replace(/\//gi, '-')}-${now.toLocaleTimeString().replace(/:/gi, '-')}`;
        const data:VideoSaved = { name: videoName, blob, audio: audio };
        const id = await db.videos.add(data);
        toast({
            title: 'File Saved',
            description: 'Successfully saved a file'
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

const togglePauseRecording = () => {
    if (!mediaRecorder.value) {
        return
    }

    if(isPausedRecord.value) {
        mediaRecorder.value.resume();
        return;
    }
    
    mediaRecorder.value.pause();

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
            description: 'Successfully delete a file'
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

function cameraChangeListener() {
    if (enableCameraView.value) {
        stopWebCam();
        startWebcam();
    }
}

camChanged.on(cameraChangeListener);

onMounted(() => {
    getRecordedVideosFromIndexedDB();
    checkCameraAvailability();
    webcamSrc.value?.addEventListener('leavepictureinpicture', handleWebcamPiPLeave);
});

onBeforeUnmount(() => {
    webcamSrc.value?.removeEventListener('leavepictureinpicture', handleWebcamPiPLeave);
});


// style and function for doc pip;
const containerWebCamStyle = 'background-color: black; border-radius: 0.5rem; display:flex; flex-direction: column; gap: 16px; align-items: center; padding: 8px;';
const webcamStyle = 'width: 300px; height: 200px; border-radius: 0.5rem;';
const buttonStopStyle = 'cursor: pointer;margin-bottom: 16px; padding: 5px; background-color: rgb(184, 14, 14); border-radius: 5px; width: fit-content; border: none;';

</script>
<template>
<div class="relative flex-col items-start gap-8 md:flex md:w-[310px]" :class="{ 'hidden': !mobile }">
    <div class="flex flex-col w-full items-start gap-6">
        <div class="w-full grid gap-2">
            <template v-if="!isRecording">
                <template v-if="!mobile">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger as-child>
                                <Button @click="startRecording()" class="rounded-lg">
                                    <Play class="size-5 mr-4 fill-white dark:fill-black"></Play>
                                    Start Recording Screen Only
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" :side-offset="5" :class="{ 'hidden': mobile }">
                                Audio only available on chrome tab.
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <Button @click="startRecordingWithAudioMic()" class="rounded-lg">
                        <Mic class="size-5 mr-4"></Mic>
                        Start Recording with Mic
                    </Button>
                </template>
                <Button v-if="mobile" @click="startRecordingOnlyAudioMic()" class="rounded-lg">
                    <Mic class="size-5 mr-4"></Mic>
                    Start Recording audio
                </Button>
            </template>
            <template v-if="isRecording">
                <Button @click="stopRecording()" variant="destructive" :class="{ 'animate-pulse': !isPausedRecord }">
                    <StopCircle class="size-5 mr-4"></StopCircle>
                    Stop Recording {{ recordedType === 'scr_mic' ? 'with Mic' : 'Screen' }}
                </Button>
                <Button v-if="!mobile" @click="togglePauseRecording()">
                    <Pause v-if="!isPausedRecord" class="size-5 mr-4"></Pause>
                    <Play v-else class="size-5 mr-4"></Play>
                    {{ isPausedRecord ? 'Resume' : 'Pause' }} Recording {{ recordedType === 'scr_mic' ? 'with Mic' : 'Screen' }}
                </Button>
            </template>
            <div class="flex items-center gap-2 justify-between border py-2 px-3 rounded-lg">
                <label for="enable-camera" class="text-sm">
                    <span v-if="disableCameraView">Camera Not Found</span>
                    <TooltipProvider v-else>
                        <Tooltip>
                            <TooltipTrigger as-child>
                                <span>Enable Camera View</span>
                            </TooltipTrigger>
                            <TooltipContent side="right" :side-offset="10" :class="{ 'hidden': mobile }">
                                Camera view only recorded if <br> you select entire screen capture.
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </label>
                <Switch v-model:checked="enableCameraView" id="enable-camera" :disabled="disableCameraView" @update:checked="toggleWebCamp" />
            </div>
        </div>
        <fieldset class="rounded-lg border p-4 w-full">
            <legend class="-ml-1 px-1 text-sm font-medium">Recorded Videos</legend>
            <ul>
                <li
                    v-for="video in recordedVideos"
                    class="flex mb-1 items-start hover:bg-slate-100 dark:hover:bg-slate-100/10 py-3 px-3 rounded-md cursor-pointer gap-3 border"
                    :class="{ 'bg-slate-100 dark:bg-slate-100/10': selectedVideo?.id === video.id }"
                    @click="selectedVideo = video"
                >
                    <div class="flex-1 block text-sm">
                        <p class="truncate">{{ video.name }}</p>
                        <p class="text-xs text-gray-400">{{ convertBytesAdaptive(video.blob.size || 0) }}</p>
                    </div>
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
<!-- video webcam stream -->
 <div ref="webcamContainerParent" :class="{ '!hidden': !enableCameraView }" class="z-[100] fixed bottom-10 right-10">
    <div ref="webcamContainer" :style="containerWebCamStyle">
        <video ref="webcamSrc" :style="webcamStyle" autoplay />
        <button id="stopButton" :style="buttonStopStyle">
            <StopCircle style="'width: 20px; height: 20px; color: white;'"></StopCircle>
        </button>
    </div>
</div>
</template>
