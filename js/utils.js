// js/utils.js

// Compresses and encodes an SDP description.
export function compressSDP(desc) {
    const json = JSON.stringify(desc);
    const compressed = pako.deflate(json, { to: 'string' });
    return encodeURIComponent(btoa(String.fromCharCode.apply(null, compressed)));
  }
  
  // Decodes and decompresses an SDP description.
  export function decompressSDP(str) {
    try {
      const decodedStr = decodeURIComponent(str);
      return JSON.parse(pako.inflate(Uint8Array.from(atob(decodedStr), c => c.charCodeAt(0)), { to: 'string' }));
    } catch (error) {
      console.error("Error decoding SDP:", error);
      return null;
    }
  }
  
  // Updates the shareable URL input field.
  export function updateShareableURL(param, value) {
    if (!param === 'offer'){
        const url = new URL(window.location.href);
        const pathSegments = url.pathname.split('/');
        const rootDirectory = url.origin + pathSegments.slice(0, pathSegments.length - 1).join('/') + '/';
        const shareableURL = rootDirectory + '?' + param + '=' + value;    
    }
    document.getElementById('shareableUrl').value = value;
  }


  