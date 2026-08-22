# Pacote de validação técnica — apresentação sobre Rust

**Data da validação:** 2026-08-21
**Objetivo:** este arquivo contém os fatos, resultados experimentais e diagnósticos que podem ser usados na apresentação sem precisar revalidá-los.

> **Nota sobre esta cópia:** este arquivo é uma transcrição em UTF-8 limpo do pacote de validação original (que chegou com codificação corrompida). O conteúdo técnico — números, hashes, flags, versões e formulações — foi preservado. Em caso de dúvida sobre qualquer número, o original prevalece.

> ## Instrução para quem gerar os slides
>
> Tudo marcado como **✅ VALIDADO DIRETAMENTE** foi compilado/executado no ambiente de validação.
>
> Tudo marcado como **✅ VALIDADO POR FONTE PRIMÁRIA** foi conferido na documentação oficial vigente de Rust/Java/C++.
>
> Itens marcados como **⚠️ NÃO VALIDADO NESTE AMBIENTE** **não devem** ser apresentados como resultado experimental deste pacote.
>
> Não transformar resultados locais em afirmações universais. Usar sempre formulações como:
>
> **"Neste exemplo, com este compilador e estas flags..."**

---

## 1. Ambiente usado nas validações diretas

### C / C++

```text
clang version 17.0.0
Target: x86_64-unknown-linux-gnu
```

Flags principais:

```text
-O3
-std=c++20
```

Para assembly legível: `-S -masm=intel` · Para AVX2: `-mavx2`

### Java

```text
javac 21.0.11
openjdk version "21.0.11" 2026-04-21
OpenJDK 64-Bit Server VM
```

### Rust

⚠️ **Não havia `rustc` instalado no ambiente de validação.**

Por isso:

- a semântica de Rust foi validada contra a **documentação oficial atual**;
- os diagnósticos Rust listados abaixo são exemplos publicados no Rust Book;
- resultados binários de Rust do antigo Backup D **não foram reproduzidos independentemente**.

---

## 2. Mascotes

### Ferris — ✅ VALIDADO POR FONTE PRIMÁRIA

O site oficial do Rust afirma explicitamente que *"Ferris is the unofficial mascot of the Rust Community"*.

Fonte: https://rust-lang.org/learn/get-started/

Formulação segura: **Ferris é o mascote não oficial da comunidade Rust.**

### Keith — ✅ VALIDADO COMO MEME, NÃO COMO MASCOTE OFICIAL

Keith existe como meme da internet associado ao C++ e aparece descrito como *"unofficial mascot"* em páginas de humor.

- https://programmerhumor.io/cpp-memes/meet-keith-the-unofficial-c-mascot-g308
- https://www.newgrounds.com/art/view/foxdance/keith-the-c-rat-mascot

**Keith NÃO é mascote oficial do C++.** Formulação segura: *"C++ não tem Keith como mascote oficial; Keith é um meme da internet associado à linguagem."*

---

## 3. Ownership, borrowing e lifetimes

### Ownership sem garbage collector obrigatório — ✅ FONTE PRIMÁRIA

O Rust Book diz que ownership permite a Rust fornecer garantias de memory safety **sem precisar de garbage collector**.

Fonte: https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html

Não dizer que "Rust nunca pode ter nenhum mecanismo de GC em biblioteca"; a afirmação é sobre o modelo da linguagem.

### Regra simplificada de borrowing — ✅ FONTE PRIMÁRIA

- em um dado momento pode existir **uma referência mutável**;
- **ou** qualquer número de referências imutáveis;
- referências devem sempre ser válidas.

Fonte: https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html

Para o slide, é correto resumir como `VÁRIOS LEITORES / OU / UM ESCRITOR`, desde que apresentado como **regra simplificada**.

### Lifetimes evitam dangling references — ✅ FONTE PRIMÁRIA

Fonte: https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html

Formulação segura: **lifetimes permitem ao compilador verificar relações entre a validade das referências e impedir usos que criariam referências pendentes.**

**Não dizer:** "lifetime faz o objeto viver mais". Isso é incorreto.

---

## 4. Diagnósticos Rust que podem ser usados nos slides

Todos vindos de exemplos da documentação oficial atual.

### Referência que vive mais que o dado — ✅ FONTE PRIMÁRIA

```rust
fn main() {
    let r;

    {
        let x = 5;
        r = &x;
    }

    println!("r: {r}");
}
```

```text
error[E0597]: `x` does not live long enough
```

