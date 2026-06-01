const ACTIONS = [
  {
    id: 'import-cost',
    label: 'Import Cost',
    emoji: '📦',
    variant: 'primary',
    description: 'Calculate My Import Cost',
  },
  { id: 'shipping', label: 'Shipping Time', emoji: '🚢' },
  { id: 'moq', label: 'MOQ Checker', emoji: '📋' },
  { id: 'countries', label: 'Export Countries', emoji: '🌍' },
];

function QuickActions({ onAction, wizardActive, disabled }) {
  return (
    <div className="quick-actions">
      <button
        type="button"
        className="quick-actions__main"
        onClick={() => onAction('import-cost')}
        disabled={disabled}
      >
        <span aria-hidden="true">📦</span>
        Calculate My Import Cost
      </button>

      <div className="quick-actions__chips" role="toolbar" aria-label="Quick actions">
        {ACTIONS.filter((a) => a.id !== 'import-cost').map((action) => (
          <button
            key={action.id}
            type="button"
            className="quick-actions__chip"
            onClick={() => onAction(action.id)}
            disabled={disabled}
            title={action.label}
          >
            <span aria-hidden="true">{action.emoji}</span>
            {action.label}
          </button>
        ))}
        {wizardActive && (
          <span className="quick-actions__status">Guided estimate in progress…</span>
        )}
      </div>
    </div>
  );
}

export default QuickActions;
