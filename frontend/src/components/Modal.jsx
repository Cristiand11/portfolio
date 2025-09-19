export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    // Fundo translúcido (overlay)
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
      {/* Contêiner do Modal */}
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg m-4 z-50">
        {/* Cabeçalho do Modal */}
        <div className="flex justify-between items-center border-b p-4">
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            &times;
          </button>
        </div>

        {/* Corpo do Modal (onde o formulário irá entrar) */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
