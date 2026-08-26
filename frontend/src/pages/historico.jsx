export default function Historico(){

  const infoCA = {
    Total: 0,
    Concluídos: 0,
    Agendados: 0

  }

  return (
    <div>
        <div className="bg-emerald-900 text-white font-sans rounded-xl m-[20px_20px_0_20px] px-5 py-8">
          <h1 className="text-3xl font-bold pb-1">Histórico de Atendimentos</h1>
          <p className="font-normal text-sm text-emerald-100">Todos os CA's em que você está ou esteve inscrito.</p>
        </div>

        <div className="border m-[20px_20px_0_20px] py-8 grid grid-cols-3">
          {
            Object.entries(infoCA).map(([nome, valor]) => (
              <div className="bg-white py-4 mx-2 border flex flex-col items-center font-sans">
                <p className={`font-bold text-xl ${nome === 'Total' ? 'text-gray-800' : nome === 'Concluídos' ? 'text-green-600' : 'text-yellow-600'}`}>{valor}</p>
                <p className='opacity-50 text-md'>{nome}</p>
              </div>
            ))
          }
        </div>
    </div>
  )
};