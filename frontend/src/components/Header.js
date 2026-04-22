import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, Check, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../components/ui/popover';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL || ""}/api`;

const Header = ({ user, notifications, unreadCount, onNotificationRead }) => {
  const [open, setOpen] = useState(false);

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      onNotificationRead();
    }, 30000);
    return () => clearInterval(interval);
  }, [onNotificationRead]);

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`${API}/notifications/${notificationId}/read`, {}, { withCredentials: true });
      onNotificationRead();
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${API}/notifications/read-all`, {}, { withCredentials: true });
      onNotificationRead();
    } catch (error) {
      console.error('Mark all as read error:', error);
    }
  };

  const getNotificationIcon = (type) => {
    const colors = {
      info: 'text-blue-400',
      success: 'text-emerald-400',
      warning: 'text-amber-400',
      error: 'text-rose-400',
    };
    return colors[type] || colors.info;
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <header className="h-16 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-6">
      <div>
        <h2 className="text-lg font-medium text-zinc-50" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Welcome, {user?.name?.split(' ')[0]}
        </h2>
        <p className="text-xs text-zinc-500">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            data-testid="notifications-btn"
            variant="ghost" 
            size="icon"
            className="relative text-zinc-400 hover:text-zinc-200"
          >
            <Bell className="w-5 h-5" strokeWidth={1.5} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-80 p-0 bg-zinc-900 border-zinc-800" 
          align="end"
        >
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <h3 className="font-medium text-zinc-50">Notifications</h3>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={markAllAsRead}
                className="text-xs text-zinc-400 hover:text-zinc-200"
              >
                Mark all read
              </Button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">No notifications</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((notif) => (
                <div 
                  key={notif.notification_id}
                  data-testid={`notification-${notif.notification_id}`}
                  className={`p-4 border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors ${
                    !notif.read ? 'bg-zinc-800/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${getNotificationIcon(notif.type)} bg-current`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200">{notif.title}</p>
                      <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-xs text-zinc-600 mt-1">{formatTime(notif.created_at)}</p>
                    </div>
                    {!notif.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => markAsRead(notif.notification_id)}
                        className="text-zinc-500 hover:text-zinc-300 h-6 w-6"
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </header>
  );
};

export default Header;
