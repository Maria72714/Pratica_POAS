
export default function Historico(){

  const infoCA = {
    Total: 0,
    Concluídos: 0,
    Agendados: 0

  }

  const caData = {
    status: ["Agendado", "Concluído", "Cancelado"],
    tipos: ["TAL", "TAI"],
    modalidades: ["Pesencial", "Remoto", "Híbrido"]
  } 

  return (
    <div>
        <div className="bg-emerald-900 text-white font-sans rounded-xl m-[20px_20px_0_20px] px-5 py-8">
          <h1 className="text-3xl font-bold pb-1">Histórico de Atendimentos</h1>
          <p className="font-normal text-sm text-emerald-100">Todos os CA's em que você está ou esteve inscrito.</p>
        </div>

        <div className="m-[20px_20px_0_20px] grid grid-cols-3">
          {
            Object.entries(infoCA).map(([nome, valor]) => (
              <div className="bg-white py-5 mx-2 border rounded-2xl flex flex-col items-center font-sans shadow-sm">
                <p className={`font-bold text-2xl ${nome === 'Total' ? 'text-gray-800' : nome === 'Concluídos' ? 'text-green-600' : 'text-yellow-600'}`}>{valor}</p>
                <p className='opacity-50 text-[12px]'>{nome}</p>
              </div>
            ))
          }
        </div>

        <div className="mx-7 my-5 py-4 px-3 grid grid-cols-3 border rounded-xl bg-white text-sm">
          {
            Object.entries(caData).map(([nome, valor]) => (
              <select name="" id="" className="flex flex-col py-2 mx-2 border bg-white rounded-md p-2 shadow-sm focus:outline-none focus:border-green-600 focus:ring-[1px] focus:ring-green-600">
                <option value="">{nome === "modalidades" ? "Todas as modalidades" : `Todos os ${nome}`}</option>
                {
                  valor.map((data) => (
                    <option value="">{data}</option>
                  ))
                }
              </select>
            ))
          }
        </div>

        <div className="mx-7 my-5 border py-10 text-center text-gray-500 text-sm font-bold rounded-xl bg-white">
          Nenhum atendimento encontrado
        </div>

    </div>
  )
};