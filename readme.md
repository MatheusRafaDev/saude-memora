# 🏥 SaúdeMemora

<p align="center">
  <img src="https://img.shields.io/badge/version-2.0.0-green?style=for-the-badge" />
  <img src="https://img.shields.io/badge/React%20%2B%20Vite-Frontend-00D8FF?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/.NET%209-Backend-512BD4?style=for-the-badge&logo=dotnet" />
  <img src="https://img.shields.io/badge/MongoDB-NoSQL-47A248?style=for-the-badge&logo=mongodb" />
  <img src="https://img.shields.io/badge/Cloudinary-Image%20Storage-3448C5?style=for-the-badge&logo=cloudinary" />
  <img src="https://img.shields.io/badge/Gemini%20AI-LLM-blueviolet?style=for-the-badge" />
</p>

> **Digitalize, organize e acesse documentos médicos com inteligência.**  
> Aplicação para organizar documentos de saúde e consultar informações extraídas com OCR e Inteligência Artificial. Os dados extraídos podem conter erros e devem ser conferidos pelo usuário e por profissionais de saúde.

## 🔗 Acesse o projeto

👉 https://saude-memora.vercel.app

---

## 🚀 Principais Benefícios

Com o **SaúdeMemora**, o usuário pode:

- 📄 **Evitar a perda de documentos importantes**: Digitalize papéis usando a câmera ou fazendo upload.
- 🩺 **Histórico médico unificado**: Receitas, exames, laudos, atestados e encaminhamentos em um só lugar.
- ⚡ **Acesso rápido em emergências**: Veja alergias, doenças crônicas e seu tipo sanguíneo instantaneamente no Dashboard.
- 🔒 **Extração assistida**: OCR e IA podem sugerir nome do médico, clínica, data e medicamentos a partir dos documentos. A extração não é garantida nem substitui a conferência do original.

---

## ⚙️ Funcionalidades Atuais (Versão 2.0)

**1. Processamento Inteligente de Documentos**
- **Upload Inteligente com Seletor de Tipo**: Categorize o arquivo (Exame, Receita, Laudo, Atestado, Vacina, Encaminhamento) antes do upload.
- **Integração com Câmera**: Capture documentos ou fotos da carteirinha do convênio diretamente pela câmera do celular ou webcam.
- **OCR e IA por tipo de documento**: O processamento usa instruções específicas para cada tipo; os resultados podem ser incompletos ou incorretos e precisam de revisão.
- **Extração de Medicamentos**: A IA identifica remédios, dosagens e horários automaticamente.

**2. Carteirinha do Convênio e Perfil**
- Anexe a foto da sua carteirinha do plano de saúde.
- A IA extrai automaticamente o **nome do plano** e o **número da carteirinha**.
- Acesso rápido na tela de Visão Geral (Dashboard) através de um visualizador interativo (modal).

**3. Visão Geral (Dashboard)**
- **Métricas e Destaques**: Contagem total de exames, atestados e medicamentos mais frequentes.
- **Informações de saúde**: A ficha pode exibir alergias e doenças crônicas cadastradas pelo usuário. Confira esses dados com um profissional de saúde.
- **Busca Rápida**: Documentos recentes estruturados em tabela.

**4. Arquivo de Documentos**
- Tabela com filtros combinados: Filtre simultaneamente por Categoria (Exames, Laudos, etc) e Período (Últimos 30 dias, 6 meses, etc).
- **Busca Textual**: Pesquise pelo nome do médico, clínica ou palavras no resumo gerado pela IA.
- **Pesquisa e organização**: Busca por título e conteúdo extraído, com filtros para tipo, status e período.

**5. Ficha Médica (Anamnese)**
- Cadastro detalhado de histórico familiar, cirurgias, doador de órgãos, tipo sanguíneo, hábitos e cirurgias.
- Bloqueio inteligente: Novos usuários são convidados a preencher a anamnese para popular os alertas do sistema.

**6. Experiência de Usuário (UX)**
- Tema noturno moderno e responsivo.
- Navegação fluida com transições `page-enter`.
- Sistema de toast notifications avançado para mostrar em tempo real o que a IA conseguiu extrair dos documentos (Ex: `✓ Lido pela IA! Plano: Bradesco · Nº: 123456`).

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React + Vite, TailwindCSS (Vanilla UI), React Query (Cache e mutations), Wouter.
- **Backend:** C# ASP.NET Core 9 Minimal API.
- **Inteligência Artificial:** OCR.Space (Leitura ótica de textos complexos) + Gemini (Interpretação e extração estruturada json).
- **Banco de Dados:** MongoDB para dados da aplicação.
- **Storage:** Cloudinary para arquivos enviados, quando configurado.

---

## 🚀 Executar localmente

Requisitos: .NET 9 SDK, Node.js compatível com o workspace, pnpm e Docker Compose.

