import { ref } from 'vue';
const key = 'force60fpsFHD';
const keyH256 = 'forceH256';
const forced60fpsFHD = ref<boolean>(getValueStored(key));
const forceEncodeWithH264 = ref<boolean>(getValueStored(keyH256));

function set60fps(value: boolean) {
    forced60fpsFHD.value = value;
    storeValueLocalStorage(key, value);
}

function setEncodeAsH264(value: boolean) {
    forceEncodeWithH264.value = value;
    storeValueLocalStorage(keyH256, value);
}

function getValueStored(key: string) {
    if (!localStorage) {
        return false;
    }

    const strValue = localStorage.getItem(key);
    if (strValue) {
        return JSON.parse(strValue);
    }

    return false;
}

function storeValueLocalStorage(key: string, value: boolean) {
    const strValue = JSON.stringify(value);
    localStorage.setItem(key, strValue);
}

const use60FPS = () => ({
    forced60fpsFHD,
    forceEncodeWithH264,
    set60fps,
    setEncodeAsH264
})
export {
    use60FPS
}