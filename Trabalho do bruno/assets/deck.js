/* ==========================================================================
   melhor_linguagem v0.1.0 — motor do deck
   Sem dependências. Funciona em file://.
   ========================================================================== */
(function () {
'use strict';

/* ------------------------------------------------------------------ util -- */

const $  = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* -------------------------------------------------------------- highlight -- */

const KEYWORDS = {
  rust: ['as','async','await','break','const','continue','crate','dyn','else','enum','extern',
         'false','fn','for','if','impl','in','let','loop','match','mod','move','mut','pub','ref',
         'return','self','static','struct','super','trait','true','type','unsafe','use','where','while'],
  c:   ['auto','break','case','char','const','continue','default','do','double','else','enum','extern',
        'float','for','goto','if','inline','int','long','register','return','short','signed','sizeof',
        'static','struct','switch','typedef','union','unsigned','void','volatile','while','NULL'],
  cpp: ['alignas','auto','bool','break','case','catch','class','concept','const','constexpr','continue',
        'default','delete','do','double','else','enum','explicit','export','extern','false','final','float',
        'for','friend','if','inline','int','long','mutable','namespace','new','noexcept','nullptr',
        'operator','override','private','protected','public','requires','return','short','signed','sizeof',
        'static','static_cast','struct','switch','template','this','throw','true','try','typedef',
        'typename','union','unsigned','using','virtual','void','volatile','while'],
  java:['abstract','boolean','break','byte','case','catch','char','class','const','continue','default',
        'do','double','else','enum','extends','final','finally','float','for','if','implements','import',
        'instanceof','int','interface','long','native','new','null','package','private','protected',
        'public','return','short','static','super','switch','synchronized','this','throw','throws',
        'transient','true','false','try','void','volatile','while'],
  python:['and','as','assert','async','await','break','class','continue','def','del','elif','else',
          'except','False','finally','for','from','global','if','import','in','is','lambda','None',
          'nonlocal','not','or','pass','raise','return','True','try','while','with','yield','print'],
  toml: [],
  asm:  []
};

const TYPES = new Set([
  'i8','i16','i32','i64','i128','isize','u8','u16','u32','u64','u128','usize','f32','f64','bool','char',
  'str','String','Vec','Option','Result','Some','None','Ok','Err','Box','Rc','Arc','Mutex','RwLock',
  'size_t','uint8_t','uint32_t','uint64_t','int32_t','int64_t','std','uint','auto'
]);

const ASM_INSTR = new Set(['mov','lea','ret','jmp','call','push','pop','add','sub','imul','cmp','je','jne',
  'test','xor','vmovdqu','vpaddd','qword','dword','ptr']);
const ASM_REG = /\b(?:r[a-d]x|r[sd]i|r[sb]p|r(?:8|9|1[0-5])|e[a-d]x|e[sd]i|[a-d]l|ymm\d+|xmm\d+)\b/;

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildRe(lang) {
  const parts = [];
  if (lang === 'python' || lang === 'toml') {
    parts.push('(?<com>#[^\\n]*)');
  } else if (lang === 'asm') {
    parts.push('(?<com>[;#][^\\n]*)');
  } else {
    parts.push('(?<blk>\\/\\*[\\s\\S]*?\\*\\/)');
    parts.push('(?<com>\\/\\/[^\\n]*)');
  }
  if (lang === 'rust')                       parts.push('(?<attr>#!?\\[[^\\]]*\\])');
  if (lang === 'c' || lang === 'cpp')        parts.push('(?<pre>#\\s*[a-z]+)');
  parts.push('(?<str>[fbr]?"(?:\\\\.|[^"\\\\])*")');
  parts.push('(?<chr>\'(?:\\\\.|[^\'\\\\])\')');
  if (lang === 'rust')                       parts.push('(?<life>\'[a-z_][a-z0-9_]*)');
  if (lang === 'toml')                       parts.push('(?<sect>^\\s*\\[[^\\]]*\\])');
  if (lang === 'rust')                       parts.push('(?<mac>[A-Za-z_][A-Za-z0-9_]*!)');
  parts.push('(?<num>\\b\\d[\\w.]*\\b)');
  parts.push('(?<id>[A-Za-z_][A-Za-z0-9_]*)');
  return new RegExp(parts.join('|'), 'gm');
}

const RE_CACHE = {};

function highlight(src, lang) {
  lang = lang || 'rust';
  const kw = new Set(KEYWORDS[lang] || KEYWORDS.rust);
  const re = RE_CACHE[lang] || (RE_CACHE[lang] = buildRe(lang));
  re.lastIndex = 0;
  let out = '', last = 0, m;
  while ((m = re.exec(src)) !== null) {
    out += esc(src.slice(last, m.index));
    const g = m.groups;
    const raw = m[0];
    let cls = null;
    if (g.blk || g.com)      cls = 't-com';
    else if (g.attr)         cls = 't-attr';
    else if (g.pre)          cls = 't-kw2';
    else if (g.sect)         cls = 't-mac';
    else if (g.str)          cls = 't-str';
    else if (g.chr)          cls = 't-str';
    else if (g.life)         cls = 't-life';
    else if (g.mac)          cls = 't-mac';
    else if (g.num)          cls = 't-num';
    else if (g.id) {
      const after = src.slice(m.index + raw.length);
      if (lang === 'asm') {
        if (ASM_INSTR.has(raw))          cls = 't-kw';
        else if (ASM_REG.test(raw))      cls = 't-typ';
        else if (/^\s*:/.test(after))    cls = 't-fn';
        else                             cls = null;
      } else if (kw.has(raw))            cls = 't-kw';
      else if (raw === 'Self')           cls = 't-typ';
      else if (TYPES.has(raw))           cls = 't-typ';
      else if (/^[A-Z]/.test(raw))       cls = 't-typ';
      else if (/^\s*\(/.test(after))     cls = 't-fn';
      else if (lang === 'toml' && /^\s*=/.test(after)) cls = 't-fn';
    }
    out += cls ? '<span class="' + cls + '">' + esc(raw) + '</span>' : esc(raw);
    last = m.index + raw.length;
  }
  out += esc(src.slice(last));
  return out;
}

$$('pre > code[data-lang]').forEach(c => {
  c.innerHTML = highlight(c.textContent, c.dataset.lang);
});

/* ------------------------------------------------------------------ palco -- */

const stage = $('#stage');
function fit() {
  const w = document.documentElement.clientWidth;
  const h = document.documentElement.clientHeight;
  const k = Math.min(w / 1920, h / 1080);
  // origem 0 0 + left/top calculados: centramento exato em qualquer tamanho
  stage.style.transform = 'scale(' + k + ')';
  stage.style.left = Math.round((w - 1920 * k) / 2) + 'px';
  stage.style.top  = Math.round((h - 1080 * k) / 2) + 'px';
}
addEventListener('resize', fit);
fit();
// as fontes mudam a métrica; reajusta quando terminarem de carregar
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
addEventListener('load', fit);

/* ------------------------------------------------------------------ model -- */

const ALL      = $$('.slide');
const MAIN     = ALL.filter(s => !s.dataset.branch);
const BRANCH   = ALL.filter(s => s.dataset.branch);
const NOTES    = window.DECK_NOTES || {};

const VERB = {
  c1:'Compiling', c2:'Checking', c3:'Checking', c4a:'Checking', c4b:'Checking', c4c:'Checking',
  c5:'Compiling', c6:'Checking', c7a:'Monomorphizing', c7b:'Checking', c7c:'Monomorphizing',
  c7d:'Monomorphizing', c7e:'Compiling', c7f:'Compiling', c7g:'Optimizing',
  c8a:'Verifying', c8b:'Finished'
};

const CHAPTER_TITLE = {
  '1':'Abertura', '2':'Mascotes', '3':'Sintaxe', '4':'Ownership · Borrowing · Lifetimes',
  '5':'Memória e confiança', '6':'Concorrência', '7':'Abstração e despacho', '8':'Conclusão'
};

function fragsOf(sec) { return $$('[data-f]', sec); }
function maxF(sec) {
  return fragsOf(sec).reduce((a, e) => Math.max(a, +e.dataset.f || 0), 0);
}
ALL.forEach(s => { s._maxF = maxF(s); });

// passos globais da trilha principal (para a barra de progresso)
let TOTAL_STEPS = 0;
MAIN.forEach(s => { s._step0 = TOTAL_STEPS; TOTAL_STEPS += s._maxF + 1; });

const branchesOf = ch => BRANCH.filter(b => b.dataset.chapter === String(ch));

/* ------------------------------------------------------------------ state -- */

const S = {
  cur: MAIN[0],
  f: 0,
  lastMain: MAIN[0],
  audio: localStorage.getItem('deck.audio') !== '0',
  reduce: localStorage.getItem('deck.reduce') === '1',
  t0: null
};

/* ------------------------------------------------------------------ audio -- */

let AC = null;
function ac() {
  if (!AC) {
    try { AC = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { AC = false; }
  }
  if (AC && AC.state === 'suspended') AC.resume();
  return AC;
}
function tone(o) {
  if (!S.audio) return;
  const c = ac(); if (!c) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  const f = c.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.value = o.lp || 6000;
  osc.type = o.type || 'sine';
  osc.frequency.setValueAtTime(o.f0, t);
  if (o.f1) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f1), t + o.d);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(o.g, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.d);
  osc.connect(f); f.connect(g); g.connect(c.destination);
  osc.start(t); osc.stop(t + o.d + 0.02);
}
const SFX = {
  click:  () => tone({ type:'square',   f0: 1350, f1: 900,  d: 0.035, g: 0.030, lp: 3200 }),
  step:   () => tone({ type:'triangle', f0: 720,  f1: 640,  d: 0.045, g: 0.026 }),
  thunk:  () => { tone({ type:'sine', f0: 150, f1: 48, d: 0.24, g: 0.10, lp: 900 });
                  tone({ type:'triangle', f0: 300, f1: 120, d: 0.12, g: 0.035, lp: 1600 }); },
  buzz:   () => { tone({ type:'sawtooth', f0: 132, d: 0.30, g: 0.055, lp: 1100 });
                  tone({ type:'sawtooth', f0: 139, d: 0.30, g: 0.055, lp: 1100 }); },
  chord:  () => [261.63, 329.63, 392.0, 523.25].forEach((f, i) =>
                  setTimeout(() => tone({ type:'sine', f0: f, d: 1.1, g: 0.045, lp: 4000 }), i * 70)),
  back:   () => tone({ type:'square', f0: 620, f1: 820, d: 0.03, g: 0.020, lp: 2600 })
};

/* -------------------------------------------------------------------- log -- */

const logEl = $('#log');
let typing = null;

function skipTyping() {
  if (!typing) return;
  clearInterval(typing.iv);
  typing.el.innerHTML = typing.html;
  typing = null;
}

function pushLog(text, verdict, lvl) {
  skipTyping();
  const line = document.createElement('div');
  line.className = 'line' + (lvl === 'warn' ? ' is-warn' : lvl === 'err' ? ' is-err' : '');
  logEl.appendChild(line);
  // mantém 3 linhas
  const lines = $$('.line', logEl);
  while (lines.length > 3) { logEl.removeChild(lines.shift()); }
  $$('.line', logEl).forEach((l, i, arr) => {
    l.classList.remove('old', 'older');
    if (arr.length - i === 2) l.classList.add('old');
    if (arr.length - i >= 3) l.classList.add('older');
  });

  const head = '    ' + text + (verdict ? '  ' : '');
  const tail = verdict || '';
  const html = esc(head) + (tail ? '<span class="v">' + esc(tail) + '</span>' : '');
  const plain = head + tail;

  if (S.reduce) { line.innerHTML = html; return; }

  // datilografia (skipável)
  let i = 0;
  const iv = setInterval(() => {
    i += 2;
    if (i >= plain.length) { clearInterval(iv); line.innerHTML = html; typing = null; return; }
    line.innerHTML = esc(plain.slice(0, i)) + '<span class="caret"></span>';
  }, 11);
  typing = { iv, el: line, html };
}

/* -------------------------------------------------------- recompilando -- */

const rc = $('#recompile');
const RC_NOISE = [
  '   Compiling proc-macro2 v1.0.86',
  '   Compiling unicode-ident v1.0.12',
  '   Compiling quote v1.0.36',
  '   Compiling syn v2.0.72',
  '   Compiling libc v0.2.155',
  '   Compiling autocfg v1.3.0',
  '   Compiling serde v1.0.204',
  '   Compiling once_cell v1.19.0',
  '   Compiling opiniao_forte v0.4.2',
  '   Compiling rust-- (legacy shim) v0.98.0',
  '   Compiling ferris_moral_support v3.1.4'
];
let rcTimer = null;

function recompileFlash(chapter) {
  if (S.reduce) return;
  const title = $('.rc-title', rc);
  const stream = $('.rc-stream', rc);
  title.textContent = 'capítulo ' + chapter + ' — ' + (CHAPTER_TITLE[chapter] || '');
  stream.innerHTML = '';
  const pick = [];
  for (let i = 0; i < 7; i++) pick.push(RC_NOISE[(chapter * 3 + i) % RC_NOISE.length]);
  pick.forEach((t, i) => {
    const d = document.createElement('div');
    d.textContent = t;
    d.style.opacity = (0.20 + i * 0.11).toFixed(2);
    stream.appendChild(d);
  });
  rc.classList.remove('on');
  void rc.offsetWidth;
  rc.classList.add('on');
  clearTimeout(rcTimer);
  rcTimer = setTimeout(() => rc.classList.remove('on'), 430);
}

function errFlash() {
  const e = $('#errflash');
  e.classList.remove('on'); void e.offsetWidth; e.classList.add('on');
}

/* ----------------------------------------------------------------- toast -- */

let toastT = null;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('on'), 1500);
}

