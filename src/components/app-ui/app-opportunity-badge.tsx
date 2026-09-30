import { Badge } from '../base-ui/badge';
import { typeLabels } from './app-opportunity-type';

export function AppOpportunityBadge({
  opportunityType,
}: {
  opportunityType: keyof typeof typeLabels;
}) {
  return (
    <Badge variant="outline" className={opportunityType}>
      {typeLabels[opportunityType]}
    </Badge>
  );
}