Fonte: https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html

### Duas referências mutáveis simultâneas — ✅ FONTE PRIMÁRIA

```text
error[E0499]: cannot borrow `s` as mutable more than once at a time
```

Fonte: https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html

### Referência mutável enquanto imutáveis continuam vivas — ✅ FONTE PRIMÁRIA

```text
error[E0502]: cannot borrow `s` as mutable because it is also borrowed as immutable
```

### `Rc<Mutex<T>>` enviado entre threads — ✅ FONTE PRIMÁRIA

```text
error[E0277]: `Rc<std::sync::Mutex<i32>>` cannot be sent between threads safely
```

`Rc` não implementa `Send`. Fonte: https://doc.rust-lang.org/book/ch16-03-shared-state.html

**Observação:** se o slide usar outro código, não copiar linha/coluna do diagnóstico oficial como se pertencesse ao código novo.

---

## 5. Threads e data races

### ✅ FONTE PRIMÁRIA

O Rust Book afirma que ownership e o type system transformam vários erros de concorrência em erros de compilação, e que as restrições sobre referências ajudam a impedir **data races em compile time**.

Fontes:
- https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html
- https://doc.rust-lang.org/book/ch16-00-concurrency.html
- https://doc.rust-lang.org/book/ch16-04-extensible-concurrency-sync-and-send.html

Seguro dizer: **Rust impede várias classes de acessos concorrentes inseguros através do sistema de tipos, ownership, `Send` e `Sync`.**

**Não dizer:** "Rust impede qualquer race condition". Falso — `data race` e `race condition` não são sinônimos.

---

## 6. C: use-after-free

```c
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int *p = malloc(sizeof *p);
    *p = 42;

    free(p);

    printf("%d\n", *p);
    return 0;
}
```

### ✅ VALIDADO DIRETAMENTE

```bash
clang -O1 -g -fsanitize=address uaf.c -o uaf
```

A execução resultou em status diferente de zero e o AddressSanitizer reportou:

```text
ERROR: AddressSanitizer: heap-use-after-free
READ of size 4
SUMMARY: AddressSanitizer: heap-use-after-free
```

Formulação correta: *depois de `free(p)`, usar `*p` é acesso a um objeto cujo lifetime terminou; esse tipo de acesso é comportamento indefinido em C.*

O valor impresso **não deve ser tratado como previsível**.

---

## 7. Rust: trait estático e `dyn Trait` — ✅ FONTE PRIMÁRIA

```rust
trait Operacao {
    fn calcular(&self, x: i32) -> i32;
}

fn executar<T: Operacao>(op: &T, x: i32) -> i32 { op.calcular(x) }

fn executar_dyn(op: &dyn Operacao, x: i32) -> i32 { op.calcular(x) }
```

Fontes:
- https://doc.rust-lang.org/book/ch18-02-trait-objects.html
- https://doc.rust-lang.org/stable/reference/types/trait-object.html
- https://doc.rust-lang.org/stable/reference/items/traits.html

**Conclusão segura:** o mesmo trait e o mesmo `impl` podem ser usados com static dispatch via generics ou com dynamic dispatch via `dyn Trait`, desde que o trait seja dyn-compatible.

### Static dispatch

Generics são **monomorfizados**: o compilador produz implementações não genéricas para os tipos concretos usados.

Formulação segura: *"com `T: Trait`, o tipo concreto é conhecido na compilação, o código pode ser monomorfizado e a chamada **pode** ser inlinada."* — "pode", não "sempre será".

### Dynamic dispatch

Um ponteiro para trait object (`&dyn Operacao`) inclui conceitualmente: (1) ponteiro para a instância; (2) ponteiro para uma vtable. A chamada de método realiza despacho virtual em runtime.

Fontes: https://doc.rust-lang.org/stable/reference/types/trait-object.html · https://doc.rust-lang.org/std/keyword.dyn.html

---

## 8. Rust não possui o modelo tradicional de classes/herança — ✅ FONTE PRIMÁRIA

- structs/enums guardam dados;
- blocos `impl` fornecem métodos;
- não há herança de structs/classes como mecanismo do sistema de tipos;
- traits, generics e trait objects fornecem o polimorfismo.

Fonte: https://doc.rust-lang.org/stable/book/ch18-01-what-is-oo.html

