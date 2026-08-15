import { test, assert, assertEqual, schemaIndex, makeProject, makeLine } from './harness.js';
import { normalizeConditions } from '../js/domain/project-model.js';
import { projectVariables, buildStateSpace, trustBounds } from '../js/domain/reachability.js';
import { createState } from '../js/domain/condition-evaluator.js';

function sequenceOf(trigger, lines) {
  return makeProject([{ id: 'seq', trigger, enabled: true, lines }]).sequences[0];
}

test('a projeção usa apenas as variáveis citadas pelas falas e pelo gatilho', () => {
  const sequence = sequenceOf({ type: 'manual_conversation' }, [
    makeLine({
      id: 'a',
      conditions: normalizeConditions({ itemStates: [{ itemId: 'wild_berries', state: 'delivered', value: true }] })
    })
  ]);
  const projection = projectVariables(sequence, schemaIndex);
  assertEqual(projection.items, ['wild_berries']);
  assertEqual(projection.milestones, []);
});

test('a projeção inclui os pré-requisitos declarados no catálogo', () => {
  const sequence = sequenceOf({ type: 'manual_conversation' }, [
    makeLine({ id: 'a', conditions: normalizeConditions({ milestones: [{ milestoneId: 'new_bow_crafted', value: true }] }) })
  ]);
  const projection = projectVariables(sequence, schemaIndex);
  assert(projection.items.includes('plant_fiber'), 'fibra vegetal entra no escopo');
  assert(projection.items.includes('sturdy_branch'), 'galho resistente entra no escopo');
});

test('a projeção inclui a variável forçada pelo gatilho', () => {
  const sequence = sequenceOf({ type: 'first_item_delivered', parameter: 'animal_hide' }, [makeLine({ id: 'a' })]);
  const projection = projectVariables(sequence, schemaIndex);
  assertEqual(projection.items, ['animal_hide']);
});

test('estados impossíveis são descartados: entrega sem coleta', () => {
  const sequence = sequenceOf({ type: 'manual_conversation' }, [
    makeLine({
      id: 'a',
      conditions: normalizeConditions({ itemStates: [{ itemId: 'wild_berries', state: 'collected', value: true }] })
    })
  ]);
  const { states } = buildStateSpace(sequence, schemaIndex);
  assert(states.length > 0);
  for (const state of states) {
    assert(
      !(state.delivered.wild_berries === true && state.collected.wild_berries !== true),
      'nenhum estado tem entrega sem coleta'
    );
  }
});

test('estados impossíveis são descartados: marco sem pré-requisito', () => {
  const sequence = sequenceOf({ type: 'manual_conversation' }, [
    makeLine({
      id: 'a',
      conditions: normalizeConditions({
        milestones: [{ milestoneId: 'fire_lit', value: true }],
        itemStates: [{ itemId: 'flint_piece', state: 'collected', value: true }]
      })
    })
  ]);
  const { states } = buildStateSpace(sequence, schemaIndex);
  for (const state of states) {
    if (state.milestones.fire_lit === true) {
      assert(state.collected.flint_piece === true, 'a fogueira exige a pederneira coletada');
    }
  }
});

test('o gatilho força o próprio efeito em todos os estados', () => {
  const sequence = sequenceOf({ type: 'first_item_collected', parameter: 'plant_fiber' }, [makeLine({ id: 'a' })]);
  const { states } = buildStateSpace(sequence, schemaIndex);
  assert(states.length > 0);
  for (const state of states) {
    assert(state.collected.plant_fiber === true, 'no gatilho de coleta o item já está pego');
  }
});

test('a confiança nunca ultrapassa o máximo alcançável do catálogo', () => {
  const sequence = sequenceOf({ type: 'manual_conversation' }, [
    makeLine({ id: 'a', conditions: normalizeConditions({ trust: { minimum: 1 } }) })
  ]);
  const { states } = buildStateSpace(sequence, schemaIndex);
  for (const state of states) {
    assert(state.trust >= 0 && state.trust <= schemaIndex.trust.maximum, `confiança fora da faixa: ${state.trust}`);
  }
});

test('entregar frutas garante confiança mínima 1', () => {
  const scope = { items: new Set(['wild_berries']), milestones: new Set() };
  const state = createState({ collected: { wild_berries: true }, delivered: { wild_berries: true } });
  const bounds = trustBounds(state, schemaIndex, scope);
  assert(bounds.minimum >= 1, `mínimo esperado >= 1, recebido ${bounds.minimum}`);
});

test('o final de arco antigo com confiança alta só existe acima do limite', () => {
  const sequence = sequenceOf({ type: 'ending_started', parameter: 'old_bow_high_trust' }, [makeLine({ id: 'a' })]);
  const { states } = buildStateSpace(sequence, schemaIndex);
  assert(states.length > 0, 'o final deve ser alcançável');
  for (const state of states) {
    assert(state.trust >= schemaIndex.trust.highTrustMinimum, `confiança baixa em final de confiança alta: ${state.trust}`);
    assert(state.milestones.old_bow_recovered === true, 'o arco antigo precisa ter sido recuperado');
  }
});

test('o final de arco antigo com confiança baixa só existe abaixo do limite', () => {
  const sequence = sequenceOf({ type: 'ending_started', parameter: 'old_bow_low_trust' }, [makeLine({ id: 'a' })]);
  const { states } = buildStateSpace(sequence, schemaIndex);
  assert(states.length > 0, 'o final deve ser alcançável');
  for (const state of states) {
    assert(state.trust < schemaIndex.trust.highTrustMinimum, `confiança alta em final de confiança baixa: ${state.trust}`);
  }
});
