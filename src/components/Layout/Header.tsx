import { Bell, Calendar, Clock } from 'lucide-react';
import { useEffect, useState, ReactNode } from 'react';
import { format } from 'date-fns';

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function Header({ title, subtitle, action }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-white border-b border-gray-100 px-8 py-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
        </div>
        
        <div className="flex items-center gap-6">
          {/* Custom Action */}
          {action && action}
          
          {/* Date & Time */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-yellow-500" />
              <span>{format(currentTime, 'MMM dd, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-yellow-500" />
              <span>{format(currentTime, 'HH:mm:ss')}</span>
            </div>
          </div>
          
          {/* Notifications */}
          <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full"></span>
          </button>
        </div>
      </div>
    </header>
  );
}
