import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Calendar, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// Mock Data Generator
const generateMockData = () => {
  const names = ["Alice_Smith", "Bob_Jones", "Charlie_Brown", "Diana_Prince", "Eve_Adams"];
  const gates = ["Main_Gate", "Back_Entrance", "Loading_Dock"];
  
  return Array.from({ length: 45 }).map((_, i) => {
    const checkInHour = 8 + Math.floor(Math.random() * 3); // 8 AM to 10 AM
    const checkOutHour = 16 + Math.floor(Math.random() * 3); // 4 PM to 6 PM
    const isComplete = Math.random() > 0.2; // 80% complete

    const checkIn = new Date();
    checkIn.setHours(checkInHour, Math.floor(Math.random() * 60), 0, 0);
    
    let checkOut = null;
    let hoursWorked = 0;
    let status = "Incomplete";

    if (isComplete) {
      checkOut = new Date();
      checkOut.setHours(checkOutHour, Math.floor(Math.random() * 60), 0, 0);
      hoursWorked = ((checkOut - checkIn) / (1000 * 60 * 60)).toFixed(1);
      status = checkInHour <= 8 ? "On Time" : "Late";
    }

    return {
      id: i,
      employeeName: names[Math.floor(Math.random() * names.length)],
      gateId: gates[Math.floor(Math.random() * gates.length)],
      checkIn: checkIn.toISOString(),
      checkOut: checkOut ? checkOut.toISOString() : null,
      hoursWorked: hoursWorked,
      status: status
    };
  }).sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn));
};

export default function AttendancePage() {
  const [data, setData] = useState([]);
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    // In production, this would fetch from /api/attendance
    setData(generateMockData());
  }, []);

  const filteredData = data.filter(record => {
    if (!dateFilter) return true;
    const recordDate = new Date(record.checkIn).toISOString().split('T')[0];
    return recordDate === dateFilter;
  });

  const exportCSV = () => {
    if (filteredData.length === 0) return;
    const headers = ['Employee Name', 'Gate/Device', 'Check-In', 'Check-Out', 'Hours Worked', 'Status'];
    const rows = filteredData.map(r => [
      r.employeeName, 
      r.gateId, 
      new Date(r.checkIn).toLocaleTimeString(), 
      r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : 'N/A', 
      r.hoursWorked || '0', 
      r.status
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_export_${dateFilter || 'all'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getBadgeStatus = (status) => {
    if (status === 'On Time') return 'success';
    if (status === 'Late') return 'warning';
    return 'default';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="pb-12 max-w-6xl mx-auto space-y-6">
      
      <motion.div variants={itemVariants} className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">Attendance Log</h1>
          <p className="mt-1 text-sm text-zinc-400">Detailed entry and exit records.</p>
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            <Calendar className="w-4 h-4 absolute left-3 text-zinc-500 pointer-events-none" />
            <Input 
              type="date"
              className="pl-9 bg-zinc-950 border-zinc-800 text-zinc-100 min-w-[200px]"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
          {dateFilter && (
            <Button variant="ghost" onClick={() => setDateFilter('')} className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">
              Clear Filter
            </Button>
          )}
        </div>
        <Button variant="secondary" onClick={exportCSV} className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200">
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </motion.div>

      {/* Dense Data Table */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-900/40 border-zinc-800 overflow-hidden">
          <CardContent className="p-0">
            {filteredData.length === 0 ? (
              <div className="text-center py-16 text-zinc-500">
                No attendance records found for the selected date.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[600px] scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="sticky top-0 bg-zinc-950/95 backdrop-blur z-10 shadow-sm border-b border-zinc-800">
                    <tr>
                      <th className="px-6 py-4 text-zinc-400 font-medium tracking-wide">Employee Name</th>
                      <th className="px-6 py-4 text-zinc-400 font-medium tracking-wide">Location</th>
                      <th className="px-6 py-4 text-zinc-400 font-medium tracking-wide">Check-In Time</th>
                      <th className="px-6 py-4 text-zinc-400 font-medium tracking-wide">Check-Out Time</th>
                      <th className="px-6 py-4 text-zinc-400 font-medium tracking-wide">Hours Logged</th>
                      <th className="px-6 py-4 text-zinc-400 font-medium tracking-wide text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {filteredData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-zinc-800/30 transition-colors group">
                        <td className="px-6 py-4 font-medium text-zinc-200 group-hover:text-violet-400 transition-colors">
                          {row.employeeName.replace(/_/g, ' ')}
                        </td>
                        <td className="px-6 py-4 text-zinc-400">{row.gateId.replace(/_/g, ' ')}</td>
                        <td className="px-6 py-4 text-zinc-400 font-mono">
                          {new Date(row.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4 text-zinc-400 font-mono">
                          {row.checkOut ? new Date(row.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </td>
                        <td className="px-6 py-4 text-zinc-400 font-mono">
                          {row.hoursWorked > 0 ? `${row.hoursWorked}h` : '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Badge 
                            variant={getBadgeStatus(row.status) === 'success' ? 'default' : getBadgeStatus(row.status) === 'warning' ? 'secondary' : 'outline'}
                            className={getBadgeStatus(row.status) === 'success' ? 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30 border-transparent' : 
                                       getBadgeStatus(row.status) === 'warning' ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 border-transparent' : 
                                       'text-zinc-500 border-zinc-700'}
                          >
                            {row.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
