/**
 * Comandos de edição e histórico de desfazer/refazer.
 *
 * Cada comando é uma função pura `(project) => project` que devolve um novo
 * documento. O histórico vive apenas em memória durante a sessão (§11.2).
 */

import {
  createEmptyConditions,
  deepClone,
  findSequence,
  generateId,
  normalizeLine,
  normalizeProject
} from './project-model.js';

export const HISTORY_LIMIT = 100;
/** Janela para agrupar digitação em um único passo de undo (§10.5). */
export const COALESCE_WINDOW_MS = 700;

function touch(project) {
  return {
    ...project,
    metadata: { ...project.metadata, updatedAt: new Date().toISOString() }
  };
}

function replaceSequence(project, sequenceId, transform) {
  return touch({
    ...project,
    sequences: project.sequences.map((sequence) =>
      sequence.id === sequenceId ? transform(sequence) : sequence
    )
  });
}

function replaceLine(project, lineId, transform) {
  return touch({
    ...project,
    sequences: project.sequences.map((sequence) => {
      if (!sequence.lines.some((line) => line.id === lineId)) return sequence;
      return {
        ...sequence,
        lines: sequence.lines.map((line) => (line.id === lineId ? transform(line) : line))
      };
    })
  });
}

/* ------------------------------------------------------------------ */
/* Comandos                                                            */
/* ------------------------------------------------------------------ */

export function createLine(project, sequenceId, overrides = {}) {
  const line = normalizeLine({
    id: generateId('line'),
    title: 'Nova fala',
    speakerId: 'indio',
    text: { 'pt-BR': '', en: '' },
    comment: '',
    repeat: 'once_per_session',
    conditions: createEmptyConditions(),
    archived: false,
    ...overrides
  });

  const next = replaceSequence(project, sequenceId, (sequence) => ({
    ...sequence,
    // Adicionar a primeira fala ativa a sequência automaticamente (§4.3).
    enabled: sequence.enabled || !line.archived,
    lines: [...sequence.lines, line]
  }));

  return { project: next, lineId: line.id };
}

export function insertLine(project, sequenceId, line, index) {
  const clone = normalizeLine({ ...deepClone(line), id: line.id || generateId('line') });
  const next = replaceSequence(project, sequenceId, (sequence) => {
    const lines = sequence.lines.slice();
    const position = index === undefined || index === null ? lines.length : Math.max(0, Math.min(index, lines.length));
    lines.splice(position, 0, clone);
    return { ...sequence, enabled: sequence.enabled || !clone.archived, lines };
  });
  return { project: next, lineId: clone.id };
}

export function duplicateLine(project, lineId) {
  const sequence = project.sequences.find((candidate) => candidate.lines.some((line) => line.id === lineId));
  if (!sequence) return { project, lineId: null };

  const index = sequence.lines.findIndex((line) => line.id === lineId);
  const source = sequence.lines[index];
  const copy = normalizeLine({
    ...deepClone(source),
    id: generateId('line'),
    title: `${source.title} (cópia)`
  });

  const next = replaceSequence(project, sequence.id, (current) => {
    const lines = current.lines.slice();
    lines.splice(index + 1, 0, copy);
    return { ...current, lines };
  });

  return { project: next, lineId: copy.id };
}

export function updateLine(project, lineId, patch) {
  return replaceLine(project, lineId, (line) => ({
    ...line,
    ...patch,
    text: patch.text ? { ...line.text, ...patch.text } : line.text,
    conditions: patch.conditions ? deepClone(patch.conditions) : line.conditions
  }));
}

export function setLineArchived(project, lineId, archived) {
  return replaceLine(project, lineId, (line) => ({ ...line, archived }));
}

export function deleteLine(project, lineId) {
  return touch({
    ...project,
    sequences: project.sequences.map((sequence) => ({
      ...sequence,
      lines: sequence.lines.filter((line) => line.id !== lineId)
    }))
  });
}

