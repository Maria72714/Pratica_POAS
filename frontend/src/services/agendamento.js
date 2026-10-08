const API_BASE = "http://localhost:8000/api/atendimentos";

export async function buscarAtendimentos(matricula) {
    const response = await fetch(`${API_BASE}/aluno/${matricula}`);
    if (!response.ok) {
        throw new Error("Erro ao buscar atendimentos");
    }
    return response.json();
}

export async function buscarAtendimentoPorId(id) {
    const response = await fetch(
        `${API_BASE}/${id}`
    );

    if (!response.ok) {
        throw new Error("Erro ao buscar atendimento");
    }

    return response.json();
}

export async function excluirAtendimento(atendimentoId) {
    const response = await fetch(`${API_BASE}/${atendimentoId}`, {
        method: "DELETE",
    });

    if (!response.ok) {
        throw new Error("Erro ao excluir atendimento");
    }

    return response.json();
}

export async function editarAtendimento(atendimentoId, dadosAtualizados) {
    const response = await fetch(`${API_BASE}/${atendimentoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosAtualizados),
    });

    if (!response.ok) {
        throw new Error("Erro ao editar atendimento");
    }
    return response.json();
}  

export async function cadastrarAtendimento(dados){
  const response = await fetch(
    API_BASE,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(dados),
    }
  );

  if (!response.ok){
    throw new Error("Erro ao cadastrar atendimento");
  }

  return response.json();
}
