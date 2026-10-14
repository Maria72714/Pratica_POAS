const API_BASE = 'http://localhost:8000/api/solicitacao'

export async function cadastrarSolicitacao(dados){
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
    throw new Error("Erro ao cadastrar solicitação");
  }

  return response.json();
}

export async function buscarSolicitacoes(matricula) {
    const response = await fetch(`${API_BASE}/aluno/${matricula}`);
    if (!response.ok) {
        throw new Error("Erro ao buscar solicitações");
    }
    return response.json();
}

export async function editarSolicitacao(solicitacaoId, dadosAtualizados) {
    const response = await fetch(`${API_BASE}/${solicitacaoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosAtualizados),
    });

    if (!response.ok) {
        throw new Error("Erro ao editar solicitação");
    }
    return response.json();
}  

export async function excluirSolicitacao(solicitacaoId) {
    const response = await fetch(`${API_BASE}/${solicitacaoId}`, {
        method: "DELETE",
    });

    if (!response.ok) {
        throw new Error("Erro ao excluir solicitação");
    }

    return response.json();
}

export async function buscarSolicitacaoPorId(id) {
    const response = await fetch(
        `${API_BASE}/${id}`
    );

    if (!response.ok) {
        throw new Error("Erro ao buscar solicitação");
    }

    return response.json();
}
