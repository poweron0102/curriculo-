/**
 * Cálculo dos estados alcançáveis no momento de um gatilho (§8.2).
 *
 * O espaço de estados NÃO é o produto cartesiano ingênuo de todos os campos.
 * Cada sequência projeta o espaço apenas sobre as variáveis citadas por suas
 * falas, mais as variáveis exigidas pelas restrições relacionadas e pelos
 * efeitos do próprio gatilho.
 */

import { createState, applyTriggerEffects } from './condition-evaluator.js';
import { playableLines } from './project-model.js';

/** Teto de estados enumerados por sequência. Acima disso a análise é parcial. */
export const MAX_ENUMERATED_STATES = 200000;

const ITEM_DOMAIN = [
  { collected: false, delivered: false },
  { collected: true, delivered: false },
  { collected: true, delivered: true }
];

/* ------------------------------------------------------------------ */
/* Projeção                                                            */
/* ------------------------------------------------------------------ */

function endingConstraintFor(schemaIndex, trigger) {
  const definition = schemaIndex.triggers.get(trigger.type);
  if (!definition || !definition.parameter || definition.parameter.kind !== 'ending') return null;
  const constraints = schemaIndex.reachability.endingConstraints || [];
  return constraints.find((entry) => entry.endingId === trigger.parameter) || null;
}

function requirementVariables(requirement, into) {
  if (requirement.kind === 'item_collected' || requirement.kind === 'item_delivered') {
    into.items.add(requirement.itemId);
  } else if (requirement.kind === 'milestone') {
    into.milestones.add(requirement.milestoneId);
  }
}

/**
 * Variáveis relevantes para uma sequência: as citadas pelas falas, as forçadas
 * pelo gatilho e o fecho das implicações que as envolvem.
 */
export function projectVariables(sequence, schemaIndex) {
  const projection = { items: new Set(), milestones: new Set(), usesTrust: false };

  for (const line of playableLines(sequence)) {
    const { conditions } = line;
    if (conditions.trust.minimum !== null || conditions.trust.maximum !== null) {
      projection.usesTrust = true;
    }
    for (const entry of conditions.itemStates) projection.items.add(entry.itemId);
    for (const entry of conditions.milestones) projection.milestones.add(entry.milestoneId);
  }

  const triggerDefinition = schemaIndex.triggers.get(sequence.trigger.type);
  for (const effect of (triggerDefinition && triggerDefinition.effects) || []) {
    const itemId = effect.itemId === '$parameter' ? sequence.trigger.parameter : effect.itemId;
    const milestoneId =
      effect.milestoneId === '$parameter' ? sequence.trigger.parameter : effect.milestoneId;
    if (itemId) projection.items.add(itemId);
    if (milestoneId) projection.milestones.add(milestoneId);
  }

  const endingConstraint = endingConstraintFor(schemaIndex, sequence.trigger);
  if (endingConstraint) {
    for (const requirement of endingConstraint.requires || []) {
      requirementVariables(requirement, projection);
    }
    if (endingConstraint.trust.minimum !== null || endingConstraint.trust.maximum !== null) {
      projection.usesTrust = true;
    }
  }

  // Fecho das implicações: se uma variável está no escopo, seus pré-requisitos
  // entram junto, senão o filtro descartaria estados válidos.
  const implications = schemaIndex.reachability.implications || [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const implication of implications) {
      if (!implication.when) continue;
      const inScope =
        (implication.when.kind === 'milestone' && projection.milestones.has(implication.when.milestoneId)) ||
        ((implication.when.kind === 'item_collected' || implication.when.kind === 'item_delivered') &&
          projection.items.has(implication.when.itemId));
      if (!inScope) continue;
      for (const requirement of implication.requires || []) {
        const before = projection.items.size + projection.milestones.size;
        requirementVariables(requirement, projection);
        if (projection.items.size + projection.milestones.size !== before) changed = true;
      }
    }
  }

  return {
    items: Array.from(projection.items).sort(),
    milestones: Array.from(projection.milestones).sort(),
    usesTrust: projection.usesTrust
  };
}

/* ------------------------------------------------------------------ */
/* Restrições                                                          */
/* ------------------------------------------------------------------ */

