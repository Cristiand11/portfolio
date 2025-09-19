import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children }) {
  const { token } = useAuth(); // Pega o token do nosso contexto

  if (!token) {
    // Se não houver token, redireciona para a página de seleção de perfil
    return <Navigate to="/selecionar-perfil" replace />;
  }

  // Se houver um token, renderiza o componente filho (a página protegida)
  return children;
}
