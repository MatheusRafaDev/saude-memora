# Saúde Memora — Design

> Documento para ajustar. Edite os valores abaixo e use este arquivo como referência única para site, sistema e novas telas.

## 1. Essência

- **Produto:** organiza documentos de saúde (receitas, exames, laudos, atestados, vacinas, encaminhamentos) com leitura assistida por OCR e IA.
- **Assinatura:** "Seu histórico de saúde, sempre à mão."
- **Tom:** claro, calmo, confiável. Frases curtas, verbos simples, sem promessas médicas.
- **Regra de ouro:** a IA sugere, o usuário confere. Todo dado extraído aparece com aviso e status.

## 2. Cores

| Token | Nome | Hex | Uso |
|---|---|---|---|
| `--blue` | Azul Confiança | `#1D4ED8` | Cor principal, botões, links, item ativo |
| `--sky` | Azul Céu | `#CFE0FF` | Carteirinha, avisos informativos, selo "Revisado" |
| `--coral` | Coral Cuidado | `#E8664A` | Destaque e alertas, ponto do logo, faixa de emergência |
| `--ice` | Gelo | `#F4F7FC` | Blocos de apoio, área de upload |
| `--ink` | Tinta | `#14211F` | Textos e botão escuro |
| `--navy` | Azul-marinho | `#1C2438` | Cards de destaque (usar em poucos) |
| `--white` | Branco | `#FFFFFF` | Fundo de página, menu e cards comuns |

**Apoio**

| Token | Hex | Uso |
|---|---|---|
| `--line` | `#E3E8F0` | Bordas e divisores em fundo claro |
| `--line-navy` | `#36425F` | Divisores dentro de cards azul-marinho |
| `--muted` | `#5B6878` | Texto secundário em fundo claro |
| `--muted-navy` | `#A9B6CE` | Texto secundário em fundo azul-marinho |
| `--warn-bg` / `--warn-text` | `#FDE1DA` / `#9B2C16` | Selo "Conferir dados" |

**Regras**
- Fundo do sistema e do site: **branco**.
- Azul-marinho só em **1 card de destaque por tela** (hoje: cartão "Receita" no site e "Acesso rápido em emergências" na Visão geral).
- Coral é alerta e detalhe, nunca cor de fundo grande.
- Contraste mínimo de texto: 4.5:1.

## 3. Tipografia

| Papel | Fonte | Peso |
|---|---|---|
| Títulos e números | **Fraunces** | 600 (itálico 500 para destaque de frase) |
| Interface e textos | **Inter** | 400, 500, 600, 700 |

**Escala (site)**

| Elemento | Tamanho | Linha |
|---|---|---|
| H1 hero | 64 px | 1.08 |
| H2 seção | 40 px | 1.15 |
| H3 card | 24 px | 1.15 |
| Texto | 17 px | 1.6 |
| Apoio / legenda | 13–14 px | 1.5 |

**Escala (sistema)**

| Elemento | Tamanho |
|---|---|
| Saudação "Olá, [Nome]" | 32 px |
| Título de card | 19–20 px |
| Número de métrica | 42 px |
| Texto da tabela | 15 px |

Frases em **caixa de frase** (só a primeira letra maiúscula). Rótulos pequenos podem ficar em caixa alta com espaçamento leve, no sistema.

## 4. Espaçamento e forma

- Base de 8 px. Passos usados: 8, 12, 16, 20, 24, 32, 56, 80.
- Container do site: 1120 px, margem lateral 24 px.
- Raio: botões 12 px · cards 18–20 px · blocos grandes 28 px · selos 99 px.
- Borda: 1 px `--line`. Sombra só no card de destaque do hero.

## 5. Componentes

**Botões**
- Primário: fundo `--blue`, texto branco, 700.
- Secundário: fundo branco, borda 1.5 px `--ink`.
- Escuro (ação de câmera): hoje azul, para não competir com o card navy.
- Altura mínima de toque: 44 px.

**Cards**
- Comum: branco, borda `--line`, raio 20 px, padding 22–28 px.
- Destaque: `--navy`, texto branco, rótulos `--muted-navy`.
- Emergência: branco ou navy, com faixa superior coral de 4 px.

**Selos de status**
- Revisado: fundo `--sky`, texto `--blue`.
- Conferir dados: fundo `--warn-bg`, texto `--warn-text`.

**Carteirinha:** fundo `--sky`, nome do plano em Fraunces, número abaixo.

**Aviso de IA:** faixa `--sky` com texto azul escuro: "Os dados extraídos por IA podem conter erros. Confira sempre com o documento original."

**Chips de tipo:** Exame, Receita, Laudo, Atestado, Vacina, Encaminhamento. Pílula branca com borda; selecionado em `--ink`.

## 6. Logo

- Símbolo: quadrado arredondado azul (`rx` 18/64) com linha de pulso branca e ponto coral.
- Versões: principal em fundo claro, invertida em azul, só ícone para app.
- Texto: "Saúde" em Fraunces 600 e "Memora" em itálico azul.
- Área livre: metade da altura do símbolo.

## 7. Estrutura das telas

**Site institucional**
1. Cabeçalho (logo, Como funciona, Recursos, Entrar, Criar conta)
2. Hero com cartão de leitura assistida
3. Como funciona (3 passos)
4. Recursos (2 cards)
5. Privacidade e uso responsável
6. Chamada final
7. Rodapé com aviso legal

**Sistema — Visão geral**
1. Menu: Visão geral, Documentos, Ficha médica, Chat
2. Acesso rápido em emergências + Carteirinha
3. Métricas: exames, atestados, medicamentos frequentes
4. Novo documento (tipo + câmera ou arquivo)
5. Documentos recentes (busca, aviso de IA, tabela)

## 8. Textos obrigatórios

- Aviso de IA em toda tela que mostra dado extraído.
- "Informado por você na ficha médica. Confira com um profissional de saúde." no card de emergência.
- Rodapé: "Os dados extraídos podem conter erros e devem ser conferidos pelo usuário e por profissionais de saúde. Este serviço não faz diagnóstico nem aconselhamento médico."
- Não usar dados reais em exemplos: use marcadores como `[Nome]`, `[Clínica]`.

## 9. Acessibilidade

- Botões e links reais (`button`, `a`), com foco visível.
- Ícones sem texto precisam de `aria-label`.
- Não depender só de cor para status: o selo sempre tem texto.
- Responsivo até 390 px: menu lateral vira barra inferior, tabelas rolam ou ocultam colunas.

## 10. Para ajustar

- [ ] Quantos cards azul-marinho por tela?
- [ ] Menu lateral e cabeçalho: brancos ou azul-marinho?
- [ ] Coral: só alerta ou também botões?
- [ ] Tema escuro: manter desligado?
- [ ] Voz da marca: mais formal ou mais próxima?