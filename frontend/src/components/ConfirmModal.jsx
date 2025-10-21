import Modal from "./Modal";

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div>
        <p className="text-gray-600">{message}</p>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-md hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-red-700"
          >
            Confirmar
          </button>
        </div>
      </div>
    </Modal>
  );
}
