import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Monitor, 
  Wifi, 
  Wind,
  Check,
  X,
  XCircle,
  Building2,
  Users,
  Settings2,
  ShieldAlert,
  Save,
  ChevronRight,
  Hammer,
  Clock,
  Trash,
  CheckCircle2,
  Search,
  ChevronDown
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

const ManageRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomSearch, setRoomSearch] = useState('');
  const [departments, setDepartments] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  const [confirmMaintDelete, setConfirmMaintDelete] = useState({ open: false, id: null });
  const token = localStorage.getItem('token');
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [selectedRoomForMaintenance, setSelectedRoomForMaintenance] = useState(null);
  const [maintenanceForm, setMaintenanceForm] = useState({
    start_time: '',
    end_time: '',
    reason: ''
  });

  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    features: [],
    needs_approval: true,
    is_active: true,
    booking_hours: { start: '09:00', end: '18:00' },
    max_duration_hours: 4,
    allowed_roles: ['employee', 'manager', 'admin'],
    allowed_departments: [],
    buffer_time_minutes: 0,
    resource_type: 'ROOM',
    floor: '',
    building: ''
  });

  const availableResources = [
    'Projector', 'WiFi', 'AC', 'TV/display', 'Whiteboard', 
    'HDMI cable', 'Video conferencing', 'Parking', 'Power sockets'
  ];

  useEffect(() => {
    fetchRooms();
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('http://localhost:8000/departments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to fetch departments');
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await axios.get('http://localhost:8000/rooms', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRooms(response.data);
    } catch (error) {
      toast.error('Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeature = (res) => {
    const features = formData.features.includes(res)
      ? formData.features.filter(r => r !== res)
      : [...formData.features, res];
    setFormData({ ...formData, features });
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      capacity: room.capacity,
      features: room.features || [],
      needs_approval: room.needs_approval,
      is_active: room.is_active,
      booking_hours: typeof room.booking_hours === 'string' ? JSON.parse(room.booking_hours) : (room.booking_hours || { start: '09:00', end: '18:00' }),
      max_duration_hours: room.max_duration_hours || 4,
      allowed_roles: room.allowed_roles || ['employee', 'manager', 'admin'],
      allowed_departments: (room.allowed_departments || []).map(id => id.toString()),
      buffer_time_minutes: room.buffer_time_minutes || 0,
      resource_type: room.resource_type || 'ROOM',
      floor: room.floor || '',
      building: room.building || ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Explicitly map and stringify complex fields to match backend snake_case expectations
      const dataToSend = {
        name: formData.name,
        capacity: formData.capacity,
        resource_type: formData.resource_type || 'ROOM',
        features: formData.features, // Backend handles List<String> now
        is_active: formData.is_active,
        needs_approval: formData.needs_approval,
        booking_hours: formData.booking_hours ? JSON.stringify(formData.booking_hours) : null,
        max_duration_hours: formData.max_duration_hours,
        allowed_roles: formData.allowed_roles,
        allowed_departments: formData.allowed_departments.map(id => parseInt(id)),
        buffer_time_minutes: formData.buffer_time_minutes,
        floor: formData.floor,
        building: formData.building
      };

      if (editingRoom) {
        await axios.put(`http://localhost:8000/admin/rooms/${editingRoom.id}`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Room updated successfully');
      } else {
        await axios.post('http://localhost:8000/admin/rooms', dataToSend, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Room created successfully');
      }
      setShowForm(false);
      setEditingRoom(null);
      setFormData({ 
        name: '', 
        capacity: '', 
        features: [], 
        needs_approval: true, 
        is_active: true, 
        booking_hours: { start: '09:00', end: '18:00' }, 
        max_duration_hours: 4, 
        allowed_roles: ['employee', 'manager', 'admin'], 
        allowed_departments: [], 
        buffer_time_minutes: 0,
        resource_type: 'ROOM',
        floor: '',
        building: ''
      });
      fetchRooms();
    } catch (error) {
      toast.error('Failed to save room');
    }
  };

  const handleAddMaintenance = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`http://localhost:8000/admin/rooms/${selectedRoomForMaintenance.id}/maintenance`, maintenanceForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Maintenance block added');
      setShowMaintenanceModal(false);
      setMaintenanceForm({ start_time: '', end_time: '', reason: '' });
      fetchRooms();
    } catch (error) {
      toast.error('Failed to add maintenance');
    }
  };

  const handleDeleteRoom = async (roomId) => {
    try {
      await axios.delete(`http://localhost:8000/admin/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Room deleted successfully');
      fetchRooms();
    } catch (error) {
      toast.error('Failed to delete room');
    }
  };

  const handleDeleteMaintenance = async (blockId) => {
    try {
      await axios.delete(`http://localhost:8000/admin/maintenance/${blockId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Maintenance block removed');
      fetchRooms();
    } catch (error) {
      toast.error('Failed to remove maintenance');
    }
  };

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>Room Registry</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage facility resources and booking policies.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search rooms..." 
              value={roomSearch}
              onChange={e => setRoomSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem', height: '42px', width: '250px', border: '1px solid var(--border)', borderRadius: '10px' }} 
            />
          </div>
          <button onClick={() => { 
            setEditingRoom(null); 
            setFormData({ 
              name: '', 
              capacity: '', 
              features: [], 
              needs_approval: true, 
              is_active: true, 
              booking_hours: { start: '09:00', end: '18:00' }, 
              max_duration_hours: 4, 
              allowed_roles: ['employee', 'manager', 'admin'], 
              allowed_departments: [], 
              buffer_time_minutes: 0,
              resource_type: 'ROOM',
              floor: '',
              building: ''
            }); 
            setShowForm(true); 
          }} className="btn-primary" style={{ padding: '0.75rem 1.25rem', fontSize: '0.9rem' }}>
            <Plus size={18} />
            Create New Room
          </button>
        </div>
      </div>

      {(() => {
        const now = new Date();
        const filteredRooms = rooms.filter(r => r.name?.toLowerCase().includes(roomSearch.toLowerCase()));
        
        const activeRooms = filteredRooms.filter(r => r.is_active && !(r.maintenance_blocks || []).some(b => now >= new Date(b.start_time) && now <= new Date(b.end_time)));
        const maintenanceRooms = filteredRooms.filter(r => (r.maintenance_blocks || []).some(b => now >= new Date(b.start_time) && now <= new Date(b.end_time)));
        const inactiveRooms = filteredRooms.filter(r => !r.is_active && !(r.maintenance_blocks || []).some(b => now >= new Date(b.start_time) && now <= new Date(b.end_time)));

        const RoomCard = (room) => (
          <div key={room.id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', background: 'var(--primary-light)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>{room.name}</h3>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Floor 2 • Main Building</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button 
                  onClick={() => {
                    setSelectedRoomForMaintenance(room);
                    setShowMaintenanceModal(true);
                  }} 
                  className="btn-outline" 
                  style={{ width: '28px', height: '28px', padding: 0, borderRadius: '6px', color: 'var(--warning)' }}
                  title="Manage Maintenance"
                >
                  <Hammer size={12} />
                </button>
                <button onClick={() => handleEdit(room)} className="btn-outline" style={{ width: '28px', height: '28px', padding: 0, borderRadius: '6px' }}><Edit2 size={12} /></button>
                <button 
                  onClick={() => setConfirmDelete({ open: true, id: room.id })} 
                  className="btn-outline" 
                  style={{ width: '28px', height: '28px', padding: 0, borderRadius: '6px', color: 'var(--danger)' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'var(--background)', padding: '0.6rem', borderRadius: '0.6rem' }}>
                <p style={{ fontSize: '0.6rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Capacity</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Users size={12} color="var(--primary)" />
                  <span style={{ fontWeight: '700', fontSize: '0.8rem' }}>{room.capacity} seats</span>
                </div>
              </div>
              <div style={{ background: 'var(--background)', padding: '0.6rem', borderRadius: '0.6rem' }}>
                <p style={{ fontSize: '0.6rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Policy</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldAlert size={12} color={room.needs_approval ? 'var(--warning)' : 'var(--accent)'} />
                  <span style={{ fontWeight: '700', fontSize: '0.8rem' }}>{room.needs_approval ? 'Approval' : 'Instant'}</span>
                </div>
              </div>
            </div>

            <div style={{ flex: 1, marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.6rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Equipped With</p>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {room.features?.map(res => (
                  <span key={res} style={{ fontSize: '0.65rem', padding: '0.3rem 0.6rem', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '9999px', fontWeight: '600' }}>{res}</span>
                ))}
              </div>
            </div>

            {room.maintenance_blocks?.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: 'auto' }}>
                <p style={{ fontSize: '0.6rem', fontWeight: '700', color: 'var(--warning)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Hammer size={10} /> Maintenance Schedule
                </p>
                {room.maintenance_blocks.map(block => (
                  <div key={block.id} style={{ fontSize: '0.7rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fffbeb', padding: '0.4rem', borderRadius: '4px', marginBottom: '0.25rem' }}>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontWeight: '600', color: '#92400e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{block.reason}</div>
                      <div style={{ fontSize: '0.6rem', color: '#b45309' }}>
                        {new Date(block.start_time).toLocaleDateString()} - {new Date(block.end_time).toLocaleDateString()}
                      </div>
                    </div>
                    <button 
                      onClick={() => setConfirmMaintDelete({ open: true, id: block.id })}
                      style={{ padding: '0.2rem', color: '#b91c1c', background: 'transparent', cursor: 'pointer' }}
                    >
                      <Trash size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

        return (
        <>
          {/* Active Rooms */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '1rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={18} /> Active Rooms ({activeRooms.length})
            </h3>
            {activeRooms.length === 0 ? (
              <div className="card" style={{ padding: '2rem', textAlign: 'center', borderStyle: 'dashed' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No active rooms.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3">{activeRooms.map(RoomCard)}</div>
            )}
          </div>

          {/* Maintenance Rooms */}
          {maintenanceRooms.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '1rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Hammer size={18} /> Under Maintenance ({maintenanceRooms.length})
            </h3>
            <div className="grid grid-cols-3">{maintenanceRooms.map(RoomCard)}</div>
          </div>
          )}

          {/* Inactive Rooms */}
          {inactiveRooms.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '1rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <XCircle size={18} /> Inactive Rooms ({inactiveRooms.length})
            </h3>
            <div className="grid grid-cols-3">{inactiveRooms.map(RoomCard)}</div>
          </div>
          )}
        </>
        );
      })()}

      {showMaintenanceModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1.5rem' }}>
          <div className="card animate-in" style={{ width: '100%', maxWidth: '400px', padding: '2rem', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Maintenance: {selectedRoomForMaintenance.name}</h2>
              <button onClick={() => setShowMaintenanceModal(false)} className="btn-outline" style={{ width: '32px', height: '32px', padding: 0 }}>&times;</button>
            </div>
            
            <form onSubmit={handleAddMaintenance}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label className="form-label">Start Date & Time</label>
                  <input type="datetime-local" value={maintenanceForm.start_time} onChange={e => setMaintenanceForm({...maintenanceForm, start_time: e.target.value})} required />
                </div>
                <div>
                  <label className="form-label">End Date & Time</label>
                  <input type="datetime-local" value={maintenanceForm.end_time} onChange={e => setMaintenanceForm({...maintenanceForm, end_time: e.target.value})} required />
                </div>
                <div>
                  <label className="form-label">Reason / Notes</label>
                  <textarea placeholder="e.g., Annual AC Service" value={maintenanceForm.reason} onChange={e => setMaintenanceForm({...maintenanceForm, reason: e.target.value})} required rows={2} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => setShowMaintenanceModal(false)} className="btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Done</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
          <div className="card animate-in" style={{ width: '100%', maxWidth: '640px', padding: '2.5rem', boxShadow: 'var(--shadow-lg)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '800' }}>{editingRoom ? 'Update Room' : 'Configure New Room'}</h2>
              <button onClick={() => setShowForm(false)} className="btn-outline" style={{ width: '40px', height: '40px', padding: 0 }}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                  <label className="form-label">Room Label</label>
                  <input type="text" placeholder="e.g., Executive Suite A" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <label className="form-label">Capacity</label>
                    <input type="number" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: e.target.value })} required />
                  </div>
                  <div>
                    <label className="form-label">Duration</label>
                    <input type="number" value={formData.max_duration_hours} onChange={e => setFormData({ ...formData, max_duration_hours: parseInt(e.target.value) })} required />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <label className="form-label">Start (Opt)</label>
                    <input type="time" value={formData.booking_hours?.start || ''} onChange={e => setFormData({ ...formData, booking_hours: { ...(formData.booking_hours || {}), start: e.target.value } })} />
                  </div>
                  <div>
                    <label className="form-label">End (Opt)</label>
                    <input type="time" value={formData.booking_hours?.end || ''} onChange={e => setFormData({ ...formData, booking_hours: { ...(formData.booking_hours || {}), end: e.target.value } })} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Buffer (Min)</label>
                  <input type="number" value={formData.buffer_time_minutes} onChange={e => setFormData({ ...formData, buffer_time_minutes: parseInt(e.target.value) })} />
                </div>
              </div>
              <div style={{ marginBottom: '2rem' }}>
                <label className="form-label">Amenities</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  {availableResources.map(res => {
                    const isSelected = formData.features.includes(res);
                    return (
                      <div key={res} onClick={() => handleToggleFeature(res)} style={{ padding: '0.75rem', fontSize: '0.8rem', border: isSelected ? '2px solid var(--primary)' : '1.5px solid var(--border)', borderRadius: '1rem', cursor: 'pointer', background: isSelected ? 'var(--primary-light)' : 'var(--surface)', color: isSelected ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: isSelected ? '700' : '500', textAlign: 'center' }}>
                        {res}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{ background: 'var(--background)', padding: '1.5rem', borderRadius: '1rem', marginBottom: '2.5rem' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: '700', marginBottom: '1rem' }}>Governance Settings</p>
                <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.needs_approval} onChange={e => setFormData({...formData, needs_approval: e.target.checked})} />
                    Approval Required
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                    Active
                  </label>
                </div>
                
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                  <label className="form-label" style={{ marginBottom: '1rem' }}>Reserved to Departments (Optional)</label>
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                    {departments.map(dept => {
                      const isSelected = formData.allowed_departments.includes(dept.id.toString());
                      return (
                        <div 
                          key={dept.id} 
                          onClick={() => {
                            const val = dept.id.toString();
                            const next = isSelected 
                              ? formData.allowed_departments.filter(v => v !== val)
                              : [...formData.allowed_departments, val];
                            setFormData({ ...formData, allowed_departments: next });
                          }}
                          style={{ 
                            padding: '0.5rem 1rem', 
                            fontSize: '0.8rem', 
                            border: isSelected ? '2.2px solid var(--primary)' : '1.5px solid var(--border)', 
                            borderRadius: '999px', 
                            cursor: 'pointer', 
                            background: isSelected ? 'var(--primary-light)' : 'white', 
                            color: isSelected ? 'var(--primary)' : 'var(--text-secondary)', 
                            fontWeight: isSelected ? '700' : '500',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {dept.name}
                        </div>
                      );
                    })}
                  </div>
                  {departments.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No departments found.</p>}
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
                    * If none selected, this resource is available to all departments.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline" style={{ flex: 1, height: '48px' }}>Discard Changes</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, height: '48px' }}>{editingRoom ? 'Update Resource' : 'Register Resource'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, id: null })}
        onConfirm={() => handleDeleteRoom(confirmDelete.id)}
        title="Delete Room?"
        message="Are you sure you want to delete this room? All past and future bookings will be affected."
        confirmText="Delete Room"
      />

      <ConfirmModal 
        isOpen={confirmMaintDelete.open}
        onClose={() => setConfirmMaintDelete({ open: false, id: null })}
        onConfirm={() => handleDeleteMaintenance(confirmMaintDelete.id)}
        title="Remove Maintenance?"
        message="Are you sure you want to remove this maintenance block? The room will become available for booking again during this period."
        confirmText="Remove"
        type="warning"
      />
    </div>
  );
};

export default ManageRooms;
