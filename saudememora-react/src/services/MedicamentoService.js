// ============================================================
// MedicamentoService.js  —  passa pacienteId em todas as chamadas
// ============================================================
import axiosInstance from "../axiosConfig";

const getPacienteId = () => {
  try {
    const p = JSON.parse(localStorage.getItem("paciente") || "{}");
    return p?.id ?? null;
  } catch {
    return null;
  }
};

const MedicamentoService = {
  getAll: async () => {
    try {
      const pacienteId = getPacienteId();
      const params = pacienteId ? { pacienteId } : {};
      const response = await axiosInstance.get("/api/medicamentos", { params });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Erro ao buscar medicamentos:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Erro ao buscar medicamentos!",
      };
    }
  },

  getById: async (id) => {
    try {
      const response = await axiosInstance.get(`/api/medicamentos/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`Erro ao buscar medicamento ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || "Erro ao buscar medicamento!",
      };
    }
  },

  getMedicamentosByReceitaId: async (receitaId) => {
    try {
      const response = await axiosInstance.get(`/api/medicamentos/receita/${receitaId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`Erro ao buscar medicamentos pela receita ID ${receitaId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || "Erro ao buscar medicamentos pela receita!",
      };
    }
  },

  create: async (medicamento) => {
    try {
      const response = await axiosInstance.post("/api/medicamentos", medicamento);
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Erro ao criar medicamento:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Erro ao criar medicamento!",
      };
    }
  },

  update: async (id, medicamento) => {
    try {
      const response = await axiosInstance.put(`/api/medicamentos/${id}`, medicamento);
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`Erro ao atualizar medicamento ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || "Erro ao atualizar medicamento!",
      };
    }
  },

  delete: async (id) => {
    try {
      await axiosInstance.delete(`/api/medicamentos/${id}`);
      return { success: true, message: "Medicamento deletado com sucesso!" };
    } catch (error) {
      console.error(`Erro ao deletar medicamento ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || "Erro ao deletar medicamento!",
      };
    }
  },
};

export default MedicamentoService;