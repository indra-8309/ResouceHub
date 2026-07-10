import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { 
  ArrowLeft, 
  Clock, 
  Calendar, 
  User, 
  Briefcase, 
  CheckCircle2, 
  XCircle, 
  Info, 
  RefreshCcw,
  ShieldCheck,
  Ban
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const BookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        const [bookingRes, auditRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/bookings/${id}`, config),
          axios.get(`${API_BASE_URL}/bookings/${id}/audit`, config)
        ]);

        setBooking(bookingRes.data);
        setAuditLogs(auditRes.data);
      } catch (error) {
        console.error('Error fetching booking details:', error);
        toast.error('Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const getStatusBadge = (status) => {
    const s = status.toLowerCase();
    if (s === 'approved') return <span className="badge badge-approved" style={{display:'inline-flex', alignItems:'center', gap:'6px', padding: '0.5rem 1rem', fontSize: '0.8rem'}}><CheckCircle2 size={16} /> Approved</span>;
    if (s === 'pending') return <span className="badge badge-pending" style={{display:'inline-flex', alignItems:'center', gap:'6px', padding: '0.5rem 1rem', fontSize: '0.8rem'}}><Clock size={16} /> Pending</span>;
    if (s === 'rejected' || s === 'cancelled') return <span className="badge badge-rejected" style={{display:'inline-flex', alignItems:'center', gap:'6px', padding: '0.5rem 1rem', fontSize: '0.8rem'}}><Ban size={16} /> {status}</span>;
    if (s === 'completed') return <span className="badge" style={{background:'var(--accent-light)', color:'var(--accent)', display:'inline-flex', alignItems:'center', gap:'6px', padding: '0.5rem 1rem', fontSize: '0.8rem'}}><CheckCircle2 size={16} /> Completed</span>;
    return <span className="badge" style={{display:'inline-flex', alignItems:'center', gap:'6px', padding: '0.5rem 1rem', fontSize: '0.8rem'}}><Info size={16} /> {status}</span>;
  };

  const getActionStyles = (action) => {
    const act = action.toUpperCase();
    if (act.includes('APPROVED')) return { bg: '#dcfce7', text: '#166534', icon: <CheckCircle2 size={16} /> };
    if (act.includes('REJECTED')) return { bg: '#fee2e2', text: '#991b1b', icon: <XCircle size={16} /> };
    if (act.includes('CANCELLED')) return { bg: '#f1f5f9', text: '#475569', icon: <Ban size={16} /> };
    if (act.includes('CREATED')) return { bg: '#e0f2fe', text: '#0369a1', icon: <Calendar size={16} /> };
    if (act.includes('MAINTENANCE')) return { bg: '#f3e8ff', text: '#6b21a8', icon: <ShieldCheck size={16} /> };
    return { bg: '#f1f5f9', text: '#475569', icon: <RefreshCcw size={16} /> };
  };

  if (loading) {
    return (
      <div style={{ padding: '5rem', textAlign: 'center' }}>
        <div className="animate-pulse" style={{ color: 'var(--primary)', fontWeight: '600' }}>Loading details...</div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div style={{ padding: '5rem', textAlign: 'center' }}>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>Booking not found</p>
        <button onClick={() => navigate('/all-bookings')} className="btn-outline" style={{ marginTop: '1rem' }}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="animate-in" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <button 
          onClick={() => navigate(-1)}
          className="btn-outline"
          style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none', background: 'transparent' }}
        >
          <ArrowLeft size={18} />
          Go Back
        </button>
        <div>
          {getStatusBadge(booking.status)}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '2rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
          
          {/* Left Column: Booking Info */}
          <div style={{ flex: '1 1 350px' }}>
            <div className="card">
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Briefcase color="var(--primary)" />
                Booking Information
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Resource */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem', background: 'var(--background)', borderRadius: '0.75rem' }}>
                  <div style={{ padding: '0.75rem', background: '#e0f2fe', color: '#0284c7', borderRadius: '0.5rem' }}>
                    <Calendar size={24} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Resource</p>
                    <p style={{ fontWeight: '700', fontSize: '1rem' }}>{booking.room?.name || 'N/A'}</p>
                  </div>
                </div>

                {/* Schedule */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem', background: 'var(--background)', borderRadius: '0.75rem' }}>
                  <div style={{ padding: '0.75rem', background: '#f3e8ff', color: '#9333ea', borderRadius: '0.5rem' }}>
                    <Clock size={24} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Schedule</p>
                    <p style={{ fontWeight: '700', fontSize: '1rem' }}>
                      {new Date(booking.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                      {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* User */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem', background: 'var(--background)', borderRadius: '0.75rem' }}>
                  <div style={{ padding: '0.75rem', background: '#dcfce7', color: '#16a34a', borderRadius: '0.5rem' }}>
                    <User size={24} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Requested By</p>
                    <p style={{ fontWeight: '700', fontSize: '1rem' }}>{booking.user?.full_name}</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{booking.user?.email}</p>
                  </div>
                </div>

                {/* Purpose */}
                <div style={{ padding: '1.25rem', background: 'var(--background)', borderRadius: '0.75rem', borderLeft: '4px solid var(--primary)' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Purpose</p>
                  <p style={{ fontSize: '1rem', fontStyle: 'italic', margin: 0 }}>"{booking.purpose}"</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Audit Trail */}
          <div style={{ flex: '1 1 450px' }}>
            <div className="card" style={{ minHeight: '100%' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <RefreshCcw color="var(--primary)" />
                Audit Trail & History
              </h2>

              <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
                {/* Vertical Line */}
                <div style={{ position: 'absolute', left: '0.5rem', top: '0', bottom: '0', width: '2px', background: 'var(--border)' }}></div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {auditLogs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
                      No history available for this booking.
                    </div>
                  ) : (
                    auditLogs.map((log) => {
                      const styles = getActionStyles(log.action);
                      return (
                        <div key={log.id} style={{ position: 'relative' }}>
                          {/* Dot Icon */}
                          <div style={{ 
                            position: 'absolute', 
                            left: '-2.1rem', 
                            top: '0', 
                            width: '32px', 
                            height: '32px', 
                            borderRadius: '50%', 
                            background: styles.bg, 
                            color: styles.text,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '4px solid var(--surface)',
                            boxShadow: 'var(--shadow-sm)'
                          }}>
                            {styles.icon}
                          </div>

                          <div style={{ background: 'var(--background)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                              <span style={{ 
                                background: styles.bg, 
                                color: styles.text, 
                                padding: '0.25rem 0.75rem', 
                                borderRadius: '0.5rem', 
                                fontSize: '0.7rem', 
                                fontWeight: '800', 
                                textTransform: 'uppercase' 
                              }}>
                                {log.action}
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                                <Clock size={12} />
                                {new Date(log.timestamp).toLocaleString()}
                              </span>
                            </div>

                            <p style={{ margin: '0 0 0.5rem 0', fontWeight: '500', fontSize: '0.95rem' }}>
                              Action performed by <strong style={{ color: 'var(--primary)' }}>{log.user ? log.user.full_name : 'System'}</strong>
                            </p>
                            
                            {log.note && (
                              <div style={{ background: 'var(--surface)', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '0.75rem' }}>
                                {log.note}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;
