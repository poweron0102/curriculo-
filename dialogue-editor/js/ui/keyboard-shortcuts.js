/**
 * Atalhos de teclado (§10.5).
 *
 * Dentro de campos de texto, apenas os atalhos que não conflitam com a edição
 * nativa continuam ativos: `Ctrl+Z`, `Ctrl+Y` e `Ctrl+F` são tratados aqui;
 * `Ctrl+C`, `Ctrl+V`, `Delete`, `Ctrl+D` e `/` são deixados para o campo.
 */

function isTextEntry(target) {
  if (!target) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

export function registerShortcuts(actions) {
  const handler = (event) => {
    const inText = isTextEntry(event.target);
    const control = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();

    if (control && key === 'z' && !event.shiftKey) {
      event.preventDefault();
      actions.undo();
      return;
    }
    if ((control && key === 'y') || (control && event.shiftKey && key === 'z')) {
      event.preventDefault();
      actions.redo();
      return;
    }
    if (control && key === 'f') {
      event.preventDefault();
      actions.focusSearch();
      return;
    }

    if (event.key === 'Escape') {
      // Deixa o navegador fechar diálogos abertos antes de limpar a seleção.
      if (document.querySelector('dialog[open]')) return;
      actions.escape();
      return;
    }

    if (inText) {
      if (control && key === 's') {
        event.preventDefault();
        actions.saveNow();
      }
      return;
    }

    if (control && key === 'c') {
      event.preventDefault();
      actions.copy();
    } else if (control && key === 'v') {
      event.preventDefault();
      actions.paste();
    } else if (control && key === 'd') {
      event.preventDefault();
      actions.duplicate();
    } else if (control && key === 's') {
      event.preventDefault();
      actions.saveNow();
    } else if (event.key === 'Delete') {
      event.preventDefault();
      actions.remove();
    } else if (event.key === '/') {
      event.preventDefault();
      actions.focusSearch();
    }
  };

  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}
