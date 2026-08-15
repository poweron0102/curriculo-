/**
 * Formulário da fala selecionada (§10.1 e §10.4).
 *
 * O ID técnico não é exibido nem editável. Toda alteração vai ao histórico com
 * uma chave de agrupamento para não gerar um passo de undo por caractere.
 */

import { deepClone } from '../domain/project-model.js';

function element(tag, className, textContent) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (textContent !== undefined) node.textContent = textContent;
  return node;
}

function group(legend) {
  const section = element('section', 'inspector__group');
  section.appendChild(element('h3', 'inspector__legend', legend));
  return section;
}

function labeledField(labelText, control) {
  const label = element('label', 'field');
  label.appendChild(element('span', null, labelText));
  label.appendChild(control);
  return label;
}

function select(options, value) {
  const control = document.createElement('select');
  for (const option of options) {
    const item = document.createElement('option');
    item.value = option.value;
    item.textContent = option.label;
    control.appendChild(item);
  }
  control.value = value;
  return control;
}

export class LineInspector {
  constructor(element_, options) {
    this.element = element_;
    this.options = options;
  }

  render({ line, sequence, schemaIndex, issues }) {
    this.element.replaceChildren();

    if (!line) {
      const empty = element('p', 'inspector__empty');
      empty.textContent = sequence
        ? 'Nenhuma fala selecionada. Escolha um cartão no grafo ou crie uma nova fala.'
        : 'Selecione uma sequência para começar.';
      this.element.appendChild(empty);
      return;
    }

    this.element.append(
      this.renderIdentity(line, schemaIndex),
      this.renderTexts(line),
      this.renderPlayback(line),
      this.renderConditions(line, schemaIndex),
      this.renderIssues(issues),
      this.renderActions(line, sequence)
    );
  }

  /* ---------------------------------------------------------------- */

  renderIdentity(line, schemaIndex) {
    const section = group('Identificação');

    const title = document.createElement('input');
    title.type = 'text';
    title.value = line.title;
    title.addEventListener('input', () => {
      this.options.onUpdate(line.id, { title: title.value }, `title:${line.id}`);
    });
    section.appendChild(labeledField('Título amigável', title));

    const speakerOptions = Array.from(schemaIndex.speakers.values()).map((speaker) => ({
      value: speaker.id,
      label: speaker.name
    }));
    if (!schemaIndex.speakers.has(line.speakerId)) {
      speakerOptions.unshift({ value: line.speakerId, label: `${line.speakerId} (inexistente no catálogo)` });
    }
    const speaker = select(speakerOptions, line.speakerId);
    speaker.addEventListener('change', () => {
      this.options.onUpdate(line.id, { speakerId: speaker.value }, null);
    });
    section.appendChild(labeledField('Locutor', speaker));

    return section;
  }

  renderTexts(line) {
    const section = group('Textos');

    for (const [language, label] of [
      ['pt-BR', 'Texto em português'],
      ['en', 'Texto em inglês']
    ]) {
      const area = document.createElement('textarea');
      area.value = line.text[language];
      area.rows = 4;
      area.addEventListener('input', () => {
        this.options.onUpdate(line.id, { text: { [language]: area.value } }, `text:${language}:${line.id}`);
      });
      section.appendChild(labeledField(label, area));
    }

    const comment = document.createElement('textarea');
    comment.value = line.comment;
    comment.rows = 2;
    comment.addEventListener('input', () => {
      this.options.onUpdate(line.id, { comment: comment.value }, `comment:${line.id}`);
    });
    const commentField = labeledField('Comentário editorial', comment);
    commentField.appendChild(
      element('p', 'hint', 'Compartilhado entre os idiomas. Não é falado no jogo.')
    );
    section.appendChild(commentField);

    return section;
  }

