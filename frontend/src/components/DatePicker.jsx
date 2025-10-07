import { useState, useEffect, useRef } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

export default function DatePicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const datepickerRef = useRef(null);

  const handleDateChange = (date) => {
    onChange(date);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        datepickerRef.current &&
        !datepickerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={datepickerRef}>
      <input
        type="text"
        readOnly
        value={
          value
            ? new Date(value).toLocaleDateString("pt-BR", { timeZone: "UTC" })
            : ""
        }
        onClick={() => setIsOpen(!isOpen)}
        placeholder="Selecione uma data"
        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 cursor-pointer focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
      />
      {isOpen && (
        <div className="absolute top-full mt-2 z-20 bg-white border rounded-lg shadow-lg">
          <Calendar
            onChange={handleDateChange}
            value={value ? new Date(value) : null}
            locale="pt-BR"
          />
        </div>
      )}
    </div>
  );
}
