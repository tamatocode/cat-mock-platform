import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Library, PlusCircle, FilePlus, FileText, GraduationCap, Menu, X } from 'lucide-react';
import { getStorageUsage } from '../../lib/storage';
import { cn } from '../../lib/utils';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [storage, setStorage] = useState({ percentage: 0, usedMB: 0, maxMB: 5 });

  useEffect(() => {
    // Update storage info periodically
    const updateStorage = () => setStorage(getStorageUsage());
    updateStorage();
    const interval = setInterval(updateStorage, 5000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/question-bank', icon: Library, label: 'Question Bank' },
    { to: '/add-question', icon: PlusCircle, label: 'Add Question' },
    { to: '/create-test', icon: FilePlus, label: 'Create Test' },
    { to: '/tests', icon: FileText, label: 'My Tests' },
  ];

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-surface rounded-md border border-border text-text hover:text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 bg-surface border-r border-border flex flex-col transition-transform duration-300 z-40",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-border">
          <GraduationCap className="text-accent mr-3" size={28} />
          <h1 className="text-xl font-bold text-white tracking-tight">CAT Mock</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center px-3 py-2.5 rounded-md transition-colors text-sm font-medium",
                isActive 
                  ? "bg-accent-muted text-accent" 
                  : "text-text hover:bg-surface-hover hover:text-white"
              )}
            >
              <link.icon size={18} className="mr-3" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Storage Bar */}
        <div className="p-4 border-t border-border">
          <div className="flex justify-between items-center text-xs text-text-secondary mb-2">
            <span>Storage Usage</span>
            <span>{storage.usedMB}MB / {storage.maxMB}MB</span>
          </div>
          <div className="h-2 w-full bg-bg rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-500",
                storage.percentage > 80 ? "bg-error" : storage.percentage > 50 ? "bg-warning" : "bg-accent"
              )}
              style={{ width: `${storage.percentage}%` }}
            />
          </div>
        </div>
      </aside>
    </>
  );
}
