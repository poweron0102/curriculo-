/**
 * Simulador de cenário (§10.3).
 *
 * Configura gatilho, confiança, histórico de itens, marcos e a ocorrência
 * analisada; mostra as falas válidas na ordem final e destaca o ramo silencioso
 * quando nenhuma fala seria reproduzida.
 */

import { describeTrigger, speakerName } from '../domain/project-model.js';
import { createState, runSequence } from '../domain/condition-evaluator.js';
import { OCCURRENCE_FIRST, OCCURRENCE_SUBSEQUENT } from '../domain/coverage-validator.js';

function element(tag, className, textContent) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (textContent !== undefined) node.textContent = textContent;
  return node;
}

export class ScenarioSimulator {
  constructor(dialog, body, options) {
    this.dialog = dialog;
    this.body = body;
    this.options = options;
    this.scenario = null;

    this.dialog.addEventListener('close', () => {
      this.options.onClose?.();
    });

    // Os controles vivem dentro de um <form method="dialog">: Enter fecharia o
    // simulador sem querer.
    this.body.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && event.target.tagName !== 'TEXTAREA') {
        event.preventDefault();
      }
    });
  }

  /** Cenário padrão para um gatilho, sem nenhum estado histórico marcado. */
  defaultScenario(sequence) {
    return {
      sequenceId: sequence.id,
      triggerType: sequence.trigger.type,
      triggerParameter: sequence.trigger.parameter,
      occurrence: OCCURRENCE_FIRST,
      trust: 0,
      collected: {},
      delivered: {},
      milestones: {}
    };
  }

  open(scenario) {
    this.scenario = { ...scenario };
    this.render();
    if (!this.dialog.open) this.dialog.showModal();
  }

  close() {
    if (this.dialog.open) this.dialog.close();
  }

  update(patch) {
    this.scenario = { ...this.scenario, ...patch };
    this.render();
  }

  /** Resultado atual, usado também para destacar o grafo por trás do diálogo. */
  evaluate() {
    const { project, schemaIndex } = this.options.context();
    const sequence = project.sequences.find((candidate) => candidate.id === this.scenario.sequenceId);
    if (!sequence) return null;

    const consumedLineIds =
      this.scenario.occurrence === OCCURRENCE_SUBSEQUENT
        ? sequence.lines.filter((line) => !line.archived && line.repeat === 'once_per_session').map((line) => line.id)
        : [];

    const state = createState({
      trust: this.scenario.trust,
      collected: { ...this.scenario.collected },
      delivered: { ...this.scenario.delivered },
      milestones: { ...this.scenario.milestones },
      consumedLineIds
    });

    return { sequence, result: runSequence(sequence, schemaIndex, state) };
  }

  render() {
    const { project, schemaIndex } = this.options.context();
    this.body.replaceChildren();

    const layout = element('div', 'simulator');
    layout.append(this.renderControls(project, schemaIndex), this.renderResult(schemaIndex));
    this.body.appendChild(layout);

    const evaluation = this.evaluate();
    this.options.onHighlight?.(
      evaluation
        ? { sequenceId: evaluation.sequence.id, playedIds: new Set(evaluation.result.played.map((line) => line.id)) }
        : null
    );
  }

  /* ---------------------------------------------------------------- */

  renderControls(project, schemaIndex) {
    const controls = element('div', 'simulator__controls');

    /* Gatilho */
    const triggerSection = element('section', 'simulator__section');
    triggerSection.appendChild(element('h3', null, 'Gatilho'));

    const triggerSelect = document.createElement('select');
    for (const sequence of project.sequences) {
      const option = document.createElement('option');
      option.value = sequence.id;
      option.textContent = `${describeTrigger(schemaIndex, sequence.trigger)}${sequence.enabled ? '' : ' (inativa)'}`;
      triggerSelect.appendChild(option);
    }
    triggerSelect.value = this.scenario.sequenceId;
    triggerSelect.addEventListener('change', () => {
      const sequence = project.sequences.find((candidate) => candidate.id === triggerSelect.value);
      this.scenario = this.defaultScenario(sequence);
      this.render();
    });
    triggerSection.appendChild(triggerSelect);

    const sequence = project.sequences.find((candidate) => candidate.id === this.scenario.sequenceId);
    const definition = sequence ? schemaIndex.triggers.get(sequence.trigger.type) : null;

    if (definition && definition.repeatable) {
      const occurrence = document.createElement('select');
      for (const [value, label] of [
        [OCCURRENCE_FIRST, 'Primeira ocorrência'],
        [OCCURRENCE_SUBSEQUENT, 'Ocorrência posterior']
      ]) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        occurrence.appendChild(option);
      }
      occurrence.value = this.scenario.occurrence;
      occurrence.addEventListener('change', () => this.update({ occurrence: occurrence.value }));
      const label = element('label', 'field');
      label.append(element('span', null, 'Ocorrência'), occurrence);
      triggerSection.appendChild(label);
    } else {
      triggerSection.appendChild(
        element('p', 'hint', 'Este gatilho ocorre no máximo uma vez por tentativa.')
      );
    }
    controls.appendChild(triggerSection);

    /* Confiança */
    const trustSection = element('section', 'simulator__section');
    trustSection.appendChild(element('h3', null, 'Confiança'));
    const trust = document.createElement('input');
    trust.type = 'range';
    trust.min = String(schemaIndex.trust.minimum);
    trust.max = String(schemaIndex.trust.maximum);
    trust.value = String(this.scenario.trust);
    trust.style.width = '100%';
    const trustValue = element('p', 'hint', `Valor atual: ${this.scenario.trust}`);
    trust.addEventListener('input', () => {
      trustValue.textContent = `Valor atual: ${trust.value}`;
      this.update({ trust: Number(trust.value) });
    });
    trustSection.append(trust, trustValue);
    controls.appendChild(trustSection);

    /* Itens */
    const itemSection = element('section', 'simulator__section');
    itemSection.appendChild(element('h3', null, 'Histórico de itens'));
    const itemList = element('div', 'simulator__state-list');
    for (const item of schemaIndex.items.values()) {
      itemList.appendChild(this.renderItemRow(item));
    }
    itemSection.appendChild(itemList);
    controls.appendChild(itemSection);

    /* Marcos */
    const milestoneSection = element('section', 'simulator__section');
    milestoneSection.appendChild(element('h3', null, 'Marcos'));
    for (const milestone of schemaIndex.milestones.values()) {
      const label = element('label', 'state-row__toggle');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = this.scenario.milestones[milestone.id] === true;
      checkbox.addEventListener('change', () => {
        this.update({ milestones: { ...this.scenario.milestones, [milestone.id]: checkbox.checked } });
      });
      label.append(checkbox, element('span', null, milestone.name));
      milestoneSection.appendChild(label);
    }
    controls.appendChild(milestoneSection);

    const reset = element('button', 'button', 'Limpar cenário');
    reset.type = 'button';
    reset.addEventListener('click', () => {
      if (sequence) {
        this.scenario = this.defaultScenario(sequence);
        this.render();
      }
    });
    controls.appendChild(reset);

    return controls;
  }

  renderItemRow(item) {
    const row = element('div', 'state-row');
    row.appendChild(element('span', null, item.name));

    const toggles = element('div', 'state-row__toggles');

    const collectedLabel = element('label', 'state-row__toggle');
    const collected = document.createElement('input');
    collected.type = 'checkbox';
    collected.checked = this.scenario.collected[item.id] === true || this.scenario.delivered[item.id] === true;
    collected.addEventListener('change', () => {
      const nextCollected = { ...this.scenario.collected, [item.id]: collected.checked };
      const nextDelivered = { ...this.scenario.delivered };
      // Soltar o item não desfaz o histórico, mas "não pego" implica "não entregue".
      if (!collected.checked) nextDelivered[item.id] = false;
      this.update({ collected: nextCollected, delivered: nextDelivered });
    });
    collectedLabel.append(collected, element('span', null, 'pego'));

    const deliveredLabel = element('label', 'state-row__toggle');
    const delivered = document.createElement('input');
    delivered.type = 'checkbox';
    delivered.checked = this.scenario.delivered[item.id] === true;
    delivered.addEventListener('change', () => {
      const nextDelivered = { ...this.scenario.delivered, [item.id]: delivered.checked };
      const nextCollected = { ...this.scenario.collected };
      // Entregar implica ter coletado (§4.7).
      if (delivered.checked) nextCollected[item.id] = true;
      this.update({ collected: nextCollected, delivered: nextDelivered });
    });
    deliveredLabel.append(delivered, element('span', null, 'entregue'));

    toggles.append(collectedLabel, deliveredLabel);
    row.appendChild(toggles);
    return row;
  }

  renderResult(schemaIndex) {
    const panel = element('div', 'simulator__result');
    const evaluation = this.evaluate();

    if (!evaluation) {
      panel.appendChild(element('p', 'hint', 'Selecione um gatilho válido.'));
      return panel;
    }

    const { sequence, result } = evaluation;

    if (!sequence.enabled) {
      const note = element(
        'p',
        'hint',
        'Esta sequência está inativa: ela representa silêncio intencional e não reproduz nenhuma fala.'
      );
      panel.appendChild(note);
    }

    if (result.played.length === 0) {
      const silent = element('div', 'silent-branch');
      silent.textContent = sequence.enabled
        ? 'Ramo silencioso: neste estado o gatilho ocorre e nenhuma fala é reproduzida.'
        : 'Sequência inativa: nenhuma fala é reproduzida (silêncio intencional).';
      panel.appendChild(silent);
    } else {
      panel.appendChild(
        element('p', 'hint', `Ordem efetiva de reprodução — ${result.played.length} fala(s) enfileirada(s).`)
      );
    }

    const playback = element('div', 'playback');

    result.played.forEach((line, index) => {
      const item = element('div', 'playback__item');
      const head = element('div', 'playback__head');
      head.append(
        element('span', 'playback__order', `${index + 1}.`),
        element('span', 'playback__title', line.title || '(sem título)'),
        element('span', 'playback__speaker', speakerName(schemaIndex, line.speakerId))
      );
      item.append(head, element('p', 'playback__text', line.text['pt-BR'] || line.text.en || '(sem texto)'));
      playback.appendChild(item);
    });

    for (const { line, reason } of result.skipped) {
      const item = element('div', 'playback__item playback__item--skipped');
      const head = element('div', 'playback__head');
      head.append(
        element('span', 'playback__order', '—'),
        element('span', 'playback__title', line.title || '(sem título)'),
        element('span', 'playback__speaker', speakerName(schemaIndex, line.speakerId))
      );
      item.append(head, element('p', 'playback__reason', `Pulada: ${reason}.`));
      playback.appendChild(item);
    }

    if (playback.children.length === 0) {
      playback.appendChild(element('p', 'hint', 'Esta sequência não possui falas ativas.'));
    }

    panel.appendChild(playback);
    return panel;
  }
}
