// Compare against a working-tree snapshot, preserving any pre-existing local edits.
// Usage: node scripts/verify-visual-preservation.mjs /path/to/baseline/frontend
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { parseSync } from 'rolldown/utils';

const baseline = resolve(process.argv[2] || '/tmp/signal-scissors-baseline/frontend');
const current = resolve(import.meta.dirname, '..');
const files = dir => readdirSync(dir, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? files(join(dir, e.name)) : /\.[jt]sx?$/.test(e.name) ? [join(dir, e.name)] : []);
const isFunction = n => ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'].includes(n?.type);
const presentationProps = new Set(['className', 'style', 'variant', 'color', 'gradientTop', 'gradientBot', 'secondaryColor']);
const ignoredKeys = new Set(['start', 'end', 'loc', 'raw', 'comments']);
const color = /^(#[\da-f]{3,8}|rgba?\(.+\))$/i;
function clean(n, presentation = false) {
  if (!n || typeof n !== 'object') return n;
  if (Array.isArray(n)) return n.map(x => clean(x, presentation));
  if (n.type === 'JSXElement' || n.type === 'JSXFragment') return { type: 'Presentation' };
  if (presentation && n.type === 'Literal' && typeof n.value === 'string') {
    if (color.test(n.value) || /rgba\(|#[\da-f]{6}|(?:px-|py-|rounded-|bg-|text-)/i.test(n.value))
      return { type: 'Literal', value: '<presentation-string>' };
  }
  return Object.fromEntries(Object.entries(n).filter(([k]) => !ignoredKeys.has(k)).map(([k,v]) => [k, clean(v, presentation)]));
}
function inspect(file) {
  const result = parseSync(file, readFileSync(file, 'utf8'));
  if (result.errors.length) throw new Error(`${file}: ${JSON.stringify(result.errors)}`);
  const signatures = [], bodies = [], bindings = [];
  function walk(n, parent) {
    if (!n || typeof n !== 'object') return;
    if (isFunction(n)) {
      const name = n.id?.name || (parent?.type === 'VariableDeclarator' ? parent.id?.name : '') || '<callback>';
      signatures.push(JSON.stringify({name, async:n.async, generator:n.generator, params:clean(n.params), returnType:clean(n.returnType)}));
      bodies.push(JSON.stringify({name,body:clean(n.body,true)}));
    }
    if (n.type === 'JSXAttribute' && !presentationProps.has(n.name?.name)) {
      bindings.push(JSON.stringify({name:n.name?.name,value:clean(n.value,true)}));
    }
    for (const [k,v] of Object.entries(n)) {
      if (ignoredKeys.has(k)) continue;
      if (Array.isArray(v)) v.forEach(x => walk(x,n)); else if (v && typeof v==='object') walk(v,n);
    }
  }
  walk(result.program);
  return { signatures:signatures.sort(), bodies:bodies.sort(), bindings:bindings.sort() };
}
function missing(before, after) {
  const pool = [...after];
  return before.filter(x => {const i=pool.indexOf(x); if(i<0)return true; pool.splice(i,1); return false;});
}
let count=0, failures=0;
for (const file of files(join(baseline,'src'))) {
  const rel=relative(baseline,file), a=inspect(file), b=inspect(join(current,rel));
  count+=a.signatures.length;
  for (const kind of ['signatures','bodies','bindings']) {
    const lost=missing(a[kind],b[kind]);
    if(lost.length) { failures+=lost.length; console.log(`${rel}: ${lost.length} changed ${kind}`); for(const x of lost)console.log(x.slice(0,250)); }
  }
}
console.log(`Audited ${count} original functions across ${files(join(baseline,'src')).length} source files. Differences requiring review: ${failures}.`);
process.exitCode=failures ? 1 : 0;
