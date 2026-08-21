'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DropdownMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'warning';
  disabled?: boolean;
}

interface DropdownMenuProps {
  items: DropdownMenuItem[];
  align?: 'left' | 'right';
  triggerIcon?: React.ReactNode;
  className?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  items,
  align = 'right',
  triggerIcon,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  }>({});

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const estimatedMenuHeight = items.length * 38 + 16;

      // Smart vertical positioning: if near bottom edge of viewport, open UPWARDS
      const showAbove = spaceBelow < estimatedMenuHeight && rect.top > estimatedMenuHeight;

      const newCoords: { top?: number; bottom?: number; left?: number; right?: number } = {};

      if (showAbove) {
        newCoords.bottom = window.innerHeight - rect.top + 4;
      } else {
        newCoords.top = rect.bottom + 4;
      }

      if (align === 'right') {
        newCoords.right = window.innerWidth - rect.right;
      } else {
        newCoords.left = rect.left;
      }

      setCoords(newCoords);
    }
  };

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen((prev) => !prev);
  };

  // Close dropdown when clicking outside or scrolling
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      if (isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={cn('relative inline-block text-left', className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleOpen}
        className="inline-flex items-center justify-center p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden transition-colors cursor-pointer"
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Opsi Aksi"
      >
        {triggerIcon || <MoreVertical size={16} />}
      </button>

      {isOpen &&
        mounted &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              ...(coords.top !== undefined ? { top: `${coords.top}px` } : {}),
              ...(coords.bottom !== undefined ? { bottom: `${coords.bottom}px` } : {}),
              ...(coords.right !== undefined ? { right: `${coords.right}px` } : {}),
              ...(coords.left !== undefined ? { left: `${coords.left}px` } : {})
            }}
            className="min-w-[140px] rounded-lg bg-white border border-slate-200 shadow-xl py-1 z-[9999] animate-fade-in focus:outline-hidden"
            role="menu"
            tabIndex={-1}
          >
            {items.map((item, index) => {
              const isDanger = item.variant === 'danger';
              const isWarning = item.variant === 'warning';

              return (
                <button
                  key={index}
                  type="button"
                  disabled={item.disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                    if (!item.disabled) {
                      item.onClick();
                    }
                  }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors text-left cursor-pointer border-none bg-transparent',
                    isDanger
                      ? 'text-red-600 hover:bg-red-50'
                      : isWarning
                      ? 'text-amber-600 hover:bg-amber-50'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900',
                    item.disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent'
                  )}
                  role="menuitem"
                >
                  {item.icon && <span className="shrink-0">{item.icon}</span>}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
};
