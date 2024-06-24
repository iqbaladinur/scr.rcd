<template>
    <aside class="inset-y fixed left-0 z-20 flex h-full flex-col border-r">
        <div class="p-2 border-b">
            <img src="/logo-tone.png" alt="scr.rcd" class="rounded-md w-auto h-10">
        </div>
        <nav class="mt-auto grid gap-1 p-2">
            <!-- about -->
            <Dialog>
                <DialogTrigger>
                    <Button variant="ghost" size="icon" class="mt-auto rounded-lg" aria-label="Help">
                        <Info class="size-5" />
                    </Button>
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
            <!-- setting -->
            <Setting />
        </nav>
    </aside>
</template>
<script setup lang="ts">
import { Info } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import Setting from "@/components/Setting.vue";
</script>
