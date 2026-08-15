import { registry } from './harness.js';

import './condition-evaluator.test.js';
import './reachability.test.js';
import './coverage-validator.test.js';
import './commands.test.js';
import './serialization.test.js';

let passed = 0;
const failures = [];

for (const { name, fn } of registry) {
  try {
    await fn();
    passed += 1;
  } catch (error) {
    failures.push({ name, error });
  }
}

for (const { name, error } of failures) {
  console.error(`FALHOU  ${name}\n        ${error.message.replace(/\n/g, '\n        ')}`);
}

console.log(`\n${passed}/${registry.length} testes passaram.`);
process.exit(failures.length === 0 ? 0 : 1);
