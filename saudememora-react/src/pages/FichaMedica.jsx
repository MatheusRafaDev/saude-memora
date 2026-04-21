import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  cadastrarFichaMedica,
  buscarFichaMedica,
  atualizarFichaMedica,
} from "../services/FichaMedicaService";
import "../styles/pages/FichaMedica.css";

const perguntas = [
  {
    chave: "tratamento_medico",
    pergunta: "Em tratamento médico?",
    icone: "💊",
    mostrarExtra: true,
    extra: "Qual tratamento?",
    placeholder: "Descreva o tratamento...",
  },
  {
    chave: "gravida",
    pergunta: "Gestante?",
    icone: "🤰",
    mostrarExtra: true,
    extra: "Meses de gestação",
    placeholder: "Quantos meses?",
    dependeSexo: true,
  },
  {
    chave: "regime",
    pergunta: "Faz algum regime alimentar?",
    icone: "🥗",
    mostrarExtra: true,
    extra: "Qual regime?",
    placeholder: "Descreva o regime...",
  },
  {
    chave: "diabetes",
    pergunta: "Diabetes?",
    icone: "🩸",
    mostrarExtra: true,
    extra: "Tipo de diabetes",
    placeholder: "Tipo 1, Tipo 2, Gestacional...",
  },
  {
    chave: "alergias",
    pergunta: "Alergias?",
    icone: "🤧",
    mostrarExtra: true,
    extra: "Alergia a quê?",
    placeholder: "Ex: poeira, pólen, alimentos...",
  },
  {
    chave: "reumatica",
    pergunta: "Febre reumática?",
    icone: "🦴",
    mostrarExtra: false,
  },
  {
    chave: "coagulacao",
    pergunta: "Problemas de coagulação?",
    icone: "🩸",
    mostrarExtra: false,
  },
  {
    chave: "cardio",
    pergunta: "Doença cardiovascular?",
    icone: "❤️",
    mostrarExtra: true,
    extra: "Qual doença?",
    placeholder: "Ex: hipertensão, arritmia...",
  },
  {
    chave: "hemorragicos",
    pergunta: "Problemas hemorrágicos?",
    icone: "🩸",
    mostrarExtra: false,
  },
  {
    chave: "anestesia",
    pergunta: "Problemas com anestesia?",
    icone: "💉",
    mostrarExtra: true,
    extra: "Qual problema?",
    placeholder: "Descreva a reação...",
  },
  {
    chave: "alergia_medicamento",
    pergunta: "Alergia a medicamentos?",
    icone: "💊",
    mostrarExtra: true,
    extra: "Qual medicamento?",
    placeholder: "Ex: penicilina, dipirona...",
  },
  {
    chave: "hepatite",
    pergunta: "Histórico de hepatite?",
    icone: "🫀",
    mostrarExtra: true,
    extra: "Há quanto tempo?",
    placeholder: "Ex: 5 anos, 10 anos...",
  },
  {
    chave: "hiv",
    pergunta: "Portador de HIV?",
    icone: "🦠",
    mostrarExtra: false,
  },
  {
    chave: "drogas",
    pergunta: "Uso de drogas ilícitas?",
    icone: "🚫",
    mostrarExtra: false,
  },
  {
    chave: "fumante",
    pergunta: "Fumante ativo?",
    icone: "🚬",
    mostrarExtra: false,
  },
  {
    chave: "fumou",
    pergunta: "Ex-fumante?",
    icone: "🚭",
    mostrarExtra: false,
  },
  {
    chave: "pressao",
    pergunta: "Pressão arterial",
    icone: "📊",
    tipo: "pressao",
  },
  {
    chave: "respiratorio",
    pergunta: "Problemas respiratórios?",
    icone: "🫁",
    mostrarExtra: true,
    extra: "Qual problema?",
    placeholder: "Ex: asma, bronquite...",
  },
  {
    chave: "doenca_familia",
    pergunta: "Doenças hereditárias na família?",
    icone: "👨‍👩‍👧",
    mostrarExtra: true,
    extra: "Quais doenças?",
    placeholder: "Ex: diabetes, hipertensão, câncer...",
  },
];

