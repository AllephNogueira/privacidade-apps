# Site de Privacidade — Fábrica de Software

Site estático (HTML/CSS/JS) com **uma política por aplicativo**, no formato:

```text
home/privacidade-alta-pressao-gnv.html
home/privacidade-mei-fiscal.html
...
```

## Estrutura

```text
privacidade-play/
  index.html              # lista + busca
  css/styles.css
  js/main.js
  home/privacidade-*.html # 47 apps
  apps-map.json           # mapa pasta → URL
  generate-site.mjs       # regenera tudo
  README.md
```

## Como publicar no Git (GitHub Pages)

1. Crie um repositório (ex.: `privacidade-apps`)
2. Envie **esta pasta** `privacidade-play` como raiz do repo (ou a pasta `home` + `css` + `js` + `index.html`)
3. Ative **Settings → Pages → Deploy from branch `main` / root**
4. Links finais:

```text
https://SEU_USUARIO.github.io/privacidade-apps/
https://SEU_USUARIO.github.io/privacidade-apps/home/privacidade-alta-pressao-gnv.html
https://SEU_USUARIO.github.io/privacidade-apps/home/privacidade-mei-fiscal.html
```

Na Play Console de cada app, cole **somente a URL daquele app**.

## Regenerar após novos apps

```powershell
# 1) atualiza inventario de permissoes (PowerShell do workspace)
# 2) gera HTML
cd C:\Desenvolvimento\Projetos\privacidade-play
node generate-site.mjs
```

## Conteúdo (Play / LGPD)

Cada página declara, conforme o manifesto:

- Finalidade do app
- Dados locais vs compras Google Play
- Permissões reais (localização, câmera, notificações, billing, AD_ID…)
- Direitos LGPD e contato
- Avisos extras (saúde, crianças, mapas) quando aplicável

Contato padrão: `allephnogueira@gmail.com` (altere em `generate-site.mjs` → `PUBLISHER` se necessário).
