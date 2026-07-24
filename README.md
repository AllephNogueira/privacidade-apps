# Privacidade dos apps — Fábrica de Software

Site no ar:

- Índice: https://allephnogueira.github.io/privacidade-apps/
- Repo: https://github.com/AllephNogueira/privacidade-apps

Exemplo Play Console:

`https://allephnogueira.github.io/privacidade-apps/home/privacidade-alta-pressao-gnv.html`
`https://allephnogueira.github.io/privacidade-apps/home/privacidade-mei-fiscal.html`

## Regenerar

```powershell
cd C:\Desenvolvimento\Projetos\privacidade-play
node generate-site.mjs
git add .
git commit --trailer "Co-authored-by: Cursor <cursoragent@cursor.com>" -m "Atualiza politicas"
git push
```