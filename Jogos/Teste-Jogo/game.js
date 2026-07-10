const MAX_TIME = 16;

const itemData = {
  flint: { name: "Pederneira", shape: "flint-shape" },
  strongBranch: { name: "Galho resistente", shape: "branch-shape" },
  commonBranch: { name: "Galho comum", shape: "common-branch-shape" },
  feather: { name: "Pena", shape: "feather-shape" },
  fiber: { name: "Fibra", shape: "fiber-shape" },
  hide: { name: "Pele", shape: "hide-shape" },
  berries: { name: "Frutas", shape: "berries-shape" },
};

const phases = [
  { at: 0, name: "Noite profunda", className: "", text: "A floresta segura a respiração." },
  { at: 4, name: "Meia-noite", className: "midnight", text: "A lua sobe e os sons ficam mais próximos." },
  { at: 8, name: "Madrugada", className: "late", text: "Uma névoa leve cobre as raízes." },
  { at: 12, name: "Pré-amanhecer", className: "last", text: "O céu perde o escuro. Resta pouco tempo." },
  { at: 16, name: "Amanhecer", className: "dawn", text: "A primeira luz toca as copas." },
];

const places = {
  camp: {
    name: "Acampamento",
    intro: "A fogueira apagada deixa o acampamento frio. O homem sentado perto das brasas observa a mata, preocupado com o arco perdido.",
    exits: [
      { to: "path", label: "Trilha", x: 80, y: 66, w: 13, h: 8 },
      { to: "fallenTree", label: "Árvore caída", x: 6, y: 65, w: 17, h: 8 },
      { to: "bushes", label: "Moitas", x: 37, y: 78, w: 13, h: 8 },
    ],
    objects: [
      { id: "person", label: "Homem indígena", x: 44, y: 47, w: 13, h: 25, shape: "person-shape" },
      { id: "fire", label: "Fogueira", x: 57, y: 66, w: 13, h: 14, shape: "fire-shape" },
      { id: "flint", label: "Pederneira", x: 68, y: 74, w: 7, h: 6, shape: "flint-shape", item: "flint" },
    ],
  },
  path: {
    name: "Caminho da floresta",
    intro: "A trilha range sob seus passos. Há marcas no barro e um galho comum atravessado entre folhas molhadas.",
    exits: [
      { to: "camp", label: "Acampamento", x: 8, y: 73, w: 16, h: 8 },
      { to: "nest", label: "Ninho", x: 41, y: 30, w: 12, h: 8 },
      { to: "moonClearing", label: "Clareira", x: 77, y: 62, w: 14, h: 8 },
    ],
    objects: [
      { id: "commonBranch", label: "Galho comum", x: 39, y: 75, w: 16, h: 9, shape: "common-branch-shape", item: "commonBranch" },
    ],
  },
  fallenTree: {
    name: "Árvore caída",
    intro: "O tronco partido bloqueia a passagem. Entre raízes úmidas, um galho firme parece forte demais para ser apenas lenha.",
    exits: [
      { to: "camp", label: "Acampamento", x: 73, y: 70, w: 16, h: 8 },
      { to: "den", label: "Toca", x: 12, y: 66, w: 11, h: 8 },
    ],
    objects: [
      { id: "strongBranch", label: "Galho resistente", x: 28, y: 67, w: 28, h: 11, shape: "branch-shape", item: "strongBranch" },
    ],
  },
  nest: {
    name: "Ninho de passarinho",
    intro: "O ninho fica baixo, protegido por folhas. Uma pena caída no chão se move com o vento.",
    exits: [
      { to: "path", label: "Trilha", x: 9, y: 72, w: 12, h: 8 },
    ],
    objects: [
      { id: "nest", label: "Ninho", x: 53, y: 43, w: 15, h: 13, shape: "nest-shape" },
      { id: "feather", label: "Pena caída", x: 43, y: 71, w: 8, h: 12, shape: "feather-shape", item: "feather" },
    ],
  },
  moonClearing: {
    name: "Clareira da lua",
    intro: "A lua ilumina cipós finos. Algumas fibras parecem fortes o bastante para virar uma corda de arco.",
    exits: [
      { to: "path", label: "Trilha", x: 8, y: 70, w: 12, h: 8 },
      { to: "bushes", label: "Moitas", x: 75, y: 72, w: 12, h: 8 },
    ],
    objects: [
      { id: "fiber", label: "Fibra vegetal", x: 52, y: 64, w: 14, h: 13, shape: "fiber-shape", item: "fiber" },
    ],
  },
  den: {
    name: "Toca escondida",
    intro: "A abertura escura respira frio. Há uma pele abandonada perto da entrada, mas algo se move lá dentro.",
    exits: [
      { to: "fallenTree", label: "Árvore caída", x: 72, y: 72, w: 17, h: 8 },
    ],
    objects: [
      { id: "den", label: "Toca", x: 33, y: 52, w: 22, h: 22, shape: "den-shape" },
      { id: "hide", label: "Pele de animal", x: 57, y: 70, w: 14, h: 10, shape: "hide-shape", item: "hide" },
    ],
  },
  bushes: {
    name: "Moitas",
    intro: "As moitas guardam frutas escuras. O cheiro doce corta por um instante a tensão da noite.",
    exits: [
      { to: "camp", label: "Acampamento", x: 8, y: 73, w: 16, h: 8 },
      { to: "moonClearing", label: "Clareira", x: 73, y: 67, w: 14, h: 8 },
    ],
    objects: [
      { id: "bush", label: "Moita com frutas", x: 40, y: 63, w: 22, h: 18, shape: "bush-shape" },
      { id: "berries", label: "Frutas silvestres", x: 48, y: 67, w: 11, h: 11, shape: "berries-shape", item: "berries" },
    ],
  },
  stone: {
    name: "Pedra grande",
    intro: "A pedra parece ter caído de uma encosta antiga. Debaixo dela, algo de madeira curva aparece entre sombra e musgo.",
    exits: [
      { to: "camp", label: "Acampamento", x: 8, y: 73, w: 16, h: 8 },
    ],
    objects: [
      { id: "stone", label: "Pedra grande", x: 41, y: 54, w: 25, h: 24, shape: "stone-shape" },
    ],
  },
};