/* ------------------------------------------------------------- renderização -- */

function applyFrags(sec, f) {
  fragsOf(sec).forEach(e => {
    const n = +e.dataset.f || 0;
    e.classList.toggle('shown', n <= f);
  });
}

function chapterOf(sec) { return sec.dataset.chapter; }

function globalStep() {
  if (S.cur.dataset.branch) return null;
  return S.cur._step0 + S.f;
}

function updateBar() {
  const isBranch = !!S.cur.dataset.branch;
  const gs = isBranch ? null : globalStep();
  const prog = gs === null ? null : (gs + 1) / TOTAL_STEPS;

  const verbEl = $('#cbar-verb');
  let verb = VERB[S.cur.id] || 'Checking';
  verbEl.className = '';
  if (isBranch) { verb = 'Explaining'; verbEl.classList.add('is-warn'); }
  else if (S.cur.dataset.finish) {
    if (S.f >= 1) { verb = 'Running'; verbEl.classList.add('is-running'); }
    else { verb = 'Finished'; verbEl.classList.add('is-finished'); }
  }
  verbEl.textContent = verb;

  if (prog !== null) {
    $('#progress-fill').style.width = (prog * 100).toFixed(2) + '%';
    $('#cbar-elapsed').textContent = (prog * 5).toFixed(2) + 's';
  }

  const mi = MAIN.indexOf(isBranch ? S.lastMain : S.cur);
  $('#cbar-unit').textContent = isBranch
    ? 'backup ' + S.cur.dataset.branch
    : 'unit ' + (mi + 1) + '/' + MAIN.length;
  $('#cbar-count').textContent = chapterOf(isBranch ? S.lastMain : S.cur) + '/8';

  $('#flag-mute').classList.toggle('on', S.audio);
  $('#flag-motion').classList.toggle('on', !S.reduce);
  $('#flag-mute').textContent = S.audio ? 'audio' : 'muted';
  $('#flag-motion').textContent = S.reduce ? 'static' : 'anim';

  const brs = branchesOf(chapterOf(S.cur));
  const hint = $('#branch-hint');
  if (!isBranch && brs.length) {
    hint.classList.add('on');
    $('#branch-hint-text').textContent =
      brs.length + ' slide' + (brs.length > 1 ? 's' : '') + '-reserva: ' +
      brs.map(b => b.dataset.branch).join(', ');
  } else if (isBranch) {
    hint.classList.add('on');
    $('#branch-hint-text').textContent = '↑ volta para a trilha principal';
  } else {
    hint.classList.remove('on');
  }

  $('#pinned').classList.toggle('on', mi >= 1 || isBranch);
}

