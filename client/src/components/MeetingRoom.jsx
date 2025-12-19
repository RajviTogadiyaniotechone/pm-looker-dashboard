import { useState, useEffect, useRef } from 'react';
import { PhoneOff } from 'lucide-react';

const MeetingRoom = ({ roomId, userName, onEndCall }) => {
    const jitsiContainerRef = useRef(null);
    const [jitsiApi, setJitsiApi] = useState(null);

    useEffect(() => {
        // Load Jitsi script
        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = () => initJitsi();
        document.body.appendChild(script);

        return () => {
            // Cleanup script
            document.body.removeChild(script);
            if (jitsiApi) jitsiApi.dispose();
        };
    }, []);

    const initJitsi = () => {
        const domain = 'meet.jit.si';
        const options = {
            roomName: `NioDashboard-${roomId}`,
            width: '100%',
            height: '100%',
            parentNode: jitsiContainerRef.current,
            userInfo: {
                displayName: userName
            },
            configOverwrite: {
                startWithAudioMuted: false,
                disableDeepLinking: true,
            },
            interfaceConfigOverwrite: {
                SHOW_JITSI_WATERMARK: false,
                SHOW_WATERMARK_FOR_GUESTS: false,
                TOOLBAR_BUTTONS: [
                    'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                    'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                    'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                    'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
                    'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
                    'security'
                ],
            },
        };

        // eslint-disable-next-line
        const api = new window.JitsiMeetExternalAPI(domain, options);

        api.addEventListeners({
            videoConferenceLeft: () => {
                onEndCall();
            },
        });

        setJitsiApi(api);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 9999,
            background: 'black'
        }}>
            <div ref={jitsiContainerRef} style={{ width: '100%', height: '100%' }} />

            {/* Fallback hangup button if Jitsi UI fails or for custom control */}
            <button
                onClick={onEndCall}
                style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    zIndex: 10000,
                    padding: '10px 20px',
                    background: '#e53e3e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                }}
            >
                <PhoneOff size={20} />
                Leave Meeting
            </button>
        </div>
    );
};

export default MeetingRoom;
