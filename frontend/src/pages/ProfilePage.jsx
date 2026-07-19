import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Building, Cpu, Database, Server, BarChart3, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { API_BASE } from '../config';

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
      className="pb-12 max-w-4xl mx-auto space-y-6 page-container"
    >
      <div>
        <h1 className="text-headline font-semibold text-ink font-display">User Profile</h1>
        <p className="mt-1 text-caption text-ink-subtle">Manage your identity, settings, and organization parameters.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Profile Card */}
        <div className="card-linear md:col-span-1 flex flex-col items-center text-center justify-center p-6 bg-[#0F1011] border-[#23252A]">
          <div className="w-20 h-20 rounded-full bg-[#5E6AD2]/10 border border-[#5E6AD2]/20 flex items-center justify-center text-[#828FFF] mb-4">
            <User className="w-10 h-10" />
          </div>
          
          <h2 className="text-body font-medium text-ink font-mono">{user?.name || 'Local Operator'}</h2>
          <p className="text-[11px] text-ink-tertiary mb-4">{user?.email || 'local@admin'}</p>
          
          <span className="px-2.5 py-0.5 rounded-full bg-[#5E6AD2]/10 text-[#828FFF] border border-[#5E6AD2]/20 uppercase tracking-widest font-mono text-[9px] font-semibold">
            {user?.role || 'Admin'}
          </span>
        </div>

        {/* Detailed Stats & Metadata */}
        <div className="md:col-span-2 space-y-6">
          
          {/* User Details */}
          <div className="card-linear p-0 bg-[#0F1011] border-[#23252A]">
            <div className="py-4 px-6 border-b border-[#23252A] bg-[#0F1011]">
              <h3 className="text-body font-medium text-ink">Account Details</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between text-caption">
                <div className="flex items-center gap-2 text-ink-subtle">
                  <Mail className="w-4 h-4" />
                  <span>Email Address</span>
                </div>
                <span className="font-mono text-ink">{user?.email || 'local@admin'}</span>
              </div>
              
              <div className="flex items-center justify-between text-caption">
                <div className="flex items-center gap-2 text-ink-subtle">
                  <Shield className="w-4 h-4" />
                  <span>Access Level / Role</span>
                </div>
                <span className="text-ink capitalize">{user?.role || 'administrator'}</span>
              </div>
              
              <div className="flex items-center justify-between text-caption">
                <div className="flex items-center gap-2 text-ink-subtle">
                  <Building className="w-4 h-4" />
                  <span>Organization</span>
                </div>
                <span className="text-ink">{user?.org_name || 'System Local'}</span>
              </div>
            </div>
          </div>

          {/* Infrastructure context */}
          <div className="card-linear p-0 bg-[#0F1011] border-[#23252A]">
            <div className="py-4 px-6 border-b border-[#23252A] bg-[#0F1011]">
              <h3 className="text-body font-medium text-ink">System Environment</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between text-caption">
                <div className="flex items-center gap-2 text-ink-subtle">
                  <Server className="w-4 h-4" />
                  <span>Deployment Mode</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#5E6AD2]/10 text-[#828FFF] border border-[#5E6AD2]/20 font-mono text-[10px]">
                  {user?.org_id ? 'Multi-Tenant (DB)' : 'Single-Tenant (Local)'}
                </span>
              </div>

              <div className="flex items-center justify-between text-caption">
                <div className="flex items-center gap-2 text-ink-subtle">
                  <Database className="w-4 h-4" />
                  <span>Storage Engine</span>
                </div>
                <span className="text-ink font-mono text-xs">Local File System</span>
              </div>

              <div className="flex items-center justify-between text-caption">
                <div className="flex items-center gap-2 text-ink-subtle">
                  <Cpu className="w-4 h-4" />
                  <span>Face Recognition Core</span>
                </div>
                <span className="text-ink font-mono text-xs">SOTA MobileNetV2</span>
              </div>
            </div>
          </div>

          {/* Statistics summary */}
          {stats && (
            <div className="grid grid-cols-2 gap-4">
              <div className="card-linear p-5 flex items-center gap-3 bg-[#0F1011] border-[#23252A]">
                <div className="p-2.5 rounded-lg bg-[#010102] text-ink-subtle border border-[#23252A]">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-ink-tertiary uppercase tracking-wider font-semibold">Registered Persons</div>
                  <div className="text-lg font-mono font-medium text-ink mt-0.5">{stats.total_people}</div>
                </div>
              </div>

              <div className="card-linear p-5 flex items-center gap-3 bg-[#0F1011] border-[#23252A]">
                <div className="p-2.5 rounded-lg bg-[#010102] text-ink-subtle border border-[#23252A]">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-ink-tertiary uppercase tracking-wider font-semibold">Total Photo Samples</div>
                  <div className="text-lg font-mono font-medium text-ink mt-0.5">{stats.total_photos}</div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </motion.div>
  );
}