/** Move uma fala dentro da própria sequência. Movimentos entre sequências são proibidos (§4.3). */
export function moveLine(project, lineId, delta) {
  const sequence = project.sequences.find((candidate) => candidate.lines.some((line) => line.id === lineId));
  if (!sequence) return project;

  const index = sequence.lines.findIndex((line) => line.id === lineId);
  const target = index + delta;
  if (target < 0 || target >= sequence.lines.length) return project;

  return replaceSequence(project, sequence.id, (current) => {
    const lines = current.lines.slice();
    const [moved] = lines.splice(index, 1);
    lines.splice(target, 0, moved);
    return { ...current, lines };
  });
}

export function setSequenceEnabled(project, sequenceId, enabled) {
  return replaceSequence(project, sequenceId, (sequence) => ({ ...sequence, enabled }));
}

export function updateMetadata(project, patch) {
  return touch({ ...project, metadata: { ...project.metadata, ...patch } });
}

export function updateEditorState(project, patch) {
  return {
    ...project,
    editor: { ...project.editor, ...patch, viewport: { ...project.editor.viewport, ...(patch.viewport || {}) } }
  };
}

/* ------------------------------------------------------------------ */
/* Histórico                                                           */
/* ------------------------------------------------------------------ */

export class EditorStore {
  constructor(project, { now = () => Date.now() } = {}) {
    this.project = normalizeProject(project);
    this.undoStack = [];
    this.redoStack = [];
    this.listeners = new Set();
    this.now = now;
    this.lastCoalesceKey = null;
    this.lastCommitAt = 0;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(reason) {
    for (const listener of this.listeners) listener(this.project, reason);
  }

  get canUndo() {
    return this.undoStack.length > 0;
  }

  get canRedo() {
    return this.redoStack.length > 0;
  }

  /**
   * Aplica um comando e registra um passo de histórico.
   *
   * `coalesceKey` agrupa alterações consecutivas equivalentes (digitação) em
   * uma única entrada, evitando um passo de undo por caractere.
   */
  apply(mutator, { label = 'Alteração', coalesceKey = null, silent = false } = {}) {
    const previous = this.project;
    const result = mutator(previous);
    const next = result && result.project ? result.project : result;
    if (!next || next === previous) return result;

    const timestamp = this.now();
    const canCoalesce =
      coalesceKey !== null &&
      coalesceKey === this.lastCoalesceKey &&
      timestamp - this.lastCommitAt < COALESCE_WINDOW_MS &&
      this.undoStack.length > 0;

    if (!canCoalesce) {
      this.undoStack.push({ project: previous, label });
      if (this.undoStack.length > HISTORY_LIMIT) this.undoStack.shift();
    }

    this.redoStack.length = 0;
    this.lastCoalesceKey = coalesceKey;
    this.lastCommitAt = timestamp;
    this.project = next;

    if (!silent) this.notify('apply');
    return result;
  }

  /** Alteração puramente visual: não entra no histórico nem quebra o agrupamento. */
  applyTransient(mutator, { silent = false } = {}) {
    const next = mutator(this.project);
    if (!next || next === this.project) return this.project;
    this.project = next;
    if (!silent) this.notify('transient');
    return this.project;
  }

  /** Substitui o documento inteiro como uma única ação reversível (§11.2). */
  replaceProject(project, label = 'Importar projeto') {
    return this.apply(() => normalizeProject(project), { label });
  }

  undo() {
    if (!this.canUndo) return false;
    const entry = this.undoStack.pop();
    this.redoStack.push({ project: this.project, label: entry.label });
    this.project = entry.project;
    this.lastCoalesceKey = null;
    this.notify('undo');
    return true;
  }

  redo() {
    if (!this.canRedo) return false;
    const entry = this.redoStack.pop();
    this.undoStack.push({ project: this.project, label: entry.label });
    this.project = entry.project;
    this.lastCoalesceKey = null;
    this.notify('redo');
    return true;
  }

  clearHistory() {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
    this.lastCoalesceKey = null;
  }

  sequence(sequenceId) {
    return findSequence(this.project, sequenceId);
  }
}
