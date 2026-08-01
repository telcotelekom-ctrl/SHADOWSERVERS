// Program Synthesis (Ultra-Stufe V) — the system builds NEW real programs at runtime.
// A declarative spec {name, cluster, inputs[], outputs[{name, expr}]} is turned into a
// REAL, executable logic function, validated in the Shadow Server, and only then
// promoted live. Expressions are evaluated with a SAFE parser (no eval / no Function),
// so a spec can never inject arbitrary code — only arithmetic over its own inputs.

// ---- Safe arithmetic expression evaluator (shunting-yard, no eval) ----
const FUNCS = {
  min: Math.min, max: Math.max, abs: Math.abs, round: Math.round,
  floor: Math.floor, ceil: Math.ceil, sqrt: Math.sqrt, pow: Math.pow
};
const OPS = {
  '+': { prec: 1, fn: (a, b) => a + b }, '-': { prec: 1, fn: (a, b) => a - b },
  '*': { prec: 2, fn: (a, b) => a * b }, '/': { prec: 2, fn: (a, b) => (b === 0 ? 0 : a / b) },
  '%': { prec: 2, fn: (a, b) => (b === 0 ? 0 : a % b) }
};

function tokenize(expr) {
  const tokens = [];
  const re = /\s*([A-Za-z_][A-Za-z0-9_]*|\d+\.?\d*|[()+\-*/%,])/g;
  let m, last = 0;
  while ((m = re.exec(expr)) !== null) {
    if (m.index !== last) throw new Error(`invalid character in expression near "${expr.slice(last)}"`);
    tokens.push(m[1]);
    last = re.lastIndex;
  }
  if (last !== expr.length) throw new Error('unparsable expression');
  return tokens;
}

// Evaluate a safe arithmetic expression against a scope of numeric variables.
export function evalExpr(expr, scope = {}) {
  const tokens = tokenize(String(expr));
  const output = []; // RPN values/vars
  const ops = [];
  const applyOp = (op) => {
    const b = output.pop(), a = output.pop();
    if (a === undefined || b === undefined) throw new Error('malformed expression');
    output.push(OPS[op].fn(a, b));
  };
  let prevType = null; // for unary-minus detection
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (/^\d/.test(t)) { output.push(parseFloat(t)); prevType = 'num'; }
    else if (FUNCS[t]) { ops.push({ fn: t }); prevType = 'func'; }
    else if (/^[A-Za-z_]/.test(t)) {
      if (!(t in scope)) throw new Error(`unknown variable: ${t}`);
      output.push(Number(scope[t]) || 0); prevType = 'num';
    }
    else if (t === ',') { while (ops.length && ops[ops.length - 1] !== '(') applyOp(ops.pop()); prevType = 'comma'; }
    else if (t === '(') { ops.push('('); prevType = 'open'; }
    else if (t === ')') {
      while (ops.length && ops[ops.length - 1] !== '(') applyOp(ops.pop());
      if (ops.pop() !== '(') throw new Error('mismatched parentheses');
      if (ops.length && ops[ops.length - 1] && ops[ops.length - 1].fn) {
        const f = ops.pop().fn; const arg = output.pop(); output.push(FUNCS[f](arg));
      }
      prevType = 'num';
    }
    else if (OPS[t]) {
      // Unary minus → 0 - x
      if (t === '-' && (prevType === null || prevType === 'op' || prevType === 'open' || prevType === 'comma')) output.push(0);
      while (ops.length && OPS[ops[ops.length - 1]] && OPS[ops[ops.length - 1]].prec >= OPS[t].prec) applyOp(ops.pop());
      ops.push(t); prevType = 'op';
    }
    else throw new Error(`unexpected token: ${t}`);
  }
  while (ops.length) { const op = ops.pop(); if (op === '(') throw new Error('mismatched parentheses'); applyOp(op); }
  if (output.length !== 1) throw new Error('invalid expression result');
  return output[0];
}

// ---- Spec → real logic definition ----
export function specToLogic(spec) {
  if (!spec || !spec.name) throw new Error('spec.name required');
  const inputs = Array.isArray(spec.inputs) ? spec.inputs : [];
  const outputs = Array.isArray(spec.outputs) ? spec.outputs : [];
  if (outputs.length === 0) throw new Error('spec.outputs must contain at least one {name, expr}');
  const defaults = Object.fromEntries(inputs.map((i) => [i.name, Number(i.default) || 0]));
  // Validate every expression once at synthesis time (fail fast, no injection).
  for (const out of outputs) evalExpr(out.expr, defaults);
  return {
    cluster: spec.cluster || 'GENERATED',
    label: spec.label || spec.name,
    defaults,
    run(input = {}) {
      const scope = { ...defaults, ...input };
      const result = {};
      for (const out of outputs) result[out.name] = evalExpr(out.expr, scope);
      return result;
    }
  };
}

// ---- Synthesizer: register + validate + deploy a new program at runtime ----
import { registerLogic } from './wabe-logic.js';

export function createProgramSynthesizer(matrix, shadowServer) {
  const built = [];

  // synthesize(spec) → turn the spec into a live, registered logic function.
  function synthesize(spec) {
    const def = specToLogic(spec);
    const reg = registerLogic(spec.name, def);
    if (!reg.ok) return reg;
    built.push({ key: spec.name, cluster: def.cluster, at: new Date().toISOString() });
    return { ok: true, key: spec.name, cluster: def.cluster, label: def.label, defaults: def.defaults };
  }

  // deploy(spec, input) → synthesize, run through the Shadow Server, promote if valid.
  function deploy(spec, input) {
    const s = synthesize(spec);
    if (!s.ok) return s;
    // Ensure the target cluster exists as a validated module wabe.
    const existing = matrix.query({ cluster: s.cluster });
    if (existing.length === 0) matrix.ensureCluster(s.cluster, []);
    // Register the synthesized program itself as a code-wabe.
    const codeWabe = matrix.addWabe({ type: 'code', label: s.label, cluster: s.cluster, status: 'in-development', content: { synthesizedFrom: spec } });
    // Run + validate + promote the actual computation.
    const report = shadowServer.runProposal({ op: 'compute', logicKey: s.key, input });
    let promotion = null;
    if (report.decision === 'promotable') {
      matrix.setStatus(codeWabe.id, 'validated', 'synthesized program validated');
      promotion = shadowServer.promote(report);
    }
    return { ok: true, program: s, codeWabe: codeWabe.id, report, promotion };
  }

  return { synthesize, deploy, built() { return [...built]; } };
}
