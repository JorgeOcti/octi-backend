#!/usr/bin/env node
'use strict';

/**
 * DocumentDB compatibility audit for the andes-backend aggregation code.
 *
 * Statically scans src/ (TypeScript AST) for aggregation patterns that AWS
 * DocumentDB 5.0 rejects. It catches the shapes we've actually hit in prod:
 *
 *   1. concise-correlated-subquery  -> $lookup with localField + foreignField
 *                                      AND pipeline in the same stage.
 *                                      DocDB: "$lookup concise correlated
 *                                      subquery is not supported".
 *   2. multi-condition-join         -> $lookup whose correlated pipeline uses
 *                                      $expr + $and (more than one condition).
 *                                      DocDB: "$lookup on multiple join
 *                                      conditions".
 *   3. nested-lookup-in-pipeline    -> a $lookup nested inside another
 *                                      $lookup's pipeline (DocDB support is
 *                                      unreliable; verify dynamically).
 *   4. unsupported-operator         -> operators DocDB 5.0 does not implement.
 *
 * Exit code is non-zero when any HIGH-severity finding exists, so it can gate
 * CI. Usage:  node scripts/docdb-audit.js [rootDir]
 */

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOT = path.resolve(process.argv[2] || path.join(__dirname, '..', 'src'));

// Operators DocDB 5.0 does not support (or supports too partially to rely on).
const UNSUPPORTED_OPERATORS = new Set([
  // aggregation
  '$function',
  '$accumulator',
  '$graphLookup',
  '$setWindowFields',
  '$documents',
  '$unionWith',
  '$merge',
  '$out',
  '$facet',
  '$bucketAuto',
  '$regexFind',
  '$regexFindAll',
  '$regexMatch',
  '$meta', // $meta:'textScore' etc. — DocDB has no text-search metadata
  // query / geo / server-side JS
  '$where',
  '$text',
  '$geoNear',
  '$near',
  '$nearSphere'
]);

// Files excluded from the gate (documented, intentional exceptions):
//  - docdb-compat.spec.ts: intentional negative-control fixtures (bad shapes on purpose).
//  - form/commands/asignClient.ts: quarantined one-off script, DocDB-incompatible by
//    design, never run against DocDB (see its header + DOCDB-MIGRATION.md).
const IGNORE_SUFFIXES = [
  path.join('src', 'docdb-compat.spec.ts'),
  path.join('src', 'form', 'commands', 'asignClient.ts')
];

/** Recursively collect .ts files, skipping node_modules and build output. */
function collectFiles(dir, acc) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    // Skip deps, build output, and hidden/archived dirs (e.g. .old_migrations).
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    if (entry.isDirectory() && entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectFiles(full, acc);
    else if (entry.name.endsWith('.ts') && !IGNORE_SUFFIXES.some((s) => full.endsWith(s))) {
      acc.push(full);
    }
  }
  return acc;
}

/** Property key text for an object-literal property ($lookup, pipeline, ...). */
function propName(prop) {
  if (!prop.name) return null;
  if (ts.isIdentifier(prop.name)) return prop.name.text;
  if (ts.isStringLiteral(prop.name)) return prop.name.text;
  return null;
}

/** Direct property names of an ObjectLiteralExpression. */
function directKeys(objLiteral) {
  const keys = new Set();
  for (const p of objLiteral.properties) {
    if (ts.isPropertyAssignment(p)) {
      const n = propName(p);
      if (n) keys.add(n);
    }
  }
  return keys;
}

/** Does the subtree contain a property assignment with this key? */
function subtreeHasKey(node, key) {
  let found = false;
  const visit = (n) => {
    if (found) return;
    if (ts.isPropertyAssignment(n) && propName(n) === key) {
      found = true;
      return;
    }
    ts.forEachChild(n, visit);
  };
  visit(node);
  return found;
}

/** Initializer of a named property, or null. */
function propInit(objLiteral, key) {
  for (const p of objLiteral.properties) {
    if (ts.isPropertyAssignment(p) && propName(p) === key) return p.initializer;
  }
  return null;
}

