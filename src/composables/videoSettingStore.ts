import { ref } from 'vue';

// Storage keys
const key = 'force60fpsFHD';
const keyH256 = 'forceH256';
const keyVideoQuality = 'videoQualityMode';
const keyVideoBitrate = 'videoBitrate';
const keyAdvancedMode = 'advancedVideoMode';

// Video quality modes
export type VideoQualityMode = 'auto' | 'hd' | 'fhd' | '2k' | '4k' | 'max';
export type VideoBitrate = 'auto' | 'high' | 'ultra';

// State
const forced60fpsFHD = ref<boolean>(getValueStored(key));
const forceEncodeWithH264 = ref<boolean>(getValueStored(keyH256));
const videoQualityMode = ref<VideoQualityMode>(getValueStored(keyVideoQuality) || 'auto');
const videoBitrate = ref<VideoBitrate>(getValueStored(keyVideoBitrate) || 'auto');
const advancedVideoMode = ref<boolean>(getValueStored(keyAdvancedMode));

// Video constraints configurations
export const getVideoConstraints = (mode: VideoQualityMode, force60fps: boolean = false) => {
    const baseConstraints = {
        frameRate: force60fps ? { ideal: 60, max: 60 } : { ideal: 30, min: 24, max: 60 },
    };

    switch (mode) {
        case 'hd':
            return {
                ...baseConstraints,
                width: { ideal: 1280, max: 1280 },
                height: { ideal: 720, max: 720 },
            };
        case 'fhd':
            return {
                ...baseConstraints,
                width: { ideal: 1920, max: 1920 },
                height: { ideal: 1080, max: 1080 },
            };
        case '2k':
            return {
                ...baseConstraints,
                width: { ideal: 2560, max: 2560 },
                height: { ideal: 1440, max: 1440 },
            };
        case '4k':
            return {
                ...baseConstraints,
                width: { ideal: 3840, max: 3840 },
                height: { ideal: 2160, max: 2160 },
            };
        case 'max':
            return {
                ...baseConstraints,
                width: { ideal: 3840, max: 3840 },
                height: { ideal: 2160, max: 2160 },
            };
        case 'auto':
        default:
            return {
                ...baseConstraints,
                width: { ideal: 1920, max: 1920 },
                height: { ideal: 1080, max: 1080 },
            };
    }
};

// MediaRecorder options based on bitrate setting
export const getRecorderOptions = (bitrate: VideoBitrate, forceH264: boolean = false) => {
    const baseOptions: MediaRecorderOptions = {};
    
    if (forceH264) {
        baseOptions.mimeType = 'video/webm;codecs=h264';
    } else {
        // Try VP9 first (better quality), fallback to VP8
        const supportedTypes = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm;codecs=h264',
            'video/webm'
        ];
        
        for (const type of supportedTypes) {
            if (MediaRecorder.isTypeSupported(type)) {
                baseOptions.mimeType = type;
                break;
            }
        }
    }

    switch (bitrate) {
        case 'high':
            baseOptions.videoBitsPerSecond = 8000000; // 8 Mbps
            baseOptions.audioBitsPerSecond = 256000; // 256 Kbps
            break;
        case 'ultra':
            baseOptions.videoBitsPerSecond = 15000000; // 15 Mbps
            baseOptions.audioBitsPerSecond = 320000; // 320 Kbps
            break;
        case 'auto':
        default:
            // Let browser decide optimal bitrate
            break;
    }

    return baseOptions;
};

