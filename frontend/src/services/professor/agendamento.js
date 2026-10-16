const API_BASE = "http://localhost:8000/api/atendimentos";

export async function buscarAtendimentosProfessor(professor_matricula) {
    const response = await fetch(`${API_BASE}/professor/${professor_matricula}`);
    if (!response.ok) {
        throw new Error("Erro ao buscar atendimentos");
    }
    return response.json();
}

export async function cadastrarAtendimentoProfessor(dados) {
    const response = await fetch(`${API_BASE}/professor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
    });

    if (!response.ok) {
        const erro = await response.json().catch(() => ({}));
        throw new Error(erro.detail || "Erro ao cadastrar atendimento");
    }
    return response.json();
}

export async function buscarPerfilProfessor(matricula) {
    const response = await fetch(`${API_ROOT}/professores/perfil/${matricula}`);
    if (!response.ok) {
        throw new Error("Erro ao buscar perfil do professor");
    }
    return response.json();
}