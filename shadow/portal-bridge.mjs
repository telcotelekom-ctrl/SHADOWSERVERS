function normalizeSummary(summary = {}) {
  const company = summary?.company || {};
  const service = summary?.service || {};
  const operations = summary?.operations || {};
  const contacts = summary?.contacts || {};

  return {
    companyName: company.name || 'Shadow Portal',
    hasVision: Boolean(company.vision && String(company.vision).trim()),
    hasOffer: Boolean(service.name && String(service.name).trim()),
    hasProcess: Boolean(operations.process_name && String(operations.process_name).trim()),
    hasContact: Boolean(
      (contacts.official_contacts && String(contacts.official_contacts).trim()) ||
      (contacts.support_note && String(contacts.support_note).trim())
    )
  };
}

export function buildPortalKernelContext(summary = {}, kernelState = {}) {
  const normalized = normalizeSummary(summary);
  const signals = [];

  if (normalized.hasVision) {
    signals.push('vision');
  }
  if (normalized.hasOffer) {
    signals.push('offer');
  }
  if (normalized.hasProcess) {
    signals.push('process');
  }
  if (normalized.hasContact) {
    signals.push('contact');
  }

  const stateVersion = Number(kernelState?._v ?? 0);
  const isActive = Boolean(kernelState?.ready || kernelState?.identity || kernelState?.bootedAt || stateVersion > 0);

  return {
    active: isActive,
    companyName: normalized.companyName,
    signals,
    stateVersion,
    bootedAt: kernelState?.bootedAt || null,
    summary: normalized
  };
}

export function renderShadowKernelStatus(context = {}) {
  if (!context.active) {
    return 'Shadow Kernel Ω∞ · initialisiert';
  }

  const signalSummary = context.signals?.length ? ` · ${context.signals.join(' · ')}` : '';
  const versionSuffix = context.stateVersion ? ` · v${context.stateVersion}` : '';
  return `Shadow Kernel Ω∞ · aktiv${signalSummary}${versionSuffix}`;
}
