import React, { useEffect } from 'react';

interface HoldSpinAnnouncementModalProps {
  respinsAwarded: number;
  onClose: () => void;
  announcementImage?: string;
}

const HoldSpinAnnouncementModal: React.FC<HoldSpinAnnouncementModalProps> = ({
  respinsAwarded,
  onClose,
  announcementImage
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
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 9999,
        animation: 'fadeIn 0.3s ease-in',
        pointerEvents: 'auto'
      }}
    >
      {announcementImage ? (
        <div
          style={{
            position: 'relative',
            maxWidth: '600px',
            width: '80%',
            animation: 'scaleIn 0.5s ease-out'
          }}
        >
          <img
            src={announcementImage}
            alt="Hold & Spin Announcement"
            style={{
              width: '100%',
              height: 'auto',
              borderRadius: '20px',
              boxShadow: '0 10px 40px rgba(255, 215, 0, 0.5)'
            }}
          />
        </div>
      ) : (
        <div
          style={{
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
            padding: '30px 50px',
            borderRadius: '20px',
            textAlign: 'center',
            boxShadow: '0 10px 40px rgba(255, 215, 0, 0.5)',
            animation: 'scaleIn 0.5s ease-out',
            border: '4px solid #FFF'
          }}
        >
          <div
            style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#000',
              marginBottom: '15px',
              textShadow: '2px 2px 4px rgba(255, 255, 255, 0.5)'
            }}
          >
            🎯 HOLD & SPIN 🎯
          </div>
          <div
            style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#FFF',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
            }}
          >
            {respinsAwarded} RESPINS AWARDED!
          </div>
        </div>
      )}

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

export default HoldSpinAnnouncementModal;
