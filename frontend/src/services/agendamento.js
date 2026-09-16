const API_BASE = "http://localhost:8000/api/atendimentos";

export async function buscarAtendimentos() {
    const response = await fetch(`${API_BASE})/aluno/${matricula}`);
    if (!response.ok) {
        throw new Error("Erro ao buscar atendimentos");
    }
    return response.json();
}

