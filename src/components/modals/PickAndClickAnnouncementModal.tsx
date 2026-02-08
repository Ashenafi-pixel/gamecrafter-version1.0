import React, { useEffect } from 'react';

interface PickAndClickAnnouncementModalProps {
  onClose: () => void;
}

const PickAndClickAnnouncementModal: React.FC<PickAndClickAnnouncementModalProps> = ({
  onClose
}) => {
  useEffect(() => {
    // Auto-close after 3 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 9999,
        animation: 'fadeIn 0.3s ease-in'
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
          padding: '40px 60px',
          borderRadius: '20px',
          textAlign: 'center',
          boxShadow: '0 10px 40px rgba(255, 215, 0, 0.5)',
          animation: 'scaleIn 0.5s ease-out',
          border: '4px solid #FFF'
        }}
      >
        <div
          style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#000',
            marginBottom: '20px',
            textShadow: '2px 2px 4px rgba(255, 255, 255, 0.5)'
          }}
        >
          🎯 PICK & CLICK 🎯
        </div>
        <div
          style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#FFF',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
          }}
        >
          BONUS ROUND ACTIVATED!
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default PickAndClickAnnouncementModal;
