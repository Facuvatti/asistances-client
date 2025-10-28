import {httpRequest,Cookie} from "./utils.js";
async function hash(data) {
  const msgUint8 = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

class Fingerprint {
    constructor() {
        this.fingerprint = null;
    }
    canvas() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const text = 'canvas_fingerprint_test';
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText(text, 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText(text, 4, 17);
        return canvas.toDataURL(); // Esto genera un código base64
    }
    webGLF() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) return "WebGL no soportado";

            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'N/A';
            const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'N/A';

            return `${vendor}-${renderer}`;
        } catch (e) {
            return "Error al obtener WebGL fingerprint";
        }
    }
    async run() {
        const info = {
            userAgent: navigator.userAgent,
            screenInfo: {
                width: window.screen.width,
                height: window.screen.height,
                colorDepth: window.screen.colorDepth,
            },
            timezoneInfo: {
                timezoneOffset: new Date().getTimezoneOffset(),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            canvasHash: this.canvas(),
            webglFingerprint: this.webGLF()
        }; 
        const infoStr = JSON.stringify(info); 
        this.fingerprint = await hash(infoStr);
        return this.fingerprint;

    }
}
async function getIp() {
    let ips = await httpRequest("cdn-cgi/trace","GET",undefined,'https://www.cloudflare.com/');
    const ipRegex = /[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}/;
    const ip = ips.match(ipRegex)[0];
    return ip;
}
async function getDevice() {
    if(Cookie.get("fingerprint")) return Cookie.get();
    else {
        let fingerprint = new Fingerprint();
        fingerprint = await fingerprint.run();
        Cookie.set("fingerprint",fingerprint,7);
        await httpRequest(`device`,"POST",{fingerprint});
        return fingerprint;
    }
}
getDevice()