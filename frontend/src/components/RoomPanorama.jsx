import React, { useEffect, useRef, useState } from 'react';
import { X, Rotate3d, Maximize2, AlertCircle } from 'lucide-react';

const RoomPanorama = ({ roomName, onClose }) => {
  const viewerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Advanced mapping with both user-original and AI-curated images
    const getRoomConfig = (name) => {
      const lowerName = name.toLowerCase();
      
      // USER ORIGINALS - Set as partial panoramas to avoid distortion if they are simple strips
      if (lowerName.includes('nalanda')) return { path: '/nalanda_orig.jpg', isOrig: true };
      if (lowerName.includes('mantra')) return { path: '/mantra_orig.jpg', isOrig: true };
      if (lowerName.includes('hoysala')) return { path: '/hoysala_orig.jpg', isOrig: true };
      if (lowerName.includes('vijayanagara')) return { path: '/vijayanagara_orig.jpg', isOrig: true };
      if (lowerName.includes('kadamba')) return { path: '/kadamba_orig.jpg', isOrig: true };
      if (lowerName.includes('kaveri')) return { path: '/kaveri_orig.png', isOrig: true };
      if (lowerName.includes('ganga')) return { path: '/ganga_orig.png', isOrig: true };
      if (lowerName.includes('maurya') || lowerName.includes('mourya')) return { path: '/mourya_orig.jpg', isOrig: true };
      
      // AI ARTIFICIAL INTELLIGENCE - Unique for each room
      if (lowerName.includes('wellness')) return { path: '/wellness_room_ai.png', isOrig: false, isAI: true, type: 'Wellness Room' };
      if (lowerName.includes('boardroom')) return { path: '/boardroom_ai.png', isOrig: false };
      if (lowerName.includes('huddle')) return { path: '/ganga.png', isOrig: false };
      if (lowerName.includes('focus')) return { path: '/kaveri.png', isOrig: false };
      if (lowerName.includes('moksha')) return { path: '/moksha_ai.png', isOrig: false };
      if (lowerName.includes('maitri')) return { path: '/maitri_ai.png', isOrig: false };
      if (lowerName.includes('sahyadri')) return { path: '/general.png', isOrig: false };
      if (lowerName.includes('indus')) return { path: '/maitri_ai.png', isOrig: false };
      if (lowerName.includes('wadeyars')) return { path: '/boardroom_ai.png', isOrig: false };

      // SHARED RESOURCES
      // SHARED RESOURCES - Using local assets with interactive hotspots to denote resource type
      if (lowerName.includes('shuttle')) return { 
        path: '/maitri_ai.png', 
        isOrig: false, 
        isAI: false, 
        type: 'Shuttle',
        hotSpots: [
          { pitch: -10, yaw: 0, type: 'info', text: 'Shuttle Seating Area' },
          { pitch: -20, yaw: 45, type: 'info', text: 'Luxury Seat 1A' }
        ]
      };
      if (lowerName.includes('parking')) return { 
        path: '/boardroom_ai.png',
        isOrig: false, 
        isAI: false, 
        type: 'Parking',
        hotSpots: [
          { pitch: -30, yaw: 0, type: 'info', text: 'Parking Slot P1' },
          { pitch: -30, yaw: 90, type: 'info', text: 'Parking Slot P2' }
        ]
      }; 
      
      return { path: '/general.png', isOrig: false };
    };

    const config = getRoomConfig(roomName);
    
    const timer = setTimeout(() => {
      if (window.pannellum) {
        try {
          const viewerConfig = {
            type: 'equirectangular',
            panorama: config.path,
            autoLoad: true,
            autoRotate: config.isOrig ? 0 : -2,
            compass: true,
            mouseZoom: true,
            showControls: true,
            crossOrigin: 'anonymous',
            title: config.isAI ? `AI Generated ${config.type} View` : roomName,
            author: config.isAI ? "AI Generated Visual" : (config.isOrig ? "User Gallery" : "AI PRO View")
          };

          // Optimize for user "strips" (non-full-360)
          if (config.isOrig) {
            viewerConfig.hfov = 100;
            viewerConfig.haov = 360; // Assume they scanned a circle, but if narrow, it might need adjustment
            viewerConfig.vaov = 60;  // Standard for phone panoramas to avoid vertical stretching
          } else {
            viewerConfig.hfov = 110;
            viewerConfig.pitch = -15;
          }

          const viewer = window.pannellum.viewer('panorama-container', viewerConfig);

          viewer.on('load', () => setLoading(false));
          viewer.on('error', (err) => {
            setError(`Failed to load 360° image for ${roomName}`);
            setLoading(false);
          });

          viewerRef.current = viewer;
        } catch (err) {
          setError('Viewer failed to initialize');
          setLoading(false);
        }
      } else {
        setError('Pannellum library not found.');
        setLoading(false);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      if (viewerRef.current) viewerRef.current.destroy();
    };
  }, [roomName]);

  const isPro = roomName.toLowerCase().includes('maurya') || roomName.toLowerCase().includes('mourya');

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.9)',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      color: 'white',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Rotate3d size={24} color="var(--primary)" />
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {roomName}
              {isPro && (
                <span style={{ 
                  fontSize: '0.6rem', 
                  background: 'linear-gradient(45deg, #FFD700, #FFA500)', 
                  color: 'black', 
                  padding: '2px 6px', 
                  borderRadius: '4px',
                  fontWeight: 900
                }}>PRO VIEW</span>
              )}
            </h2>
            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.7 }}>Discovery 360° Experience</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: 'white',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
          onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
        >
          <X size={24} />
        </button>
      </div>

      {/* Viewer Container */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div id="panorama-container" style={{ 
          width: '100%', 
          height: '100%',
          filter: roomName.toUpperCase().includes('PARKING') 
            ? 'grayscale(0.3) contrast(1.2) brightness(0.7)' 
            : roomName.toUpperCase().includes('SHUTTLE')
              ? 'brightness(1.1) contrast(1.05)'
              : 'none'
        }}></div>
        
        {loading && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.7)',
            gap: '1rem',
            zIndex: 2
          }}>
            <div className="spinner"></div>
            <p style={{ fontSize: '1rem', fontWeight: 600 }}>Optimizing 360° Visuals...</p>
          </div>
        )}

        {/* Real 360 Visuals for Parking/Shuttle */}
        {error && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.8)',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0' }}>Oops!</h3>
            <p style={{ opacity: 0.8, maxWidth: '300px' }}>{error}</p>
            <button 
              onClick={onClose}
              className="btn-primary" 
              style={{ marginTop: '1.5rem', padding: '0.5rem 2rem' }}
            >
              Go Back
            </button>
          </div>
        )}

        {/* Footer Overlay */}
        {!error && !loading && (
          <div style={{
            position: 'absolute',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.6)',
            padding: '0.75rem 1.5rem',
            borderRadius: '2rem',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            fontSize: '0.8rem',
            pointerEvents: 'none'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Maximize2 size={14} /> Scroll to Zoom
            </span>
            <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.2)' }}></div>
            <span>Drag to Look Around</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomPanorama;
