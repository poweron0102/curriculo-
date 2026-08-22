# Roteiro — Rust: a melhor linguagem de programação*

**Duração alvo:** ~5 minutos
**Tom:** provocativo, humorístico e tecnicamente correto
**Tese:** Rust oferece controle e desempenho de linguagem de sistemas, com abstrações modernas e várias garantias de segurança verificadas em compilação.

> **Nota sobre esta cópia:** transcrição em UTF-8 limpo do roteiro original. Onde o roteiro conflitar com `validacao_tecnica_rust_apresentacao.md`, **o pacote de validação prevalece** — em particular no Backup D (parte Rust) e no Backup E (contagem de `ymm`).

---

## Slide 1 — Rust: a melhor linguagem de programação*

### Conteúdo do slide

# Rust 🦀
## A melhor linguagem de programação*

`*fonte: minha opinião`

Rodapé: `C = C` · `C++ = Rust--`

### Notas de apresentação

Abrir estabelecendo o tom:

> "Hoje eu vou explicar por que Rust é objetivamente a melhor linguagem de programação."

Depois:

> "Por respeito histórico, C vai continuar sendo chamado de C. C++ será chamado pelo nome tecnicamente correto durante esta apresentação: Rust--."

Explicar rapidamente que a apresentação é provocativa, mas que as comparações técnicas serão reais.

### Notas de piadas

- "Rust--" deve aparecer como piada recorrente, não em absolutamente toda frase.
- Evitar atacar C: tratar C como uma linguagem excelente para o propósito para o qual foi criada.
- A piada funciona melhor se "Rust--" aparecer discretamente em rodapés depois deste slide.

### Referências

- https://www.rust-lang.org/
- https://doc.rust-lang.org/book/

---

## Slide 2 — Antes de começar: os mascotes

### Conteúdo do slide

**Rust** — 🦀 Ferris — mascote não oficial da comunidade Rust.

**Rust--** — 🐁 Keith — mascote meme/não oficial associado ao C++ na internet.

Texto pequeno: *"Keith NÃO é o mascote oficial do C++."*

### Notas de apresentação

Explicar que Ferris é o conhecido caranguejo associado à comunidade Rust. Depois introduzir Keith:

> "C++ oficialmente não possui esse rato como mascote. A internet, entretanto, achou que ele combinava."

Deixar explícito que Keith é um meme e não informação oficial sobre a linguagem.

### Notas de piadas

> "Rust tem um caranguejo simpático. C++ não tem mascote oficial… mas a internet decidiu que ele merecia um rato sem uma perna."

Ou:

> "Eu não vou tirar nenhuma conclusão sobre a qualidade das linguagens baseado exclusivamente nos mascotes. Vocês podem."

### Referências

- https://www.rust-lang.org/learn/get-started
- Keith é um meme da comunidade, não um mascote oficial do C++.

---

## Slide 3 — Rust pode ser surpreendentemente simples

### Conteúdo do slide

**Python**

```python
for idx, numero in enumerate(numeros):
    print(f"{idx} -> {numero}")
```

**Rust**

```rust
for (idx, numero) in numeros.iter().enumerate() {
    println!("{idx} -> {numero}");
}
```

**Java**

```java
for (int idx = 0; idx < numeros.size(); idx++) {
    int numero = numeros.get(idx);
    System.out.println(idx + " -> " + numero);
}
```

**Rust--**

```cpp
for (std::size_t idx = 0; idx < numeros.size(); ++idx) {
    const auto& numero = numeros[idx];
    std::cout << idx << " -> " << numero << '\n';
}
```

Frase principal:

> **Uma linguagem de sistemas não precisa parecer difícil de ler.**

### Notas de apresentação

Explicar que a ideia não é dizer que Rust "é Python com chaves". A comparação é de legibilidade e ergonomia: inferência de tipos, iteradores, `enumerate`, interpolação de valores no `println!`, sintaxe compacta.

Explicar rapidamente: `.iter()` cria um iterador sobre a coleção; `.enumerate()` adiciona o índice; `(idx, numero)` desempacota os dois valores.

### Notas de piadas

> "Rust é quase Python, se Python tivesse `{}` e quisesse conversar diretamente com a CPU."

Na versão C++:

> "O `std::` está ali para lembrar que você está programando em Rust--."

Não dizer literalmente que a gramática de Rust é semelhante à de Python.

### Referências

