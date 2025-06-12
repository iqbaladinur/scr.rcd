<script setup lang="ts">
import {
    Videotape,
    Github,
    Sun,
    MoonStar,
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
import Recorder from '@/components/Recorder.vue';
import { useVideo } from '@/composables/videoStore';
import VideoPlayer from "../VideoPlayer.vue";
import { version } from '../../../package.json';
import { useColorMode } from '@vueuse/core';
import { useIsMobile } from "@/composables/isMobileStore";
import SidebarNavigation from "../SidebarNavigation.vue";

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
    <div class="grid h-screen w-full" :class="{ 'pl-[56px]': !isMobile }">
        <!-- sidebar navigation -->
        <SidebarNavigation v-if="!isMobile" />

        <!-- header and menu content -->
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
                <div class="relative flex h-full min-h-[50vh] flex-col rounded-lg border p-4 flex-1" :class="{ 'w-full !rounded-md !bg-muted/0': isMobile }" style="background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.12); box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1);">
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
