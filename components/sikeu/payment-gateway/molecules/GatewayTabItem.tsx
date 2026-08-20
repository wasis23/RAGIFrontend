import { cn } from '@/lib/utils';

interface GatewayTabItemProps {
  id: string;
  name: string;
  isActiveTab: boolean;
  isGatewayActive: boolean;
  onClick: () => void;
}

export function GatewayTabItem({
  name,
  isActiveTab,
  isGatewayActive,
  onClick,
}: GatewayTabItemProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActiveTab}
      onClick={onClick}
      className={cn(
        'min-h-[44px] px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-t-lg',
        isActiveTab
          ? 'border-primary-600 text-primary-700 bg-primary-50/50'
          : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
      )}
    >
      <span>{name} Gateway</span>
      {isGatewayActive ? (
        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Aktif
        </span>
      ) : (
        <span className="text-[10px] text-slate-400 font-semibold">(Non-Aktif)</span>
      )}
    </button>
  );
}
