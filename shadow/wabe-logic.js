// Wabe-logic — real, executable compute functions for the function-layer apps.
// These are not descriptions: each entry is a pure function that takes typed input
// and returns a concrete numeric result. The Shadow Server runs these inside a
// simulation, validates the output, and only then promotes the result to the core.
// Kept consistent with the portal's offline estimators so numbers match everywhere.

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export const wabeLogic = {
  // INVESTERING — local capital flow (mirrors index.html fallbackLocal).
  investorLocal: {
    cluster: 'INVESTERING',
    label: 'Investor Calculator (local)',
    defaults: { N: 1000, f: 0.6, p: 120, I_avg: 8, u: 0.15, m: 0.1, K_fix: 20000, N_employees: 12 },
    run(input = {}) {
      const N = num(input.N, 1000), f = num(input.f, 0.6), p = num(input.p, 120), I_avg = num(input.I_avg, 8);
      const u = num(input.u, 0.15), m = num(input.m, 0.1), K_fix = num(input.K_fix, 20000);
      const N_employees = Math.max(1, num(input.N_employees, 12));
      const capital_base = N * f * p * I_avg;
      return {
        capital_base,
        automation_adjustment: (1 + u) * (1 - m),
        net_capital_flow: capital_base * (1 + u) * (1 - m) - K_fix,
        employee_capacity: N / N_employees
      };
    }
  },

  // FISCAAL — tax on net result.
  fiscal: {
    cluster: 'FISCAAL',
    label: 'Fiscale Calculator',
    defaults: { gross: 100000, cost: 40000, rate: 0.258 },
    run(input = {}) {
      const gross = num(input.gross, 100000), cost = num(input.cost, 40000), rate = num(input.rate, 0.258);
      const taxable = Math.max(0, gross - cost);
      const tax = taxable * rate;
      return { taxable_base: taxable, tax_due: tax, net_after_tax: taxable - tax, effective_rate: gross ? tax / gross : 0 };
    }
  },

  // PARTICIPATIE — distribution across participants.
  participation: {
    cluster: 'PARTICIPATIE',
    label: 'Financiële Bedelingen',
    defaults: { pool: 50000, participants: 10, reserve_rate: 0.1 },
    run(input = {}) {
      const pool = num(input.pool, 50000);
      const participants = Math.max(1, Math.floor(num(input.participants, 10)));
      const reserve_rate = Math.min(1, Math.max(0, num(input.reserve_rate, 0.1)));
      const reserve = pool * reserve_rate;
      const distributable = pool - reserve;
      return { reserve, distributable, per_participant: distributable / participants, participants };
    }
  },

  // REGISTRATIE — validate a formal record; returns a numeric completeness score.
  registryValidate: {
    cluster: 'REGISTRATIE',
    label: 'Registry Validator',
    defaults: { name: 'Raymond Demitrio Tel', id: 'user-raymond', role: 'admin', email: 'raymond@serverb.local' },
    run(input = {}) {
      const required = ['name', 'id', 'role', 'email'];
      const present = required.filter((k) => String(input[k] ?? '').trim().length > 0);
      const emailOk = /.+@.+\..+/.test(String(input.email ?? ''));
      const score = (present.length / required.length) * (emailOk ? 1 : 0.75);
      return { fields_present: present.length, required: required.length, email_valid: emailOk ? 1 : 0, completeness_score: score, valid: score >= 1 ? 1 : 0 };
    }
  }
};

export function listLogic() {
  return Object.entries(wabeLogic).map(([key, def]) => ({ key, label: def.label, cluster: def.cluster, defaults: def.defaults }));
}

export function runLogic(key, input) {
  const def = wabeLogic[key];
  if (!def) return { ok: false, error: `unknown logic: ${key}` };
  try {
    const result = def.run(input || def.defaults);
    const numeric = Object.values(result).every((v) => typeof v === 'number' && Number.isFinite(v));
    return { ok: true, key, label: def.label, cluster: def.cluster, result, numericSound: numeric };
  } catch (error) {
    return { ok: false, error: String(error && error.message || error) };
  }
}
