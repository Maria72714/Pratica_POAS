export default function CardAgendamento({ appointment, index }) {
  if (!appointment) {
    return (
      <p className="text-gray-500 text-xs text-center py-6">
        Nenhum agendamento no momento
      </p>
    );
  }

  return (
    <div
      key={index}
      className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-white hover:shadow-sm transition-shadow"
    >
      <div className="flex flex-col gap-2">
        <div>
          <h3 className="font-semibold text-gray-800 text-xs sm:text-sm mb-1">
            {appointment.subject}
          </h3>
          <p className="text-gray-600 text-xs mb-2">{appointment.professor}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <svg
              className="w-3 h-3 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{appointment.time}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg
              className="w-3 h-3 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>{appointment.date}</span>
          </div>
          <div className="flex items-center gap-1 col-span-2">
            <svg
              className="w-3 h-3 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
            </svg>
            <span className="truncate">{appointment.location}</span>
          </div>
        </div>

        <div className="flex justify-start pt-1">
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${appointment.statusColor}`}
          >
            {appointment.status}
          </span>
        </div>
      </div>
    </div>
  );
}
