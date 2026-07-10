import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../config';
import {
  Search,
  Users,
  Monitor,
  Wifi,
  Wind,
  MapPin,
  Calendar,
  Clock,
  Info,
  ChevronRight,
  ChevronDown,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Rotate3d,
  Building2,
  ShieldAlert,
  X,
  ArrowLeft,
  Ban,
  Wrench
} from 'lucide-react';
import RoomSelector from '../components/RoomSelector';
import { useAuth } from '../context/AuthContext';
import RoomPanorama from '../components/RoomPanorama';
import ParkingSelector from '../components/ResourceSelectors/ParkingSelector';
import ShuttleSelector from '../components/ResourceSelectors/ShuttleSelector';

const BookRoom = () => {
  const [searchParams, setSearchParams] = useState({
    fromDate: new Date().toLocaleDateString('en-CA'),
    toDate: new Date().toLocaleDateString('en-CA'),
    startTime: '10:00',
    endTime: '11:00',
    capacity: 0,
    purpose: '',
    roomId: null
  });
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [showFeaturesDropdown, setShowFeaturesDropdown] = useState(false);
  const dropdownRef = React.useRef(null);
  const [departments, setDepartments] = useState([]);
  const [showPano, setShowPano] = useState(false);
  const [panoRoomName, setPanoRoomName] = useState('');
  const [resourceSlots, setResourceSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState(null);

  const { user } = useAuth();
  const availableFeatures = ['AC', 'WiFi', 'Whiteboard', 'Projector'];

  const toggleFeature = (feature) => {
    setSelectedFeatures(prev =>
      prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowFeaturesDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/departments`);
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to fetch departments');
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setHasSearched(true);
    try {
      const startD = new Date(searchParams.fromDate);
      const endD = new Date(searchParams.toDate);
      
      if (endD < startD) {
        toast.error("To Date must be after or equal to From Date");
        setLoading(false);
        return;
      }
      
      if (searchParams.startTime >= searchParams.endTime) {
        toast.error("End time must be after start time");
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      
      // We need to find rooms available on ALL selected dates for the given time slot
      let commonRooms = null;
      let currentDate = new Date(startD);
      
      while (currentDate <= endD) {
        const yyyy = currentDate.getFullYear();
        const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
        const dd = String(currentDate.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        
        const start = `${dateStr}T${searchParams.startTime}:00`;
        const end = `${dateStr}T${searchParams.endTime}:00`;

        const response = await axios.get(`${API_BASE_URL}/rooms/search`, {
          params: {
            startTime: start,
            endTime: end,
            capacity: searchParams.capacity > 0 ? searchParams.capacity : undefined,
            features: selectedFeatures.length > 0 ? selectedFeatures : undefined,
            roomId: searchParams.roomId || undefined
          },
          paramsSerializer: { indexes: null },
          headers: { Authorization: `Bearer ${token}` }
        });

        if (commonRooms === null) {
          commonRooms = response.data;
        } else {
          // Merge results: keep all rooms, but update status if not available on any day
          const currentMap = new Map(response.data.map(r => [r.id, r]));
          commonRooms = commonRooms.map(r => {
            const dayResult = currentMap.get(r.id);
            if (!dayResult) return null; // Room vanished?
            
            // If room is already restricted/inactive/maintenance, keep that.
            // If it was available but is not today, update its status.
            if (r.status === 'available' && dayResult.status !== 'available') {
              return dayResult;
            }
            return r;
          }).filter(Boolean);
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }

      setRooms(commonRooms || []);
      if (!commonRooms || commonRooms.length === 0) {
        toast.error('No rooms found matching your search');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error(error.response?.data?.message || error.response?.data?.detail || 'Failed to search rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasSearched) {
      handleSearch();
    }
  }, [searchParams.roomId]);

  const fetchResourceDetails = async (room) => {
    if (!room || (room.resource_type !== 'PARKING' && room.resource_type !== 'SHUTTLE')) {
      setResourceSlots([]);
      setBookedSlots([]);
      setSelectedSlotId(null);
      return;
    }

    try {
      const start = `${searchParams.fromDate}T${searchParams.startTime}:00`;
      const end = `${searchParams.toDate}T${searchParams.endTime}:00`;
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Fetch all slots
      const slotsRes = await axios.get(`${API_BASE_URL}/rooms/${room.id}/slots`, config);
      setResourceSlots(slotsRes.data);

      // Fetch booked slots
      const bookedRes = await axios.get(`${API_BASE_URL}/rooms/${room.id}/booked-slots`, {
        params: { start, end },
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookedSlots(bookedRes.data);
      setSelectedSlotId(null);
    } catch (error) {
      console.error('Failed to fetch resource details:', error);
      toast.error('Failed to load slots availability');
    }
  };

  useEffect(() => {
    if (selectedRoom) {
      fetchResourceDetails(selectedRoom);
    } else {
      setSearchParams(prev => ({ ...prev, purpose: '' }));
    }
  }, [selectedRoom, searchParams.startTime, searchParams.endTime, searchParams.fromDate, searchParams.toDate]);

  const handleBooking = async () => {
    if (!selectedRoom) return;

    if ((selectedRoom.resource_type === 'PARKING' || selectedRoom.resource_type === 'SHUTTLE') && !selectedSlotId) {
      toast.error('Please select a specific slot or seat');
      return;
    }

    if (!searchParams.purpose) {
      toast.error('Please enter the purpose of the booking');
      return;
    }

    setBookingLoading(true);
    try {
      const startD = new Date(searchParams.fromDate);
      const endD = new Date(searchParams.toDate);
      const token = localStorage.getItem('token');
      
      const bookings = [];
      let currentDate = new Date(startD);
      const batchRequestId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      while (currentDate <= endD) {
        const yyyy = currentDate.getFullYear();
        const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
        const dd = String(currentDate.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        
        bookings.push({
          room_id: selectedRoom.id,
          slot_id: selectedSlotId,
          start_time: `${dateStr}T${searchParams.startTime}:00`,
          end_time: `${dateStr}T${searchParams.endTime}:00`,
          purpose: searchParams.purpose,
          request_id: batchRequestId
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Process all bookings
      const results = await Promise.all(bookings.map(b => 
        axios.post(`${API_BASE_URL}/bookings`, b, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ));

      const allApproved = results.every(res => res.data.status === 'approved');
      toast.success(allApproved ? 'All bookings successful!' : 'Booking requests sent for approval!');
      
      setSelectedRoom(null);
      setSelectedSlotId(null);
      handleSearch();
    } catch (error) {
      toast.error(error.response?.data?.message || error.response?.data?.detail || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  const amenityIcons = {
    'Projector': Monitor,
    'WiFi': Wifi,
    'AC': Wind,
    'TV/display': Monitor,
    'Whiteboard': MapPin,
    'Wellness-friendly': Info
  };



  const RoomCard = ({ room, user, departments, selectedRoom, setSelectedRoom, setPanoRoomName, setShowPano }) => {
    const isAvailable = room.status === 'available';
    const isMaintenance = room.status === 'maintenance';
    const isRestricted = room.status === 'restricted';
    const isInactive = room.status === 'inactive';
    const isSelected = selectedRoom?.id === room.id;
    const canBook = isAvailable;

    return (
      <div
        className={`card ${canBook ? 'clickable' : ''} ${isMaintenance ? 'maintenance-card' : ''}`}
        onClick={() => canBook && setSelectedRoom(room)}
        style={{
          cursor: canBook ? 'pointer' : 'not-allowed',
          border: isSelected ? '2px solid var(--primary)' : (canBook ? '1px solid var(--border)' : (isMaintenance ? '1px solid #f87171' : '1px dashed var(--border)')),
          background: isSelected ? 'var(--primary-light)' : (canBook ? 'var(--surface)' : (isMaintenance ? '#fff1f2' : 'rgba(241, 245, 249, 0.5)')),
          padding: '1rem',
          position: 'relative',
          opacity: (isRestricted || isInactive) ? 0.7 : 1
        }}
      >
        {isMaintenance && (
          <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: '#ef4444', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.6rem', fontWeight: '800', zIndex: 1 }}>
            MAINTENANCE
          </div>
        )}
        {isRestricted && (
          <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: '#64748b', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.6rem', fontWeight: '800', zIndex: 1, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <ShieldAlert size={10} /> RESTRICTED
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>{room.name}</h3>
          <span className={`badge ${isAvailable ? 'badge-approved' : 'badge-cancelled'}`} style={{ fontSize: '0.6rem', padding: '0.2rem 0.5rem', background: isAvailable ? '#f0fdf4' : (isMaintenance ? '#fffbeb' : '#fef2f2'), color: isAvailable ? '#16a34a' : (isMaintenance ? '#b45309' : '#dc2626'), display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            {isAvailable ? <CheckCircle2 size={10} /> : (isMaintenance ? <Wrench size={10} /> : ((isRestricted || isInactive) ? <ShieldAlert size={10} /> : <Ban size={10} />))}
            {isMaintenance ? 'maintenance' : (isInactive ? 'inactive' : room.status)}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
          <Users size={14} />
          <span>Up to {room.capacity} seats</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
          <Clock size={14} />
          <span>
            {(() => {
              try {
                if (!room.booking_hours) return '24/7';
                const hours = typeof room.booking_hours === 'string' ? JSON.parse(room.booking_hours) : room.booking_hours;
                return `${hours.start} - ${hours.end}`;
              } catch (e) { return '24/7'; }
            })()}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
          <ShieldAlert size={14} color={room.needs_approval ? 'var(--warning)' : 'var(--accent)'} />
          <span style={{ fontWeight: '600', color: room.needs_approval ? 'var(--warning)' : 'var(--accent)' }}>
            {room.needs_approval ? 'Approval Required' : 'Instant Booking'}
          </span>
        </div>

        {room.allowed_departments && room.allowed_departments.length > 0 && (
          <div style={{ fontSize: '0.7rem', color: !isRestricted ? 'var(--text-secondary)' : 'var(--danger)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Building2 size={12} />
            <span>Allowed: {room.allowed_departments.map(id => departments.find(d => String(d.id) === String(id))?.name).filter(Boolean).join(', ')}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {room.features.slice(0, 3).map(res => {
            const Icon = amenityIcons[res] || Info;
            return (
              <div key={res} title={res} style={{ padding: '4px', background: 'var(--background)', borderRadius: '6px' }}>
                <Icon size={14} color="var(--primary)" />
              </div>
            );
          })}
          {room.features.length > 3 && (
            <div style={{ padding: '2px 6px', background: 'var(--background)', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
              +{room.features.length - 3}
            </div>
          )}
        </div>

        {room.resource_type !== 'PARKING' && room.resource_type !== 'SHUTTLE' && room.id <= 5 && (
          <button
            onClick={(e) => { e.stopPropagation(); setPanoRoomName(room.name); setShowPano(true); }}
            className="btn-outline"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem', padding: '0.4rem', fontSize: '0.75rem', borderColor: 'var(--primary)', color: 'var(--primary)', fontWeight: '700' }}
          >
            <Rotate3d size={14} /> 360° Virtual View
          </button>
        )}

        {canBook ? (
          <button className={isSelected ? 'btn-primary' : 'btn-outline'} style={{ width: '100%', padding: '0.5rem', fontSize: '0.75rem' }}>
            {isSelected ? 'Selected' : 'Select Room'}
          </button>
        ) : (
          <div style={{ padding: '0.75rem', background: (isRestricted || isInactive) ? '#f1f5f9' : (isMaintenance ? '#fee2e2' : '#f1f5f9'), borderRadius: '0.75rem', fontSize: '0.75rem', color: (isRestricted || isInactive) ? '#64748b' : (isMaintenance ? '#991b1b' : '#64748b'), fontWeight: '600', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {(isRestricted || isInactive) ? <ShieldAlert size={14} /> : (isMaintenance ? <XCircle size={14} /> : <Clock size={14} />)}
              {isInactive ? 'Inactive Room' : (isRestricted ? 'Department Restricted' : (isMaintenance ? 'Under Maintenance' : 'Already Booked'))}
            </div>
            <div style={{ fontSize: '0.7rem', fontWeight: '500', opacity: 0.8 }}>
              {isInactive ? 'This room is currently out of service.' : (isRestricted ? 'Your department is not authorized to book this room.' : (room.reason || 'Unavailable for selected slot'))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate-in" style={{ paddingBottom: '4rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: '800', letterSpacing: '-0.02em' }}>Reserve Workspace</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Find and book the perfect room, parking spot, or shuttle seat for your next meeting.</p>
      </div>

      <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <form onSubmit={handleSearch} style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1.5rem 1rem',
          alignItems: 'flex-end'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>From Date</label>
            <div style={{ position: 'relative' }}>
              <Calendar size={14} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
              <input
                type="date"
                value={searchParams.fromDate}
                onChange={(e) => setSearchParams({ ...searchParams, fromDate: e.target.value })}
                style={{ paddingLeft: '2.25rem', fontSize: '0.85rem', height: '38px' }}
                required
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>To Date</label>
            <div style={{ position: 'relative' }}>
              <Calendar size={14} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
              <input
                type="date"
                value={searchParams.toDate}
                onChange={(e) => setSearchParams({ ...searchParams, toDate: e.target.value })}
                style={{ paddingLeft: '2.25rem', fontSize: '0.85rem', height: '38px' }}
                required
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>Start Time</label>
            <div style={{ position: 'relative' }}>
              <Clock size={14} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
              <input
                type="time"
                // list="time-options"
                value={searchParams.startTime}
                onChange={(e) => setSearchParams({ ...searchParams, startTime: e.target.value })}
                style={{ paddingLeft: '2.25rem', fontSize: '0.85rem', height: '38px' }}
                required
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>End Time</label>
            <div style={{ position: 'relative' }}>
              <Clock size={14} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
              <input
                type="time"
                // list="time-options"
                value={searchParams.endTime}
                onChange={(e) => setSearchParams({ ...searchParams, endTime: e.target.value })}
                style={{ paddingLeft: '2.25rem', fontSize: '0.85rem', height: '38px' }}
                required
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>Capacity</label>
            <div style={{ position: 'relative' }}>
              <Users size={14} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
              <input
                type="number"
                min="1"
                placeholder="Any"
                value={searchParams.capacity || ''}
                onChange={(e) => setSearchParams({ ...searchParams, capacity: parseInt(e.target.value) || 0 })}
                style={{ paddingLeft: '2.25rem', fontSize: '0.85rem', height: '38px' }}
              />
            </div>
          </div>
          <div style={{ gridColumn: 'span 2', minWidth: '300px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>Specific Room</label>
            <div style={{ position: 'relative', width: '100%' }}>
              <RoomSelector
                onSelect={(room) => setSearchParams({ ...searchParams, roomId: room?.id || null })}
                selectedRoomId={searchParams.roomId}
                placeholder="All resources / Search..."
              />
            </div>
          </div>
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>Select Room Features</label>
            <div
              onClick={() => setShowFeaturesDropdown(!showFeaturesDropdown)}
              onKeyDown={(e) => e.key === 'Enter' && setShowFeaturesDropdown(false)}
              tabIndex={0}
              style={{
                padding: '0 0.8rem',
                fontSize: '0.85rem',
                height: '38px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', maxWidth: '140px', overflow: 'hidden' }}>
                {selectedFeatures.length > 0 ? selectedFeatures.map(f => (
                  <span key={f} style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '1px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '700' }}>{f}</span>
                )) : <span style={{ color: 'var(--text-secondary)' }}>Any features</span>}
              </div>
              <ChevronDown size={14} color="var(--text-secondary)" />
            </div>

            {showFeaturesDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 100,
                background: 'white',
                marginTop: '0.5rem',
                borderRadius: 'var(--radius)',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border)',
                padding: '0.5rem'
              }}>
                {availableFeatures.map(f => (
                  <label key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderRadius: '0.5rem', cursor: 'pointer', transition: 'background 0.2s' }} className="hover-bg">
                    <input
                      type="checkbox"
                      checked={selectedFeatures.includes(f)}
                      onChange={() => toggleFeature(f)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                    />
                    <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{f}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="btn-primary" style={{ height: '38px', fontSize: '0.85rem', padding: '0 1rem' }} disabled={loading}>
            {loading ? '...' : (
              <>
                <Search size={16} /> Search
              </>
            )}
          </button>
        </form>
      </div>

      {hasSearched && (
        <div className="animate-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>
              {searchParams.roomId ? 'Selected Resource' : 'Total Resources'} ({rooms.length})
            </h2>
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', fontWeight: '600' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)' }}>
                <div style={{ width: '10px', height: '10px', background: 'var(--accent)', borderRadius: '50%' }}></div> Available - {rooms.filter(r => r.status === 'available').length}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                <div style={{ width: '10px', height: '10px', background: 'var(--border)', borderRadius: '50%' }}></div> Occupied -  {rooms.filter(r => r.status === 'occupied').length}
              </span>
            </div>
          </div>

          <div style={{ minHeight: '300px' }}>
            {/* Available Rooms Section */}
            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '1.25rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={18} /> Available Resources ({rooms.filter(r => r.status === 'available').length})
              </h3>
              {rooms.filter(r => r.status === 'available').length === 0 ? (
                <div className="card" style={{ padding: '2rem', textAlign: 'center', borderStyle: 'dashed' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No rooms are available for the selected criteria and department.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                  {rooms.filter(r => r.status === 'available').map((room) => (
                    <RoomCard key={room.id} room={room} user={user} departments={departments} selectedRoom={selectedRoom} setSelectedRoom={setSelectedRoom} setPanoRoomName={setPanoRoomName} setShowPano={setShowPano} />
                  ))}
                </div>
              )}
            </div>

            {/* Occupied Rooms Section */}
            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '1.25rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={18} /> Occupied / Restricted / Maintenance ({rooms.filter(r => r.status !== 'available').length})
              </h3>
              {rooms.filter(r => r.status !== 'available').length === 0 ? (
                <div className="card" style={{ padding: '2rem', textAlign: 'center', borderStyle: 'dashed' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No occupied or restricted resources for this criteria.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                  {rooms.filter(r => r.status !== 'available').map((room) => (
                    <RoomCard key={room.id} room={room} user={user} departments={departments} selectedRoom={selectedRoom} setSelectedRoom={setSelectedRoom} setPanoRoomName={setPanoRoomName} setShowPano={setShowPano} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedRoom && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div className="card animate-in" style={{ width: '100%', maxWidth: '540px', padding: '2.5rem', boxShadow: 'var(--shadow-lg)', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Confirm Reservation</h2>
                <p style={{ color: 'var(--text-secondary)' }}>{selectedRoom.name}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                  onClick={() => setSelectedRoom(null)}
                  style={{
                    padding: '0.6rem 1.2rem',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    color: 'var(--text-secondary)',
                    fontSize: '0.875rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  className="hover-bg"
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  onClick={() => setSelectedRoom(null)}
                  title="Close and return to list"
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#ef4444',
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    zIndex: 10
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <X size={26} strokeWidth={3} />
                </button>
              </div>
            </div>

            <div style={{ background: 'var(--background)', padding: '1.5rem', borderRadius: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Schedule</p>
                <p style={{ fontWeight: '700' }}>
                  {(() => {
                    const formatDate = (dateStr) => {
                      const d = new Date(dateStr);
                      const dd = String(d.getDate()).padStart(2, '0');
                      const mm = String(d.getMonth() + 1).padStart(2, '0');
                      const yyyy = d.getFullYear();
                      return `${dd}.${mm}.${yyyy}`;
                    };
                    const from = formatDate(searchParams.fromDate);
                    const to = formatDate(searchParams.toDate);
                    return from === to ? from : `${from} to ${to}`;
                  })()}
                </p>
                <p style={{ fontSize: '0.875rem' }}>
                  {searchParams.startTime} - {searchParams.endTime}
                  {searchParams.fromDate !== searchParams.toDate && (
                    <span style={{ color: 'var(--text-secondary)', marginLeft: '0.4rem', fontSize: '0.75rem', fontWeight: '600' }}>
                      (for {Math.ceil((new Date(searchParams.toDate) - new Date(searchParams.fromDate)) / (1000 * 60 * 60 * 24)) + 1} days)
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Details</p>
                <p style={{ fontWeight: '700' }}>{selectedRoom.resource_type === 'ROOM' ? `${selectedRoom.capacity} People` : `1 ${selectedRoom.resource_type.toLowerCase()}`}</p>
                <p style={{ fontSize: '0.875rem' }}>
                  {selectedRoom.needs_approval ? (
                    <span style={{ color: 'var(--primary)', fontWeight: '600' }}>
                      Approval Required
                    </span>
                  ) : (
                    'Instant Booking'
                  )}
                </p>
              </div>
            </div>

            {selectedRoom.features && selectedRoom.features.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.6rem' }}>Equipped With</p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {selectedRoom.features.map(f => {
                    const Icon = amenityIcons[f] || Info;
                    return (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', background: 'var(--background)', borderRadius: '8px', fontSize: '0.8rem', border: '1px solid var(--border)' }}>
                        <Icon size={14} color="var(--primary)" />
                        {f}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedRoom.resource_type === 'PARKING' && (
              <ParkingSelector
                slots={resourceSlots}
                bookedSlots={bookedSlots}
                selectedSlot={selectedSlotId}
                onSelect={setSelectedSlotId}
              />
            )}

            {selectedRoom.resource_type === 'SHUTTLE' && (
              <ShuttleSelector
                slots={resourceSlots}
                bookedSlots={bookedSlots}
                selectedSlot={selectedSlotId}
                onSelect={setSelectedSlotId}
              />
            )}

            <div style={{ marginBottom: '2.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '700', marginBottom: '0.6rem' }}>Meeting Purpose</label>
              <textarea
                value={searchParams.purpose}
                onChange={(e) => setSearchParams({ ...searchParams, purpose: e.target.value })}
                placeholder="e.g., Weekly Team Sync, Strategy Workshop..."
                rows={3}
                required
                style={{ background: 'var(--background)' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setSelectedRoom(null)} className="btn-outline" style={{ flex: 1, height: '48px' }}>Cancel</button>
              <button onClick={handleBooking} className="btn-primary" style={{ flex: 2, height: '48px' }} disabled={bookingLoading}>
                {bookingLoading ? 'Processing...' : (
                  <>
                    Confirm Booking <CheckCircle2 size={20} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Time Datalist for scrollable options */}
      <datalist id="time-options">
        <option value="08:00" /> <option value="08:15" /> <option value="08:30" /> <option value="08:45" />
        <option value="09:00" /> <option value="09:15" /> <option value="09:30" /> <option value="09:45" />
        <option value="10:00" /> <option value="10:15" /> <option value="10:30" /> <option value="10:45" />
        <option value="11:00" /> <option value="11:15" /> <option value="11:30" /> <option value="11:45" />
        <option value="12:00" /> <option value="12:15" /> <option value="12:30" /> <option value="12:45" />
        <option value="13:00" /> <option value="13:15" /> <option value="13:30" /> <option value="13:45" />
        <option value="14:00" /> <option value="14:15" /> <option value="14:30" /> <option value="14:45" />
        <option value="15:00" /> <option value="15:15" /> <option value="15:30" /> <option value="15:45" />
        <option value="16:00" /> <option value="16:15" /> <option value="16:30" /> <option value="16:45" />
        <option value="17:00" /> <option value="17:15" /> <option value="17:30" /> <option value="17:45" />
        <option value="18:00" /> <option value="18:15" /> <option value="18:30" /> <option value="18:45" />
        <option value="19:00" /> <option value="19:15" /> <option value="19:30" /> <option value="19:45" />
        <option value="20:00" /> <option value="20:15" /> <option value="20:30" /> <option value="20:45" />
        <option value="21:00" /> <option value="21:15" /> <option value="21:30" /> <option value="21:45" />
      </datalist>

      {showPano && (
        <RoomPanorama
          roomName={panoRoomName}
          onClose={() => setShowPano(false)}
        />
      )}
    </div>
  );
};

export default BookRoom;

