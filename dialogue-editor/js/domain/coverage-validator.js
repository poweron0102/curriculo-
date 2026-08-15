/**
 * Análise de cobertura (§8): para cada sequência ativa, provar que todo estado
 * alcançável no momento do gatilho possui ao menos uma fala reproduzível.
 */

import { buildStateSpace, describeState } from './reachability.js';
import { evaluateSequence, evaluateConditions, isConsumed } from './condition-evaluator.js';
import { playableLines, describeTrigger } from './project-model.js';

export const OCCURRENCE_FIRST = 'first';
export const OCCURRENCE_SUBSEQUENT = 'subsequent';

function consumedForOccurrence(sequence, occurrence) {
  if (occurrence !== OCCURRENCE_SUBSEQUENT) return [];
  return playableLines(sequence)
    .filter((line) => line.repeat === 'once_per_session')
    .map((line) => line.id);
}

function occurrenceLabel(occurrence) {
  return occurrence === OCCURRENCE_SUBSEQUENT ? 'ocorrência posterior' : 'primeira ocorrência';
}

/** Cenário serializável que abre o simulador exatamente na contraprova (§8.4). */
function toScenario(sequence, state, occurrence) {
  return {
    sequenceId: sequence.id,
    triggerType: sequence.trigger.type,
    triggerParameter: sequence.trigger.parameter,
    occurrence,
    trust: state.trust,
    collected: { ...state.collected },
    delivered: { ...state.delivered },
    milestones: { ...state.milestones }
  };
}

function explainSilence(skipped) {
  if (skipped.length === 0) {
    return 'a sequência está ativa mas não possui nenhuma fala reproduzível.';
  }
  const reasons = skipped.slice(0, 4).map(({ line, reason }) => `“${line.title || line.id}”: ${reason}`);
  const suffix = skipped.length > 4 ? ` (e mais ${skipped.length - 4})` : '';
  return `nenhuma fala foi aceita — ${reasons.join('; ')}${suffix}.`;
}

/**
 * Analisa a cobertura de todas as sequências ativas.
 * Retorna `{ errors, warnings }` com entradas estruturadas e determinísticas.
 */
export function analyzeCoverage(project, schemaIndex) {
  const errors = [];
  const warnings = [];

  for (const sequence of project.sequences) {
    // Sequência inativa representa silêncio intencional (§4.3).
    if (!sequence.enabled) continue;

    const triggerDefinition = schemaIndex.triggers.get(sequence.trigger.type);
    const label = describeTrigger(schemaIndex, sequence.trigger);
    const lines = playableLines(sequence);

    if (lines.length === 0) {
      errors.push({
        code: 'coverage_empty_sequence',
        sequenceId: sequence.id,
        lineId: null,
        message: `A sequência “${label}” está ativa mas não possui nenhuma fala ativa.`,
        scenario: toScenario(sequence, { trust: 0, collected: {}, delivered: {}, milestones: {} }, OCCURRENCE_FIRST)
      });
      continue;
    }

    const { states, projection, truncated } = buildStateSpace(sequence, schemaIndex);

    if (truncated) {
      warnings.push({
        code: 'coverage_truncated',
        sequenceId: sequence.id,
        lineId: null,
        message: `A sequência “${label}” usa variáveis demais para uma análise completa de cobertura. Reduza as condições ou revise manualmente.`
      });
      continue;
    }

    const occurrences = [OCCURRENCE_FIRST];
    if (triggerDefinition && triggerDefinition.repeatable) occurrences.push(OCCURRENCE_SUBSEQUENT);

    for (const occurrence of occurrences) {
      const consumedLineIds = consumedForOccurrence(sequence, occurrence);
      let gap = null;

      for (const state of states) {
        const stateWithHistory = { ...state, consumedLineIds };
        const { played, skipped } = evaluateSequence(sequence, stateWithHistory);
        if (played.length === 0) {
          gap = { state: stateWithHistory, skipped };
          break;
        }
      }

      if (gap) {
        const described = describeState(gap.state, projection, schemaIndex);
        const details = [
          `confiança ${described.trust}`,
          described.collected.length ? `itens pegos: ${described.collected.join(', ')}` : 'nenhum item relevante pego',
          described.delivered.length
            ? `itens entregues: ${described.delivered.join(', ')}`
            : 'nenhum item relevante entregue',
          described.milestones.length ? `marcos: ${described.milestones.join(', ')}` : 'nenhum marco relevante'
        ];

        errors.push({
          code:
            occurrence === OCCURRENCE_SUBSEQUENT
              ? 'coverage_gap_after_consumption'
              : 'coverage_gap',
          sequenceId: sequence.id,
          lineId: null,
          message:
            `Ramo silencioso em “${label}” (${occurrenceLabel(occurrence)}): ` +
            `${details.join('; ')}. Motivo: ${explainSilence(gap.skipped)}`,
          scenario: toScenario(sequence, gap.state, occurrence)
        });
      }
    }

    // Falas impossíveis: nenhuma combinação alcançável aceita a fala (§9.1).
    for (const line of lines) {
      const reachable = states.some((state) => {
        const stateWithHistory = { ...state, consumedLineIds: [] };
        if (line.repeat === 'once_per_session' && isConsumed(stateWithHistory, line.id)) return false;
        return evaluateConditions(line.conditions, stateWithHistory).satisfied;
      });
      if (!reachable) {
        errors.push({
          code: 'unreachable_line',
          sequenceId: sequence.id,
          lineId: line.id,
          message: `A fala “${line.title || line.id}” em “${label}” nunca pode ser reproduzida: nenhum estado alcançável satisfaz suas condições.`,
          scenario: toScenario(sequence, states[0] || { trust: 0, collected: {}, delivered: {}, milestones: {} }, OCCURRENCE_FIRST)
        });
      }
    }
  }

  return { errors, warnings };
}
