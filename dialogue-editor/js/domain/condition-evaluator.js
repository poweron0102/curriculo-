/**
 * Avaliação de condições e simulação da reprodução de uma sequência.
 *
 * Semântica representada (§7 do plano):
 *   o evento ocorre -> o estado causado é registrado -> as condições são
 *   avaliadas sobre o estado já atualizado -> a lista de falas válidas é
 *   congelada e enfileirada na ordem exibida.
 */

import { playableLines } from './project-model.js';

/** Estado histórico de uma tentativa do minigame. */
export function createState(overrides = {}) {
  return {
    trust: 0,
    collected: {},
    delivered: {},
    milestones: {},
    /** IDs de falas `once_per_session` já reproduzidas nesta tentativa. */
    consumedLineIds: [],
    ...overrides
  };
}

export function isCollected(state, itemId) {
  return state.collected[itemId] === true || state.delivered[itemId] === true;
}

export function isDelivered(state, itemId) {
  return state.delivered[itemId] === true;
}

export function hasMilestone(state, milestoneId) {
  return state.milestones[milestoneId] === true;
}

export function isConsumed(state, lineId) {
  return state.consumedLineIds.includes(lineId);
}

/**
 * Aplica os efeitos de um gatilho ao estado. Executado ANTES da avaliação das
 * condições, conforme a ordem temporal do §7.
 */
export function applyTriggerEffects(state, schemaIndex, trigger) {
  const definition = schemaIndex.triggers.get(trigger.type);
  if (!definition || !Array.isArray(definition.effects)) return state;

  const next = {
    ...state,
    collected: { ...state.collected },
    delivered: { ...state.delivered },
    milestones: { ...state.milestones }
  };

  for (const effect of definition.effects) {
    const itemId = effect.itemId === '$parameter' ? trigger.parameter : effect.itemId;
    const milestoneId = effect.milestoneId === '$parameter' ? trigger.parameter : effect.milestoneId;

    if (effect.kind === 'item_collected' && itemId) {
      next.collected[itemId] = effect.value !== false;
    } else if (effect.kind === 'item_delivered' && itemId) {
      // Entregar implica ter coletado (§4.7).
      next.delivered[itemId] = effect.value !== false;
      if (effect.value !== false) next.collected[itemId] = true;
    } else if (effect.kind === 'milestone' && milestoneId) {
      next.milestones[milestoneId] = effect.value !== false;
    }
  }
  return next;
}

/** Motivo estruturado pelo qual uma condição individual falhou. */
function trustFailure(conditions, state) {
  const { minimum, maximum } = conditions.trust;
  if (minimum !== null && state.trust < minimum) {
    return `confiança ${state.trust} é menor que o mínimo ${minimum}`;
  }
  if (maximum !== null && state.trust > maximum) {
    return `confiança ${state.trust} é maior que o máximo ${maximum}`;
  }
  return null;
}

/**
 * Avalia as condições de uma fala. Todas são combinadas com E (§4.7).
 * Retorna `{ satisfied, reason }`; `reason` é `null` quando satisfeita.
 */
export function evaluateConditions(conditions, state) {
  const trustReason = trustFailure(conditions, state);
  if (trustReason) return { satisfied: false, reason: trustReason };

  for (const entry of conditions.itemStates) {
    const actual = entry.state === 'collected' ? isCollected(state, entry.itemId) : isDelivered(state, entry.itemId);
    if (actual !== entry.value) {
      const verb = entry.state === 'collected' ? 'pego' : 'entregue';
      return {
        satisfied: false,
        reason: entry.value
          ? `o item ${entry.itemId} ainda não foi ${verb}`
          : `o item ${entry.itemId} já foi ${verb}`
      };
    }
  }

  for (const entry of conditions.milestones) {
    if (hasMilestone(state, entry.milestoneId) !== entry.value) {
      return {
        satisfied: false,
        reason: entry.value
          ? `o marco ${entry.milestoneId} ainda não ocorreu`
          : `o marco ${entry.milestoneId} já ocorreu`
      };
    }
  }

  return { satisfied: true, reason: null };
}

/**
 * Congela a lista de falas reproduzidas por uma sequência em um estado.
 *
 * `state` já deve conter os efeitos do gatilho aplicados — use
 * `runSequence` para fazer as duas etapas na ordem correta.
 *
 * Retorna `{ played, skipped }`, ambos na ordem exibida pelas setas.
 */
export function evaluateSequence(sequence, state) {
  const played = [];
  const skipped = [];

  for (const line of playableLines(sequence)) {
    if (line.repeat === 'once_per_session' && isConsumed(state, line.id)) {
      skipped.push({ line, reason: 'fala de uma vez por tentativa já reproduzida' });
      continue;
    }
    const verdict = evaluateConditions(line.conditions, state);
    if (verdict.satisfied) {
      played.push(line);
    } else {
      skipped.push({ line, reason: verdict.reason });
    }
  }

  return { played, skipped };
}

/**
 * Executa um gatilho: aplica os efeitos ao estado, congela as falas válidas e
 * devolve o estado resultante com as falas únicas marcadas como consumidas.
 */
export function runSequence(sequence, schemaIndex, state) {
  const stateAtTrigger = applyTriggerEffects(state, schemaIndex, sequence.trigger);
  const { played, skipped } = evaluateSequence(sequence, stateAtTrigger);

  const consumed = stateAtTrigger.consumedLineIds.slice();
  for (const line of played) {
    if (line.repeat === 'once_per_session' && !consumed.includes(line.id)) {
      consumed.push(line.id);
    }
  }

  return {
    stateAtTrigger,
    played,
    skipped,
    stateAfter: { ...stateAtTrigger, consumedLineIds: consumed }
  };
}

/** Estado com todas as falas únicas da sequência já consumidas (§8.3). */
export function withSequenceConsumed(state, sequence) {
  const consumed = state.consumedLineIds.slice();
  for (const line of playableLines(sequence)) {
    if (line.repeat === 'once_per_session' && !consumed.includes(line.id)) {
      consumed.push(line.id);
    }
  }
  return { ...state, consumedLineIds: consumed };
}
