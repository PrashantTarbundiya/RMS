import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Calendar, Filter } from 'lucide-react';


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
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="pb-12 max-w-6xl mx-auto space-y-6 page-container">
      
      <motion.div variants={itemVariants} className="flex justify-between items-center">
        <div>
          <h1 className="text-headline font-semibold text-ink font-display">Attendance Log</h1>
          <p className="mt-1 text-caption text-ink-subtle">Detailed entry and exit records.</p>
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            <Calendar className="w-4 h-4 absolute left-3 text-ink-tertiary pointer-events-none" />
            <input 
              type="date"
              className="pl-9 input-linear min-w-[200px]"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
          {dateFilter && (
            <button onClick={() => setDateFilter('')} className="button-secondary text-caption">
              Clear Filter
            </button>
          )}
        </div>
        <button onClick={exportCSV} className="button-primary text-white flex items-center gap-2 h-9 text-caption">
          <Download className="w-4 h-4 text-white" /> Export CSV
        </button>
      </motion.div>

      {/* Dense Data Table */}
      <motion.div variants={itemVariants}>
        <div className="card-linear p-0 overflow-hidden bg-[#0F1011] border-[#23252A]">
          {filteredData.length === 0 ? (
            <div className="text-center py-16 text-ink-subtle text-caption">
              No attendance records found for the selected date.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[600px] scrollbar-thin">
              <table className="w-full text-left text-caption whitespace-nowrap">
                <thead className="sticky top-0 bg-[#0F1011] border-b border-[#23252A] z-10">
                  <tr>
                    <th className="px-6 py-4 text-ink-subtle font-semibold uppercase tracking-wider text-[11px]">Employee Name</th>
                    <th className="px-6 py-4 text-ink-subtle font-semibold uppercase tracking-wider text-[11px]">Location</th>
                    <th className="px-6 py-4 text-ink-subtle font-semibold uppercase tracking-wider text-[11px]">Check-In Time</th>
                    <th className="px-6 py-4 text-ink-subtle font-semibold uppercase tracking-wider text-[11px]">Check-Out Time</th>
                    <th className="px-6 py-4 text-ink-subtle font-semibold uppercase tracking-wider text-[11px]">Hours Logged</th>
                    <th className="px-6 py-4 text-ink-subtle font-semibold uppercase tracking-wider text-[11px] text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#23252A]/50">
                  {filteredData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#141516]/60 transition-colors group">
                      <td className="px-6 py-4 font-medium text-ink group-hover:text-[#828FFF] transition-colors">
                        {row.employeeName.replace(/_/g, ' ')}
                      </td>
                      <td className="px-6 py-4 text-ink-muted">{row.gateId.replace(/_/g, ' ')}</td>
                      <td className="px-6 py-4 text-ink-muted font-mono">
                        {new Date(row.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 text-ink-muted font-mono">
                        {row.checkOut ? new Date(row.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </td>
                      <td className="px-6 py-4 text-ink-muted font-mono">
                        {row.hoursWorked > 0 ? `${row.hoursWorked}h` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span 
                          className={`inline-flex px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold border ${
                            getBadgeStatus(row.status) === 'success' ? 'bg-[#27A644]/10 text-[#27A644] border-[#27A644]/20' : 
                            getBadgeStatus(row.status) === 'warning' ? 'bg-[#FBBF24]/10 text-[#FBBF24] border-[#FBBF24]/20' : 
                            'bg-[#141516] text-ink-muted border-[#23252A]'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

