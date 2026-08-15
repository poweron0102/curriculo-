/** Runner mínimo de testes, sem dependências externas. */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { indexSchema, normalizeProject } from '../js/domain/project-model.js';

const here = dirname(fileURLToPath(import.meta.url));

export const registry = [];

export function test(name, fn) {
  registry.push({ name, fn });
}

export function assert(condition, message) {
  if (!condition) throw new Error(message || 'asserção falhou');
}

export function assertEqual(actual, expected, message) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) {
    throw new Error(`${message || 'valores diferentes'}\n  esperado: ${b}\n  recebido: ${a}`);
  }
}

export function readJson(relativePath) {
  return JSON.parse(readFileSync(resolve(here, '..', relativePath), 'utf8'));
}

export const gameSchema = readJson('data/game-schema.json');
export const schemaIndex = indexSchema(gameSchema);

export function defaultProject() {
  return normalizeProject(readJson('data/default-project.json'));
}

/** Projeto mínimo para testes de domínio. */
export function makeProject(sequences) {
  return normalizeProject({
    format: 'aramara-dialogue-project',
    formatVersion: 1,
    gameSchemaVersion: 1,
    metadata: {
      projectId: 'project_test',
      name: 'Teste',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    },
    sequences
  });
}

export function makeLine(overrides = {}) {
  return {
    id: overrides.id || 'line_test',
    title: overrides.title || 'Fala de teste',
    speakerId: overrides.speakerId || 'indio',
    text: overrides.text || { 'pt-BR': 'texto', en: 'text' },
    comment: overrides.comment || '',
    repeat: overrides.repeat || 'every_trigger',
    conditions: overrides.conditions || { trust: { minimum: null, maximum: null }, itemStates: [], milestones: [] },
    archived: overrides.archived || false
  };
}
