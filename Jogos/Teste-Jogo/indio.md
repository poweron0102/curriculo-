# Fluxo geral do minigame

## Premissa

O jogador acorda ou entra em uma floresta durante a noite. Ao explorar, encontra um indígena sentado perto de uma fogueira apagada, triste e preocupado.

Ele perdeu seu arco favorito, um arco antigo que tinha valor emocional, e precisa encontrá-lo **antes do amanhecer**. O jogador pode explorar a floresta, coletar objetos e decidir como ajudar.

O minigame gira em torno de três sistemas principais:

1. **Tempo até amanhecer**
2. **Exploração e coleta de itens**
3. **Confiança / estado emocional do indígena**

---

# Estrutura dos locais

## 1. Acampamento do indígena

Local central do jogo.

Aqui o jogador pode:

* Conversar com o indígena.
* Entregar presentes.
* Receber dicas.
* Tomar a decisão final, caso tenha os itens certos.
* Ver a fogueira apagada.

Itens próximos:

* **Fogueira apagada → pederneira**

A pederneira pode ser entregue ou usada para reacender a fogueira. Isso deixa o indígena mais confortável e faz ele falar mais.

---

## 2. Árvore caída

Local importante.

Item:

* **Galho resistente**

Esse é o item-chave do jogo. Ele pode ser usado de duas formas:

* Como alavanca para levantar a pedra e recuperar o arco antigo.
* Como base para criar um arco novo.

Como é uma escolha importante, o jogo deve evitar que o jogador gaste o galho sem querer. O ideal é só consumir o item quando ele confirmar uma decisão clara.

---

## 3. Caminho da floresta

Local comum de exploração.

Item:

* **Galho comum**

Esse item pode servir como presente simples, tentativa errada de resolver problemas ou item cômico.

Exemplo:

> “Esse galho é… bem galhudo. Obrigado, eu acho.”

Ele não resolve os finais principais, mas ajuda o jogador a entender a mecânica de presentear.

---

## 4. Ninho de passarinho

Local mais delicado.

Item:

* **Pena de pássaro**

Pode ser coletada do chão perto do ninho, sem prejudicar o animal.

Uso:

* Presente simbólico.
* Material decorativo para o arco novo.
* Pode desbloquear uma fala emocional sobre o arco antigo.

---

## 5. Clareira da lua

Local bonito e mais mágico/poético.

Item:

* **Fibra vegetal / corda natural**

Uso:

* Material essencial para montar o arco novo.
* Pode também ser entregue ao indígena, fazendo ele comentar que aquilo daria uma boa corda de arco.

Essa fala planta a ideia do Final 2 sem entregar tudo diretamente.

---

## 6. Toca escondida

Local de tensão.

Item:

* **Pele de animal**

Pode ter um pequeno susto: barulho dentro da toca, olhos brilhando, morcego saindo, etc.

Uso:

* Aquecer o indígena.
* Aumentar bastante a confiança.
* Pode ser usada opcionalmente como acabamento do arco novo.

---

## 7. Moitas

Local simples e rápido.

Item:

* **Frutas silvestres**

Uso:

* Presente de conforto.
* Aumenta pouco a confiança.
* Pode gerar falas cômicas.

Exemplo:

> “Obrigado. Eu estava tão preocupado com o arco que esqueci que também estava com fome.”

---

## 8. Pedra grande

Local inicialmente bloqueado ou difícil de encontrar.

O jogador só descobre esse local se:

* Aumentar a confiança do indígena;
* Ou explorar muito e achar pistas;
* Ou usar algum item para revelar rastros, como a pederneira/fogueira permitindo que ele lembre melhor.

Aqui está o arco antigo, preso embaixo da pedra.

Para resolver:

* Precisa do **galho resistente**.
* O jogador usa o galho como alavanca.
* A pedra levanta.
* O arco antigo é recuperado.
* O galho resistente quebra.

Final: **Arco recuperado**.

---

# Sistema de tempo

O tempo pode ser dividido em fases visuais, em vez de usar um cronômetro real muito punitivo.

## Fases da noite

| Fase           | Estado visual                   | Sensação                |
| -------------- | ------------------------------- | ----------------------- |
| Noite profunda | Céu escuro, floresta silenciosa | Começo da busca         |
| Meia-noite     | Lua alta, sons de animais       | Exploração principal    |
| Madrugada      | Névoa leve, céu menos escuro    | Pressão aumentando      |
| Pré-amanhecer  | Céu azulado/roxo                | Última chance           |
| Amanhecer      | Luz do sol                      | Final de tempo esgotado |

Cada ação importante pode avançar o tempo:

* Ir para um novo local: avança um pouco.
* Coletar item: pouco ou nenhum avanço.
* Voltar ao acampamento: avança.
* Conversar/entregar presente: avança pouco.
* Fazer ação final: encerra a noite.

Isso cria tensão sem obrigar o jogador a correr o tempo todo.

---

# Sistema de confiança

O indígena começa triste, fechado e preocupado. Cada presente ou atitude positiva aumenta a confiança.

