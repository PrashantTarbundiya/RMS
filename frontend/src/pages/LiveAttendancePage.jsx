import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Clock, LogIn, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="pb-12 space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
        <div>
          <h1 className="m-0 text-2xl font-semibold tracking-tight text-zinc-100 flex items-center gap-3">
            Live Operations <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </h1>
          <p className="mt-1 text-zinc-400 text-sm">Real-time telemetry of personnel on premises.</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => { setLiveData(generateLiveMockData()); setNow(new Date()); }}
        >
          <Radio className="mr-2 h-4 w-4" /> Force Refresh
        </Button>
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
                <Card className={`relative overflow-hidden bg-zinc-900/40 border-zinc-800 transition-colors hover:bg-zinc-800/40 ${isRecent ? 'ring-1 ring-emerald-500/50' : ''}`}>
                  {isRecent && (
                    <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />
                  )}
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-mono font-medium text-zinc-300 border border-zinc-700/50 shadow-sm">
                          {getInitials(person.employeeName)}
                        </div>
                        <div>
                          <div className="font-mono font-medium text-zinc-100 text-sm">
                            {person.employeeName}
                          </div>
                          <div className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                            <LogIn className="w-3 h-3" /> {new Date(person.checkIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] px-1.5 py-0">
                        {person.status}
                      </Badge>
                    </div>
                    
                    <div className="pt-3 mt-3 border-t border-zinc-800/50 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-zinc-500 mb-0.5 uppercase tracking-wider text-[10px]">Gate ID</div>
                        <div className="text-zinc-300 font-mono">{person.gateId}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-zinc-500 mb-0.5 uppercase tracking-wider text-[10px]">Duration</div>
                        <div className="text-zinc-300 font-mono flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          {formatDuration(person.checkIn, now)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {liveData.length === 0 && (
        <div className="text-center py-20 text-zinc-500 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
          <User className="mx-auto h-8 w-8 mb-3 opacity-50" />
          <p className="text-sm">No personnel currently detected on site.</p>
        </div>
      )}
    </motion.div>
  );
}
