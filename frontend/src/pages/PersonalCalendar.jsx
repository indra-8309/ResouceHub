import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  CheckCircle2,
  Timer
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const PersonalCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [hoveredBooking, setHoveredBooking] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const fetchMyBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/bookings/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter out rejected and cancelled
      const filtered = response.data.filter(b => {
        const s = b.status?.toLowerCase();
        return s !== 'rejected' && s !== 'cancelled';
      });
      setBookings(filtered);
    } catch (error) {
      toast.error('Failed to fetch calendar data');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const renderHeader = () => {
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>My Calendar</h1>
          <p style={{ color: 'var(--text-secondary)' }}>View and manage your personal booking schedule.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'var(--surface)', padding: '0.5rem 1rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
          <button onClick={prevMonth} className="btn-icon" style={{ padding: '0.5rem' }}><ChevronLeft size={20} /></button>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', minWidth: '150px', textAlign: 'center' }}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button onClick={nextMonth} className="btn-icon" style={{ padding: '0.5rem' }}><ChevronRight size={20} /></button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '1rem' }}>
        {days.map(day => (
          <div key={day} style={{ textAlign: 'center', fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const cells = [];
    
    // Empty cells for previous month days
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} style={{ height: '140px', border: '1px solid var(--border-light)', background: '#f8fafc' }}></div>);
    }
    
    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayBookings = bookings
        .filter(b => b.start_time.startsWith(dateStr))
        .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
        
      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

      cells.push(
        <div key={day} style={{ 
          height: '140px', 
          border: '1px solid var(--border)', 
          background: 'var(--surface)',
          padding: '0.75rem',
          position: 'relative',
          overflowY: 'auto'
        }}>
          <span style={{ 
            fontSize: '0.9rem', 
            fontWeight: '700', 
            color: isToday ? 'var(--primary)' : 'var(--text-primary)',
            background: isToday ? 'var(--primary-light)' : 'transparent',
            width: '28px',
            height: '28px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            marginBottom: '0.5rem'
          }}>
            {day}
          </span>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {dayBookings.map(b => {
              const isApproved = b.status?.toLowerCase() === 'approved';
              const isPending = b.status?.toLowerCase() === 'pending';
              
              return (
                <div 
                  key={b.id} 
                  onMouseEnter={() => setHoveredBooking(b)}
                  onMouseLeave={() => setHoveredBooking(null)}
                  onMouseMove={handleMouseMove}
                  style={{
                    fontSize: '0.7rem',
                    padding: '0.3rem 0.5rem',
                    borderRadius: '0.5rem',
                    background: isApproved ? 'var(--primary-light)' : 'rgba(241, 245, 249, 0.5)',
                    color: isApproved ? 'var(--primary)' : 'var(--text-secondary)',
                    border: isApproved ? '2px solid var(--primary)' : (isPending ? '2px dashed var(--primary)' : '1px solid var(--border)'),
                    fontWeight: '700',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {isApproved ? <CheckCircle2 size={10} /> : <Timer size={10} />}
                  {new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} {b.room.name}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)', 
        borderRadius: '1.5rem', 
        overflow: 'hidden', 
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-md)'
      }}>
        {cells}
        
        {/* Hover Card */}
        {hoveredBooking && (
          <div style={{
            position: 'fixed',
            left: mousePos.x + 20,
            top: mousePos.y + 20,
            zIndex: 9999,
            background: 'white',
            padding: '1rem',
            borderRadius: '1rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid var(--border)',
            minWidth: '220px',
            pointerEvents: 'none',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div style={{ 
                padding: '0.4rem', 
                background: 'var(--primary-light)', 
                borderRadius: '0.5rem',
                color: 'var(--primary)'
              }}>
                <CalendarIcon size={16} />
              </div>
              <h4 style={{ fontWeight: '800', fontSize: '0.9rem' }}>{hoveredBooking.room.name}</h4>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={14} />
                <span>
                  {new Date(hoveredBooking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                  {new Date(hoveredBooking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
                <div style={{ marginTop: '2px' }}><MapPin size={14} /></div>
                <span>Floor {hoveredBooking.room.floor || '1'}</span>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                <p style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Purpose:</p>
                <p>{hoveredBooking.purpose}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate-in" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {renderHeader()}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <div className="animate-pulse" style={{ color: 'var(--primary)' }}>Loading your schedule...</div>
        </div>
      ) : (
        <div className="card" style={{ padding: '2rem' }}>
          {renderDays()}
          {renderCells()}
          
          <div style={{ marginTop: '2rem', display: 'flex', gap: '2rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '16px', height: '16px', background: 'var(--primary-light)', border: '2px solid var(--primary)', borderRadius: '4px' }}></div>
              <span style={{ fontWeight: '600' }}>Approved Booking</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '16px', height: '16px', border: '2px dashed var(--primary)', borderRadius: '4px' }}></div>
              <span style={{ fontWeight: '600' }}>Pending Approval</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalCalendar;
