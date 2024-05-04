<script setup lang="ts">
import {
    Videotape,
    Github,
    Sun,
    MoonStar,
    Info
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
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
import Recorder from '@/components/Recorder.vue';
import { useVideo } from '@/composables/videoStore';
import VideoPlayer from "../VideoPlayer.vue";
import { version } from '../../../package.json';
import { useColorMode } from '@vueuse/core';
import { useIsMobile } from "@/composables/isMobileStore";

const colorMode = useColorMode();
const { isMobile } = useIsMobile();

const { video } = useVideo();
function toggleColorMode() {
    if (colorMode.value === 'dark') {
        colorMode.value = 'light';
    } else {
        colorMode.value = 'dark';
    }
}
</script>

<template>
    <div class="grid h-screen w-full" :class="{ 'pl-[53px]': !isMobile }">
        <aside v-if="!isMobile" class="inset-y fixed left-0 z-20 flex h-full flex-col border-r">
            <div class="border-b p-2">
                <img src="/logo-tone.png" alt="scr.rcd" class="rounded-md w-auto h-10">
            </div>
            <nav class="grid gap-1 p-2">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger as-child>
                            <Button variant="ghost" size="icon" class="rounded-lg bg-muted"
                                aria-label="Playground">
                                <Videotape class="size-5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" :side-offset="5">
                            Recorded Video
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </nav>
            <nav class="mt-auto grid gap-1 p-2">
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
            </nav>
        </aside>
        <div class="flex flex-col">
            <header class="sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4 justify-between">
                <h1 v-if="!isMobile" class="text-xl font-semibold">SCR.RCD ({{ version }})</h1>
                <div v-else class="p-2 flex items-center gap-2">
                    <img src="/logo-tone.png" alt="scr.rcd" class="rounded-md w-auto h-10">
                    <span class="text-xs">({{ version }})</span>
                </div>
                <div class="flex items-center justify-end gap-2">
                    <Button size="sm" class="ml-auto gap-1.5 text-sm" @click="toggleColorMode()" variant="outline">
                        <Sun v-if="colorMode === 'dark'" class="size-5" />
                        <MoonStar v-else class="size-5 fill-black dark:fill-white" />
                    </Button>
                    <a href="https://github.com/iqbaladinur/scr.rcd" target="_blank" rel="noopener noreferrer">
                        <Button size="sm" class="ml-auto gap-1.5 text-sm" variant="outline">
                            <Github class="size-5 fill-black dark:fill-white" />
                            <span v-show="!isMobile" >Github</span>
                        </Button>
                    </a>
                </div>
            </header>
            <main class="flex flex-1 gap-4 overflow-auto p-4" :class="{ 'flex-col items-center': isMobile }">
                <Recorder v-if="!isMobile" />

                <!-- output -->
                <div class="relative flex h-full min-h-[50vh] flex-col rounded-sm bg-muted/50 p-4 flex-1" :class="{ 'w-full !rounded-md !bg-muted/0': isMobile }">
                    <VideoPlayer :video="video" />
                </div>
                <Drawer v-if="isMobile">
                    <DrawerTrigger as-child>
                        <div class="w-full px-4 pb-4 pt-6 border-t">
                            <Button variant="ghost" size="icon" class="bg-blue-400 w-full rounded-lg"
                                aria-label="Playground">
                                <Videotape class="size-5 mr-2" />
                                <span>Start Recording</span>
                            </Button>
                        </div>
                    </DrawerTrigger>
                    <DrawerContent class="max-h-[80vh]">
                        <DrawerHeader>
                            <DrawerTitle>Menu</DrawerTitle>
                            <DrawerDescription>
                                Start recording your screen
                            </DrawerDescription>
                        </DrawerHeader>
                        <div class="grid w-full items-start gap-6 overflow-auto p-4 pt-0">
                            <Recorder :mobile="true" />
                        </div>
                    </DrawerContent>
                </Drawer>
            </main>
        </div>
    </div>
</template>
