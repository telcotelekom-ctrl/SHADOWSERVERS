// Ultra-Stufe VI — HDL Bridge (browser-native code generator).
// The final bridge of the blueprint: turn a synthesised program spec (the same
// declarative {inputs, outputs:[{name, expr}]} shape used by Stufe V) into REAL
// hardware description language — Verilog and VHDL — plus a structural netlist and
// a Mermaid block diagram. This is where "software becomes hardware": a spec
// generated inside the Wabenmatrix can be emitted, simulated, or fed to an FPGA
// toolchain outside the browser.
//
// Arithmetic is emitted as behavioural `real` logic (portable, simulable). The
// expression tokenizer mirrors the safe parser in program-synthesis.js — no eval.

const OPS = new Set(['+', '-', '*', '/', '%']);
const FUNCS = new Set(['min', 'max', 'abs', 'round', 'floor', 'ceil', 'sqrt', 'pow']);

function tokenize(expr) {
  const tokens = [];
  const re = /\s*([A-Za-z_][A-Za-z0-9_]*|\d+\.?\d*|[()+\-*/%,])/g;
  let m;
  while ((m = re.exec(expr)) !== null) tokens.push(m[1]);
  return tokens;
}

// Rewrite an infix arithmetic expression into portable Verilog/VHDL syntax.
// Identifiers are validated against the declared input names to prevent injection.
function rewriteExpr(expr, inputNames, dialect) {
  const allowed = new Set(inputNames);
  const tokens = tokenize(expr);
  const out = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (OPS.has(t) || t === '(' || t === ')' || t === ',') { out.push(t); continue; }
    if (/^\d+\.?\d*$/.test(t)) { out.push(t); continue; }
    if (FUNCS.has(t)) {
      // Map math functions to HDL equivalents (behavioural).
      const map = dialect === 'vhdl'
        ? { min: 'minimum', max: 'maximum', abs: 'abs', sqrt: 'sqrt', pow: '**', floor: 'floor', ceil: 'ceil', round: 'round' }
        : { min: '$min', max: '$max', abs: '$abs', sqrt: '$sqrt', pow: '$pow', floor: '$floor', ceil: '$ceil', round: '$rtoi' };
      out.push(map[t] || t);
      continue;
    }
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(t)) {
      if (!allowed.has(t)) throw new Error(`Unknown identifier in expression: ${t}`);
      out.push(t);
      continue;
    }
    throw new Error(`Illegal token in expression: ${t}`);
  }
  return out.join(' ');
}

function safeName(name) { return String(name).replace(/[^A-Za-z0-9_]/g, '_').replace(/^(\d)/, '_$1'); }

export function createHDLBridge() {
  // toVerilog(spec) → a synthesisable-style behavioural Verilog module.
  function toVerilog(spec) {
    const mod = safeName(spec.name || 'usup_module');
    const ins = (spec.inputs || []).map((i) => safeName(i.name));
    const outs = (spec.outputs || []).map((o) => safeName(o.name));
    const lines = [];
    lines.push(`// Auto-generated from USUP spec "${spec.name}" (cluster ${spec.cluster || '-'})`);
    lines.push(`module ${mod} (`);
    lines.push(ins.map((n) => `  input real ${n}`).concat(outs.map((n) => `  output real ${n}`)).join(',\n'));
    lines.push(');');
    for (const o of (spec.outputs || [])) {
      const rhs = rewriteExpr(o.expr, ins, 'verilog');
      lines.push(`  assign ${safeName(o.name)} = ${rhs};`);
    }
    lines.push('endmodule');
    return lines.join('\n');
  }

  // toVHDL(spec) → a behavioural VHDL entity + architecture.
  function toVHDL(spec) {
    const mod = safeName(spec.name || 'usup_module');
    const ins = (spec.inputs || []).map((i) => safeName(i.name));
    const outs = (spec.outputs || []).map((o) => safeName(o.name));
    const port = ins.map((n) => `    ${n} : in real`).concat(outs.map((n) => `    ${n} : out real`)).join(';\n');
    const body = (spec.outputs || []).map((o) => `    ${safeName(o.name)} <= ${rewriteExpr(o.expr, ins, 'vhdl')};`).join('\n');
    return [
      'library ieee;',
      'use ieee.math_real.all;',
      '',
      `entity ${mod} is`,
      '  port (',
      port,
      '  );',
      `end ${mod};`,
      '',
      `architecture behavioural of ${mod} is`,
      'begin',
      '  process(all) begin',
      body,
      '  end process;',
      'end behavioural;'
    ].join('\n');
  }

  // toNetlist(spec) → a structural description (ports + combinational nodes).
  function toNetlist(spec) {
    return {
      module: safeName(spec.name || 'usup_module'),
      inputs: (spec.inputs || []).map((i) => ({ name: safeName(i.name), type: 'real', default: i.default ?? 0 })),
      outputs: (spec.outputs || []).map((o) => ({
        name: safeName(o.name),
        expr: o.expr,
        rtl: rewriteExpr(o.expr, (spec.inputs || []).map((i) => safeName(i.name)), 'verilog')
      }))
    };
  }

  // toDiagram(spec) → a Mermaid flowchart of the datapath.
  function toDiagram(spec) {
    const mod = safeName(spec.name || 'usup_module');
    const lines = ['flowchart LR'];
    for (const i of (spec.inputs || [])) lines.push(`  ${safeName(i.name)}([${i.name}]) --> ${mod}`);
    lines.push(`  ${mod}{{${spec.name || mod}}}`);
    for (const o of (spec.outputs || [])) lines.push(`  ${mod} --> ${safeName(o.name)}[[${o.name}]]`);
    return lines.join('\n');
  }

  // emit(spec) → all representations at once.
  function emit(spec) {
    return {
      spec: spec.name,
      verilog: toVerilog(spec),
      vhdl: toVHDL(spec),
      netlist: toNetlist(spec),
      diagram: toDiagram(spec)
    };
  }

  return { toVerilog, toVHDL, toNetlist, toDiagram, emit };
}