## Níveis de confiança

| Confiança | Estado do indígena   | O que muda                                            |
| --------- | -------------------- | ----------------------------------------------------- |
| 0         | Triste e desconfiado | Dá poucas informações                                 |
| 1-2       | Mais calmo           | Conta pistas vagas                                    |
| 3-4       | Confiante            | Revela detalhes sobre onde perdeu o arco              |
| 5+        | Vínculo forte        | Sugere que talvez um arco novo também possa ter valor |

---

# Reações aos presentes

## Galho comum

Aumenta pouco a confiança.

Fala possível:

> “Obrigado… mas acho que nem uma formiga conseguiria caçar com isso.”

Uso: item cômico e tutorial de presente.

---

## Frutas silvestres

Aumenta a confiança.

Fala possível:

> “Eu não percebi como estava com fome. Você tem um bom coração.”

Uso: conforto simples.

---

## Pena de pássaro

Aumenta a confiança e ativa memória.

Fala possível:

> “Meu arco tinha uma pena parecida amarrada nele. Foi meu pai quem colocou. Ele dizia que uma flecha também precisa lembrar do céu.”

Uso: emociona o personagem e reforça o valor do arco antigo.

---

## Pederneira

Aumenta bastante a confiança.

Ao entregar ou usar na fogueira, o acampamento fica mais iluminado e acolhedor.

Fala possível:

> “O fogo ajuda a lembrar. Eu estava correndo pela trilha quando ouvi algo cair perto de uma pedra grande…”

Uso: desbloqueia uma pista importante.

---

## Pele de animal

Aumenta bastante a confiança.

Fala possível:

> “A noite estava ficando fria. Você não está só procurando meu arco… está cuidando de mim.”

Uso: aproxima emocionalmente o jogador do indígena.

---

## Fibra vegetal

Aumenta um pouco a confiança ou desbloqueia comentário técnico.

Fala possível:

> “Essa fibra é forte. Se fosse bem trançada, poderia virar uma boa corda de arco…”

Uso: sugere a possibilidade de criar um arco novo.

---

## Galho resistente

Esse item não deveria ser entregue como presente comum sem confirmação.

Quando o jogador mostra o galho ao indígena, ele pode dizer:

> “Esse galho é firme. Com ele, talvez dê para levantar algo pesado… ou talvez construir algo novo.”

Essa fala apresenta a bifurcação principal do jogo.

---

# Progressão recomendada

## Começo

1. Jogador encontra o indígena.
2. Ele explica que perdeu o arco favorito.
3. Diz que precisa encontrá-lo antes do amanhecer.
4. O jogador recebe o objetivo: **ajudar a encontrar o arco**.

Nesse momento, o indígena não lembra exatamente onde perdeu o arco, pois está nervoso e triste.

---

## Exploração inicial

O jogador pode visitar locais em qualquer ordem:

* Árvore caída → galho resistente.
* Moitas → frutas.
* Fogueira apagada → pederneira.
* Ninho → pena.
* Clareira da lua → fibra.
* Toca → pele.
* Caminho → galho comum.

A cada retorno ao acampamento, pode entregar itens e receber novas falas.

---

# Ramificações principais

## Caminho A — Jogador foca em encontrar o arco antigo

O jogador coleta o **galho resistente** e aumenta confiança suficiente para descobrir a localização da pedra grande.

Condição para desbloquear a pedra:

* Confiança média/alta;
* Ou pederneira entregue/usada;
* Ou muita exploração.

Depois, na pedra grande:

1. Jogador vê algo preso embaixo da pedra.
2. Usa o galho resistente como alavanca.
3. A pedra se move.
4. O arco antigo aparece.
5. O galho quebra.

Resultado:

* O indígena recupera o arco antigo.
* Fica feliz, mas percebe que o jogador sacrificou o galho resistente.
* Final agridoce.

### Final 1: Arco recuperado

Tom:

* Satisfatório.
* Nostálgico.
* Um pouco melancólico.

Fala final possível:

> “Esse arco carregava muitas lembranças. Você trouxe uma parte da minha história de volta. O galho se foi… mas nem tudo que se quebra é perdido.”

---

## Caminho B — Jogador cria um arco novo

O jogador coleta:

* **Galho resistente**
* **Fibra vegetal**
* Opcionalmente **pena de pássaro**
* Opcionalmente **pele de animal**

Também precisa ter confiança alta o bastante para o indígena aceitar a ideia de seguir em frente.

Condição sugerida:

* Confiança alta;
* Galho resistente no inventário;
* Fibra vegetal no inventário;
* Ter ouvido a fala sobre “construir algo novo”.

Depois, no acampamento:

1. Jogador mostra o galho resistente.
2. O indígena comenta que poderia virar um bom arco.
3. Jogador escolhe: “Vamos fazer um novo?”
4. Os dois montam o arco juntos.
5. Se tiver pena, ela vira decoração.
6. Se tiver pele, ela vira empunhadura.

Resultado:

* O indígena entende que o arco antigo era importante, mas que novas memórias também podem nascer.
* Ele ganha um novo arco e considera o jogador um amigo.

