'use client';

interface MkProdiSelectProps {
  value: number | string;
  onChange: (id: number) => void;
  matakuliahs: any[];
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

/** Dropdown MK lokal dikelompokkan per Program Studi (optgroup). */
export function MkProdiSelect({
  value,
  onChange,
  matakuliahs,
  label = 'Disetarakan Ke MK Lokal *',
  required = false,
  disabled = false,
  className = 'select w-full text-xs font-bold bg-white',
}: MkProdiSelectProps) {
  const groups: Record<string, any[]> = {};
  (matakuliahs || []).forEach((mk: any) => {
    const prodi = mk.kurikulum?.program_studi?.nama || mk.program_studi?.nama || 'Tanpa Prodi';
    if (!groups[prodi]) groups[prodi] = [];
    groups[prodi].push(mk);
  });

  return (
    <div>
      <label className="label font-bold text-slate-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className={className}
        required={required}
        disabled={disabled}
      >
        {Object.entries(groups).map(([prodi, list]) => (
          <optgroup key={prodi} label={prodi}>
            {list.map((mk: any) => (
              <option key={mk.id} value={mk.id}>
                {mk.kode_mk} - {mk.nama} ({mk.total_sks} SKS)
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
