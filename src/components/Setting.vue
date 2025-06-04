<template>
    <Dialog>
        <DialogTrigger>
            <Button variant="ghost" size="icon" class="mt-auto rounded-lg" aria-label="Setting">
                <Settings class="size-5" />
            </Button>
        </DialogTrigger>
        <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Setting</DialogTitle>
                <DialogDescription>
                    <div class="flex flex-col gap-4 min-h-[380px] pt-6">
                        <fieldset class="rounded-lg border p-4 w-full">
                            <legend class="-ml-1 px-1 text-sm font-bold">Video Quality Settings</legend>
                            
                            <!-- Auto-optimize button -->
                            <div class="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                                <div class="flex items-center justify-between mb-2">
                                    <div>
                                        <p class="text-sm font-medium text-blue-900 dark:text-blue-100">Auto-Optimize Settings</p>
                                        <p class="text-xs text-blue-700 dark:text-blue-300">Automatically detect and apply optimal settings for your device</p>
                                    </div>
                                    <Button 
                                        @click="autoOptimizeSettings" 
                                        size="sm" 
                                        :disabled="isOptimizing"
                                        class="bg-blue-600 hover:bg-blue-700"
                                    >
                                        {{ isOptimizing ? 'Detecting...' : 'Auto-Optimize' }}
                                    </Button>
                                </div>
                                <div v-if="deviceCapabilities" class="text-xs text-muted-foreground">
                                    <p>Detected: {{ deviceCapabilities.maxResolution.toUpperCase() }} • {{ deviceCapabilities.supports60fps ? '60fps' : '30fps' }} • {{ deviceCapabilities.recommendedCodec.toUpperCase() }}</p>
                                </div>
                            </div>
                            
                            <!-- Video Quality Mode -->
                            <div class="mb-4">
                                <label class="text-sm font-medium mb-2 block">Resolution Quality</label>
                                <select 
                                    v-model="videoQualityMode" 
                                    @change="handleQualityChange"
                                    class="w-full p-2 border rounded-lg bg-background"
                                >
                                    <option value="auto">Auto (Optimal for device)</option>
                                    <option value="hd">HD - 720p (1280x720)</option>
                                    <option value="fhd">Full HD - 1080p (1920x1080)</option>
                                    <option value="2k">2K - 1440p (2560x1440)</option>
                                    <option value="4k">4K - 2160p (3840x2160)</option>
                                    <option value="max">Maximum Available</option>
                                </select>
                            </div>

                            <!-- Video Bitrate -->
                            <div class="mb-4">
                                <label class="text-sm font-medium mb-2 block">Video Bitrate</label>
                                <select 
                                    v-model="videoBitrate" 
                                    @change="handleBitrateChange"
                                    class="w-full p-2 border rounded-lg bg-background"
                                >
                                    <option value="auto">Auto (Browser optimized)</option>
                                    <option value="high">High Quality (8 Mbps)</option>
                                    <option value="ultra">Ultra Quality (15 Mbps)</option>
                                </select>
                            </div>

                            <!-- Advanced Mode Toggle -->
                            <div class="flex items-center gap-2 justify-between border py-2 px-3 rounded-lg mb-4">
                                <label for="advanced-mode" class="text-sm">
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
                            <div class="flex items-center gap-2 justify-between border py-2 px-3 rounded-lg mb-4">
                                <label for="fhd60fps" class="text-sm">
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
                            <div class="flex items-center gap-2 justify-between border py-2 px-3 rounded-lg">
                                <label for="h264encode" class="text-sm">
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
                        <Suspense>
                            <SettingFormInputDevices />
                        </Suspense>
                    </div>
                </DialogDescription>
            </DialogHeader>
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

const { toast } = useToast();
const isOptimizing = ref(false);
const deviceCapabilities = ref<any>(null);

function toggleForched60FPS(value: boolean) {
    set60fps(value);
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