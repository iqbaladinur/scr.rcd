import { ref } from 'vue';

// ===========================================================================
// CursorFX — cinematic cursor overlay + auto zoom-to-cursor for screen casts
// ---------------------------------------------------------------------------
// Renders the captured screen through a canvas so we can bake in:
//   - a crisp cursor sprite (screen capture never includes the tab's cursor)
//   - a white halo highlight around the cursor
//   - click ripple rings on pointerdown
//   - automatic Ken Burns zoom that follows cursor movement and eases
//     back out when idle (Screen Studio style, but fully automatic)
//
// The output is a replacement video track (canvas.captureStream). Audio and
// the rest of the recording pipeline are untouched. When the feature is
// disabled the app records the raw stream exactly as before.
// ===========================================================================

// --- persisted settings ----------------------------------------------------
const KEY_ENABLED = 'cursorFXEnabled';
const KEY_HIGHLIGHT = 'cursorFXHighlight';
const KEY_CLICK = 'cursorFXClick';
const KEY_ZOOM = 'cursorFXZoom';
const KEY_ZOOM_MAX = 'cursorFXZoomMax';

function getBool(key: string, fallback = false): boolean {
    try {
        const raw = localStorage.getItem(key);
        if (raw === null) return fallback;
        return !!JSON.parse(raw);
    } catch {
        return fallback;
    }
}
function getNum(key: string, fallback: number): number {
    try {
        const raw = localStorage.getItem(key);
        if (raw === null) return fallback;
        const n = Number(JSON.parse(raw));
        return Number.isFinite(n) ? n : fallback;
    } catch {
        return fallback;
    }
}
function storeValue(key: string, value: any) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        /* private mode — ignore */
    }
}

const cursorFXEnabled = ref<boolean>(getBool(KEY_ENABLED));
const cursorHighlight = ref<boolean>(getBool(KEY_HIGHLIGHT, true));
const clickEffect = ref<boolean>(getBool(KEY_CLICK, true));
const autoZoom = ref<boolean>(getBool(KEY_ZOOM, true));
const zoomMax = ref<number>(getNum(KEY_ZOOM_MAX, 2.2));

export function useCursorEnhancer() {
    const setEnabled = (v: boolean) => {
        cursorFXEnabled.value = v;
        storeValue(KEY_ENABLED, v);
    };
    const setHighlight = (v: boolean) => {
        cursorHighlight.value = v;
        storeValue(KEY_HIGHLIGHT, v);
    };
    const setClickEffect = (v: boolean) => {
        clickEffect.value = v;
        storeValue(KEY_CLICK, v);
    };
    const setAutoZoom = (v: boolean) => {
        autoZoom.value = v;
        storeValue(KEY_ZOOM, v);
    };
    const setZoomMax = (v: number) => {
        zoomMax.value = v;
        storeValue(KEY_ZOOM_MAX, v);
    };

    return {
        cursorFXEnabled,
        cursorHighlight,
        clickEffect,
        autoZoom,
        zoomMax,
        setEnabled,
        setHighlight,
        setClickEffect,
        setAutoZoom,
        setZoomMax,
    };
}

// --- engine ----------------------------------------------------------------

export interface CursorFXOptions {
    highlight: boolean;
    click: boolean;
    zoom: boolean;
    zoomMax: number;
}

export interface EnhancedTrack {
    track: MediaStreamTrack;
    canvas: HTMLCanvasElement;
    dispose: () => void;
}

/** Render a crisp pointer arrow (macOS-style) to an offscreen canvas. */
function createCursorSprite(): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = 48;
    c.height = 64;
    const x = c.getContext('2d')!;
    x.translate(2, 2); // tip lives at (2,2)
    x.lineJoin = 'round';
    x.lineCap = 'round';
    x.beginPath();
    x.moveTo(0, 0); // tip
    x.lineTo(28, 31); // outer corner
    x.lineTo(16, 31); // inner notch step
    x.lineTo(21, 44); // tail
    x.lineTo(14, 48); // tail tip
    x.lineTo(8, 31); // notch inner
    x.lineTo(0, 31); // close
    x.closePath();
    x.strokeStyle = 'rgba(0,0,0,0.9)';
    x.lineWidth = 3;
    x.stroke();
    x.fillStyle = '#ffffff';
    x.fill();
    return c;
}

