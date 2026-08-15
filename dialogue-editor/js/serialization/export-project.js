/**
 * Arquivo de projeto (§12.1): backup completo e editável.
 * Pode ser exportado mesmo com erros de validação.
 */

import { PROJECT_FORMAT, PROJECT_FORMAT_VERSION, deepClone } from '../domain/project-model.js';

export const PROJECT_FILE_NAME = 'aramara-dialogos-arco.projeto.json';

export function buildProjectFile(project) {
  const copy = deepClone(project);
  return {
    ...copy,
    format: PROJECT_FORMAT,
    formatVersion: PROJECT_FORMAT_VERSION,
    metadata: { ...copy.metadata, updatedAt: new Date().toISOString() }
  };
}

export function serializeProject(project) {
  return `${JSON.stringify(buildProjectFile(project), null, 2)}\n`;
}
