import { cn } from '../../lib/utils';

const sectionStyles = {
  VARC: 'bg-varc/15 text-varc border-varc/25',
  DILR: 'bg-dilr/15 text-dilr border-dilr/25',
  QA:   'bg-qa/15 text-qa border-qa/25',
};

const difficultyStyles = {
  Easy:   'bg-success/15 text-success border-success/25',
  Medium: 'bg-warning/15 text-warning border-warning/25',
  Hard:   'bg-error/15 text-error border-error/25',
};

const typeStyles = {
  MCQ:  'bg-blue-500/15 text-blue-400 border-blue-500/25',
  TITA: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
};

const statusStyles = {
  'not-visited':     'bg-status-not-visited/30 text-text-secondary border-status-not-visited/40',
  'not-answered':    'bg-error/15 text-error border-error/25',
  'answered':        'bg-success/15 text-success border-success/25',
  'marked':          'bg-status-marked/15 text-status-marked border-status-marked/25',
  'answered-marked': 'bg-status-answered-marked/15 text-status-answered-marked border-status-answered-marked/25',
};

function getVariantStyles(variant, value) {
  switch (variant) {
    case 'section':
      return sectionStyles[value] || 'bg-accent-muted text-accent border-accent/25';
    case 'difficulty':
      return difficultyStyles[value] || 'bg-accent-muted text-accent border-accent/25';
    case 'type':
      return typeStyles[value] || 'bg-accent-muted text-accent border-accent/25';
    case 'status':
      return statusStyles[value] || 'bg-accent-muted text-accent border-accent/25';
    case 'custom':
    default:
      return 'bg-accent-muted text-accent border-accent/25';
  }
}

export default function Badge({
  children,
  className,
  variant = 'custom',
  value,
}) {
  const displayText = children || value;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full',
        'text-[11px] font-semibold leading-none tracking-wide uppercase',
        'border whitespace-nowrap select-none',
        getVariantStyles(variant, value),
        className
      )}
    >
      {displayText}
    </span>
  );
}
