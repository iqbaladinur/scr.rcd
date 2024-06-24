import { useEventBus } from '@vueuse/core';
import { ref } from 'vue';

const KEY_AUDIO = 'AUDIO_INPUT';
const KEY_VIDEO = 'VIDEO_INPUT';
const KEY_EVENT_CHANGE_MIC = 'EVENT_CHANGE_MIC';
const KEY_EVENT_CHANGE_CAM = 'EVENT_CHANGE_CAM';

const defaultMic = ref<MediaDeviceInfo | null>(getValueStored(KEY_AUDIO));
const defaultCamera = ref<MediaDeviceInfo | null>(getValueStored(KEY_VIDEO));
const camChanged = useEventBus(KEY_EVENT_CHANGE_CAM);

async function getDevices(): Promise<AudioVideoDevices> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return {
        audio: devices.filter(a => a.kind === 'audioinput' && !!a.deviceId),
        video: devices.filter(v => v.kind === 'videoinput' && !!v.deviceId)
    };
}

const setDefaultMic = (device: MediaDeviceInfo) => {
    defaultMic.value = device;
    storeValueSession(KEY_AUDIO, device);
}

const setDefaultCamera = (device: MediaDeviceInfo) => {
    defaultCamera.value = device;
    storeValueSession(KEY_VIDEO, device);
    camChanged.emit(device);
}

function getValueStored(key: string) {
    if (!sessionStorage) {
        return null;
    }

    const strValue = sessionStorage.getItem(key);
    if (strValue) {
        return JSON.parse(strValue);
    }

    return null;
}

function storeValueSession(key: string, value: MediaDeviceInfo) {
    const strValue = JSON.stringify(value);
    sessionStorage.setItem(key, strValue);
}

const useCameraMicSetting = () => ({
    defaultMic,
    defaultCamera,
    getDevices,
    setDefaultCamera,
    setDefaultMic,
    camChanged,
});

export {
    useCameraMicSetting
}