  renderPlayback(line) {
    const section = group('Repetição');

    const repeat = select(
      [
        { value: 'once_per_session', label: 'Uma vez por tentativa' },
        { value: 'every_trigger', label: 'Sempre que o gatilho ocorrer' }
      ],
      line.repeat
    );
    repeat.addEventListener('change', () => {
      this.options.onUpdate(line.id, { repeat: repeat.value }, null);
    });
    section.appendChild(labeledField('Modo', repeat));
    section.appendChild(
      element(
        'p',
        'hint',
        'Em gatilhos repetíveis, uma fala de uma vez por tentativa deixa de tocar nas ocorrências seguintes.'
      )
    );

    return section;
  }

  renderConditions(line, schemaIndex) {
    const section = group('Condições (todas precisam ser verdadeiras)');
    const conditions = line.conditions;

    const commit = (next, coalesceKey = null) => {
      this.options.onUpdate(line.id, { conditions: next }, coalesceKey);
    };

    /* Confiança */
    const range = element('div', 'trust-range');
    for (const [key, label] of [
      ['minimum', 'Confiança mínima'],
      ['maximum', 'Confiança máxima']
    ]) {
      const input = document.createElement('input');
      input.type = 'number';
      input.min = String(schemaIndex.trust.minimum);
      input.max = String(schemaIndex.trust.maximum);
      input.placeholder = 'sem limite';
      input.value = conditions.trust[key] === null ? '' : String(conditions.trust[key]);
      input.addEventListener('input', () => {
        const next = deepClone(conditions);
        next.trust[key] = input.value === '' ? null : Number(input.value);
        commit(next, `trust:${key}:${line.id}`);
      });
      range.appendChild(labeledField(label, input));
    }
    section.appendChild(range);
    section.appendChild(
      element(
        'p',
        'hint',
        `Mínimo e máximo são inclusivos. A confiança alcançável vai de ${schemaIndex.trust.minimum} a ${schemaIndex.trust.maximum} e nunca diminui.`
      )
    );

    /* Itens */
    section.appendChild(element('h4', 'inspector__legend', 'Histórico de itens'));
    conditions.itemStates.forEach((entry, index) => {
      section.appendChild(
        this.renderItemRow(entry, index, conditions, schemaIndex, commit)
      );
    });
    section.appendChild(
      this.renderAddButton('Adicionar condição de item', () => {
        const next = deepClone(conditions);
        const firstItem = Array.from(schemaIndex.items.keys())[0];
        next.itemStates.push({ itemId: firstItem, state: 'collected', value: true });
        commit(next);
      })
    );

    /* Marcos */
    section.appendChild(element('h4', 'inspector__legend', 'Marcos'));
    conditions.milestones.forEach((entry, index) => {
      section.appendChild(this.renderMilestoneRow(entry, index, conditions, schemaIndex, commit));
    });
    section.appendChild(
      this.renderAddButton('Adicionar condição de marco', () => {
        const next = deepClone(conditions);
        const used = new Set(next.milestones.map((item) => item.milestoneId));
        const available = Array.from(schemaIndex.milestones.keys()).find((id) => !used.has(id));
        if (!available) return;
        next.milestones.push({ milestoneId: available, value: true });
        commit(next);
      })
    );

    return section;
  }

  renderItemRow(entry, index, conditions, schemaIndex, commit) {
    const row = element('div', 'condition-row');

    const itemOptions = Array.from(schemaIndex.items.values()).map((item) => ({
      value: item.id,
      label: item.name
    }));
    if (!schemaIndex.items.has(entry.itemId)) {
      itemOptions.unshift({ value: entry.itemId, label: `${entry.itemId} (inexistente)` });
    }
    const item = select(itemOptions, entry.itemId);
    item.addEventListener('change', () => {
      const next = deepClone(conditions);
      next.itemStates[index].itemId = item.value;
      commit(next);
    });

    const state = select(
      [
        { value: 'collected:true', label: 'já foi pego' },
        { value: 'collected:false', label: 'ainda não foi pego' },
        { value: 'delivered:true', label: 'já foi entregue' },
        { value: 'delivered:false', label: 'ainda não foi entregue' }
      ],
      `${entry.state}:${entry.value}`
    );
    state.addEventListener('change', () => {
      const [nextState, nextValue] = state.value.split(':');
      const next = deepClone(conditions);
      next.itemStates[index].state = nextState;
      next.itemStates[index].value = nextValue === 'true';
      commit(next);
    });

    row.append(item, state, this.renderRemoveButton(() => {
      const next = deepClone(conditions);
      next.itemStates.splice(index, 1);
      commit(next);
    }));
    return row;
  }

