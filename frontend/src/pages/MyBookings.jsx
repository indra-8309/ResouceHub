import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import {
  Calendar,
  Clock,
  MapPin,
  MoreVertical,
  XCircle,
  CheckCircle2,
  Timer,
  Search,
  Eye,
  Trash2,
  ChevronRight
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import RoomSelector from '../components/RoomSelector';

const MyBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');
  const [selectedRoomFilter, setSelectedRoomFilter] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [confirmCancel, setConfirmCancel] = useState({ open: false, id: null });

  useEffect(() => {
    fetchBookings(selectedRoomFilter?.id);
    fetchRooms();
  }, [selectedRoomFilter]);

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRooms(response.data);
    } catch (error) {
      console.error('Failed to fetch rooms');
    }
  };

  const fetchBookings = async (roomId = null) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/bookings/my`, {
        params: { roomId: roomId || undefined },
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data);
    } catch (error) {
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id, isBatch = false) => {
    try {
      const token = localStorage.getItem('token');
      const url = isBatch 
        ? `${API_BASE_URL}/bookings/batch/${id}/status`
        : `${API_BASE_URL}/bookings/${id}/status`;
        
      await axios.post(url, {
        status: 'cancelled',
        manager_comment: 'Cancelled by user'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Booking cancelled successfully');
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || error.response?.data?.detail || 'Failed to cancel booking');
    }
  };

  const filteredBookings = bookings.filter(b => {
    const now = new Date();
    const endTime = new Date(b.end_time);
    if (filter === 'all') return true;
    if (filter === 'upcoming') {
      return endTime > now && (b.status?.toLowerCase() === 'approved' || b.status?.toLowerCase() === 'pending');
    }
    if (filter === 'past') {
      return endTime < now;
    }
    return b.status?.toLowerCase() === filter.toLowerCase();
  }).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase();
    switch (s) {
      case 'pending': return <span className="badge badge-pending" style={{ background: '#fff7ed', color: '#ea580c', border: '1px solid #ffedd5' }}>Pending</span>;
      case 'approved': return <span className="badge badge-approved" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #dcfce7' }}>Approved</span>;
      case 'rejected': return <span className="badge badge-rejected" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fee2e2' }}>Rejected</span>;
      case 'cancelled': return <span className="badge badge-cancelled" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fee2e2' }}>Cancelled</span>;
      case 'completed': return <span className="badge badge-completed" style={{ background: '#f0f9ff', color: '#0284c7', border: '1px solid #e0f2fe' }}>Past</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '700' }}>My Bookings</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Track and manage your room reservations.</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {(user?.role === 'admin' || user?.role === 'manager'
            ? ['upcoming', 'all', 'past', 'approved', 'cancelled']
            : ['upcoming', 'all', 'past', 'pending', 'approved', 'rejected', 'cancelled']
          ).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={filter === f ? 'btn-primary' : 'btn-outline'}
              style={{ padding: '0.5rem 1.25rem', textTransform: 'capitalize' }}
            >
              {f}
            </button>
          ))}
        </div>
        <div style={{ width: '250px' }}>
          <RoomSelector
            onSelect={(room) => setSelectedRoomFilter(room)}
            selectedRoomId={selectedRoomFilter?.id}
            placeholder="Filter by room..."
          />
        </div>
        {selectedRoomFilter && (
          <button
            className="btn-outline"
            onClick={() => setSelectedRoomFilter(null)}
            style={{ padding: '0.5rem', border: 'none', color: 'var(--danger)', fontSize: '0.8rem' }}
          >
            Clear Room Filter
          </button>
        )}
      </div>

      {loading ? (
        <div>Loading your bookings...</div>
      ) : filteredBookings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
          <div style={{ background: '#f1f5f9', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Calendar size={32} color="var(--text-secondary)" />
          </div>
          <h3>No bookings found</h3>
          <p style={{ color: 'var(--text-secondary)' }}>You haven't made any bookings in this category yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {(() => {
            const groups = {};
            const processed = [];
            filteredBookings.forEach(b => {
              if (b.request_id) {
                if (!groups[b.request_id]) {
                  groups[b.request_id] = { ...b, isBatch: true, all: [b] };
                  processed.push(groups[b.request_id]);
                } else {
                  groups[b.request_id].all.push(b);
                }
              } else {
                processed.push(b);
              }
            });

            // For batches, calculate date range
            processed.forEach(p => {
              if (p.isBatch) {
                const starts = p.all.map(b => new Date(b.start_time).getTime());
                const ends = p.all.map(b => new Date(b.end_time).getTime());
                p.minStart = new Date(Math.min(...starts));
                p.maxEnd = new Date(Math.max(...ends));
              }
            });

            return processed.map((booking) => {
              return (
              <div key={booking.isBatch ? booking.request_id : booking.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    background: 'rgba(37, 99, 235, 0.05)',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(37, 99, 235, 0.1)'
                  }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--primary)' }}>
                      {new Date(booking.isBatch ? booking.minStart : booking.start_time).toLocaleString('default', { month: 'short' })}
                    </span>
                    <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary)', lineHeight: 1 }}>
                      {new Date(booking.isBatch ? booking.minStart : booking.start_time).getDate()}
                    </span>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.25rem' }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>{booking.room?.name || 'Unknown Room'}</h3>
                      {getStatusBadge(booking.status)}
                      {booking.isBatch && (
                        <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', fontWeight: '800' }}>BATCH</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={14} />
                        {booking.isBatch ? (
                          `${booking.minStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${booking.maxEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
                        ) : (
                          new Date(booking.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                        )}
                        {' • '}
                        {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                        {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {booking.isBatch && ` (${booking.all.length} days)`}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MapPin size={14} /> floor {booking.room?.floor || '1'}
                      </span>
                    </div>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                    <span style={{ fontWeight: '600' }}>Purpose:</span> {booking.purpose}
                  </p>
                  {booking.status === 'pending' && booking.routed_to && (
                    <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Timer size={14} />
                      <span>
                        Routed to <strong>{booking.routed_to.full_name}</strong>
                        {booking.routed_to.role === 'admin' ? ' (Admin Fallback)' : ' (Manager)'}
                      </span>
                    </p>
                  )}
                  {booking.manager_comment && (
                    <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', fontStyle: 'italic', color: booking.status === 'rejected' ? 'var(--danger)' : 'var(--text-secondary)' }}>
                      <span style={{ fontWeight: '600' }}>{booking.status === 'rejected' ? 'Rejection Reason' : 'Note'}:</span> {booking.manager_comment}
                    </p>
                  )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ textAlign: 'right', marginRight: '1rem' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Requested on</p>
                  <p style={{ fontSize: '0.875rem', fontWeight: '500' }}>{new Date(booking.requested_at).toLocaleDateString()}</p>
                </div>
                {booking.status === 'completed' ? (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Link
                      to={`/booking/${booking.id}`}
                      className="btn-outline"
                      style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
                    >
                      <Eye size={16} /> Details
                    </Link>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      color: 'var(--accent)',
                      fontWeight: '700',
                      fontSize: '0.875rem',
                      padding: '0.5rem 1rem',
                      background: 'var(--primary-light)',
                      borderRadius: '0.75rem'
                    }}>
                      <CheckCircle2 size={16} /> Past
                    </div>
                  </div>
                ) : (booking.status?.toLowerCase() === 'pending' || booking.status?.toLowerCase() === 'approved' || booking.status?.toLowerCase() === 'cancelled') && new Date(booking.isBatch ? booking.maxEnd : booking.end_time) > new Date() ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link
                      to={`/booking/${booking.id}`}
                      className="btn-outline"
                      style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
                    >
                      <Eye size={16} /> Details
                    </Link>
                    {(booking.status?.toLowerCase() === 'pending' || booking.status?.toLowerCase() === 'approved') ?
                      <div>
                        <button
                          onClick={() => setConfirmCancel({ open: true, id: booking.isBatch ? booking.request_id : booking.id, isBatch: booking.isBatch })}
                          className="btn-outline"
                          style={{ color: 'var(--danger)', borderColor: '#fee2e2', padding: '0.5rem 1rem' }}
                        >
                          Cancel
                        </button>
                      </div> : null
                    }
                  </div>

                ) : null}
                {(booking.status === 'rejected' || booking.status === 'cancelled' || ((booking.status === 'pending' || booking.status === 'approved') && new Date(booking.isBatch ? booking.minStart : booking.start_time) <= new Date())) && (
                  <Link
                    to={`/booking/${booking.id}`}
                    className="btn-outline"
                    style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
                  >
                    <Eye size={16} /> Details
                  </Link>
                )}
              </div>
            </div>
              );
            });
          })()}
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmCancel.open}
        onClose={() => setConfirmCancel({ open: false, id: null, isBatch: false })}
        onConfirm={() => handleCancel(confirmCancel.id, confirmCancel.isBatch)}
        title={confirmCancel.isBatch ? "Cancel Entire Batch?" : "Cancel Booking?"}
        message={confirmCancel.isBatch 
          ? "Are you sure you want to cancel all slots in this batch? This action will free up the resource for all selected dates."
          : "Are you sure you want to cancel this booking? This action will free up the resource for others."}
        confirmText="Cancel"
      />
    </div>
  );
};

export default MyBookings;