const FichaMedica = () => {
  const [modo, setModo] = useState("visualizar"); 
  const [respostas, setRespostas] = useState({});
  const [mensagem, setMensagem] = useState("");
  const [mensagemTipo, setMensagemTipo] = useState("");
  const [isAtualizar, setIsAtualizar] = useState(false);
  const [ficha, setFicha] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();
  const paciente = JSON.parse(localStorage.getItem("paciente")) || {};

  const obterFicha = async () => {
    if (!paciente.id) return;

    setCarregando(true);
    try {
      const response = await buscarFichaMedica(paciente.id);
      if (response.success && response.data) {
        const fichaResponse = response.data;
        setFicha(fichaResponse);

        const novasRespostas = {
          tratamento_medico: fichaResponse.tratamentoMedico ? "SIM" : "NAO",
          tratamento_medico_extra: fichaResponse.tratamentoMedico
            ? fichaResponse.tratamentoMedicoExtra
            : "",
          gravida: fichaResponse.gravidez ? "SIM" : "NAO",
          gravida_extra: fichaResponse.gravidez
            ? fichaResponse.gravidezExtra
            : "",
          regime: fichaResponse.regime ? "SIM" : "NAO",
          regime_extra: fichaResponse.regime ? fichaResponse.regimeExtra : "",
          diabetes: fichaResponse.diabetes ? "SIM" : "NAO",
          diabetes_extra: fichaResponse.diabetes
            ? fichaResponse.diabetesExtra
            : "",
          alergias: fichaResponse.alergias ? "SIM" : "NAO",
          alergias_extra: fichaResponse.alergias
            ? fichaResponse.alergiasExtra
            : "",
          reumatica: fichaResponse.reumatica ? "SIM" : "NAO",
          coagulacao: fichaResponse.coagulacao ? "SIM" : "NAO",
          cardio: fichaResponse.doencaCardioVascular ? "SIM" : "NAO",
          cardio_extra: fichaResponse.doencaCardioVascular
            ? fichaResponse.doencaCardioVascularExtra
            : "",
          hemorragicos: fichaResponse.hemorragicos ? "SIM" : "NAO",
          anestesia: fichaResponse.problemasAnestesia ? "SIM" : "NAO",
          anestesia_extra: fichaResponse.problemasAnestesia
            ? fichaResponse.problemasAnestesiaExtra
            : "",
          alergia_medicamento: fichaResponse.alergiaMedicamentos
            ? "SIM"
            : "NAO",
          alergia_medicamento_extra: fichaResponse.alergiaMedicamentos
            ? fichaResponse.alergiaMedicamentosExtra
            : "",
          hepatite: fichaResponse.hepatite ? "SIM" : "NAO",
          hepatite_extra: fichaResponse.hepatite
            ? fichaResponse.hepatiteExtra
            : "",
          hiv: fichaResponse.hiv ? "SIM" : "NAO",
          drogas: fichaResponse.drogas ? "SIM" : "NAO",
          fumante: fichaResponse.fumante ? "SIM" : "NAO",
          fumou: fichaResponse.fumou ? "SIM" : "NAO",
          pressao: fichaResponse.pressao || "",
          respiratorio: fichaResponse.respiratorio ? "SIM" : "NAO",
          respiratorio_extra: fichaResponse.respiratorio
            ? fichaResponse.respiratorioExtra
            : "",
          doenca_familia: fichaResponse.doencaFamilia ? "SIM" : "NAO",
          doenca_familia_extra: fichaResponse.doencaFamilia
            ? fichaResponse.doencaFamiliaExtra
            : "",
        };

        setRespostas(novasRespostas);
        setIsAtualizar(true);
        setModo("visualizar");
      } else {
        setModo("editar");
      }
    } catch (error) {
      console.error("Erro ao buscar ficha:", error);
      setModo("editar");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    if (paciente.sexo && paciente.sexo.toLowerCase() === "m") {
      setRespostas((prev) => ({
        ...prev,
        gravida: "NAO",
        gravida_extra: "",
      }));
    }

    if (paciente?.id) {
      obterFicha();
    }
  }, [paciente.id]);

  const handleChange = (chave, valor) => {
    setRespostas((prev) => {
      const newRespostas = { ...prev, [chave]: valor };

      if (valor === "NAO") {
        const question = perguntas.find((q) => q.chave === chave);
        if (question?.mostrarExtra) {
          newRespostas[`${chave}_extra`] = "";
        }
      }

      return newRespostas;
    });
  };

  const handleExtraChange = (chave, valor) => {
    setRespostas((prev) => ({ ...prev, [`${chave}_extra`]: valor }));
  };

  const todosCamposPreenchidos = () => {
    return perguntas.every((item) => {
      if (item.dependeSexo && paciente.sexo?.toLowerCase() === "m") {
        return true;
      }

      const answer = respostas[item.chave];

      if (
        !answer ||
        (answer !== "SIM" && answer !== "NAO" && item.tipo !== "pressao")
      ) {
        return false;
      }

      if (item.tipo === "pressao") {
        return answer && answer !== "";
      }

      return true;
    });
  };

  const handleSalvar = async () => {
    if (!todosCamposPreenchidos()) {
      setMensagemTipo("error");
      setMensagem("⚠️ Preencha todos os campos obrigatórios antes de continuar.");
      setTimeout(() => setMensagem(""), 3000);
      return;
    }

    setCarregando(true);
    try {
      const dadosParaEnviar = { ...respostas };

      perguntas.forEach((item) => {
        if (item.mostrarExtra && dadosParaEnviar[item.chave] === "NAO") {
          delete dadosParaEnviar[`${item.chave}_extra`];
        }
      });

      const formData = new FormData();
      formData.append("respostas", JSON.stringify(dadosParaEnviar));
      formData.append("paciente", JSON.stringify(paciente));

      let response;
      if (!isAtualizar) {
        response = await cadastrarFichaMedica(formData);
      } else {
        response = await atualizarFichaMedica(ficha.id, formData);
      }

      if (response.success) {
        setMensagemTipo("success");
        setMensagem(
          isAtualizar
            ? "✅ Ficha atualizada com sucesso!"
            : "✅ Ficha cadastrada com sucesso!"
        );
        setModo("visualizar");
        await obterFicha();
        setTimeout(() => setMensagem(""), 3000);
      } else {
        setMensagemTipo("error");
        setMensagem(response.message || "❌ Erro ao processar a ficha.");
      }
    } catch (error) {
      console.error("Erro ao salvar ficha:", error);
      setMensagemTipo("error");
      setMensagem("❌ Ocorreu um erro ao salvar a ficha. Por favor, tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  const getProgresso = () => {
    const total = perguntas.filter(q => !(q.dependeSexo && paciente.sexo?.toLowerCase() === "m")).length;
    const respondidas = perguntas.filter(q => {
      if (q.dependeSexo && paciente.sexo?.toLowerCase() === "m") return false;
      const answer = respostas[q.chave];
      if (q.tipo === "pressao") return answer && answer !== "";
      return answer === "SIM" || answer === "NAO";
    }).length;
    return (respondidas / total) * 100;
  };

  const formatarResposta = (valor, extra) => {
    if (valor === true || valor === "true" || valor === "SIM")
      return extra ? `Sim (${extra})` : "Sim";
    if (valor === false || valor === "false" || valor === "NAO") return "Não";
    return valor || "Não informado";
  };

  // Dados para visualização
  const dadosSaude = [
    { pergunta: "Tratamento médico", valor: ficha?.tratamentoMedico, extra: ficha?.tratamentoMedicoExtra },
    { pergunta: "Grávida", valor: paciente.sexo === "F" ? ficha?.gravidez : null, extra: ficha?.gravidezExtra, condicional: paciente.sexo === "F" },
    { pergunta: "Faz regime", valor: ficha?.regime, extra: ficha?.regimeExtra },
    { pergunta: "Diabetes", valor: ficha?.diabetes, extra: ficha?.diabetesExtra },
    { pergunta: "Alergias", valor: ficha?.alergias, extra: ficha?.alergiasExtra },
    { pergunta: "Febre reumática", valor: ficha?.reumatica },
    { pergunta: "Problemas de coagulação", valor: ficha?.coagulacao },
    { pergunta: "Doença cardiovascular", valor: ficha?.doencaCardioVascular, extra: ficha?.doencaCardioVascularExtra },
    { pergunta: "Problemas hemorrágicos", valor: ficha?.hemorragicos },
    { pergunta: "Problemas com anestesia", valor: ficha?.problemasAnestesia, extra: ficha?.problemasAnestesiaExtra },
    { pergunta: "Alergia a medicamentos", valor: ficha?.alergiaMedicamentos, extra: ficha?.alergiaMedicamentosExtra },
    { pergunta: "Teve hepatite", valor: ficha?.hepatite, extra: ficha?.hepatiteExtra },
    { pergunta: "Portador do HIV", valor: ficha?.hiv },
    { pergunta: "Usa/Usou drogas", valor: ficha?.drogas },
    { pergunta: "Fumante", valor: ficha?.fumante },
    { pergunta: "Já fumou", valor: ficha?.fumou },
    { pergunta: "Pressão arterial", valor: ficha?.pressao, isText: true },
    { pergunta: "Problemas respiratórios", valor: ficha?.respiratorio, extra: ficha?.respiratorioExtra },
    { pergunta: "Doenças na família", valor: ficha?.doencaFamilia, extra: ficha?.doencaFamiliaExtra },
  ];

  return (
    <div className="ficha-container">
      <div className="ficha-card">
        {/* Header */}
        <div className="ficha-header">
          <h1 className="ficha-title">Ficha de Anamnese</h1>
          <p className="ficha-subtitle">
            {modo === "visualizar" 
              ? "Visualize suas informações médicas" 
              : isAtualizar 
                ? "Atualize suas informações médicas" 
                : "Preencha seus dados médicos"}
          </p>
        </div>

        {/* Botão de alternar modo */}
        {ficha && modo === "visualizar" && (
          <div className="ficha-toggle">
            <button className="btn-edit-mode" onClick={() => setModo("editar")}>
               Editar Ficha Médica
            </button>
          </div>
        )}

        {/* Barra de Progresso (apenas no modo edição) */}
        {modo === "editar" && (
          <div className="progress-section">
            <div className="progress-label">
              <span>Progresso do formulário</span>
              <span className="progress-percent">{Math.round(getProgresso())}%</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${getProgresso()}%` }}></div>
            </div>
          </div>
        )}

        {/* Mensagem de feedback */}
        {mensagem && (
          <div className={`ficha-message ficha-message--${mensagemTipo}`}>
            {mensagem}
          </div>
        )}

        {/* Modo Visualização */}
        {modo === "visualizar" && ficha && (
          <>
            <div className="paciente-info">
              <h3 className="section-title"> Dados do Paciente</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Nome:</span>
                  <span className="info-value">{paciente.nome || "Não informado"}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">CPF:</span>
                  <span className="info-value">{paciente.cpf || "Não informado"}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Nascimento:</span>
                  <span className="info-value">{paciente.dataNascimento || "Não informado"}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Sexo:</span>
                  <span className="info-value">
                    {paciente.sexo === "M" ? "Masculino" : paciente.sexo === "F" ? "Feminino" : "Outro"}
                  </span>
                </div>
              </div>
            </div>

            <div className="saude-info">
              <h3 className="section-title">🩺 Condições de Saúde</h3>
              <div className="saude-grid">
                {dadosSaude.map((item, idx) => {
                  if (item.condicional === false) return null;
                  const resposta = item.isText
                    ? item.valor || "Não informado"
                    : formatarResposta(item.valor, item.extra);

                  return (
                    <div key={idx} className="saude-item">
                      <span className="saude-pergunta">{item.pergunta}</span>
                      <span className="saude-resposta">{resposta}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Modo Edição */}
        {modo === "editar" && (
          <form className="ficha-form" onSubmit={(e) => e.preventDefault()}>
            <div className="perguntas-grid">
              {perguntas.map((item) => {
                if (item.dependeSexo && paciente.sexo?.toLowerCase() === "m") {
                  return null;
                }

                return (
                  <div key={item.chave} className="pergunta-card">
                    <div className="pergunta-header">
                      <span className="pergunta-texto">{item.pergunta}</span>
                    </div>

                    {item.tipo === "pressao" ? (
                      <select
                        className="form-select-custom"
                        value={respostas[item.chave] || ""}
                        onChange={(e) => handleChange(item.chave, e.target.value)}
                        required
                        disabled={carregando}
                      >
                        <option value="">Selecione</option>
                        <option value="NORMAL">Normal</option>
                        <option value="ALTA">Alta</option>
                        <option value="BAIXA">Baixa</option>
                      </select>
                    ) : (
                      <>
                        <div className="btn-group-custom">
                          <button
                            type="button"
                            className={`btn-option btn-sim ${respostas[item.chave] === 'SIM' ? 'active' : ''}`}
                            onClick={() => handleChange(item.chave, "SIM")}
                          >
                            Sim
                          </button>
                          <button
                            type="button"
                            className={`btn-option btn-nao ${respostas[item.chave] === 'NAO' ? 'active' : ''}`}
                            onClick={() => handleChange(item.chave, "NAO")}
                          >
                            Não
                          </button>
                        </div>

                        {item.mostrarExtra && respostas[item.chave] === "SIM" && (
                          <div className="extra-input-animated">
                            <label className="extra-label">{item.extra}</label>
                            <input
                              type="text"
                              className="extra-input-field"
                              value={respostas[`${item.chave}_extra`] || ""}
                              onChange={(e) => handleExtraChange(item.chave, e.target.value)}
                              disabled={carregando}
                              required
                              placeholder={item.placeholder || item.extra}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-submit"
                onClick={handleSalvar}
                disabled={!todosCamposPreenchidos() || carregando}
              >
                {carregando ? (
                  <>
                    <span className="spinner"></span>
                    {isAtualizar ? "Atualizando..." : "Salvando..."}
                  </>
                ) : isAtualizar ? (
                  " Atualizar Ficha Médica"
                ) : (
                  "💾 Salvar Ficha Médica"
                )}
              </button>
              
              {isAtualizar && (
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setModo("visualizar")}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        )}

        
      </div>
    </div>
  );
};

export default FichaMedica;