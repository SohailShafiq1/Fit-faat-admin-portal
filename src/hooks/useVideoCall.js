import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import Video from 'twilio-video';

export const useVideoCall = ({ socket, token, apiUrl, userId, userName, userAccountId }) => {
  const [room, setRoom] = useState(null);
  const [localTracks, setLocalTracks] = useState([]);
  const [remoteTracks, setRemoteTracks] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const roomRef = useRef(null); // Track current room to prevent cleanup issues

  // Handle incoming call
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data) => {
      console.log('📞 ========== INCOMING CALL RECEIVED ==========');
      console.log('📞 Incoming video call received:', data);
      console.log('📞 Current userId:', userId);
      console.log('📞 Current userName:', userName);
      console.log('📞 Setting incoming call state...');
      setIncomingCall(data);
      console.log('📞 ✅ Incoming call state set');
      console.log('📞 ========================================');
    };

    const handleCallAccepted = (data) => {
      console.log('✅ ========== CALL ACCEPTED NOTIFICATION ==========');
      console.log('✅ Call accepted notification received:', data);
      console.log('✅ Current doctor userId:', userId);
      console.log('✅ Both parties should now be in room:', data.roomName);
      console.log('✅ ============================================');
    };

    const handleCallRejected = (data) => {
      console.log('❌ Call rejected:', data);
      setIncomingCall(null);
      setError('Call was rejected');
    };

    const handleCallEnded = (data) => {
      console.log('📴 Call ended:', data);
      disconnectCall();
    };

    socket.on('video:incoming-call', handleIncomingCall);
    socket.on('video:call-accepted', handleCallAccepted);
    socket.on('video:call-rejected', handleCallRejected);
    socket.on('video:call-ended', handleCallEnded);

    return () => {
      socket.off('video:incoming-call', handleIncomingCall);
      socket.off('video:call-accepted', handleCallAccepted);
      socket.off('video:call-rejected', handleCallRejected);
      socket.off('video:call-ended', handleCallEnded);
    };
  }, [socket]);

  // Get Twilio token and connect to room
  const connectToRoom = useCallback(async (roomName) => {
    try {
      console.log('🔗 ========== CONNECTING TO TWILIO ROOM ==========');
      console.log('🔗 connectToRoom called for:', roomName);
      console.log('🔗 API URL:', apiUrl);
      console.log('🔗 User info:', { userId, userName });
      
      setIsConnecting(true);
      setError(null);

      // Get Twilio token from backend
      console.log('🔗 Requesting token from backend...');
      const response = await axios.post(
        `${apiUrl}/video/token`,
        {
          roomName,
          userId,
          userName
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log('🔗 Token response:', response.data);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get video token');
      }

      const { token: twilioToken } = response.data;
      console.log('🔗 Got Twilio token, connecting to Video...');

      // Disconnect any existing room before connecting to new one
      if (roomRef.current) {
        console.log('⚠️ Disconnecting existing room before joining new one');
        roomRef.current.disconnect();
        roomRef.current = null;
        setRoom(null);
      }

      // Connect to Twilio Video room
      console.log('🔗 Connecting to Twilio Video with room name:', roomName);
      const twilioRoom = await Video.connect(twilioToken, {
        name: roomName,
        audio: true,
        video: { width: 640, height: 480 }
      });

      console.log('✅ ========== TWILIO CONNECTION SUCCESS ==========');
      console.log('✅ Connected to Twilio room:', twilioRoom.name);
      console.log('✅ Room participants:', twilioRoom.participants.size);
      console.log('✅ Local participant:', twilioRoom.localParticipant.identity);
      
      roomRef.current = twilioRoom; // Store in ref
      setRoom(twilioRoom);
      setIsConnected(true);
      setIsConnecting(false);

      // Attach local tracks
      twilioRoom.localParticipant.tracks.forEach((publication) => {
        if (publication.track) {
          setLocalTracks((prev) => [...prev, publication.track]);
          if (publication.track.kind === 'video' && localVideoRef.current) {
            const videoElement = publication.track.attach();
            localVideoRef.current.innerHTML = '';
            localVideoRef.current.appendChild(videoElement);
            console.log('✅ Local video track attached');
          }
        }
      });

      // Handle existing remote participants
      twilioRoom.participants.forEach((participant) => {
        console.log('👤 Existing participant found:', participant.identity);
        handleParticipantConnected(participant);
      });

      // Handle new participants joining
      twilioRoom.on('participantConnected', (participant) => {
        console.log('👤 New participant joined:', participant.identity);
        handleParticipantConnected(participant);
      });

      // Handle participants leaving
      twilioRoom.on('participantDisconnected', (participant) => {
        console.log('👋 Participant left:', participant.identity);
        handleParticipantDisconnected(participant);
      });

      // Handle disconnection
      twilioRoom.on('disconnected', () => {
        console.log('📴 Disconnected from room');
        cleanupTracks();
        setIsConnected(false);
        setRoom(null);
        roomRef.current = null;
      });

      console.log('✅ ============================================');

    } catch (err) {
      console.error('❌ ========== TWILIO CONNECTION ERROR ==========');
      console.error('❌ Error connecting to room:', err);
      console.error('❌ Error details:', err.message);
      setError(err.message);
      setIsConnecting(false);
      setIsConnected(false);
      
      // Clean up any partial connection
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
      setRoom(null);
      console.error('❌ ========================================');
    }
  }, [apiUrl, token, userId, userName, localVideoRef]);

  // Handle participant connected
  const handleParticipantConnected = useCallback((participant) => {
    console.log('👤 Participant connected:', participant.identity);

    participant.tracks.forEach((publication) => {
      if (publication.isSubscribed) {
        attachTrack(publication.track);
      }
    });

    participant.on('trackSubscribed', attachTrack);
    participant.on('trackUnsubscribed', detachTrack);
  }, [remoteVideoRef]);

  // Handle participant disconnected
  const handleParticipantDisconnected = useCallback((participant) => {
    console.log('👋 Participant disconnected:', participant.identity);
    
    participant.tracks.forEach((publication) => {
      if (publication.track) {
        detachTrack(publication.track);
      }
    });
  }, []);

  // Attach track to DOM
  const attachTrack = useCallback((track) => {
    if (track.kind === 'video' && remoteVideoRef.current) {
      setRemoteTracks((prev) => [...prev, track]);
      const videoElement = track.attach();
      remoteVideoRef.current.innerHTML = '';
      remoteVideoRef.current.appendChild(videoElement);
    } else if (track.kind === 'audio') {
      track.attach();
    }
  }, [remoteVideoRef]);

  // Detach track from DOM
  const detachTrack = useCallback((track) => {
    track.detach().forEach((element) => element.remove());
    setRemoteTracks((prev) => prev.filter((t) => t !== track));
  }, []);

  // Clean up tracks
  const cleanupTracks = useCallback(() => {
    localTracks.forEach((track) => {
      track.stop();
      track.detach().forEach((element) => element.remove());
    });
    setLocalTracks([]);

    remoteTracks.forEach((track) => {
      track.detach().forEach((element) => element.remove());
    });
    setRemoteTracks([]);
  }, [localTracks, remoteTracks]);

  // Start a call
  const startCall = useCallback(async (receiverId, receiverName, appointmentId) => {
    console.log('📞 ===== DOCTOR STARTING CALL =====');
    console.log('📞 startCall invoked with:', { receiverId, receiverName, appointmentId });
    console.log('📞 Doctor userId (from hook):', userId);  
    console.log('📞 Doctor userName (from hook):', userName);
    console.log('📞 Socket available:', !!socket);
    
    if (!socket) {
      console.error('❌ Socket not available in startCall');
      setError('Socket connection not available');
      return;
    }
    
    if (!userId || !userName) {
      console.error('❌ User information not available:', { userId, userName });
      setError('User information not available');
      return;
    }
    
    const roomName = `appointment_${appointmentId}`;
    console.log('📞 Generated roomName:', roomName);
    
    const callPayload = {
      roomName,
      callerId: userId,
      receiverId,
      callerName: userName
    };
    console.log('📞 Socket emit payload to patient:', callPayload);
    console.log('📞 Target socket room: user:' + receiverId);
    
    // Emit call initiation to socket
    socket.emit('video:call-user', callPayload);

    console.log('📞 Connecting doctor to room immediately:', roomName);
    // Doctor (caller) connects immediately as before
    await connectToRoom(roomName);
    console.log('📞 ===================================');
  }, [socket, userId, userName, connectToRoom]);

  // Accept an incoming call
  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;

    const { roomName, callerId } = incomingCall;

    console.log('🟢 Doctor accepting call from:', callerId, 'in room:', roomName);
    console.log('🟢 Doctor userId (Doctor document ID):', userId);
    console.log('🟢 Doctor userAccountId (User account ID):', userAccountId);

    // Notify the caller that call was accepted
    // Use userId (Doctor document ID) for socket communication since that's what patient targeted
    socket.emit('video:accept-call', {
      roomName,
      callerId,
      receiverId: userId // Use Doctor document ID that patient originally targeted
    });

    console.log('🟢 Emitted accept-call with Doctor document ID:', userId);
    console.log('🟢 Now connecting doctor to room...');

    // Connect to room
    await connectToRoom(roomName);
    setIncomingCall(null);
  }, [incomingCall, socket, userId, userAccountId, connectToRoom]);

  // Reject an incoming call
  const rejectCall = useCallback(() => {
    if (!incomingCall) return;

    const { roomName, callerId } = incomingCall;

    socket.emit('video:reject-call', {
      roomName,
      callerId,
      reason: 'Call declined'
    });

    setIncomingCall(null);
  }, [incomingCall, socket]);

  // Disconnect from call
  const disconnectCall = useCallback(async () => {
    const currentRoom = roomRef.current || room;
    if (currentRoom) {
      console.log('📴 Disconnecting from call');
      
      // Notify others that call is ending
      socket.emit('video:end-call', {
        roomName: currentRoom.name,
        userId
      });

      // Disconnect from room
      currentRoom.disconnect();
      cleanupTracks();
      setRoom(null);
      roomRef.current = null;
      setIsConnected(false);
    }
  }, [room, socket, userId, cleanupTracks]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (room) {
      room.localParticipant.audioTracks.forEach((publication) => {
        if (publication.track.isEnabled) {
          publication.track.disable();
          setIsAudioEnabled(false);
        } else {
          publication.track.enable();
          setIsAudioEnabled(true);
        }
      });
    }
  }, [room]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (room) {
      room.localParticipant.videoTracks.forEach((publication) => {
        if (publication.track.isEnabled) {
          publication.track.disable();
          setIsVideoEnabled(false);
        } else {
          publication.track.enable();
          setIsVideoEnabled(true);
        }
      });
    }
  }, [room]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      // Use ref to access current room, avoiding stale closure
      if (roomRef.current) {
        console.log('🧹 Cleaning up video call on unmount');
        roomRef.current.disconnect();
        roomRef.current = null;
      }
    };
  }, []); // Empty dependency array - only run on unmount

  return {
    room,
    localVideoRef,
    remoteVideoRef,
    isConnecting,
    isConnected,
    error,
    incomingCall,
    isAudioEnabled,
    isVideoEnabled,
    startCall,
    acceptCall,
    rejectCall,
    disconnectCall,
    toggleAudio,
    toggleVideo
  };
};

export default useVideoCall;
