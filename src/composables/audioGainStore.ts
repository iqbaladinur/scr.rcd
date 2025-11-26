import { ref } from 'vue';

// Storage keys
const keyMicGain = 'micGainValue';
const keySystemGain = 'systemGainValue';

// Default values
const DEFAULT_MIC_GAIN = 1.5;
const DEFAULT_SYSTEM_GAIN = 0.5;

// State
const micGainValue = ref<number>(getValueStored(keyMicGain, DEFAULT_MIC_GAIN));
const systemGainValue = ref<number>(getValueStored(keySystemGain, DEFAULT_SYSTEM_GAIN));

function setMicGain(value: number) {
    // Clamp value between 0.1 and 3.0
    const clampedValue = Math.max(0.1, Math.min(3.0, value));
    micGainValue.value = clampedValue;
    storeValueLocalStorage(keyMicGain, clampedValue);
}

function setSystemGain(value: number) {
    // Clamp value between 0.0 and 2.0
    const clampedValue = Math.max(0.0, Math.min(2.0, value));
    systemGainValue.value = clampedValue;
    storeValueLocalStorage(keySystemGain, clampedValue);
}

function resetToDefaults() {
    setMicGain(DEFAULT_MIC_GAIN);
    setSystemGain(DEFAULT_SYSTEM_GAIN);
}

function getValueStored(key: string, defaultValue: number): number {
    if (!localStorage) {
        return defaultValue;
    }

    const strValue = localStorage.getItem(key);
    if (strValue) {
        try {
            const parsed = JSON.parse(strValue);
            return typeof parsed === 'number' ? parsed : defaultValue;
        } catch {
            return defaultValue;
        }
    }

    return defaultValue;
}

function storeValueLocalStorage(key: string, value: number) {
    const strValue = JSON.stringify(value);
    localStorage.setItem(key, strValue);
}

export const useAudioGain = () => ({
    micGainValue,
    systemGainValue,
    setMicGain,
    setSystemGain,
    resetToDefaults,
    DEFAULT_MIC_GAIN,
    DEFAULT_SYSTEM_GAIN
});
