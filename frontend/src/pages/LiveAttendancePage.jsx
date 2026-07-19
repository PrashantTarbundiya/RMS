import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Clock, LogIn, User } from 'lucide-react';


// Mock Live Data Generator
const generateLiveMockData = () => {
  const names = ["Alice_Smith", "Bob_Jones", "Charlie_Brown", "Diana_Prince", "Eve_Adams"];
  
  // Randomly select 2 to 4 people currently on site
  const onSiteCount = Math.floor(Math.random() * 3) + 2;
  const shuffledNames = names.sort(() => 0.5 - Math.random()).slice(0, onSiteCount);
  
  return shuffledNames.map((name, i) => {
    const checkIn = new Date();
    // Checked in anywhere from 1 minute to 4 hours ago
    checkIn.setMinutes(checkIn.getMinutes() - (Math.random() * 240 + 1));
    
    return {
      id: name, // stable ID for AnimatePresence
      employeeName: name,
      gateId: "Main_Gate",
      checkIn: checkIn.toISOString(),
      checkOut: null,
      hoursWorked: 0,
      status: "On Site"
    };
  }).sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn));
};

const getInitials = (nameStr) => {
  return nameStr.split('_').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

const formatDuration = (checkInStr, now) => {
  const checkIn = new Date(checkInStr);
  const diffMs = now - checkIn;
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffMins = Math.floor((diffMs % 3600000) / 60000);
  return `${diffHrs}h ${diffMins}m`;
};

export default function LiveAttendancePage() {
  const [liveData, setLiveData] = useState([]);
  const [now, setNow] = useState(new Date());

  // Poll mock data every 15 seconds to simulate someone checking in/out
  useEffect(() => {
    setLiveData(generateLiveMockData());
    
    const dataInterval = setInterval(() => {
      // Simulate a new person checking in by pushing to front
      setLiveData(prev => {
        const newData = generateLiveMockData();
        // Just for demo: artificially make one recent
        if (newData.length > 0) {
           newData[0].checkIn = new Date().toISOString();
        }
        return newData;
      });
    }, 15000);
    
    return () => clearInterval(dataInterval);
  }, []);

  // Update current time every minute for duration formatting
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(timerInterval);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: -20, opacity: 0, scale: 1.05, boxShadow: '0 0 40px rgba(255,255,255, 0.1)' },
    visible: { 
      y: 0, 
      opacity: 1, 
      scale: 1,
      boxShadow: '0 0 0px transparent',
      transition: { 
        type: 'spring', stiffness: 300, damping: 24,
        boxShadow: { duration: 2, ease: "easeOut" } 
      } 
    },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="pb-12 space-y-6 page-container">
      <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
        <div>
          <h1 className="m-0 text-headline font-semibold text-ink font-display flex items-center gap-3">
            Live Operations <span className="w-2.5 h-2.5 rounded-full bg-[#27A644] animate-pulse" />
          </h1>
          <p className="mt-1 text-caption text-ink-subtle">Real-time telemetry of personnel on premises.</p>
        </div>
        <button 
          onClick={() => { setLiveData(generateLiveMockData()); setNow(new Date()); }}
          className="button-secondary text-caption flex items-center gap-2"
        >
          <Radio className="h-4 w-4" /> Force Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence>
          {liveData.map((person) => {
            const isRecent = (now - new Date(person.checkIn)) < 60000; // checked in last minute
            
            return (
              <motion.div
                key={person.id}
                layout
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className={`relative overflow-hidden card-linear p-5 hover:bg-[#141516]/60 transition-colors ${isRecent ? 'ring-1 ring-[#27A644]/50' : ''}`}>
                  {isRecent && (
                    <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#27A644] to-transparent opacity-50" />
                  )}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#141516] flex items-center justify-center font-mono font-medium text-ink-subtle border border-[#23252A] shadow-sm">
                        {getInitials(person.employeeName)}
                      </div>
                      <div>
                        <div className="font-mono font-medium text-ink text-sm">
                          {person.employeeName.replace(/_/g, ' ')}
                        </div>
                        <div className="text-xs text-ink-tertiary flex items-center gap-1 mt-0.5">
                          <LogIn className="w-3 h-3 text-ink-tertiary" /> {new Date(person.checkIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    </div>
                    <span className="inline-flex px-1.5 py-0.5 rounded font-mono text-[9px] font-semibold bg-[#27A644]/10 text-[#27A644] border border-[#27A644]/20">
                      {person.status}
                    </span>
                  </div>
                  
                  <div className="pt-3 mt-3 border-t border-[#23252A]/50 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-ink-tertiary mb-0.5 uppercase tracking-wider text-[10px]">Gate ID</div>
                      <div className="text-ink-subtle font-mono">{person.gateId.replace(/_/g, ' ')}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-ink-tertiary mb-0.5 uppercase tracking-wider text-[10px]">Duration</div>
                      <div className="text-ink-subtle font-mono flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3 text-ink-tertiary" />
                        {formatDuration(person.checkIn, now)}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {liveData.length === 0 && (
        <div className="text-center py-20 text-ink-subtle border border-dashed border-[#23252A] rounded-xl bg-[#0F1011]/20">
          <User className="mx-auto h-8 w-8 mb-3 opacity-50 text-ink-tertiary" />
          <p className="text-caption">No personnel currently detected on site.</p>
        </div>
      )}
    </motion.div>
  );
}
