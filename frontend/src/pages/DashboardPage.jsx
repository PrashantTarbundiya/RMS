import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, Image as ImageIcon, BarChart3, Clock, CheckCircle, 
  AlertTriangle, Trash2, Edit2, Check, X, RefreshCw 
} from 'lucide-react';
import { API_BASE } from '../config';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function DashboardPage() {
  const { apiClient } = useAuth();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [editingPerson, setEditingPerson] = useState(null);
  const [newName, setNewName] = useState('');
  const [deletingPerson, setDeletingPerson] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setError('');
      const [statsRes, historyRes] = await Promise.all([
        apiClient.get(`${API_BASE}/dashboard`),
        apiClient.get(`${API_BASE}/history`)
      ]);
      setStats(statsRes.data);
      setHistory(historyRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard data. Ensure the system is online.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRename = async (oldName) => {
    if (!newName.trim() || newName.trim() === oldName) {
      setEditingPerson(null);
      return;
    }
    setIsActionLoading(true);
    try {
      await apiClient.put(`${API_BASE}/persons/${oldName}`, { new_name: newName.trim() });
      setEditingPerson(null);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async (name) => {
    setIsActionLoading(true);
    try {
      await apiClient.delete(`${API_BASE}/persons/${name}`);
      setDeletingPerson(null);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const executeClearHistory = async () => {
    try {
      await apiClient.delete(`${API_BASE}/history`);
      setHistory([]);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsClearHistoryModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-500 border-t-transparent" />
        <p className="mt-4 text-sm font-mono tracking-tight">Loading System Data...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6">
        <Card className="border-red-500/20 bg-red-500/5 text-center p-6 shadow-sm">
          <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-red-500" />
          <h2 className="text-lg font-medium text-red-500 mb-2">System Offline</h2>
          <p className="text-red-500/80 mb-4">{error}</p>
          <Button variant="outline" className="border-red-500/20 text-red-500 hover:bg-red-500/10" onClick={() => { setLoading(true); fetchDashboardData(); }}>
            Retry Connection
          </Button>
        </Card>
      </div>
    );
  }

  const { total_people, total_photos, photos_per_person, requires_retrain, models_loaded, history_stats } = stats;
  const { total_predictions, success_count, error_count } = history_stats;
  const successRate = total_predictions > 0 ? Math.round((success_count / total_predictions) * 100) : 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="pb-12 space-y-6">
      
      {/* Header */}
      <motion.div variants={itemVariants} className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">System Dashboard</h1>
          <p className="text-zinc-400 text-sm mt-1">Real-time telemetry and management.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setLoading(true); fetchDashboardData(); }}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </motion.div>

      {/* System Status Line (Calm) */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-4 p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg items-center text-sm">
        <div className="flex items-center gap-2">
          <span className="text-zinc-400">Status:</span> 
          {requires_retrain ? <Badge variant="destructive" className="bg-amber-500/20 text-amber-500 hover:bg-amber-500/30">Retraining Required</Badge> : <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Operational</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-400">DeepFace:</span>
          {models_loaded.deepface ? <span className="text-emerald-500 font-medium">Loaded</span> : <span className="text-red-500 font-medium">Offline</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-400">SOTA:</span>
          {models_loaded.sota ? <span className="text-emerald-500 font-medium">Loaded</span> : <span className="text-red-500 font-medium">Offline</span>}
        </div>
      </motion.div>

      {/* KPI Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<Users className="h-5 w-5"/>} label="Total Enrolled" value={total_people} />
        <KpiCard icon={<ImageIcon className="h-5 w-5"/>} label="Faces Processed" value={total_photos} />
        <KpiCard icon={<Clock className="h-5 w-5"/>} label="Scan Events" value={total_predictions} />
        <KpiCard icon={<CheckCircle className="h-5 w-5"/>} label="Accuracy Rate" value={`${successRate}%`} color="text-emerald-500" />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Person Management Table */}
        <Card className="bg-zinc-900/40 border-zinc-800 overflow-hidden flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-zinc-800">
            <CardTitle className="text-base font-medium">Enrollment Roster</CardTitle>
            <Link to="/upload">
              <Button variant="outline" size="sm">Add Person</Button>
            </Link>
          </CardHeader>
          <div className="overflow-x-auto max-h-[400px] relative">
            <Table>
              <TableHeader className="bg-zinc-900/80 sticky top-0 z-10 backdrop-blur-sm">
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Identifier</TableHead>
                  <TableHead className="text-zinc-400">Samples</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.keys(photos_per_person).map(name => {
                  const isEditing = editingPerson === name;
                  const isDeleting = deletingPerson === name;
                  
                  return (
                    <TableRow key={name} className="border-zinc-800/50 hover:bg-zinc-800/20">
                      <TableCell className="font-mono text-sm">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <Input 
                              value={newName} 
                              onChange={e => setNewName(e.target.value.replace(/\s+/g, '_'))}
                              className="h-8 py-1 px-2 text-xs bg-zinc-950 border-zinc-700"
                              autoFocus
                            />
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleRename(name)} disabled={isActionLoading}><Check className="h-4 w-4"/></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingPerson(null)}><X className="h-4 w-4"/></Button>
                          </div>
                        ) : (
                          <span className="text-zinc-200">{name}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        {photos_per_person[name]}
                      </TableCell>
                      <TableCell className="text-right">
                        {isDeleting ? (
                          <div className="inline-flex items-center gap-2">
                            <span className="text-red-500 text-xs font-medium">Confirm?</span>
                            <Button variant="destructive" size="sm" className="h-8" onClick={() => handleDelete(name)} disabled={isActionLoading}>Delete</Button>
                            <Button variant="ghost" size="sm" className="h-8" onClick={() => setDeletingPerson(null)}>Cancel</Button>
                          </div>
                        ) : (
                          <div className="inline-flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-100" onClick={() => { setEditingPerson(name); setNewName(name); }}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-500/10 hover:text-red-400" onClick={() => setDeletingPerson(name)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {total_people === 0 && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={3} className="text-center py-8 text-zinc-500 border-none">
                      No personnel enrolled.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Recent Telemetry */}
        <Card className="bg-zinc-900/40 border-zinc-800 overflow-hidden flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-zinc-800">
            <CardTitle className="text-base font-medium">Recent Activity</CardTitle>
            {history.length > 0 && (
              <AlertDialog open={isClearHistoryModalOpen} onOpenChange={setIsClearHistoryModalOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 text-zinc-400 hover:text-zinc-100">Clear</Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear Telemetry Log</AlertDialogTitle>
                    <AlertDialogDescription className="text-zinc-400">
                      Are you sure you want to purge all recognition telemetry logs? This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-transparent text-zinc-300 border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={executeClearHistory} className="bg-red-500 text-white hover:bg-red-600">Confirm Clear</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </CardHeader>
          <div className="overflow-x-auto max-h-[400px] relative">
            <Table>
              <TableHeader className="bg-zinc-900/80 sticky top-0 z-10 backdrop-blur-sm">
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Timestamp</TableHead>
                  <TableHead className="text-zinc-400">Event</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.slice(0, 20).map((entry, idx) => (
                  <TableRow key={idx} className="border-zinc-800/50 hover:bg-zinc-800/20">
                    <TableCell className="text-zinc-500 font-mono text-xs whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={entry.status === 'error' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}>
                          {entry.status === 'error' ? 'NOT FOUND' : 'CONFIRMED'}
                        </Badge>
                        <span className="font-mono text-xs text-zinc-300">{entry.label}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {history.length === 0 && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={2} className="text-center py-8 text-zinc-500 border-none">
                      No recent activity.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

    </motion.div>
  );
}

function KpiCard({ icon, label, value, color = 'text-zinc-100' }) {
  return (
    <Card className="bg-zinc-900/40 border-zinc-800 p-4 flex items-start gap-4">
      <div className="text-zinc-500 mt-1">
        {icon}
      </div>
      <div>
        <div className="text-xs text-zinc-400 uppercase tracking-wider font-medium">{label}</div>
        <div className={`text-2xl font-mono font-medium mt-1 ${color}`}>{value}</div>
      </div>
    </Card>
  );
}