Formulação preferida: **Rust não possui uma construção de classe com herança tradicional; normalmente separa dados (`struct`), implementação (`impl`) e comportamento compartilhado (`trait`).** É melhor do que "Rust não é orientado a objetos", porque a própria documentação diz que a classificação depende da definição adotada.

---

## 9. C++: mesma classe concreta em static e dynamic dispatch

```cpp
class Operacao {
public:
    virtual int calcular(int x) const = 0;
    virtual ~Operacao() = default;
};

class Dobro final : public Operacao {
public:
    int calcular(int x) const override { return x * 2; }
};

template <typename T>
int executar_statico_impl(const T& op, int x) { return op.calcular(x); }

extern "C" int executar_statico(const Dobro& op, int x) {
    return executar_statico_impl(op, x);
}

extern "C" int executar_dinamico(const Operacao& op, int x) {
    return op.calcular(x);
}
```

### ✅ VALIDADO DIRETAMENTE

```bash
clang++ -O3 -std=c++20 -S -masm=intel dispatch.cpp
```

**Static dispatch observado:**

```asm
executar_statico:
    lea eax, [rsi + rsi]
    ret
```

A chamada de `calcular()` desapareceu: o compilador conhecia `Dobro` e inlinou `x * 2`.

**Dynamic dispatch observado:**

```asm
executar_dinamico:
    mov rax, qword ptr [rdi]
    mov rax, qword ptr [rax]
    jmp rax
```

Chamada indireta através da vtable.

**Conclusão validada:** a mesma classe concreta `Dobro` participou dos dois modelos. **Não é necessário criar duas classes `Dobro`.** O que muda é o mecanismo no ponto de abstração: `template / concept` → static polymorphism; `base class + virtual` → dynamic polymorphism.

---

## 10. C++20 `concept` + `virtual` com a mesma classe

```cpp
template <typename T>
concept OperacaoEstatica = requires(const T& op, int x) {
    { op.calcular(x) } -> std::same_as<int>;
};

template <OperacaoEstatica T>
int executar_statico_impl(const T& op, int x) { return op.calcular(x); }
```

### ✅ VALIDADO DIRETAMENTE

Compilou com `clang++ -O3 -std=c++20`; o wrapper concreto de `Dobro` produziu novamente `lea eax, [rsi + rsi]; ret`, enquanto o wrapper via `Operacao&` produziu vtable dispatch.

### Nuance importante para o slide

C++ **não obriga** você a escrever um `concept` para ter static dispatch. Isto já funciona:

```cpp
template <typename T>
int executar(const T& op, int x) { return op.calcular(x); }
```

O `concept` é usado quando você quer **formalizar/restringir o contrato em compile time**.

Frase correta: **em C++, static polymorphism e dynamic polymorphism são mecanismos distintos. Uma mesma classe pode participar dos dois; se quiser formalizar explicitamente o mesmo contrato nos dois mundos, pode acabar expressando-o uma vez como base virtual e outra como concept.**

**Não dizer:** "C++ precisa de duas classes iguais". Falso.

---

## 11. Comparação Rust vs C++ para o slide de interfaces — ✅ FORMULAÇÃO VALIDADA

```text
Rust
  trait Operacao
        ├── T: Operacao / impl Operacao  -> static dispatch
        └── dyn Operacao                 -> dynamic dispatch

C++
  template/concept       -> static polymorphism
  abstract base/virtual  -> dynamic polymorphism
```

**Rust reutiliza o mesmo trait como contrato para os dois modelos; C++ oferece mecanismos separados para o polimorfismo estático e o dinâmico.** Tecnicamente defensável.

---

## 12. Java: interface gera `invokeinterface`

```java
interface Operacao { int calcular(int x); }

final class Dobro implements Operacao {
    public int calcular(int x) { return x * 2; }
}

public class Dispatch {
    static int executar(Operacao op, int x) { return op.calcular(x); }
}
```

### ✅ VALIDADO DIRETAMENTE

Compilado com `javac 21.0.11`; `javap -c -p Dispatch.class` produziu:

```text
static int executar(Operacao, int);
  Code:
     0: aload_0
     1: iload_1
     2: invokeinterface #7,  2
     7: ireturn
```

Fonte primária da especificação: https://docs.oracle.com/javase/specs/

---

## 13. Java/HotSpot: o JIT pode inlinear uma chamada de interface

### ✅ VALIDADO DIRETAMENTE

```bash
java -Xbatch -XX:+UnlockDiagnosticVMOptions \
  -XX:+PrintCompilation -XX:+PrintInlining DispatchBench
```

