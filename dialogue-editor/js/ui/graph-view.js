/**
 * Visão em grafo (§10.2).
 *
 * As setas representam a ordem de avaliação da sequência. Elas não significam
 * que uma fala condicional será sempre reproduzida — só o simulador mostra a
 * ordem efetiva.
 */

import { conditionLabels, speakerName } from '../domain/project-model.js';

const NODE_WIDTH = 260;
const NODE_GAP = 44;
const MARGIN_X = 48;
const MARGIN_Y = 32;
const MIN_ZOOM = 0.35;
const MAX_ZOOM = 2.5;
const SVG_NS = 'http://www.w3.org/2000/svg';

function summarize(text, limit = 160) {
  const value = (text || '').replace(/\s+/g, ' ').trim();
  return value.length > limit ? `${value.slice(0, limit - 1)}…` : value;
}

export class GraphView {
  /**
   * @param {HTMLElement} element contêiner com overflow escondido
   * @param {object} options callbacks de seleção, reordenação e viewport
   */
  constructor(element, options) {
    this.element = element;
    this.options = options;
    this.zoom = 1;
    this.pan = { x: 0, y: 0 };
    this.nodePositions = new Map();
    this.contentSize = { width: 0, height: 0 };

    this.canvas = document.createElement('div');
    this.canvas.className = 'graph__canvas';

    this.edges = document.createElementNS(SVG_NS, 'svg');
    this.edges.setAttribute('class', 'graph__edges');
    const marker = document.createElementNS(SVG_NS, 'marker');
    marker.setAttribute('id', 'arrow-head');
    marker.setAttribute('viewBox', '0 0 10 10');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '5');
    marker.setAttribute('markerWidth', '6');
    marker.setAttribute('markerHeight', '6');
    marker.setAttribute('orient', 'auto-start-reverse');
    const arrow = document.createElementNS(SVG_NS, 'path');
    arrow.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
    arrow.setAttribute('fill', 'currentColor');
    marker.appendChild(arrow);
    const defs = document.createElementNS(SVG_NS, 'defs');
    defs.appendChild(marker);
    this.edges.appendChild(defs);

    this.canvas.appendChild(this.edges);
    this.element.appendChild(this.canvas);