- https://doc.rust-lang.org/std/iter/trait.Iterator.html#method.enumerate
- https://docs.python.org/3/library/functions.html#enumerate

---

## Slide 4 — O verdadeiro motivo: Ownership

### Conteúdo do slide

# Ownership · Borrowing · Lifetimes

**Ownership**

```rust
let nome = String::from("Ferris");
```

> Todo recurso possui um responsável pela sua existência.

**Borrowing**

```rust
fn imprimir(numeros: &[i32]) {
    // lê os dados sem tomar posse deles
}

fn ordenar(numeros: &mut [i32]) {
    // recebe acesso mutável
}
```

Regra simplificada: **VÁRIOS LEITORES · OU · UM ESCRITOR**

**Lifetimes**

```text
objeto:       |================|
referência:       |========|       ✓

objeto:       |======|
referência:       |==============| ✗
```

### Notas de apresentação

**Ownership** — "Em Rust, recursos possuem um dono. Quando esse dono sai de escopo, o recurso pode ser liberado automaticamente." Isso permite gerenciar memória sem precisar de garbage collector para esse modelo de propriedade.

**Borrowing** — "Uma função frequentemente precisa apenas consultar uma coleção, sem se tornar dona dela." `&[i32]` representa acesso emprestado somente para leitura; `&mut [i32]` representa acesso mutável exclusivo. "A intuição é parecida com vários leitores simultâneos ou um escritor exclusivo."

**Lifetimes** — "Lifetimes permitem que o compilador verifique relações entre a validade de referências." **Não dizer que lifetimes fazem objetos viverem mais tempo.**

### Notas de piadas

> "C pergunta: 'você sabe o que está fazendo?'"
> "Rust pergunta: 'você consegue provar?'"

Evitar analogia de videogame; manter exemplos dentro de programação.

### Referências

- https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html
- https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html
- https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html

---

## Slide 5 — C confia em você

### Conteúdo do slide

```c
int *p = malloc(sizeof(int));
*p = 42;
free(p);
printf("%d", *p);
```

Pergunta: **O que acontece?** → Resposta: **🤷 Undefined Behavior**

```text
C:                        Rust:
"Você tem certeza?"       "Você tem certeza?"
"Sim."                    "Sim."
"👍"                      "PROVE."
```

### Notas de apresentação

Explicar que o ponteiro continua armazenando um endereço depois do `free`, mas aquele objeto já deixou de existir. O acesso seguinte é **use-after-free** e resulta em comportamento indefinido.

Importante não transformar isso em "C é ruim":

> "C está fazendo exatamente o que prometeu: oferecer controle muito direto sobre memória."

Mencionar que C++ moderno possui ferramentas melhores: RAII, `std::unique_ptr`, `std::shared_ptr`, containers seguros.

A diferença a destacar é que Rust coloca várias dessas restrições dentro do modelo de ownership e do sistema de tipos.

### Notas de piadas

> "Em C, você pediu. Ele fez."
> "C respeita sua liberdade, inclusive a liberdade de destruir o próprio programa."

Para C++:

> "Rust-- possui várias ferramentas modernas para evitar isso. É importante reconhecer que ele evoluiu desde a época dos dinossauros."

### Referências

- https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html
- ISO C standard / documentação de compiladores (undefined behavior / lifetime)
- https://en.cppreference.com/w/cpp/memory

---

## Slide 6 — Threads: quando o compilador fica ainda mais paranoico

### Conteúdo do slide

```text
Thread 1 ──────┐
               ├── variável compartilhada
Thread 2 ──────┘
```

Se houver acesso concorrente inseguro: **Data Race 💥**

Em Rust: `Arc<Mutex<T>>`

> **Compartilhar estado mutável exige declarar como a sincronização acontece.**

### Notas de apresentação

"Uma thread é uma linha de execução acontecendo em paralelo ou concorrentemente com outra."

Uma data race pode ocorrer quando acessos concorrentes ao mesmo estado acontecem sem a sincronização apropriada.

Conectar com borrowing: "aquela regra de vários leitores ou um escritor se torna especialmente importante quando temos várias threads."

Não dizer que Rust torna todo programa concorrente automaticamente correto. O ponto é: o sistema de tipos e ownership impede várias classes de acessos concorrentes inseguros ainda em compilação.

### Notas de piadas

> "O compilador já não confiava em você com uma thread. Imagine com oito."
> "Rust permite concorrência sem exigir que você ofereça um sacrifício ao debugger."

### Referências

