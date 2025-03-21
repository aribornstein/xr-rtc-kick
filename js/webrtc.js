// js/webrtc.js
import { compressSDP, decompressSDP, updateShareableURL } from './utils.js';

export async function setupInitiator(pc) {
  const dc = pc.createDataChannel("kick-channel");
  dc.onopen = () => console.log("Data channel opened");
  dc.onmessage = e => console.log("Message from receiver:", e.data);
  
  pc.onicecandidate = e => {
    if (!e.candidate) {
      const compressed = compressSDP(pc.localDescription);
      const receiverUrl = `${window.location.href.split('?')[0]}retriever.html?offer=${compressed}`;
      updateShareableURL('offer', receiverUrl);
      console.log("Share this offer URL:", receiverUrl);
    }
  };
  
  pc.onconnectionstatechange = () => {
    if (pc.connectionState === 'connected') {
      console.log("✅ Connection established!");
      document.getElementById('connectionStatus').textContent = '✅ Connection established!';
    } else {
      document.getElementById('connectionStatus').textContent = 'Connecting...';
    }
  };
  
  const offerDesc = await pc.createOffer();
  await pc.setLocalDescription(offerDesc);
  return { dc };
}

export async function handleResponseMode(pc, offerParam) {
  const offerDesc = decompressSDP(offerParam);
  await pc.setRemoteDescription(offerDesc);
  const answerDesc = await pc.createAnswer();
  await pc.setLocalDescription(answerDesc);
  const compressed = compressSDP(pc.localDescription);
  updateShareableURL('offer', `${window.location.href.split('?')[0]}retriever.html?offer=${compressed}`);
}

export async function setupResponder(pc) {
  pc.onicecandidate = e => {
    if (!e.candidate) {
      console.log("ICE gathering complete");
    }
  };

  pc.onconnectionstatechange = () => {
    if (pc.connectionState === 'connected') {
      console.log("✅ Connection established!");
      document.getElementById('connectionStatus').textContent = '✅ Connection established!';
    } else {
      document.getElementById('connectionStatus').textContent = 'Connecting...';
    }
  };

  pc.ondatachannel = e => {
    const dataChannel = e.channel;
    dataChannel.onopen = () => console.log("Data channel opened (receiver)");
    dataChannel.onmessage = e => {
      console.log("Received kick event:", e.data);
      document.dispatchEvent(new CustomEvent('kickEvent', { detail: e.data }));
    };
  };

  const urlParams = new URLSearchParams(window.location.search);
  const offer = urlParams.get('offer');
  if (offer) {
    const offerDesc = decompressSDP(offer);
    await pc.setRemoteDescription(offerDesc);
    const answerDesc = await pc.createAnswer();
    await pc.setLocalDescription(answerDesc);
    const compressedAnswer = compressSDP(answerDesc);
    updateShareableURL('answer', compressedAnswer);
    console.log("Answer generated. Share this answer URL.");
  }
}

// Poll for an answer stored in localStorage.
export async function pollForAnswer(pc) {
  const checkAnswer = async () => {
    const storedAnswer = localStorage.getItem('localAnswer');
    if (storedAnswer) {
      console.log("✅ Found answer in localStorage!");
      localStorage.removeItem('localAnswer');
      const answerDesc = decompressSDP(storedAnswer);
      if (answerDesc) {
        try {
          await pc.setRemoteDescription(answerDesc);
          console.log("Remote description set from stored answer.");
          document.getElementById('connectionStatus').textContent = '✅ Connection established!';
        } catch (e) {
          console.error("Error applying stored answer:", e);
          document.getElementById('connectionStatus').textContent = '❌ Connection failed!';
        }
      } else {
        console.error("Failed to decompress SDP answer from localStorage.");
        document.getElementById('connectionStatus').textContent = '❌ Connection failed!';
      }
    } else {
      setTimeout(checkAnswer, 3000);
    }
  };
  checkAnswer();
}
