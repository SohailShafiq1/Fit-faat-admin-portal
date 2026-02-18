import React from 'react';
import './VideoCallModal.css';

function VideoCallModal({
  isOpen,
  isConnecting,
  isConnected,
  incomingCall,
  localVideoRef,
  remoteVideoRef,
  onAccept,
  onReject,
  onEndCall,
  onToggleAudio,
  onToggleVideo,
  audioEnabled = true,
  videoEnabled = true
}) {
  if (!isOpen && !incomingCall) return null;

  // Incoming call UI
  if (incomingCall && !isConnected) {
    return (
      <div className="video-call-overlay">
        <div className="incoming-call-modal">
          <div className="incoming-call-header">
            <div className="caller-icon">📹</div>
            <h2>Incoming Video Call</h2>
            <p className="caller-name">{incomingCall.callerName}</p>
          </div>
          <div className="incoming-call-actions">
            <button 
              className="accept-call-btn" 
              onClick={() => {
                console.log('🟢 ========== ACCEPT BUTTON CLICKED ==========');
                console.log('🟢 Incoming call data:', incomingCall);
                console.log('🟢 Calling onAccept function...');
                onAccept();
                console.log('🟢 onAccept function called');
                console.log('🟢 ========================================');
              }}
            >
              <span className="btn-icon">📞</span>
              Accept
            </button>
            <button 
              className="reject-call-btn" 
              onClick={() => {
                console.log('❌ DECLINE BUTTON CLICKED');
                onReject();
              }}
            >
              <span className="btn-icon">✖️</span>
              Decline
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Connecting UI
  if (isConnecting) {
    return (
      <div className="video-call-overlay">
        <div className="connecting-modal">
          <div className="spinner-large"></div>
          <h3>Connecting...</h3>
          <p>Please wait while we connect you</p>
        </div>
      </div>
    );
  }

  // Active call UI
  if (isConnected) {
    return (
      <div className="video-call-overlay">
        <div className="video-call-container">
          {/* Remote video (main) */}
          <div className="remote-video-container">
            <div ref={remoteVideoRef} className="remote-video" />
            {!remoteVideoRef.current?.querySelector('video') && (
              <div className="no-video-placeholder">
                <div className="avatar-placeholder">👤</div>
                <p>Waiting for other participant...</p>
              </div>
            )}
          </div>

          {/* Local video (picture-in-picture) */}
          <div className="local-video-container">
            <div ref={localVideoRef} className="local-video" />
            {!videoEnabled && (
              <div className="video-off-overlay">
                <span>📷</span>
              </div>
            )}
          </div>

          {/* Call controls */}
          <div className="call-controls">
            <button
              className={`control-btn ${!audioEnabled ? 'disabled' : ''}`}
              onClick={onToggleAudio}
              title={audioEnabled ? 'Mute' : 'Unmute'}
            >
              {audioEnabled ? '🎤' : '🔇'}
            </button>

            <button
              className={`control-btn ${!videoEnabled ? 'disabled' : ''}`}
              onClick={onToggleVideo}
              title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {videoEnabled ? '📹' : '📷'}
            </button>

            <button
              className="control-btn end-call-btn"
              onClick={onEndCall}
              title="End call"
            >
              📞
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default VideoCallModal;
