import { test, assert, assertEqual, makeProject, makeLine } from './harness.js';
import {
  EditorStore,
  createLine,
  duplicateLine,
  updateLine,
  setLineArchived,
  deleteLine,
  moveLine,
  setSequenceEnabled,
  COALESCE_WINDOW_MS
} from '../js/domain/commands.js';

function baseProject() {
  return makeProject([
    {
      id: 'seq',
      trigger: { type: 'manual_conversation' },
      enabled: true,
      lines: [makeLine({ id: 'a', title: 'A' }), makeLine({ id: 'b', title: 'B' })]
    },
    { id: 'vazia', trigger: { type: 'fire_lit' }, enabled: false, lines: [] }
  ]);
}

const titles = (project, sequenceId = 'seq') =>
  project.sequences.find((s) => s.id === sequenceId).lines.map((l) => l.title);

test('criar fala ativa a sequência automaticamente', () => {
  const store = new EditorStore(baseProject());
  const result = store.apply((project) => createLine(project, 'vazia'), { label: 'Criar fala' });
  const sequence = store.sequence('vazia');
  assert(sequence.enabled, 'a primeira fala ativa a sequência');
  assertEqual(sequence.lines.length, 1);
  assert(result.lineId, 'o comando devolve o ID gerado');
});

test('duplicar gera um novo ID', () => {
  const store = new EditorStore(baseProject());
  const { lineId } = store.apply((project) => duplicateLine(project, 'a'));
  assert(lineId !== 'a', 'a cópia recebe um ID novo');
  assertEqual(titles(store.project), ['A', 'A (cópia)', 'B']);
});

test('mover fala só reordena dentro da própria sequência', () => {
  const store = new EditorStore(baseProject());
  store.apply((project) => moveLine(project, 'b', -1));
  assertEqual(titles(store.project), ['B', 'A']);
  const before = store.project;
  store.apply((project) => moveLine(project, 'B_inexistente', 1));
  assertEqual(titles(store.project), titles(before));
});

test('undo e redo de criação', () => {
  const store = new EditorStore(baseProject());
  store.apply((project) => createLine(project, 'seq'));
  assertEqual(store.sequence('seq').lines.length, 3);
  store.undo();
  assertEqual(store.sequence('seq').lines.length, 2);
  store.redo();
  assertEqual(store.sequence('seq').lines.length, 3);
});

test('undo e redo de edição, arquivamento e exclusão', () => {
  const store = new EditorStore(baseProject());
  store.apply((project) => updateLine(project, 'a', { title: 'Novo' }), { label: 'Editar' });
  store.apply((project) => setLineArchived(project, 'b', true), { label: 'Arquivar' });
  store.apply((project) => deleteLine(project, 'a'), { label: 'Excluir' });

  assertEqual(store.sequence('seq').lines.map((l) => l.id), ['b']);
  store.undo();
  assertEqual(store.sequence('seq').lines.map((l) => l.id), ['a', 'b']);
  store.undo();
  assertEqual(store.sequence('seq').lines.find((l) => l.id === 'b').archived, false);
  store.undo();
  assertEqual(titles(store.project), ['A', 'B']);
  assert(!store.canUndo, 'o histórico voltou ao início');
});

test('undo e redo de ordem e de estado da sequência', () => {
  const store = new EditorStore(baseProject());
  store.apply((project) => moveLine(project, 'a', 1));
  store.apply((project) => setSequenceEnabled(project, 'seq', false));
  assertEqual(store.sequence('seq').enabled, false);
  store.undo();
  assertEqual(store.sequence('seq').enabled, true);
  store.undo();
  assertEqual(titles(store.project), ['A', 'B']);
});

test('a digitação é agrupada em um único passo de histórico', () => {
  let clock = 1000;
  const store = new EditorStore(baseProject(), { now: () => clock });

  for (const value of ['N', 'No', 'Nov', 'Novo']) {
    store.apply((project) => updateLine(project, 'a', { title: value }), {
      label: 'Editar título',
      coalesceKey: 'title:a'
    });
    clock += 50;
  }
  assertEqual(store.undoStack.length, 1, 'quatro teclas viram um passo');
  store.undo();
  assertEqual(titles(store.project), ['A', 'B']);
});

test('uma pausa longa quebra o agrupamento da digitação', () => {
  let clock = 1000;
  const store = new EditorStore(baseProject(), { now: () => clock });
  store.apply((project) => updateLine(project, 'a', { title: 'X' }), { coalesceKey: 'title:a' });
  clock += COALESCE_WINDOW_MS + 10;
  store.apply((project) => updateLine(project, 'a', { title: 'XY' }), { coalesceKey: 'title:a' });
  assertEqual(store.undoStack.length, 2);
});

test('importar um projeto é uma única ação reversível', () => {
  const store = new EditorStore(baseProject());
  store.replaceProject(makeProject([{ id: 'outra', trigger: { type: 'fire_lit' }, enabled: false, lines: [] }]));
  assertEqual(store.project.sequences.map((s) => s.id), ['outra']);
  store.undo();
  assertEqual(store.project.sequences.map((s) => s.id), ['seq', 'vazia']);
});

test('alterações visuais não entram no histórico', () => {
  const store = new EditorStore(baseProject());
  store.applyTransient((project) => ({ ...project, editor: { ...project.editor, selectedLineId: 'b' } }));
  assert(!store.canUndo, 'seleção não é passo de undo');
  assertEqual(store.project.editor.selectedLineId, 'b');
});

test('o histórico é limpo sob demanda', () => {
  const store = new EditorStore(baseProject());
  store.apply((project) => createLine(project, 'seq'));
  store.clearHistory();
  assert(!store.canUndo && !store.canRedo);
});
