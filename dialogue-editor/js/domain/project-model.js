/**
 * Modelo de projeto: constantes de formato, geração de IDs, normalização e
 * utilitários puros de leitura. Nenhuma dependência de DOM.
 */

export const PROJECT_FORMAT = 'aramara-dialogue-project';
export const PACKAGE_FORMAT = 'aramara-dialogue-package';
export const PROJECT_FORMAT_VERSION = 1;
export const PACKAGE_FORMAT_VERSION = 1;

export const LANGUAGES = ['pt-BR', 'en'];
export const REPEAT_MODES = ['once_per_session', 'every_trigger'];
export const ITEM_STATES = ['collected', 'delivered'];

let idCounter = 0;

/** ID técnico imutável. Aleatório quando possível, sequencial como reserva. */
export function generateId(prefix) {
  idCounter += 1;
  const cryptoObj = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  let unique;
  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') {
    unique = cryptoObj.randomUUID().replace(/-/g, '').slice(0, 16);
  } else if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    const bytes = cryptoObj.getRandomValues(new Uint8Array(8));
    unique = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  } else {
    unique = `${idCounter.toString(36)}${Math.floor(Math.random() * 1e12).toString(36)}`;
  }
  return `${prefix}_${unique}`;
}

export function deepClone(value) {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function asString(value, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function asBoolean(value, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

function asNullableInteger(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.trunc(parsed);
}

/** Campos desconhecidos preservados para migrações futuras (§12.3). */
const KNOWN_LINE_KEYS = new Set([
  'id', 'title', 'speakerId', 'text', 'comment', 'repeat', 'conditions', 'archived'
]);
const KNOWN_SEQUENCE_KEYS = new Set(['id', 'trigger', 'enabled', 'lines']);
const KNOWN_PROJECT_KEYS = new Set([
  'format', 'formatVersion', 'gameSchemaVersion', 'metadata', 'sequences', 'editor'
]);

function collectExtras(source, knownKeys) {
  const extras = {};
  let hasExtras = false;
  for (const key of Object.keys(source || {})) {
    if (!knownKeys.has(key) && key !== '_extras') {
      extras[key] = source[key];
      hasExtras = true;
    }
  }
  if (source && source._extras && typeof source._extras === 'object') {
    Object.assign(extras, source._extras);
    hasExtras = true;
  }
  return hasExtras ? extras : null;
}

export function normalizeConditions(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const trustSource = source.trust && typeof source.trust === 'object' ? source.trust : {};

  const itemStates = Array.isArray(source.itemStates) ? source.itemStates : [];
  const milestones = Array.isArray(source.milestones) ? source.milestones : [];

  return {
    trust: {
      minimum: asNullableInteger(trustSource.minimum),
      maximum: asNullableInteger(trustSource.maximum)
    },
    itemStates: itemStates
      .filter((entry) => entry && typeof entry === 'object' && typeof entry.itemId === 'string')
      .map((entry) => ({
        itemId: entry.itemId,
        state: ITEM_STATES.includes(entry.state) ? entry.state : 'collected',
        value: asBoolean(entry.value, true)
      })),
    milestones: milestones
      .filter((entry) => entry && typeof entry === 'object' && typeof entry.milestoneId === 'string')
      .map((entry) => ({
        milestoneId: entry.milestoneId,
        value: asBoolean(entry.value, true)
      }))
  };
}

export function createEmptyConditions() {
  return { trust: { minimum: null, maximum: null }, itemStates: [], milestones: [] };
}

export function normalizeLine(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const text = source.text && typeof source.text === 'object' ? source.text : {};
  const extras = collectExtras(source, KNOWN_LINE_KEYS);

  const line = {
    id: asString(source.id) || generateId('line'),
    title: asString(source.title),
    speakerId: asString(source.speakerId),
    text: {
      'pt-BR': asString(text['pt-BR']),
      en: asString(text.en)
    },
    comment: asString(source.comment),
    repeat: REPEAT_MODES.includes(source.repeat) ? source.repeat : 'once_per_session',
    conditions: normalizeConditions(source.conditions),
    archived: asBoolean(source.archived, false)
  };
  if (extras) line._extras = extras;
  return line;
}

export function normalizeSequence(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const triggerSource = source.trigger && typeof source.trigger === 'object' ? source.trigger : {};
  const extras = collectExtras(source, KNOWN_SEQUENCE_KEYS);

  const sequence = {
    id: asString(source.id) || generateId('seq'),
    trigger: {
      type: asString(triggerSource.type),
      parameter:
        typeof triggerSource.parameter === 'string' && triggerSource.parameter.length > 0
          ? triggerSource.parameter
          : null
    },
    enabled: asBoolean(source.enabled, false),
    lines: (Array.isArray(source.lines) ? source.lines : []).map(normalizeLine)
  };
  if (extras) sequence._extras = extras;
  return sequence;
}

export function normalizeProject(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const metadataSource = source.metadata && typeof source.metadata === 'object' ? source.metadata : {};
  const editorSource = source.editor && typeof source.editor === 'object' ? source.editor : {};
  const viewportSource =
    editorSource.viewport && typeof editorSource.viewport === 'object' ? editorSource.viewport : {};
  const extras = collectExtras(source, KNOWN_PROJECT_KEYS);

  const now = new Date().toISOString();
  const project = {
    format: PROJECT_FORMAT,
    formatVersion: Number.isInteger(source.formatVersion) ? source.formatVersion : PROJECT_FORMAT_VERSION,
    gameSchemaVersion: Number.isInteger(source.gameSchemaVersion) ? source.gameSchemaVersion : 1,
    metadata: {
      projectId: asString(metadataSource.projectId) || generateId('project'),
      name: asString(metadataSource.name) || 'Projeto sem nome',
      author: asString(metadataSource.author),
      revisionComment: asString(metadataSource.revisionComment),
      createdAt: asString(metadataSource.createdAt) || now,
      updatedAt: asString(metadataSource.updatedAt) || now
    },
    sequences: (Array.isArray(source.sequences) ? source.sequences : []).map(normalizeSequence),
    editor: {
      selectedSequenceId: asString(editorSource.selectedSequenceId) || null,
      selectedLineId: asString(editorSource.selectedLineId) || null,
      viewport: {
        x: Number.isFinite(viewportSource.x) ? viewportSource.x : 0,
        y: Number.isFinite(viewportSource.y) ? viewportSource.y : 0,
        zoom: Number.isFinite(viewportSource.zoom) && viewportSource.zoom > 0 ? viewportSource.zoom : 1
      }
    }
  };
  if (extras) project._extras = extras;
  return project;
}

/* ------------------------------------------------------------------ */
/* Leitura                                                             */
/* ------------------------------------------------------------------ */

export function findSequence(project, sequenceId) {
  return project.sequences.find((sequence) => sequence.id === sequenceId) || null;
}

export function findLine(project, lineId) {
  for (const sequence of project.sequences) {
    const line = sequence.lines.find((candidate) => candidate.id === lineId);
    if (line) return line;
  }
  return null;
}

export function findSequenceOfLine(project, lineId) {
  return project.sequences.find((sequence) => sequence.lines.some((line) => line.id === lineId)) || null;
}

export function activeLines(sequence) {
  return sequence.lines.filter((line) => !line.archived);
}

/** Falas de uma sequência que participam da execução (§10.4). */
export function playableLines(sequence) {
  return sequence.enabled ? activeLines(sequence) : [];
}

export function hasAnyText(line) {
  return LANGUAGES.some((language) => (line.text[language] || '').trim().length > 0);
}

export function missingLanguages(line) {
  return LANGUAGES.filter((language) => (line.text[language] || '').trim().length === 0);
}

/* ------------------------------------------------------------------ */
/* Catálogo                                                            */
/* ------------------------------------------------------------------ */

export function indexSchema(schema) {
  const byId = (list) => new Map((list || []).map((entry) => [entry.id, entry]));
  return {
    raw: schema,
    version: schema.version,
    speakers: byId(schema.speakers),
    items: byId(schema.items),
    milestones: byId(schema.milestones),
    endings: byId(schema.endings),
    triggers: byId(schema.triggers),
    trust: schema.trust,
    reachability: schema.reachability || { implications: [], endingConstraints: [] }
  };
}

/** Rótulo legível de uma sequência, usado em listas, grafo e erros. */
export function describeTrigger(schemaIndex, trigger) {
  const definition = schemaIndex.triggers.get(trigger.type);
  if (!definition) {
    return `Gatilho desconhecido (${trigger.type || '—'})`;
  }
  if (!definition.parameter) {
    return definition.name;
  }
  if (definition.parameter.kind === 'item') {
    const item = schemaIndex.items.get(trigger.parameter);
    return `${definition.name}: ${item ? item.name : trigger.parameter || '—'}`;
  }
  if (definition.parameter.kind === 'ending') {
    const ending = schemaIndex.endings.get(trigger.parameter);
    return `${definition.name}: ${ending ? ending.name : trigger.parameter || '—'}`;
  }
  return `${definition.name}: ${trigger.parameter || '—'}`;
}

export function speakerName(schemaIndex, speakerId) {
  const speaker = schemaIndex.speakers.get(speakerId);
  return speaker ? speaker.name : speakerId || '—';
}

export function itemName(schemaIndex, itemId) {
  const item = schemaIndex.items.get(itemId);
  return item ? item.name : itemId;
}

export function milestoneName(schemaIndex, milestoneId) {
  const milestone = schemaIndex.milestones.get(milestoneId);
  return milestone ? milestone.name : milestoneId;
}

/** Assinatura estável das condições, usada para detectar duplicatas (§9.2). */
export function conditionsSignature(conditions) {
  const items = conditions.itemStates
    .map((entry) => `${entry.itemId}:${entry.state}:${entry.value ? 1 : 0}`)
    .sort()
    .join('|');
  const milestones = conditions.milestones
    .map((entry) => `${entry.milestoneId}:${entry.value ? 1 : 0}`)
    .sort()
    .join('|');
  return `t:${conditions.trust.minimum ?? '-'}..${conditions.trust.maximum ?? '-'};i:${items};m:${milestones}`;
}

/** Etiquetas curtas das condições, exibidas nos cartões do grafo (§10.2). */
export function conditionLabels(schemaIndex, conditions) {
  const labels = [];
  const { minimum, maximum } = conditions.trust;
  if (minimum !== null && maximum !== null) {
    labels.push(minimum === maximum ? `confiança = ${minimum}` : `confiança ${minimum}–${maximum}`);
  } else if (minimum !== null) {
    labels.push(`confiança ≥ ${minimum}`);
  } else if (maximum !== null) {
    labels.push(`confiança ≤ ${maximum}`);
  }
  for (const entry of conditions.itemStates) {
    const name = itemName(schemaIndex, entry.itemId);
    const verb = entry.state === 'collected' ? 'pego' : 'entregue';
    labels.push(entry.value ? `${name} ${verb}` : `${name} não ${verb}`);
  }
  for (const entry of conditions.milestones) {
    const name = milestoneName(schemaIndex, entry.milestoneId);
    labels.push(entry.value ? name : `sem ${name.toLowerCase()}`);
  }
  return labels;
}
