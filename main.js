import { initUI } from './js/ui/ui-controller.js';

window.onerror = function(message, source, lineno, colno, error) {
    const el = document.createElement('div');
    el.style.cssText = "position:fixed; top:0; left:0; right:0; background:red; color:white; padding:20px; z-index:9999; font-family:monospace; white-space:pre-wrap; opacity:0.9;";
    el.innerText = `RUNTIME ERROR:\n${message}\nLine: ${lineno}\nSource: ${source}`;
    document.body.appendChild(el);
};

window.onload = async function() {
    try {
        await initUI();
    } catch(e) {
        alert("Application Init Error:\n" + e.message + "\n" + e.stack);
        console.error(e);
    }
};