function show(sec, f, opts) {
  opts = opts || {};
  const prevSec = S.cur;
  const chChanged = prevSec !== sec && chapterOf(prevSec) !== chapterOf(sec);

  ALL.forEach(s => s.classList.remove('active', 'entering'));
  sec.classList.add('active');
  if (prevSec !== sec) {
    void sec.offsetWidth;
    sec.classList.add('entering');
  }
  S.cur = sec;
  S.f = clamp(f, 0, sec._maxF);
  if (!sec.dataset.branch) S.lastMain = sec;
  applyFrags(sec, S.f);

  if (opts.log !== false) {
    if (prevSec !== sec) {
      // entrou num slide novo: emite o log do próprio slide
      if (sec.dataset.log) pushLog(sec.dataset.log, sec.dataset.logV || 'ok', sec.dataset.lvl);
    } else {
      // avançou um fragmento dentro do slide
      const frag = fragsOf(sec).find(e => (+e.dataset.f || 0) === S.f && e.dataset.log);
      if (frag) pushLog(frag.dataset.log, frag.dataset.logV || 'ok', frag.dataset.lvl);
    }
  }

  if (chChanged && opts.flash !== false) {
    recompileFlash(chapterOf(sec));
    SFX.thunk();
  }

  const cursor = fragsOf(sec).find(e => (+e.dataset.f || 0) === S.f && e.dataset.sound);
  if (cursor && opts.sound !== false) { SFX.buzz(); errFlash(); }

  if (sec.dataset.finish && S.f === sec._maxF && opts.sound !== false) SFX.chord();

  updateBar();
  renderInlineNotes();
  pushState();
}

