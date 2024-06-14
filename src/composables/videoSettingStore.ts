import { ref } from 'vue';
const key = 'forced60fpsFHD';
const forced60fpsFHD = ref<boolean>(localStorage?.getItem(key) === '1' ? true : false);
function set60fps(value: boolean) {
    forced60fpsFHD.value = value;
    const val = value ? '1' : '0';
    localStorage.setItem(key, val);
}

function get60fps() {
    const value = localStorage?.getItem(key) === '1' ? true : false;
    forced60fpsFHD.value = value;
    return forced60fpsFHD.value;
}

const use60FPS = () => ({
    forced60fpsFHD,
    set60fps,
    get60fps,
})
export {
    use60FPS
}