function requirementHolds(requirement, state) {
  if (requirement.kind === 'item_collected') {
    return (state.collected[requirement.itemId] === true) === (requirement.value !== false);
  }
  if (requirement.kind === 'item_delivered') {
    return (state.delivered[requirement.itemId] === true) === (requirement.value !== false);
  }
  if (requirement.kind === 'milestone') {
    return (state.milestones[requirement.milestoneId] === true) === (requirement.value !== false);
  }
  return true;
}

function conditionHolds(when, state) {
  return requirementHolds(when, state);
}

/**
 * Verifica as implicações do catálogo. Variáveis fora da projeção são livres:
 * uma implicação só reprova o estado quando TODOS os seus termos estão no
 * escopo projetado e algum pré-requisito é violado.
 */
function satisfiesImplications(state, schemaIndex, scope) {
  for (const implication of schemaIndex.reachability.implications || []) {
    if (!implication.when) continue;
    const whenVarInScope =
      implication.when.kind === 'milestone'
        ? scope.milestones.has(implication.when.milestoneId)
        : scope.items.has(implication.when.itemId);
    if (!whenVarInScope || !conditionHolds(implication.when, state)) continue;

    for (const requirement of implication.requires || []) {
      const requirementInScope =
        requirement.kind === 'milestone'
          ? scope.milestones.has(requirement.milestoneId)
          : scope.items.has(requirement.itemId);
      if (requirementInScope && !requirementHolds(requirement, state)) {
        return false;
      }
    }
  }
  return true;
}

/** Uma fonte de confiança pode estar ativa neste estado projetado? */
function sourceCanBeTrue(source, state, scope, schemaIndex) {
  if (source.when.kind === 'item_delivered') {
    if (scope.items.has(source.when.itemId)) {
      return state.delivered[source.when.itemId] === true;
    }
    return true;
  }
  if (source.when.kind === 'milestone') {
    const milestoneId = source.when.milestoneId;
    if (scope.milestones.has(milestoneId)) {
      return state.milestones[milestoneId] === true;
    }
    // Fora do escopo: só pode ser verdadeiro se seus pré-requisitos projetados
    // não estiverem negados (ex.: fogueira exige pederneira coletada).
    for (const implication of schemaIndex.reachability.implications || []) {
      if (
        implication.when &&
        implication.when.kind === 'milestone' &&
        implication.when.milestoneId === milestoneId &&
        implication.when.value !== false
      ) {
        for (const requirement of implication.requires || []) {
          const inScope =
            requirement.kind === 'milestone'
              ? scope.milestones.has(requirement.milestoneId)
              : scope.items.has(requirement.itemId);
          if (inScope && !requirementHolds(requirement, state)) return false;
        }
      }
    }
    return true;
  }
  return true;
}

function sourceIsTrue(source, state, scope) {
  if (source.when.kind === 'item_delivered') {
    return scope.items.has(source.when.itemId) && state.delivered[source.when.itemId] === true;
  }
  if (source.when.kind === 'milestone') {
    return scope.milestones.has(source.when.milestoneId) && state.milestones[source.when.milestoneId] === true;
  }
  return false;
}

/** Intervalo de confiança alcançável dado o estado projetado. */
export function trustBounds(state, schemaIndex, scope) {
  const trust = schemaIndex.trust;
  let minimum = trust.minimum || 0;
  let maximum = trust.minimum || 0;

  for (const source of trust.sources || []) {
    if (sourceIsTrue(source, state, scope)) {
      minimum += source.amount;
      maximum += source.amount;
    } else if (sourceCanBeTrue(source, state, scope, schemaIndex)) {
      maximum += source.amount;
    }
  }

  return {
    minimum: Math.min(minimum, trust.maximum),
    maximum: Math.min(maximum, trust.maximum)
  };
}

/**
 * Valores de confiança que precisam ser testados: os limites do intervalo e as
 * fronteiras citadas pelas falas (m-1, m, M, M+1).
 */
function trustCandidates(bounds, boundaryValues) {
  const candidates = new Set([bounds.minimum, bounds.maximum]);
  for (const value of boundaryValues) {
    candidates.add(value - 1);
    candidates.add(value);
    candidates.add(value + 1);
  }
  return Array.from(candidates)
    .filter((value) => value >= bounds.minimum && value <= bounds.maximum)
    .sort((a, b) => a - b);
}

