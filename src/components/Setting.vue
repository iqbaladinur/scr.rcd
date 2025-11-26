<template>
    <Dialog>
        <DialogTrigger>
            <Button variant="ghost" size="icon" class="mt-auto rounded-lg" aria-label="Setting">
                <Settings class="size-5" />
            </Button>
        </DialogTrigger>
        <DialogContent class="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader class="flex-shrink-0">
                <DialogTitle>Setting</DialogTitle>
            </DialogHeader>
            <DialogDescription class="flex-1 overflow-y-auto">
                <div class="flex flex-col gap-3 pt-4">
                    <div class="grid grid-cols-3 gap-3">
                            <fieldset class="rounded-lg border p-3">
                                <legend class="-ml-1 px-1 text-xs font-bold">Audio Mix Settings</legend>

                                <!-- Microphone Gain -->
                                <div class="mb-3">
                                    <div class="flex items-center justify-between mb-1">
                                        <label class="text-xs font-medium">Microphone</label>
                                        <span class="text-xs font-mono px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded">{{ micGainValue.toFixed(1) }}x</span>
                                    </div>
                                    <input
                                        type="range"
                                        :value="micGainValue"
                                        @input="handleMicGainChange"
                                        min="0.1"
                                        max="3.0"
                                        step="0.1"
                                        class="w-full h-1.5"
                                    />
                                    <div class="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                                        <span>0.1x</span>
                                        <span>3.0x</span>
                                    </div>
                                </div>

                                <!-- System Audio Gain -->
                                <div class="mb-3">
                                    <div class="flex items-center justify-between mb-1">
                                        <label class="text-xs font-medium">System Audio</label>
                                        <span class="text-xs font-mono px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 rounded">{{ systemGainValue.toFixed(1) }}x</span>
                                    </div>
                                    <input
                                        type="range"
                                        :value="systemGainValue"
                                        @input="handleSystemGainChange"
                                        min="0.0"
                                        max="2.0"
                                        step="0.1"
                                        class="w-full h-1.5"
                                    />
                                    <div class="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                                        <span>0.0x</span>
                                        <span>2.0x</span>
                                    </div>
                                </div>

                                <!-- Reset button -->
                                <Button
                                    @click="resetAudioGain"
                                    size="sm"
                                    variant="outline"
                                    class="w-full text-xs h-7"
                                >
                                    Reset to Default
                                </Button>

                                <div class="mt-2 p-1.5 bg-amber-50 dark:bg-amber-950/30 rounded text-[10px] text-amber-800 dark:text-amber-200">
                                    <p>For "Screen + Mic" mode</p>
                                </div>
                            </fieldset>

                            <fieldset class="rounded-lg border p-3">
                                <legend class="-ml-1 px-1 text-xs font-bold">Video Quality Settings</legend>

                                <!-- Auto-optimize button -->
                                <div class="mb-3 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <div class="flex items-center justify-between mb-1.5">
                                        <div>
                                            <p class="text-xs font-medium text-blue-900 dark:text-blue-100">Auto-Optimize</p>
                                            <p class="text-[10px] text-blue-700 dark:text-blue-300">Detect optimal settings</p>
                                        </div>
                                        <Button
                                            @click="autoOptimizeSettings"
                                            size="sm"
                                            :disabled="isOptimizing"
                                            class="bg-blue-600 hover:bg-blue-700 text-xs h-7"
                                        >
                                            {{ isOptimizing ? 'Detecting...' : 'Optimize' }}
                                        </Button>
                                    </div>
                                    <div v-if="deviceCapabilities" class="text-[10px] text-muted-foreground">
                                        <p>{{ deviceCapabilities.maxResolution.toUpperCase() }} • {{ deviceCapabilities.supports60fps ? '60fps' : '30fps' }} • {{ deviceCapabilities.recommendedCodec.toUpperCase() }}</p>
                                    </div>
                                </div>

                                <!-- Video Quality Mode -->
                                <div class="mb-3">
                                    <label class="text-xs font-medium mb-1 block">Resolution</label>
                                    <select
                                        v-model="videoQualityMode"
                                        @change="handleQualityChange"
                                        class="w-full p-1.5 text-xs border rounded-lg bg-background"
                                    >
                                        <option value="auto">Auto</option>
                                        <option value="hd">HD - 720p</option>
                                        <option value="fhd">FHD - 1080p</option>
                                        <option value="2k">2K - 1440p</option>
                                        <option value="4k">4K - 2160p</option>
                                        <option value="max">Maximum</option>
                                    </select>
                                </div>

                                <!-- Video Bitrate -->
                                <div class="mb-0">
                                    <label class="text-xs font-medium mb-1 block">Bitrate</label>
                                    <select
                                        v-model="videoBitrate"
                                        @change="handleBitrateChange"
                                        class="w-full p-1.5 text-xs border rounded-lg bg-background"
                                    >
                                        <option value="auto">Auto</option>
                                        <option value="high">High (8 Mbps)</option>
                                        <option value="ultra">Ultra (15 Mbps)</option>
                                    </select>
                                </div>
                            </fieldset>

                            <fieldset class="rounded-lg border p-3">
                                <legend class="-ml-1 px-1 text-xs font-bold">Advanced Settings</legend>

                                <!-- Advanced Mode Toggle -->
                                <div class="flex items-center gap-2 justify-between border py-1.5 px-2 rounded-lg mb-2">
                                    <label for="advanced-mode" class="text-xs">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger as-child>
                                                    <span>Advanced Video Mode</span>
                                                </TooltipTrigger>
                                                <TooltipContent side="bottom" :side-offset="10">
                                                    Enable advanced video processing<br>for better quality (uses more CPU)
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </label>
                                    <Switch :checked="advancedVideoMode" id="advanced-mode" @update:checked="setAdvancedVideoMode" />
                                </div>

                                <!-- Force 60fps -->
                                <div class="flex items-center gap-2 justify-between border py-1.5 px-2 rounded-lg mb-2">
                                    <label for="fhd60fps" class="text-xs">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger as-child>
                                                    <span>Force 60fps Recording</span>
                                                </TooltipTrigger>
                                                <TooltipContent side="bottom" :side-offset="10">
                                                    Force recording at 60fps<br>(may reduce quality on slower devices)
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </label>
                                    <Switch :checked="forced60fpsFHD" id="fhd60fps" @update:checked="toggleForched60FPS" />
                                </div>

                                <!-- H.264 Encoding -->
                                <div class="flex items-center gap-2 justify-between border py-1.5 px-2 rounded-lg">
                                    <label for="h264encode" class="text-xs">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger as-child>
                                                    <span>Force H.264 Codec</span>
                                                </TooltipTrigger>
                                                <TooltipContent side="bottom" :side-offset="10">
                                                    Force H.264 encoding for better compatibility<br>(VP9 codec usually provides better quality)
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </label>
                                    <Switch :checked="forceEncodeWithH264" id="h264encode" @update:checked="setEncodeAsH264" />
                                </div>
                            </fieldset>
                        </div>
                        <Suspense>
                            <SettingFormInputDevices />
                        </Suspense>
                    </div>
            </DialogDescription>
        </DialogContent>
    </Dialog>
