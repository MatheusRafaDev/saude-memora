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
- Filtros combinados para tipo, status e período.
- Busca por título, nome do médico, clínica e conteúdo extraído.

**5. Ficha Médica (Anamnese)**
- Cadastro detalhado de histórico familiar, cirurgias, doador de órgãos, tipo sanguíneo e hábitos.
- Bloqueio inteligente: Novos usuários são convidados a preencher a anamnese para popular os alertas do sistema.

**6. Experiência de Usuário (UX)**
- Interface responsiva, suporte a tema noturno e avisos para acompanhar o processamento e corrigir os dados extraídos.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React + Vite, TailwindCSS (Vanilla UI), React Query (Cache e mutations), Wouter.
- **Backend:** C# ASP.NET Core 9 Minimal API.
- **Inteligência Artificial:** OCR.Space (Leitura ótica de textos complexos) + Gemini (Interpretação e extração estruturada json).
- **Banco de Dados:** MongoDB para dados da aplicação.
- **Storage:** Cloudinary para arquivos enviados, quando configurado.

---

## ⚕️ Uso responsável e privacidade

O SaúdeMemora organiza documentos e informações fornecidas pelo usuário. Não é um serviço de diagnóstico ou aconselhamento médico, não substitui avaliação profissional e não deve ser usado para decisões clínicas ou emergências. Em uma emergência, procure os serviços de emergência locais.

Arquivos e dados de saúde são sensíveis. Conforme as integrações habilitadas, o processamento pode envolver Cloudinary para arquivos, OCR.Space/Groq para OCR, Google Gemini para interpretação e Brevo para e-mail. MongoDB guarda os dados estruturados. Confirme os fluxos, contratos, localização e políticas de retenção dos fornecedores da sua implantação; atualize os avisos de privacidade/consentimento com a configuração real e valide requisitos legais e de segurança aplicáveis antes do uso. A aplicação não é, por si só, certificação de conformidade legal ou clínica. Não use dados reais em desenvolvimento ou demonstrações.

