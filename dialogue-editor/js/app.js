/**
 * Ponto de entrada. Carrega o catálogo do jogo, restaura o último trabalho do
 * IndexedDB (ou o projeto inicial), monta a casca do editor e liga o autosave.
 *
 * Todos os caminhos são relativos para permitir publicação em um subdiretório
 * do GitHub Pages sem configuração de rewrite.
 */

import { indexSchema, normalizeProject } from './domain/project-model.js';
import { EditorStore } from './domain/commands.js';
import { ProjectStore, AutoSaver } from './persistence/indexed-db-store.js';
import { importProjectFromObject } from './serialization/import-project.js';
import { EditorShell } from './ui/editor-shell.js';

async function loadJson(path) {
  const response = await fetch(new URL(path, import.meta.url));
  if (!response.ok) throw new Error(`Não foi possível carregar ${path} (${response.status}).`);
  return response.json();
}

function fatal(message, detail) {
  const banner = document.createElement('div');
  banner.className = 'toast toast--persistent';
  banner.setAttribute('role', 'alert');
  banner.style.margin = '2rem auto';
  banner.style.maxWidth = '40rem';
  banner.textContent = detail ? `${message} ${detail}` : message;
  document.body.prepend(banner);
}

async function boot() {
  let schema;
  let defaultProject;
  try {
    [schema, defaultProject] = await Promise.all([
      loadJson('../data/game-schema.json'),
      loadJson('../data/default-project.json')
    ]);
  } catch (error) {
    fatal('Não foi possível carregar os dados do editor.', error.message);
    return;
  }

  const schemaIndex = indexSchema(schema);
  const projectStore = new ProjectStore();

  let initialProject = null;
  let restoreError = null;
  try {
    const record = await projectStore.load();
    if (record && record.project) {
      const imported = importProjectFromObject(record.project, schema);
      if (imported.ok) initialProject = imported.project;
    }
  } catch (error) {
    restoreError = error;
  }

  if (!initialProject) {
    initialProject = normalizeProject(defaultProject);
  }

  const store = new EditorStore(initialProject);
  const autoSaver = new AutoSaver(projectStore, (status) => shell.setAutoSaveStatus(status));
  const shell = new EditorShell({ store, schema, schemaIndex, autoSaver });

  shell.start();

  if (restoreError) {
    shell.setAutoSaveStatus({
      state: 'error',
      error: restoreError.message || String(restoreError)
    });
  } else {
    // Confirma que o armazenamento local funciona já na abertura.
    autoSaver.schedule(store.project);
    shell.toast(
      'O rascunho fica salvo apenas neste navegador. Limpar os dados do navegador remove o trabalho não exportado.'
    );
  }

  // O histórico não sobrevive ao recarregamento da página (§11.2).
  store.clearHistory();
  shell.render();

  window.addEventListener('beforeunload', () => autoSaver.flush());
}

boot();