const giftRules = {
  commonBranch: {
    trust: 1,
    line: "Ele gira o galho comum nas mãos. \"Obrigado... mas acho que nem uma formiga conseguiria caçar com isso.\"",
  },
  berries: {
    trust: 1,
    line: "\"Eu não percebi como estava com fome. Você tem um bom coração.\"",
  },
  feather: {
    trust: 2,
    memory: "featherMemory",
    line: "\"Meu arco tinha uma pena parecida. Meu pai dizia que uma flecha também precisa lembrar do céu.\"",
  },
  fiber: {
    trust: 1,
    memory: "fiberHint",
    line: "\"Essa fibra é forte. Se fosse bem trançada, poderia virar uma boa corda de arco...\"",
  },
  hide: {
    trust: 2,
    line: "\"A noite estava ficando fria. Você não está só procurando meu arco... está cuidando de mim.\"",
  },
};

const state = {
  place: "camp",
  time: 0,
  trust: 0,
  inventory: [],
  selectedItem: null,
  collected: new Set(),
  gifted: new Set(),
  memories: new Set(),
  fireLit: false,
  stoneRevealed: false,
  exploredAwayFromCamp: 0,
  ended: false,
  caption: "",
};

const els = {
  viewport: document.getElementById("viewport"),
  sceneArt: document.getElementById("sceneArt"),
  hotspots: document.getElementById("hotspots"),
  caption: document.getElementById("caption"),
  phaseLabel: document.getElementById("phaseLabel"),
  placeName: document.getElementById("placeName"),
  timeBar: document.getElementById("timeBar"),
  trustBar: document.getElementById("trustBar"),
  selectedLine: document.getElementById("selectedLine"),
  inventory: document.getElementById("inventory"),
  ending: document.getElementById("ending"),
  endingKicker: document.getElementById("endingKicker"),
  endingTitle: document.getElementById("endingTitle"),
  endingText: document.getElementById("endingText"),
  restartButton: document.getElementById("restartButton"),
};

function phase() {
  return phases.reduce((current, entry) => (state.time >= entry.at ? entry : current), phases[0]);
}