function scanFile(file, findings) {
  const src = ts.createSourceFile(
    file,
    fs.readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true
  );
  const rel = path.relative(path.join(__dirname, '..'), file);
  const lineOf = (node) =>
    src.getLineAndCharacterOfPosition(node.getStart(src)).line + 1;

  const add = (node, type, severity, detail) =>
    findings.push({ file: rel, line: lineOf(node), type, severity, detail });

  const visit = (node) => {
    // $lookup stages. DocDB supports ONLY the basic localField/foreignField
    // form. ANY $lookup carrying a `pipeline` (concise-correlated, correlated
    // let/pipeline — even single-condition — or uncorrelated) is rejected.
    if (ts.isPropertyAssignment(node) && propName(node) === '$lookup') {
      const obj = node.initializer;
      if (obj && ts.isObjectLiteralExpression(obj)) {
        const keys = directKeys(obj);
        if (keys.has('pipeline')) {
          let kind;
          if (keys.has('localField') && keys.has('foreignField')) kind = 'concise-correlated';
          else if (keys.has('let')) kind = 'correlated let/pipeline';
          else kind = 'uncorrelated pipeline';
          add(node, 'pipeline-form-lookup', 'HIGH',
            `$lookup with pipeline (${kind}) — DocDB supports only basic localField/foreignField`);

          const pipeline = propInit(obj, 'pipeline');
          if (pipeline && subtreeHasKey(pipeline, '$lookup')) {
            add(node, 'nested-lookup-in-pipeline', 'MEDIUM',
              'also nests a $lookup inside the pipeline (extra flattening needed)');
          }
        }
      }
    }

    // Unsupported operators anywhere
    if (ts.isPropertyAssignment(node)) {
      const n = propName(node);
      if (n && UNSUPPORTED_OPERATORS.has(n)) {
        add(node, `unsupported-operator ${n}`, 'HIGH', `${n} is not supported by DocDB 5.0`);
      }
    }

    // Filtered positional array updates ($[identifier]) — DocDB has no support.
    if (ts.isPropertyAssignment(node) && propName(node) === 'arrayFilters') {
      add(node, 'array-filters', 'HIGH',
        'arrayFilters (filtered positional update) is not supported by DocDB');
    }

    // Text index definitions: schema.index({ field: 'text' }) — DocDB cannot
    // create text indexes. (Ignores enum defaults like `default: 'text'` since
    // those are not inside an .index(...) call.)
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'index'
    ) {
      for (const arg of node.arguments) {
        if (arg && ts.isObjectLiteralExpression(arg)) {
          const hasText = arg.properties.some(
            (p) =>
              ts.isPropertyAssignment(p) &&
              p.initializer &&
              ts.isStringLiteral(p.initializer) &&
              p.initializer.text === 'text'
          );
          if (hasText) {
            add(node, 'text-index-definition', 'HIGH',
              'text index is not supported by DocDB (use a regular index instead)');
            break;
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  };
  visit(src);
}

function main() {
  const files = collectFiles(ROOT, []);
  const findings = [];
  for (const f of files) scanFile(f, findings);

  findings.sort((a, b) =>
    a.file.localeCompare(b.file) || a.line - b.line);

  const byType = {};
  for (const f of findings) byType[f.type] = (byType[f.type] || 0) + 1;

  console.log(`\nDocumentDB compatibility audit — scanned ${files.length} files under ${path.relative(process.cwd(), ROOT)}\n`);
  if (findings.length === 0) {
    console.log('✅ No DocDB-incompatible aggregation patterns found.\n');
    return;
  }

  for (const f of findings) {
    const tag = f.severity === 'HIGH' ? '❌ HIGH ' : '⚠️  MED  ';
    console.log(`${tag} ${f.file}:${f.line}  ${f.type}\n           ${f.detail}`);
  }

  console.log('\n── summary ──');
  for (const [type, count] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${count}\t${type}`);
  }
  const high = findings.filter((f) => f.severity === 'HIGH').length;
  const med = findings.filter((f) => f.severity === 'MEDIUM').length;
  console.log(`\n  ${high} HIGH, ${med} MEDIUM  (total ${findings.length})\n`);

  // Non-zero exit on HIGH so this can gate CI.
  process.exit(high > 0 ? 1 : 0);
}

main();
