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
                <canvas ref="audioCanvas" class="w-full h-full"></canvas>
                <span 
                    class="absolute top-0 w-[2px] h-full bg-red-500 rounded-sm transition-all duration-100 ease-linear" 
                    :style="{ left: `${indicatorPosition}px` }"
                ></span>
            </div>
        </div>
        <div class="flex justify-between items-center mt-4 gap-4">
            <div class="flex items-center gap-6 rounded-lg border px-4 py-2 flex-1">
                <div class="flex items-center gap-2">
                    <span class="text-xs font-medium text-muted-foreground">Start</span>
                    <span class="text-sm font-medium">{{ (timeStamp.start).toFixed(2) }}s</span>
                </div>
                <div class="h-4 w-[1px] bg-border"></div>
                <div class="flex items-center gap-2">
                    <span class="text-xs font-medium text-muted-foreground">End</span>
                    <span class="text-sm font-medium text-red-500">{{ (timeStamp.end).toFixed(2) }}s</span>
                </div>
                <div class="h-4 w-[1px] bg-border"></div>
                <div class="flex items-center gap-2">
                    <span class="text-xs font-medium text-muted-foreground">Length</span>
                    <span class="text-sm font-medium text-green-500">{{ (timeStamp.end - timeStamp.start).toFixed(2) }}s</span>
                </div>
            </div>
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
import { computed, reactive, ref, onMounted, watch, onBeforeUnmount } from "vue";

const props = defineProps<{ 
    duration: number, 
    currentTime: number,
    audioUrl?: string 
}>();

const emit = defineEmits<{
    (event: 'resize', payload: { start: number, end: number }): void
}>();

const waveLength = ref<HTMLDivElement | null>(null);
const audioCanvas = ref<HTMLCanvasElement | null>(null);
const audioData = ref<number[]>([]);
const animationFrame = ref<number | null>(null);
const currentAnimationProgress = ref(0);

async function analyzeAudio(url: string) {
    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        const channelData = audioBuffer.getChannelData(0);
        const samples = 200; // Increased number of samples for better resolution
        const blockSize = Math.floor(channelData.length / samples);
        const sampledData = [];

        for (let i = 0; i < samples; i++) {
            let blockStart = blockSize * i;
            let sum = 0;
            let peak = 0;
            
            for (let j = 0; j < blockSize; j++) {
                const amplitude = Math.abs(channelData[blockStart + j]);
                sum += amplitude;
                peak = Math.max(peak, amplitude);
            }
            
            sampledData.push((sum / blockSize + peak) / 2);
        }

        const maxValue = Math.max(...sampledData);
        audioData.value = sampledData.map(val => val / maxValue);
        
        // Reset animation progress
        currentAnimationProgress.value = 0;
        // Start animation
        startWaveformAnimation();
    } catch (error) {
        console.error('Error analyzing audio:', error);
    }
}

function startWaveformAnimation() {
    if (animationFrame.value) {
        cancelAnimationFrame(animationFrame.value);
    }
    
    const animate = () => {
        if (currentAnimationProgress.value < 1) {
            // Slower increment for smoother animation
            currentAnimationProgress.value += 0.02;
            drawWaveform();
            animationFrame.value = requestAnimationFrame(animate);
        }
    };
    
    animate();
}

function drawWaveform() {
    if (!audioCanvas.value || audioData.value.length === 0) return;

    const canvas = audioCanvas.value;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const width = rect.width / audioData.value.length;
    const middleY = rect.height / 2;
    
    // Add smooth interpolation for progress
    const progress = easeInOutCubic(currentAnimationProgress.value);
    const visiblePoints = Math.floor(audioData.value.length * progress);

    // Draw background lines with lower opacity
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.lineWidth = 1;
    
    audioData.value.forEach((point, index) => {
        if (index > visiblePoints) {
            const x = index * width;
            const height = point * (rect.height * 0.4) * 0.5; // Half height for background
            ctx.moveTo(x, middleY + height);
            ctx.lineTo(x, middleY - height);
        }
    });
    ctx.stroke();

    // Draw animated lines
    ctx.beginPath();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.5;

    audioData.value.forEach((point, index) => {
        if (index <= visiblePoints) {
            const x = index * width;
            let animationMultiplier = 1;
            
            // Smooth animation for the last few points
            if (index > visiblePoints - 5) {
                const pointProgress = 1 - (visiblePoints - index) / 5;
                animationMultiplier = easeOutElastic(pointProgress);
            }
            
            const height = point * (rect.height * 0.4) * animationMultiplier;
            ctx.moveTo(x, middleY + height);
            ctx.lineTo(x, middleY - height);
        }
    });
    ctx.stroke();
}

// Cubic easing for smoother progress
function easeInOutCubic(x: number): number {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

// Adjusted elastic easing for smoother bounce
function easeOutElastic(x: number): number {
    const c4 = (2 * Math.PI) / 3;
    return x === 0
        ? 0
        : x === 1
        ? 1
        : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}

watch(() => props.audioUrl, (newUrl) => {
    if (newUrl) {
        analyzeAudio(newUrl);
    }
});

onMounted(() => {
    if (props.audioUrl) {
        analyzeAudio(props.audioUrl);
    }
    
    window.addEventListener('resize', drawWaveform);
});

onBeforeUnmount(() => {
    if (animationFrame.value) {
        cancelAnimationFrame(animationFrame.value);
    }
});

const indicatorPosition = computed(() => {
    if (waveLength.value) {
        const width = waveLength.value.offsetWidth;
        const pos = Math.round(width * props.currentTime / props.duration);
        return pos; // in px
    }
    return 0;
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

