/**
 * Casca do editor: barra superior, lista de sequências, seleção, ações de
 * edição e integração entre grafo, inspetor, validação e simulador.
 */

import {
  describeTrigger,
  findSequence,
  findSequenceOfLine,
  missingLanguages,
  speakerName,
  deepClone
} from '../domain/project-model.js';
import {
  createLine,
  duplicateLine,
  updateLine,
  setLineArchived,
  deleteLine,
  moveLine,
  setSequenceEnabled,
  updateMetadata,
  updateEditorState,
  insertLine
} from '../domain/commands.js';
import { validateProject } from '../domain/structural-validator.js';
import { serializeProject, PROJECT_FILE_NAME } from '../serialization/export-project.js';
import { serializePackage, PACKAGE_FILE_NAME } from '../serialization/export-package.js';
import { importProjectFromFile } from '../serialization/import-project.js';
import { GraphView } from './graph-view.js';
import { LineInspector } from './line-inspector.js';
import { ValidationPanel } from './validation-panel.js';
import { ScenarioSimulator } from './scenario-simulator.js';
import { registerShortcuts } from './keyboard-shortcuts.js';

function downloadFile(name, contents) {
  const blob = new Blob([contents], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export class EditorShell {
  constructor({ store, schema, schemaIndex, autoSaver }) {
    this.store = store;
    this.schema = schema;
    this.schemaIndex = schemaIndex;
    this.autoSaver = autoSaver;

    this.clipboard = null;
    this.report = { errors: [], warnings: [] };
    this.highlight = null;
    this.persistentToast = null;

    this.dom = {
      app: document.getElementById('app'),
      projectName: document.getElementById('project-name'),
      autosave: document.getElementById('autosave-status'),
      undo: document.getElementById('undo-button'),
      redo: document.getElementById('redo-button'),
      simulator: document.getElementById('simulator-button'),
      import: document.getElementById('import-button'),
      importInput: document.getElementById('import-input'),
      exportProject: document.getElementById('export-project-button'),
      exportPackage: document.getElementById('export-package-button'),
      search: document.getElementById('search-input'),
      filterTrigger: document.getElementById('filter-trigger'),
      filterSpeaker: document.getElementById('filter-speaker'),
      filterStatus: document.getElementById('filter-status'),
      sequenceList: document.getElementById('sequence-list'),
      graphTitle: document.getElementById('graph-title'),
      graphHint: document.getElementById('graph-hint'),
      graphView: document.getElementById('graph-view'),
      addLine: document.getElementById('add-line-button'),
      sequenceEnabled: document.getElementById('sequence-enabled'),
      zoomIn: document.getElementById('zoom-in'),
      zoomOut: document.getElementById('zoom-out'),
      zoomFit: document.getElementById('zoom-fit'),
      inspector: document.getElementById('inspector'),
      validation: document.getElementById('validation-panel'),
      validationSummary: document.getElementById('validation-summary'),
      validationToggle: document.getElementById('validation-toggle'),
      confirmDialog: document.getElementById('confirm-dialog'),
      confirmTitle: document.getElementById('confirm-title'),
      confirmMessage: document.getElementById('confirm-message'),
      simulatorDialog: document.getElementById('simulator-dialog'),
      simulatorBody: document.getElementById('simulator-body'),
      toasts: document.getElementById('toast-area')
    };

    this.graph = new GraphView(this.dom.graphView, {
      onSelectLine: (lineId) => this.selectLine(lineId),
      onMoveLine: (lineId, delta) => this.moveLine(lineId, delta),
      onViewportChange: (viewport) => {
        this.store.applyTransient((project) => updateEditorState(project, { viewport }), { silent: true });
      }
    });

    this.inspector = new LineInspector(this.dom.inspector, {
      onUpdate: (lineId, patch, coalesceKey) => this.updateLine(lineId, patch, coalesceKey),
      onMove: (lineId, delta) => this.moveLine(lineId, delta),
      onDuplicate: (lineId) => this.duplicateLine(lineId),
      onCopy: (lineId) => this.copyLine(lineId),
      onArchive: (lineId, archived) => this.archiveLine(lineId, archived),
      onDelete: (lineId) => this.deleteLine(lineId)
    });

    this.validationPanel = new ValidationPanel(this.dom.validation, this.dom.validationSummary, {
      onSelect: (issue) => this.focusIssue(issue)
    });

    this.simulator = new ScenarioSimulator(this.dom.simulatorDialog, this.dom.simulatorBody, {
      context: () => ({ project: this.project, schemaIndex: this.schemaIndex }),
      onHighlight: (highlight) => {
        this.highlight = highlight;
        this.renderGraph();
      },
      onClose: () => {
        this.highlight = null;
        this.renderGraph();
      }
    });

    this.bindEvents();
    this.store.subscribe((_, reason) => this.onStoreChange(reason));
  }

  get project() {
    return this.store.project;
  }

  get selectedSequenceId() {
    return this.project.editor.selectedSequenceId;
  }

  get selectedLineId() {
    return this.project.editor.selectedLineId;
  }

  /* ---------------------------------------------------------------- */
  /* Ligações                                                          */
  /* ---------------------------------------------------------------- */

  bindEvents() {
    this.dom.projectName.addEventListener('input', () => {
      this.store.apply((project) => updateMetadata(project, { name: this.dom.projectName.value }), {
        label: 'Renomear projeto',
        coalesceKey: 'project-name'
      });
    });

    this.dom.undo.addEventListener('click', () => this.store.undo());
    this.dom.redo.addEventListener('click', () => this.store.redo());

    this.dom.addLine.addEventListener('click', () => this.createLine());
    this.dom.sequenceEnabled.addEventListener('change', () => {
      const sequence = findSequence(this.project, this.selectedSequenceId);
      if (!sequence) return;
      this.store.apply((project) => setSequenceEnabled(project, sequence.id, this.dom.sequenceEnabled.checked), {
        label: 'Ativar/desativar sequência'
      });
    });

    this.dom.zoomIn.addEventListener('click', () => this.graph.zoomBy(1.2));
    this.dom.zoomOut.addEventListener('click', () => this.graph.zoomBy(1 / 1.2));
    this.dom.zoomFit.addEventListener('click', () => this.graph.fit());

    for (const control of [this.dom.search, this.dom.filterTrigger, this.dom.filterSpeaker, this.dom.filterStatus]) {
      control.addEventListener('input', () => this.renderSequenceList());
    }

    this.dom.validationToggle.addEventListener('click', () => {
      const collapsed = this.dom.app.dataset.validation === 'collapsed';
      this.dom.app.dataset.validation = collapsed ? 'expanded' : 'collapsed';
      this.dom.validationToggle.textContent = collapsed ? 'Ocultar' : 'Mostrar';
    });

    this.dom.simulator.addEventListener('click', () => this.openSimulator());

    this.dom.import.addEventListener('click', () => this.dom.importInput.click());
    this.dom.importInput.addEventListener('change', () => this.handleImport());

    this.dom.exportProject.addEventListener('click', () => this.exportProject());
    this.dom.exportPackage.addEventListener('click', () => this.exportPackage());

    registerShortcuts({
      undo: () => this.store.undo(),
      redo: () => this.store.redo(),
      copy: () => this.selectedLineId && this.copyLine(this.selectedLineId),
      paste: () => this.pasteLine(),
      duplicate: () => this.selectedLineId && this.duplicateLine(this.selectedLineId),
      remove: () => this.selectedLineId && this.deleteLine(this.selectedLineId),
      focusSearch: () => {
        this.dom.search.focus();
        this.dom.search.select();
      },
      escape: () => this.selectLine(null),
      saveNow: () => this.autoSaver.flush()
    });
  }

  onStoreChange(reason) {
    if (reason !== 'transient') {
      this.autoSaver.schedule(this.project);
      this.revalidate();
    }
    this.render({ skipInspector: reason === 'apply' && this.pendingInspectorSkip });
    this.pendingInspectorSkip = false;
  }

  /* ---------------------------------------------------------------- */
  /* Validação                                                         */
  /* ---------------------------------------------------------------- */

  revalidate(extraWarnings = []) {
    this.importWarnings = extraWarnings.length > 0 ? extraWarnings : this.importWarnings || [];
    this.report = validateProject(this.project, this.schemaIndex, this.importWarnings);
    this.lineStatus = new Map();
    for (const error of this.report.errors) {
      if (error.lineId) this.lineStatus.set(error.lineId, 'error');
    }
    for (const warning of this.report.warnings) {
      if (warning.lineId && !this.lineStatus.has(warning.lineId)) this.lineStatus.set(warning.lineId, 'warning');
    }
  }

  issuesForLine(lineId) {
    const issues = [];
    for (const error of this.report.errors) if (error.lineId === lineId) issues.push({ kind: 'error', ...error });
    for (const warning of this.report.warnings) if (warning.lineId === lineId) issues.push({ kind: 'warning', ...warning });
    return issues;
  }

  issueCountsBySequence() {
    const counts = new Map();
    const bump = (sequenceId, kind) => {
      if (!sequenceId) return;
      const entry = counts.get(sequenceId) || { errors: 0, warnings: 0 };
      entry[kind] += 1;
      counts.set(sequenceId, entry);
    };
    for (const error of this.report.errors) bump(error.sequenceId, 'errors');
    for (const warning of this.report.warnings) bump(warning.sequenceId, 'warnings');
    return counts;
  }

  /* ---------------------------------------------------------------- */
  /* Renderização                                                      */
  /* ---------------------------------------------------------------- */

  render({ skipInspector = false } = {}) {
    if (document.activeElement !== this.dom.projectName) {
      this.dom.projectName.value = this.project.metadata.name;
    }
    this.dom.undo.disabled = !this.store.canUndo;
    this.dom.redo.disabled = !this.store.canRedo;
    this.dom.exportPackage.disabled = this.report.errors.length > 0;
    this.dom.exportPackage.title =
      this.report.errors.length > 0
        ? 'Corrija os erros antes de exportar o pacote final.'
        : 'Exportar o pacote final para integração com o Unity.';

    this.renderSequenceList();
    this.renderGraph();
    if (!skipInspector) this.renderInspector();
    this.validationPanel.render(this.report);
  }

  renderSequenceList() {
    const counts = this.issueCountsBySequence();
    const search = this.dom.search.value.trim().toLowerCase();
    const triggerFilter = this.dom.filterTrigger.value;
    const speakerFilter = this.dom.filterSpeaker.value;
    const statusFilter = this.dom.filterStatus.value;

    const matches = (sequence) => {
      const issue = counts.get(sequence.id) || { errors: 0, warnings: 0 };
      if (triggerFilter && sequence.trigger.type !== triggerFilter) return false;
      if (statusFilter === 'errors' && issue.errors === 0) return false;
      if (statusFilter === 'warnings' && issue.warnings === 0) return false;
      if (statusFilter === 'archived' && !sequence.lines.some((line) => line.archived)) return false;
      if (statusFilter === 'missing-translation' && !sequence.lines.some((line) => missingLanguages(line).length > 0)) {
        return false;
      }
      if (speakerFilter && !sequence.lines.some((line) => line.speakerId === speakerFilter)) return false;
      if (search) {
        const haystack = [
          describeTrigger(this.schemaIndex, sequence.trigger),
          ...sequence.lines.flatMap((line) => [
            line.title,
            line.text['pt-BR'],
            line.text.en,
            line.comment,
            speakerName(this.schemaIndex, line.speakerId)
          ])
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    };

    const groups = new Map();
    for (const sequence of this.project.sequences) {
      if (!matches(sequence)) continue;
      const definition = this.schemaIndex.triggers.get(sequence.trigger.type);
      const groupName = definition ? definition.name : 'Gatilhos desconhecidos';
      if (!groups.has(groupName)) groups.set(groupName, []);
      groups.get(groupName).push(sequence);
    }

    this.dom.sequenceList.replaceChildren();

    if (groups.size === 0) {
      const empty = document.createElement('p');
      empty.className = 'hint';
      empty.style.padding = '0.5rem';
      empty.textContent = 'Nenhuma sequência corresponde à busca ou aos filtros.';
      this.dom.sequenceList.appendChild(empty);
      return;
    }

    for (const [groupName, sequences] of groups) {
      const section = document.createElement('div');
      section.className = 'sequence-group';
      const heading = document.createElement('h3');
      heading.className = 'sequence-group__title';
      heading.textContent = groupName;
      section.appendChild(heading);

      for (const sequence of sequences) {
        section.appendChild(this.renderSequenceItem(sequence, counts.get(sequence.id)));
      }
      this.dom.sequenceList.appendChild(section);
    }
  }

  renderSequenceItem(sequence, issues) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sequence-item';
    if (!sequence.enabled) button.classList.add('sequence-item--disabled');
    button.setAttribute('aria-current', String(sequence.id === this.selectedSequenceId));

    const label = document.createElement('span');
    label.className = 'sequence-item__label';

    const name = document.createElement('span');
    name.className = 'sequence-item__name';
    const description = describeTrigger(this.schemaIndex, sequence.trigger);
    const parameterOnly = description.includes(': ') ? description.split(': ').slice(1).join(': ') : description;
    name.textContent = parameterOnly;
    name.title = description;
    label.appendChild(name);

    const activeCount = sequence.lines.filter((line) => !line.archived).length;
    const count = document.createElement('span');
    count.className = 'badge badge--count';
    count.textContent = String(activeCount);
    count.title = `${activeCount} fala(s) ativa(s)`;
    label.appendChild(count);

    if (issues && issues.errors > 0) {
      const badge = document.createElement('span');
      badge.className = 'badge badge--error';
      badge.textContent = String(issues.errors);
      badge.title = `${issues.errors} erro(s)`;
      label.appendChild(badge);
    }
    if (issues && issues.warnings > 0) {
      const badge = document.createElement('span');
      badge.className = 'badge badge--warning';
      badge.textContent = String(issues.warnings);
      badge.title = `${issues.warnings} aviso(s)`;
      label.appendChild(badge);
    }

    button.appendChild(label);
    if (!sequence.enabled) {
      const meta = document.createElement('span');
      meta.className = 'sequence-item__meta';
      meta.textContent = 'inativa — silêncio intencional';
      button.appendChild(meta);
    }

    button.addEventListener('click', () => this.selectSequence(sequence.id));
    return button;
  }

  renderGraph() {
    const sequence = findSequence(this.project, this.selectedSequenceId);
    this.dom.graphTitle.textContent = sequence
      ? describeTrigger(this.schemaIndex, sequence.trigger)
      : 'Nenhuma sequência selecionada';
    this.dom.sequenceEnabled.checked = sequence ? sequence.enabled : false;
    this.dom.sequenceEnabled.disabled = !sequence;
    this.dom.addLine.disabled = !sequence;

    const highlight =
      this.highlight && sequence && this.highlight.sequenceId === sequence.id
        ? { playedIds: this.highlight.playedIds }
        : null;

    this.graph.render({
      sequence,
      schemaIndex: this.schemaIndex,
      selectedLineId: this.selectedLineId,
      lineStatus: this.lineStatus || new Map(),
      highlight
    });

    this.dom.graphHint.textContent = highlight
      ? 'As setas verdes mostram a ordem efetiva de reprodução no cenário simulado.'
      : 'As setas mostram a ordem de avaliação. Uma fala condicional só toca quando suas condições são verdadeiras.';
  }

  renderInspector() {
    const sequence = findSequence(this.project, this.selectedSequenceId);
    const line = sequence ? sequence.lines.find((candidate) => candidate.id === this.selectedLineId) : null;
    this.inspector.render({
      line,
      sequence,
      schemaIndex: this.schemaIndex,
      issues: line ? this.issuesForLine(line.id) : []
    });
  }

  /* ---------------------------------------------------------------- */
  /* Seleção                                                           */
  /* ---------------------------------------------------------------- */

  selectSequence(sequenceId) {
    const sequence = findSequence(this.project, sequenceId);
    const firstLine = sequence && sequence.lines.length > 0 ? sequence.lines[0].id : null;
    this.store.applyTransient((project) =>
      updateEditorState(project, { selectedSequenceId: sequenceId, selectedLineId: firstLine })
    );
    requestAnimationFrame(() => this.graph.fit());
  }

  selectLine(lineId) {
    const sequence = lineId ? findSequenceOfLine(this.project, lineId) : null;
    this.store.applyTransient((project) =>
      updateEditorState(project, {
        selectedLineId: lineId,
        selectedSequenceId: sequence ? sequence.id : project.editor.selectedSequenceId
      })
    );
  }

  /* ---------------------------------------------------------------- */
  /* Edição                                                            */
  /* ---------------------------------------------------------------- */

  createLine() {
    const sequenceId = this.selectedSequenceId;
    if (!sequenceId) return;
    const result = this.store.apply((project) => createLine(project, sequenceId), { label: 'Criar fala' });
    if (result && result.lineId) this.selectLine(result.lineId);
  }

  updateLine(lineId, patch, coalesceKey) {
    // Durante a digitação o inspetor não é redesenhado, para não perder o cursor.
    this.pendingInspectorSkip = Boolean(coalesceKey);
    this.store.apply((project) => updateLine(project, lineId, patch), {
      label: 'Editar fala',
      coalesceKey: coalesceKey ? coalesceKey : null
    });
  }

  moveLine(lineId, delta) {
    this.store.apply((project) => moveLine(project, lineId, delta), { label: 'Reordenar fala' });
    requestAnimationFrame(() => this.graph.focusLine(lineId));
  }

  duplicateLine(lineId) {
    const result = this.store.apply((project) => duplicateLine(project, lineId), { label: 'Duplicar fala' });
    if (result && result.lineId) this.selectLine(result.lineId);
  }

  archiveLine(lineId, archived) {
    this.store.apply((project) => setLineArchived(project, lineId, archived), {
      label: archived ? 'Arquivar fala' : 'Restaurar fala'
    });
  }

  async deleteLine(lineId) {
    const sequence = findSequenceOfLine(this.project, lineId);
    const line = sequence ? sequence.lines.find((candidate) => candidate.id === lineId) : null;
    if (!line) return;

    const confirmed = await this.confirm(
      'Excluir fala',
      `A fala “${line.title || lineId}” será removida do projeto. Esta ação pode ser desfeita com Ctrl+Z durante esta sessão.`
    );
    if (!confirmed) return;

    this.store.apply((project) => deleteLine(project, lineId), { label: 'Excluir fala' });
    this.selectLine(null);
  }

  copyLine(lineId) {
    const line = findSequenceOfLine(this.project, lineId)?.lines.find((candidate) => candidate.id === lineId);
    if (!line) return;
    this.clipboard = deepClone(line);
    this.toast(`Fala “${line.title || lineId}” copiada.`);
  }

  pasteLine() {
    if (!this.clipboard || !this.selectedSequenceId) {
      this.toast('Nada foi copiado ainda.', 'error');
      return;
    }
    const copy = { ...deepClone(this.clipboard), id: undefined, title: `${this.clipboard.title} (cópia)` };
    const result = this.store.apply((project) => insertLine(project, this.selectedSequenceId, copy), {
      label: 'Colar fala'
    });
    if (result && result.lineId) this.selectLine(result.lineId);
  }

  /* ---------------------------------------------------------------- */
  /* Simulador e contraprovas                                          */
  /* ---------------------------------------------------------------- */

  openSimulator(scenario) {
    const sequence = findSequence(this.project, this.selectedSequenceId) || this.project.sequences[0];
    if (!sequence) return;
    this.simulator.open(scenario || this.simulator.defaultScenario(sequence));
  }

  focusIssue(issue) {
    if (issue.sequenceId) this.selectSequence(issue.sequenceId);
    if (issue.lineId) this.selectLine(issue.lineId);
    if (issue.scenario) {
      this.simulator.open(issue.scenario);
    }
  }

  /* ---------------------------------------------------------------- */
  /* Importação e exportação                                           */
  /* ---------------------------------------------------------------- */

  async handleImport() {
    const file = this.dom.importInput.files && this.dom.importInput.files[0];
    this.dom.importInput.value = '';
    if (!file) return;

    const result = await importProjectFromFile(file, this.schema);
    if (!result.ok) {
      this.toast(`Não foi possível importar: ${result.error} O projeto atual foi mantido.`, 'error');
      return;
    }

    const confirmed = await this.confirm(
      'Importar projeto',
      `O projeto atual será substituído por “${result.project.metadata.name}”. Esta ação pode ser desfeita com Ctrl+Z durante esta sessão.`
    );
    if (!confirmed) return;

    this.store.replaceProject(result.project, 'Importar projeto');
    this.revalidate(result.warnings);
    this.render();
    requestAnimationFrame(() => this.graph.fit());
    this.toast('Projeto importado.', 'success');
  }

  exportProject() {
    downloadFile(PROJECT_FILE_NAME, serializeProject(this.project));
    this.toast('Arquivo de projeto exportado.', 'success');
  }

  exportPackage() {
    if (this.report.errors.length > 0) {
      this.toast('Corrija os erros antes de exportar o pacote final.', 'error');
      return;
    }
    downloadFile(PACKAGE_FILE_NAME, serializePackage(this.project, { warnings: this.report.warnings }));
    this.toast('Pacote final exportado.', 'success');
  }

  /* ---------------------------------------------------------------- */
  /* Autosave, diálogos e avisos                                       */
  /* ---------------------------------------------------------------- */

  setAutoSaveStatus(status) {
    const element = this.dom.autosave;
    element.dataset.state = status.state;
    if (status.state === 'saving') element.textContent = 'Salvando…';
    else if (status.state === 'saved') element.textContent = 'Salvo no navegador';
    else if (status.state === 'error') element.textContent = 'Erro ao salvar';
    else element.textContent = 'Pronto';

    if (status.state === 'error') {
      this.showPersistentError(
        `O rascunho não pôde ser salvo no navegador (${status.error}). Seu trabalho continua aberto nesta aba, mas será perdido ao fechar a página. Exporte o arquivo de projeto agora.`
      );
    } else if (status.state === 'saved') {
      this.clearPersistentError();
    }
  }

  showPersistentError(message) {
    if (this.persistentToast) {
      this.persistentToast.textContent = message;
      return;
    }
    const toast = document.createElement('div');
    toast.className = 'toast toast--persistent';
    toast.setAttribute('role', 'alert');
    toast.textContent = message;
    this.dom.toasts.appendChild(toast);
    this.persistentToast = toast;
  }

  clearPersistentError() {
    if (!this.persistentToast) return;
    this.persistentToast.remove();
    this.persistentToast = null;
  }

  toast(message, kind = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast--${kind}`;
    toast.textContent = message;
    this.dom.toasts.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
  }

  confirm(title, message) {
    this.dom.confirmTitle.textContent = title;
    this.dom.confirmMessage.textContent = message;
    // Fechar com Escape mantém o valor anterior em alguns navegadores.
    this.dom.confirmDialog.returnValue = '';
    this.dom.confirmDialog.showModal();
    return new Promise((resolve) => {
      this.dom.confirmDialog.addEventListener(
        'close',
        () => resolve(this.dom.confirmDialog.returnValue === 'accept'),
        { once: true }
      );
    });
  }

  /* ---------------------------------------------------------------- */
  /* Inicialização                                                     */
  /* ---------------------------------------------------------------- */

  start() {
    for (const trigger of this.schemaIndex.triggers.values()) {
      const option = document.createElement('option');
      option.value = trigger.id;
      option.textContent = trigger.name;
      this.dom.filterTrigger.appendChild(option);
    }
    for (const speaker of this.schemaIndex.speakers.values()) {
      const option = document.createElement('option');
      option.value = speaker.id;
      option.textContent = speaker.name;
      this.dom.filterSpeaker.appendChild(option);
    }

    this.dom.app.dataset.validation = 'expanded';
    this.dom.app.hidden = false;

    this.revalidate();
    this.render();
    this.graph.setViewport(this.project.editor.viewport);
    requestAnimationFrame(() => this.graph.fit());
  }
}