A saída do JIT incluiu:

```text
DispatchBench::executar
  @ 2 DobroBench::calcular (4 bytes) inline

  @ 2 DobroBench::calcular (4 bytes) inline (hot)
  \-> TypeProfile (5119/5119 counts) = DobroBench
```

Também foi observada a inlining de `executar` dentro do loop chamador.

**Conclusão validada:** uma chamada que aparece como `invokeinterface` no bytecode pode ser observada pelo HotSpot e inlinada pelo JIT quando o perfil de tipos permite.

**Não dizer:** "toda chamada de interface em Java vira chamada direta". Falso.

---

## 14. Backup D — C/C++: abstração funcional genérica vs loop imperativo

### 14.1 C++ imperativo

```cpp
extern "C"
std::uint64_t pontuacao(std::span<const std::uint32_t> numeros,
                        std::uint32_t limite) {
    std::uint64_t soma = 0;
    for (std::size_t i = 0; i < numeros.size(); ++i) {
        if (numeros[i] >= limite) {
            soma += (i + 1) * static_cast<std::uint64_t>(numeros[i]);
        }
    }
    return soma;
}
```

### 14.2 C++ abstrato com template + lambda

```cpp
template<class Acc, class F>
Acc fold_indexed(std::span<const std::uint32_t> xs, Acc init, F f) {
    for (std::size_t i = 0; i < xs.size(); ++i) init = f(init, i, xs[i]);
    return init;
}

extern "C"
std::uint64_t pontuacao(std::span<const std::uint32_t> numeros,
                        std::uint32_t limite) {
    return fold_indexed(numeros, std::uint64_t{0},
        [=](std::uint64_t soma, std::size_t i, std::uint32_t n) {
            return soma + (n >= limite
                ? (i + 1) * static_cast<std::uint64_t>(n)
                : 0);
        });
}
```

### ✅ VALIDADO DIRETAMENTE — `clang++ 17.0.0 -O3 -std=c++20`

Seção `.text` extraída de cada `.o`:

| versão | `.text` | SHA-256 | instruções |
|---|---:|---|---:|
| imperativo | 191 bytes | `164c082acaf13de0bfd5ca40056c868ca90246173dbead879b793cbf137fc1d8` | 62 |
| template + lambda | 191 bytes | `164c082acaf13de0bfd5ca40056c868ca90246173dbead879b793cbf137fc1d8` | 62 |

Comparação binária: **IDENTICAL**.

**Conclusão validada:** neste exemplo com Clang 17 `-O3`, a abstração `fold_indexed` + template + lambda foi completamente eliminada e produziu uma seção `.text` byte por byte idêntica à versão imperativa.

---

## 15. Backup D — C++ `std::views`

```cpp
auto pipeline =
    std::views::iota(std::size_t{0}, numeros.size())
    | std::views::filter([&](std::size_t i) { return numeros[i] >= limite; })
    | std::views::transform([&](std::size_t i) {
          return (i + 1) * static_cast<std::uint64_t>(numeros[i]);
      });

return std::accumulate(pipeline.begin(), pipeline.end(), std::uint64_t{0});
```

### ✅ VALIDADO DIRETAMENTE — mesmo compilador e flags

```text
.text:      119 bytes
SHA-256:    ecd9de25b869ed9cb51265c41632da2a867495ed949511fcd2669c7514146ad0
instruções: 39
comparação com o loop imperativo: DIFFERENT
```

Não havia chamadas de função (`call`) no corpo resultante: a maquinaria de ranges foi inlinada/eliminada, mas a estrutura final do loop foi diferente.

**Conclusão validada:** neste exemplo, `std::views` não deixou chamadas de abstração no corpo final, mas levou o Clang 17 a uma estratégia de otimização diferente da versão imperativa.

**Não concluir** que 119 bytes é mais rápido, que 191 bytes é mais rápido, ou que ranges "são lentos". O experimento prova apenas que **o binário não ficou idêntico** e que a estratégia final diferiu.

---

## 16. Backup D — C também reproduz o mesmo caso

### ✅ VALIDADO DIRETAMENTE — `clang 17.0.0 -O3`

| versão | `.text` | SHA-256 |
|---|---:|---|
| C imperativo | 191 bytes | `164c082acaf13de0bfd5ca40056c868ca90246173dbead879b793cbf137fc1d8` |
| C abstrato / fold | 191 bytes | `164c082acaf13de0bfd5ca40056c868ca90246173dbead879b793cbf137fc1d8` |

