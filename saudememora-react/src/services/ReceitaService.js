// ============================================================
// ReceitaService.js  —  passa pacienteId em getAll
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
 
const ReceitaService = {
  getAll: async () => {
    try {
      const pacienteId = getPacienteId();
      const params = pacienteId ? { pacienteId } : {};
      const response = await axiosInstance.get("/api/receitas", { params });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Erro ao buscar todas as receitas:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Erro ao buscar receitas!",
      };
    }
  },
 
  getById: async (id) => {
    try {
      const response = await axiosInstance.get(`/api/receitas/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`Erro ao buscar receita por ID ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || "Erro ao buscar receita!",
      };
    }
  },
 
  getReceitaByDocumentoId: async (documentoId) => {
    try {
      const response = await axiosInstance.get(`/api/receitas/documento/${documentoId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`Erro ao buscar receita pelo ID do documento ${documentoId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || "Erro ao buscar receita pelo ID do documento!",
      };
    }
  },
 
  create: async (receita) => {
    try {
      const response = await axiosInstance.post("/api/receitas", receita, {
        headers: { "Content-Type": "application/json" },
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Erro ao criar receita:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Erro ao criar receita!",
      };
    }
  },
 
  update: async (id, receita) => {
    try {
      const response = await axiosInstance.put(`/api/receitas/${id}`, receita);
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`Erro ao atualizar receita com ID ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || "Erro ao atualizar receita!",
      };
    }
  },
 
  delete: async (id) => {
    try {
      await axiosInstance.delete(`/api/receitas/${id}`);
      return { success: true, message: "Receita deletada com sucesso!" };
    } catch (error) {
      console.error(`Erro ao deletar receita com ID ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || "Erro ao deletar receita!",
      };
    }
  },
 
  createWithImage: async (formData) => {
    try {
      const response = await axiosInstance.post("/api/receitas", formData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Erro ao criar a receita.");
    }
  },
};
 
export default ReceitaService;