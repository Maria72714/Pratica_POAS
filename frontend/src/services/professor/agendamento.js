const API_BASE = "http://localhost:8000/api/atendimentos";

export async function buscarAtendimentosProfessor(professor_matricula) {
    const response = await fetch(`${API_BASE}/professor/${professor_matricula}`);
    if (!response.ok) {
        throw new Error("Erro ao buscar atendimentos");
    }
    return response.json();
}
