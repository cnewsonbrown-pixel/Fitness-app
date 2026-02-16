import { cn } from '@/lib/utils';

interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  icon?: React.ReactNode;
  status?: 'completed' | 'current' | 'upcoming';
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {items.map((item, index) => (
        <div key={item.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border-2',
                item.status === 'completed' && 'border-green-500 bg-green-50 text-green-600',
                item.status === 'current' && 'border-primary bg-primary/10 text-primary',
                item.status === 'upcoming' && 'border-muted-foreground/30 bg-muted text-muted-foreground'
              )}
            >
              {item.icon || (
                <span className="text-xs font-medium">{index + 1}</span>
              )}
            </div>
            {index < items.length - 1 && (
              <div
                className={cn(
                  'mt-2 h-full w-0.5',
                  item.status === 'completed' ? 'bg-green-500' : 'bg-muted'
                )}
              />
            )}
          </div>
          <div className="flex-1 pb-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">{item.title}</h4>
              <time className="text-xs text-muted-foreground">{item.timestamp}</time>
            </div>
            {item.description && (
              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
