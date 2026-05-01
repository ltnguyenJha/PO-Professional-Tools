import type { PbiStatus } from '../types';

interface StatusConfig {
  label: string;
  bgVar: string;
  textVar: string;
}

const STATUS_CONFIG: Record<PbiStatus, StatusConfig> = {
  draft: {
    label: 'Draft',
    bgVar: 'var(--tw-vscode-warning-bg)',
    textVar: 'var(--tw-vscode-warning)',
  },
  ready: {
    label: 'Ready',
    bgVar: 'var(--tw-vscode-info-bg)',
    textVar: 'var(--tw-vscode-info)',
  },
  pushed: {
    label: 'Pushed',
    bgVar: 'var(--tw-vscode-success-bg)',
    textVar: 'var(--tw-vscode-success)',
  },
};

interface Props {
  status: PbiStatus;
  /** 'sm' (default) for standard usage; 'xs' for compact/sidebar contexts */
  size?: 'sm' | 'xs';
}

export function StatusBadge({ status, size = 'sm' }: Props): JSX.Element {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;

  return (
    <span
      role="status"
      aria-label={`Status: ${config.label}`}
      className={`inline-flex items-center rounded-full font-medium shrink-0 whitespace-nowrap transition-colors duration-150 ${
        size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
      }`}
      style={{ background: config.bgVar, color: config.textVar }}
    >
      {config.label}
    </span>
  );
}