### Final 2: Um arco e um amigo

Tom:

* Feliz.
* Emocional.
* Mais recompensador que o final do arco recuperado.

Fala final possível:

> “O outro arco era uma lembrança do passado. Este aqui… vai ser uma lembrança desta noite. Acho que encontrei mais do que um arco.”

---

## Caminho C — Tempo esgota

Se o jogador demora demais:

1. O céu começa a clarear.
2. Os sons da floresta mudam.
3. O indígena percebe que não há mais tempo.
4. Ele se levanta e parte triste.

### Final 3: Amanhecer triste

Tom:

* Game over narrativo.
* Incentiva nova tentativa.

Fala final possível:

> “O sol nasceu. Talvez algumas coisas só possam ser encontradas enquanto ainda temos coragem de procurar.”

Esse final pode mostrar uma dica depois:

> “Dica: alguns presentes fazem o indígena lembrar melhor da noite em que perdeu o arco.”

---

# Ramificações opcionais interessantes

## 1. Final “arco recuperado, mas sem amizade”

Se o jogador encontrar a pedra grande por exploração, mas quase não conversar com o indígena, pode recuperar o arco antigo com baixa confiança.

Resultado:

* O objetivo é cumprido.
* O indígena agradece, mas de forma mais distante.
* O final é mais frio.

Fala possível:

> “Você encontrou o arco. Obrigado. Agora preciso seguir.”

Esse final mostra que resolver o problema mecanicamente não é o mesmo que criar vínculo.

---

## 2. Final “arco novo incompleto”

Se o jogador tentar criar o arco novo com:

* Galho resistente;
* Fibra vegetal;
* Mas sem confiança alta;

O indígena pode recusar.

Fala possível:

> “Não é só madeira e corda. Meu arco tinha história. Ainda não consigo simplesmente trocar isso.”

Isso força o jogador a entender que o Final 2 depende de conexão emocional, não só de itens.

---

## 3. Galho comum como tentativa errada

Se o jogador tentar usar o galho comum na pedra:

* Ele quebra imediatamente.
* A pedra não se move.
* O tempo avança um pouco.

Mensagem:

> “O galho comum quebra antes mesmo da pedra se mexer.”

Isso ensina que o **galho resistente** é especial.

---

## 4. Pista alternativa com a pena

Ao entregar a pena, o indígena pode lembrar que o arco caiu quando ele correu atrás de um pássaro assustado.

Fala:

> “Um pássaro saiu voando quando eu tropecei. Depois disso, ouvi algo bater contra pedra…”

Isso aponta indiretamente para a região da pedra grande.

---

## 5. Toca escondida com risco

Ao pegar a pele de animal, o jogador pode sofrer um susto:

* Barulho dentro da toca.
* Algo se mexe.
* O jogador precisa recuar ou esperar.
* Se insistir rápido demais, perde tempo.

Isso adiciona tensão sem virar combate obrigatório.

---

# Fluxo resumido em árvore

```text
Início
  ↓
Encontra o indígena triste no acampamento
  ↓
Explora a floresta e coleta itens
  ↓
Entrega presentes / aumenta confiança
  ↓
Desbloqueia pistas
  ↓
Escolha principal:

  A) Usar galho resistente na pedra
      ↓
      Recupera arco antigo
      ↓
      Galho quebra
      ↓
      Final: Arco recuperado

  B) Usar galho resistente + fibra para criar arco novo
      ↓
      Requer confiança alta
      ↓
      Opcional: pena e pele melhoram o arco
      ↓
      Final: Um arco e um amigo

  C) Demorar demais
      ↓
      Amanhece
      ↓
      Indígena vai embora triste
      ↓
      Final: Tempo esgotado
```

---

# Fluxo ideal de gameplay

Uma sequência boa para o jogador descobrir naturalmente seria:

1. Encontrar o indígena.
2. Pegar frutas ou galho comum e testar a mecânica de presente.
3. Achar a pederneira e reacender a fogueira.
4. O indígena começa a lembrar melhor.
5. Explorar a árvore caída e pegar o galho resistente.
6. Explorar a clareira da lua e pegar a fibra.
7. Entregar mais itens para aumentar confiança.
8. Receber duas pistas:

   * Existe uma pedra grande.
   * O galho poderia servir para levantar algo ou criar algo novo.
9. O jogador escolhe:

   * Ir até a pedra e recuperar o arco.
   * Ficar no acampamento e criar um novo arco.

---

# Recomendação de design

O ponto mais forte do seu conceito é que o **mesmo item-chave**, o galho resistente, leva a dois finais diferentes.

Isso cria uma escolha boa porque o jogador precisa decidir entre:

* **Restaurar o passado**: recuperar o arco antigo.
* **Construir algo novo**: criar um novo arco junto com o indígena.

Eu deixaria o Final 2 como o “melhor final”, mas não trataria o Final 1 como errado. O Final 1 cumpre o objetivo inicial. O Final 2 mostra que o jogador entendeu o lado emocional da história.