/**
 * Build a replacement video track with cursor + zoom effects baked in.
 *
 * `videoTrack` is the original screen capture track (kept alive; the caller
 * still owns stopping it). The returned track is drawn from a canvas of the
 * same aspect, capped at 1920x1080 to keep real-time compositing cheap.
 *
 * Coordinate mapping per capture source:
 *  - 'browser' (our tab): page-relative coords -> normalized, exact.
 *  - 'monitor'           : screenX/Y * DPR mapped into capture size, approx.
 *  - 'window'            : relative to our window position, approx.
 *
 * Best results (and the primary demo scenario) come from recording the tab
 * that is running the recorder — cursor position then maps 1:1.
 */
export function createEnhancedVideoTrack(
    videoTrack: MediaStreamTrack,
    options: CursorFXOptions,
    fps: number = 30,
): EnhancedTrack {
    const settings = (videoTrack.getSettings() ?? {}) as any;
    const srcW = settings.width ?? 1920;
    const srcH = settings.height ?? 1080;
    const displaySurface: 'browser' | 'monitor' | 'window' | string =
        settings.displaySurface ?? 'browser';

    // Cap output canvas; the zoom still sees the full source.
    const capW = 1920;
    const capH = 1080;
    const scale = Math.min(1, capW / srcW, capH / srcH);
    const W = Math.round(srcW * scale);
    const H = Math.round(srcH * scale);

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    canvas.style.display = 'none';
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.srcObject = new MediaStream([videoTrack]);

    const sprite = createCursorSprite();
    // cursor roughly 3.5% of the smaller output edge
    const cursorH = Math.max(18, Math.round(Math.min(W, H) * 0.045));
    const cursorScale = cursorH / 64; // sprite is 48x64, tip at (2,2)
    const tipDX = 2 * cursorScale;

    const stream = canvas.captureStream(fps);
    const capTrack = stream.getVideoTracks()[0];

    // --- pointer state -----------------------------------------------------
    let inside = true;
    let targetX = 0.5;
    let targetY = 0.5;
    let smoothX = 0.5;
    let smoothY = 0.5;
    let latestMove = 0;
    const recent: { t: number; x: number; y: number }[] = [];
    const ripples: { x: number; y: number; t0: number }[] = [];

    let zoom = 1;
    let zoomTarget = 1;
    let lastTs = performance.now();
    let raf = 0;
    let running = true;

    const dpr = window.devicePixelRatio || 1;

    function pageToNorm(e: PointerEvent): { x: number; y: number } {
        let nx = 0.5;
        let ny = 0.5;
        if (displaySurface === 'monitor') {
            nx = (e.screenX * dpr) / srcW;
            ny = (e.screenY * dpr) / srcH;
        } else if (displaySurface === 'window') {
            nx = ((e.screenX - window.screenX) * dpr) / srcW;
            ny = ((e.screenY - window.screenY) * dpr) / srcH;
        } else {
            // browser / fallback: our viewport == captured tab
            nx = window.innerWidth > 0 ? e.clientX / window.innerWidth : 0.5;
            ny = window.innerHeight > 0 ? e.clientY / window.innerHeight : 0.5;
        }
        return { x: Math.min(1, Math.max(0, nx)), y: Math.min(1, Math.max(0, ny)) };
    }

    const onMove = (e: PointerEvent) => {
        inside = true;
        const p = pageToNorm(e);
        targetX = p.x;
        targetY = p.y;
        latestMove = performance.now();
        recent.push({ t: latestMove, x: p.x * srcW, y: p.y * srcH });
        if (recent.length > 10) recent.shift();
    };
    const onDown = (e: PointerEvent) => {
        if (e.button !== 0 && e.button !== 2) return;
        const p = pageToNorm(e);
        ripples.push({ x: p.x * W, y: p.y * H, t0: performance.now() });
        if (ripples.length > 12) ripples.shift();
    };
    const onLeave = () => {
        inside = false;
    };

    window.addEventListener('pointermove', onMove, true);
    window.addEventListener('pointerdown', onDown, true);
    document.addEventListener('mouseleave', onLeave);
    window.addEventListener('blur', onLeave);

    // Hide the OS cursor so the captured tab doesn't show a double cursor.
    const cursorHider = document.createElement('style');
    cursorHider.textContent = '*{cursor:none!important}';
    if (displaySurface === 'browser') {
        document.head.appendChild(cursorHider);
    }

    function draw(now: number) {
        if (!running) return;
        const dt = Math.min(0.05, (now - lastTs) / 1000);
        lastTs = now;

        // smooth cursor position (critically damped follow)
        const k = 1 - Math.exp(-dt * 11);
        smoothX += (targetX - smoothX) * k;
        smoothY += (targetY - smoothY) * k;

        // --- auto zoom -----------------------------------------------------
        if (options.zoom) {
            // movement speed over the last 250ms (source px / s)
            let speed = 0;
            const cutoff = now - 250;
            while (recent.length > 2 && recent[0].t < cutoff) recent.shift();
            const last = recent[recent.length - 1];
            if (last && last.t >= cutoff && recent.length >= 2) {
                const first = recent[0];
                const dist = Math.hypot(last.x - first.x, last.y - first.y);
                const span = (last.t - first.t) / 1000 || 0.001;
                speed = dist / span;
            }
            // zoom only while actively moving + cursor still inside
            const active = inside && speed > 70 && now - latestMove < 260;
            if (active) {
                const sNorm = Math.min(1, speed / 1400);
                zoomTarget = 1 + (options.zoomMax - 1) * (1 - (1 - sNorm) * (1 - sNorm));
            } else {
                zoomTarget = 1;
            }
        } else {
            zoomTarget = 1;
        }
        zoom += (zoomTarget - zoom) * (1 - Math.exp(-dt * 3.2));
        if (Math.abs(zoom - 1) < 0.004) zoom = 1;

        // keep the focused point in bounds so no background shows
        const half = Math.min(0.5, 0.5 / Math.max(zoom, 1.0001));
        const fx = Math.min(Math.max(smoothX, half), 1 - half);
        const fy = Math.min(Math.max(smoothY, half), 1 - half);

        // --- frame ---------------------------------------------------------
        ctx.clearRect(0, 0, W, H);
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.scale(zoom, zoom);
        ctx.translate(-fx * W, -fy * H);
        if (video.videoWidth > 0) {
            const vw = video.videoWidth;
            const vh = video.videoHeight;
            const s = Math.max(W / vw, H / vh);
            const dw = vw * s;
            const dh = vh * s;
            ctx.drawImage(video, (W - dw) / 2, (H - dh) / 2, dw, dh);
        }
        ctx.restore();

        // --- cursor + effects (screen space) -------------------------------
        const cx = smoothX * W;
        const cy = smoothY * H;
        // For monitor/window captures the cursor stays on-screen even when it
        // leaves our browser, so keep drawing at the last known position.
        const cursorVisible = displaySurface === "browser" ? inside : true;

        // click ripples
        if (options.click && ripples.length > 0) {
            for (let i = ripples.length - 1; i >= 0; i--) {
                const r = ripples[i];
                const t = (now - r.t0) / 380;
                if (t >= 1) {
                    ripples.splice(i, 1);
                    continue;
                }
                const ease = 1 - (1 - t) * (1 - t);
                ctx.beginPath();
                ctx.arc(r.x, r.y, 7 + ease * 32, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(255,255,255,${(1 - t) * 0.9})`;
                ctx.lineWidth = 1 + 2.4 * (1 - t);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(r.x, r.y, 1 + 4 * (1 - t), 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${(1 - t) * 0.95})`;
                ctx.fill();
            }
        }

        if (cursorVisible) {
            // halo highlight behind the pointer
            if (options.highlight) {
                ctx.beginPath();
                ctx.arc(cx, cy, cursorH * 0.55, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255,255,255,0.16)';
                ctx.fill();
                ctx.beginPath();
                ctx.arc(cx, cy, cursorH * 0.72, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255,255,255,0.35)';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
            ctx.drawImage(
                sprite,
                cx - tipDX,
                cy - tipDX,
                48 * cursorScale,
                cursorH,
            );
        }

        raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);

    const dispose = () => {
        running = false;
        cancelAnimationFrame(raf);
        window.removeEventListener('pointermove', onMove, true);
        window.removeEventListener('pointerdown', onDown, true);
        document.removeEventListener('mouseleave', onLeave);
        window.removeEventListener('blur', onLeave);
        cursorHider.remove();
        video.pause();
        video.srcObject = null;
        video.remove();
        try {
            capTrack.stop();
        } catch {
            /* already stopped */
        }
    };

    return { track: capTrack, canvas, dispose };
}