- https://doc.rust-lang.org/book/ch16-00-concurrency.html
- https://doc.rust-lang.org/book/ch16-03-shared-state.html

---

## Slide 7 — Interfaces, classes e o custo do polimorfismo

### Conteúdo do slide

Pergunta principal: **Quem escolhe se a abstração é estática ou dinâmica?**

### Rust — uma única definição

```rust
trait Operacao {
    fn calcular(&self, x: i32) -> i32;
}

struct Dobro;

impl Operacao for Dobro {
    fn calcular(&self, x: i32) -> i32 {
        x * 2
    }
}
```

A mesma `struct`, o mesmo `trait` e o mesmo `impl` podem ser usados das duas formas.

**Static dispatch**

```rust
fn executar<T: Operacao>(op: &T, x: i32) -> i32 { op.calcular(x) }
fn executar(op: &impl Operacao, x: i32) -> i32 { op.calcular(x) }
```

```text
tipo conhecido em compilação → monomorfização → pode inlinear
→ a abstração pode desaparecer
```

**Dynamic dispatch**

```rust
fn executar(op: &dyn Operacao, x: i32) -> i32 { op.calcular(x) }
```

```text
tipo concreto pode só ser conhecido em runtime → trait object
→ vtable → chamada indireta
```

> **Em Rust, o mesmo contrato pode ser usado com despacho estático ou dinâmico. A escolha acontece no ponto de uso.**

### Rust-- — mecanismos diferentes

```cpp
class Operacao {
public:
    virtual int calcular(int x) const = 0;
    virtual ~Operacao() = default;
};

class Dobro : public Operacao {
public:
    int calcular(int x) const override { return x * 2; }
};

int executar(const Operacao& op, int x) { return op.calcular(x); }
```

```cpp
template <typename T>
int executar(const T& op, int x) { return op.calcular(x); }

template <typename T>
concept OperacaoEstatica = requires(T op, int x) {
    { op.calcular(x) } -> std::same_as<int>;
};
```

> **A mesma classe concreta pode participar dos dois modelos, mas C++ expressa o polimorfismo estático e o dinâmico por mecanismos diferentes.**

```text
RUST
  trait Operacao
        ├── T: Operacao ─── STATIC
        └── dyn Operacao ── DYNAMIC

RUST--
  template/concept ─────── STATIC
  classe base + virtual ── DYNAMIC
```

### Java — interface e decisão em runtime

```java
interface Operacao { int calcular(int x); }

class Dobro implements Operacao {
    public int calcular(int x) { return x * 2; }
}

static int executar(Operacao op, int x) { return op.calcular(x); }
```

No bytecode, uma chamada por interface pode usar `invokeinterface`.

```text
Java interface → dynamic dispatch → JVM / JIT
→ pode devirtualizar e inlinear em runtime
```

> **Rust e C++ normalmente fazem essa decisão antes da execução; Java ainda pode otimizar chamadas dinâmicas durante a execução através do JIT.**

### Comparação resumida

| Caso | Rust | Rust-- | Java |
|---|---|---|---|
| Contrato | `trait` | classe abstrata / `concept` | `interface` |
| Static dispatch | `T: Trait` / `impl Trait` | template / concept | não é o modelo equivalente principal |
| Dynamic dispatch | `dyn Trait` | `virtual` | interface / métodos virtuais |
| Estrutura concreta | `struct` | `class` / `struct` | `class` |
| Momento principal da decisão | compilação ou ponto de uso | depende do mecanismo escolhido | runtime, com otimizações do JIT |

# Rust separa o comportamento da forma de despachá-lo.

### Notas de apresentação

Começar lembrando: "Rust nem sequer tem classes no sentido tradicional. Ele separa dados, comportamento e implementação."

```text
dados        comportamento     implementação
struct       trait             impl
```

Depois: "Em Rust eu defino `Operacao` uma vez. Depois, quem usa essa interface decide se quer static dispatch ou dynamic dispatch."

No caso estático: "O compilador conhece o tipo concreto. Ele pode gerar uma versão específica da função para aquele tipo — isso é monomorfização — e pode até inlinear o método."

No caso dinâmico: "Com `dyn Operacao`, eu estou dizendo explicitamente que quero trabalhar através de uma interface em runtime. Aí existe um trait object e normalmente uma vtable."

