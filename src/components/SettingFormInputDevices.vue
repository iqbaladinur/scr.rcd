<template>
    <fieldset class="rounded-lg border p-4 w-full">
        <legend class="-ml-1 px-1 text-sm font-bold">Mic and Camera Setting</legend>
        <div class="flex items-start w-full flex-col gap-2">
            <Select :default-value="defaultMic?.deviceId" @update:model-value="changeAudioInput">
                <label class="text-xs">Microphone</label>
                <SelectTrigger class="w-full">
                    <SelectValue placeholder="Select Mic (default mic will be used)" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectItem v-for="mic in devicesList.audio" :value="mic.deviceId">
                            {{ mic.label }}
                        </SelectItem>
                        <p v-if="devicesList.audio.length === 0" class="text-sm text-center">
                            No audio input detected.
                        </p>
                    </SelectGroup>
                </SelectContent>
            </Select>
            <Select :default-value="defaultCamera?.deviceId" @update:model-value="changeVideoInput">
                <label class="text-xs">Camera</label>
                <SelectTrigger class="w-full">
                    <SelectValue placeholder="Select Camera (default camera will be used)" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectItem v-for="cam in devicesList.video" :value="cam.deviceId">
                            {{ cam.label }}
                        </SelectItem>
                        <p v-if="devicesList.video.length === 0" class="text-sm text-center">
                            No camera input detected.
                        </p>
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    </fieldset>
</template>

<script setup lang="ts">
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCameraMicSetting } from '@/composables/cameraMicSetting';
import { reactive } from 'vue';

const {
    defaultCamera,
    defaultMic,
    getDevices,
    setDefaultCamera,
    setDefaultMic
} = useCameraMicSetting();
const { audio, video } = await getDevices();
const devicesList = reactive<AudioVideoDevices>({
    audio: audio || [],
    video: video || []
});

function changeVideoInput(deviceId: string) {
    const device = devicesList.video.find(v => v.deviceId === deviceId);
    if (device) {
        setDefaultCamera(device);
    }
}

function changeAudioInput(deviceId: string) {
    const device = devicesList.audio.find(a => a.deviceId === deviceId);
    if (device) {
        setDefaultMic(device);
    }
}
</script>