    this.bindPanAndZoom();
  }

  bindPanAndZoom() {
    let panning = false;
    let origin = null;

    this.element.addEventListener('pointerdown', (event) => {
      if (event.target.closest('.node')) return;
      panning = true;
      origin = { x: event.clientX - this.pan.x, y: event.clientY - this.pan.y };
      this.element.dataset.panning = 'true';
      this.element.setPointerCapture(event.pointerId);
    });

    this.element.addEventListener('pointermove', (event) => {
      if (!panning) return;
      this.pan = { x: event.clientX - origin.x, y: event.clientY - origin.y };
      this.applyTransform();
    });

    const stop = (event) => {
      if (!panning) return;
      panning = false;
      delete this.element.dataset.panning;
      if (event.pointerId !== undefined && this.element.hasPointerCapture(event.pointerId)) {
        this.element.releasePointerCapture(event.pointerId);
      }
      this.options.onViewportChange?.({ ...this.pan, zoom: this.zoom });
    };
    this.element.addEventListener('pointerup', stop);
    this.element.addEventListener('pointercancel', stop);

    this.element.addEventListener(
      'wheel',
      (event) => {
        if (!event.ctrlKey && Math.abs(event.deltaY) < 1) return;
        event.preventDefault();
        const rect = this.element.getBoundingClientRect();
        const pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
        const factor = event.deltaY < 0 ? 1.1 : 1 / 1.1;
        this.zoomAround(pointer, factor);
      },
      { passive: false }
    );
  }

  zoomAround(pointer, factor) {
    const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, this.zoom * factor));
    const ratio = nextZoom / this.zoom;
    this.pan = {
      x: pointer.x - (pointer.x - this.pan.x) * ratio,
      y: pointer.y - (pointer.y - this.pan.y) * ratio
    };
    this.zoom = nextZoom;
    this.applyTransform();
    this.options.onViewportChange?.({ ...this.pan, zoom: this.zoom });
  }

  zoomBy(factor) {
    const rect = this.element.getBoundingClientRect();
    this.zoomAround({ x: rect.width / 2, y: rect.height / 2 }, factor);
  }

  setViewport(viewport) {
    this.pan = { x: viewport.x || 0, y: viewport.y || 0 };
    this.zoom = viewport.zoom || 1;
    this.applyTransform();
  }

  applyTransform() {
    this.canvas.style.transform = `translate(${this.pan.x}px, ${this.pan.y}px) scale(${this.zoom})`;
  }

  fit() {
    const rect = this.element.getBoundingClientRect();
    if (this.contentSize.width === 0 || rect.width === 0) return;
    const scale = Math.min(
      (rect.width - 32) / this.contentSize.width,
      (rect.height - 32) / this.contentSize.height,
      1.4
    );
    this.zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, scale));
    this.pan = {
      x: (rect.width - this.contentSize.width * this.zoom) / 2,
      y: Math.max(16, (rect.height - this.contentSize.height * this.zoom) / 2)
    };
    this.applyTransform();
    this.options.onViewportChange?.({ ...this.pan, zoom: this.zoom });
  }

  /**
   * @param {object} view descrição do que desenhar
   * @param {object|null} view.sequence sequência selecionada
   * @param {object} view.schemaIndex catálogo indexado
   * @param {string|null} view.selectedLineId
   * @param {Map<string,string>} view.lineStatus id da fala -> 'error' | 'warning'
   * @param {object|null} view.highlight `{ playedIds:Set, silent:boolean }` do simulador
   */
  render(view) {
    const { sequence, schemaIndex, selectedLineId, lineStatus, highlight } = view;

    this.canvas.querySelectorAll('.node').forEach((node) => node.remove());
    this.element.querySelector('.graph-empty')?.remove();
    this.edges.querySelectorAll('path').forEach((path) => path.remove());
    this.nodePositions.clear();

    if (!sequence) {
      this.showEmpty('Selecione uma sequência no painel esquerdo.');
      this.contentSize = { width: 0, height: 0 };
      return;
    }
    if (sequence.lines.length === 0) {
      this.showEmpty(
        sequence.enabled
          ? 'Esta sequência está ativa e não possui falas. Crie a primeira fala ou desative a sequência.'
          : 'Esta sequência está inativa e representa silêncio intencional. Criar a primeira fala a ativa automaticamente.'
      );
      this.contentSize = { width: 0, height: 0 };
      return;
    }

    const elements = sequence.lines.map((line, index) =>
      this.createNode({ line, index, sequence, schemaIndex, selectedLineId, lineStatus, highlight })
    );
    for (const node of elements) this.canvas.appendChild(node);

    // Segunda passagem: a altura só é conhecida depois de inserir no documento.
    let y = MARGIN_Y;
    let width = NODE_WIDTH;
    elements.forEach((node, index) => {
      node.style.left = `${MARGIN_X}px`;
      node.style.top = `${y}px`;
      const height = node.offsetHeight;
      this.nodePositions.set(sequence.lines[index].id, { x: MARGIN_X, y, width: NODE_WIDTH, height });
      y += height + NODE_GAP;
    });

    this.contentSize = { width: width + MARGIN_X * 2, height: y };
    this.edges.setAttribute('width', `${this.contentSize.width}`);
    this.edges.setAttribute('height', `${this.contentSize.height}`);

    this.drawEdges(sequence, highlight);
    this.applyTransform();
  }

  showEmpty(message) {
    const empty = document.createElement('div');
    empty.className = 'graph-empty';
    empty.textContent = message;
    this.element.appendChild(empty);
  }

  createNode({ line, index, sequence, schemaIndex, selectedLineId, lineStatus, highlight }) {
    const node = document.createElement('article');
    node.className = 'node';
    node.tabIndex = 0;
    node.dataset.lineId = line.id;
    node.setAttribute('role', 'button');
    node.setAttribute('aria-current', String(line.id === selectedLineId));

    if (line.archived) node.classList.add('node--archived');
    const status = lineStatus.get(line.id);
    if (status === 'error') node.classList.add('node--error');
    else if (status === 'warning') node.classList.add('node--warning');

    if (highlight) {
      if (highlight.playedIds.has(line.id)) node.classList.add('node--played');
      else node.classList.add('node--muted');
    }

    const head = document.createElement('div');
    head.className = 'node__head';
    const title = document.createElement('span');
    title.className = 'node__title';
    title.textContent = line.title || '(sem título)';
    const speaker = document.createElement('span');
    speaker.className = 'node__speaker';
    speaker.textContent = speakerName(schemaIndex, line.speakerId);
    head.append(title, speaker);

    const text = document.createElement('p');
    text.className = 'node__text';
    text.textContent = summarize(line.text['pt-BR'] || line.text.en) || '(sem texto)';

    const tags = document.createElement('div');
    tags.className = 'node__tags';

    const repeat = document.createElement('span');
    repeat.className = 'tag tag--repeat';
    repeat.textContent = line.repeat === 'once_per_session' ? 'uma vez por tentativa' : 'sempre que ocorrer';
    tags.appendChild(repeat);

    if (line.archived) {
      const archived = document.createElement('span');
      archived.className = 'tag tag--flag';
      archived.textContent = 'arquivada';
      tags.appendChild(archived);
    }
    if (!sequence.enabled) {
      const inactive = document.createElement('span');
      inactive.className = 'tag tag--flag';
      inactive.textContent = 'sequência inativa';
      tags.appendChild(inactive);
    }

    for (const label of conditionLabels(schemaIndex, line.conditions)) {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = label;
      tags.appendChild(tag);
    }

    node.append(head, text, tags);

    node.addEventListener('click', () => this.options.onSelectLine(line.id));
    node.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.options.onSelectLine(line.id);
      } else if (event.altKey && event.key === 'ArrowUp') {
        event.preventDefault();
        this.options.onMoveLine(line.id, -1);
      } else if (event.altKey && event.key === 'ArrowDown') {
        event.preventDefault();
        this.options.onMoveLine(line.id, 1);
      } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        const target = sequence.lines[index + (event.key === 'ArrowUp' ? -1 : 1)];
        if (target) {
          event.preventDefault();
          this.options.onSelectLine(target.id);
        }
      }
    });

    return node;
  }

  drawEdges(sequence, highlight) {
    for (let index = 0; index < sequence.lines.length - 1; index += 1) {
      const from = this.nodePositions.get(sequence.lines[index].id);
      const to = this.nodePositions.get(sequence.lines[index + 1].id);
      if (!from || !to) continue;

      const startX = from.x + from.width / 2;
      const startY = from.y + from.height;
      const endY = to.y;

      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', `M ${startX} ${startY} L ${startX} ${endY - 6}`);
      path.setAttribute('marker-end', 'url(#arrow-head)');

      let className = 'edge';
      if (highlight) {
        const effective =
          highlight.playedIds.has(sequence.lines[index].id) && highlight.playedIds.has(sequence.lines[index + 1].id);
        className += effective ? ' edge--effective' : ' edge--muted';
      }
      path.setAttribute('class', className);
      this.edges.appendChild(path);
    }
  }

  focusLine(lineId) {
    const node = this.canvas.querySelector(`.node[data-line-id="${CSS.escape(lineId)}"]`);
    if (node) node.focus({ preventScroll: true });
  }
}
