import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Monitor, 
  PhoneOff, 
  MessageSquare, 
  FileText, 
  Info, 
  CheckCircle2, 
  Coins, 
  Copy, 
  Check, 
  Send, 
  Share2,
  LayoutGrid,
  Radio,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { IBooking } from '../types';

interface ChatMessage {
  id: string;
  senderName: string;
  senderId?: string;
  isMe?: boolean;
  text: string;
  time: string;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

// Helper: Generates an animated avatar video stream when physical camera is blocked or in use
// Helper: Generates a gamified retro 8-bit arcade video stream when physical camera is blocked or in use
function createFallbackVideoStream(label: string): MediaStream {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d')!;

  let step = 0;
  const initials = (label || 'P1').slice(0, 2).toUpperCase();

  const render = () => {
    step++;

    // 1. Retro Console CRT Background
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle retro pixel scan grid
    ctx.fillStyle = '#202127';
    for (let y = 0; y < canvas.height; y += 8) {
      if ((y / 8) % 2 === 0) {
        ctx.fillRect(0, y, canvas.width, 1);
      }
    }

    // 2. Bezel border
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 6;
    ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);

    // 3. Central Retro Player Badge (Chunky Pixel Box)
    const boxX = 220;
    const boxY = 110;
    const boxW = 200;
    const boxH = 170;

    // Hard retro shadow
    ctx.fillStyle = '#000000';
    ctx.fillRect(boxX + 6, boxY + 6, boxW, boxH);

    // Pixel Box background
    ctx.fillStyle = '#27272a';
    ctx.fillRect(boxX, boxY, boxW, boxH);

    // Pixel Box border
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Initials Text
    ctx.fillStyle = '#fef3c7';
    ctx.font = 'bold 52px "Press Start 2P", monospace, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, 320, 185);

    // Player Label underneath box
    ctx.fillStyle = '#10b981';
    ctx.font = '12px "Press Start 2P", monospace, sans-serif';
    ctx.fillText(`PLAYER: ${initials}`, 320, 255);

    // 4. Retro Hearts (HP indicators)
    ctx.fillStyle = '#ef4444';
    ctx.font = '18px monospace';
    ctx.fillText('♥ ♥ ♥', 320, 310);

    // 5. Bouncing Arcade Equalizer Bars (Gold and Green, non-neon)
    for (let i = 0; i < 9; i++) {
      const h = 8 + Math.abs(Math.sin((step + i * 14) * 0.12)) * 34;
      ctx.fillStyle = i % 2 === 0 ? '#f59e0b' : '#10b981';
      ctx.fillRect(235 + i * 19, 375 - h, 13, h);
      // Hard shadow for each bar
      ctx.fillStyle = '#000000';
      ctx.fillRect(235 + i * 19 + 2, 375, 13, 2);
    }

    // 6. Status ticker
    const blink = Math.floor(step / 20) % 2 === 0;
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '10px "Press Start 2P", monospace, sans-serif';
    ctx.fillText(blink ? '● TRANSMITTING ●' : '○ TRANSMITTING ○', 320, 420);

    requestAnimationFrame(render);
  };
  render();

  return (canvas as any).captureStream ? (canvas as any).captureStream(24) : new MediaStream();
}