Fazer a comparação com C++ com bastante precisão: "C++ também suporta os dois mundos e a mesma classe concreta pode participar dos dois. A diferença é que o contrato estático e o contrato dinâmico são mecanismos diferentes: templates/concepts de um lado, herança virtual do outro."

**Não dizer** "C++ precisa de duas classes" — isso seria falso. Dizer: "C++ frequentemente precisa expressar a mesma ideia de interface por dois mecanismos diferentes se quiser formalizar os dois contratos."

Sobre Java: "Java trabalha naturalmente com despacho dinâmico por interfaces. Mas o JIT pode observar os tipos que realmente aparecem durante a execução e devirtualizar chamadas quando consegue provar que isso é seguro."

Não comparar assembly Java diretamente no slide principal, porque `Java source → bytecode → JVM → JIT → assembly`, enquanto Rust e C++ normalmente são compilados ahead-of-time diretamente para código de máquina.

### Notas de piadas

Depois do único `trait` do Rust: "Rust pergunta: como você quer usar essa interface?"

Depois de `virtual` e `concept` no C++: "Rust-- pergunta: qual das duas interfaces você quis dizer?"

Outra opção: "Em Rust, você escolhe o custo no ponto de uso. Em Rust-- você primeiro escolhe qual mecanismo de metaprogramação quer sofrer."

Sobre classes: "Rust decidiu que talvez orientação a objetos não precisasse começar montando uma árvore genealógica." Ou: "Rust prefere implementar comportamentos a herdar problemas." — usar apenas como piada, não como afirmação de que herança é sempre ruim.

### Referências

- https://doc.rust-lang.org/book/ch10-02-traits.html
- https://doc.rust-lang.org/book/ch18-02-trait-objects.html
- https://doc.rust-lang.org/reference/items/traits.html#dyn-compatibility
- https://en.cppreference.com/w/cpp/language/virtual
- https://en.cppreference.com/w/cpp/language/templates
- https://en.cppreference.com/w/cpp/language/constraints
- https://docs.oracle.com/javase/tutorial/java/IandI/createinterface.html
- https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-6.html

### Nota sobre demonstração de ASM

O pacote de validação já produziu, com `clang++ 17.0.0 -O3 -std=c++20 -S -masm=intel`:

```text
executar_statico:   lea eax, [rsi + rsi] ; ret
executar_dinamico:  mov rax,[rdi] ; mov rax,[rax] ; jmp rax
```

**Importante:** o assembly de Rust **não** foi produzido no pacote de validação. Só chamar de "idêntico" depois de recompilar.

---

## Slide 8 — Então Rust é realmente a melhor linguagem?

### Conteúdo do slide

Primeira animação: **Então Rust é realmente a melhor linguagem?**

Segunda: *Todo mundo pode ter a sua opinião...*

Terceira: **...mas a minha é a melhor.**

### Rust oferece

- desempenho de linguagem de sistemas;
- sem garbage collector obrigatório;
- ownership, borrowing, lifetimes;
- segurança de memória por padrão;
- abstrações modernas;
- forte suporte a concorrência segura;
- possibilidade de abstrações sem custo adicional em runtime.

Fechamento: **Rust 🦀 — Um compilador que exige provas.** · Rodapé: `C++ = Rust--`

### Notas de apresentação

Antes da piada final, fazer a ressalva:

> "Obviamente Rust não é a melhor ferramenta para absolutamente todo problema."

Reconhecer: C é simples, ubíquo e extremamente importante; C++ possui décadas de ecossistema, bibliotecas e código existente; Rust possui uma curva de aprendizado real; ownership e borrowing podem ser difíceis no começo.

Depois:

> "Mas quando queremos controle de baixo nível, desempenho e segurança de memória sem depender de garbage collector, Rust apresenta um argumento muito forte."

Finalizar: "Todo mundo pode ter a sua opinião... mas a minha é a melhor."

### Notas de piadas

Última linha opcional: "Rust-- continua disponível para sistemas legados." — usar apenas se o professor/turma estiver entrando bem na brincadeira.

Outra opção mais leve: "O borrow checker pode impedir seus bugs e, ocasionalmente, impedir você de programar até explicar o que está fazendo."

### Referências

- https://www.rust-lang.org/
- https://doc.rust-lang.org/book/
- https://doc.rust-lang.org/std/

---

# Slides-reserva para perguntas

Não precisam entrar nos 5 minutos principais.

## Backup A — `Option<T>` vs `NULL` / `nullptr`

