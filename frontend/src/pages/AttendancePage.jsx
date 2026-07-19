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
    return 'error';
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
    <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ paddingBottom: 'var(--space-8)' }}>
      
      <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 'var(--text-2xl)' }}>Attendance Log</h1>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)' }}>Detailed entry and exit records.</p>
        </div>
      </motion.div>

      {/* Controls */}
      <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Calendar size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)', zIndex: 1 }} />
            <Input 
              type="date"
              style={{ paddingLeft: '36px', marginBottom: 0 }}
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
          {dateFilter && (
            <button className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-4 py-2 rounded-md font-medium" variant="ghost" onClick={() => setDateFilter('')}>Clear Filter</button>
          )}
        </div>
        <button className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 px-4 py-2 rounded-md font-medium" variant="secondary" onClick={exportCSV}>
          <Download size={16} style={{ marginRight: '8px' }} /> Export CSV
        </button>
      </motion.div>

      {/* Dense Data Table */}
      <motion.div variants={itemVariants}>
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 shadow-sm" padding="0" style={{ overflow: 'hidden' }}>
          {filteredData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8) 0', color: 'var(--text-muted)' }}>
              No attendance records found for the selected date.
            </div>
          ) : (
            <div style={{ overflowX: 'auto', maxHeight: '600px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-elevated)', zIndex: 10 }}>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-muted)', fontWeight: 500 }}>Employee Name</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-muted)', fontWeight: 500 }}>Location</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-muted)', fontWeight: 500 }}>Check-In Time</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-muted)', fontWeight: 500 }}>Check-Out Time</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-muted)', fontWeight: 500 }}>Hours Logged</th>
                    <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 500 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row, idx) => (
                    <tr key={idx} className="ui-table-row" style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background var(--duration) var(--ease)' }}>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 500 }}>
                        {row.employeeName.replace(/_/g, ' ')}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-muted)' }}>{row.gateId.replace(/_/g, ' ')}</td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {new Date(row.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {row.checkOut ? new Date(row.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {row.hoursWorked > 0 ? `${row.hoursWorked}h` : '-'}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                        <span className="bg-zinc-800 text-zinc-300 px-2 py-1 rounded-md text-xs" status={getBadgeStatus(row.status)}>{row.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <style>{`
                .ui-table-row:hover {
                  background: var(--bg-elevated);
                }
              `}</style>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
