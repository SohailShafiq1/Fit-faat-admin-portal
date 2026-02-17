import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import Video from 'twilio-video';

export const useVideoCall = ({ socket, token, apiUrl, userId, userName }) => {
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
      console.log('📞 Incoming video call:', data);
      setIncomingCall(data);
    };

    const handleCallAccepted = (data) => {
      console.log('✅ Call accepted:', data);
      // Both parties should now join the room
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
      const twilioRoom = await Video.connect(twilioToken, {
        name: roomName,
        audio: true,
        video: { width: 640, height: 480 }
      });

      console.log('✅ Connected to Twilio room:', twilioRoom.name);
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
          }
        }
      });

      // Handle existing remote participants
      twilioRoom.participants.forEach((participant) => {
        handleParticipantConnected(participant);
      });

      // Handle new participants joining
      twilioRoom.on('participantConnected', handleParticipantConnected);

      // Handle participants leaving
      twilioRoom.on('participantDisconnected', handleParticipantDisconnected);

      // Handle disconnection
      twilioRoom.on('disconnected', () => {
        console.log('📴 Disconnected from room');
        cleanupTracks();
        setIsConnected(false);
        setRoom(null);
        roomRef.current = null;
      });

    } catch (err) {
      console.error('❌ Error connecting to room:', err);
      setError(err.message);
      setIsConnecting(false);
      setIsConnected(false);
      
      // Clean up any partial connection
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
      setRoom(null);
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
    console.log('📞 startCall invoked with:', { receiverId, receiverName, appointmentId, userId, userName, socket: !!socket });
    
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
    console.log('📞 Emitting video:call-user event for room:', roomName);
    
    const callPayload = {
      roomName,
      callerId: userId,
      receiverId,
      callerName: userName
    };
    console.log('📞 Socket emit payload:', callPayload);
    
    // Emit call initiation to socket
    socket.emit('video:call-user', callPayload);

    console.log('📞 Connecting to room:', roomName);
    // Connect to room immediately (caller joins first)
    await connectToRoom(roomName);
  }, [socket, userId, userName, connectToRoom]);

  // Accept an incoming call
  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;

    const { roomName, callerId } = incomingCall;

    // Notify the caller that call was accepted
    socket.emit('video:accept-call', {
      roomName,
      callerId,
      receiverId: userId
    });

    // Connect to room
    await connectToRoom(roomName);
    setIncomingCall(null);
  }, [incomingCall, socket, userId, connectToRoom]);

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
