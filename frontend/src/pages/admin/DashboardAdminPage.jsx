import { useState, useEffect } from "react";
import { getDashboardStats } from "../../services/adminService";
import toast from "react-hot-toast";
import { useOutletContext } from "react-router-dom";

export default function DashboardAdminPage() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { setPageTitle } = useOutletContext();

  useEffect(() => {
    setPageTitle("Meu Dashboard");
  }, [setPageTitle]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getDashboardStats();
        setStats(response.data);
      } catch (err) {
        toast.error("Não foi possível carregar as estatísticas.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return <div>Carregando dashboard...</div>;
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card de Médicos Ativos */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-600">
            Médicos Ativos
          </h2>
          <p className="text-4xl font-bold text-indigo-600 mt-2">
            {stats?.totalMedicosAtivos ?? 0}
          </p>
        </div>

        {/* Card de Solicitações Recentes */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-600">
            Solicitações de Inativação (Últimos 5 dias úteis)
          </h2>
          <p className="text-4xl font-bold text-yellow-600 mt-2">
            {stats?.solicitacoesRecentes ?? 0}
          </p>
        </div>
      </div>
    </div>
  );
}
