import { useEffect, useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { siakadService } from '@/services/siakad.service';

interface TahunAkademikOption {
  value: number;
  label: string;
  is_active?: boolean;
}

interface PeriodeSelectorProps {
  value?: number | string | null;
  onChange?: (id: number) => void;
  label?: string;
  placeholder?: string;
  isDisabled?: boolean;
  required?: boolean;
  error?: string;
  hint?: string;
}

export function PeriodeSelector({
  value,
  onChange,
  label = 'Periode Akademik',
  placeholder = 'Pilih periode semester...',
  isDisabled = false,
  required = false,
  error,
  hint,
}: PeriodeSelectorProps) {
  const [options, setOptions] = useState<TahunAkademikOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchPeriode = async () => {
      try {
        setLoading(true);
        const res = await siakadService.getTahunAkademiks();
        const list: any[] = res.data || [];
        if (!mounted) return;
        setOptions(
          list.map((ta) => ({
            value: ta.id,
            label: `${ta.nama}${ta.is_active ? ' — Aktif' : ''}`,
            is_active: !!ta.is_active,
          }))
        );
        if ((value === undefined || value === null || value === '') && list.length > 0 && onChange) {
          const active = list.find((ta) => ta.is_active) || list[0];
          onChange(active.id);
        }
      } catch {
        if (mounted) setOptions([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchPeriode();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeOption = useMemo(
    () => options.find((o) => String(o.value) === String(value)),
    [options, value]
  );

  return (
    <div className="flex items-center gap-2 min-w-[240px]">
      <span
        className="hidden sm:flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
        style={{ background: 'var(--module-primary-subtle)', color: 'var(--module-primary)' }}
      >
        <CalendarDays size={16} />
      </span>
      <div className="flex-1 min-w-[200px]">
        <Select
          label={label}
          required={required}
          placeholder={loading ? 'Memuat periode...' : placeholder}
          options={options}
          value={value ?? ''}
          onChange={(val: any) => onChange?.(Number(val))}
          isDisabled={isDisabled || loading}
          isClearable={false}
          error={error}
          hint={hint || (activeOption?.is_active ? 'Periode aktif semester berjalan' : undefined)}
        />
      </div>
    </div>
  );
}
