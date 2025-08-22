import React from "react";

export default function Button({ text }) {
  return (
    <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
      {text}
    </button>
  );
}
