import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', type = 'danger' }) => {
  if (!isOpen) return null;

  const getTheme = () => {
    switch (type) {
      case 'danger': return { color: 'var(--danger)', bg: '#fef2f2' };
      case 'warning': return { color: 'var(--warning)', bg: '#fffbeb' };
      default: return { color: 'var(--primary)', bg: 'var(--primary-light)' };
    }
  };

  const theme = getTheme();

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1.5rem' }}>
      <div className="card animate-in" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', background: theme.bg, borderRadius: '0.5rem', color: theme.color }}>
              <AlertTriangle size={20} />
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '800' }}>{title}</h3>
          </div>
          <button onClick={onClose} className="btn-outline" style={{ width: '32px', height: '32px', padding: 0 }}>
            <X size={16} />
          </button>
        </div>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
          {message}
        </p>
        
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onClose} className="btn-outline" style={{ flex: 1 }}>Cancel</button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }} 
            className="btn-primary" 
            style={{ flex: 1, background: type === 'danger' ? 'var(--danger)' : undefined }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
