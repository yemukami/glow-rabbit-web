import { initUI } from './js/ui/ui-controller.js';

window.onload = async function() {
    try {
        await initUI();
    } catch(e) {
        alert("Application Init Error:\n" + e.message + "\n" + e.stack);
        console.error(e);
    }
};