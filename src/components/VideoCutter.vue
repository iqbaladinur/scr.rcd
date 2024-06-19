<template>
    <div>
        <div class="relative min-h-[50px] rounded-lg border">
            <ResizablePanelGroup direction="horizontal" class="w-full rounded-lg min-h-[50px] absolute">
                <ResizablePanel :default-size="0" @resize="handleResize('left', $event)" />
                <ResizableHandle with-handle />
                <ResizablePanel class="bg-blue-300/30 flex items-center justify-center" />
                <ResizableHandle with-handle />
                <ResizablePanel :default-size="0" @resize="handleResize('right', $event)"/>
            </ResizablePanelGroup>
            <div ref="waveLength" class="w-full h-[50px] bg-white dark:bg-muted rounded-lg flex items-center justify-center px-4">
                <AudioLines v-for="(i) in getWaveSoundlength" :key="`logo_${i}`" class="w-7 h-7"></AudioLines>
            </div>
        </div>
        <div class="flex justify-between items-center mt-4">
            <fieldset class="rounded-lg border px-3 py-1.5 w-[200px] text-xs">
                <legend class="px-1 text-xs font-medium">Duration Cut</legend>
                <div class="flex justify-between items-center">
                    <label>Start</label>
                    <span>{{ (timeStamp.start).toFixed(2) }}</span>
                </div>
                <div class="flex justify-between items-center text-red-500">
                    <label>End</label>
                    <span>{{ (timeStamp.end).toFixed(2) }}</span>
                </div>
                <div class="flex justify-between items-center text-green-500">
                    <label>Length</label>
                    <span>{{ (timeStamp.end - timeStamp.start).toFixed(2) }}</span>
                </div>
            </fieldset>
            <slot></slot>
        </div>
    </div>
</template>
<script setup lang="ts">
import {
    ResizablePanelGroup,
    ResizableHandle,
    ResizablePanel
} from "@/components/ui/resizable";
import { computed, reactive, ref } from "vue";
import { AudioLines } from "lucide-vue-next";

const props = defineProps<{ duration: number }>();
const emit = defineEmits<{
    (event: 'resize', payload: { start: number, end: number }): void
}>();
const waveLength = ref<HTMLDivElement | null>(null);

const getWaveSoundlength = computed(() => {
    if (waveLength.value) {
        const widthEl = waveLength.value;
        if (widthEl) {
            const width = widthEl.offsetWidth;
            return Math.floor(width/28) - 2;
        }
        return 1;
    }

    return 1;
});
const percentageSize = reactive({
    left: 0,
    right: 0
});
const timeStamp = computed(() => {
    if (!props.duration) {
        return {
            start: 0,
            end: 0
        }
    }

    return {
        start: (percentageSize.left/100 * props.duration),
        end: props.duration - (percentageSize.right/100 * props.duration)
    }
})

function handleResize(side: 'left' | 'right', size: number) {
    if (side === 'left') {
        percentageSize.left = Math.round(size);
    } else {
        percentageSize.right = Math.round(size);
    }
    emit('resize', timeStamp.value);
}
</script>