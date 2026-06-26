"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Calendar as CalendarIcon, MapPin, Search, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import Link from "next/link";

export default function CalendarPage() {
  const [drives, setDrives] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/volunteer-drives")
      .then(res => res.json())
      .then(data => {
        // Filter out completed/cancelled drives from the calendar
        const active = data.filter((d: any) => 
          ["ORG_APPROVED", "VOLUNTEER_REG_OPEN", "DRIVE_IN_PROGRESS", "REG_CLOSED"].includes(d.status)
        );
        setDrives(active);
        setLoading(false);
      });
  }, []);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getEventsForDay = (day: number) => {
    return drives.filter((d: any) => {
      const driveDate = new Date(d.date);
      return driveDate.getDate() === day &&
             driveDate.getMonth() === currentDate.getMonth() &&
             driveDate.getFullYear() === currentDate.getFullYear();
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">Community Calendar</h1>
            <p className="text-slate-500 mt-2 text-lg">Discover and join upcoming community drives in your city.</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={prevMonth} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100">
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h2 className="text-xl font-bold text-slate-800 w-48 text-center">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={nextMonth} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-100">
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-7 bg-slate-100 border-b border-slate-200">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="py-4 text-center text-sm font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 last:border-0">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 auto-rows-fr">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[120px] p-2 border-r border-b border-slate-100 bg-slate-50"></div>
              ))}
              
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const events = getEventsForDay(day);
                const isToday = new Date().getDate() === day && 
                                new Date().getMonth() === currentDate.getMonth() &&
                                new Date().getFullYear() === currentDate.getFullYear();
                
                return (
                  <div key={day} className={`min-h-[120px] p-2 border-r border-b border-slate-100 transition-colors ${isToday ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}>
                    <div className={`text-sm font-bold mb-2 ${isToday ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {day}
                    </div>
                    <div className="space-y-1">
                      {events.map((event: any) => (
                        <Link href={`/community/drive/${event._id}`} key={event._id}>
                          <div className="text-xs p-2 bg-emerald-100 text-emerald-800 rounded-lg font-semibold truncate hover:bg-emerald-200 transition-colors cursor-pointer mb-1 border border-emerald-200 shadow-sm">
                            {event.time} - {event.title}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
