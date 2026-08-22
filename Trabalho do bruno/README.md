# melhor_linguagem v0.1.0

Apresentação de slides em HTML sobre Rust, tematizada como uma compilação do `cargo`/`rustc`
do primeiro ao último slide.

**Nathan Pinheiro · TCC00304** · duração alvo: 5 minutos

---

## Como abrir

Duplo clique em **`index.html`**. É isso.

Não há build, não há servidor, não há dependência de internet — fontes, imagens, CSS e JS
estão todos neste diretório. Funciona em `file://` no Chrome, Edge e Firefox.

Depois de abrir, aperte `F` para tela cheia e `P` para a janela do apresentador.

> Se preferir servir por HTTP (opcional, não necessário):
> `python -m http.server` e abrir `http://localhost:8000`.

---

## Atalhos

| Tecla | Ação |
|---|---|
| `→` `Espaço` `PgDn` `Enter` · clique | avança um passo (fragmento ou slide) |
| `←` `Backspace` `PgUp` | volta um passo |
| `↓` | entra nos slides-reserva do capítulo atual |
| `↑` | volta para a trilha principal |
| `O` | mapa da apresentação (clique para ir) |
| `G` + número + `Enter` | vai para a *unit* de número N |
| `P` | abre a janela do apresentador |
| `N` | notas na própria tela (fallback, aparece para a plateia) |
| `F` | tela cheia |
| `M` | liga / desliga o áudio |
| `R` | reduz animação (útil se o projetor tiver lag) |
| `T` | zera o cronômetro |
| `Home` / `End` | primeiro / último slide |
| `?` | ajuda na tela |
| `Esc` | fecha overlays |

O cronômetro real começa a contar no **primeiro avanço**, não ao abrir o arquivo.
O "tempo de compilação" na barra superior é decorativo: sobe com o progresso e chega em
`5.00s` no fim, sem denunciar atraso para a plateia.

---

## Janela do apresentador

`P` abre `presenter.html` numa segunda janela. Ela mostra:

- slide atual, capítulo, arquivo e progresso dos passos;
- **notas de apresentação** verbatim do roteiro;
- **piadas** em bloco separado, com as opcionais marcadas;
- **não dizer** — as armadilhas técnicas de cada slide;
- **procedência** de cada afirmação (validado diretamente / fonte primária / não validado);
- dois cronômetros: tempo neste slide vs. orçamento, e total vs. alvo acumulado, com semáforo;
- lista de salto para qualquer slide ou reserva.

As setas e os botões funcionam nas duas janelas. A sincronia usa referência direta de janela
(`window.opener`), com `BroadcastChannel` tentado antes — é o único mecanismo que funciona de
forma confiável em `file://`.

Se o navegador bloquear o pop-up, libere pop-ups para o arquivo local, ou use `N` como fallback.

---

## Estrutura

```
index.html                 o deck (todos os slides inline)
presenter.html             janela do apresentador
assets/style.css           tema, layout, componentes
assets/deck.js             navegação, fragmentos, áudio, log, highlighter
assets/notes.js            notas / piadas / procedência por slide
assets/img/ferris.png      Ferris — CC0, rustacean.net
assets/img/keith.png       Keith — meme, autoria não declarada
assets/fonts/*.woff2       JetBrains Mono (variável, subset latin)
docs/                      roteiro e pacote de validação técnica
```

---

## Trilha principal (17 telas, 8 capítulos)

| # | Capítulo | Slide | Orçamento |
|---:|---:|---|---:|
| 1 | 1 | Abertura — `Cargo.toml` e título | 20 s |
| 2 | 2 | Os mascotes | 20 s |
| 3 | 3 | Sintaxe: quatro linguagens | 35 s |
| 4 | 4 | Ownership | 23 s |
| 5 | 4 | Borrowing (+ `E0499`) | 23 s |
| 6 | 4 | Lifetimes (+ `E0597`) | 24 s |
| 7 | 5 | C confia em você (use-after-free) | 35 s |
| 8 | 6 | Threads (+ `E0277`) | 30 s |
| 9 | 7 | Quem escolhe o despacho? | 10 s |
| 10 | 7 | Rust: uma única definição | 10 s |
| 11 | 7 | Static dispatch | 10 s |
| 12 | 7 | Dynamic dispatch | 10 s |
| 13 | 7 | Rust--: dois mecanismos | 10 s |
| 14 | 7 | Java: `invokeinterface` e o JIT | 10 s |
| 15 | 7 | Comparação resumida | 10 s |
| 16 | 8 | Então Rust é a melhor? | 10 s |
| 17 | 8 | `Finished` → o programa executa | 10 s |

Os capítulos 4 e 7 são fatiados em várias telas, mas o contador mostra sempre `4/8` e `7/8` —
a plateia não percebe que são 9 telas.

## Slides-reserva (fora dos 5 minutos)

Alcançáveis com `↓` a partir de qualquer slide do capítulo, ou por `O`.

