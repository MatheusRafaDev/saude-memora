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
> Aplicação que utiliza OCR + Inteligência Artificial (Gemini) para transformar exames, carteirinhas e receitas em dados estruturados de forma automática.

## 🔗 Acesse o projeto

👉 https://saude-memora.vercel.app

---

## 🚀 Principais Benefícios

Com o **SaúdeMemora**, o usuário pode:

- 📄 **Evitar a perda de documentos importantes**: Digitalize papéis usando a câmera ou fazendo upload.
- 🩺 **Histórico médico unificado**: Receitas, exames, laudos, atestados e encaminhamentos em um só lugar.
- ⚡ **Acesso rápido em emergências**: Veja alergias, doenças crônicas e seu tipo sanguíneo instantaneamente no Dashboard.
- 🔒 **Processamento por IA**: Deixe a IA ler o nome do médico, a clínica, a data e os medicamentos diretamente das imagens.

---

## ⚙️ Funcionalidades Atuais (Versão 2.0)

**1. Processamento Inteligente de Documentos**
- **Upload Inteligente com Seletor de Tipo**: Categorize o arquivo (Exame, Receita, Laudo, Atestado, Vacina, Encaminhamento) antes do upload.
- **Integração com Câmera**: Capture documentos ou fotos da carteirinha do convênio diretamente pela câmera do celular ou webcam.
- **OCR e LLM Específicos**: Prompts de IA adaptados e ajustados exclusivamente para cada tipo de documento, garantindo alta precisão na extração de dados médicos.
- **Extração de Medicamentos**: A IA identifica remédios, dosagens e horários automaticamente.

**2. Carteirinha do Convênio e Perfil**
- Anexe a foto da sua carteirinha do plano de saúde.
- A IA extrai automaticamente o **nome do plano** e o **número da carteirinha**.
- Acesso rápido na tela de Visão Geral (Dashboard) através de um visualizador interativo (modal).

**3. Visão Geral (Dashboard)**
- **Métricas e Destaques**: Contagem total de exames, atestados e medicamentos mais frequentes.
- **Alertas Médicos**: Banner de segurança crítico na tela principal contendo informações vitais como alergias e doenças crônicas em caso de emergência.
- **Busca Rápida**: Documentos recentes estruturados em tabela.

**4. Arquivo de Documentos**
- Tabela com filtros combinados: Filtre simultaneamente por Categoria (Exames, Laudos, etc) e Período (Últimos 30 dias, 6 meses, etc).
- **Busca Textual**: Pesquise pelo nome do médico, clínica ou palavras no resumo gerado pela IA.
- **Exclusão Otimista**: Exclusão instantânea de documentos da tela (sem tempo de carregamento), com sincronização em segundo plano.

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
- **Backend:** C# ASP.NET Core 8 API Minimal.
- **Inteligência Artificial:** OCR.Space (Leitura ótica de textos complexos) + Gemini (Interpretação e extração estruturada json).
- **Banco de Dados:** MongoDB Atlas (NoSQL) para documentos flexíveis.
- **Storage:** Cloudinary para fotos, permitindo exclusão em cascata automatizada.

---

## 🔐 Variáveis de Ambiente

| Categoria | Variáveis |
|----------|----------|
| **Frontend** | `VITE_API_URL` |
| **Backend / BD** | `MONGODB_CONNECTION_STRING`, `MONGODB_DATABASE_NAME` |
| **Armazenamento** | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| **Autenticação** | `JWT_SECRET_KEY`, `JWT_ISSUER`, `JWT_AUDIENCE` |
| **Inteligência Artificial** | `GEMINI_API_KEY`, `OCR_SPACE_API_KEY` |
