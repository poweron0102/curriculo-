import { test, assert, assertEqual, schemaIndex, makeProject, makeLine } from './harness.js';
import { normalizeConditions } from '../js/domain/project-model.js';
import {
  createState,
  evaluateConditions,
  evaluateSequence,
  runSequence,
  applyTriggerEffects,
  isCollected,
  isDelivered
} from '../js/domain/condition-evaluator.js';

const conditions = (overrides) => normalizeConditions(overrides);

test('confiança mínima é inclusiva', () => {
  const c = conditions({ trust: { minimum: 3 } });
  assert(!evaluateConditions(c, createState({ trust: 2 })).satisfied);
  assert(evaluateConditions(c, createState({ trust: 3 })).satisfied);
  assert(evaluateConditions(c, createState({ trust: 9 })).satisfied);
});

test('confiança máxima é inclusiva', () => {
  const c = conditions({ trust: { maximum: 3 } });
  assert(evaluateConditions(c, createState({ trust: 3 })).satisfied);
  assert(!evaluateConditions(c, createState({ trust: 4 })).satisfied);
});

test('faixa de confiança combina mínimo e máximo', () => {
  const c = conditions({ trust: { minimum: 2, maximum: 4 } });
  assert(!evaluateConditions(c, createState({ trust: 1 })).satisfied);
  assert(evaluateConditions(c, createState({ trust: 2 })).satisfied);
  assert(evaluateConditions(c, createState({ trust: 4 })).satisfied);
  assert(!evaluateConditions(c, createState({ trust: 5 })).satisfied);
});

test('condição de item pego usa o histórico da tentativa', () => {
  const c = conditions({ itemStates: [{ itemId: 'plant_fiber', state: 'collected', value: true }] });
  assert(!evaluateConditions(c, createState()).satisfied);
  assert(evaluateConditions(c, createState({ collected: { plant_fiber: true } })).satisfied);
});

test('entregar implica ter coletado', () => {
  const state = createState({ delivered: { wild_berries: true } });
  assert(isCollected(state, 'wild_berries'), 'entrega implica coleta');
  assert(isDelivered(state, 'wild_berries'));
  const collectedOnly = createState({ collected: { wild_berries: true } });
  assert(!isDelivered(collectedOnly, 'wild_berries'), 'coletar não implica entregar');
});

test('condição negativa exige que o item ainda não esteja no estado', () => {
  const c = conditions({ itemStates: [{ itemId: 'old_bow', state: 'collected', value: false }] });
  assert(evaluateConditions(c, createState()).satisfied);
  assert(!evaluateConditions(c, createState({ collected: { old_bow: true } })).satisfied);
});

test('condições de marco funcionam nos dois sentidos', () => {
  const positive = conditions({ milestones: [{ milestoneId: 'fire_lit', value: true }] });
  const negative = conditions({ milestones: [{ milestoneId: 'fire_lit', value: false }] });
  assert(!evaluateConditions(positive, createState()).satisfied);
  assert(evaluateConditions(negative, createState()).satisfied);
  assert(evaluateConditions(positive, createState({ milestones: { fire_lit: true } })).satisfied);
});

test('todas as condições são combinadas com E', () => {
  const c = conditions({
    trust: { minimum: 2 },
    itemStates: [{ itemId: 'plant_fiber', state: 'collected', value: true }],
    milestones: [{ milestoneId: 'fire_lit', value: true }]
  });
  assert(!evaluateConditions(c, createState({ trust: 2, collected: { plant_fiber: true } })).satisfied);
  assert(
    evaluateConditions(
      c,
      createState({ trust: 2, collected: { plant_fiber: true }, milestones: { fire_lit: true } })
    ).satisfied
  );
});

