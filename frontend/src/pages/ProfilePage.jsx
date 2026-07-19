import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Building, Cpu, Database, Server, BarChart3, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { API_BASE } from '../config';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ProfilePage() {
  const { user, apiClient } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiClient.get(`${API_BASE}/dashboard`);
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load dashboard stats for profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [apiClient]);

  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <motion.div 
      variants={containerVariants} 
      initial="hidden" 
      animate="visible" 
      className="pb-12 max-w-4xl mx-auto space-y-6"
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">User Profile</h1>
        <p className="mt-1 text-sm text-zinc-400">Manage your identity, settings, and organization parameters.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Profile Card */}
        <Card className="bg-zinc-900/40 border-zinc-800 md:col-span-1">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-4">
              <User className="w-10 h-10" />
            </div>
            
            <h2 className="text-lg font-medium text-zinc-100 font-mono">{user?.name || 'Local Operator'}</h2>
            <p className="text-xs text-zinc-500 mb-4">{user?.email || 'local@admin'}</p>
            
            <Badge variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/20 uppercase tracking-widest font-mono text-[10px] px-2.5 py-0.5">
              {user?.role || 'Admin'}
            </Badge>
          </CardContent>
        </Card>

        {/* Detailed Stats & Metadata */}
        <div className="md:col-span-2 space-y-6">
          
          {/* User Details */}
          <Card className="bg-zinc-900/40 border-zinc-800">
            <CardHeader className="pb-3 border-b border-zinc-800">
              <CardTitle className="text-base font-medium">Account Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Mail className="w-4 h-4" />
                  <span>Email Address</span>
                </div>
                <span className="font-mono text-zinc-200">{user?.email || 'local@admin'}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Shield className="w-4 h-4" />
                  <span>Access Level / Role</span>
                </div>
                <span className="text-zinc-200 capitalize">{user?.role || 'administrator'}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Building className="w-4 h-4" />
                  <span>Organization</span>
                </div>
                <span className="text-zinc-200">{user?.org_name || 'System Local'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Infrastructure context */}
          <Card className="bg-zinc-900/40 border-zinc-800">
            <CardHeader className="pb-3 border-b border-zinc-800">
              <CardTitle className="text-base font-medium">System Environment</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Server className="w-4 h-4" />
                  <span>Deployment Mode</span>
                </div>
                <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 font-mono text-xs">
                  {user?.org_id ? 'Multi-Tenant (DB)' : 'Single-Tenant (Local)'}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Database className="w-4 h-4" />
                  <span>Storage Engine</span>
                </div>
                <span className="text-zinc-300 font-mono text-xs">Local File System</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Cpu className="w-4 h-4" />
                  <span>Face Recognition Core</span>
                </div>
                <span className="text-zinc-300 font-mono text-xs">SOTA MobileNetV2</span>
              </div>
            </CardContent>
          </Card>

          {/* Statistics summary */}
          {stats && (
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-zinc-900/40 border-zinc-800">
                <CardContent className="p-5 flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-zinc-950 text-zinc-400 border border-zinc-800">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Registered Persons</div>
                    <div className="text-lg font-mono font-medium text-zinc-200 mt-0.5">{stats.total_people}</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/40 border-zinc-800">
                <CardContent className="p-5 flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-zinc-950 text-zinc-400 border border-zinc-800">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Total Photo Samples</div>
                    <div className="text-lg font-mono font-medium text-zinc-200 mt-0.5">{stats.total_photos}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      </div>
    </motion.div>
  );
}