| Reserva | Pendurado em | Assunto |
|---|---|---|
| A | cap. 5 | `Option<T>` vs `NULL` / `nullptr` |
| B | cap. 5 | `Result<T, E>` e o operador `?` |
| C | cap. 5 | Strings: `char*` / `std::string` / `String` e `&str` |
| F | cap. 7 | ASM do dispatch — validado diretamente |
| D | cap. 7 | Zero-cost: os números de C/C++ |
| D2 | cap. 7 | Zero-cost: e o Rust? (não reproduzido) |
| E | cap. 7 | AVX2 / vetorização |

---

## Rastreabilidade das afirmações

A fonte da verdade é `docs/validacao_tecnica_rust_apresentacao.md`. Onde o roteiro original
conflitava com o pacote de validação, **o pacote prevaleceu**.

### ✅ Validado diretamente (compilado/executado no ambiente de validação)

| Onde | Afirmação | Ambiente |
|---|---|---|
| slide 5 | `heap-use-after-free` detectado pelo AddressSanitizer, saída ≠ 0 | clang 17.0.0 `-O1 -g -fsanitize=address` |
| slide 7 (Rust--) | a mesma classe `Dobro` participa de static e dynamic dispatch | clang++ 17.0.0 `-O3 -std=c++20` |
| slide 7 (Java) | interface compila para `invokeinterface` | javac 21.0.11 + `javap -c -p` |
| slide 7 (Java) | JIT inlinou a chamada: `inline (hot)`, `TypeProfile 5119/5119` | OpenJDK/HotSpot 21.0.11 |
| reserva F | `lea eax, [rsi+rsi]; ret` vs `mov rax,[rdi]; mov rax,[rax]; jmp rax` | clang++ 17.0.0 `-O3 -S -masm=intel` |
| reserva D | 191 B / mesmo SHA-256 / `IDENTICAL`; `std::views` 119 B / `DIFFERENT` / 39 instr. | clang & clang++ 17.0.0 `-O3 -std=c++20` |
| reserva E | 730 B, mesmo SHA-256, C == C++ byte por byte, 67 linhas com `ymm` | clang 17.0.0 `-O3 -mavx2` |

### ✅ Fonte primária (documentação oficial vigente)

| Onde | Afirmação | Fonte |
|---|---|---|
| slide 2 | Ferris é mascote **não oficial**; Keith é meme, não mascote oficial | rust-lang.org/learn/get-started |
| slide 4 (ownership) | memory safety sem GC obrigatório | Rust Book ch04-00 |
| slide 4 (borrowing) | uma mutável OU N imutáveis; `E0499` | Rust Book ch04-02 |
| slide 4 (lifetimes) | lifetimes impedem dangling references; `E0597` | Rust Book ch10-03 |
| slide 6 | `E0277` — `Rc` não implementa `Send`; tipos impedem classes de data race | Rust Book ch16-03 / ch16-00 / ch16-04 |
| slide 7 | sem herança tradicional de classes | Rust Book ch18-01 |
| slide 7 | mesmo trait em generics e `dyn`; monomorfização; vtable | Rust Book ch18-02 · Reference: trait objects · `std::keyword.dyn` |

### ⚠️ Não reproduzido — nunca apresentar como resultado deste pacote

| Onde | O que não foi validado |
|---|---|
| reserva D2 | o assembly gerado por `rustc` para o pipeline funcional. `rustc` não estava instalado no ambiente de validação. Em experimento anterior foi **reportado** como convergindo para o corpo do loop C/C++ — recompilar em godbolt.org antes de afirmar. |
| reserva E | a versão Rust do experimento AVX2. |
| — | **"51 ocorrências de `ymm`"** do roteiro antigo: número descartado, não reproduzível. |

### Diagnósticos do compilador exibidos nos slides

Os blocos `error[E0499]`, `error[E0597]` e `error[E0277]` reproduzem o **código de erro e a
mensagem** documentados no Rust Book. O desenho dos carets e das linhas de contexto foi
reconstruído para corresponder exatamente ao trecho de código mostrado ao lado — não é a saída
literal de uma execução de `rustc` neste repositório, e nenhuma linha/coluna foi copiada de um
diagnóstico oficial para um código diferente.

O bloco do AddressSanitizer no slide 5 corresponde ao que foi observado na execução real, com o
endereço elidido (`0x…`).

### Frases proibidas

- "Rust impede qualquer race condition" — `data race` ≠ `race condition`.
- "Lifetimes fazem o objeto viver mais tempo."
- "C++ precisa de duas classes para ter os dois tipos de dispatch."
- "Toda chamada de interface em Java vira chamada direta."
- "Rust sempre gera o mesmo assembly que C."
- "Menor `.text` é mais rápido."
- "Keith é o mascote oficial do C++."

---

## Créditos e licenças dos assets

- **Ferris** — `assets/img/ferris.png`, de rustacean.net, **CC0** (domínio público).
- **Keith** — `assets/img/keith.png`, meme da internet associado ao C++, **autoria não
  declarada**. Exibido na apresentação explicitamente como meme, não como mascote oficial.
- **JetBrains Mono** — `assets/fonts/`, SIL Open Font License 1.1.

O código deste deck (HTML/CSS/JS) foi escrito para esta apresentação.
