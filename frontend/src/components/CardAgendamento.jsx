import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faCalendarDay, faLocationDot } from '@fortawesome/free-solid-svg-icons';

export default function CardAgendamento({ appointment, index }) {
  if (!appointment) {
    return (
      <p className="text-gray-500 text-xs text-center py-6">
        Nenhum agendamento no momento
      </p>
    );
  }

  const dataFormatada = appointment.data_atendimento
    ? new Date(
        `${appointment.data_atendimento}T12:00:00`
      ).toLocaleDateString('pt-BR')
    : 'Data não informada';

  const status = appointment.status || 'Status não informado';

  const statusColor =
    status.toLowerCase() === 'agendado'
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-gray-100 text-gray-700';

  const local = appointment.id_sala
    ? `Sala ${appointment.id_sala}`
    : appointment.modalidade || 'Local não informado';

  return (
    <div className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-white hover:shadow-sm transition-shadow">
      <div className="flex flex-col gap-2">
        <div>
          <h3 className="font-semibold text-gray-800 text-xs sm:text-sm mb-1">
            {appointment.assunto ||
              appointment.tipo_atendimento ||
              'Atendimento'}
          </h3>

          <p className="text-gray-600 text-xs mb-2">
            {appointment.id_professor
              ? `Professor ID: ${appointment.id_professor}`
              : 'Professor não informado'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <FontAwesomeIcon
              icon={faClock}
              className="w-3 h-3 text-gray-400"
            />
            <span>
              {appointment.horario || 'Horário não informado'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <FontAwesomeIcon
              icon={faCalendarDay}
              className="w-3 h-3 text-gray-400"
            />
            <span>{dataFormatada}</span>
          </div>

          <div className="flex items-center gap-1 col-span-2">
            <FontAwesomeIcon
              icon={faLocationDot}
              className="w-3 h-3 text-gray-400"
            />
            <span className="truncate">{local}</span>
          </div>
        </div>

        <div className="flex justify-start pt-1">
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${statusColor}`}
          >
            {status}
          </span>
        </div>
      </div>
    </div>
  );
}