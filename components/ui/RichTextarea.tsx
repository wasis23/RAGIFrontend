'use client';

import { useEffect, useRef } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, RemoveFormatting } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextareaProps {
  label?: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  required?: boolean;
  minHeight?: number;
  className?: string;
}

/** Editor WYSIWYG ringan (bold/italic/underline/list) tanpa dependensi tambahan. */
export function RichTextarea({
  label,
  value,
  onChange,
  placeholder,
  required,
  minHeight = 90,
  className,
}: RichTextareaProps) {
  const ref = useRef<HTMLDivElement>(null);
  const lastEmitted = useRef<string>(value || '');

  useEffect(() => {
    const el = ref.current;
    if (el && (value || '') !== el.innerHTML && document.activeElement !== el) {
      el.innerHTML = value || '';
      lastEmitted.current = value || '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const exec = (cmd: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false);
    const html = ref.current?.innerHTML || '';
    lastEmitted.current = html;
    onChange(html);
  };

  const tools = [
    { icon: <Bold size={14} />, cmd: 'bold', title: 'Tebal' },
    { icon: <Italic size={14} />, cmd: 'italic', title: 'Miring' },
    { icon: <Underline size={14} />, cmd: 'underline', title: 'Garis bawah' },
    { icon: <List size={14} />, cmd: 'insertUnorderedList', title: 'Daftar poin' },
    { icon: <ListOrdered size={14} />, cmd: 'insertOrderedList', title: 'Daftar bernomor' },
    { icon: <RemoveFormatting size={14} />, cmd: 'removeFormat', title: 'Hapus format' },
  ];

  return (
    <div className="form-group">
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <div className={cn('border border-slate-300 rounded-xl overflow-hidden bg-white focus-within:border-primary-500', className)}>
        <div className="flex items-center gap-0.5 px-2 py-1.5 bg-slate-50 border-b border-slate-200">
          {tools.map((t) => (
            <button
              key={t.cmd}
              type="button"
              title={t.title}
              onMouseDown={(e) => {
                e.preventDefault();
                exec(t.cmd);
              }}
              className="p-1.5 rounded-md text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition"
            >
              {t.icon}
            </button>
          ))}
        </div>
        <div
          ref={ref}
          contentEditable
          className="px-3 py-2 text-xs leading-relaxed outline-none overflow-y-auto [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
          style={{ minHeight }}
          data-placeholder={placeholder}
          onInput={() => {
            const html = ref.current?.innerHTML || '';
            lastEmitted.current = html;
            onChange(html);
          }}
          onBlur={() => {
            const el = ref.current;
            if (el && !el.textContent?.trim() && !el.querySelector('img')) {
              el.innerHTML = '';
              onChange('');
            }
          }}
        />
      </div>
    </div>
  );
}

/** Render HTML editor secara aman (buang script/event handler). */
export function richToSafeHtml(html: string): string {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '');
}