  renderMilestoneRow(entry, index, conditions, schemaIndex, commit) {
    const row = element('div', 'condition-row');

    const milestoneOptions = Array.from(schemaIndex.milestones.values()).map((milestone) => ({
      value: milestone.id,
      label: milestone.name
    }));
    if (!schemaIndex.milestones.has(entry.milestoneId)) {
      milestoneOptions.unshift({ value: entry.milestoneId, label: `${entry.milestoneId} (inexistente)` });
    }
    const milestone = select(milestoneOptions, entry.milestoneId);
    milestone.addEventListener('change', () => {
      const next = deepClone(conditions);
      next.milestones[index].milestoneId = milestone.value;
      commit(next);
    });

    const value = select(
      [
        { value: 'true', label: 'já ocorreu' },
        { value: 'false', label: 'ainda não ocorreu' }
      ],
      String(entry.value)
    );
    value.addEventListener('change', () => {
      const next = deepClone(conditions);
      next.milestones[index].value = value.value === 'true';
      commit(next);
    });

    row.append(milestone, value, this.renderRemoveButton(() => {
      const next = deepClone(conditions);
      next.milestones.splice(index, 1);
      commit(next);
    }));
    return row;
  }

  renderRemoveButton(onClick) {
    const button = element('button', 'button button--icon', '×');
    button.type = 'button';
    button.title = 'Remover condição';
    button.addEventListener('click', onClick);
    return button;
  }

  renderAddButton(label, onClick) {
    const button = element('button', 'button button--ghost', `+ ${label}`);
    button.type = 'button';
    button.addEventListener('click', onClick);
    return button;
  }

  renderIssues(issues) {
    const section = group('Situação desta fala');
    if (issues.length === 0) {
      section.appendChild(element('p', 'hint', 'Sem erros nem avisos.'));
      return section;
    }
    for (const issue of issues) {
      const paragraph = element('p', 'hint');
      paragraph.textContent = `${issue.kind === 'error' ? 'Erro' : 'Aviso'}: ${issue.message}`;
      section.appendChild(paragraph);
    }
    return section;
  }

  renderActions(line, sequence) {
    const section = group('Ações');
    const actions = element('div', 'inspector__actions');
    const index = sequence.lines.findIndex((candidate) => candidate.id === line.id);

    const add = (label, handler, { disabled = false, className = 'button' } = {}) => {
      const button = element('button', className, label);
      button.type = 'button';
      button.disabled = disabled;
      button.addEventListener('click', handler);
      actions.appendChild(button);
    };

    add('Mover para cima', () => this.options.onMove(line.id, -1), { disabled: index <= 0 });
    add('Mover para baixo', () => this.options.onMove(line.id, 1), {
      disabled: index === sequence.lines.length - 1
    });
    add('Duplicar', () => this.options.onDuplicate(line.id));
    add('Copiar', () => this.options.onCopy(line.id));
    add(line.archived ? 'Restaurar' : 'Arquivar', () => this.options.onArchive(line.id, !line.archived));
    add('Excluir', () => this.options.onDelete(line.id), { className: 'button button--danger' });

    section.appendChild(actions);
    if (line.archived) {
      section.appendChild(
        element(
          'p',
          'hint',
          'Falas arquivadas ficam no arquivo de projeto, mas não entram no simulador, na cobertura nem no pacote final.'
        )
      );
    }
    return section;
  }
}
