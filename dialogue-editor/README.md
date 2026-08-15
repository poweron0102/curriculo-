# Editor de diálogos — Minigame do arco

Aplicação web estática para editar e estruturar os diálogos do minigame do arco
do Ara Mara sem mexer em JSON nem no Unity.

Implementa o plano em [`docs/dialogue-editor-plan.md`](../docs/dialogue-editor-plan.md).

## Como abrir

A aplicação usa módulos ES nativos e `fetch`, então precisa ser servida por HTTP
(abrir o `index.html` direto do disco não funciona).

```bash
cd dialogue-editor
npx serve .        # ou: python -m http.server 8080
```

Depois abra a URL indicada. Navegadores suportados: Chrome, Edge e Firefox
desktop atuais, em janela com pelo menos 1024 px de largura.

## Como publicar no GitHub Pages

Não existe etapa de build. Copie a pasta `dialogue-editor/` inteira para o
repositório servido pelo Pages e acesse `https://<usuário>.github.io/<repo>/dialogue-editor/`.

Todos os caminhos são relativos e a aplicação tem uma única rota (`index.html`),
então não é preciso configurar rewrite nem fallback de SPA.

## Testes

```bash
node tests/run-tests.js
```

Cobrem o domínio puro: condições, alcançabilidade, cobertura, comandos com
undo/redo e serialização. Não exigem navegador nem dependências.

## O que fica onde

| Caminho | Conteúdo |
| --- | --- |
| `data/game-schema.json` | Catálogo do jogo: locutores, itens, gatilhos, marcos, finais, confiança e regras de alcançabilidade. Mantido pela equipe de desenvolvimento — não é editável pela interface. |
| `data/default-project.json` | Projeto inicial com os 15 `SoundData` atuais do minigame. |
| `schemas/` | JSON Schema do arquivo de projeto e do pacote final, para documentação e validação externa. |
| `js/domain/` | Regras puras: modelo, condições, alcançabilidade, cobertura, validação estrutural e comandos. |
| `js/persistence/` | Autosave no IndexedDB. |
| `js/serialization/` | Importação, exportação e migrações. |
| `js/ui/` | Casca do editor, grafo, inspetor, simulador, validação e atalhos. |

## Os dois arquivos exportáveis

- **Arquivo de projeto** (`aramara-dialogos-arco.projeto.json`): backup completo e
  editável, com falas arquivadas, comentários e estado visual. Pode ser exportado
  mesmo com erros.
- **Pacote final** (`aramara-dialogos-arco.pacote.json`): handoff estruturado para
  o futuro importador Unity. Só contém sequências e falas ativas. A exportação é
  bloqueada por erros, mas não por avisos.

> O Unity atual ainda não lê o pacote final. Nesta etapa, o editor e o formato
> exportado são o contrato para a integração futura.

## Atalhos

| Atalho | Ação |
| --- | --- |
| `Ctrl+Z` | Desfazer |
| `Ctrl+Shift+Z` / `Ctrl+Y` | Refazer |
| `Ctrl+C` / `Ctrl+V` | Copiar / colar fala |
| `Ctrl+D` | Duplicar fala |
| `Delete` | Excluir fala (com confirmação) |
| `Ctrl+F` ou `/` | Focar a busca |
| `Ctrl+S` | Forçar o salvamento do rascunho |
| `Escape` | Fechar diálogo ou limpar a seleção |
| `Alt+↑` / `Alt+↓` | Reordenar a fala com foco no grafo |

## Limites conhecidos desta versão

- O rascunho fica só neste navegador; limpar os dados do navegador o remove.
- O histórico de desfazer não sobrevive ao recarregamento da página.
- Não há edição em celular, seleção múltipla, formatação rica nem áudio.
- Condições são combinadas apenas com **E**; não existem grupos com **OU**.

## Ao evoluir o catálogo

Ao mudar `data/game-schema.json`, incremente `version` e registre em
`migrations.renamedIds` qualquer ID renomeado — a importação aplica as
renomeações e avisa o usuário. Ao mudar o formato do projeto, incremente
`PROJECT_FORMAT_VERSION` em `js/domain/project-model.js` e acrescente o passo
correspondente em `STEPS` no `js/serialization/migrations.js`.