</template>
<script setup lang="ts">
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-vue-next";
import { Switch } from "@/components/ui/switch";
import SettingFormInputDevices from "@/components/SettingFormInputDevices.vue";
import { use60FPS } from "@/composables/videoSettingStore";
import { useAudioGain } from "@/composables/audioGainStore";
import { ref } from 'vue';
import { useToast } from '@/components/ui/toast/use-toast';

const {
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
    applyOptimalSettings
} = use60FPS();

const {
    micGainValue,
    systemGainValue,
    setMicGain,
    setSystemGain,
    resetToDefaults
} = useAudioGain();

const { toast } = useToast();
const isOptimizing = ref(false);
const deviceCapabilities = ref<any>(null);

function toggleForched60FPS(value: boolean) {
    set60fps(value);
}

function handleMicGainChange(event: Event) {
    const target = event.target as HTMLInputElement;
    setMicGain(parseFloat(target.value));
}

function handleSystemGainChange(event: Event) {
    const target = event.target as HTMLInputElement;
    setSystemGain(parseFloat(target.value));
}

function resetAudioGain() {
    resetToDefaults();
    toast({
        title: 'Audio Settings Reset',
        description: 'Microphone and system audio volumes reset to default values',
    });
}

function handleQualityChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    setVideoQualityMode(target.value as any);
}

function handleBitrateChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    setVideoBitrate(target.value as any);
}

async function autoOptimizeSettings() {
    try {
        isOptimizing.value = true;
        deviceCapabilities.value = await applyOptimalSettings();

        toast({
            title: 'Settings Optimized',
            description: `Applied optimal settings for your device: ${deviceCapabilities.value.maxResolution.toUpperCase()} resolution, ${deviceCapabilities.value.recommendedBitrate} bitrate`,
        });
    } catch (error: any) {
        toast({
            title: 'Optimization Failed',
            description: error?.message || 'Could not detect device capabilities',
            variant: 'destructive'
        });
    } finally {
        isOptimizing.value = false;
    }
}

</script>
