import { test, assert, assertEqual, schemaIndex, makeProject, makeLine, defaultProject } from './harness.js';
import { normalizeConditions } from '../js/domain/project-model.js';
import { analyzeCoverage } from '../js/domain/coverage-validator.js';
import { validateProject, validateStructure } from '../js/domain/structural-validator.js';

const codes = (entries) => entries.map((entry) => entry.code);

test('sequência ativa sem cobertura gera erro', () => {
  const project = makeProject([
    {
      id: 'seq',
      trigger: { type: 'manual_conversation' },
      enabled: true,
      lines: [makeLine({ id: 'a', conditions: normalizeConditions({ trust: { minimum: 3 } }) })]
    }
  ]);
  const { errors } = analyzeCoverage(project, schemaIndex);
  assert(codes(errors).includes('coverage_gap'), `esperado coverage_gap, recebido ${codes(errors)}`);
});

test('sequência ativa com fala incondicional é totalmente coberta', () => {
  const project = makeProject([
    { id: 'seq', trigger: { type: 'manual_conversation' }, enabled: true, lines: [makeLine({ id: 'a' })] }
  ]);
  assertEqual(analyzeCoverage(project, schemaIndex).errors, []);
});

test('faixas complementares cobrem todos os estados', () => {
  const project = makeProject([
    {
      id: 'seq',
      trigger: { type: 'manual_conversation' },
      enabled: true,
      lines: [
        makeLine({ id: 'baixa', conditions: normalizeConditions({ trust: { maximum: 2 } }) }),
        makeLine({ id: 'alta', conditions: normalizeConditions({ trust: { minimum: 3 } }) })
      ]
    }
  ]);
  assertEqual(analyzeCoverage(project, schemaIndex).errors, []);
});

test('sequência inativa é ignorada pela cobertura', () => {
  const project = makeProject([
    {
      id: 'seq',
      trigger: { type: 'manual_conversation' },
      enabled: false,
      lines: [makeLine({ id: 'a', conditions: normalizeConditions({ trust: { minimum: 9 } }) })]
    }
  ]);
  assertEqual(analyzeCoverage(project, schemaIndex).errors, []);
});

test('gatilho repetível fica descoberto depois de consumir a fala única', () => {
  const project = makeProject([
    {
      id: 'seq',
      trigger: { type: 'manual_conversation' },
      enabled: true,
      lines: [makeLine({ id: 'a', repeat: 'once_per_session' })]
    }
  ]);
  const { errors } = analyzeCoverage(project, schemaIndex);
  assertEqual(codes(errors), ['coverage_gap_after_consumption']);
});

test('gatilho repetível coberto por uma fala every_trigger não gera erro', () => {
  const project = makeProject([
    {
      id: 'seq',
      trigger: { type: 'manual_conversation' },
      enabled: true,
      lines: [makeLine({ id: 'a', repeat: 'once_per_session' }), makeLine({ id: 'b', repeat: 'every_trigger' })]
    }
  ]);
  assertEqual(analyzeCoverage(project, schemaIndex).errors, []);
});

test('gatilho não repetível não é cobrado por ocorrências posteriores', () => {
  const project = makeProject([
    {
      id: 'seq',
      trigger: { type: 'first_item_delivered', parameter: 'wild_berries' },
      enabled: true,
      lines: [makeLine({ id: 'a', repeat: 'once_per_session' })]
    }
  ]);
  assertEqual(analyzeCoverage(project, schemaIndex).errors, []);
});

test('sequência ativa e vazia gera erro de cobertura', () => {
  const project = makeProject([{ id: 'seq', trigger: { type: 'fire_lit' }, enabled: true, lines: [] }]);
  assertEqual(codes(analyzeCoverage(project, schemaIndex).errors), ['coverage_empty_sequence']);
});

test('fala impossível por estado inalcançável gera erro', () => {
  const project = makeProject([
    {
      id: 'seq',
      trigger: { type: 'first_item_collected', parameter: 'plant_fiber' },
      enabled: true,
      lines: [
        makeLine({ id: 'sempre' }),
        makeLine({
          id: 'impossivel',
          // O gatilho garante que a fibra está pega; exigir o contrário é inalcançável.
          conditions: normalizeConditions({ itemStates: [{ itemId: 'plant_fiber', state: 'collected', value: false }] })
        })
      ]
    }
  ]);
  const { errors } = analyzeCoverage(project, schemaIndex);
  assert(codes(errors).includes('unreachable_line'), `esperado unreachable_line, recebido ${codes(errors)}`);
});