test('o estado do gatilho é aplicado antes da avaliação', () => {
  const state = applyTriggerEffects(createState(), schemaIndex, {
    type: 'first_item_collected',
    parameter: 'plant_fiber'
  });
  assert(isCollected(state, 'plant_fiber'), 'no gatilho de coleta o item já está pego');

  const delivery = applyTriggerEffects(createState(), schemaIndex, {
    type: 'first_item_delivered',
    parameter: 'wild_berries'
  });
  assert(isDelivered(delivery, 'wild_berries'), 'no gatilho de entrega o item já está entregue');
  assert(isCollected(delivery, 'wild_berries'), 'e também consta como pego');
});

test('fala única não é reproduzida depois de consumida', () => {
  const sequence = makeProject([
    {
      id: 'seq',
      trigger: { type: 'manual_conversation' },
      enabled: true,
      lines: [makeLine({ id: 'a', repeat: 'once_per_session' })]
    }
  ]).sequences[0];

  assertEqual(evaluateSequence(sequence, createState()).played.map((l) => l.id), ['a']);
  assertEqual(evaluateSequence(sequence, createState({ consumedLineIds: ['a'] })).played.map((l) => l.id), []);
});

test('múltiplas falas válidas preservam a ordem exibida', () => {
  const sequence = makeProject([
    {
      id: 'seq',
      trigger: { type: 'manual_conversation' },
      enabled: true,
      lines: [
        makeLine({ id: 'a' }),
        makeLine({ id: 'b', conditions: normalizeConditions({ trust: { minimum: 1 } }) }),
        makeLine({ id: 'c' })
      ]
    }
  ]).sequences[0];

  assertEqual(evaluateSequence(sequence, createState({ trust: 5 })).played.map((l) => l.id), ['a', 'b', 'c']);
  assertEqual(evaluateSequence(sequence, createState({ trust: 0 })).played.map((l) => l.id), ['a', 'c']);
});

test('fala arquivada não participa da execução', () => {
  const sequence = makeProject([
    {
      id: 'seq',
      trigger: { type: 'manual_conversation' },
      enabled: true,
      lines: [makeLine({ id: 'a', archived: true }), makeLine({ id: 'b' })]
    }
  ]).sequences[0];
  assertEqual(evaluateSequence(sequence, createState()).played.map((l) => l.id), ['b']);
});

test('sequência inativa não reproduz nada', () => {
  const sequence = makeProject([
    { id: 'seq', trigger: { type: 'manual_conversation' }, enabled: false, lines: [makeLine({ id: 'a' })] }
  ]).sequences[0];
  assertEqual(evaluateSequence(sequence, createState()).played.map((l) => l.id), []);
});

test('runSequence marca falas únicas como consumidas', () => {
  const sequence = makeProject([
    {
      id: 'seq',
      trigger: { type: 'manual_conversation' },
      enabled: true,
      lines: [makeLine({ id: 'a', repeat: 'once_per_session' }), makeLine({ id: 'b', repeat: 'every_trigger' })]
    }
  ]).sequences[0];

  const first = runSequence(sequence, schemaIndex, createState());
  assertEqual(first.played.map((l) => l.id), ['a', 'b']);
  assertEqual(first.stateAfter.consumedLineIds, ['a']);

  const second = runSequence(sequence, schemaIndex, first.stateAfter);
  assertEqual(second.played.map((l) => l.id), ['b']);
});

test('mudanças posteriores no estado não alteram uma sequência já congelada', () => {
  const sequence = makeProject([
    {
      id: 'seq',
      trigger: { type: 'manual_conversation' },
      enabled: true,
      lines: [makeLine({ id: 'a', conditions: normalizeConditions({ trust: { maximum: 0 } }) })]
    }
  ]).sequences[0];

  const run = runSequence(sequence, schemaIndex, createState({ trust: 0 }));
  assertEqual(run.played.map((l) => l.id), ['a']);
  // A lista já congelada não muda quando o estado posterior é alterado.
  run.stateAfter.trust = 9;
  assertEqual(run.played.map((l) => l.id), ['a']);
});
