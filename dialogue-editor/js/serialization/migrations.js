/**
 * Migrações entre versões do arquivo de projeto (§12.3).
 *
 * Regras: preservar dados desconhecidos, migrar versões compatíveis, manter
 * referências removidas visíveis (a validação as marca como erro) e nunca
 * modificar o arquivo original no computador.
 */

import { PROJECT_FORMAT, PROJECT_FORMAT_VERSION } from '../domain/project-model.js';

/**
 * Cada passo leva de `from` para `from + 1`. Ao criar a versão 2 do formato,
 * acrescente aqui o passo `{ from: 1, apply(raw) { ... } }`.
 */
const STEPS = [];

export class MigrationError extends Error {}

/**
 * Retorna `{ raw, warnings }` com o documento na versão atual do formato.
 * Lança `MigrationError` quando não existe caminho de migração.
 */
export function migrateProject(rawInput) {
  const warnings = [];
  if (!rawInput || typeof rawInput !== 'object') {
    throw new MigrationError('O arquivo não contém um objeto JSON válido.');
  }

  let raw = rawInput;

  if (raw.format !== PROJECT_FORMAT) {
    throw new MigrationError(
      `Este arquivo não é um projeto de diálogos do Ara Mara (formato “${raw.format || '—'}”).`
    );
  }

  let version = Number.isInteger(raw.formatVersion) ? raw.formatVersion : 1;

  if (version > PROJECT_FORMAT_VERSION) {
    throw new MigrationError(
      `O arquivo usa a versão ${version} do formato, mais nova que a suportada por este editor (${PROJECT_FORMAT_VERSION}).`
    );
  }

  while (version < PROJECT_FORMAT_VERSION) {
    const step = STEPS.find((candidate) => candidate.from === version);
    if (!step) {
      throw new MigrationError(`Não existe migração conhecida da versão ${version} para a ${version + 1}.`);
    }
    raw = step.apply(raw);
    version += 1;
    warnings.push({
      code: 'migrated_project',
      sequenceId: null,
      lineId: null,
      message: `O projeto foi migrado automaticamente para a versão ${version} do formato. Revise antes de exportar o pacote final.`
    });
  }

  return { raw: { ...raw, formatVersion: PROJECT_FORMAT_VERSION }, warnings };
}

/** Renomeações de IDs declaradas no catálogo, aplicadas sem perder dados. */
export function applySchemaRenames(raw, schema) {
  const renames = (schema.migrations && schema.migrations.renamedIds) || {};
  if (Object.keys(renames).length === 0) return { raw, warnings: [] };

  const warnings = [];
  const rename = (value) => {
    if (typeof value === 'string' && Object.prototype.hasOwnProperty.call(renames, value)) {
      warnings.push({
        code: 'renamed_reference',
        sequenceId: null,
        lineId: null,
        message: `A referência “${value}” foi renomeada para “${renames[value]}” pelo catálogo do jogo.`
      });
      return renames[value];
    }
    return value;
  };

  const migrated = {
    ...raw,
    sequences: (raw.sequences || []).map((sequence) => ({
      ...sequence,
      trigger: sequence.trigger
        ? { ...sequence.trigger, type: rename(sequence.trigger.type), parameter: rename(sequence.trigger.parameter) }
        : sequence.trigger,
      lines: (sequence.lines || []).map((line) => ({
        ...line,
        speakerId: rename(line.speakerId),
        conditions: line.conditions
          ? {
              ...line.conditions,
              itemStates: (line.conditions.itemStates || []).map((entry) => ({
                ...entry,
                itemId: rename(entry.itemId)
              })),
              milestones: (line.conditions.milestones || []).map((entry) => ({
                ...entry,
                milestoneId: rename(entry.milestoneId)
              }))
            }
          : line.conditions
      }))
    }))
  };

  return { raw: migrated, warnings };
}
