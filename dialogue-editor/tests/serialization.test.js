import { test, assert, assertEqual, gameSchema, schemaIndex, defaultProject, makeProject, makeLine } from './harness.js';
import { normalizeProject } from '../js/domain/project-model.js';
import { serializeProject, buildProjectFile } from '../js/serialization/export-project.js';
import { buildPackage } from '../js/serialization/export-package.js';
import { importProjectFromText, importProjectFromObject } from '../js/serialization/import-project.js';
import { validateProject } from '../js/domain/structural-validator.js';

test('round-trip de exportação e importação preserva o projeto', () => {
  const original = defaultProject();
  const text = serializeProject(original);
  const imported = importProjectFromText(text, gameSchema);

  assert(imported.ok, imported.error || '');
  const strip = (project) => ({ ...project, metadata: { ...project.metadata, updatedAt: null } });
  assertEqual(strip(imported.project), strip(original));
});

test('importar arquivo inválido devolve erro sem projeto', () => {
  const result = importProjectFromText('{ isso não é json', gameSchema);
  assert(!result.ok);
  assertEqual(result.project, null);
  assert(result.error.includes('JSON'));
});

test('importar outro formato é recusado', () => {
  const result = importProjectFromObject({ format: 'outra-coisa', formatVersion: 1 }, gameSchema);
  assert(!result.ok);
  assert(result.error.includes('não é um projeto'));
});

test('importar versão futura é recusado', () => {
  const result = importProjectFromObject(
    { format: 'aramara-dialogue-project', formatVersion: 99, metadata: {}, sequences: [] },
    gameSchema
  );
  assert(!result.ok);
  assert(result.error.includes('99'));
});

test('a migração preserva campos desconhecidos', () => {
  const raw = {
    format: 'aramara-dialogue-project',
    formatVersion: 1,
    gameSchemaVersion: 1,
    campoFuturo: { nota: 'preservar' },
    metadata: { projectId: 'p', name: 'Teste', createdAt: 'x', updatedAt: 'y' },
    sequences: [
      {
        id: 'seq',
        trigger: { type: 'manual_conversation' },
        enabled: true,
        etiquetaDesconhecida: 42,
        lines: [{ ...makeLine({ id: 'a' }), extensaoFutura: 'ok' }]
      }
    ]
  };

  const result = importProjectFromObject(raw, gameSchema);
  assert(result.ok);
  assertEqual(result.project._extras.campoFuturo, { nota: 'preservar' });
  assertEqual(result.project.sequences[0]._extras.etiquetaDesconhecida, 42);
  assertEqual(result.project.sequences[0].lines[0]._extras.extensaoFutura, 'ok');
});

test('normalizar preenche valores ausentes sem quebrar', () => {
  const project = normalizeProject({ sequences: [{ id: 's', trigger: { type: 'fire_lit' } }] });
  assertEqual(project.sequences[0].lines, []);
  assertEqual(project.sequences[0].enabled, false);
  assertEqual(project.editor.viewport.zoom, 1);
});

test('o pacote final não inclui falas arquivadas nem sequências inativas', () => {
  const project = makeProject([
    {
      id: 'ativa',
      trigger: { type: 'manual_conversation' },
      enabled: true,
      lines: [makeLine({ id: 'viva' }), makeLine({ id: 'morta', archived: true })]
    },
    { id: 'inativa', trigger: { type: 'fire_lit' }, enabled: false, lines: [makeLine({ id: 'silencio' })] }
  ]);

  const packaged = buildPackage(project);
  assertEqual(packaged.sequences.map((s) => s.id), ['ativa']);
  assertEqual(packaged.sequences[0].lines.map((l) => l.id), ['viva']);
});

test('o pacote final não inclui viewport, seleção nem estado do editor', () => {
  const packaged = buildPackage(defaultProject());
  const serialized = JSON.stringify(packaged);
  assert(!('editor' in packaged), 'sem bloco editor');
  assert(!serialized.includes('viewport'), 'sem viewport');
  assert(!serialized.includes('selectedLineId'), 'sem seleção');
  assert(!serialized.includes('archived'), 'sem marcação de arquivamento');
});

test('o pacote final carrega metadados de rastreabilidade e os avisos aceitos', () => {
  const packaged = buildPackage(defaultProject(), {
    warnings: [{ code: 'missing_translation', message: 'Falta inglês', sequenceId: 's', lineId: 'l' }],
    generatedAt: '2026-08-15T12:00:00.000Z'
  });
  assertEqual(packaged.format, 'aramara-dialogue-package');
  assertEqual(packaged.generatedAt, '2026-08-15T12:00:00.000Z');
  assertEqual(packaged.gameSchemaVersion, schemaIndex.version);
  assertEqual(packaged.acceptedWarnings.length, 1);
});

test('o pacote final preserva a ordem das falas', () => {
  const project = makeProject([
    {
      id: 'seq',
      trigger: { type: 'manual_conversation' },
      enabled: true,
      lines: [makeLine({ id: 'um' }), makeLine({ id: 'dois' }), makeLine({ id: 'tres' })]
    }
  ]);
  assertEqual(buildPackage(project).sequences[0].lines.map((l) => l.id), ['um', 'dois', 'tres']);
});

test('o arquivo de projeto pode ser exportado mesmo com erros', () => {
  const project = makeProject([
    {
      id: 'seq',
      trigger: { type: 'manual_conversation' },
      enabled: true,
      lines: [makeLine({ id: 'a', text: { 'pt-BR': '', en: '' } })]
    }
  ]);
  assert(validateProject(project, schemaIndex).errors.length > 0, 'o projeto de teste precisa ter erros');
  const file = buildProjectFile(project);
  assertEqual(file.format, 'aramara-dialogue-project');
  assertEqual(file.sequences[0].lines.length, 1);
});

test('o pacote final do projeto inicial tem uma sequência por diálogo mapeado', () => {
  const packaged = buildPackage(defaultProject());
  const total = packaged.sequences.reduce((sum, sequence) => sum + sequence.lines.length, 0);
  assertEqual(total, 15);
  assert(packaged.sequences.every((sequence) => sequence.lines.length > 0));
});
