import React, { useEffect, useState } from 'react';
import { buscarAtendimentosProfessor } from '../../services/professor/agendamento';


const DashboardProfessor = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const usuarioSalvo = localStorage.getItem('usuario');
  const suapSalvo = localStorage.getItem('suap_user');

  const usuario = usuarioSalvo
    ? JSON.parse(usuarioSalvo)
    : suapSalvo
      ? JSON.parse(suapSalvo)
      : null;

  const userName = usuario?.nome || 'Professor';

  const stats = [
    {
      titulo: 'Meus agendamentos',
      valor: appointments.length,
    },
  ];

  useEffect(() => {
    async function carregarAgendamentos() {
      try {
        setErro('');

        if (!usuario?.matricula) {
          setErro('Matrícula do professor não encontrada.');
          return;
        }

        const dados = await buscarAtendimentosProfessor(
          usuario.matricula
        );

        console.log(
          'Agendamentos do professor:',
          JSON.stringify(dados, null, 2)
        );

        setAppointments(Array.isArray(dados) ? dados : []);
      } catch (error) {
        console.error(
          'Erro ao buscar agendamentos do professor:',
          error
        );

        setErro('Não foi possível carregar os agendamentos.');
      } finally {
        setLoading(false);
      }
    }

    carregarAgendamentos();
  }, []);

  function formatarData(data) {
    if (!data) return 'Data não informada';

    // Evita que a data seja exibida no dia anterior
    // por causa da conversão de fuso horário.
    const [ano, mes, dia] = data.split('-');

    if (ano && mes && dia) {
      return `${dia}/${mes}/${ano}`;
    }

    return data;
  }

  function formatarTexto(texto) {
    if (!texto) return 'Não informado';

    return texto
      .toString()
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/\b\w/g, letra => letra.toUpperCase());
  }

  return (
    <div className="flex-1 min-h-screen bg-gray-50">

      {/* Banner de boas-vindas */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-900
        text-white mx-2 sm:mx-4 lg:mx-6 rounded-lg sm:rounded-xl
        mb-3 sm:mb-4 lg:mb-6 mt-2 sm:mt-3 lg:mt-4
        p-4 sm:p-6 lg:p-8">

        <h1 className="text-base sm:text-xl lg:text-2xl font-bold mb-2">
          Bem-vindo, {userName}!
        </h1>

        <p className="text-emerald-100 text-xs sm:text-sm lg:text-base">
          Acompanhe seus atendimentos e consulte os agendamentos
          vinculados a você.
        </p>
      </div>

      <div className="p-2 sm:p-3 lg:p-6">

        

        {/* Lista de agendamentos sem cards */}
        <div className="bg-white rounded-lg sm:rounded-xl
          shadow-sm border border-gray-100 overflow-hidden">

          
        <div className="px-4 py-5 sm:px-5 sm:py-6 border-b border-gray-100">
          <h2 className="text-base lg:text-lg font-bold text-gray-800 mb-2">
            Meus Agendamentos
          </h2>

          <p className="text-sm text-gray-500 leading-relaxed">
            Consulte os detalhes dos atendimentos agendados.
          </p>
        </div>


          <div className="p-3 sm:p-4">

            {loading ? (
              <p className="text-gray-500 text-sm py-4 text-center">
                Carregando agendamentos...
              </p>
            ) : erro ? (
              <p className="text-red-600 bg-red-50 rounded-lg p-4 text-sm">
                {erro}
              </p>
            ) : appointments.length === 0 ? (
              <p className="text-gray-500 text-sm py-6 text-center">
                Você ainda não possui agendamentos vinculados.
              </p>
            ) : (
              <div className="divide-y divide-gray-100">

                {appointments.map((atendimento) => (
                  <div
                    key={atendimento.id}
                    className="py-4 first:pt-2 last:pb-2
                      flex flex-col sm:flex-row sm:items-center
                      sm:justify-between gap-3"
                  >

                    {/* Informações principais */}
                    <div className="min-w-0 flex-1">

                      <h3 className="font-semibold text-gray-800
                        text-sm sm:text-base break-words">
                        {atendimento.assunto || 'Atendimento sem assunto'}
                      </h3>

                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        Atendimento #{atendimento.id}
                      </p>

                      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3
                        text-xs sm:text-sm text-gray-600">

                        <span className="inline-flex items-center gap-1">
                          <span aria-hidden="true"></span>
                          {formatarData(atendimento.data_atendimento)}
                        </span>

                        <span className="inline-flex items-center gap-1">
                          <span aria-hidden="true"></span>
                          {formatarTexto(atendimento.modalidade)}
                        </span>

                        <span className="inline-flex items-center gap-1">
                          <span aria-hidden="true"></span>
                          {formatarTexto(atendimento.tipo_atendimento)}
                        </span>

                      </div>
                    </div>

                    {/* Status */}
                    <div className="sm:text-right shrink-0">
                      <span className={`inline-flex items-center px-3 py-1
                        rounded-full text-xs font-semibold
                        ${
                          atendimento.status?.toUpperCase() === 'AGENDADO'
                            ? 'bg-emerald-100 text-emerald-700'
                            : atendimento.status?.toUpperCase() === 'CANCELADO'
                              ? 'bg-red-100 text-red-700'
                              : atendimento.status?.toUpperCase() === 'REALIZADO'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                        }`}>
                        {formatarTexto(atendimento.status)}
                      </span>
                    </div>

                  </div>
                ))}

              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardProfessor;
