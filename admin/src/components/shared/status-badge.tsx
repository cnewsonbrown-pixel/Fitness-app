import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  colorMap?: Record<string, string>;
  className?: string;
}

const DEFAULT_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAUSED: 'bg-yellow-100 text-yellow-800',
  CANCELLED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  FAILED: 'bg-red-100 text-red-800',
  SUCCESS: 'bg-green-100 text-green-800',
};

export function StatusBadge({ status, colorMap, className }: StatusBadgeProps) {
  const colors = colorMap || DEFAULT_COLORS;
  const colorClass = colors[status] || 'bg-gray-100 text-gray-800';

  return (
    <Badge variant="outline" className={cn('border-0', colorClass, className)}>
      {status.replace(/_/g, ' ')}
    </Badge>
  );
}
