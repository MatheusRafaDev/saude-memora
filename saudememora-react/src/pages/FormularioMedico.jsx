import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/FormularioMedico.css";

import { useNavigate } from "react-router-dom";
import {
  cadastrarFichaMedica,
  buscarFichaMedica,
  atualizarFichaMedica,
} from "../services/FichaMedicaService";

const perguntas = [
  {
    chave: "tratamento_medico",
    pergunta: "Está em tratamento médico?",
    mostrarExtra: true,
    extra: "Qual tratamento?",
  },
  {
    chave: "gravida",
    pergunta: "Está grávida?",
    mostrarExtra: true,
    extra: "Quantos meses?",
    dependeSexo: true,
  },
  {
    chave: "regime",
    pergunta: "Está fazendo algum regime?",
    mostrarExtra: true,
    extra: "Qual regime?",
  },
  {
    chave: "diabetes",
    pergunta: "Possui diabetes?",
    mostrarExtra: true,
    extra: "Tipo de diabetes?",
  },
  {
    chave: "alergias",
    pergunta: "Tem alergias?",
    mostrarExtra: true,
    extra: "A que?",
  },
  {
    chave: "reumatica",
    pergunta: "Teve febre reumática?",
    mostrarExtra: false,
  },
  {
    chave: "coagulacao",
    pergunta: "Tem problemas de coagulação?",
    mostrarExtra: false,
  },
  {
    chave: "cardio",
    pergunta: "Possui doença cárdio vascular?",
    mostrarExtra: true,
    extra: "Qual doença?",
  },
  {
    chave: "hemorragicos",
    pergunta: "Tem problemas hemorrágicos?",
    mostrarExtra: false,
  },
  {
    chave: "anestesia",
    pergunta: "Já teve problemas com anestesia?",
    mostrarExtra: true,
    extra: "Qual problema?",
  },
  {
    chave: "alergia_medicamento",
    pergunta: "Tem alergia a medicamentos?",
    mostrarExtra: true,
    extra: "A qual medicamento?",
  },
  {
    chave: "hepatite",
    pergunta: "Já teve hepatite?",
    mostrarExtra: true,
    extra: "Há quanto tempo?",
  },
  {
    chave: "hiv",
    pergunta: "É portador do vírus HIV?",
    mostrarExtra: false,
  },
  {
    chave: "drogas",
    pergunta: "Usa ou já usou drogas?",
    mostrarExtra: false,
  },
  {
    chave: "fumante",
    pergunta: "É fumante?",
    mostrarExtra: false,
  },
  {
    chave: "fumou",
    pergunta: "Já fumou?",
    mostrarExtra: false,
  },
  {
    chave: "pressao",
    pergunta: "Como está sua pressão arterial?",
    tipo: "pressao",
  },
  {
    chave: "respiratorio",
    pergunta: "Tem problemas respiratórios?",
    mostrarExtra: true,
    extra: "Qual problema?",
  },
  {
    chave: "doenca_familia",
    pergunta: "Possui doenças na família?",
    mostrarExtra: true,
    extra: "Quais doenças?",
  },
];

const FormularioMedico = () => {
  const [respostas, setRespostas] = useState({});
  const [mensagem, setMensagem] = useState("");
  const [isAtualizar, setIsAtualizar] = useState(false);
  const navigate = useNavigate();
  const paciente = JSON.parse(localStorage.getItem("paciente")) || {};
  const [ficha, setFicha] = useState(null);
  const [carregando, setCarregando] = useState(false);

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
      }
    } catch (error) {
      console.error("Erro ao buscar ficha:", error);
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

  const handleFinalizar = async () => {
    if (!todosCamposPreenchidos()) {
      setMensagem("Preencha todos os campos obrigatórios antes de continuar.");
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
        setMensagem(
          isAtualizar
            ? "Ficha atualizada com sucesso!"
            : "Ficha cadastrada com sucesso!"
        );

        if (!isAtualizar) {

          navigate("/home");
        } else {
          navigate("/formulario-medico");
        }
      } else {
        setMensagem(response.message || "Erro ao processar a ficha.");
      }
    } catch (error) {
      console.error("Erro ao salvar ficha:", error);
      setMensagem(
        "Ocorreu um erro ao salvar a ficha. Por favor, tente novamente."
      );
    } finally {
      setCarregando(false);
    }
  };


  return (
    <div className="formulario-medico">

      <div className="container">
        <div className="saude-card">
          <h4 className="text-center">Formulário Médico (Anamnese)</h4>

          <form>
            {perguntas.map((item) => {
              if (item.dependeSexo && paciente.sexo?.toLowerCase() === "m") {
                return null;
              }

              return (
                <div key={item.chave} className="pergunta-item">
                  <div className="pergunta-texto">{item.pergunta}</div>

                  {item.tipo === "pressao" ? (
                    <select
                      className="form-select"
                      value={respostas[item.chave] || ""}
                      onChange={(e) =>
                        handleChange(item.chave, e.target.value)
                      }
                      required
                      disabled={carregando}
                    >
                      <option value="">Selecione</option>
                      <option value="NORMAL">NORMAL</option>
                      <option value="ALTA">ALTA</option>
                      <option value="BAIXA">BAIXA</option>
                    </select>
                  ) : (
                    <>
                      <div className="btn-group-toggle">
                        <button
                          type="button"
                          className={`btn-option ${respostas[item.chave] === 'SIM' ? 'active' : ''}`}
                          onClick={() => handleChange(item.chave, "SIM")}
                        >
                          Sim
                        </button>

                        <button
                          type="button"
                          className={`btn-option ${respostas[item.chave] === 'NAO' ? 'active' : ''}`}
                          onClick={() => handleChange(item.chave, "NAO")}
                        >
                          Não
                        </button>
                      </div>

                      {item.mostrarExtra && respostas[item.chave] === "SIM" && (
                        <div className="extra-input">
                          <div className="input-group-compact">
                            <span className="input-group-text">{item.extra}</span>
                            <input
                              type="text"
                              className="form-control"
                              value={respostas[`${item.chave}_extra`] || ""}
                              onChange={(e) => handleExtraChange(item.chave, e.target.value)}
                              disabled={carregando}
                              required
                              placeholder={item.extra.toLowerCase()}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}

            {mensagem && (
              <div className={`alert ${mensagem.includes("sucesso") ? "alert-success" : "alert-danger"}`}>
                {mensagem}
              </div>
            )}

            <div className="d-flex justify-content-center mt-4">
              <button
                type="button"
                className={`btn btn-primary px-4 ${carregando ? 'loading-state' : ''}`}
                style={{ minWidth: '200px' }}
                onClick={handleFinalizar}
                disabled={!todosCamposPreenchidos() || carregando}
              >
                {carregando ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    {isAtualizar ? "Atualizando..." : "Salvando..."}
                  </>
                ) : isAtualizar ? (
                  "Atualizar Ficha Médica"
                ) : (
                  "Salvar Ficha Médica"
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default FormularioMedico;