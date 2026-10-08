export default function CardEstatisticas( {stat, index} ) {
    return(
        <div key={index} className="bg-white rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 lg:p-4 border border-gray-100">
            <div className="flex flex-col gap-1">
            <p className="text-gray-600 text-xs font-medium leading-tight">{stat.label}</p>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">
                {stat.value}
            </p>
            </div>
        </div>
    )
}