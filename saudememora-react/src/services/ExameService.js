import axiosInstance from "../axiosConfig";

const getPacienteId = () => {
  try {
    const p = JSON.parse(localStorage.getItem("paciente") || "{}");
    return p?.id ?? null;
  } catch {
    return null;
  }
};

const ExameService = {
  // Buscar todos os exames



  getAll: async () => {
    try {
      const pacienteId = getPacienteId();
      const params = pacienteId ? { pacienteId } : {};
      const response = await axiosInstance.get("/api/exames", { params });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Erro ao buscar todos os exames:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Erro ao buscar exames!",
      };
    }
  },

  // Buscar exame por ID
  getById: async (id) => {
    try {
      const response = await axiosInstance.get(`/api/exames/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`Erro ao buscar exame por ID ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || "Erro ao buscar exame!",
      };
    }
  },

  // Buscar exame por ID do documento
  getExameByDocumentoId: async (documentoId) => {
    try {
      const response = await axiosInstance.get(`/api/exames/documento/${documentoId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`Erro ao buscar exame pelo ID do documento ${documentoId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || "Erro ao buscar exame pelo ID do documento!",
      };
    }
  },

  // Criar um novo exame
  create: async (exame) => {
    try {

      const response = await axiosInstance.post("/api/exames", exame, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Erro ao criar exame:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Erro ao criar exame!",
      };
    }
  },

  // Criar exame com imagem
  createWithImage: async (formData) => {

    try {
      const response = await axiosInstance.post("/api/exames", formData);
      return response;


    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Erro ao criar o exame."
      );
    }
  },

  // Atualizar exame existente
  update: async (id, exame) => {
    try {
      const response = await axiosInstance.put(`/api/exames/${id}`, exame);
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`Erro ao atualizar exame com ID ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || "Erro ao atualizar exame!",
      };
    }
  },

  // Deletar exame por ID
  delete: async (id) => {
    try {
      await axiosInstance.delete(`/api/exames/${id}`);
      return { success: true, message: "Exame deletado com sucesso!" };
    } catch (error) {
      console.error(`Erro ao deletar exame com ID ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || "Erro ao deletar exame!",
      };
    }
  },
};

export default ExameService;