/* ------------------------------------------------------------- navegação -- */

function startTimer() { if (S.t0 === null) S.t0 = Date.now(); }

function next() {
  startTimer();
  skipTyping();          // se havia datilografia em curso, completa e segue
  const sec = S.cur;
  if (S.f < sec._maxF) { show(sec, S.f + 1); SFX.step(); return; }
  if (sec.dataset.branch) {
    const brs = branchesOf(chapterOf(sec));
    const i = brs.indexOf(sec);
    if (i < brs.length - 1) { show(brs[i + 1], 0); SFX.click(); }
    else toast('fim dos slides-reserva — ↑ volta para a trilha');
    return;
  }
  const i = MAIN.indexOf(sec);
  if (i < MAIN.length - 1) { show(MAIN[i + 1], 0); SFX.click(); }
  else toast('fim da apresentação');
}

function prev() {
  skipTyping();
  const sec = S.cur;
  if (S.f > 0) { show(sec, S.f - 1, { log: false, sound: false }); SFX.back(); return; }
  if (sec.dataset.branch) {
    const brs = branchesOf(chapterOf(sec));
    const i = brs.indexOf(sec);
    if (i > 0) show(brs[i - 1], brs[i - 1]._maxF, { log: false, sound: false });
    else show(S.lastMain, S.lastMain._maxF, { log: false, sound: false, flash: false });
    SFX.back();
    return;
  }
  const i = MAIN.indexOf(sec);
  if (i > 0) { show(MAIN[i - 1], MAIN[i - 1]._maxF, { log: false, sound: false }); SFX.back(); }
}

