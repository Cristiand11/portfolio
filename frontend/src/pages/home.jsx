import React from "react";
import Button from "../components/button";
import logo from "../assets/logo.svg";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <img src={logo} alt="Logo" className="w-32 h-32 mb-4" />
      <h1 className="text-3xl font-bold mb-4">Bem-vindo ao Portfolio</h1>
      <Button text="Clique aqui" />
    </div>
  );
}
