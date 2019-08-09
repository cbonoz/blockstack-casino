import { IS_IOS } from '../constants/browser.constants';

let tap = false;
let callback = null;

function startTap() {
    tap = true;
}

function stopTap() {
    tap = false;
}

function invokeCallback() {
    if (tap) {
        callback();
        tap = false;
    }
}

export function setGlobalClickAndTabHandler(cb) {
    callback = cb;

    const main = document.querySelector('#main');
    if (IS_IOS) {
        main.ontouchstart = startTap;
        main.ontouchmove = stopTap;
        main.ontouchcancel = stopTap;
        main.ontouchend = invokeCallback;
    } else {
        main.onclick = cb;
    }
}