function down() {
  const brs = branchesOf(chapterOf(S.cur));
  if (!brs.length) { toast('sem slides-reserva neste capítulo'); return; }
  if (S.cur.dataset.branch) {
    const i = brs.indexOf(S.cur);
    if (i < brs.length - 1) { show(brs[i + 1], 0, { flash: false }); SFX.click(); }
    else toast('último slide-reserva do capítulo');
  } else {
    show(brs[0], 0, { flash: false });
    SFX.click();
  }
}

function up() {
  if (!S.cur.dataset.branch) { toast('já está na trilha principal'); return; }
  const brs = branchesOf(chapterOf(S.cur));
  const i = brs.indexOf(S.cur);
  if (i > 0) { show(brs[i - 1], 0, { flash: false }); SFX.back(); return; }
  show(S.lastMain, S.lastMain._maxF, { log: false, sound: false, flash: false });
  SFX.back();
}

function gotoId(id, f) {
  const sec = ALL.find(s => s.id === id);
  if (sec) show(sec, f === undefined ? 0 : f, { flash: false });
}

/* ------------------------------------------------------------- overlays -- */

function buildOverview() {
  const g = $('#overview .ov-grid');
  g.innerHTML = '';
  const sec1 = document.createElement('div');
  sec1.className = 'ov-sec'; sec1.textContent = 'trilha principal — 5 minutos';
  g.appendChild(sec1);
  MAIN.forEach((s, i) => {
    const c = document.createElement('div');
    c.className = 'ov-card';
    c.dataset.id = s.id;
    c.innerHTML = '<span class="n">unit ' + (i + 1) + ' · cap. ' + s.dataset.chapter +
                  ' · ' + (s._maxF + 1) + ' passo' + (s._maxF ? 's' : '') + '</span>' +
                  '<span class="t">' + esc(s.dataset.title || s.id) + '</span>';
    g.appendChild(c);
  });
  const sec2 = document.createElement('div');
  sec2.className = 'ov-sec'; sec2.textContent = 'slides-reserva — fora dos 5 minutos';
  g.appendChild(sec2);
  BRANCH.forEach(s => {
    const c = document.createElement('div');
    c.className = 'ov-card';
    c.dataset.id = s.id;
    c.innerHTML = '<span class="n">reserva ' + s.dataset.branch + ' · pendurado no cap. ' +
                  s.dataset.chapter + '</span>' +
                  '<span class="t">' + esc(s.dataset.title || s.id) + '</span>';
    g.appendChild(c);
  });
  g.addEventListener('click', e => {
    const card = e.target.closest('.ov-card');
    if (!card) return;
    closeOverlays();
    gotoId(card.dataset.id, 0);
  });
}
buildOverview();