function say(text) {
  state.caption = text;
}

function advanceTime(amount) {
  if (state.ended) return;
  state.time = Math.min(MAX_TIME, state.time + amount);
  revealStoneIfReady();
  if (state.time >= MAX_TIME) {
    endGame("sadDawn");
  }
}

function revealStoneIfReady() {
  if (state.stoneRevealed) return;
  if (state.trust >= 3 || state.fireLit || state.exploredAwayFromCamp >= 5 || state.memories.has("featherMemory")) {
    state.stoneRevealed = true;
    say("Ele lembra de uma pedra grande escondida entre as árvores. Uma nova trilha se abriu a partir do acampamento.");
  }
}

function changePlace(placeId) {
  if (state.ended) return;
  state.place = placeId;
  state.selectedItem = null;
  if (placeId !== "camp") {
    state.exploredAwayFromCamp += 1;
  }
  advanceTime(1);
  if (!state.ended) {
    say(`${places[placeId].intro} ${phase().text}`);
  }
  render();
}

function collect(itemId) {
  if (state.ended || state.collected.has(itemId)) return;

  if (itemId === "hide" && !state.memories.has("denScare")) {
    state.memories.add("denScare");
    advanceTime(1);
    say("Algo estala dentro da toca. Você espera o susto passar e pega a pele com cuidado.");
  } else {
    say(`Você pegou ${itemData[itemId].name.toLowerCase()}.`);
  }

  state.collected.add(itemId);
  state.inventory.push(itemId);
  render();
}

function inspect(targetId) {
  const selected = state.selectedItem;

  if (selected) {
    useItemOn(selected, targetId);
    return;
  }

  if (targetId === "person") {
    const line = getPersonLine();
    advanceTime(1);
    say(line);
    render();
    return;
  }

  const lines = {
    fire: state.fireLit ? "A fogueira acesa devolve cor ao acampamento." : "As brasas estão frias. Uma pederneira poderia reacender o fogo.",
    nest: "O ninho está seguro. A pena no chão pode ser levada sem machucar nenhum animal.",
    den: "Dois olhos brilham por um segundo no escuro. Melhor pegar só o que está na entrada.",
    bush: "Frutas pequenas crescem entre folhas fechadas.",
    stone: "Há algo preso debaixo da pedra. Você precisa de uma alavanca forte.",
  };

  say(lines[targetId] || "Você observa com cuidado, mas nada muda.");
  render();
}

function getPersonLine() {
  if (state.trust >= 5) {
    return "\"Talvez uma memória nova não apague a antiga. Talvez ela sente ao lado dela.\"";
  }

  if (state.trust >= 3 || state.fireLit) {
    state.stoneRevealed = true;
    return "\"Agora lembro melhor. Havia uma pedra grande perto do som da queda. O arco pode estar preso lá.\"";
  }

  if (state.trust >= 1) {
    return "\"Obrigado por ficar. Quando a tristeza aperta, até a trilha parece esconder as próprias marcas.\"";
  }

  return "\"Eu perdi o arco do meu pai. Corri, tropecei, ouvi madeira bater em pedra... e depois só senti o frio.\"";
}

function useItemOn(itemId, targetId) {
  if (state.ended) return;

  if (targetId === "person") {
    useItemOnPerson(itemId);
    return;
  }

  if (targetId === "fire" && itemId === "flint") {
    removeItem("flint");
    state.fireLit = true;
    state.trust += 2;
    state.stoneRevealed = true;
    state.selectedItem = null;
    advanceTime(1);
    say("\"O fogo ajuda a lembrar. Eu estava correndo quando ouvi algo cair perto de uma pedra grande...\"");
    render();
    return;
  }

  if (targetId === "stone" && itemId === "strongBranch") {
    removeItem("strongBranch");
    state.selectedItem = null;
    endGame(state.trust < 2 ? "oldBowDistant" : "oldBow");
    return;
  }

  if (targetId === "stone" && itemId === "commonBranch") {
    removeItem("commonBranch");
    state.selectedItem = null;
    advanceTime(1);
    say("O galho comum quebra antes mesmo da pedra se mexer.");
    render();
    return;
  }

  say(`${itemData[itemId].name} não ajuda aqui.`);
  state.selectedItem = null;
  render();
}