// Device capability detection
export const detectDeviceCapabilities = async () => {
    const capabilities = {
        maxResolution: 'fhd' as VideoQualityMode,
        recommendedBitrate: 'auto' as VideoBitrate,
        supportsAdvancedMode: false,
        supports60fps: false,
        recommendedCodec: 'auto' as 'h264' | 'vp9' | 'auto'
    };

    try {
        // Test screen capture capabilities
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                width: { ideal: 3840 },
                height: { ideal: 2160 },
                frameRate: { ideal: 60 }
            }
        });

        const videoTrack = stream.getVideoTracks()[0];
        const settings = videoTrack.getSettings();
        
        // Determine max supported resolution
        if (settings.width && settings.height) {
            if (settings.width >= 3840 && settings.height >= 2160) {
                capabilities.maxResolution = '4k';
                capabilities.recommendedBitrate = 'ultra';
            } else if (settings.width >= 2560 && settings.height >= 1440) {
                capabilities.maxResolution = '2k';
                capabilities.recommendedBitrate = 'high';
            } else if (settings.width >= 1920 && settings.height >= 1080) {
                capabilities.maxResolution = 'fhd';
                capabilities.recommendedBitrate = 'high';
            } else {
                capabilities.maxResolution = 'hd';
                capabilities.recommendedBitrate = 'auto';
            }
        }

        // Check 60fps support
        if (settings.frameRate && settings.frameRate >= 60) {
            capabilities.supports60fps = true;
        }

        // Check advanced processing capability (rough estimation based on memory)
        const nav = navigator as any;
        if (nav.deviceMemory && nav.deviceMemory >= 8) {
            capabilities.supportsAdvancedMode = true;
        }

        // Test codec support
        const testCodecs = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=h264',
            'video/webm;codecs=vp8,opus'
        ];
        
        for (const codec of testCodecs) {
            if (MediaRecorder.isTypeSupported(codec)) {
                if (codec.includes('vp9')) {
                    capabilities.recommendedCodec = 'vp9';
                    break;
                } else if (codec.includes('h264')) {
                    capabilities.recommendedCodec = 'h264';
                }
            }
        }

        // Stop the test stream
        stream.getTracks().forEach(track => track.stop());

    } catch (error) {
        console.warn('Could not detect full device capabilities:', error);
    }

    return capabilities;
};

// Auto-configure optimal settings
export const applyOptimalSettings = async () => {
    const capabilities = await detectDeviceCapabilities();
    
    // Apply recommended settings
    setVideoQualityMode(capabilities.maxResolution);
    setVideoBitrate(capabilities.recommendedBitrate);
    setAdvancedVideoMode(capabilities.supportsAdvancedMode);
    
    // Don't force 60fps unless device clearly supports it well
    if (capabilities.supports60fps && capabilities.maxResolution !== '4k') {
        set60fps(true);
    }

    // Use H.264 only if VP9 is not available
    if (capabilities.recommendedCodec === 'h264') {
        setEncodeAsH264(true);
    }

    return capabilities;
};

function set60fps(value: boolean) {
    forced60fpsFHD.value = value;
    storeValueLocalStorage(key, value);
}

function setEncodeAsH264(value: boolean) {
    forceEncodeWithH264.value = value;
    storeValueLocalStorage(keyH256, value);
}

function setVideoQualityMode(value: VideoQualityMode) {
    videoQualityMode.value = value;
    storeValueLocalStorage(keyVideoQuality, value);
}

function setVideoBitrate(value: VideoBitrate) {
    videoBitrate.value = value;
    storeValueLocalStorage(keyVideoBitrate, value);
}

function setAdvancedVideoMode(value: boolean) {
    advancedVideoMode.value = value;
    storeValueLocalStorage(keyAdvancedMode, value);
}

function getValueStored(key: string) {
    if (!localStorage) {
        return false;
    }

    const strValue = localStorage.getItem(key);
    if (strValue) {
        return JSON.parse(strValue);
    }

    return false;
}

function storeValueLocalStorage(key: string, value: any) {
    const strValue = JSON.stringify(value);
    localStorage.setItem(key, strValue);
}

const use60FPS = () => ({
    forced60fpsFHD,
    forceEncodeWithH264,
    videoQualityMode,
    videoBitrate,
    advancedVideoMode,
    set60fps,
    setEncodeAsH264,
    setVideoQualityMode,
    setVideoBitrate,
    setAdvancedVideoMode,
    getVideoConstraints,
    getRecorderOptions,
    detectDeviceCapabilities,
    applyOptimalSettings
})

export {
    use60FPS
}