(function buildHelpBranches() {
  const el = $('#help-branches');
  BRANCH.forEach(s => {
    const d = document.createElement('div');
    d.innerHTML = '<kbd>' + s.dataset.branch + '</kbd><span>' + esc(s.dataset.title || '') +
                  ' &nbsp;<i style="color:var(--fg-faint);font-style:normal">(cap. ' +
                  s.dataset.chapter + ')</i></span>';
    el.appendChild(d);
  });
})();

function closeOverlays() {
  $('#overview').classList.remove('on');
  $('#help').classList.remove('on');
}
function toggleOverlay(sel) {
  const el = $(sel);
  const was = el.classList.contains('on');
  closeOverlays();
  if (!was) {
    el.classList.add('on');
    if (sel === '#overview') {
      $$('.ov-card').forEach(c => c.classList.toggle('cur', c.dataset.id === S.cur.id));
    }
  }
}

/* -------------------------------------------------------- notas inline -- */

function notesHTML(id) {
  const n = NOTES[id];
  if (!n) return '<section><h4>sem notas</h4></section>';
  let h = '';
  if (n.notes && n.notes.length) {
    h += '<section><h4>notas de apresentação</h4><ul>' +
         n.notes.map(t => '<li>' + t + '</li>').join('') + '</ul></section>';
  }
  if (n.jokes && n.jokes.length) {
    h += '<section><h4>piadas</h4><ul>' +
         n.jokes.map(j => '<li class="joke">' + (typeof j === 'string' ? j : j.t) +
           (typeof j !== 'string' && j.opt ? ' <span class="opt">(opcional)</span>' : '') +
           '</li>').join('') + '</ul></section>';
  }
  if (n.avoid && n.avoid.length) {
    h += '<section><h4>não dizer</h4><ul>' +
         n.avoid.map(t => '<li style="color:var(--red)">' + t + '</li>').join('') + '</ul></section>';
  }
  if (n.evidence && n.evidence.length) {
    h += '<section><h4>procedência</h4><ul>' +
         n.evidence.map(e => '<li><b style="color:var(--' +
           (e.lvl === 'direct' ? 'green' : e.lvl === 'unval' ? 'yellow' : 'cyan') + ')">' +
           (e.lvl === 'direct' ? 'validado diretamente' : e.lvl === 'unval' ? 'NÃO validado' : 'fonte primária') +
           '</b> — ' + e.t + '</li>').join('') + '</ul></section>';
  }
  return h;
}

