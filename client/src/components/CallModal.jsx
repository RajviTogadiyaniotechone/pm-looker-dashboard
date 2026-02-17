// import { useState, useEffect, useRef } from 'react';
// import { Phone, PhoneOff, Video } from 'lucide-react';
// import { useSocket } from '../context/SocketContext';
// import { useAuth } from '../context/AuthContext';
// import MeetingRoom from './MeetingRoom';
// import './CallModal.css';

// const CallModal = () => {
//     const { user } = useAuth();
//     const socket = useSocket();

//     const [incomingCall, setIncomingCall] = useState(null); // { callerId, callerName, roomId }
//     const [activeCall, setActiveCall] = useState(null); // { roomId }

//     // Sound effect
//     const ringtone = useRef(new Audio('/sounds/ringtone.mp3')); // We need to add a sound or use a dummy url

//     useEffect(() => {
//         if (!socket) return;

//         socket.on('incoming_call', (data) => {
//             console.log('Incoming call:', data);
//             setIncomingCall(data);
//             // playRingtone();
//         });

//         return () => {
//             socket.off('incoming_call');
//         };
//     }, [socket]);

//     const handleAnswer = () => {
//         if (!incomingCall) return;

//         socket.emit('accept_call', { callerId: incomingCall.callerId });
//         setActiveCall({ roomId: incomingCall.roomId });
//         setIncomingCall(null);
//     };

//     const handleDecline = () => {
//         if (!incomingCall) return;

//         socket.emit('decline_call', {
//             callerId: incomingCall.callerId,
//             targetUserId: user.id
//         });
//         setIncomingCall(null);
//     };

//     const endCall = () => {
//         setActiveCall(null);
//         // window.location.reload(); // Quick reset ensures clean state
//     };

//     if (activeCall) {
//         return <MeetingRoom roomId={activeCall.roomId} userName={user.username} onEndCall={endCall} />;
//     }

//     if (!incomingCall) return null;

//     return (
//         <div className="call-modal-overlay">
//             <div className="call-modal glass-card">
//                 <div className="call-avatar">
//                     <Video size={48} />
//                 </div>
//                 <h3>Incoming Call</h3>
//                 <p><strong>{incomingCall.callerName}</strong> is inviting you to a meeting.</p>

//                 <div className="call-actions">
//                     <button onClick={handleDecline} className="btn-decline">
//                         <PhoneOff size={20} /> Decline
//                     </button>
//                     <button onClick={handleAnswer} className="btn-accept">
//                         <Phone size={20} /> Accept
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default CallModal;