function useItemOnPerson(itemId) {
  if (itemId === "strongBranch") {
    if (!state.memories.has("branchHint")) {
      state.memories.add("branchHint");
      state.selectedItem = null;
      advanceTime(1);
      say("\"Esse galho é firme. Com ele, talvez dê para levantar algo pesado... ou construir algo novo.\"");
      render();
      return;
    }

    if (state.inventory.includes("fiber")) {
      tryCraftNewBow();
      return;
    }
  }

  if (itemId === "fiber" && state.inventory.includes("strongBranch") && state.memories.has("branchHint")) {
    tryCraftNewBow();
    return;
  }

  if (!giftRules[itemId] || state.gifted.has(itemId)) {
    say(`${itemData[itemId].name} não muda a conversa agora.`);
    state.selectedItem = null;
    render();
    return;
  }

  const rule = giftRules[itemId];
  removeItem(itemId);
  state.gifted.add(itemId);
  state.trust += rule.trust;
  if (rule.memory) state.memories.add(rule.memory);
  state.selectedItem = null;
  advanceTime(1);
  say(rule.line);
  render();
}

function tryCraftNewBow() {
  if (state.trust < 5) {
    state.selectedItem = null;
    advanceTime(1);
    say("\"Não é só madeira e corda. Meu arco tinha história. Ainda não consigo simplesmente trocar isso.\"");
    render();
    return;
  }

  if (state.inventory.includes("feather")) state.memories.add("craftedWithFeather");
  if (state.inventory.includes("hide")) state.memories.add("craftedWithHide");
  removeItem("strongBranch");
  removeItem("fiber");
  removeItem("feather");
  removeItem("hide");
  state.selectedItem = null;
  endGame("newBow");
}

function removeItem(itemId) {
  const index = state.inventory.indexOf(itemId);
  if (index >= 0) state.inventory.splice(index, 1);
}

function toggleItem(itemId) {
  if (state.ended) return;
  state.selectedItem = state.selectedItem === itemId ? null : itemId;
  if (state.selectedItem) {
    say(`Selecionado: ${itemData[itemId].name}. Clique em algo na cena para usar.`);
  } else {
    say("Item guardado.");
  }
  render();
}

function endGame(type) {
  state.ended = true;
  if (type === "sadDawn") state.time = MAX_TIME;

  const endings = {
    oldBow: {
      kicker: "Final 1",
      title: "Arco recuperado",
      text: "O arco antigo sai de baixo da pedra com um rangido baixo. \"Esse arco carregava muitas lembranças. Você trouxe uma parte da minha história de volta. O galho se foi... mas nem tudo que se quebra é perdido.\"",
    },
    oldBowDistant: {
      kicker: "Final opcional",
      title: "Arco recuperado, mas sem amizade",
      text: "Você encontrou o arco antes de conhecer a dor por trás dele. O homem agradece, mas sua voz fica distante: \"Você encontrou o arco. Obrigado. Agora preciso seguir.\"",
    },
    newBow: {
      kicker: "Final 2",
      title: "Um arco e um amigo",
      text: `Vocês montam o arco juntos. ${state.memories.has("craftedWithFeather") ? "A pena vira lembrança do céu." : "A madeira nova guarda o silêncio da clareira."} ${state.memories.has("craftedWithHide") ? "A pele protege a empunhadura do frio." : ""} \"O outro arco era uma lembrança do passado. Este aqui vai ser uma lembrança desta noite. Acho que encontrei mais do que um arco.\"`,
    },
    sadDawn: {
      kicker: "Final 3",
      title: "Amanhecer triste",
      text: "O céu clareia antes que a busca encontre resposta. Ele se levanta devagar. \"O sol nasceu. Talvez algumas coisas só possam ser encontradas enquanto ainda temos coragem de procurar.\"",
    },
  };

  const ending = endings[type];
  els.endingKicker.textContent = ending.kicker;
  els.endingTitle.textContent = ending.title;
  els.endingText.textContent = ending.text;
  els.ending.classList.remove("hidden");
  render();
}

