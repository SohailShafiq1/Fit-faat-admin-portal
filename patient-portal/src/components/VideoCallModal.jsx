import React, { useEffect, useRef } from 'react'
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Monitor } from 'lucide-react'
import useVideoCall from '../hooks/useVideoCall'

export default function VideoCallModal() {
  const {
    callState,
    incomingCall,
    isAudioEnabled,
    isVideoEnabled,
    error,
    participantCount,
    acceptCall,
    declineCall,
    endCall,
    toggleAudio,
    toggleVideo,
    setLocalVideoRef,
    setRemoteVideoRef
  } = useVideoCall()

  // Video element refs
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)

  // Set video refs when components mount
  useEffect(() => {
    if (localVideoRef.current) {
      setLocalVideoRef(localVideoRef.current)
    }
  }, [localVideoRef.current, setLocalVideoRef])

  useEffect(() => {
    if (remoteVideoRef.current) {
      setRemoteVideoRef(remoteVideoRef.current)
    }
  }, [remoteVideoRef.current, setRemoteVideoRef])

  // Don't render if no active call states
  if (callState === 'idle') {
    return null
  }

  // Incoming call modal
  if (callState === 'incoming' && incomingCall) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
        <div className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-md w-full mx-4">
          <div className="mb-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 call-pulse">
              <span className="text-blue-600 font-bold text-xl">Dr</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {incomingCall.callerName}
            </h3>
            <p className="text-gray-600 mb-4">Incoming video call...</p>
            <div className="text-sm text-gray-500">
              {new Date(incomingCall.timestamp).toLocaleTimeString()}
            </div>
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={declineCall}
              className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            <button
              onClick={acceptCall}
              className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors shadow-lg call-pulse"
            >
              <Phone className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Active call modal (calling, connecting, connected)
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl w-full max-w-4xl h-[80vh] mx-4 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 p-4 flex justify-between items-center">
          <div className="text-white">
            <h3 className="text-lg font-semibold">
              {callState === 'calling' ? 'Calling Doctor...' :
               callState === 'connecting' ? 'Connecting...' :
               callState === 'connected' ? `Connected (${participantCount} participants)` :
               'Video Call'}
            </h3>
            <p className="text-sm text-gray-300">
              {callState === 'connected' ? '🔴 Live' : '🟡 Connecting'}
            </p>
          </div>
          
          {error && (
            <div className="text-red-400 text-sm bg-red-900 px-3 py-1 rounded">
              {error}
            </div>
          )}
        </div>

        {/* Video Container */}
        <div className="flex-1 relative bg-black">
          {/* Remote Video (Main) */}
          <div className="w-full h-full flex items-center justify-center">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Placeholder when no remote video */}
            {callState === 'connected' && participantCount < 2 && (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold">Dr</span>
                  </div>
                  <p className="text-gray-300">Waiting for doctor to join...</p>
                </div>
              </div>
            )}
            
            {/* Connecting state */}
            {(callState === 'calling' || callState === 'connecting') && (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 call-pulse">
                    <Video className="w-8 h-8" />
                  </div>
                  <p className="text-lg font-semibold mb-2">
                    {callState === 'calling' ? 'Calling...' : 'Connecting...'}
                  </p>
                  <p className="text-gray-300">Please wait</p>
                </div>
              </div>
            )}
          </div>

          {/* Local Video (Picture-in-Picture) */}
          <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border border-gray-600">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Local video placeholder */}
            {!isVideoEnabled && (
              <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                <VideoOff className="w-6 h-6 text-gray-400" />
              </div>
            )}
            
            {/* You label */}
            <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
              You
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 p-6 flex justify-center space-x-4">
          {/* Audio Toggle */}
          <button
            onClick={toggleAudio}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isAudioEnabled 
                ? 'bg-gray-600 text-white hover:bg-gray-500' 
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* Video Toggle */}
          <button
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isVideoEnabled 
                ? 'bg-gray-600 text-white hover:bg-gray-500' 
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* End Call */}
          <button
            onClick={endCall}
            className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}