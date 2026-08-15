/**
 * Importação de arquivo de projeto (§12.1 e §12.3).
 *
 * A importação nunca destrói o projeto atual: o chamador só substitui o
 * documento quando `ok` é verdadeiro e o usuário confirma.
 */

import { normalizeProject } from '../domain/project-model.js';
import { migrateProject, applySchemaRenames, MigrationError } from './migrations.js';

export function importProjectFromText(text, schema) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return { ok: false, error: `O arquivo não é um JSON válido: ${error.message}`, project: null, warnings: [] };
  }
  return importProjectFromObject(parsed, schema);
}

export function importProjectFromObject(parsed, schema) {
  let migrated;
  try {
    migrated = migrateProject(parsed);
  } catch (error) {
    if (error instanceof MigrationError) {
      return { ok: false, error: error.message, project: null, warnings: [] };
    }
    throw error;
  }

  const renamed = applySchemaRenames(migrated.raw, schema);
  const project = normalizeProject(renamed.raw);
  const warnings = [...migrated.warnings, ...renamed.warnings];

  if (project.sequences.length === 0) {
    warnings.push({
      code: 'empty_project',
      sequenceId: null,
      lineId: null,
      message: 'O projeto importado não contém nenhuma sequência.'
    });
  }

  return { ok: true, error: null, project, warnings };
}

export async function importProjectFromFile(file, schema) {
  const text = await file.text();
  return importProjectFromText(text, schema);
}
