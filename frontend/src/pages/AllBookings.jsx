import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import {
  Building2,
  Calendar,
  Clock,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Activity,
  History
} from 'lucide-react';
import RoomSelector from '../components/RoomSelector';
import { toast } from 'react-hot-toast';

const AllBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoomFilter, setSelectedRoomFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'requested_at', direction: 'desc' });

  const token = localStorage.getItem('token');

  const fetchAllBookings = async (roomId = null) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/bookings/all`, {
        params: { roomId: roomId || undefined },
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data);
    } catch (error) {
      toast.error('Failed to fetch booking history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllBookings(selectedRoomFilter?.id);
  }, [selectedRoomFilter]);

  const stats = useMemo(() => {
    return {
      total: bookings.length,
      approved: bookings.filter(b => b.status?.toLowerCase() === 'approved').length,
      pending: bookings.filter(b => b.status?.toLowerCase() === 'pending').length,
      rejected: bookings.filter(b => b.status?.toLowerCase() === 'rejected' || b.status?.toLowerCase() === 'cancelled').length
    };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesStatus = statusFilter === 'all' || b.status?.toLowerCase() === statusFilter.toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        (b.user?.full_name?.toLowerCase().includes(searchLower) || false) ||
        (b.user?.email?.toLowerCase().includes(searchLower) || false) ||
        (b.purpose?.toLowerCase().includes(searchLower) || false) ||
        (b.room?.name?.toLowerCase().includes(searchLower) || false);

      return matchesStatus && matchesSearch;
    });
  }, [bookings, statusFilter, searchTerm]);

  const sortedBookings = useMemo(() => {
    let sortableItems = [...filteredBookings];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue, bValue;

        if (sortConfig.key === 'user') {
          aValue = a.user?.full_name?.toLowerCase() || '';
          bValue = b.user?.full_name?.toLowerCase() || '';
        } else if (sortConfig.key === 'room') {
          aValue = a.room?.name?.toLowerCase() || '';
          bValue = b.room?.name?.toLowerCase() || '';
        } else if (sortConfig.key === 'start_time') {
          aValue = new Date(a.start_time).getTime();
          bValue = new Date(b.start_time).getTime();
        } else if (sortConfig.key === 'requested_at') {
          aValue = new Date(a.requested_at).getTime();
          bValue = new Date(b.requested_at).getTime();
        } else {
          aValue = a[sortConfig.key] || '';
          bValue = b[sortConfig.key] || '';
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredBookings, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase();
    const style = { display: 'inline-flex', alignItems: 'center', gap: '4px' };
    if (s === 'approved') return <span className="badge badge-approved" style={{ ...style, background: '#f0fdf4', color: '#16a34a', border: '1px solid #dcfce7' }}><CheckCircle2 size={12} /> Approved</span>;
    if (s === 'pending') return <span className="badge badge-pending" style={{ ...style, background: '#fff7ed', color: '#ea580c', border: '1px solid #ffedd5' }}><AlertCircle size={12} /> Pending</span>;
    if (s === 'rejected') return <span className="badge badge-rejected" style={{ ...style, background: '#fef2f2', color: '#dc2626', border: '1px solid #fee2e2' }}><XCircle size={12} /> Rejected</span>;
    if (s === 'cancelled') return <span className="badge badge-cancelled" style={{ ...style, background: '#fef2f2', color: '#dc2626', border: '1px solid #fee2e2' }}><XCircle size={12} /> Cancelled</span>;
    if (s === 'completed') return <span className="badge badge-completed" style={{ ...style, background: '#f0f9ff', color: '#0284c7', border: '1px solid #e0f2fe' }}><CheckCircle2 size={12} /> Past</span>;
    return <span className="badge" style={style}>{status}</span>;
  };

  return (
    <div className="animate-in" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header Section */}
      <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'var(--primary-light)', padding: '0.75rem', borderRadius: '1rem', color: 'var(--primary)' }}>
            <Activity size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: 0, lineHeight: 1.2 }}>Booking Audit Trail</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', margin: 0, marginTop: '0.25rem' }}>Comprehensive view of all resource allocations and facility usage</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card hover-shadow" style={{ padding: '1.25rem', borderLeft: '4px solid var(--primary)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Bookings</p>
          <p style={{ fontSize: '2rem', fontWeight: '800', lineHeight: 1 }}>{stats.total}</p>
        </div>
        <div className="card hover-shadow" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Approved</p>
          <p style={{ fontSize: '2rem', fontWeight: '800', lineHeight: 1 }}>{stats.approved}</p>
        </div>
        <div className="card hover-shadow" style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Pending</p>
          <p style={{ fontSize: '2rem', fontWeight: '800', lineHeight: 1 }}>{stats.pending}</p>
        </div>
        <div className="card hover-shadow" style={{ padding: '1.25rem', borderLeft: '4px solid #ef4444', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Rejected / Cancelled</p>
          <p style={{ fontSize: '2rem', fontWeight: '800', lineHeight: 1 }}>{stats.rejected}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '1rem', flex: '1 1 300px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search user, purpose, or room..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.5rem', width: '100%' }}
            />
          </div>
          <div style={{ width: '250px' }}>
            <RoomSelector
              onSelect={(room) => setSelectedRoomFilter(room)}
              selectedRoomId={selectedRoomFilter?.id}
              placeholder="Filter by Room..."
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
          {['all', 'pending', 'approved', 'rejected', 'cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={statusFilter === status ? 'btn-primary' : 'btn-outline'}
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', textTransform: 'capitalize', whiteSpace: 'nowrap' }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table / List Area */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div className="animate-pulse" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <History className="animate-spin" /> Fetching records...
            </div>
          </div>
        ) : sortedBookings.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <History size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Bookings Found</h3>
            <p>Try adjusting your search or filters to find what you're looking for.</p>
          </div>
        ) : (
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                  <th onClick={() => requestSort('user')} style={{ cursor: 'pointer', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User {sortConfig.key === 'user' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                  <th onClick={() => requestSort('room')} style={{ cursor: 'pointer', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resource {sortConfig.key === 'room' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                  <th onClick={() => requestSort('start_time')} style={{ cursor: 'pointer', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Schedule {sortConfig.key === 'start_time' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                  <th onClick={() => requestSort('purpose')} style={{ cursor: 'pointer', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Purpose {sortConfig.key === 'purpose' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                  <th onClick={() => requestSort('status')} style={{ cursor: 'pointer', padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status {sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                  <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const groups = {};
                  const processed = [];
                  sortedBookings.forEach(b => {
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

                  processed.forEach(p => {
                    if (p.isBatch) {
                      const starts = p.all.map(b => new Date(b.start_time).getTime());
                      const ends = p.all.map(b => new Date(b.end_time).getTime());
                      p.minStart = new Date(Math.min(...starts));
                      p.maxEnd = new Date(Math.max(...ends));
                    }
                  });

                  return processed.map((booking) => (
                    <tr key={booking.isBatch ? booking.request_id : booking.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.875rem' }}>
                            {booking.user?.full_name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p style={{ fontWeight: '600', fontSize: '0.875rem', margin: 0, color: 'var(--text-primary)' }}>{booking.user?.full_name || 'Unknown User'}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>{booking.user?.email || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                            <Building2 size={14} color="var(--text-secondary)" />
                            {booking.room?.name || 'Unknown Room'}
                            {booking.isBatch && (
                              <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '0.6rem', padding: '1px 5px', borderRadius: '4px', fontWeight: '800', marginLeft: '0.5rem' }}>BATCH</span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Floor {booking.room?.floor || '?'} • {booking.room?.capacity || '?'} Seats</span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                            <Calendar size={14} color="var(--primary)" />
                            {booking.isBatch ? (
                              `${booking.minStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${booking.maxEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
                            ) : (
                              new Date(booking.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            <Clock size={14} />
                            {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {booking.isBatch && ` (${booking.all.length} days)`}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', maxWidth: '200px' }}>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={booking.purpose}>
                          {booking.purpose}
                        </p>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        {getStatusBadge(booking.status)}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                        <Link
                          to={`/booking/${booking.id}`}
                          className="btn-outline"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.4rem 0.75rem',
                            fontSize: '0.75rem',
                            textDecoration: 'none',
                            borderRadius: '0.5rem'
                          }}
                        >
                          <Eye size={14} />
                          View
                        </Link>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllBookings;
