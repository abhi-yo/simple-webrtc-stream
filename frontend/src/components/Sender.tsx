import { useEffect, useState } from "react";

export function Sender() {

  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');
    setSocket(socket);
    socket.onopen = () => {
      socket.send(JSON.stringify({
        type: 'sender'
      }));
    };
    return () => {
      socket.close();
    }
  }    , []);

  // webrtc code here
  async function startSendingVideo() {

    if (!socket) return;

    const pc =new RTCPeerConnection();

    pc.onnegotiationneeded = async () => {
      console.log("onnegotiationneeded");
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket?.send(JSON.stringify({ type: 'createOffer', sdp: pc.localDescription }));
    };


    pc.onicecandidate = (event) => {

      console.log('ice candidate');
      if (event.candidate) {
        socket?.send(JSON.stringify({ type: 'iceCandidate', candidate: event.candidate }));
      }
    }

    socket.onmessage = async(event) => {
      const data = JSON.parse(event.data);
      if(data.type==='createAnswer'){
        pc.setRemoteDescription(data.sdp);
      }
      else if(data.type==='iceCandidate'){
        pc.addIceCandidate(data.candidate);
      }
    }

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    pc.addTrack(stream.getTracks()[0]);
  }


  return <div>
      sender
      <button onClick = {startSendingVideo}>Send video
      </button>
  </div>
}
