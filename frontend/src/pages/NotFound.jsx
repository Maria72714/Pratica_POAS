import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <img
            src="/images/logo_verde_pratica_vetorizada.png"
            alt="pratiCA"
            className="w-16 h-auto object-contain"
          />
        </div>

        <div className="space-y-2">
          <p className="text-6xl font-extrabold text-emerald-800">404</p>
          <h1 className="text-2xl font-bold text-gray-900">Página não encontrada</h1>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            A página que você está procurando não existe ou foi movida.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-emerald-800 text-white font-medium text-sm hover:bg-emerald-900 transition-colors shadow-sm"
          >
            Voltar para o início
          </Link>
        </div>
      </div>
    </div>
  );
}