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
import { useAudioGain } from '@/composables/audioGainStore';
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
const { micGainValue, systemGainValue } = useAudioGain();
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
const elapsedTime = ref<number>(0);
const timerInterval = ref<number | null>(null);
const timerStartTime = ref<number>(0);

const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const startTimer = () => {
    if (timerInterval.value) return;
    timerStartTime.value = Date.now() - elapsedTime.value;
    timerInterval.value = window.setInterval(() => {
        elapsedTime.value = Date.now() - timerStartTime.value;
    }, 1000);
};

const pauseTimer = () => {
    if (timerInterval.value) {
        clearInterval(timerInterval.value);
        timerInterval.value = null;
    }
};

const resumeTimer = () => {
    if (!timerInterval.value) {
        timerStartTime.value = Date.now() - elapsedTime.value;
        timerInterval.value = window.setInterval(() => {
            elapsedTime.value = Date.now() - timerStartTime.value;
        }, 1000);
    }
};

const stopTimer = () => {
    if (timerInterval.value) {
        clearInterval(timerInterval.value);
        timerInterval.value = null;
    }
    elapsedTime.value = 0;
    timerStartTime.value = 0;
};

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
        const screenStream = await captureScreen(true); // Request system audio

        // Mix system audio and microphone audio using Web Audio API
        const audioContext = new AudioContext();
        const audioDestination = audioContext.createMediaStreamDestination();

        // Add microphone audio with adjustable gain
        const micSource = audioContext.createMediaStreamSource(audioStream);
        const micGain = audioContext.createGain();
        micGain.gain.value = micGainValue.value; // Use value from settings
        micSource.connect(micGain);
        micGain.connect(audioDestination);

        // Add system audio with adjustable gain
        const systemAudioTracks = screenStream.getAudioTracks();
        if (systemAudioTracks.length > 0) {
            const systemAudioStream = new MediaStream(systemAudioTracks);
            const systemSource = audioContext.createMediaStreamSource(systemAudioStream);
            const systemGain = audioContext.createGain();
            systemGain.gain.value = systemGainValue.value; // Use value from settings
            systemSource.connect(systemGain);
            systemGain.connect(audioDestination);
        }

        // Combine video from screen and mixed audio
        const videoTracks = screenStream.getVideoTracks();
        const mixedAudioTracks = audioDestination.stream.getAudioTracks();
        const stream = new MediaStream([...videoTracks, ...mixedAudioTracks]);

        const recorderOptions = getRecorderOptions(videoBitrate.value, forceEncodeWithH264.value);
        mediaRecorder.value = new MediaRecorder(stream, recorderOptions);

        const recordedChunks: Blob[] = [];
        const pausedDurations: number[] = [];
        let pausedStart = Date.now();
        let actualRecordingStarted = false;

        mediaRecorder.value.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        // Use onstart event to get accurate timing
        mediaRecorder.value.onstart = () => {
            if (!actualRecordingStarted) {
                startTime.value = Date.now();
                actualRecordingStarted = true;
                startTimer();
            }
        };

        mediaRecorder.value.onstop = async() => {
            isRecording.value = false;
            stopTimer();

            // Properly handle paused state when stopping
            if (isPausedRecord.value && pausedStart) {
                pausedDurations.push(Date.now() - pausedStart);
                isPausedRecord.value = false;
            }

            // Ensure we have recorded data
            if (recordedChunks.length === 0) {
                toast({
                    title: 'Recording Error',
                    description: 'No data was recorded',
                    variant: 'destructive'
                });
                return;
            }

            try {
                const recordedBlob = new Blob(recordedChunks, { type: 'video/webm' });

                // Stop all tracks properly
                const tracks = stream.getTracks();
                tracks.forEach((tr) => tr.stop());

                // Stop original streams
                audioStream.getTracks().forEach((tr) => tr.stop());
                screenStream.getTracks().forEach((tr) => tr.stop());

                // Close audio context
                if (audioContext.state !== 'closed') {
                    await audioContext.close();
                }

                stopWebCam();

                const duration = (Date.now() - startTime.value) - pausedDurations.reduce((acc, cur) => acc + cur, 0);

                // Only apply duration fix if duration is valid
                let finalBlob = recordedBlob;
                if (duration > 0) {
                    try {
                        finalBlob = await fixWebmDuration(recordedBlob, duration, { logger: false });
                    } catch (durationError) {
                        console.warn('Duration fix failed, using original blob:', durationError);
                        finalBlob = recordedBlob;
                    }
                }

                saveToIndexedDB(finalBlob, true);
            } catch (error: any) {
                console.error('Error processing recording:', error);
                toast({
                    title: 'Recording Error',
                    description: 'Failed to process recording data',
                    variant: 'destructive'
                });
            }
        };

        mediaRecorder.value.onpause = () => {
            pausedStart = Date.now();
            isPausedRecord.value = true;
        }

        mediaRecorder.value.onresume = () => {
            if (pausedStart) {
                pausedDurations.push(Date.now() - pausedStart);
            }
            isPausedRecord.value = false;
            pausedStart = Date.now(); // Reset for potential next pause
        }

        mediaRecorder.value.onerror = (event: any) => {
            console.error('MediaRecorder error:', event);
            isRecording.value = false;
            isPausedRecord.value = false;
            toast({
                title: 'Recording Error',
                description: 'MediaRecorder encountered an error',
                variant: 'destructive'
            });
        };

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
        let actualRecordingStarted = false;

        mediaRecorder.value.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        // Use onstart event to get accurate timing
        mediaRecorder.value.onstart = () => {
            if (!actualRecordingStarted) {
                startTime.value = Date.now();
                actualRecordingStarted = true;
                startTimer();
            }
        };

        mediaRecorder.value.onstop = async () => {
            isRecording.value = false;
            stopTimer();

            // Properly handle paused state when stopping
            if (isPausedRecord.value && pausedStart) {
                pausedDurations.push(Date.now() - pausedStart);
                isPausedRecord.value = false;
            }

            // Ensure we have recorded data
            if (recordedChunks.length === 0) {
                toast({
                    title: 'Recording Error',
                    description: 'No data was recorded',
                    variant: 'destructive'
                });
                return;
            }

            try {
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

                // Only apply duration fix if duration is valid
                let finalBlob = recordedBlob;
                if (duration > 0) {
                    try {
                        finalBlob = await fixWebmDuration(recordedBlob, duration, { logger: false });
                    } catch (durationError) {
                        console.warn('Duration fix failed, using original blob:', durationError);
                        finalBlob = recordedBlob;
                    }
                }

                stopWebCam();
                saveToIndexedDB(finalBlob, audioEnable);
            } catch (error: any) {
                console.error('Error processing recording:', error);
                toast({
                    title: 'Recording Error',
                    description: 'Failed to process recording data',
                    variant: 'destructive'
                });
            }
        };

        mediaRecorder.value.onpause = () => {
            pausedStart = Date.now();
            isPausedRecord.value = true;
        }

        mediaRecorder.value.onresume = () => {
            if (pausedStart) {
                pausedDurations.push(Date.now() - pausedStart);
            }
            isPausedRecord.value = false;
            pausedStart = Date.now(); // Reset for potential next pause
        }

        mediaRecorder.value.onerror = (event: any) => {
            console.error('MediaRecorder error:', event);
            isRecording.value = false;
            isPausedRecord.value = false;
            toast({
                title: 'Recording Error',
                description: 'MediaRecorder encountered an error',
                variant: 'destructive'
            });
        };

        const timeSlice = advancedVideoMode.value ? 100 : 200;
        mediaRecorder.value.start(timeSlice);
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

                // If recording is active, add event listeners for recording controls
                if (isRecording.value) {
                    addPauseResumeEventListener();
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
    if (!PIPWINDOW.value) {
        return;
    }

    const addEventListenersToButtons = () => {
        const pauseResumeButton = PIPWINDOW.value?.document.querySelector('#pauseResumeButton');
        const stopButtonRecording = PIPWINDOW.value?.document.querySelector('#stopRecordButton');

        if (pauseResumeButton) {
            // Remove existing listeners first
            pauseResumeButton.removeEventListener('click', togglePauseRecording);

            // Add click listener
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
            // Remove existing listeners first
            stopButtonRecording.removeEventListener('click', stopRecording);

            // Add click listener
            stopButtonRecording.addEventListener('click', stopRecording);

            // Add hover effects
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
    };

    // Try to add listeners immediately
    addEventListenersToButtons();

    // If buttons not found, retry with a small delay
    if (!PIPWINDOW.value.document.querySelector('#pauseResumeButton') ||
        !PIPWINDOW.value.document.querySelector('#stopRecordButton')) {
        setTimeout(addEventListenersToButtons, 50);
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
    if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
        // If recording is paused, resume it first to ensure clean stop
        if (mediaRecorder.value.state === 'paused') {
            mediaRecorder.value.resume();
            // Small delay to ensure state change is processed
            setTimeout(() => {
                if (mediaRecorder.value && mediaRecorder.value.state === 'recording') {
                    mediaRecorder.value.stop();
                }
            }, 50);
        } else {
            mediaRecorder.value.stop();
        }
    }
}

const togglePauseRecording = () => {
    if (!mediaRecorder.value || mediaRecorder.value.state === 'inactive') {
        return;
    }

    try {
        if (isPausedRecord.value && mediaRecorder.value.state === 'paused') {
            mediaRecorder.value.resume();
            resumeTimer();
        } else if (!isPausedRecord.value && mediaRecorder.value.state === 'recording') {
            mediaRecorder.value.pause();
            pauseTimer();
        }
    } catch (error: any) {
        console.error('Error toggling pause/resume:', error);
        toast({
            title: 'Recording Error',
            description: 'Failed to pause/resume recording',
            variant: 'destructive'
        });
    }
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
    stopTimer();
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
<div class="relative flex-col items-start gap-8 md:flex md:w-[350px]" :class="{ 'hidden': !mobile }">
    <div class="flex flex-col w-full items-start gap-6">
        <!-- Quality Info Display -->
        <div class="w-full p-3 relative overflow-hidden" style="background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.12); box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1);">
            <!-- Decorative gradient overlay -->
            <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>

            <div class="relative">
                <div class="flex items-center gap-2 mb-2">
                    <div class="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-blue-500 animate-pulse"></div>
                    <h4 class="text-sm font-medium bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
                        Current Recording Quality
                    </h4>
                </div>

                <div class="grid grid-cols-2 gap-2 text-xs">
                    <div class="flex items-center justify-between p-2 rounded-lg" style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.08);">
                        <span class="text-muted-foreground/80">Resolution</span>
                        <span class="font-medium text-foreground/90 text-xs">{{ getCurrentQualityInfo().resolution }}</span>
                    </div>
                    <div class="flex items-center justify-between p-2 rounded-lg" style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.08);">
                        <span class="text-muted-foreground/80">FPS</span>
                        <span class="font-medium text-foreground/90 text-xs">{{ getCurrentQualityInfo().fps }}</span>
                    </div>
                    <div class="flex items-center justify-between p-2 rounded-lg" style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.08);">
                        <span class="text-muted-foreground/80">Bitrate</span>
                        <span class="font-medium text-foreground/90 text-xs">{{ getCurrentQualityInfo().bitrate }}</span>
                    </div>
                    <div class="flex items-center justify-between p-2 rounded-lg" style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.08);">
                        <span class="text-muted-foreground/80">Codec</span>
                        <span class="font-medium text-foreground/90 text-xs">{{ getCurrentQualityInfo().codec }}</span>
                    </div>
                </div>

                <div class="mt-2 flex items-center justify-between p-2 rounded-lg text-xs" style="background: rgba(66, 133, 244, 0.08); backdrop-filter: blur(10px); border: 1px solid rgba(66, 133, 244, 0.15);">
                    <span class="text-muted-foreground/80">Mode</span>
                    <span class="font-medium text-blue-600 dark:text-blue-400">{{ getCurrentQualityInfo().mode }}</span>
                </div>
            </div>
        </div>

        <div class="w-full space-y-4">
            <!-- Recording Controls -->
            <div class="p-3 relative overflow-hidden" style="background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.12); box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);">
                <!-- Decorative gradient -->
                <div class="absolute inset-0 bg-gradient-to-r from-red-500/5 via-transparent to-blue-500/5 pointer-events-none"></div>

                <div class="relative">
                    <template v-if="!isRecording">
                        <template v-if="!mobile">
                            <div class="flex gap-2">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger as-child>
                                            <button @click="startRecording()" class="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gradient-to-r from-green-400 to-green-600 text-white font-semibold rounded-[10px] transition-all duration-300">
                                                <Play class="size-4"></Play>
                                                <span>Screen</span>
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" :side-offset="5">
                                            Record screen with system audio
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger as-child>
                                            <button @click="startRecordingWithAudioMic()" class="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gradient-to-r from-blue-400 to-blue-600 text-white font-semibold rounded-[10px] transition-all duration-300">
                                                <Mic class="size-4"></Mic>
                                                <span>+ Mic</span>
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" :side-offset="5">
                                            Record screen with system audio + microphone
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </template>
                        <button v-if="mobile" @click="startRecordingOnlyAudioMic()" class="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm bg-gradient-to-r from-blue-400 to-blue-600 text-white font-semibold rounded-[10px] transition-all duration-300">
                            <Mic class="size-4"></Mic>
                            <span>Record Audio</span>
                        </button>
                    </template>

                    <template v-if="isRecording">
                        <div class="flex gap-2">
                            <button @click="stopRecording()" class="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gradient-to-r from-red-400 to-red-600 text-white font-semibold rounded-[10px] transition-all duration-300" :class="{ 'animate-pulse [animation-duration:2s]': !isPausedRecord }">
                                <StopCircle class="size-4"></StopCircle>
                                <span>Stop</span>
                                <span class="ml-1 text-xs font-mono">{{ formatTime(elapsedTime) }}</span>
                            </button>
                            <button v-if="!mobile" @click="togglePauseRecording()" class="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-semibold rounded-[10px] transition-all duration-300">
                                <Pause v-if="!isPausedRecord" class="size-4"></Pause>
                                <Play v-else class="size-4"></Play>
                                <span>{{ isPausedRecord ? 'Resume' : 'Pause' }}</span>
                            </button>
                        </div>
                    </template>
                </div>
            </div>

            <!-- Camera Toggle -->
            <div class="flex items-center gap-3 justify-between p-3 rounded-lg" style="background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.12); box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);">
                <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full" :class="enableCameraView ? 'bg-green-500' : 'bg-gray-400'"></div>
                    <label for="enable-camera" class="text-sm font-medium">
                        <span v-if="disableCameraView" class="text-muted-foreground">No Camera</span>
                        <TooltipProvider v-else>
                            <Tooltip>
                                <TooltipTrigger as-child>
                                    <span>Camera View</span>
                                </TooltipTrigger>
                                <TooltipContent side="right" :side-offset="10" :class="{ 'hidden': mobile }">
                                    Picture-in-Picture camera overlay
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </label>
                </div>
                <Switch v-model:checked="enableCameraView" id="enable-camera" :disabled="disableCameraView" @update:checked="toggleWebCamp" />
            </div>
        </div>
        <fieldset class="rounded-lg border p-4 w-full" style="background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.12); box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);">
            <legend class="-ml-1 px-1 text-sm font-medium">Recorded Videos</legend>
            <ul class="overflow-y-auto space-y-1" :style="{ height: 'calc(100vh - 492px)' }">
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
        <div style="display: flex; flex-direction: row; gap: 4px;">
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
            <div :style="buttonContainerStyle">
                <button :style="buttonStopWebcamStyle + ' color: white;'">{{ formatTime(elapsedTime) }}</button>
            </div>
        </div>
    </div>
</div>
</template>
