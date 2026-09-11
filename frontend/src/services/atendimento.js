const API_BASE = 'http://localhost:8000/api/atendimentos/'

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