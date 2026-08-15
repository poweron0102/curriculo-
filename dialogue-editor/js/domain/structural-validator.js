/**
 * Validação estrutural (§9.1 e §9.2) e agregação com a análise de cobertura.
 */

import {
  PROJECT_FORMAT,
  PROJECT_FORMAT_VERSION,
  conditionsSignature,
  describeTrigger,
  hasAnyText,
  missingLanguages,
  playableLines
} from './project-model.js';
import { analyzeCoverage } from './coverage-validator.js';

const LANGUAGE_NAMES = { 'pt-BR': 'português', en: 'inglês' };

export function validateStructure(project, schemaIndex) {
  const errors = [];
  const warnings = [];
  const seenIds = new Map();

  const claimId = (id, description) => {
    if (seenIds.has(id)) {
      errors.push({
        code: 'duplicate_id',
        sequenceId: null,
        lineId: null,
        message: `ID duplicado “${id}”: usado por ${seenIds.get(id)} e por ${description}.`
      });
      return;
    }
    seenIds.set(id, description);
  };

  if (project.format !== PROJECT_FORMAT) {
    errors.push({
      code: 'invalid_format',
      sequenceId: null,
      lineId: null,
      message: `Formato de arquivo inesperado: “${project.format}”.`
    });
  }
  if (project.formatVersion > PROJECT_FORMAT_VERSION) {
    errors.push({
      code: 'unsupported_format_version',
      sequenceId: null,
      lineId: null,
      message: `Versão de formato ${project.formatVersion} não é suportada por este editor (máxima ${PROJECT_FORMAT_VERSION}).`
    });
  }
  if (project.gameSchemaVersion !== schemaIndex.version) {
    warnings.push({
      code: 'game_schema_version_mismatch',
      sequenceId: null,
      lineId: null,
      message: `O projeto foi criado com a versão ${project.gameSchemaVersion} do catálogo; o editor usa a versão ${schemaIndex.version}.`
    });
  }

  const triggerKeys = new Map();

  for (const sequence of project.sequences) {
    const label = describeTrigger(schemaIndex, sequence.trigger);
    claimId(sequence.id, `a sequência “${label}”`);

    const triggerDefinition = schemaIndex.triggers.get(sequence.trigger.type);
    if (!triggerDefinition) {
      errors.push({
        code: 'unknown_trigger',
        sequenceId: sequence.id,
        lineId: null,
        message: `A sequência “${sequence.id}” referencia o gatilho inexistente “${sequence.trigger.type}”.`
      });
    } else if (triggerDefinition.parameter) {
      const parameter = sequence.trigger.parameter;
      const catalog =
        triggerDefinition.parameter.kind === 'item' ? schemaIndex.items : schemaIndex.endings;
      if (!parameter || !catalog.has(parameter)) {
        errors.push({
          code: 'unknown_trigger_parameter',
          sequenceId: sequence.id,
          lineId: null,
          message: `A sequência “${label}” usa um parâmetro de gatilho inexistente no catálogo: “${parameter || '—'}”.`
        });
      }
    } else if (sequence.trigger.parameter) {
      warnings.push({
        code: 'unexpected_trigger_parameter',
        sequenceId: sequence.id,
        lineId: null,
        message: `A sequência “${label}” tem um parâmetro (“${sequence.trigger.parameter}”) que o gatilho não usa.`
      });
    }

    const triggerKey = `${sequence.trigger.type}:${sequence.trigger.parameter || ''}`;
    if (triggerKeys.has(triggerKey)) {
      warnings.push({
        code: 'duplicate_trigger',
        sequenceId: sequence.id,
        lineId: null,
        message: `Existe mais de uma sequência para “${label}”. Elas serão avaliadas de forma independente.`
      });
    } else {
      triggerKeys.set(triggerKey, sequence.id);
    }

    const signatures = new Map();

    for (const line of sequence.lines) {
      claimId(line.id, `a fala “${line.title || line.id}”`);

      if (!schemaIndex.speakers.has(line.speakerId)) {
        errors.push({
          code: 'unknown_speaker',
          sequenceId: sequence.id,
          lineId: line.id,
          message: `A fala “${line.title || line.id}” usa o locutor inexistente “${line.speakerId || '—'}”.`
        });
      }

      if (!line.title.trim()) {
        warnings.push({
          code: 'missing_title',
          sequenceId: sequence.id,
          lineId: line.id,
          message: 'Uma fala está sem título amigável.'
        });
      }

      if (!line.archived) {
        if (!hasAnyText(line)) {
          errors.push({
            code: 'empty_text',
            sequenceId: sequence.id,
            lineId: line.id,
            message: `A fala “${line.title || line.id}” está sem texto em português e sem texto em inglês.`
          });
        } else {
          for (const language of missingLanguages(line)) {
            warnings.push({
              code: 'missing_translation',
              sequenceId: sequence.id,
              lineId: line.id,
              message: `A fala “${line.title || line.id}” está sem tradução em ${LANGUAGE_NAMES[language]}.`
            });
          }
        }
      }

      const { minimum, maximum } = line.conditions.trust;
      if (minimum !== null && maximum !== null && minimum > maximum) {
        errors.push({
          code: 'contradictory_trust',
          sequenceId: sequence.id,
          lineId: line.id,
          message: `A fala “${line.title || line.id}” exige confiança mínima ${minimum} e máxima ${maximum} ao mesmo tempo.`
        });
      }
      const trustCeiling = schemaIndex.trust.maximum;
      if (minimum !== null && minimum > trustCeiling) {
        errors.push({
          code: 'unreachable_trust',
          sequenceId: sequence.id,
          lineId: line.id,
          message: `A fala “${line.title || line.id}” exige confiança ${minimum}, acima do máximo alcançável (${trustCeiling}).`
        });
      }

      const perTerm = new Map();
      for (const entry of line.conditions.itemStates) {
        if (!schemaIndex.items.has(entry.itemId)) {
          errors.push({
            code: 'unknown_item',
            sequenceId: sequence.id,
            lineId: line.id,
            message: `A fala “${line.title || line.id}” referencia o item inexistente “${entry.itemId}”.`
          });
        }
        const key = `${entry.itemId}:${entry.state}`;
        if (perTerm.has(key) && perTerm.get(key) !== entry.value) {
          errors.push({
            code: 'contradictory_condition',
            sequenceId: sequence.id,
            lineId: line.id,
            message: `A fala “${line.title || line.id}” exige que o item “${entry.itemId}” esteja e não esteja no mesmo estado.`
          });
        }
        perTerm.set(key, entry.value);
      }

      const milestoneTerms = new Map();
      for (const entry of line.conditions.milestones) {
        if (!schemaIndex.milestones.has(entry.milestoneId)) {
          errors.push({
            code: 'unknown_milestone',
            sequenceId: sequence.id,
            lineId: line.id,
            message: `A fala “${line.title || line.id}” referencia o marco inexistente “${entry.milestoneId}”.`
          });
        }
        if (milestoneTerms.has(entry.milestoneId) && milestoneTerms.get(entry.milestoneId) !== entry.value) {
          errors.push({
            code: 'contradictory_condition',
            sequenceId: sequence.id,
            lineId: line.id,
            message: `A fala “${line.title || line.id}” exige que o marco “${entry.milestoneId}” tenha e não tenha ocorrido.`
          });
        }
        milestoneTerms.set(entry.milestoneId, entry.value);
      }
    }

    // Condições idênticas entre falas ativas: aviso, não erro (§9.2).
    for (const line of playableLines(sequence)) {
      const signature = conditionsSignature(line.conditions);
      if (signatures.has(signature)) {
        warnings.push({
          code: 'identical_conditions',
          sequenceId: sequence.id,
          lineId: line.id,
          message: `As falas “${signatures.get(signature)}” e “${line.title || line.id}” têm condições idênticas. Ambas serão reproduzidas em sequência.`
        });
      } else {
        signatures.set(signature, line.title || line.id);
      }
    }
  }

  return { errors, warnings };
}

/** Relatório completo: estrutura + cobertura, além dos avisos de migração. */
export function validateProject(project, schemaIndex, extraWarnings = []) {
  const structure = validateStructure(project, schemaIndex);
  const blockingStructure = structure.errors.some((error) =>
    ['invalid_format', 'unsupported_format_version', 'unknown_trigger', 'unknown_trigger_parameter'].includes(error.code)
  );

  // Sem gatilhos válidos não há espaço de estados confiável para a cobertura.
  const coverage = blockingStructure ? { errors: [], warnings: [] } : analyzeCoverage(project, schemaIndex);

  return {
    errors: [...structure.errors, ...coverage.errors],
    warnings: [...structure.warnings, ...coverage.warnings, ...extraWarnings]
  };
}