Mostrar como Rust representa explicitamente a possibilidade de ausência de valor com `Option<T>`. Comparar com `NULL`, `nullptr` e `std::optional<T>`.

## Backup B — `Result<T, E>` e tratamento de erros

```rust
fn carregar() -> Result<String, std::io::Error> {
    let texto = std::fs::read_to_string("arquivo.txt")?;
    Ok(texto)
}
```

Mostrar `Result` e o operador `?`.

## Backup C — Strings

- C: `char*`, buffers e tamanho;
- C++: `std::string`;
- Rust: `String` / `&str`.

## Backup D — Abstrações funcionais e assembly

### Pergunta

**Mais abstração = mais trabalho para a CPU?**

### Rust funcional

```rust
pub fn pontuacao(numeros: &[u32], limite: u32) -> u64 {
    numeros
        .iter()
        .enumerate()
        .filter(|(_, n)| **n >= limite)
        .map(|(i, n)| (i as u64 + 1) * (*n as u64))
        .sum()
}
```

Usa borrowing, slice, iteradores, `enumerate`, closures, `filter`, `map`, `sum`.

### C++ funcional / ranges

```cpp
auto pipeline =
    std::views::iota(std::size_t{0}, numeros.size())
    | std::views::filter([&](std::size_t i) { return numeros[i] >= limite; })
    | std::views::transform([&](std::size_t i) {
        return (i + 1) * static_cast<uint64_t>(numeros[i]);
      });

return std::accumulate(pipeline.begin(), pipeline.end(), uint64_t{0});
```

### Resultado experimental

**C e C++ — ✅ validado diretamente (Clang 17, `-O3`, `-std=c++20`):**

- imperativo: `.text` 191 bytes, SHA-256 `164c082a…37fc1d8`, 62 instruções;
- `fold_indexed` + template + lambda: 191 bytes, **mesmo SHA-256**, `IDENTICAL`;
- `std::views`: 119 bytes, SHA-256 `ecd9de25…14146ad0`, `DIFFERENT`, 39 instruções, nenhum `call` no corpo.

**Rust — ⚠️ não reproduzido.** Em experimento anterior foi *reportado* como convergindo para o mesmo corpo do loop C/C++, mas `rustc` não estava disponível no ambiente de validação. Recompilar em Godbolt antes de afirmar.

### Conclusão

> **Abstração para você. Não necessariamente para a CPU.**

Mas: "zero-cost abstraction não significa que qualquer abstração será magicamente o código mais rápido possível. Precisamos medir."

### Piadas opcionais

> "Onde estão `.filter()`, `.map()`, `.enumerate()` e as closures?" — pausa — "Não estão."

Sobre `std::views`: "O pipeline de Rust-- também foi otimizado. Só tomou um caminho turístico."

Sempre acrescentar, se necessário: "Nesse compilador e nesse exemplo."

### Configurações do experimento

```text
Rust: rustc -C opt-level=3   (não executado no pacote de validação)
C:    clang -O3
C++:  clang++ -O3 -std=c++20
```

Apresentar como **"Neste exemplo, com essas versões e essas flags..."** — nunca como "Rust sempre gera o mesmo assembly que C".

## Backup E — Experimento AVX2

⚠️ **Correção obrigatória em relação à versão anterior deste roteiro:** o número "51 ocorrências de `ymm`" **não foi reproduzido** e não deve ser usado.

O que o pacote de validação mediu, com `clang / clang++ 17.0.0 -O3 -mavx2`:

- C: 67 linhas de assembly contendo `ymm` (163 ocorrências textuais);
- C++: 67 linhas, idem;
- `.text` de C e C++: 730 bytes, SHA-256 `804e99c1…49811fac`, **byte por byte idêntico**;
- Rust: **não recompilado**.

Formulação segura: "com AVX2 habilitado, as versões C e C++ deste experimento foram vetorizadas e produziram `.text` idêntico."

Usar apenas se alguém perguntar sobre SIMD, vetorização ou performance.

---

# Distribuição aproximada do tempo

| Slide | Tempo |
|---|---:|
| 1. Introdução | 20 s |
| 2. Mascotes | 20 s |
| 3. Sintaxe | 35 s |
| 4. Ownership / Borrowing / Lifetimes | 70 s |
| 5. Use-after-free | 35 s |
| 6. Threads | 30 s |
| 7. Interfaces / static vs dynamic dispatch | 70 s |
| 8. Conclusão | 20 s |

**Total aproximado:** 5 minutos.
