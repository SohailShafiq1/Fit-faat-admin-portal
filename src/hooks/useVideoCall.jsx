import { useState, useEffect, useCallback, useRef } from 'react'
import { io } from 'socket.io-client'
import { connect } from 'twilio-video'

const API_URL = 'http://localhost:5001/api'
const SOCKET_URL = 'http://localhost:5001'

export default function useVideoCall() {
  const [callState, setCallState] = useState('idle') // idle, calling, connecting, connected, ended
  const [incomingCall, setIncomingCall] = useState(null)
  const [localVideoRef, setLocalVideoRef] = useState(null)
  const [remoteVideoRef, setRemoteVideoRef] = useState(null)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [error, setError] = useState(null)
  const [participantCount, setParticipantCount] = useState(0)

  const roomRef = useRef(null)
  const localTracksRef = useRef([])
  const socketRef = useRef(null)

  useEffect(() => {
    const token = localStorage.getItem('patient_token')
    
    const socket = io(SOCKET_URL, {
      auth: { token }
    })

    socket.on('connect', () => {
      console.log('🔗 Video socket connected')
    })

    socket.on('video:incoming-call', (data) => {
      console.log('📞 Incoming video call:', data)
      setIncomingCall({
        roomName: data.roomName,
        from: data.callerId,
        callerName: data.callerName,
        timestamp: new Date().toISOString()
      })
      setCallState('incoming')
    })

    socket.on('video:call-accepted', (data) => {
      console.log('✅ Call accepted:', data)
      setCallState('connecting')
    })

    socket.on('video:call-ended', (data) => {
      console.log('📞 Call ended:', data)
      endCall()
    })

    socketRef.current = socket

    return () => {
      socket.disconnect()
    }
  }, [])

  const connectToRoom = useCallback(async (roomName) => {
    try {
      console.log('🔗 connectToRoom called for:', roomName)
      
      const token = localStorage.getItem('patient_token')
      const user = JSON.parse(localStorage.getItem('patient_user') || '{}')
      
      console.log('🔗 User data:', { 
        id: user.id, 
        username: user.username, 
        name: user.name 
      })
      console.log('🔗 Token present:', !!token)
      
      const requestBody = {
        roomName: roomName,
        userId: user.id,
        userName: user.username || user.name || 'Patient'
      }
      
      console.log('🔗 Request body:', requestBody)

      const response = await fetch(`${API_URL}/video/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      })

      console.log('🔗 Response status:', response.status)
      const data = await response.json()
      console.log('🔗 Token response:', data)
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to get token')
      }

      const room = await connect(data.token, {
        name: roomName,
        audio: true,
        video: { width: 640, height: 480 },
      })

      roomRef.current = room
      setCallState('connected')
      setError(null)

      const localParticipant = room.localParticipant
      
      localParticipant.videoTracks.forEach(publication => {
        if (publication.track && localVideoRef) {
          publication.track.attach(localVideoRef)
        }
      })

      room.participants.forEach(participant => {
        handleParticipantConnected(participant)
      })

      room.on('participantConnected', participant => {
        handleParticipantConnected(participant)
      })

      room.on('participantDisconnected', participant => {
        handleParticipantDisconnected(participant)
      })

      room.on('disconnected', room => {
        setCallState('ended')
      })

      setParticipantCount(room.participants.size + 1)

    } catch (err) {
      console.error('❌ Failed to connect to room:', err)
      setError(err.message)
      setCallState('error')
    }
  }, [localVideoRef])

  const handleParticipantConnected = (participant) => {
    participant.tracks.forEach(publication => {
      if (publication.isSubscribed) {
        handleTrackSubscribed(publication.track, participant)
      }
    })

    participant.on('trackSubscribed', track => {
      handleTrackSubscribed(track, participant)
    })

    participant.on('trackUnsubscribed', track => {
      handleTrackUnsubscribed(track)
    })

    setParticipantCount(prev => prev + 1)
  }

  const handleParticipantDisconnected = (participant) => {
    setParticipantCount(prev => prev - 1)
  }

  const handleTrackSubscribed = (track, participant) => {
    if (track.kind === 'video' && remoteVideoRef) {
      track.attach(remoteVideoRef)
    } else if (track.kind === 'audio') {
      track.attach()
    }
  }

  const handleTrackUnsubscribed = (track) => {
    track.detach()
  }

  const startCall = useCallback(async (callData) => {
    if (!socketRef.current) {
      console.error('❌ Socket not connected')
      return
    }

    setCallState('calling')
    setError(null)

    const roomName = `appointment_${callData.appointmentId}`
    
    const socketData = {
      roomName,
      callerId: callData.userId,
      receiverId: callData.receiverId,
      callerName: callData.userName
    }

    socketRef.current.emit('video:call-user', socketData)
    await connectToRoom(roomName)
  }, [connectToRoom])

  const acceptCall = useCallback(async () => {
    if (!incomingCall) return

    socketRef.current?.emit('video:accept-call', {
      roomName: incomingCall.roomName,
      receiverId: incomingCall.from
    })

    await connectToRoom(incomingCall.roomName)
    setIncomingCall(null)
  }, [incomingCall, connectToRoom])

  const declineCall = useCallback(() => {
    if (!incomingCall) return

    socketRef.current?.emit('video:decline-call', {
      roomName: incomingCall.roomName,
      receiverId: incomingCall.from
    })

    setIncomingCall(null)
    setCallState('idle')
  }, [incomingCall])

  const endCall = useCallback(() => {
    if (roomRef.current) {
      roomRef.current.disconnect()
      roomRef.current = null
    }

    localTracksRef.current.forEach(track => {
      track.stop()
    })
    localTracksRef.current = []

    if (callState === 'connected' && socketRef.current) {
      socketRef.current.emit('video:end-call', {})
    }

    setCallState('idle')
    setIncomingCall(null)
    setError(null)
    setParticipantCount(0)
  }, [callState])

  const toggleAudio = useCallback(() => {
    if (!roomRef.current) return

    const localParticipant = roomRef.current.localParticipant
    localParticipant.audioTracks.forEach(publication => {
      if (publication.track) {
        if (isAudioEnabled) {
          publication.track.disable()
        } else {
          publication.track.enable()
        }
      }
    })

    setIsAudioEnabled(prev => !prev)
  }, [isAudioEnabled])

  const toggleVideo = useCallback(() => {
    if (!roomRef.current) return

    const localParticipant = roomRef.current.localParticipant
    localParticipant.videoTracks.forEach(publication => {
      if (publication.track) {
        if (isVideoEnabled) {
          publication.track.disable()
        } else {
          publication.track.enable()
        }
      }
    })

    setIsVideoEnabled(prev => !prev)
  }, [isVideoEnabled])

  return {
    callState,
    incomingCall,
    isAudioEnabled,
    isVideoEnabled,
    error,
    participantCount,
    startCall,
    acceptCall,
    declineCall,
    endCall,
    toggleAudio,
    toggleVideo,
    setLocalVideoRef,
    setRemoteVideoRef
  }
}