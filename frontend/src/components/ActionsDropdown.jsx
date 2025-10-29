import { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";

export default function ActionsDropdown({ actions }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPositionStyles, setMenuPositionStyles] = useState({});
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Função para calcular a posição
  const calculatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const menuHeightEstimate = actions.length * 35 + 20;

      let top, bottom;
      let transformOrigin;

      // Decide se abre para cima ou para baixo
      if (spaceBelow < menuHeightEstimate && spaceAbove > spaceBelow) {
        // Abre para cima
        bottom = window.innerHeight - rect.top + 8;
        transformOrigin = "bottom right";
      } else {
        // Abre para baixo (padrão)
        top = rect.bottom + 8;
        transformOrigin = "top right";
      }

      // Define os estilos inline para posicionamento absoluto relativo à janela
      setMenuPositionStyles({
        position: "fixed",
        top: top !== undefined ? `${top}px` : "auto",
        bottom: bottom !== undefined ? `${bottom}px` : "auto",
        right: `${window.innerWidth - rect.right}px`,
        transformOrigin: transformOrigin,
        zIndex: 50,
      });
    }
  };

  const toggleDropdown = () => {
    if (!isOpen) {
      calculatePosition();
    }
    setIsOpen(!isOpen);
  };

  // Recalcula posição se a janela for redimensionada enquanto aberto
  useEffect(() => {
    if (isOpen) {
      const handleResize = () => calculatePosition();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [isOpen]);

  // Fecha com clique fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (!actions || actions.length === 0) {
    return (
      <div className="relative inline-block text-left">
        <button
          type="button"
          disabled
          className="inline-flex justify-center w-full rounded-md border border-gray-300 px-4 py-2 bg-gray-50 text-sm font-medium text-gray-400 cursor-not-allowed"
        >
          Ações
          <svg
            className="-mr-1 ml-2 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    );
  }

  const DropdownMenu = () => (
    <div
      // Aplica os estilos de posição calculados
      style={menuPositionStyles}
      // Classes de aparência (ajuste a largura se necessário)
      className={`w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5`}
      //onClick={(e) => e.stopPropagation()} // Impede que clique no menu feche ele mesmo (se necessário)
    >
      <div className="py-1" role="menu" aria-orientation="vertical">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => {
              action.onClick();
              setIsOpen(false);
            }}
            className={`${
              action.className || "text-gray-700"
            } w-full text-left block px-4 py-2 text-sm hover:bg-gray-100`}
            role="menuitem"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div>
        <button
          ref={buttonRef}
          type="button"
          onClick={toggleDropdown}
          className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
        >
          Ações
          <svg
            className="-mr-1 ml-2 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div
          className={`absolute right-0 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20 ${menuPositionStyles}`}
        >
          <div
            className="py-1"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="options-menu"
          >
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                className={`${
                  action.className || "text-gray-700"
                } w-full text-left block px-4 py-2 text-sm hover:bg-gray-100`}
                role="menuitem"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
