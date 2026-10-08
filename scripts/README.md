# Pipeline de bulas da ANVISA e conteúdo público de terceiros

O pipeline da ANVISA usa somente `https://consultas.anvisa.gov.br` e o dataset oficial `https://dados.anvisa.gov.br/dados/DADOS_ABERTOS_MEDICAMENTOS.csv`.

## Executar o pipeline da ANVISA

```powershell
node scripts/anvisa-bulas.mjs --registro 126750242 --modo link
node scripts/anvisa-bulas.mjs --nome CARVEDILOL --modo local
```

- `--modo link`: grava `metadata.json` com a URL oficial, sem baixar PDFs.
- `--modo local`: baixa o PDF da bula e o anexo profissional oficial, valida o tamanho e calcula SHA-256.
- `--rate-limit 1`: intervalo mínimo entre requisições, em segundos.
- `--output`: diretório de saída.

## Extrair conteúdo público da Consulta Remédios

```powershell
node scripts/consulta-remedios.mjs --url https://consultaremedios.com.br/dipirona-monoidratada/bula
```

O scraper aceita somente os domínios `consultaremedios.com.br` e `portal.anvisa.gov.br`. Ele grava o HTML original, metadados JSON-LD, resumo textual, seções extraídas, referências seguras e o hash SHA-256.

O conteúdo da Consulta Remédios é público de terceiros e não é uma bula oficial da ANVISA. O campo `eh_oficial` deve permanecer `false`.

## Acesso oficial e proteção

A API oficial exige um token Cloudflare Turnstile. O script não tenta contornar o desafio. Em modo local, ele falha individualmente com o erro oficial e registra o medicamento em `data/bulas/erros.log`. Um fluxo automatizado somente funciona quando a aplicação tiver uma sessão legítima ou um mecanismo oficial de autenticação que forneça o token.

O endpoint de download da bula é o `.../api/consulta/medicamentos/arquivo/bula/parecer/{idBula}/`. O endpoint de anexo profissional é o `.../api/medicamento/{idBula}/5/anexo`, conforme o código oficial do portal. O portal não expõe uma API pública sem o token de proteção; não há bulk download confirmado.

## Testes

```powershell
node --test tests/anvisa-bulas.test.mjs
```
