<template>
    <div class="relative min-h-[70px] rounded-lg border">
        <ResizablePanelGroup direction="horizontal" class="w-full rounded-lg min-h-[70px] absolute">
            <ResizablePanel :default-size="0" @resize="handleResize('left', $event)" />
            <ResizableHandle with-handle />
            <ResizablePanel class="bg-red-300/20 flex items-center justify-center">
                {{ percentageSize }} {{ timeStamp }}
            </ResizablePanel>
            <ResizableHandle with-handle />
            <ResizablePanel :default-size="0" @resize="handleResize('right', $event)"/>
        </ResizablePanelGroup>
        <div class="w-full h-[70px] bg-gray-600 rounded-lg">

        </div>
    </div>
</template>
<script setup lang="ts">
import {
    ResizablePanelGroup,
    ResizableHandle,
    ResizablePanel
} from "@/components/ui/resizable";
import { computed, reactive } from "vue";
const props = defineProps<{ duration: number }>()

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
        start: percentageSize.left/100 * props.duration,
        end: props.duration - (percentageSize.right/100 * props.duration)
    }
})

function handleResize(side: 'left' | 'right', size: number) {
    if (side === 'left') {
        percentageSize.left = Math.round(size);
        return;
    }
    percentageSize.right = Math.round(size);
}
</script>