function collectTrustBoundaries(sequence, schemaIndex) {
  const values = new Set();
  for (const line of playableLines(sequence)) {
    const { minimum, maximum } = line.conditions.trust;
    if (minimum !== null) values.add(minimum);
    if (maximum !== null) values.add(maximum);
  }
  const constraint = endingConstraintFor(schemaIndex, sequence.trigger);
  if (constraint) {
    if (constraint.trust.minimum !== null) values.add(constraint.trust.minimum);
    if (constraint.trust.maximum !== null) values.add(constraint.trust.maximum);
  }
  return Array.from(values);
}

/* ------------------------------------------------------------------ */
/* Enumeração                                                          */
/* ------------------------------------------------------------------ */

/**
 * Estados alcançáveis no instante do gatilho de uma sequência.
 *
 * Retorna `{ states, projection, truncated }`. Cada estado já contém os efeitos
 * do gatilho aplicados (§7, passo 2 antes do passo 3).
 */
export function buildStateSpace(sequence, schemaIndex) {
  const projection = projectVariables(sequence, schemaIndex);
  const scope = { items: new Set(projection.items), milestones: new Set(projection.milestones) };
  const endingConstraint = endingConstraintFor(schemaIndex, sequence.trigger);
  const boundaries = collectTrustBoundaries(sequence, schemaIndex);

  const combinations = Math.pow(3, projection.items.length) * Math.pow(2, projection.milestones.length);
  if (!Number.isFinite(combinations) || combinations > MAX_ENUMERATED_STATES) {
    return { states: [], projection, truncated: true };
  }

  const states = [];
  let truncated = false;

  const itemCount = projection.items.length;
  const milestoneCount = projection.milestones.length;

  for (let itemIndex = 0; itemIndex < Math.pow(3, itemCount); itemIndex += 1) {
    const collected = {};
    const delivered = {};
    let rest = itemIndex;
    for (let position = 0; position < itemCount; position += 1) {
      const value = ITEM_DOMAIN[rest % 3];
      rest = Math.floor(rest / 3);
      collected[projection.items[position]] = value.collected;
      delivered[projection.items[position]] = value.delivered;
    }

    for (let mask = 0; mask < Math.pow(2, milestoneCount); mask += 1) {
      const milestones = {};
      for (let position = 0; position < milestoneCount; position += 1) {
        milestones[projection.milestones[position]] = ((mask >> position) & 1) === 1;
      }

      const base = createState({ collected, delivered, milestones });
      const atTrigger = applyTriggerEffects(base, schemaIndex, sequence.trigger);

      if (!satisfiesImplications(atTrigger, schemaIndex, scope)) continue;
      if (endingConstraint) {
        const requirementsHold = (endingConstraint.requires || []).every((requirement) =>
          requirementHolds(requirement, atTrigger)
        );
        if (!requirementsHold) continue;
      }

      let bounds = trustBounds(atTrigger, schemaIndex, scope);
      if (endingConstraint) {
        if (endingConstraint.trust.minimum !== null) {
          bounds = { ...bounds, minimum: Math.max(bounds.minimum, endingConstraint.trust.minimum) };
        }
        if (endingConstraint.trust.maximum !== null) {
          bounds = { ...bounds, maximum: Math.min(bounds.maximum, endingConstraint.trust.maximum) };
        }
      }
      if (bounds.minimum > bounds.maximum) continue;

      for (const trust of trustCandidates(bounds, boundaries)) {
        if (states.length >= MAX_ENUMERATED_STATES) {
          truncated = true;
          break;
        }
        states.push({ ...atTrigger, trust });
      }
      if (truncated) break;
    }
    if (truncated) break;
  }

  return { states, projection, truncated };
}

/** Descrição legível de um estado, usada nas contraprovas (§8.4). */
export function describeState(state, projection, schemaIndex) {
  const collected = projection.items.filter((itemId) => state.collected[itemId] === true);
  const delivered = projection.items.filter((itemId) => state.delivered[itemId] === true);
  const milestones = projection.milestones.filter((id) => state.milestones[id] === true);
  const name = (id, map) => (map.get(id) ? map.get(id).name : id);

  return {
    trust: state.trust,
    collected: collected.map((id) => name(id, schemaIndex.items)),
    delivered: delivered.map((id) => name(id, schemaIndex.items)),
    milestones: milestones.map((id) => name(id, schemaIndex.milestones))
  };
}