E também: `C imperativo == C++ imperativo`, byte por byte na seção `.text`.

---

## 17. Backup D — parte Rust do experimento funcional

### ⚠️ NÃO VALIDADO NESTE AMBIENTE

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

O roteiro anterior afirmava que o corpo de assembly ficou idêntico ao C/C++ no cenário testado. **Essa função não pôde ser recompilada no ambiente de validação porque `rustc` não estava instalado.**

**Formulação recomendada:** *"em um experimento anterior com `rustc`, este pipeline Rust foi reportado como convergindo para o mesmo corpo de assembly do loop C/C++"* — ou refazer a compilação em Godbolt antes de chamar isso de resultado deste pacote.

**NÃO escrever:** "este pacote reproduziu o assembly Rust e confirmou byte a byte". Isso não aconteceu.

---

## 18. Backup E — AVX2: correção importante

### ⚠️ O NÚMERO 51 NÃO FOI REPRODUZIDO

O roteiro anterior continha "Rust: 51 ocorrências de `ymm` / C: 51 / C++: 51". Com o **Clang 17.0.0** do ambiente de validação, usando `-O3 -mavx2` nas versões imperativas C e C++, foi observado:

```text
C:    67 linhas de assembly contendo "ymm"  ·  163 ocorrências textuais de ymmN
C++:  67 linhas de assembly contendo "ymm"  ·  163 ocorrências textuais de ymmN

.text (C e C++): 730 bytes
SHA-256:         804e99c18caecb8390f3f06c0a42b0cd0a6d651c3ae8b0f5dcd0dee349811fac
comparação:      C AVX2 == C++ AVX2, byte por byte
```

**Não usar "51 `ymm`" como número universal.** A contagem depende de versão do compilador, código exato, flags, forma de contar, backend e target.

Formulação segura: **"com AVX2 habilitado, as versões C e C++ deste experimento foram vetorizadas e produziram `.text` idêntico."**

A parte Rust do AVX2 **não foi recompilada**.

---

## 19. O que pode ser tratado como verdade sem nova validação

### ✅ Rust

1. Ownership é central ao modelo e permite garantias de memory safety sem GC obrigatório.
2. A regra simplificada de borrowing é "uma referência mutável OU múltiplas imutáveis".
3. Referências devem permanecer válidas.
4. Lifetimes ajudam o compilador a impedir dangling references.
5. O sistema de tipos/ownership impede várias data races em compile time.
6. Generics + trait bounds usam static dispatch/monomorfização.
7. `dyn Trait` usa dynamic dispatch.
8. Um trait object é acessado por um ponteiro que carrega informação para os dados e para uma vtable.
9. O mesmo trait pode ser usado nos dois modelos se for dyn-compatible.
10. Rust não possui herança tradicional de classes/structs.

### ✅ C

1. O exemplo `free(p); ... *p` é heap-use-after-free.
2. O AddressSanitizer detectou o acesso diretamente.
3. No experimento `pontuacao`, C imperativo e C com `fold` geraram `.text` idêntico com Clang 17 `-O3`.

### ✅ C++

1. A mesma classe concreta pode participar de static e dynamic polymorphism.
2. Template/concept e `virtual` são mecanismos diferentes.
3. No exemplo `Dobro`, static dispatch foi reduzido a `lea ...; ret`.
4. No wrapper dinâmico, foi observada indireção via vtable.
5. No Backup D, template + lambda produziu `.text` byte por byte idêntico ao loop.
6. A pipeline com `std::views` produziu binário diferente nesse compilador.
7. Não é correto dizer que C++ exige duas classes idênticas para ter os dois tipos de dispatch.

### ✅ Java

1. A chamada por `interface` compilou para `invokeinterface` no bytecode Java 21.
2. No HotSpot 21, uma chamada monomórfica de interface foi observada sendo inlinada pelo JIT.
3. Não é correto comparar apenas o bytecode Java com assembly AOT de Rust/C++ e concluir performance.

---

## 20. O que NÃO deve ser tratado como validado por este pacote

1. Que a versão Rust funcional do Backup D gerou exatamente o mesmo `.text` que C/C++.
2. Que "Rust, C e C++ sempre geram o mesmo assembly".
3. Que "51 ocorrências de `ymm`" é um número válido para qualquer compilador/versão.
4. Que dynamic dispatch nunca pode ser devirtualizado por nenhum compilador.
5. Que toda abstração de Rust ou C++ é automaticamente zero-cost.
6. Que menor `.text` implica maior performance.
7. Que C++ precisa de duas classes para static e dynamic polymorphism.
8. Que Rust impede todas as race conditions.
9. Que lifetimes aumentam a duração dos objetos.
10. Que Keith é mascote oficial do C++.

