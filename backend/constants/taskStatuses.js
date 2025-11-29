// Default task statuses for all organizations
const DEFAULT_TASK_STATUSES = [
    {
        value: 'todo',
        label: 'To Do',
        color: '#1E40AF',
        bgColor: '#DBEAFE',
        icon: 'DocumentText',
        order: 1,
        isDefault: true
    },
    {
        value: 'in_progress',
        label: 'In Progress',
        color: '#92400E',
        bgColor: '#FEF3C7',
        icon: 'Clock',
        order: 2,
        isDefault: true
    },
    {
        value: 'waiting_client',
        label: 'Waiting for Client',
        color: '#C2410C',
        bgColor: '#FED7AA',
        icon: 'People',
        order: 3,
        isDefault: true
    },
    {
        value: 'blocked',
        label: 'Blocked',
        color: '#991B1B',
        bgColor: '#FEE2E2',
        icon: 'CloseCircle',
        order: 4,
        isDefault: true
    },
    {
        value: 'completed',
        label: 'Completed',
        color: '#065F46',
        bgColor: '#D1FAE5',
        icon: 'TickCircle',
        order: 5,
        isDefault: true
    },
    {
        value: 'cancelled',
        label: 'Cancelled',
        color: '#374151',
        bgColor: '#F3F4F6',
        icon: 'Slash',
        order: 6,
        isDefault: true
    }
];

module.exports = { DEFAULT_TASK_STATUSES };
