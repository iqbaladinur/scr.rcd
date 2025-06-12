<script lang="ts" setup>
import { db } from '@/db/db';
import { Button } from "@/components/ui/button";
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useToast } from '@/components/ui/toast/use-toast';
import { Play, StopCircle, Trash, Mic, Pause, X } from "lucide-vue-next";
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
const { forced60fpsFHD, forceEncodeWithH264, videoQualityMode, videoBitrate, advancedVideoMode, getVideoConstraints, getRecorderOptions } = use60FPS();
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

const audioConstraints:MediaTrackConstraints = {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    sampleRate: 44100,
}

const PIPWINDOW = ref<any>(null);

async function captureScreen(audio: boolean = false) {
    const videoConstraints = advancedVideoMode.value 
        ? {
            ...getVideoConstraints(videoQualityMode.value, forced60fpsFHD.value),
            aspectRatio: { ideal: 16/9 },
            resizeMode: 'crop-and-scale' as any,
        }
        : getVideoConstraints(videoQualityMode.value, forced60fpsFHD.value);

    const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: videoConstraints,
        audio: audio ? audioConstraints : false
    });
    return screenStream;
}

async function captureAudio() {
    const config = {
        audio: {
            ...audioConstraints,
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
        
        const recorderOptions = getRecorderOptions(videoBitrate.value, forceEncodeWithH264.value);
        mediaRecorder.value = new MediaRecorder(stream, recorderOptions);
        
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

        const timeSlice = advancedVideoMode.value ? 100 : 200;
        mediaRecorder.value.start(timeSlice);
        startTime.value = Date.now();
        isRecording.value = true;
        
        // Add event listener for pause/resume button if PiP window exists
        addPauseResumeEventListener();
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
        
        const recorderOptions = getRecorderOptions(videoBitrate.value, forceEncodeWithH264.value);
        mediaRecorder.value = new MediaRecorder(stream, recorderOptions);
        
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

        const timeSlice = advancedVideoMode.value ? 100 : 200;
        mediaRecorder.value.start(timeSlice);
        startTime.value = Date.now();
        isRecording.value = true;
        
        // Add event listener for pause/resume button if PiP window exists
        addPauseResumeEventListener();
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
    
    // Enhanced webcam constraints for better quality
    const webcamConstraints = {
        video: {
            ...(defaultCamera?.value?.deviceId ? {
                deviceId: { exact: defaultCamera.value.deviceId }
            } : {}),
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 },
            frameRate: { ideal: 30, max: 60 },
            facingMode: 'user'
        },
        audio: false
    };
    
    const stream = await navigator.mediaDevices.getUserMedia(webcamConstraints);
    webcamStream.value = stream;
    if (webcamSrc.value && webcamContainer.value) {
        try {
            webcamSrc.value.srcObject = stream;
            await webcamSrc.value.play();

            const Globalwindow = window as any;

            if (!PIPWINDOW.value) {
                PIPWINDOW.value = await Globalwindow.documentPictureInPicture.requestWindow({
                    width: webcamContainer.value.clientWidth + 20,
                    height: webcamContainer.value.clientHeight + 30,
                });

                PIPWINDOW.value.document.body.style.background = 'black';
                PIPWINDOW.value.document.body.append(webcamContainer.value);

                PIPWINDOW.value.addEventListener("pagehide", () => {
                    stopWebCam();
                });

                const stopButton = PIPWINDOW.value.document.querySelector('#stopButton');
                stopButton?.addEventListener('click', () => {
                    stopWebCam();
                });
                
                // Add Material Design hover effects for stop button (webcam close)
                if (stopButton) {
                    stopButton.addEventListener('mouseenter', () => {
                        stopButton.style.background = 'rgba(95, 99, 104, 0.2)';
                        stopButton.style.transform = 'scale(1.04)';
                        stopButton.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(95, 99, 104, 0.15)';
                    });
                    
                    stopButton.addEventListener('mouseleave', () => {
                        stopButton.style.background = 'rgba(95, 99, 104, 0.12)';
                        stopButton.style.transform = 'scale(1)';
                        stopButton.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)';
                    });
                }
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

function addPauseResumeEventListener() {
    if (PIPWINDOW.value) {
        // Remove existing event listener first to avoid duplicates
        const existingButton = PIPWINDOW.value.document.querySelector('#pauseResumeButton');
        if (existingButton) {
            existingButton.removeEventListener('click', togglePauseRecording);
        }
        
        const existingButtonStop = PIPWINDOW.value.document.querySelector('#stopRecordButton');
        if (existingButtonStop) {
            existingButtonStop.removeEventListener('click', stopRecording);
        }
        
        // Add event stopRecording with a small delay to ensure button is rendered
        setTimeout(() => {
            const pauseResumeButton = PIPWINDOW.value?.document.querySelector('#pauseResumeButton');
            const stopButton = PIPWINDOW.value?.document.querySelector('#stopButton');
            const stopButtonRecording = PIPWINDOW.value?.document.querySelector('#stopRecordButton');
            
            if (pauseResumeButton) {
                pauseResumeButton.addEventListener('click', togglePauseRecording);
                
                // Add Material Design hover effects
                pauseResumeButton.addEventListener('mouseenter', () => {
                    pauseResumeButton.style.background = 'rgba(66, 133, 244, 0.2)';
                    pauseResumeButton.style.transform = 'scale(1.04)';
                    pauseResumeButton.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(66, 133, 244, 0.15)';
                });
                
                pauseResumeButton.addEventListener('mouseleave', () => {
                    pauseResumeButton.style.background = 'rgba(66, 133, 244, 0.12)';
                    pauseResumeButton.style.transform = 'scale(1)';
                    pauseResumeButton.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)';
                });
            }

            if (stopButtonRecording) {
                stopButtonRecording.addEventListener('click', stopRecording);
                stopButtonRecording.addEventListener('mouseenter', () => {
                    stopButtonRecording.style.background = 'rgba(234, 67, 53, 0.2)';
                    stopButtonRecording.style.transform = 'scale(1.04)';
                    stopButtonRecording.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(234, 67, 53, 0.15)';
                });
                
                stopButtonRecording.addEventListener('mouseleave', () => {
                    stopButtonRecording.style.background = 'rgba(234, 67, 53, 0.12)';
                    stopButtonRecording.style.transform = 'scale(1)';
                    stopButtonRecording.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)';
                });
            }
            
            if (stopButton) {
                // Add Material Design hover effects for stop button (webcam close)
                stopButton.addEventListener('mouseenter', () => {
                    stopButton.style.background = 'rgba(95, 99, 104, 0.2)';
                    stopButton.style.transform = 'scale(1.04)';
                    stopButton.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(95, 99, 104, 0.15)';
                });
                
                stopButton.addEventListener('mouseleave', () => {
                    stopButton.style.background = 'rgba(95, 99, 104, 0.12)';
                    stopButton.style.transform = 'scale(1)';
                    stopButton.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)';
                });
            }

        }, 100);
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

const containerWebCamStyle = 'background: linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(20, 20, 20, 0.95) 50%, rgba(0, 0, 0, 0.9) 100%); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); border-radius: 1rem; display: flex; flex-direction: column; gap: 20px; align-items: center; padding: 16px; border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);';
const webcamStyle = 'width: 300px; height: 200px; border-radius: 0.75rem; object-fit: cover; border: 2px solid rgba(255, 255, 255, 0.15); box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);';
const buttonStopStyle = 'cursor: pointer; padding: 6px 8px; background: rgba(234, 67, 53, 0.12); backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); border-radius: 8px; border: none; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24); transition: all 0.15s cubic-bezier(0.4, 0.0, 0.2, 1); min-width: 32px; min-height: 32px;';
const buttonStopWebcamStyle = 'cursor: pointer; padding: 6px 8px; background: rgba(95, 99, 104, 0.12); backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); border-radius: 8px; border: none; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24); transition: all 0.15s cubic-bezier(0.4, 0.0, 0.2, 1); min-width: 32px; min-height: 32px;';
const buttonPauseStyle = 'cursor: pointer; padding: 6px 8px; background: rgba(66, 133, 244, 0.12); backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); border-radius: 8px; border: none; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24); transition: all 0.15s cubic-bezier(0.4, 0.0, 0.2, 1); min-width: 32px; min-height: 32px;';
const buttonContainerStyle = 'display: flex; align-items: center; justify-content: center; gap: 4px; background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(24px) saturate(200%); -webkit-backdrop-filter: blur(24px) saturate(200%); border-radius: 12px; padding: 4px; border: 1px solid rgba(255, 255, 255, 0.08); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);';

// Function to get current quality info for display
const getCurrentQualityInfo = () => {
    const resolution = videoQualityMode.value;
    const bitrate = videoBitrate.value;
    const fps = forced60fpsFHD.value ? '60fps' : '30fps';
    const codec = forceEncodeWithH264.value ? 'H.264' : 'VP9/VP8';
    const advanced = advancedVideoMode.value ? 'Advanced' : 'Standard';
    
    return {
        resolution: resolution.toUpperCase(),
        bitrate: bitrate === 'auto' ? 'Auto' : bitrate === 'high' ? 'High (8Mbps)' : 'Ultra (15Mbps)',
        fps,
        codec,
        mode: advanced
    };
};

</script>
<template>
<div class="relative flex-col items-start gap-8 md:flex md:w-[310px]" :class="{ 'hidden': !mobile }">
    <div class="flex flex-col w-full items-start gap-6">
        <!-- Quality Info Display -->
        <div class="w-full p-3 bg-muted/50 rounded-lg border">
            <h4 class="text-sm font-medium mb-2">Current Recording Quality</h4>
            <div class="grid grid-cols-2 gap-2 text-xs">
                <div>
                    <span class="text-muted-foreground">Resolution:</span>
                    <span class="ml-1 font-medium">{{ getCurrentQualityInfo().resolution }}</span>
                </div>
                <div>
                    <span class="text-muted-foreground">FPS:</span>
                    <span class="ml-1 font-medium">{{ getCurrentQualityInfo().fps }}</span>
                </div>
                <div>
                    <span class="text-muted-foreground">Bitrate:</span>
                    <span class="ml-1 font-medium">{{ getCurrentQualityInfo().bitrate }}</span>
                </div>
                <div>
                    <span class="text-muted-foreground">Codec:</span>
                    <span class="ml-1 font-medium">{{ getCurrentQualityInfo().codec }}</span>
                </div>
            </div>
            <div class="mt-2 text-xs">
                <span class="text-muted-foreground">Mode:</span>
                <span class="ml-1 font-medium">{{ getCurrentQualityInfo().mode }}</span>
            </div>
        </div>

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
            <ul class="overflow-y-auto space-y-1" :style="{ height: 'calc(100vh - 446px)' }">
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
<div ref="webcamContainerParent" :class="{ '!hidden': !enableCameraView }" class="z-[100] fixed bottom-10 right-10">
    <div ref="webcamContainer" :style="containerWebCamStyle">
        <video ref="webcamSrc" :style="webcamStyle" autoplay />
        <div :style="buttonContainerStyle">
            <button v-if="isRecording" id="pauseResumeButton" :style="buttonPauseStyle" :title="isPausedRecord ? 'Resume Recording' : 'Pause Recording'">
                <Pause v-if="!isPausedRecord" style="width: 16px; height: 16px; color: rgba(255, 255, 255, 0.9);"></Pause>
                <Play v-else style="width: 16px; height: 16px; color: rgba(255, 255, 255, 0.9);"></Play>
            </button>
            <button v-if="isRecording" id="stopRecordButton" :style="buttonStopStyle" title="Stop Recording">
                <StopCircle style="width: 16px; height: 16px; color: rgba(255, 255, 255, 0.9);"></StopCircle>
            </button>
            <button id="stopButton" :style="buttonStopWebcamStyle" title="Close Webcam">
                <X style="width: 16px; height: 16px; color: rgba(255, 255, 255, 0.9);"></X>
            </button>
        </div>
    </div>
</div>
</template>