export const MeetingRoomPage: React.FC = () => {
  const { ref } = useParams<{ ref: string }>();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<IBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Media states
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [hasMediaPermission, setHasMediaPermission] = useState<boolean | null>(null);
  const [useJitsi, setUseJitsi] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  // Peer WebRTC connection state
  const [peerConnected, setPeerConnected] = useState(false);
  const [isPeerVideoLive, setIsPeerVideoLive] = useState(false);
  const [isPeerSharingScreen, setIsPeerSharingScreen] = useState(false);
  const [peerUser, setPeerUser] = useState<any>(null);

  // Collaboration tabs: 'chat' | 'notes' | 'info'
  const [activeTab, setActiveTab] = useState<'chat' | 'notes' | 'info'>('chat');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sharedNotes, setSharedNotes] = useState(
    '# Collaborative Session Notes\n\n- Welcome to this live peer learning session!\n- Anything typed here will sync in real time across both screens.'
  );

  // Timer & Session lifecycle
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionSuccess, setCompletionSuccess] = useState(false);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const peerVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const targetSocketIdRef = useRef<string | null>(null);
  const iceCandidateQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Authoritative normalized room ID: removes all hyphens, spaces, underscores
  const activeRoomId = ((booking?.bookingReference || ref || '').toLowerCase()).replace(/[^a-z0-9]/g, '');
  const currentUserId = user?.id || (user as any)?._id;

  // 1. Fetch Booking Details
  useEffect(() => {
    if (!ref) return;
    const fetchBooking = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/bookings/${ref}`);
        if (res.data.success) {
          setBooking(res.data.booking);
          if (res.data.booking.status === 'completed') {
            setCompletionSuccess(true);
          }
        } else {
          setError(res.data.message || 'Booking not found');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load session details.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBooking();
  }, [ref]);

  // Helper: Flush queued ICE candidates after remote description is set
  const flushIceCandidateQueue = async (pc: RTCPeerConnection) => {
    while (iceCandidateQueueRef.current.length > 0) {
      const candidate = iceCandidateQueueRef.current.shift();
      if (candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn('[WebRTC] Failed to add queued ICE candidate:', err);
        }
      }
    }
  };

  // 2. Camera & Microphone Setup with Fallback
  const requestMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setHasMediaPermission(true);
      setIsVideoOn(true);

      // If peer connection exists, replace track
      if (peerConnectionRef.current) {
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];
        const senders = peerConnectionRef.current.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === 'video');
        if (videoSender && videoTrack) {
          videoSender.replaceTrack(videoTrack);
        }
        const audioSender = senders.find((s) => s.track?.kind === 'audio');
        if (audioSender && audioTrack) {
          audioSender.replaceTrack(audioTrack);
        }
      }
    } catch (err) {
      console.warn('[Media] Physical camera/mic unavailable. Using animated fallback stream:', err);
      setHasMediaPermission(false);
      setIsVideoOn(true);

      // Create fallback stream so WebRTC always negotiates video
      if (!localStreamRef.current) {
        const fallback = createFallbackVideoStream(user?.name || 'You');
        localStreamRef.current = fallback;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = fallback;
        }
      }
    }
  };

  useEffect(() => {
    // Ensure local stream is synchronously initialized so WebRTC has tracks immediately
    if (!localStreamRef.current) {
      const initialFallback = createFallbackVideoStream(user?.name || 'You');
      localStreamRef.current = initialFallback;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = initialFallback;
      }
    }

    requestMedia();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [user?.name]);

  // 3. WebRTC Peer Connection Helper
  const createPeerConnection = (targetSocketId?: string) => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    targetSocketIdRef.current = targetSocketId || null;
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // Ensure we always have an active local stream before adding tracks
    if (!localStreamRef.current) {
      localStreamRef.current = createFallbackVideoStream(user?.name || 'You');
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }

    // Add local tracks cleanly to WebRTC (creates matching m-lines in SDP)
    localStreamRef.current.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current!);
    });

    // Handle remote tracks from peer
    pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote track from peer:', event.track.kind);
      const stream = (event.streams && event.streams[0]) ? event.streams[0] : new MediaStream([event.track]);
      if (peerVideoRef.current) {
        peerVideoRef.current.srcObject = stream;
        peerVideoRef.current.play().catch(() => {});
      }
      setIsPeerVideoLive(true);
      setPeerConnected(true);

      event.track.onunmute = () => {
        console.log('[WebRTC] Track unmuted:', event.track.kind);
        setIsPeerVideoLive(true);
        setPeerConnected(true);
        peerVideoRef.current?.play().catch(() => {});
      };
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('webrtc-ice-candidate', {
          roomId: activeRoomId,
          targetSocketId: targetSocketIdRef.current || targetSocketId,
          candidate: event.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state change:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setPeerConnected(true);
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setPeerConnected(false);
      }
    };

    return pc;
  };

  // 4. Socket.IO Real-Time Room & WebRTC Signaling
  useEffect(() => {
    if (!activeRoomId || !currentUserId) return;

    // Direct port 5000 or fallback to origin
    const socketUrl = (import.meta.env.VITE_BACKEND_URL as string) || (
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? `http://${window.location.hostname}:5000`
        : undefined
    );

    const socket = io(socketUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected to real-time room signaling with ID:', socket.id);
      setIsSocketConnected(true);
      socket.emit('join-room', {
        roomId: activeRoomId,
        user: {
          id: currentUserId,
          name: user?.name || 'User',
          avatar: user?.avatar,
          email: user?.email,
        },
      });
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected from signaling server');
      setIsSocketConnected(false);
    });

    // A. Room Users list (if another peer is already in room)
    socket.on('room-users', async (existingUsers: Array<{ socketId: string; user: any }>) => {
      console.log('[Socket] Existing users in room:', existingUsers);
      if (existingUsers.length > 0) {
        const peer = existingUsers[0];
        targetSocketIdRef.current = peer.socketId;
        setPeerUser(peer.user);
        setPeerConnected(true);

        // Initiate WebRTC Call to peer
        const pc = createPeerConnection(peer.socketId);
        try {
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });
          await pc.setLocalDescription(offer);
          socket.emit('webrtc-offer', {
            roomId: activeRoomId,
            targetSocketId: peer.socketId,
            offer,
          });
        } catch (e) {
          console.error('[WebRTC] Failed to create offer:', e);
        }
      }
    });

    // B. New User Joined Room
    socket.on('user-joined', ({ socketId, user: joinedUser }) => {
      console.log('[Socket] Peer joined room:', joinedUser);
      targetSocketIdRef.current = socketId;
      setPeerUser(joinedUser);
      setPeerConnected(true);

      setChatMessages((prev) => [
        ...prev,
        {
          id: `join-${Date.now()}`,
          senderName: 'System',
          text: `🟢 ${joinedUser.name} joined the live session.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    });

    // C. WebRTC Offer received
    socket.on('webrtc-offer', async ({ senderSocketId, user: caller, offer }) => {
      console.log('[WebRTC] Received offer from:', caller?.name);
      targetSocketIdRef.current = senderSocketId;
      setPeerUser(caller);
      setPeerConnected(true);

      const pc = createPeerConnection(senderSocketId);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        await flushIceCandidateQueue(pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('webrtc-answer', {
          roomId: activeRoomId,
          targetSocketId: senderSocketId,
          answer,
        });
      } catch (e) {
        console.error('[WebRTC] Error handling offer:', e);
      }
    });

    // D. WebRTC Answer received
    socket.on('webrtc-answer', async ({ answer }) => {
      console.log('[WebRTC] Received answer from peer');
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          await flushIceCandidateQueue(peerConnectionRef.current);
        } catch (e) {
          console.error('[WebRTC] Error setting remote description:', e);
        }
      }
    });

    // E. WebRTC ICE Candidate received
    socket.on('webrtc-ice-candidate', async ({ candidate }) => {
      if (!candidate) return;
      const pc = peerConnectionRef.current;
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('[WebRTC] Error adding ICE candidate:', e);
        }
      } else {
        iceCandidateQueueRef.current.push(candidate);
      }
    });

    // F. Screen Share Status Update from Peer
    socket.on('screen-share-status', ({ isSharing, userName }) => {
      console.log(`[Socket] Peer screen share state changed: ${isSharing} by ${userName}`);
      setIsPeerSharingScreen(isSharing);
      if (peerVideoRef.current) {
        peerVideoRef.current.play().catch(() => {});
      }
    });

    // F. In-Call Chat Message Broadcast
    socket.on('chat-message', (msg: ChatMessage) => {
      setChatMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    // G. In-Call Shared Notes Broadcast
    socket.on('notes-update', ({ notes }: { notes: string }) => {
      setSharedNotes(notes);
    });

    // H. Real-Time Session Completed
    socket.on('session-completed', ({ creditCost, completedBy }) => {
      setCompletionSuccess(true);
      refreshUser();
      setChatMessages((prev) => [
        ...prev,
        {
          id: `completed-${Date.now()}`,
          senderName: 'System',
          text: `🎉 Session completed by ${completedBy}! ${creditCost} skill credits transferred successfully.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    });

    // I. Peer Left Room
    socket.on('user-left', ({ user: leftUser }) => {
      console.log('[Socket] Peer left room:', leftUser);
      setPeerConnected(false);
      setIsPeerVideoLive(false);
      setPeerUser(null);
      if (peerVideoRef.current) {
        peerVideoRef.current.srcObject = null;
      }
      setChatMessages((prev) => [
        ...prev,
        {
          id: `leave-${Date.now()}`,
          senderName: 'System',
          text: `👋 ${leftUser?.name || 'Peer'} disconnected from the session.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    });

    return () => {
      socket.disconnect();
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [activeRoomId, currentUserId]);

  // 5. Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 6. Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const toggleMic = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMicOn((prev) => !prev);
    } else {
      setIsMicOn((prev) => !prev);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOn((prev) => !prev);
    } else {
      setIsVideoOn((prev) => !prev);
    }
  };

  const stopScreenSharing = async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }

    const revertTrack = localStreamRef.current?.getVideoTracks()[0];
    if (peerConnectionRef.current && revertTrack) {
      const senders = peerConnectionRef.current.getSenders();
      const videoSender = senders.find((s) => s.track && s.track.kind === 'video') || senders[0];
      if (videoSender) {
        try {
          await videoSender.replaceTrack(revertTrack);
        } catch (e) {
          console.warn('Failed to revert video track:', e);
        }
      }
    }

    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }

    setIsScreenSharing(false);
    if (socketRef.current) {
      socketRef.current.emit('screen-share-status', {
        roomId: activeRoomId,
        isSharing: false,
        userName: user?.name,
      });
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      await stopScreenSharing();
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        screenStreamRef.current = stream;
        const screenTrack = stream.getVideoTracks()[0];

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        if (peerConnectionRef.current) {
          const senders = peerConnectionRef.current.getSenders();
          const videoSender = senders.find((s) => s.track && s.track.kind === 'video') || senders[0];
          if (videoSender) {
            try {
              await videoSender.replaceTrack(screenTrack);
            } catch (e) {
              console.warn('Failed to replace track with screen track:', e);
            }
          }
        }

        setIsScreenSharing(true);
        if (socketRef.current) {
          socketRef.current.emit('screen-share-status', {
            roomId: activeRoomId,
            isSharing: true,
            userName: user?.name,
          });
        }

        screenTrack.onended = () => {
          stopScreenSharing();
        };
      } catch (err) {
        console.warn('Screen sharing cancelled or unsupported:', err);
      }
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socketRef.current) return;

    const newMsg: ChatMessage = {
      id: `${socketRef.current.id}-${Date.now()}`,
      senderName: user?.name?.split(' ')[0] || 'User',
      senderId: user?.id || (user as any)?._id,
      text: inputMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    socketRef.current.emit('chat-message', {
      roomId: activeRoomId,
      message: newMsg,
    });

    setInputMessage('');
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setSharedNotes(val);
    if (socketRef.current) {
      socketRef.current.emit('notes-update', {
        roomId: activeRoomId,
        notes: val,
      });
    }
  };

  const handleCopyLink = () => {
    const canonicalRef = (booking?.bookingReference || ref || '').toLowerCase();
    const cleanUrl = `${window.location.origin}/meet/${canonicalRef}`;
    navigator.clipboard.writeText(cleanUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCompleteSession = async () => {
    if (!booking) return;
    if (!confirm('Mark this teaching session as completed? Eligible teaching credits will be immediately transferred to your account.')) return;

    try {
      setIsCompleting(true);
      const res = await api.put(`/bookings/${booking._id}/complete`);
      if (res.data.success) {
        setCompletionSuccess(true);
        await refreshUser();

        if (socketRef.current) {
          socketRef.current.emit('session-completed', {
            roomId: activeRoomId,
            creditCost: booking.creditCost,
            completedBy: user?.name || 'Instructor',
          });
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to complete session.');
    } finally {
      setIsCompleting(false);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isProvider = Boolean(
    booking && user && (booking.provider?._id === user.id || booking.provider?._id === (user as any)._id)
  );
  const peerName = peerUser?.name || (isProvider ? booking?.learner?.name : booking?.provider?.name);
  const peerAvatar = peerUser?.avatar || (isProvider ? booking?.learner?.avatar : booking?.provider?.avatar);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center text-stone-100 space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent animate-spin" />
        <p className="font-pixel text-xs text-amber-400">INITIALIZING ARCADE LINK...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-6 text-center text-stone-100 space-y-4">
        <div className="w-16 h-16 retro-card flex items-center justify-center text-red-500 mx-auto">
          <PhoneOff size={32} />
        </div>
        <h2 className="font-pixel text-sm text-red-400">GAME OVER — ROOM NOT FOUND</h2>
        <p className="font-retro-mono text-xs text-stone-400 max-w-md">
          {error || 'Unable to locate match reference. Confirm the booking session exists.'}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="retro-btn font-pixel text-[10px] px-5 py-3 bg-amber-600 hover:bg-amber-500 text-black font-bold"
        >
          RETURN TO DASHBOARD
        </button>
      </div>
    );
  }

  const jitsiRoomName = `SkillExchange_${(booking.bookingReference || ref || 'Room').replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <div className="h-screen bg-stone-950 text-stone-100 flex flex-col overflow-hidden select-none font-sans">
      {/* 1. Retro Arcade Top Status Bar */}
      <header className="h-16 px-4 border-b-2 border-stone-800 bg-stone-900 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(isProvider ? '/provider/sessions' : '/learner/sessions')}
            className="retro-btn font-pixel text-[9px] px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center gap-1.5"
          >
            ← EXIT
          </button>

          <div className="border-l-2 border-stone-800 pl-3 hidden sm:block">
            <h1 className="font-pixel text-[11px] text-amber-400 flex items-center gap-2">
              <span>⚔ {booking.skillListing?.title || 'SKILL BATTLE'}</span>
              <span className="retro-chip px-2 py-0.5 text-stone-300 font-pixel text-[9px]">
                REF: {booking.bookingReference}
              </span>
            </h1>
            <p className="font-retro-mono text-[11px] text-stone-400 flex items-center gap-2 mt-0.5">
              <span>PEER: <strong className="text-amber-300">{peerName}</strong></span>
              <span>•</span>
              <span className="font-pixel text-[9px] text-amber-400 flex items-center gap-1">
                🪙 {booking.creditCost} COINS STAKE
              </span>
            </p>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center gap-2.5">
          {/* Real-Time Signaling Badge */}
          <div className="retro-chip px-2.5 py-1.5 flex items-center gap-1.5 font-pixel text-[9px]">
            <span className={`w-2 h-2 rounded-none ${isSocketConnected ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
            <span className={isSocketConnected ? 'text-emerald-400' : 'text-red-400'}>
              {isSocketConnected ? 'SIGNAL ONLINE' : 'CONNECTING...'}
            </span>
          </div>

          {/* Peer Presence Badge */}
          <div className="hidden lg:flex retro-chip px-2.5 py-1.5 items-center gap-1.5 font-pixel text-[9px]">
            <span className={`w-2 h-2 rounded-none ${peerConnected ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
            <span className={peerConnected ? 'text-stone-200' : 'text-amber-300'}>
              {peerConnected ? `${peerName.toUpperCase()} (LINKED)` : 'WAITING FOR P2...'}
            </span>
          </div>

          {/* Retro Game Match Clock */}
          <div className="retro-card px-2.5 py-1.5 flex items-center gap-1.5 font-pixel text-[10px] text-emerald-400">
            <Radio size={12} className="text-red-500 animate-pulse" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>

          <button
            onClick={handleCopyLink}
            className="retro-btn font-pixel text-[9px] px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center gap-1"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span>{copied ? 'COPIED' : 'COPY LINK'}</span>
          </button>

          {isProvider && !completionSuccess && booking.status !== 'completed' && (
            <button
              onClick={handleCompleteSession}
              disabled={isCompleting}
              className="retro-btn font-pixel text-[9px] px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-black flex items-center gap-1.5 font-bold"
            >
              <CheckCircle2 size={13} />
              <span>{isCompleting ? 'CLAIMING...' : `COMPLETE (+${booking.creditCost} COINS)`}</span>
            </button>
          )}

          {completionSuccess && (
            <span className="retro-chip font-pixel text-[9px] px-3 py-1.5 bg-emerald-950 text-emerald-300 border-emerald-700 flex items-center gap-1">
              <CheckCircle2 size={13} /> QUEST DONE (+{booking.creditCost} CR)
            </span>
          )}
        </div>
      </header>

      {/* 2. Main Stage: Real-Time Video Tiles + Retro Comms Sidebar */}
      <div className="flex-1 flex overflow-hidden bg-stone-950">
        {/* Left Side: Video Grid */}
        <div className="flex-1 relative bg-stone-950 p-3 sm:p-4 flex flex-col justify-between overflow-hidden">
          {useJitsi ? (
            /* External Jitsi Fallback */
            <div className="flex-1 retro-card overflow-hidden bg-black flex flex-col">
              <div className="bg-stone-900 px-3 py-1.5 border-b-2 border-black flex items-center justify-between text-[10px] font-pixel text-stone-300">
                <span>[EXT-SCREEN LINK: JITSI CONSOLE]</span>
                <span className="text-amber-400">CHANNEL ACTIVE</span>
              </div>
              <iframe
                title="Skill Exchange Video Call"
                src={`https://meet.jit.si/${jitsiRoomName}#config.prejoinPageEnabled=false&userInfo.displayName=${encodeURIComponent(user?.name || 'User')}`}
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                className="w-full flex-1 border-0"
              />
            </div>
          ) : (
            /* Native Real-Time WebRTC Split Tiles */
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-center justify-center overflow-hidden">
              {/* Tile 1: Peer Participant Stream */}
              <div className="relative h-full min-h-[220px] retro-card bg-stone-900 overflow-hidden flex items-center justify-center group">
                {/* CRT Scanline overlay effect */}
                <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.15)_3px)] z-[5]" />

                <video
                  ref={peerVideoRef}
                  autoPlay
                  playsInline
                  className={`w-full h-full ${isPeerSharingScreen ? 'object-contain bg-black' : 'object-cover'} ${isPeerVideoLive ? 'block' : 'hidden'}`}
                />

                {/* Top Banner inside Peer Tile */}
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10 pointer-events-none">
                  <span className="retro-chip font-pixel text-[8px] sm:text-[9px] bg-stone-800 text-stone-200 border-black px-2 py-1 flex items-center gap-1.5 shadow-sm">
                    <span className={`w-2 h-2 ${peerConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'} border border-black inline-block`} />
                    <span>{isProvider ? 'PLAYER 2 (LEARNER)' : 'PLAYER 1 (MENTOR)'}</span>
                  </span>

                  {isPeerSharingScreen && (
                    <span className="retro-chip font-pixel text-[8px] bg-amber-400 text-black border-black px-2 py-1 flex items-center gap-1 animate-pulse">
                      <Monitor size={11} /> SCREENCAST LIVE
                    </span>
                  )}
                </div>

                {!isPeerVideoLive && (
                  <div className="text-center p-6 space-y-3 z-10">
                    <div className="relative inline-block border-2 border-black p-1 bg-stone-800 shadow-[3px_3px_0px_#000]">
                      <img
                        src={peerAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(peerName || 'Peer')}&background=44403c&color=facc15&bold=true`}
                        alt={peerName}
                        className="w-20 h-20 object-cover"
                      />
                      <span className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-black ${peerConnected ? 'bg-emerald-500' : 'bg-stone-600'}`} />
                    </div>
                    <div>
                      <h3 className="font-pixel text-xs text-amber-300">{peerName}</h3>
                      <p className="font-retro-mono text-xs text-stone-400 tracking-wide mt-1">
                        [{isProvider ? 'CHALLENGER / LEARNER' : 'GUILD MASTER / MENTOR'}]
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 border-2 border-black bg-stone-950 font-arcade text-sm text-stone-300">
                      <span className={`w-2 h-2 ${peerConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`} />
                      <span>{peerConnected ? 'PEER SIGNAL: LOCKED IN' : 'CONNECTING COIN-OP LINK...'}</span>
                    </div>
                  </div>
                )}

                {/* Bottom Peer Badge */}
                <div className="absolute bottom-2 left-2 z-10">
                  <div className="retro-chip font-pixel text-[8px] sm:text-[9px] bg-stone-900/90 text-stone-200 border-black px-2 py-1 flex items-center gap-1.5 shadow-sm">
                    <span className="text-amber-400">♥</span>
                    <span className="truncate max-w-[140px]">{peerName}</span>
                  </div>
                </div>
              </div>

              {/* Tile 2: Local User Camera / Screen */}
              <div className="relative h-full min-h-[220px] retro-card bg-stone-900 overflow-hidden flex items-center justify-center">
                {/* CRT Scanline overlay effect */}
                <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.15)_3px)] z-[5]" />

                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isVideoOn || isScreenSharing ? 'block' : 'hidden'} ${isScreenSharing ? '' : 'scale-x-[-1]'}`}
                />

                {/* Top Banner inside Local Tile */}
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10 pointer-events-none">
                  <span className="retro-chip font-pixel text-[8px] sm:text-[9px] bg-stone-800 text-stone-200 border-black px-2 py-1 flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 bg-emerald-400 border border-black inline-block" />
                    <span>YOU ({isProvider ? 'PLAYER 1' : 'PLAYER 2'})</span>
                  </span>

                  {isScreenSharing && (
                    <span className="retro-chip font-pixel text-[8px] bg-amber-400 text-black border-black px-2 py-1 flex items-center gap-1 animate-pulse">
                      <Monitor size={11} /> CASTING SCREEN
                    </span>
                  )}
                </div>

                {(!isVideoOn && !isScreenSharing) && (
                  <div className="text-center p-6 space-y-3 z-10">
                    <div className="relative inline-block border-2 border-black p-1 bg-stone-800 shadow-[3px_3px_0px_#000]">
                      <img
                        src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'You')}&background=44403c&color=facc15&bold=true`}
                        alt="You"
                        className="w-20 h-20 object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-pixel text-xs text-amber-300">{user?.name} (YOU)</h3>
                      <p className="font-retro-mono text-xs text-stone-400 tracking-wide mt-1">[CAMERA FEED STANDBY]</p>
                    </div>
                  </div>
                )}

                {/* Bottom Local User Badge */}
                <div className="absolute bottom-2 left-2 z-10 flex items-center gap-2">
                  <div className="retro-chip font-pixel text-[8px] sm:text-[9px] bg-stone-900/90 text-stone-200 border-black px-2 py-1 flex items-center gap-1.5 shadow-sm">
                    <span className="text-emerald-400">♥</span>
                    <span>YOU {isScreenSharing ? '(SCREEN)' : ''}</span>
                    {!isMicOn && <MicOff size={11} className="text-rose-400 ml-1 inline" />}
                  </div>
                </div>

                {hasMediaPermission === false && (
                  <div className="absolute top-10 left-3 right-3 p-2 border-2 border-amber-600 bg-amber-950/90 text-amber-200 font-retro-mono text-xs flex items-center justify-between z-20 shadow-md">
                    <span>Webcam locked by other app. 8-Bit Virtual Feed active.</span>
                    <button
                      onClick={requestMedia}
                      className="font-pixel text-[8px] text-amber-400 hover:text-white underline flex items-center gap-1"
                    >
                      <RefreshCw size={10} /> RETRY CAM
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. Bottom Meeting Controls Dock: Chunky Retro Arcade Console */}
          <div className="h-16 mt-3 px-4 sm:px-6 retro-card bg-stone-900 flex items-center justify-between shrink-0 z-10">
            {/* Left: Mode switcher */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setUseJitsi((prev) => !prev)}
                className={`retro-btn font-pixel text-[9px] px-2.5 sm:px-3 py-2 flex items-center gap-1.5 font-bold ${
                  useJitsi 
                    ? 'bg-amber-500 text-black' 
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
                title="Switch between Native Retro WebRTC and Jitsi Bridge"
              >
                <LayoutGrid size={12} />
                <span className="hidden sm:inline">{useJitsi ? 'JITSI COIN-OP' : 'NATIVE ARCADE'}</span>
              </button>
            </div>

            {/* Middle: Tactile Push-Buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={toggleMic}
                className={`retro-btn p-2.5 sm:p-3 flex items-center justify-center font-pixel ${
                  isMicOn 
                    ? 'bg-stone-800 hover:bg-stone-700 text-stone-100' 
                    : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
                title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
              >
                {isMicOn ? <Mic size={17} /> : <MicOff size={17} />}
              </button>

              <button
                onClick={toggleVideo}
                className={`retro-btn p-2.5 sm:p-3 flex items-center justify-center font-pixel ${
                  isVideoOn 
                    ? 'bg-stone-800 hover:bg-stone-700 text-stone-100' 
                    : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
                title={isVideoOn ? 'Turn Off Video' : 'Turn On Video'}
              >
                {isVideoOn ? <Video size={17} /> : <VideoOff size={17} />}
              </button>

              <button
                onClick={toggleScreenShare}
                className={`retro-btn p-2.5 sm:p-3 flex items-center justify-center font-pixel ${
                  isScreenSharing 
                    ? 'bg-amber-500 text-black hover:bg-amber-400' 
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-200'
                }`}
                title="Share Screen"
              >
                <Monitor size={17} />
              </button>

              <button
                onClick={() => navigate(isProvider ? '/provider/sessions' : '/learner/sessions')}
                className="retro-btn font-pixel text-[9px] px-3.5 sm:px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-1.5 ml-1"
                title="Exit Match"
              >
                <PhoneOff size={14} />
                <span className="hidden sm:inline">EXIT MATCH</span>
              </button>
            </div>

            {/* Right: Arcade Status */}
            <div className="flex items-center gap-2">
              <span className="font-pixel text-[8px] text-stone-400 hidden lg:inline tracking-wider">
                WEBRTC P2P // LINK ACTIVE
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Real-Time Arcade Comms & Mission Sidebar */}
        <aside className="w-80 md:w-96 border-l-2 border-black bg-stone-900 flex flex-col shrink-0">
          {/* Tabs header: Arcade Style */}
          <div className="h-12 border-b-2 border-black px-2 flex items-center gap-1.5 bg-stone-950">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-1.5 border-2 border-black font-pixel text-[9px] flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'chat' 
                  ? 'bg-amber-400 text-black shadow-[2px_2px_0px_#000]' 
                  : 'bg-stone-800 text-stone-400 hover:text-white'
              }`}
            >
              <MessageSquare size={11} />
              <span>[COMMS]</span>
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 py-1.5 border-2 border-black font-pixel text-[9px] flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'notes' 
                  ? 'bg-amber-400 text-black shadow-[2px_2px_0px_#000]' 
                  : 'bg-stone-800 text-stone-400 hover:text-white'
              }`}
            >
              <FileText size={11} />
              <span>[SCROLL]</span>
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-1.5 border-2 border-black font-pixel text-[9px] flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'info' 
                  ? 'bg-amber-400 text-black shadow-[2px_2px_0px_#000]' 
                  : 'bg-stone-800 text-stone-400 hover:text-white'
              }`}
            >
              <Info size={11} />
              <span>[MISSION]</span>
            </button>
          </div>

          {/* Tab 1: Real-Time Chat (Comms) */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col overflow-hidden bg-stone-900">
              <div ref={chatScrollRef} className="flex-1 p-3 space-y-3 overflow-y-auto">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-10 space-y-2 border-2 border-dashed border-stone-800 p-4 m-2">
                    <MessageSquare size={22} className="mx-auto text-amber-500/60" />
                    <p className="font-pixel text-[9px] text-stone-400">NO TRANSMISSIONS YET</p>
                    <p className="font-retro-mono text-xs text-stone-500">Transmit a signal to Player 2...</p>
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isMyMessage = msg.senderId === user?.id || msg.senderId === (user as any)?._id || msg.isMe;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-pixel text-[8px] text-amber-400">{msg.senderName}</span>
                          <span className="font-retro-mono text-[10px] text-stone-500">[{msg.time}]</span>
                        </div>
                        <div
                          className={`p-2.5 border-2 border-black font-retro-mono text-xs max-w-[88%] break-words shadow-[2px_2px_0px_#000] ${
                            isMyMessage
                              ? 'bg-amber-500 text-black font-semibold'
                              : msg.senderName === 'System'
                              ? 'bg-stone-950 text-amber-300 border-amber-600/50'
                              : 'bg-stone-800 text-stone-100'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-2.5 border-t-2 border-black bg-stone-950 flex items-center gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="TRANSMIT COMMS..."
                  className="flex-1 px-3 py-2 border-2 border-black bg-stone-900 font-retro-mono text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="retro-btn p-2 bg-amber-400 hover:bg-amber-300 text-black disabled:opacity-40"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          )}

          {/* Tab 2: Shared Collaborative Scratchpad / Notes */}
          {activeTab === 'notes' && (
            <div className="flex-1 flex flex-col p-3 space-y-2 overflow-hidden bg-stone-900">
              <div className="flex items-center justify-between border-b-2 border-black pb-2">
                <span className="font-pixel text-[9px] text-amber-300">[CO-OP ADVENTURE SCROLL]</span>
                <span className="font-pixel text-[8px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 inline-block animate-ping" />
                  REAL-TIME SYNC
                </span>
              </div>
              <textarea
                value={sharedNotes}
                onChange={handleNotesChange}
                placeholder="// Cooperative quest notes, code, solutions, and match logs..."
                className="flex-1 p-3 border-2 border-black bg-stone-950 font-retro-mono text-xs text-stone-200 resize-none focus:outline-none focus:border-amber-400 leading-relaxed shadow-inner"
              />
            </div>
          )}

          {/* Tab 3: Session Details */}
          {activeTab === 'info' && (
            <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-stone-900 text-xs">
              <div className="space-y-1 border-2 border-black p-3 bg-stone-950 shadow-[2px_2px_0px_#000]">
                <span className="font-pixel text-[8px] text-amber-400">[SKILL QUEST OBJECTIVE]</span>
                <h3 className="font-pixel text-xs text-stone-100 leading-snug">{booking.skillListing?.title}</h3>
                <p className="font-retro-mono text-xs text-stone-400 mt-1">{booking.skillListing?.description}</p>
              </div>

              <div className="border-2 border-black p-3 bg-stone-800 space-y-2.5 shadow-[2px_2px_0px_#000]">
                <div className="flex justify-between font-retro-mono text-xs border-b border-stone-700 pb-1">
                  <span className="text-stone-400">QUEST DATE:</span>
                  <span className="font-bold text-stone-100">{booking.date}</span>
                </div>
                <div className="flex justify-between font-retro-mono text-xs border-b border-stone-700 pb-1">
                  <span className="text-stone-400">TIME WINDOW:</span>
                  <span className="font-bold text-stone-100">{booking.startTime} - {booking.endTime}</span>
                </div>
                <div className="flex justify-between font-retro-mono text-xs border-b border-stone-700 pb-1">
                  <span className="text-stone-400">MATCH DURATION:</span>
                  <span className="font-bold text-stone-100">{booking.durationMinutes || 60} MINS</span>
                </div>
                <div className="flex justify-between font-retro-mono text-xs pt-1">
                  <span className="text-stone-400">STAKED BOUNTY:</span>
                  <span className="font-pixel text-[10px] text-amber-400">🪙 {booking.creditCost} COINS</span>
                </div>
              </div>

              {booking.learnerNotes && (
                <div className="space-y-1 border-2 border-black p-3 bg-stone-950 shadow-[2px_2px_0px_#000]">
                  <span className="font-pixel text-[8px] text-amber-400">[LEARNER'S BRIEF]</span>
                  <p className="font-retro-mono text-xs text-stone-300 italic">
                    "{booking.learnerNotes}"
                  </p>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={handleCopyLink}
                  className="w-full retro-btn font-pixel text-[9px] py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center justify-center gap-1.5"
                >
                  <Share2 size={12} />
                  <span>COPY MATCH INVITATION URL</span>
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
