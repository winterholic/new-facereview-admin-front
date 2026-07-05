import type { ReactElement } from 'react';

import './statusChip.scss';

export type ChipTone = 'pending' | 'accepted' | 'rejected' | 'brand' | 'neutral' | 'danger' | 'super';

interface StatusChipProps {
  label: string;
  tone: ChipTone;
}

const StatusChip = ({ label, tone }: StatusChipProps): ReactElement => (
  <span className={`status-chip status-chip--${tone} font-label-small`}>{label}</span>
);

export default StatusChip;