function renderInlineNotes() {
  const el = $('#inline-notes');
  if (!el.classList.contains('on')) return;
  el.innerHTML = '<h4 style="color:var(--rust-soft)">' + esc(S.cur.dataset.title || S.cur.id) +
                 ' · passo ' + (S.f + 1) + '/' + (S.cur._maxF + 1) + '</h4>' + notesHTML(S.cur.id);
}

/* ----------------------------------------------------- ponte apresentador -- */

let presWin = null;
let bc = null;
try { bc = new BroadcastChannel('melhor_linguagem'); } catch (e) { bc = null; }

function stateObj() {
  const brs = branchesOf(chapterOf(S.cur));
  return {
    id: S.cur.id,
    title: S.cur.dataset.title || S.cur.id,
    file: S.cur.dataset.file || '',
    chapter: chapterOf(S.cur),
    branch: S.cur.dataset.branch || null,
    f: S.f,
    maxF: S.cur._maxF,
    unit: MAIN.indexOf(S.cur.dataset.branch ? S.lastMain : S.cur) + 1,
    units: MAIN.length,
    budget: +(S.cur.dataset.budget || 0),
    elapsed: S.t0 === null ? 0 : Date.now() - S.t0,
    running: S.t0 !== null,
    audio: S.audio,
    reduce: S.reduce,
    notes: NOTES[S.cur.id] || null,
    nextId: (function () {
      if (S.cur.dataset.branch) return null;
      const i = MAIN.indexOf(S.cur);
      return i < MAIN.length - 1 ? MAIN[i + 1].id : null;
    })(),
    nextTitle: (function () {
      if (S.f < S.cur._maxF) return 'passo ' + (S.f + 2) + ' deste slide';
      if (S.cur.dataset.branch) return '—';
      const i = MAIN.indexOf(S.cur);
      return i < MAIN.length - 1 ? MAIN[i + 1].dataset.title : 'fim';
    })(),
    branchList: brs.map(b => ({ id: b.id, k: b.dataset.branch, t: b.dataset.title })),
    index: MAIN.map((s, i) => ({ id: s.id, n: i + 1, t: s.dataset.title, ch: s.dataset.chapter,
                                 b: +(s.dataset.budget || 0) }))
           .concat(BRANCH.map(s => ({ id: s.id, n: 'res.' + s.dataset.branch, t: s.dataset.title,
                                      ch: s.dataset.chapter, b: 0 })))
  };
}

function pushState() {
  const st = stateObj();
  try { if (bc) bc.postMessage({ type: 'state', st: st }); } catch (e) {}
  try {
    if (presWin && !presWin.closed && typeof presWin.__deckOnState === 'function') {
      presWin.__deckOnState(st);
    }
  } catch (e) {}
}

window.__deckBridge = {
  version: 1,
  getState: stateObj,
  cmd: function (c, arg) {
    switch (c) {
      case 'next': next(); break;
      case 'prev': prev(); break;
      case 'down': down(); break;
      case 'up':   up();   break;
      case 'goto': gotoId(arg, 0); break;
      case 'resetTimer': S.t0 = null; pushState(); break;
      case 'startTimer': startTimer(); pushState(); break;
      case 'mute': toggleAudio(); break;
    }
  }
};

if (bc) {
  bc.onmessage = e => {
    const d = e.data || {};
    if (d.type === 'cmd') window.__deckBridge.cmd(d.cmd, d.arg);
    if (d.type === 'hello') pushState();
  };
}