---

## 21. Frases prontas tecnicamente seguras

**Ownership** — "Rust usa ownership e borrowing para fazer várias garantias de segurança de memória em compilação, sem depender de um garbage collector."

**Borrowing** — "A regra simplificada é: vários leitores ou um escritor."

**Lifetimes** — "Lifetimes permitem ao compilador verificar que uma referência não continue sendo usada depois que o dado referenciado deixou de ser válido."

**Traits** — "Em Rust, o mesmo trait pode servir a static dispatch via generics e a dynamic dispatch via `dyn Trait`."

**C++** — "C++ também suporta os dois modelos, mas usa mecanismos diferentes: templates/concepts para o estático e `virtual` para o dinâmico."

**Java** — "Java emite `invokeinterface` no bytecode, mas o JIT pode otimizar e até inlinear chamadas quando o perfil de runtime permite."

**Abstrações** — "Zero-cost não quer dizer que toda abstração sempre gera o mesmo assembly; quer dizer que abstrações podem ser eliminadas pelo compilador e isso deve ser medido caso a caso."

**Backup D C++** — "Neste exemplo com Clang 17 `-O3`, o template com lambda gerou `.text` byte por byte idêntico ao loop imperativo."

**`std::views`** — "Neste mesmo exemplo, a pipeline com `std::views` foi totalmente inlinada, mas levou o compilador a gerar uma estrutura de loop diferente."

---

## 22. Evidências diretas resumidas

```text
C use-after-free:
  AddressSanitizer -> heap-use-after-free

C++ static dispatch:
  lea eax, [rsi + rsi]
  ret

C++ dynamic dispatch:
  mov rax, [rdi]
  mov rax, [rax]
  jmp rax

Java bytecode:
  invokeinterface

HotSpot JIT:
  DobroBench::calcular (...) inline (hot)
  TypeProfile (...) = DobroBench

C++ imperative .text:        191 bytes  SHA256 164c082a…37fc1d8
C++ template+lambda .text:   191 bytes  SHA256 164c082a…37fc1d8
C++ std::views .text:        119 bytes  SHA256 ecd9de25…14146ad0
C imperative .text:          191 bytes  SHA256 164c082a…37fc1d8
C fold .text:                191 bytes  SHA256 164c082a…37fc1d8
C/C++ AVX2 imperative .text: 730 bytes  SHA256 804e99c1…49811fac
```

---

## 23. Fontes primárias principais

**Rust**

- https://rust-lang.org/
- Ownership: https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html
- Borrowing: https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html
- Lifetimes: https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html
- Concurrency: https://doc.rust-lang.org/book/ch16-00-concurrency.html
- Shared-state concurrency: https://doc.rust-lang.org/book/ch16-03-shared-state.html
- `Send` / `Sync`: https://doc.rust-lang.org/book/ch16-04-extensible-concurrency-sync-and-send.html
- OO / herança: https://doc.rust-lang.org/stable/book/ch18-01-what-is-oo.html
- Trait objects: https://doc.rust-lang.org/book/ch18-02-trait-objects.html
- Representação de trait object: https://doc.rust-lang.org/stable/reference/types/trait-object.html
- Dyn compatibility: https://doc.rust-lang.org/stable/reference/items/traits.html

**C++** — https://en.cppreference.com/w/cpp/language/virtual · templates · constraints · memory

**Java** — JVM Specification: https://docs.oracle.com/javase/specs/

---

## 24. Recomendação final

Para os slides principais, usar sem medo:

```text
Rust:
  trait -> generic = static
  trait -> dyn     = dynamic

C++:
  template/concept = static
  virtual          = dynamic

Java:
  interface -> invokeinterface
            -> JIT pode otimizar depois
```

Para o Backup D, os números **C e C++** deste arquivo foram validados diretamente.

Para qualquer comparação **binária Rust vs C/C++**, recompilar Rust antes de usar as palavras "idêntico", "byte por byte" ou "mesmo SHA-256".

A parte conceitual de Rust sobre monomorfização, trait objects e vtables pode ser tratada como verdade porque foi conferida na documentação oficial atual.
