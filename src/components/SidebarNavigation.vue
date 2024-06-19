<template>
    <aside class="inset-y fixed left-0 z-20 flex h-full flex-col border-r">
        <div class="p-2 border-b">
            <img src="/logo-tone.png" alt="scr.rcd" class="rounded-md w-auto h-10">
        </div>
        <nav class="mt-auto grid gap-1 p-2">
            <!-- about -->
            <TooltipProvider>
                <Tooltip>
                    <Dialog>
                        <DialogTrigger>
                            <TooltipTrigger as-child>
                                <Button variant="ghost" size="icon" class="mt-auto rounded-lg" aria-label="Help">
                                    <Info class="size-5" />
                                </Button>
                            </TooltipTrigger>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>About this Web App</DialogTitle>
                                <DialogDescription>
                                    This app is carefully built for screen and audio recording, prioritizing your privacy. It securely stores all recorded data directly in your web browser, so you can trust that your information stays safe and private. With no need for server storage, your data remains under your control, offering a simple and reliable solution for recording needs.
                                </DialogDescription>
                            </DialogHeader>
                        </DialogContent>
                    </Dialog>
                    <TooltipContent side="right" :side-offset="5"> About </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <!-- setting -->
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
                            <div class="flex flex-col gap-4 min-h-[200px] pt-6">
                                <div class="flex items-center gap-2 justify-between border py-2 px-3 rounded-lg">
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
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </nav>
    </aside>
</template>
<script setup lang="ts">
import {
    Videotape,
    Info,
    Settings
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider
} from "@/components/ui/tooltip";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from "@/components/ui/switch";
import { use60FPS } from "@/composables/videoSettingStore";
import { onMounted } from "vue";

const { forced60fpsFHD, set60fps, get60fps } = use60FPS();

function toggleForched60FPS(value: boolean) {
    set60fps(value);
}

onMounted(() => {
    get60fps();
});

</script>