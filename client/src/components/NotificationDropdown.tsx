import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, Clock, Sparkles, BookOpen, X } from 'lucide-react';
import api from '../api/client';
import { INotification } from '../types';

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative retro-btn p-1.5 bg-stone-800 text-stone-200 hover:bg-stone-700 flex items-center justify-center"
        title="Arcade Signals & Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 px-1 items-center justify-center border border-black bg-amber-400 text-[8px] font-pixel font-bold text-black animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 retro-card bg-stone-900 border-2 border-black z-50 overflow-hidden divide-y-2 divide-black shadow-[4px_4px_0px_#000]">
          <div className="p-3 bg-stone-950 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-pixel text-[9px] text-amber-300">[ARCADE TRANSMISSIONS]</span>
              {unreadCount > 0 && (
                <span className="retro-chip px-1.5 py-0.5 text-[8px] font-pixel bg-amber-400 text-black border border-black">
                  {unreadCount} NEW
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="font-pixel text-[8px] text-stone-400 hover:text-amber-400 flex items-center gap-1"
              >
                <Check size={11} /> CLEAR ALL
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-stone-800">
            {notifications.length === 0 ? (
              <div className="p-6 text-center font-pixel text-[9px] text-stone-500">
                NO TRANSMISSIONS LOGGED.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`p-3 flex items-start gap-2.5 transition-colors ${
                    !n.isRead ? 'bg-stone-800/80 hover:bg-stone-800' : 'bg-stone-900 hover:bg-stone-800/40'
                  }`}
                >
                  <div className="mt-0.5 p-1 border border-black bg-stone-950 text-amber-400 shrink-0">
                    <Sparkles size={12} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-pixel text-[9px] text-amber-300 truncate">{n.title}</p>
                      {!n.isRead && (
                        <button
                          onClick={(e) => handleMarkAsRead(n._id, e)}
                          title="Mark read"
                          className="text-stone-400 hover:text-amber-400"
                        >
                          <Check size={12} />
                        </button>
                      )}
                    </div>
                    <p className="font-retro-mono text-xs text-stone-300 mt-0.5 line-clamp-2">{n.message}</p>
                    {n.link && (
                      <Link
                        to={n.link}
                        onClick={() => setIsOpen(false)}
                        className="font-pixel text-[8px] text-amber-400 hover:text-white inline-block mt-1 underline"
                      >
                        [OPEN LINK →]
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};