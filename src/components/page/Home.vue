<script setup lang="ts">
import {
    LifeBuoy,
    SwitchCamera,
    Videotape,
    Github
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
import Recorder from '@/components/Recorder.vue';
import { useVideo } from '@/composables/videoStore';
import VideoPlayer from "../VideoPlayer.vue";
const { video } = useVideo();
</script>

<template>
    <div class="grid h-screen w-full pl-[53px]">
        <aside class="inset-y fixed left-0 z-20 flex h-full flex-col border-r">
            <div class="border-b p-2">
                <Button variant="outline" size="icon" aria-label="Home">
                    <SwitchCamera class="size-5 fill-background" />
                </Button>
            </div>
            <nav class="grid gap-1 p-2">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger as-child>
                            <Button variant="ghost" size="icon" class="rounded-lg bg-muted max-sm:hidden"
                                aria-label="Playground">
                                <Videotape class="size-5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" :side-offset="5">
                            Recorded Video
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <!-- mobile drawer -->
                <Drawer>
                    <DrawerTrigger as-child>
                        <Button variant="ghost" size="icon" class="rounded-lg bg-muted md:hidden" aria-label="Playground">
                            <Videotape class="size-5" />
                        </Button>
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
            </nav>
            <nav class="mt-auto grid gap-1 p-2">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger as-child>
                            <Button variant="ghost" size="icon" class="mt-auto rounded-lg" aria-label="Help">
                                <LifeBuoy class="size-5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" :side-offset="5"> Help </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </nav>
        </aside>
        <div class="flex flex-col">
            <header class="sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4 justify-between">
                <h1 class="text-xl font-semibold">SCR.RCD</h1>
                <a href="https://github.com/iqbaladinur/scr.rcd" target="_blank" rel="noopener noreferrer">
                    <Button size="sm" class="ml-auto gap-1.5 text-sm">
                        <Github class="size-5 text-white" />
                    </Button>
                </a>
            </header>
            <main class="grid flex-1 gap-4 overflow-auto p-4 md:grid-cols-2 lg:grid-cols-4">
                <Recorder />

                <!-- output -->
                <div class="relative flex h-full min-h-[50vh] flex-col rounded-sm bg-muted/50 p-4 lg:col-span-3">
                    <VideoPlayer v-if="video" :video="video" />
                    <div v-else class="flex-1 flex items-center justify-center">
                        No video selected
                    </div>
                </div>
            </main>
        </div>
    </div>
</template>
