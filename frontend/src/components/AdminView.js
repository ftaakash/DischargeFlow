import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Loader2,
  Users,
  Shield,
  Save,
  CheckCircle2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminView = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingUser, setUpdatingUser] = useState(null);
  const [roleChanges, setRoleChanges] = useState({});
  const [savedUsers, setSavedUsers] = useState({});

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API}/users`, { withCredentials: true });
      setUsers(res.data);
    } catch (error) {
      console.error('Fetch users error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = (userId, newRole) => {
    setRoleChanges({ ...roleChanges, [userId]: newRole });
    setSavedUsers({ ...savedUsers, [userId]: false });
  };

  const saveRoleChange = async (userId) => {
    const newRole = roleChanges[userId];
    if (!newRole) return;

    setUpdatingUser(userId);
    try {
      await axios.put(`${API}/users/${userId}/role`, { role: newRole }, { withCredentials: true });
      toast.success('Role updated', { description: `User role has been updated to ${newRole}.` });
      setSavedUsers({ ...savedUsers, [userId]: true });
      fetchUsers();
      setRoleChanges({ ...roleChanges, [userId]: undefined });
    } catch (error) {
      console.error('Update role error:', error);
      toast.error('Failed to update role', { description: error.response?.data?.detail || 'An error occurred.' });
    } finally {
      setUpdatingUser(null);
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      physician: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      nurse: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      pharmacist: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      admin: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    };
    return colors[role] || colors.nurse;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Admin Panel
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Manage users and system settings
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {['physician', 'nurse', 'pharmacist', 'admin'].map((role) => (
          <div key={role} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                role === 'physician' ? 'bg-blue-500/10' :
                role === 'nurse' ? 'bg-emerald-500/10' :
                role === 'pharmacist' ? 'bg-amber-500/10' :
                'bg-rose-500/10'
              }`}>
                {role === 'admin' ? (
                  <Shield className={`w-5 h-5 ${
                    role === 'physician' ? 'text-blue-400' :
                    role === 'nurse' ? 'text-emerald-400' :
                    role === 'pharmacist' ? 'text-amber-400' :
                    'text-rose-400'
                  }`} strokeWidth={1.5} />
                ) : (
                  <Users className={`w-5 h-5 ${
                    role === 'physician' ? 'text-blue-400' :
                    role === 'nurse' ? 'text-emerald-400' :
                    'text-amber-400'
                  }`} strokeWidth={1.5} />
                )}
              </div>
              <div>
                <p className="text-2xl font-semibold text-zinc-50">
                  {users.filter(u => u.role === role).length}
                </p>
                <p className="text-xs text-zinc-500 capitalize">{role}s</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-lg font-medium text-zinc-50">User Management</h2>
          <p className="text-xs text-zinc-500 mt-0.5">{users.length} total users</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-800/50">
                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider p-4">User</th>
                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider p-4">Email</th>
                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider p-4">Current Role</th>
                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider p-4">Change Role</th>
                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {users.map((u) => (
                <tr key={u.user_id} data-testid={`user-row-${u.user_id}`} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {u.picture ? (
                        <img src={u.picture} alt={u.name} className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 text-sm">
                          {u.name?.charAt(0) || 'U'}
                        </div>
                      )}
                      <span className="text-zinc-200">{u.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-zinc-400 text-sm">{u.email}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border capitalize ${getRoleBadgeColor(u.role)}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <Select
                      value={roleChanges[u.user_id] || u.role}
                      onValueChange={(value) => handleRoleChange(u.user_id, value)}
                    >
                      <SelectTrigger 
                        data-testid={`role-select-${u.user_id}`}
                        className="w-36 bg-zinc-800 border-zinc-700"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        <SelectItem value="physician">Physician</SelectItem>
                        <SelectItem value="nurse">Nurse</SelectItem>
                        <SelectItem value="pharmacist">Pharmacist</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-4">
                    {roleChanges[u.user_id] && roleChanges[u.user_id] !== u.role ? (
                      <Button
                        data-testid={`save-role-${u.user_id}`}
                        size="sm"
                        onClick={() => saveRoleChange(u.user_id)}
                        disabled={updatingUser === u.user_id}
                        className="bg-blue-600 hover:bg-blue-500"
                      >
                        {updatingUser === u.user_id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-1" />
                            Save
                          </>
                        )}
                      </Button>
                    ) : savedUsers[u.user_id] ? (
                      <span className="flex items-center gap-1 text-emerald-400 text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        Saved
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminView;
