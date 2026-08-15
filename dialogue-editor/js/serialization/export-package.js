/**
 * Pacote final (§12.2): handoff estruturado para o futuro importador Unity.
 *
 * Contém apenas sequências ativas, falas ativas em ordem e condições
 * normalizadas. Nunca inclui viewport, falas arquivadas, histórico, áudio nem
 * estado do simulador. A exportação é bloqueada por erros, mas não por avisos.
 */

import { PACKAGE_FORMAT, PACKAGE_FORMAT_VERSION, playableLines } from '../domain/project-model.js';

export const PACKAGE_FILE_NAME = 'aramara-dialogos-arco.pacote.json';

function normalizeConditionsForPackage(conditions) {
  return {
    trust: {
      minimum: conditions.trust.minimum,
      maximum: conditions.trust.maximum
    },
    itemStates: conditions.itemStates
      .map((entry) => ({ itemId: entry.itemId, state: entry.state, value: entry.value }))
      .sort((a, b) => a.itemId.localeCompare(b.itemId) || a.state.localeCompare(b.state)),
    milestones: conditions.milestones
      .map((entry) => ({ milestoneId: entry.milestoneId, value: entry.value }))
      .sort((a, b) => a.milestoneId.localeCompare(b.milestoneId))
  };
}

function packLine(line) {
  const packed = {
    id: line.id,
    title: line.title,
    speakerId: line.speakerId,
    text: { 'pt-BR': line.text['pt-BR'], en: line.text.en },
    repeat: line.repeat,
    conditions: normalizeConditionsForPackage(line.conditions)
  };
  if (line.comment && line.comment.trim()) packed.comment = line.comment;
  return packed;
}

export function buildPackage(project, { warnings = [], generatedAt = new Date().toISOString() } = {}) {
  const sequences = project.sequences
    .filter((sequence) => sequence.enabled)
    .map((sequence) => ({
      id: sequence.id,
      trigger: sequence.trigger.parameter
        ? { type: sequence.trigger.type, parameter: sequence.trigger.parameter }
        : { type: sequence.trigger.type },
      lines: playableLines(sequence).map(packLine)
    }))
    .filter((sequence) => sequence.lines.length > 0);

  const packaged = {
    format: PACKAGE_FORMAT,
    formatVersion: PACKAGE_FORMAT_VERSION,
    gameSchemaVersion: project.gameSchemaVersion,
    generatedAt,
    metadata: {
      projectId: project.metadata.projectId,
      name: project.metadata.name,
      author: project.metadata.author,
      revisionComment: project.metadata.revisionComment,
      updatedAt: project.metadata.updatedAt
    },
    sequences
  };

  if (warnings.length > 0) {
    packaged.acceptedWarnings = warnings.map((warning) => ({
      code: warning.code,
      message: warning.message,
      sequenceId: warning.sequenceId || null,
      lineId: warning.lineId || null
    }));
  }

  return packaged;
}

export function serializePackage(project, options) {
  return `${JSON.stringify(buildPackage(project, options), null, 2)}\n`;
}
