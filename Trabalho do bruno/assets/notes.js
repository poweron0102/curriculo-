/* ==========================================================================
   Notas do apresentador — melhor_linguagem v0.1.0
   Fonte: roteiro_rust_apresentacao_v2.md + validacao_tecnica_rust_apresentacao.md
   lvl: 'direct' = validado diretamente | 'source' = fonte primária | 'unval' = não validado
   ========================================================================== */
window.DECK_NOTES = {

c1: {
  notes: [
    'Abrir estabelecendo o tom: <b>"Hoje eu vou explicar por que Rust é objetivamente a melhor linguagem de programação."</b>',
    'Depois: <b>"Por respeito histórico, C vai continuar sendo chamado de C. C++ será chamado pelo nome tecnicamente correto durante esta apresentação: Rust--."</b>',
    'Explicar rapidamente que a apresentação é provocativa, mas que <b>as comparações técnicas serão reais</b>.',
    'O asterisco do título é a piada: <code>*fonte: minha opinião</code>. Não precisa explicar.'
  ],
  jokes: [
    '"Rust--" é piada recorrente, não em toda frase. Depois deste slide ela vive no rodapé.',
    'Evitar atacar C: tratar C como excelente para o propósito para o qual foi criada.'
  ],
  avoid: [ 'Não prometer que a apresentação é imparcial — ela não é, e a piada depende disso.' ],
  evidence: []
},

c2: {
  notes: [
    'Ferris é o caranguejo associado à comunidade Rust — <b>mascote não oficial</b>, e é assim que a própria comunidade o descreve.',
    'Introduzir Keith: <b>"C++ oficialmente não possui esse rato como mascote. A internet, entretanto, achou que ele combinava."</b>',
    'Deixar explícito que Keith é <b>meme</b>, não informação oficial sobre a linguagem.',
    'A arte do Keith é 325×185 exibida em 2× — o serrote é proposital.'
  ],
  jokes: [
    '"Rust tem um caranguejo simpático. C++ não tem mascote oficial… mas a internet decidiu que ele merecia um rato sem uma perna."',
    { t: '"Eu não vou tirar nenhuma conclusão sobre a qualidade das linguagens baseado exclusivamente nos mascotes. Vocês podem."', opt: true }
  ],
  avoid: [ 'Não apresentar Keith como fato institucional sobre C++.' ],
  evidence: [
    { lvl: 'source', t: 'rust-lang.org/learn/get-started afirma que Ferris é o mascote <b>não oficial</b> da comunidade.' },
    { lvl: 'source', t: 'Keith aparece como "unofficial mascot" em páginas de humor (programmerhumor.io, newgrounds) — meme, não mascote oficial.' }
  ]
},

c3: {
  notes: [
    'A ideia <b>não</b> é dizer que Rust "é Python com chaves". A comparação é de <b>legibilidade e ergonomia</b>.',
    'Apontar: inferência de tipos, iteradores, <code>enumerate</code>, interpolação no <code>println!</code>, sintaxe compacta.',
    '<code>.iter()</code> cria um iterador sobre a coleção; <code>.enumerate()</code> adiciona o índice; <code>(idx, numero)</code> desempacota os dois valores.',
    'Deixar o Java e o C++ falarem por si — não precisa ridicularizar, o contraste de linhas já faz o trabalho.'
  ],
  jokes: [
    '"Rust é quase Python, se Python tivesse <code>{}</code> e quisesse conversar diretamente com a CPU."',
    'Na versão C++: "O <code>std::</code> está ali para lembrar que você está programando em Rust--."'
  ],
  avoid: [ 'Não dizer literalmente que a gramática de Rust é semelhante à de Python.' ],
  evidence: []
},

c4a: {
  notes: [
    '<b>"Em Rust, recursos possuem um dono. Quando esse dono sai de escopo, o recurso pode ser liberado automaticamente."</b>',
    'Isso permite gerenciar memória <b>sem precisar de garbage collector</b> para esse modelo de propriedade.',
    'Este é o capítulo central: 70 s no total para ownership + borrowing + lifetimes. Não se demorar aqui.'
  ],
  jokes: [ '"Todo recurso tem um responsável pela sua existência. Como um projeto de faculdade."' ],
  avoid: [
    'Não dizer que Rust proíbe qualquer mecanismo de GC em biblioteca — a afirmação é sobre o modelo da linguagem.'
  ],
  evidence: [
    { lvl: 'source', t: 'Rust Book ch04-00: ownership permite garantias de memory safety sem precisar de garbage collector.' }
  ]
},

c4b: {
  notes: [
    '<b>"Uma função frequentemente precisa apenas consultar uma coleção, sem se tornar dona dela."</b>',
    '<code>&[i32]</code> = acesso emprestado somente leitura. <code>&mut [i32]</code> = acesso mutável exclusivo.',
    '<b>"A intuição é parecida com vários leitores simultâneos ou um escritor exclusivo."</b>',
    'Apresentar a regra sempre como <b>regra simplificada</b> de borrowing. E acrescentar: referências devem sempre ser válidas.',
    'O erro E0499 é o que acontece quando você tenta dois escritores — mostrar e seguir, sem ler linha por linha.'
  ],
  jokes: [
    '"C pergunta: <i>você sabe o que está fazendo?</i>" — pausa — "Rust pergunta: <i>você consegue provar?</i>"'
  ],
  avoid: [ 'Evitar analogia de videogame; manter exemplos dentro de programação.' ],
  evidence: [
    { lvl: 'source', t: 'Rust Book ch04-02: uma referência mutável OU qualquer número de imutáveis; referências devem ser sempre válidas.' },
    { lvl: 'source', t: 'E0499 "cannot borrow `s` as mutable more than once at a time" — exemplo do Rust Book ch04-02.' }
  ]
},

c4c: {
  notes: [
    '<b>"Lifetimes permitem que o compilador verifique relações entre a validade de referências."</b>',
    'No diagrama: primeiro caso, a referência vive <b>dentro</b> da vida do objeto — aceito.',
    'Segundo caso, a referência ultrapassa o fim do objeto — o compilador recusa com <b>E0597</b>.',
    'O código na esquerda é o exemplo do próprio Rust Book: <code>r</code> declarado fora, <code>x</code> criado num escopo interno.'
  ],
  jokes: [ '"O borrow checker não te odeia. Ele só quer ver documentação."' ],
  avoid: [ '<b>Não dizer que lifetimes fazem objetos viverem mais tempo.</b> Isso é incorreto.' ],
  evidence: [
    { lvl: 'source', t: 'Rust Book ch10-03: lifetimes impedem dangling references; E0597 "`x` does not live long enough".' }
  ]
},

c5: {
  notes: [
    'Explicar que o ponteiro continua armazenando um endereço depois do <code>free</code>, mas aquele objeto já deixou de existir.',
    'O acesso seguinte é <b>use-after-free</b> e resulta em comportamento indefinido.',
    'A formulação correta: "depois de <code>free(p)</code>, usar <code>*p</code> é acesso a um objeto cujo lifetime terminou".',
    'O valor impresso <b>não deve ser tratado como previsível</b>.',
    'Não transformar isso em "C é ruim": <b>"C está fazendo exatamente o que prometeu: oferecer controle muito direto sobre memória."</b>',
    'Mencionar que C++ moderno tem ferramentas melhores: RAII, <code>unique_ptr</code>, <code>shared_ptr</code>, containers seguros.',
    'A diferença a destacar: Rust coloca várias dessas restrições dentro do <b>ownership</b> e do <b>sistema de tipos</b>.'
  ],
  jokes: [
    '"Em C, você pediu. Ele fez."',
    '"C respeita sua liberdade, inclusive a liberdade de destruir o próprio programa."',
    { t: 'Para C++: "Rust-- possui várias ferramentas modernas para evitar isso. É importante reconhecer que ele evoluiu desde a época dos dinossauros."', opt: true }
  ],
  avoid: [
    'Não dizer "o compilador não emitiu nenhum aviso" — isso não foi validado. Dizer: <b>"o programa compilou; o problema apareceu na execução."</b>'
  ],
  evidence: [
    { lvl: 'direct', t: 'clang 17.0.0 <code>-O1 -g -fsanitize=address</code>: execução retornou status ≠ 0 e o AddressSanitizer reportou <code>heap-use-after-free / READ of size 4</code>.' }
  ]
},

c6: {
  notes: [
    '<b>"Uma thread é uma linha de execução acontecendo em paralelo ou concorrentemente com outra."</b>',
    'Uma data race pode ocorrer quando acessos concorrentes ao mesmo estado acontecem sem a sincronização apropriada.',
    'Conectar com borrowing: <b>"aquela regra de vários leitores ou um escritor fica especialmente importante com várias threads."</b>',
    'O erro E0277 é sobre <code>Rc</code> não implementar <code>Send</code>. A correção é <code>Arc&lt;Mutex&lt;T&gt;&gt;</code>.',
    'O ponto: o sistema de tipos e ownership impedem <b>várias classes</b> de acesso concorrente inseguro ainda em compilação.'
  ],
  jokes: [
    '"O compilador já não confiava em você com uma thread. Imagine com oito."',
    '"Rust permite concorrência sem exigir que você ofereça um sacrifício ao debugger."'
  ],
  avoid: [
    'Não dizer que Rust torna todo programa concorrente automaticamente correto.',
    '<b>Não dizer que Rust impede qualquer race condition.</b> <code>data race</code> e <code>race condition</code> não são sinônimos.'
  ],
  evidence: [
    { lvl: 'source', t: 'Rust Book ch16-03: E0277 "`Rc&lt;Mutex&lt;i32&gt;&gt;` cannot be sent between threads safely" — <code>Rc</code> não implementa <code>Send</code>.' },
    { lvl: 'source', t: 'Rust Book ch04-02 / ch16-00 / ch16-04: ownership, tipos, <code>Send</code> e <code>Sync</code> transformam várias classes de erro de concorrência em erro de compilação.' }
  ]
},

c7a: {
  notes: [
    '<b>"Rust nem sequer tem classes no sentido tradicional. Ele separa dados, comportamento e implementação."</b>',
    'Mostrar rapidamente: <code>struct</code> = dados · <code>trait</code> = comportamento · <code>impl</code> = implementação.',
    'Este capítulo tem 70 s e sete telas — cada tela é um bloco de ~10 s. Ritmo rápido.'
  ],
  jokes: [
    '"Rust decidiu que talvez orientação a objetos não precisasse começar montando uma árvore genealógica."',
    { t: '"Rust prefere implementar comportamentos a herdar problemas." (só como piada, não como afirmação de que herança é sempre ruim)', opt: true }
  ],
  avoid: [
    'Preferir "Rust não possui construção de classe com herança tradicional" a "Rust não é orientado a objetos" — a própria documentação diz que a classificação depende da definição adotada.'
  ],
  evidence: [
    { lvl: 'source', t: 'Rust Book ch18-01: structs/enums guardam dados, <code>impl</code> fornece métodos, não há herança de classes; traits/generics/trait objects fazem o polimorfismo.' }
  ]
},

c7b: {
  notes: [
    '<b>"Em Rust eu defino <code>Operacao</code> uma vez. Depois, quem usa essa interface decide se quer static dispatch ou dynamic dispatch."</b>',
    'Enfatizar: a mesma <code>struct</code>, o mesmo <code>trait</code> e o mesmo <code>impl</code> servem aos dois modelos.',
    'A ressalva técnica: isso vale para dynamic dispatch <b>se o trait for dyn-compatible</b>.'
  ],
  jokes: [ '"Rust pergunta: como você quer usar essa interface?"' ],
  avoid: [],
  evidence: [
    { lvl: 'source', t: 'Rust Book ch18-02 + Reference (trait objects, dyn compatibility): o mesmo trait e o mesmo <code>impl</code> servem a generics e a <code>dyn Trait</code>.' }
  ]
},

c7c: {
  notes: [
    '<b>"O compilador conhece o tipo concreto. Ele pode gerar uma versão específica da função para aquele tipo — isso é monomorfização — e pode até inlinar o método."</b>',
    '<code>&impl Operacao</code> é açúcar para o mesmo mecanismo de trait bound.',
    'Insistir no "pode": <b>"pode ser inlinada", não "sempre será"</b>.'
  ],
  jokes: [ '"O compilador escreve a função de novo pra cada tipo. De graça. Sem reclamar."' ],
  avoid: [ 'Não afirmar que static dispatch sempre resulta em inlining.' ],
  evidence: [
    { lvl: 'source', t: 'Rust Book ch18-02: generics são monomorfizados — o compilador produz implementações não genéricas para os tipos concretos usados.' }
  ]
},

c7d: {
  notes: [
    '<b>"Com <code>dyn Operacao</code> eu estou dizendo explicitamente que quero trabalhar através de uma interface em runtime. Aí existe um trait object e normalmente uma vtable."</b>',
    'O ponteiro para trait object carrega conceitualmente dois ponteiros: um para a instância, um para a vtable.',
    'Fechar o argumento central do capítulo: <b>a escolha do custo acontece no ponto de uso</b>.'
  ],
  jokes: [ '"Em Rust, você escolhe o custo no ponto de uso. Em Rust-- você primeiro escolhe qual mecanismo de metaprogramação quer sofrer."' ],
  avoid: [ 'Não afirmar que dynamic dispatch nunca pode ser devirtualizado por nenhum compilador.' ],
  evidence: [
    { lvl: 'source', t: 'Rust Reference (types/trait-object) e <code>std::keyword.dyn</code>: dois ponteiros — instância e vtable — com despacho virtual em runtime.' }
  ]
},

c7e: {
  notes: [
    'Fazer esta comparação com <b>bastante precisão</b>: "C++ também suporta os dois mundos, e a mesma classe concreta pode participar dos dois."',
    'A diferença: o contrato estático e o contrato dinâmico são <b>mecanismos diferentes</b> — templates/concepts de um lado, herança virtual do outro.',
    'O <code>concept</code> é <b>opcional</b>: template sozinho já dá static dispatch. O concept serve para formalizar/restringir o contrato em compile time.',
    'Formulação correta: <b>"C++ frequentemente precisa expressar a mesma ideia de interface por dois mecanismos diferentes se quiser formalizar os dois contratos."</b>'
  ],
  jokes: [ '"Rust-- pergunta: qual das duas interfaces você quis dizer?"' ],
  avoid: [
    '<b>NÃO dizer "C++ precisa de duas classes".</b> Isso é falso — a mesma <code>Dobro</code> participou dos dois modelos no experimento.'
  ],
  evidence: [
    { lvl: 'direct', t: 'clang++ 17.0.0 <code>-O3 -std=c++20</code>: a mesma classe <code>Dobro</code> participou de static e dynamic dispatch; o wrapper estático virou <code>lea eax, [rsi+rsi]; ret</code> e o dinâmico usou a vtable.' }
  ]
},

c7f: {
  notes: [
    '<b>"Java trabalha naturalmente com despacho dinâmico por interfaces. Mas o JIT pode observar os tipos que realmente aparecem durante a execução e devirtualizar chamadas quando consegue provar que isso é seguro."</b>',
    'Não comparar assembly Java diretamente com Rust/C++: Java passa por bytecode → JVM → JIT → assembly, enquanto Rust e C++ são compilados ahead-of-time.',
    'O <code>TypeProfile (5119/5119)</code> é a prova de que o JIT viu um único tipo concreto e agiu sobre isso.'
  ],
  jokes: [ '"Java não sabe o tipo em compilação. Mas ele descobre em produção, o que é uma estratégia."' ],
  avoid: [
    '<b>Não dizer "toda chamada de interface em Java vira chamada direta".</b> Isso é falso.',
    'Não concluir performance comparando bytecode Java com assembly AOT.'
  ],
  evidence: [
    { lvl: 'direct', t: 'javac 21.0.11 + <code>javap -c -p</code>: a chamada por interface compilou para <code>invokeinterface</code>.' },
    { lvl: 'direct', t: 'OpenJDK/HotSpot 21.0.11 com <code>-Xbatch -XX:+PrintInlining</code>: <code>DobroBench::calcular (4 bytes) inline (hot)</code> e <code>TypeProfile (5119/5119) = DobroBench</code>.' }
  ]
},

c7g: {
  notes: [
    'Ler a tabela na diagonal, não célula por célula. O ponto é a linha "momento da decisão".',
    'Fechar com a frase grande: <b>"Rust separa o comportamento da forma de despachá-lo."</b>',
    'Se alguém perguntar "quanto custa isso em instruções?", descer com <kbd>↓</kbd> para a reserva F.'
  ],
  jokes: [],
  avoid: [ 'A célula de Java em static dispatch é "não é o modelo equivalente principal" — não é "Java não tem static dispatch".' ],
  evidence: [
    { lvl: 'source', t: 'Formulação conferida contra a documentação de Rust, C++ (cppreference) e a JVM Spec.' }
  ]
},

c8a: {
  notes: [
    'Antes da piada final, fazer a ressalva: <b>"Obviamente Rust não é a melhor ferramenta para absolutamente todo problema."</b>',
    'Reconhecer: C é simples, ubíquo e importante; C++ tem décadas de ecossistema; Rust tem curva de aprendizado real; ownership e borrowing são difíceis no começo.',
    'Depois: <b>"Mas quando queremos controle de baixo nível, desempenho e segurança de memória sem depender de garbage collector, Rust apresenta um argumento muito forte."</b>'
  ],
  jokes: [
    { t: '"O borrow checker pode impedir seus bugs e, ocasionalmente, impedir você de programar até explicar o que está fazendo."', opt: true }
  ],
  avoid: [
    'Não dizer que toda abstração de Rust ou C++ é automaticamente zero-cost.',
    'Não dizer que Rust sempre gera o mesmo assembly que C.'
  ],
  evidence: []
},

c8b: {
  notes: [
    'Deixar a compilação terminar em silêncio por meio segundo antes de avançar — o <code>Finished</code> é o gancho.',
    'Primeira linha do programa: <b>"Todo mundo pode ter a sua opinião..."</b>',
    'Segunda linha, sem pressa: <b>"...mas a minha é a melhor."</b>',
    'Encerrar em <code>exit code 0</code> e no fecho "Um compilador que exige provas."'
  ],
  jokes: [
    { t: '"Rust-- continua disponível para sistemas legados." — usar apenas se o professor/turma estiver entrando bem na brincadeira.', opt: true }
  ],
  avoid: [],
  evidence: []
},

bA: {
  notes: [
    'Rust representa explicitamente a possibilidade de ausência de valor com <code>Option&lt;T&gt;</code>.',
    'Comparar com <code>NULL</code>, <code>nullptr</code> e <code>std::optional&lt;T&gt;</code>.',
    'A diferença defensável não é "C++ não tem" — é que em Rust isso é o <b>padrão</b> e o compilador exige tratar o caso <code>None</code>.'
  ],
  jokes: [ '"O bilhão de dólares em prejuízo do null continua disponível em outras linguagens."' ],
  avoid: [ 'Não dizer que C++ não tem como expressar ausência de valor — <code>std::optional</code> existe desde C++17.' ],
  evidence: [ { lvl: 'source', t: 'Documentação de <code>Option</code> (Rust std) e cppreference (<code>std::optional</code>).' } ]
},

bB: {
  notes: [
    '<code>Result&lt;T, E&gt;</code> é apenas um enum: ou o valor, ou o erro.',
    'O operador <code>?</code> retorna cedo em caso de erro, convertendo o tipo quando possível.',
    'O ponto: tratamento de erro faz parte do sistema de tipos, não de um canal invisível.'
  ],
  jokes: [ '"O erro não é uma surpresa. É um valor de retorno."' ],
  avoid: [ 'Não dizer que exceções são sempre piores — é outro modelo, com outros trade-offs.' ],
  evidence: [ { lvl: 'source', t: 'Rust Book: capítulo de tratamento de erros; documentação do operador <code>?</code>.' } ]
},

bC: {
  notes: [
    'C: <code>char*</code>, tamanho e terminador são responsabilidade sua.',
    'C++: <code>std::string</code> gerencia o buffer via RAII.',
    'Rust: <code>String</code> é dona do buffer, <code>&str</code> é uma vista emprestada — é a mesma distinção de ownership vs borrowing.'
  ],
  jokes: [ '"Em Rust existem dois tipos de string porque existem duas perguntas: quem é o dono, e quem só está olhando."' ],
  avoid: [],
  evidence: [ { lvl: 'source', t: 'Documentação de <code>String</code> e <code>str</code> na std de Rust.' } ]
},

bF: {
  notes: [
    'Este é o slide para "mas quanto custa isso na prática?".',
    'Static: duas instruções — <code>lea eax, [rsi + rsi]</code> e <code>ret</code>. A chamada de <code>calcular()</code> desapareceu.',
    'Dynamic: carrega o ponteiro da vtable, carrega o método, salta indiretamente.',
    'Dizer com clareza que este assembly é do <b>experimento C++</b>. O ASM de Rust não foi recompilado no pacote de validação.'
  ],
  jokes: [ '"Duas instruções contra três e um salto. Toda a discussão de polimorfismo cabe nisso."' ],
  avoid: [
    'Não apresentar este ASM como se fosse do Rust.',
    'Não concluir que dynamic dispatch nunca pode ser devirtualizado.'
  ],
  evidence: [
    { lvl: 'direct', t: 'clang++ 17.0.0 <code>-O3 -std=c++20 -S -masm=intel</code>: <code>executar_statico → lea eax, [rsi+rsi]; ret</code> e <code>executar_dinamico → mov rax,[rdi]; mov rax,[rax]; jmp rax</code>.' },
    { lvl: 'source', t: 'A parte conceitual de Rust (monomorfização, trait object, vtable) vem da documentação oficial atual.' },
    { lvl: 'unval', t: 'O assembly gerado por <code>rustc</code> NÃO foi produzido no pacote de validação.' }
  ]
},

bD: {
  notes: [
    'A pergunta do slide: mais abstração significa mais trabalho para a CPU?',
    'Em C e C++, a versão imperativa e a versão com <code>fold_indexed</code> + template + lambda produziram <code>.text</code> <b>byte por byte idêntico</b>: 191 bytes, mesmo SHA-256, 62 instruções no corpo.',
    'A pipeline com <code>std::views</code> não deixou chamadas de abstração no corpo, mas levou o Clang 17 a <b>outra estratégia de otimização</b>: 119 bytes, 39 instruções, SHA diferente.',
    'O experimento prova apenas que o binário <b>não ficou idêntico</b> — não prova qual é mais rápido.',
    'Sempre acrescentar: <b>"neste exemplo, com este compilador e estas flags"</b>.',
    'Se perguntarem pelo Rust, descer com <kbd>↓</kbd> para a reserva D2.'
  ],
  jokes: [
    '"Onde estão <code>.filter()</code>, <code>.map()</code>, <code>.enumerate()</code> e as closures?" — pausa — "Não estão."',
    'Sobre <code>std::views</code>: "O pipeline de Rust-- também foi otimizado. Só tomou um caminho turístico."'
  ],
  avoid: [
    'Não concluir que 119 bytes é mais rápido, nem que 191 é mais rápido, nem que ranges "são lentos".',
    'Não dizer "Rust sempre gera o mesmo assembly que C".'
  ],
  evidence: [
    { lvl: 'direct', t: 'C++ imperativo e C++ template+lambda: <code>.text</code> 191 bytes, SHA-256 <code>164c082a…37fc1d8</code>, comparação IDENTICAL, 62 instruções.' },
    { lvl: 'direct', t: 'C imperativo e C com fold: mesmos 191 bytes e mesmo SHA-256 — e iguais ao C++ imperativo.' },
    { lvl: 'direct', t: 'C++ <code>std::views</code>: <code>.text</code> 119 bytes, SHA-256 <code>ecd9de25…14146ad0</code>, DIFFERENT, 39 instruções, nenhum <code>call</code> no corpo.' }
  ]
},

bD2: {
  notes: [
    'Este é o pipeline Rust equivalente: borrowing, slice, iteradores, <code>enumerate</code>, closures, <code>filter</code>, <code>map</code>, <code>sum</code>.',
    'A formulação segura: <b>"em um experimento anterior, este pipeline foi reportado como convergindo para o mesmo corpo de assembly do loop C/C++"</b>.',
    'Deixar claro que <b>isso não foi reproduzido no pacote de validação</b> — <code>rustc</code> não estava instalado.',
    'Se a pessoa insistir, o caminho honesto é abrir o godbolt.org e recompilar na hora.'
  ],
  jokes: [
    '"Onde estão <code>.filter()</code>, <code>.map()</code>, <code>.enumerate()</code> e as closures?" — pausa — "Provavelmente em nenhum lugar. Mas eu não recompilei hoje."'
  ],
  avoid: [
    '<b>Não dizer "idêntico", "byte por byte" ou "mesmo SHA-256" a respeito do Rust.</b>',
    'Não afirmar que toda abstração de Rust é automaticamente zero-cost.'
  ],
  evidence: [
    { lvl: 'unval', t: 'A versão Rust do pipeline NÃO foi recompilada — <code>rustc</code> ausente no ambiente de validação.' },
    { lvl: 'source', t: 'O conceito (abstrações podem ser eliminadas pelo compilador, e isso se mede caso a caso) vem da documentação oficial.' }
  ]
},

bE: {
  notes: [
    'Usar apenas se alguém perguntar sobre SIMD, vetorização ou performance.',
    'Com <code>-O3 -mavx2</code>, as versões C e C++ deste experimento foram vetorizadas e produziram <code>.text</code> idêntico: 730 bytes, mesmo SHA-256, 67 linhas contendo <code>ymm</code>.',
    'A contagem de <code>ymm</code> depende de versão do compilador, código exato, flags, forma de contar, backend e target.',
    'A parte Rust não foi recompilada neste pacote.'
  ],
  jokes: [ '"O compilador vetorizou sozinho. Ninguém escreveu um intrínseco."' ],
  avoid: [
    '<b>O número "51 ocorrências de ymm" do roteiro antigo não foi reproduzido e não deve ser usado.</b>',
    'Não usar contagem de <code>ymm</code> como número universal.'
  ],
  evidence: [
    { lvl: 'direct', t: 'clang / clang++ 17.0.0 <code>-O3 -mavx2</code>: 67 linhas com <code>ymm</code> (163 ocorrências textuais), <code>.text</code> 730 bytes, SHA-256 <code>804e99c1…49811fac</code>, C == C++ byte por byte.' },
    { lvl: 'unval', t: 'A versão Rust do experimento AVX2 NÃO foi recompilada.' }
  ]
}

};
