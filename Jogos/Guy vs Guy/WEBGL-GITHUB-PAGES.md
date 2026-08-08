# Publicação WebGL no GitHub Pages

## Problema

Exports WebGL da Unity podem gerar arquivos Brotli com a extensão `.br`:

- `Build/web_X.data.br`
- `Build/web_X.framework.js.br`
- `Build/web_X.wasm.br`

O GitHub Pages e o `python -m http.server` normalmente não enviam o cabeçalho
`Content-Encoding: br`. Nesse caso, o navegador não consegue interpretar o
arquivo e exibe `Unable to parse ...framework.js.br`.

## Correção após cada novo export

1. Verifique no `index.html` qual é o prefixo do build (`web_X`).
2. Na raiz do currículo, execute este comando no PowerShell, substituindo
   `web_X` pelo prefixo encontrado:

```powershell
node -e "const fs=require('fs'),z=require('zlib'),p='Jogos\\Guy vs Guy\\Build',v='web_X'; for (const [src,dst] of [[v+'.framework.js.br',v+'.framework.js'],[v+'.data.br',v+'.data'],[v+'.wasm.br',v+'.wasm']]) fs.writeFileSync(p+'\\'+dst,z.brotliDecompressSync(fs.readFileSync(p+'\\'+src)));"
```

3. Em `Jogos/Guy vs Guy/index.html`, remova `.br` destas três configurações:

```js
dataUrl: buildUrl + "/web_X.data",
frameworkUrl: buildUrl + "/web_X.framework.js",
codeUrl: buildUrl + "/web_X.wasm",
```

4. Confirme que os arquivos sem `.br` existem na pasta `Build` e teste com:

```powershell
python -m http.server 8009
```

Abra `http://localhost:8009/Jogos/Guy%20vs%20Guy/`.

## Observação

Os arquivos `.br` podem permanecer no projeto; o loader deve apontar para as
versões descompactadas (`.data`, `.framework.js` e `.wasm`). Se a Unity gerar
um novo nome, repita o procedimento usando esse mesmo nome em todos os três
arquivos.
