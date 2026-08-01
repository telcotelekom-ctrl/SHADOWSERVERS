// Image-App → ShadowOS bridge.
// Ties each detected SVG region to a REAL wabe in the ShadowOS core matrix and
// routes every interaction through the shadow-server validation pipeline
// (simulate → validate → promote). This realises §17 of the developer report:
// "each SVG region is a validated controller / wabe".
//
// Browser-native only: imports the same ES modules the ShadowOS kernel uses.

import { createWabeMatrix } from '../shadow/wabe-matrix.js';
import { createShadowServer } from '../shadow/shadow-server.js';

export function createImageAppBridge() {
  const matrix = createWabeMatrix();
  const shadow = createShadowServer(matrix);

  // Register a detected region as a candidate wabe, routed through the server.
  function addZone(region) {
    const proposal = {
      op: 'add-wabe',
      wabe: {
        type: 'concept',
        cluster: 'IMAGEAPP',
        status: 'concept',
        label: region.label || region.role || 'zone',
        content: {
          role: region.role,
          theme: region.theme,
          box: { x: Math.round(region.x), y: Math.round(region.y), w: Math.round(region.w), h: Math.round(region.h) },
          color: region.color || null
        }
      }
    };
    const report = shadow.runProposal(proposal);
    let id = null;
    if (report.decision === 'promotable') {
      const res = shadow.promote(report);
      if (res && res.ok) id = res.created;
    }
    return { id, decision: report.decision, report };
  }

  // Activating a zone = promote its wabe status to validated via the pipeline.
  function activate(id) {
    if (!id) return { ok: false, reason: 'no wabe id' };
    const wabe = matrix.get(id);
    if (!wabe) return { ok: false, reason: 'wabe not found' };
    if (wabe.status === 'validated') return { ok: true, already: true, status: 'validated' };
    const proposal = { op: 'promote-status', id, status: 'validated' };
    const report = shadow.runProposal(proposal);
    if (report.decision === 'promotable') {
      const res = shadow.promote(report);
      return { ok: Boolean(res && res.ok), status: 'validated', report };
    }
    return { ok: false, decision: report.decision, report };
  }

  function stats() {
    const snap = matrix.snapshot();
    return {
      wabes: snap.wabeCount,
      relations: snap.relationCount,
      validated: (snap.byStatus && snap.byStatus.validated) || 0,
      clusters: snap.clusters
    };
  }

  return { matrix, shadow, addZone, activate, stats };
}
