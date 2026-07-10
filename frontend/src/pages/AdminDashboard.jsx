import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import {
  BarChart3,
  TrendingUp,
  Users,
  Building2,
  CalendarCheck,
  UserPlus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  User as UserIcon,
  Briefcase,
  Search,
  ChevronDown
} from 'lucide-react';
import RoomSelector from '../components/RoomSelector';
import { toast } from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [stats, setStats] = useState({
    total_rooms: 0,
    active_rooms: 0,
    pending_requests: 0,
    approved_today: 0,
    utilization_rate: 0
  });
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedRoomFilter, setSelectedRoomFilter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    email: '',
    full_name: '',
    password: '',
    role: 'employee',
    department_id: '',
    manager_id: ''
  });
  const [departments, setDepartments] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userSortConfig, setUserSortConfig] = useState({ key: 'full_name', direction: 'asc' });
  const [managerSearch, setManagerSearch] = useState('');
  const [isManagerDropdownOpen, setIsManagerDropdownOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  const [confirmReject, setConfirmReject] = useState({ open: false, id: null });

  const token = localStorage.getItem('token');

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users', error);
    }
  };

  const fetchPendingUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch pending requests', error);
    }
  };

  const fetchManagers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/managers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setManagers(response.data);
    } catch (error) {
      console.error('Failed to fetch managers', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/departments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to fetch departments', error);
    }
  };

  const fetchBookings = async (roomId = null) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/bookings`, {
        params: { room_id: roomId || undefined },
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data);
    } catch (error) {
      console.error('Failed to fetch bookings', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'bookings') {
      fetchBookings(selectedRoomFilter?.id);
    }
  }, [activeTab, selectedRoomFilter]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchUsers(), fetchManagers(), fetchDepartments(), fetchBookings(selectedRoomFilter?.id), fetchPendingUsers()]);
      setLoading(false);
    };
    init();
  }, []);

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...userForm,
        department_id: userForm.department_id === '' ? null : parseInt(userForm.department_id),
        manager_id: userForm.manager_id === '' ? null : parseInt(userForm.manager_id)
      };

      if (editingUser) {
        await axios.put(`${API_BASE_URL}/admin/users/${editingUser.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('User updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/admin/users`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('User created successfully');
      }
      setShowUserModal(false);
      setEditingUser(null);
      setUserForm({ email: '', full_name: '', password: '', role: 'employee', department_id: '', manager_id: '' });
      fetchUsers();
      fetchManagers();
    } catch (error) {
      toast.error(error.response?.data?.message || error.response?.data?.detail || 'Action failed');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await axios.delete(`${API_BASE_URL}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User deleted permanently');
      fetchUsers();
      fetchManagers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.put(`${API_BASE_URL}/admin/users/${id}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('User approved!');
      fetchPendingUsers();
      fetchUsers();
    } catch (error) {
      toast.error('Failed to approve user');
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/admin/users/${id}/reject`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('User request rejected.');
      fetchPendingUsers();
    } catch (error) {
      toast.error('Failed to reject request');
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setUserForm({
      email: user.email,
      full_name: user.full_name,
      password: '',
      role: user.role?.toLowerCase() || 'employee',
      department_id: user.department_id || '',
      manager_id: user.manager_id || ''
    });
    setManagerSearch('');
    setShowUserModal(true);
  };

  const chartData = [
    { day: 'Mon', bookings: 12 },
    { day: 'Tue', bookings: 19 },
    { day: 'Wed', bookings: 15 },
    { day: 'Thu', bookings: 22 },
    { day: 'Fri', bookings: 30 },
    { day: 'Sat', bookings: 5 },
    { day: 'Sun', bookings: 2 },
  ];

  const maxBookings = Math.max(...chartData.map(d => d.bookings));

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '700' }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>System management and analytics.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '0.75rem' }}>
          <button
            onClick={() => setActiveTab('analytics')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: activeTab === 'analytics' ? 'white' : 'transparent',
              color: activeTab === 'analytics' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: activeTab === 'analytics' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: activeTab === 'users' ? 'white' : 'transparent',
              color: activeTab === 'users' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: activeTab === 'users' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: activeTab === 'requests' ? 'white' : 'transparent',
              color: activeTab === 'requests' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: activeTab === 'requests' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            Requests {pendingUsers.length > 0 && <span style={{ background: 'var(--danger)', color: 'white', borderRadius: '50%', padding: '0.1rem 0.4rem', fontSize: '0.7rem' }}>{pendingUsers.length}</span>}
          </button>
        </div>
      </div>

      {activeTab === 'analytics' && (
        <>
          <div className="grid grid-cols-4" style={{ marginBottom: '2rem' }}>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ background: 'rgba(37, 99, 235, 0.1)', padding: '0.5rem', borderRadius: '0.5rem', color: 'var(--primary)' }}>
                  <Building2 size={20} />
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Total Resources</span>
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '700' }}>{stats.total_rooms}</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Across 2 buildings</p>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem', borderRadius: '0.5rem', color: 'var(--accent)' }}>
                  <CalendarCheck size={20} />
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Bookings Today</span>
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '700' }}>{stats.approved_today}</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '0.5rem' }}>↑ 12% from yesterday</p>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.5rem', borderRadius: '0.5rem', color: 'var(--warning)' }}>
                  <Users size={20} />
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Utilization</span>
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '700' }}>{(stats.utilization_rate * 100).toFixed(2)}%</h2>
              <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px', marginTop: '0.75rem' }}>
                <div style={{ width: `${stats.utilization_rate * 100}%`, height: '100%', background: 'var(--warning)', borderRadius: '2px' }}></div>
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '0.5rem', color: 'var(--danger)' }}>
                  <TrendingUp size={20} />
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Peak Hours</span>
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '700' }}>11 AM - 3 PM</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Tue, Wed, Thu</p>
            </div>
          </div>

          <div className="grid grid-cols-2">
            <div className="card">
              <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '2rem' }}>Weekly Booking Trends</h3>
              <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 1rem' }}>
                {chartData.map(d => (
                  <div key={d.day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', width: '10%' }}>
                    <div style={{
                      width: '100%',
                      height: `${(d.bookings / maxBookings) * 150}px`,
                      background: 'var(--primary)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease'
                    }}></div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{d.day}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '1.5rem' }}>Room Usage Distribution</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { name: 'Nalanda', use: 85, color: '#2563eb' },
                  { name: 'Kadamba', use: 72, color: '#10b981' },
                  { name: 'Mourya', use: 64, color: '#f59e0b' },
                  { name: 'Mantra', use: 45, color: '#64748b' }
                ].map(room => (
                  <div key={room.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                      <span>{room.name}</span>
                      <span style={{ fontWeight: '600' }}>{room.use}%</span>
                    </div>
                    <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px' }}>
                      <div style={{ width: `${room.use}%`, height: '100%', background: room.color, borderRadius: '4px' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'users' && (() => {
        const thStyle = { padding: '1rem', fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none', borderBottom: '2px solid var(--border-light)' };
        const sortArrow = (key) => userSortConfig.key === key ? (userSortConfig.direction === 'asc' ? ' ↑' : ' ↓') : '';
        const handleUserSort = (key) => {
          setUserSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
        };
        const filtered = users
          .filter(u => userRoleFilter === 'all' || u.role?.toLowerCase() === userRoleFilter.toLowerCase())
          .filter(u => {
            if (!userSearch) return true;
            const s = userSearch.toLowerCase();
            return u.full_name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s);
          })
          .sort((a, b) => {
            let av, bv;
            if (userSortConfig.key === 'full_name') { av = a.full_name?.toLowerCase() || ''; bv = b.full_name?.toLowerCase() || ''; }
            else if (userSortConfig.key === 'role') { av = a.role || ''; bv = b.role || ''; }
            else if (userSortConfig.key === 'department') { av = (a.department_name || a.department?.name || '').toLowerCase(); bv = (b.department_name || b.department?.name || '').toLowerCase(); }
            else if (userSortConfig.key === 'manager') { av = a.manager?.full_name?.toLowerCase() || 'zzz'; bv = b.manager?.full_name?.toLowerCase() || 'zzz'; }
            else { av = ''; bv = ''; }
            if (av < bv) return userSortConfig.direction === 'asc' ? -1 : 1;
            if (av > bv) return userSortConfig.direction === 'asc' ? 1 : -1;
            return 0;
          });
        return (
        <div className="card animate-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '700' }}>User Management ({filtered.length})</h3>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input type="text" placeholder="Search name or email..." value={userSearch} onChange={e => setUserSearch(e.target.value)} style={{ paddingLeft: '2rem', height: '36px', fontSize: '0.8rem', width: '220px', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }} />
              </div>
              <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }} onClick={() => { setEditingUser(null); setUserForm({ email: '', full_name: '', password: '', role: 'employee', department_id: '', manager_id: '' }); setManagerSearch(''); setShowUserModal(true); }}>
                <UserPlus size={14} /> Add New User
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            {['all', 'employee', 'manager', 'admin'].map(r => {
              const count = r === 'all' 
                ? users.length 
                : users.filter(u => u.role?.toLowerCase() === r.toLowerCase()).length;
              return (
                <button key={r} onClick={() => setUserRoleFilter(r)} className={userRoleFilter === r ? 'btn-primary' : 'btn-outline'} style={{ padding: '0.4rem 1rem', fontSize: '0.75rem', textTransform: 'capitalize' }}>
                  {r === 'all' ? `All (${count})` : `${r}s (${count})`}
                </button>
              );
            })}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left' }}>
                  <th onClick={() => handleUserSort('full_name')} style={thStyle}>User{sortArrow('full_name')}</th>
                  <th onClick={() => handleUserSort('role')} style={thStyle}>Role{sortArrow('role')}</th>
                  <th onClick={() => handleUserSort('department')} style={thStyle}>Department{sortArrow('department')}</th>
                  <th onClick={() => handleUserSort('manager')} style={thStyle}>Manager{sortArrow('manager')}</th>
                  <th style={{ ...thStyle, textAlign: 'right', cursor: 'default' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '700' }}>
                          {user.full_name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{user.full_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ padding: '0.25rem 0.6rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: '700', textTransform: 'capitalize', background: user.role === 'admin' ? '#fee2e2' : user.role === 'manager' ? '#e0f2fe' : '#f1f5f9', color: user.role === 'admin' ? '#dc2626' : user.role === 'manager' ? '#0284c7' : '#64748b', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        {user.role === 'admin' ? <Shield size={10} /> : user.role === 'manager' ? <Briefcase size={10} /> : <UserIcon size={10} />}
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        {user.department_name || user.department?.name || (user.role === 'admin' ? <span style={{ color: 'var(--text-secondary)', fontWeight: '400' }}>N/A</span> : <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontWeight: '400' }}>Unassigned</span>)}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', verticalAlign: 'middle', fontSize: '0.875rem' }}>
                      {user.manager ? (
                        <span style={{ fontWeight: '500' }}>{user.manager.full_name}</span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.75rem' }}>
                          {user.role === 'employee' ? 'Not assigned' : 'N/A'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => openEditModal(user)} style={{ padding: '0.4rem', borderRadius: '0.4rem', border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }} title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => setConfirmDelete({ open: true, id: user.id })} style={{ padding: '0.4rem', borderRadius: '0.4rem', border: 'none', background: 'transparent', color: 'var(--danger)', cursor: 'pointer' }} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        );
      })()}

      {activeTab === 'requests' && (
        <div className="card animate-in">
          <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '1.5rem' }}>Account Requests</h3>
          {pendingUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>No pending account requests.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left' }}>
                    <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>User</th>
                    <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Requested Role</th>
                    <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map(user => (
                    <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{user.full_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.email}</div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ padding: '0.25rem 0.6rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: '700', textTransform: 'capitalize', background: '#f1f5f9' }}>{user.role}</span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <button onClick={() => setConfirmReject({ open: true, id: user.id })} style={{ padding: '0.4rem 0.75rem', borderRadius: '0.4rem', border: '1px solid #ef4444', color: '#ef4444', background: 'transparent', cursor: 'pointer', marginRight: '0.5rem', fontWeight: '600' }}>Reject</button>
                        <button onClick={() => handleApprove(user.id)} className="btn-primary" style={{ padding: '0.4rem 0.75rem', borderRadius: '0.4rem', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Approve</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, id: null })}
        onConfirm={() => handleDeleteUser(confirmDelete.id)}
        title="Delete User?"
        message="Are you sure you want to permanently delete this user? This action cannot be undone."
        confirmText="Delete User"
      />

      <ConfirmModal 
        isOpen={confirmReject.open}
        onClose={() => setConfirmReject({ open: false, id: null })}
        onConfirm={() => handleReject(confirmReject.id)}
        title="Reject Request?"
        message="Are you sure you want to reject this account request?"
        confirmText="Reject"
      />


      {/* User Modal */}
      {showUserModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="card animate-in" style={{ width: '400px', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem' }}>
              {editingUser ? 'Edit User' : 'Add New User'}
            </h3>
            <form onSubmit={handleUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.5rem' }}>Full Name</label>
                <input
                  type="text"
                  value={userForm.full_name}
                  onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1.5px solid #e2e8f0' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.5rem' }}>Email</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1.5px solid #e2e8f0' }}
                  required
                />
              </div>
              {!editingUser && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.5rem' }}>Password</label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1.5px solid #e2e8f0' }}
                    required={!editingUser}
                  />
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.5rem' }}>Role</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1.5px solid #e2e8f0', background: 'white' }}
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.5rem' }}>Department</label>
                <select
                  value={userForm.department_id}
                  onChange={(e) => setUserForm({ ...userForm, department_id: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1.5px solid #e2e8f0', background: 'white' }}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              {userForm.role === 'employee' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.5rem' }}>Manager Mapping</label>
                  <div style={{ position: 'relative' }}>
                    <div 
                      onClick={() => setIsManagerDropdownOpen(true)}
                      style={{ 
                        width: '100%', 
                        padding: '0.5rem', 
                        borderRadius: '0.5rem', 
                        border: '1.5px solid #e2e8f0', 
                        background: 'white', 
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      {userForm.manager_id 
                        ? managers.find(m => String(m.id) === String(userForm.manager_id))?.full_name || 'Select Manager'
                        : 'No Manager (Fallback to Admin)'}
                      <ChevronDown size={14} />
                    </div>

                    {isManagerDropdownOpen && (
                      <>
                        <div 
                          style={{ position: 'fixed', inset: 0, zIndex: 10 }} 
                          onClick={() => setIsManagerDropdownOpen(false)}
                        />
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '0.5rem', background: 'white', zIndex: 11, boxShadow: 'var(--shadow-lg)', marginTop: '0.25rem' }}>
                          <div style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9', background: 'white', position: 'sticky', top: 0 }}>
                            <input 
                              type="text" 
                              placeholder="Search managers..." 
                              autoFocus
                              value={managerSearch}
                              onChange={e => setManagerSearch(e.target.value)}
                              style={{ width: '100%', padding: '0.4rem', fontSize: '0.8rem', borderRadius: '0.4rem', border: '1px solid var(--border)' }}
                            />
                          </div>
                          <div 
                            onClick={() => { setUserForm({ ...userForm, manager_id: '' }); setIsManagerDropdownOpen(false); setManagerSearch(''); }} 
                            style={{ padding: '0.6rem 0.8rem', cursor: 'pointer', fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--text-secondary)', background: !userForm.manager_id ? 'var(--primary-light)' : 'transparent', borderBottom: '1px solid #f1f5f9' }}
                          >
                            No Manager (Fallback to Admin)
                          </div>
                          {managers
                            .filter(m => !managerSearch || m.full_name?.toLowerCase().includes(managerSearch.toLowerCase()) || m.email?.toLowerCase().includes(managerSearch.toLowerCase()))
                            .sort((a, b) => a.full_name.localeCompare(b.full_name))
                            .map(m => (
                              <div 
                                key={m.id} 
                                onClick={() => { setUserForm({ ...userForm, manager_id: String(m.id) }); setIsManagerDropdownOpen(false); setManagerSearch(''); }} 
                                style={{ padding: '0.6rem 0.8rem', cursor: 'pointer', fontSize: '0.85rem', background: String(userForm.manager_id) === String(m.id) ? 'var(--primary-light)' : 'transparent', borderBottom: '1px solid #f1f5f9' }}
                              >
                                <div style={{ fontWeight: '600' }}>{m.full_name}</div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>{m.email}</div>
                              </div>
                            ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowUserModal(false)} style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', border: '1.5px solid #e2e8f0', background: 'white', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', border: 'none', fontWeight: '600', cursor: 'pointer' }}>{editingUser ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
