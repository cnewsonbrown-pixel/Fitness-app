import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface MemberAvatarProps {
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  className?: string;
}

export function MemberAvatar({ firstName, lastName, avatarUrl, className }: MemberAvatarProps) {
  return (
    <Avatar className={cn('h-10 w-10', className)}>
      <AvatarImage src={avatarUrl} alt={`${firstName} ${lastName}`} />
      <AvatarFallback>{getInitials(firstName, lastName)}</AvatarFallback>
    </Avatar>
  );
}