1. Inicie a API, MongoDB e Redis:

   ```powershell
   docker compose up --build
   ```

2. Em outro terminal, instale dependências e inicie o frontend:

   ```powershell
   cd frontend
   pnpm install --frozen-lockfile
   cd apps/web
   pnpm dev
   ```

3. Abra `http://localhost:5173`. A API local responde em `http://localhost:8080`.

O Compose da raiz é para desenvolvimento local: contém segredos de exemplo, configura cookies sem `Secure`, executa a API em `Development` e publica portas do MongoDB e Redis. **Não o publique diretamente na internet nem reutilize os valores de exemplo.**

## 🏭 Implantação em ambiente real

Este repositório não fornece um Compose de produção, proxy TLS ou provisionamento gerenciado. Para publicar a aplicação, configure esses componentes no ambiente de hospedagem e, antes de aceitar dados reais:

1. Use MongoDB e Redis gerenciados ou protegidos em rede privada; habilite autenticação, TLS, controle de acesso e backups testados do MongoDB.
2. Gere um `JWT_SECRET_KEY` aleatório e exclusivo com no mínimo 32 caracteres. Guarde-o, junto com tokens e chaves de serviços, em um gerenciador de segredos; não os coloque no Git ou em imagens.
3. Publique a API atrás de HTTPS. Defina `COOKIE_SECURE=true`, `COOKIE_SAME_SITE` conforme o domínio e os fluxos de autenticação, `FRONTEND_URL` e `CORS_ALLOWED_ORIGINS` com os domínios exatos da implantação. Configure `TRUSTED_PROXIES` apenas para os endereços dos proxies confiáveis.
4. Configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` e `CLOUDINARY_API_SECRET` se os arquivos forem armazenados no Cloudinary. Configure `GEMINI_API_KEY` e `OCR_SPACE_API_KEY` para habilitar os serviços de extração e `BREVO_API_KEY` para envio de e-mail de redefinição de senha.
5. Ajuste limite de upload e timeout do proxy/API em conjunto. O endpoint de documentos aceita até 10 MB; um proxy como Nginx deve permitir pelo menos esse limite.
6. Defina política de retenção, exclusão e resposta a incidentes. Avalie contratos, localização e tratamento de dados dos provedores externos antes de processar informações de saúde reais.

### Catálogos CID-10 e CNES

- Quando a coleção estiver vazia, a API importa automaticamente o arquivo CID-10 de subcategorias incluído na publicação. `CID10_CATALOG_PATH` permite apontar para outro CSV compatível.
- O projeto não distribui a base oficial CNES. Para inicialização automática, disponibilize o arquivo oficial CSV/XML dentro do ambiente da API e configure `CNES_CATALOG_PATH`. O CSV aceita colunas `CO_CNES`, `NO_RAZAO_SOCIAL` e, opcionalmente, `DS_ATIVIDADE`; o XML usa esses mesmos campos oficiais. Sem essa configuração, o catálogo CNES fica vazio até uma importação manual.
- A importação manual dos catálogos exige usuário autenticado e o segredo `CATALOGO_IMPORT_TOKEN`. Envie o arquivo no campo multipart `file` e o segredo no cabeçalho `X-Import-Token` para `POST /api/catalogo-cid10/importar` ou `POST /api/catalogo-cnes/importar`. Mantenha esse segredo restrito a operadores e rotacione-o se houver exposição.
- Uma importação só substitui os dados atuais depois que o arquivo for processado com sucesso e contiver registros válidos. Use arquivos oficiais atualizados e verifique os totais retornados pela API.

### Configuração de ambiente

Consulte [`backend/.env.example`](./backend/.env.example) para variáveis da API e [`frontend/.env.example`](./frontend/.env.example) para `VITE_API_URL`. Em produção, injete-as pelo ambiente de hospedagem/gerenciador de segredos, não copie valores de desenvolvimento.

## ⚕️ Uso responsável e privacidade

O SaúdeMemora organiza documentos e informações fornecidas pelo usuário. Não é um serviço de diagnóstico ou aconselhamento médico, não substitui avaliação profissional e não deve ser usado para decisões clínicas ou emergências. Em uma emergência, procure os serviços de emergência locais.

Arquivos e dados de saúde são sensíveis. OCR, IA, banco e armazenamento podem envolver provedores externos conforme a configuração implantada. Antes de usar com pessoas reais, informe os usuários sobre os fornecedores e o tratamento efetivamente habilitados, obtenha as autorizações necessárias e valide os requisitos legais e de segurança aplicáveis. Não use dados reais em desenvolvimento ou demonstrações.

---

## ✅ Verificações

```powershell
dotnet test backend\SaudeMemora.Tests\SaudeMemora.Tests.csproj
cd frontend\apps\web
pnpm run typecheck
pnpm run build
```