function restart() {
  state.place = "camp";
  state.time = 0;
  state.trust = 0;
  state.inventory = [];
  state.selectedItem = null;
  state.collected = new Set();
  state.gifted = new Set();
  state.memories = new Set();
  state.fireLit = false;
  state.stoneRevealed = false;
  state.exploredAwayFromCamp = 0;
  state.ended = false;
  state.caption = places.camp.intro;
  els.ending.classList.add("hidden");
  render();
}

function renderSceneArt() {
  els.sceneArt.innerHTML = `
    <span class="ground"></span>
    <span class="tree tree-a"></span>
    <span class="tree tree-b"></span>
    <span class="tree tree-c"></span>
    <span class="tree tree-d"></span>
    <span class="tree tree-e"></span>
  `;
}

function renderHotspots() {
  const place = places[state.place];
  const objects = place.objects.filter((object) => {
    if (object.item && state.collected.has(object.item)) return false;
    if (object.id === "flint" && state.fireLit) return false;
    return true;
  });
  const exits = getAvailableExits(place.exits);

  els.hotspots.innerHTML = "";

  [...objects, ...exits.map((exit) => ({ ...exit, id: `exit-${exit.to}`, exit: true }))].forEach((hotspot) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = hotspot.exit ? "hotspot exit" : "hotspot";
    button.style.left = `${hotspot.x}%`;
    button.style.top = `${hotspot.y}%`;
    button.style.width = `${hotspot.w}%`;
    button.style.height = `${hotspot.h}%`;
    button.setAttribute("aria-label", hotspot.label);

    if (hotspot.exit) {
      button.textContent = hotspot.label;
      button.addEventListener("click", () => changePlace(hotspot.to));
    } else {
      const shape = document.createElement("span");
      shape.className = hotspot.shape;
      if (hotspot.id === "fire" && state.fireLit) {
        shape.classList.add("lit");
        shape.innerHTML = "<i></i><b></b>";
      }
      button.append(shape);
      button.classList.toggle("selected-target", Boolean(state.selectedItem));
      button.addEventListener("click", () => {
        if (hotspot.item) {
          collect(hotspot.item);
        } else {
          inspect(hotspot.id);
        }
      });
    }

    els.hotspots.append(button);
  });
}

function getAvailableExits(exits) {
  const list = [...exits];
  if (state.place === "camp" && state.stoneRevealed) {
    list.push({ to: "stone", label: "Pedra grande", x: 61, y: 30, w: 17, h: 8 });
  }
  return list;
}

function renderInventory() {
  els.inventory.innerHTML = "";

  if (!state.inventory.length) {
    const slot = document.createElement("div");
    slot.className = "slot empty";
    slot.textContent = "Inventário vazio";
    els.inventory.append(slot);
    return;
  }

  state.inventory.forEach((itemId) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `slot ${state.selectedItem === itemId ? "selected" : ""}`;
    button.setAttribute("aria-label", itemData[itemId].name);
    button.addEventListener("click", () => toggleItem(itemId));

    const mini = document.createElement("span");
    mini.className = `mini ${itemData[itemId].shape}`;
    if (itemId === "berries") mini.innerHTML = "<i></i>";

    const name = document.createElement("span");
    name.className = "slot-name";
    name.textContent = itemData[itemId].name;

    button.append(mini, name);
    els.inventory.append(button);
  });
}

function renderHud() {
  const currentPhase = phase();
  const classNames = phases.map((entry) => entry.className).filter(Boolean);

  els.viewport.classList.remove(...classNames);
  if (currentPhase.className) els.viewport.classList.add(currentPhase.className);
  els.phaseLabel.textContent = currentPhase.name;
  els.placeName.textContent = places[state.place].name;
  els.timeBar.style.width = `${(state.time / MAX_TIME) * 100}%`;
  els.trustBar.style.width = `${Math.min(100, (state.trust / 6) * 100)}%`;
  els.caption.textContent = state.caption;
  els.selectedLine.textContent = state.selectedItem
    ? `${itemData[state.selectedItem].name} selecionado`
    : "Clique em objetos na cena. Clique em um item para usar.";
}

function render() {
  renderSceneArt();
  renderHotspots();
  renderInventory();
  renderHud();
}

els.restartButton.addEventListener("click", restart);

restart();
