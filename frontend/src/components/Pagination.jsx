import React from "react";

export default function Pagination({
  paginaAtual,
  totalPaginas,
  onPageChange,
}) {
  const handlePrevious = () => {
    if (paginaAtual > 1) {
      onPageChange(paginaAtual - 1);
    }
  };

  const handleNext = () => {
    if (paginaAtual < totalPaginas) {
      onPageChange(paginaAtual + 1);
    }
  };

  // Não renderiza nada se só houver uma página ou nenhuma
  if (totalPaginas <= 1) {
    return null;
  }

  return (
    <div className="flex justify-between items-center mt-4 px-4 py-3 bg-white border-t border-gray-200 sm:px-6 rounded-b-lg">
      {/* Botão Anterior */}
      <div>
        <button
          onClick={handlePrevious}
          disabled={paginaAtual === 1}
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Anterior
        </button>
      </div>

      {/* Informação da Página */}
      <div className="hidden sm:block">
        <p className="text-sm text-gray-700">
          Página <span className="font-medium">{paginaAtual}</span> de{" "}
          <span className="font-medium">{totalPaginas}</span>
        </p>
      </div>

      {/* Botão Próximo */}
      <div>
        <button
          onClick={handleNext}
          disabled={paginaAtual === totalPaginas}
          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Próximo
        </button>
      </div>
    </div>
  );
}
