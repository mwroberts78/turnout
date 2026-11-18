import { Badge } from '@/components/base-ui/badge';

export function ProjectStatusBadge({ isPublished }: { isPublished: boolean }) {
  return (
    <Badge variant={isPublished ? 'default' : 'outline'}>
      {isPublished ? 'Published' : 'Draft'}
    </Badge>
  );
}
