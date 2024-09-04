<template>
    <Dialog>
        <DialogTrigger>
            <Button variant="ghost" size="icon" class="mt-auto rounded-lg" aria-label="Setting">
                <Settings class="size-5" />
            </Button>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Setting</DialogTitle>
                <DialogDescription>
                    <div class="flex flex-col gap-4 min-h-[380px] pt-6">
                        <fieldset class="rounded-lg border p-4 w-full">
                            <legend class="-ml-1 px-1 text-sm font-bold">Video Capture Setting</legend>
                            <div class="flex items-center gap-2 justify-between border py-2 px-3 rounded-lg mb-4">
                                <label for="fhd60fps" class="text-sm">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger as-child>
                                                <span>Force 60fps FHD(1920 x 1080)</span>
                                            </TooltipTrigger>
                                            <TooltipContent side="bottom" :side-offset="10">
                                                Forced to record<br>in 60fps FHD resolution
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </label>
                                <Switch :checked="forced60fpsFHD" id="fhd60fps" @update:checked="toggleForched60FPS" />
                            </div>
                            <div class="flex items-center gap-2 justify-between border py-2 px-3 rounded-lg">
                                <label for="fhd60fps" class="text-sm">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger as-child>
                                                <span>Force Encode H.264</span>
                                            </TooltipTrigger>
                                            <TooltipContent side="bottom" :side-offset="10">
                                                Enable this if you prefer mp4 format <br> or got error when downloading mp4 format.
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </label>
                                <Switch :checked="forceEncodeWithH264" id="fhd60fps" @update:checked="setEncodeAsH264" />
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

const { forced60fpsFHD, set60fps, setEncodeAsH264, forceEncodeWithH264 } = use60FPS();

function toggleForched60FPS(value: boolean) {
    set60fps(value);
}

</script>