function openPresenter() {
  if (presWin && !presWin.closed) { presWin.focus(); pushState(); return; }
  presWin = window.open('presenter.html', 'melhor_linguagem_presenter',
                        'width=1180,height=820,menubar=no,toolbar=no');
  if (!presWin) { toast('o navegador bloqueou a janela — libere pop-ups'); return; }
  toast('janela do apresentador aberta');
  const iv = setInterval(() => {
    if (!presWin || presWin.closed) { clearInterval(iv); return; }
    if (typeof presWin.__deckOnState === 'function') { pushState(); clearInterval(iv); }
  }, 120);
}

// cronômetro: empurra estado 2x/s para o apresentador
setInterval(() => { if (presWin && !presWin.closed) pushState(); else if (bc) pushState(); }, 500);

/* ------------------------------------------------------------- comandos -- */

function toggleAudio() {
  S.audio = !S.audio;
  localStorage.setItem('deck.audio', S.audio ? '1' : '0');
  if (S.audio) SFX.click();
  toast(S.audio ? 'áudio ligado' : 'áudio desligado');
  updateBar();
}
function toggleReduce() {
  S.reduce = !S.reduce;
  document.body.classList.toggle('reduce-motion', S.reduce);
  localStorage.setItem('deck.reduce', S.reduce ? '1' : '0');
  toast(S.reduce ? 'animação reduzida' : 'animação normal');
  updateBar();
}
document.body.classList.toggle('reduce-motion', S.reduce);

let gotoBuf = null;

addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key;

  if (gotoBuf !== null) {
    if (/^[0-9]$/.test(k)) { gotoBuf += k; toast('ir para unit ' + gotoBuf); e.preventDefault(); return; }
    if (k === 'Enter') {
      const n = parseInt(gotoBuf, 10);
      if (n >= 1 && n <= MAIN.length) show(MAIN[n - 1], 0, { flash: false });
      else toast('unit fora do intervalo (1–' + MAIN.length + ')');
      gotoBuf = null; e.preventDefault(); return;
    }
    gotoBuf = null;
  }

  switch (k) {
    case 'ArrowRight': case ' ': case 'PageDown': case 'Enter':
      next(); e.preventDefault(); break;
    case 'ArrowLeft': case 'Backspace': case 'PageUp':
      prev(); e.preventDefault(); break;
    case 'ArrowDown': down(); e.preventDefault(); break;
    case 'ArrowUp':   up();   e.preventDefault(); break;
    case 'Home': show(MAIN[0], 0, { flash: false }); e.preventDefault(); break;
    case 'End':  show(MAIN[MAIN.length - 1], MAIN[MAIN.length - 1]._maxF, { flash: false }); e.preventDefault(); break;
    case 'Escape': closeOverlays(); $('#inline-notes').classList.remove('on'); break;
    default: break;
  }

  switch (k.toLowerCase()) {
    case 'o': toggleOverlay('#overview'); break;
    case '?': case '/': toggleOverlay('#help'); break;
    case 'p': openPresenter(); break;
    case 'n':
      $('#inline-notes').classList.toggle('on');
      renderInlineNotes();
      break;
    case 'f':
      if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
      else document.exitFullscreen().catch(() => {});
      break;
    case 'm': toggleAudio(); break;
    case 'r': toggleReduce(); break;
    case 't': S.t0 = Date.now(); toast('cronômetro zerado'); pushState(); break;
    case 'g': gotoBuf = ''; toast('digite o número da unit e Enter'); break;
    default: break;
  }
});

$('#slides').addEventListener('click', e => {
  if (e.target.closest('a')) return;
  next();
});

/* ------------------------------------------------------------------ boot -- */

show(MAIN[0], 0, { flash: false, log: false });
$('#pinned').classList.remove('on');
// duas primeiras linhas do log já na abertura, em ordem
pushLog('Updating crates.io index', 'ok');
skipTyping();
pushLog(MAIN[0].dataset.log, 'ok');

})();
