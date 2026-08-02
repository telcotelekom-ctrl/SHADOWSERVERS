export function createVkosMemberController(initialState = {}) {
  const state = {
    user: initialState.user || null,
    activeView: initialState.activeView || 'dashboard',
    executiveMode: Boolean(initialState.executiveMode),
    invoices: initialState.invoices || [
      { id: 'INV-ECI-001', title: 'Executive Workspace Setup', amount: 2480, status: 'Pending', due: '2026-08-20' },
      { id: 'INV-ECI-002', title: 'Trade & Notar Advisory Pack', amount: 6400, status: 'Scheduled', due: '2026-08-28' }
    ],
    projects: initialState.projects || [
      { id: 'PRJ-001', title: 'Energy Transition Brief', progress: 72, phase: 'Review' },
      { id: 'PRJ-002', title: 'Inventor Space Launch', progress: 48, phase: 'Draft' }
    ],
    ...initialState
  };

  return {
    getState() {
      return {
        user: state.user ? { ...state.user } : null,
        activeView: state.activeView,
        executiveMode: state.executiveMode,
        invoices: state.invoices.map((invoice) => ({ ...invoice })),
        projects: state.projects.map((project) => ({ ...project }))
      };
    },
    authenticate(payload) {
      state.user = {
        name: payload.name || 'Member',
        email: payload.email || '',
        role: payload.role || 'Member',
        createdAt: new Date().toISOString()
      };
      state.activeView = 'dashboard';
      return this.getState();
    },
    setActiveView(view) {
      state.activeView = view;
      return this.getState();
    },
    toggleExecutiveMode() {
      state.executiveMode = !state.executiveMode;
      return this.getState();
    },
    markInvoicePaid(invoiceId) {
      state.invoices = state.invoices.map((invoice) => invoice.id === invoiceId
        ? { ...invoice, status: 'Paid' }
        : invoice);
      return this.getState();
    }
  };
}
