import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/supabaseClient';
import { Search, RefreshCw, Activity, UserMinus } from 'lucide-react';

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, email, role, created_at, last_active_date');
    
    if (profiles) {
      setUsers(profiles.map(p => ({
        ...p,
        email: p.email || 'N/A'
      })));
    }
    setLoading(false);
  };

  const getUserStatus = (lastActiveDate: string | null) => {
    if (!lastActiveDate) return { status: 'Inactive', text: 'Never active' };
    
    const diffTime = new Date().getTime() - new Date(lastActiveDate).getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) {
      return { 
        status: 'Active', 
        text: `Active (${diffDays === 0 ? 'Today' : diffDays === 1 ? '1 day ago' : diffDays + ' days ago'})` 
      };
    } else {
      return { 
        status: 'Inactive', 
        text: `Inactive (${diffDays} days ago)` 
      };
    }
  };

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeUsersCount = users.filter(u => getUserStatus(u.last_active_date).status === 'Active').length;

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">User Management</h1>
            <p className="text-sm text-zinc-500 mt-0.5">View user accounts and their activity status</p>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 rounded-lg bg-emerald-900/30 border border-emerald-800/50 text-sm text-emerald-400">
              {activeUsersCount} active
            </span>
            <span className="px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-400">
              {users.length} total
            </span>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by username or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
          />
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-zinc-500">
              <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2" />
              Loading users...
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-900 text-zinc-500 text-xs uppercase">
                  <th className="text-left p-3">Username</th>
                  <th className="text-left p-3 hidden sm:table-cell">Email</th>
                  <th className="text-left p-3">Role</th>
                  <th className="text-left p-3 hidden md:table-cell">Joined</th>
                  <th className="text-right p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => {
                  const statusInfo = getUserStatus(user.last_active_date);
                  return (
                    <tr key={user.id} className="border-t border-zinc-800 hover:bg-zinc-800/30">
                      <td className="p-3">
                        <p className="font-semibold text-white">{user.username || 'Unnamed'}</p>
                      </td>
                      <td className="p-3 hidden sm:table-cell">
                        <p className="text-xs text-zinc-400">{user.email}</p>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          user.role === 'super_admin' ? 'bg-amber-900/30 text-amber-400' :
                          user.role === 'admin' ? 'bg-blue-900/30 text-blue-400' :
                          'bg-zinc-800 text-zinc-400'
                        }`}>
                          {user.role || 'user'}
                        </span>
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        <span className="text-xs text-zinc-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {statusInfo.status === 'Active' ? (
                            <Activity className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <UserMinus className="w-3.5 h-3.5 text-zinc-500" />
                          )}
                          <span className={`text-xs ${statusInfo.status === 'Active' ? 'text-emerald-400' : 'text-zinc-500'}`}>
                            {statusInfo.text}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {!loading && filteredUsers.length === 0 && (
            <div className="py-12 text-center text-zinc-500">
              <p>No users found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;