test('a contraprova traz um cenário completo para o simulador', () => {
  const project = makeProject([
    {
      id: 'seq',
      trigger: { type: 'manual_conversation' },
      enabled: true,
      lines: [makeLine({ id: 'a', conditions: normalizeConditions({ trust: { minimum: 4 } }) })]
    }
  ]);
  const gap = analyzeCoverage(project, schemaIndex).errors.find((error) => error.code === 'coverage_gap');
  assert(gap.scenario, 'a contraprova precisa de cenário');
  assertEqual(gap.scenario.sequenceId, 'seq');
  assertEqual(gap.scenario.triggerType, 'manual_conversation');
  assert(typeof gap.scenario.trust === 'number');
  assert(gap.message.includes('confiança'), 'a mensagem descreve a confiança usada');
});

test('condições contraditórias de confiança são erro estrutural', () => {
  const project = makeProject([
    {
      id: 'seq',
      trigger: { type: 'manual_conversation' },
      enabled: true,
      lines: [
        makeLine({ id: 'ok' }),
        makeLine({ id: 'ruim', conditions: normalizeConditions({ trust: { minimum: 5, maximum: 2 } }) })
      ]
    }
  ]);
  assert(codes(validateStructure(project, schemaIndex).errors).includes('contradictory_trust'));
});

test('IDs duplicados são erro', () => {
  const project = makeProject([
    { id: 'seq', trigger: { type: 'manual_conversation' }, enabled: true, lines: [makeLine({ id: 'x' })] },
    { id: 'seq2', trigger: { type: 'fire_lit' }, enabled: false, lines: [makeLine({ id: 'x' })] }
  ]);
  assert(codes(validateStructure(project, schemaIndex).errors).includes('duplicate_id'));
});

test('referência inexistente ao catálogo é erro', () => {
  const project = makeProject([
    {
      id: 'seq',
      trigger: { type: 'manual_conversation' },
      enabled: true,
      lines: [
        makeLine({ id: 'a', speakerId: 'fantasma' }),
        makeLine({ id: 'b', conditions: normalizeConditions({ itemStates: [{ itemId: 'espada', state: 'collected', value: true }] }) })
      ]
    }
  ]);
  const found = codes(validateStructure(project, schemaIndex).errors);
  assert(found.includes('unknown_speaker'));
  assert(found.includes('unknown_item'));
});

test('os dois idiomas vazios são erro; apenas um é aviso', () => {
  const project = makeProject([
    {
      id: 'seq',
      trigger: { type: 'manual_conversation' },
      enabled: true,
      lines: [
        makeLine({ id: 'vazia', text: { 'pt-BR': '', en: '' } }),
        makeLine({ id: 'parcial', text: { 'pt-BR': 'só português', en: '' } })
      ]
    }
  ]);
  const report = validateStructure(project, schemaIndex);
  assert(codes(report.errors).includes('empty_text'));
  assert(codes(report.warnings).includes('missing_translation'));
});

test('falas com condições idênticas geram aviso, não erro', () => {
  const project = makeProject([
    {
      id: 'seq',
      trigger: { type: 'manual_conversation' },
      enabled: true,
      lines: [makeLine({ id: 'a' }), makeLine({ id: 'b' })]
    }
  ]);
  const report = validateProject(project, schemaIndex);
  assertEqual(report.errors, []);
  assert(codes(report.warnings).includes('identical_conditions'));
});

test('arquivar a única fala abre uma lacuna de cobertura', () => {
  const project = makeProject([
    {
      id: 'seq',
      trigger: { type: 'fire_lit' },
      enabled: true,
      lines: [makeLine({ id: 'a', archived: true })]
    }
  ]);
  assertEqual(codes(analyzeCoverage(project, schemaIndex).errors), ['coverage_empty_sequence']);
});

test('o projeto inicial não possui erros de validação', () => {
  const report = validateProject(defaultProject(), schemaIndex);
  assertEqual(report.errors, [], `erros inesperados: ${report.errors.map((e) => e.message).join(' | ')}`);
});

test('o projeto inicial contém as 15 falas dos SoundData atuais', () => {
  const project = defaultProject();
  const total = project.sequences.reduce((sum, sequence) => sum + sequence.lines.length, 0);
  assertEqual(total, 15);
});
