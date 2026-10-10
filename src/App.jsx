import "./App.css";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import Login from "./pages/Login";
import EquipoQR from "./pages/EquipoQR";
import FotosChecklist from "./pages/FotosChecklist";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";

import Dashboard from "./pages/Dashboard";

import Ventas from "./pages/Clientes/Ventas";
import Rentas from "./pages/Clientes/Rentas";
import Refacciones from "./pages/Clientes/Refacciones";

import Internos from "./pages/Mantenimientos/Internos";
import Externos from "./pages/Mantenimientos/Externos";
import Equipos from "./pages/Mantenimientos/Equipos";
import Alquileres from "./pages/Mantenimientos/Alquileres";

import Recepcionequipos from "./pages/Recepcion/Recepcionequipos";

import Asistencias from "./pages/Administracion/Asistencias";
import Bitacorafleteros from "./pages/Administracion/Bitacorafleteros";
import GestionClientes from "./pages/Administracion/Gestionclientes";
import ListaPrecios from "./pages/Administracion/ListaPrecios";
import ReporteHoras from "./pages/Administracion/ReporteHoras";
import GeneradorContratos from "./pages/Administracion/GeneradorContratos";
import OrdenesCompra from "./pages/Administracion/OrdenesCompra";
import ChatFlotante from "./components/ChatFlotante";
import CargasDiesel from "./pages/Administracion/CargasDiesel";
import PersonalNuevo from "./pages/Administracion/PersonalNuevo";
import Tareas from "./pages/Operaciones/Tareas";

// al cambiar de apartado, la página nueva empieza arriba (no donde se quedó la anterior)
function ArribaAlNavegar() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <ArribaAlNavegar />
      <AuthProvider>
      <Routes>

        <Route path="/login" element={<Login />} />
        <Route path="/e/:token" element={<EquipoQR />} />
        <Route path="/fotos/:token" element={<FotosChecklist />} />

        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        <Route path="/ventas" element={<ProtectedRoute><Ventas /></ProtectedRoute>} />
        <Route path="/rentas" element={<ProtectedRoute><Rentas /></ProtectedRoute>} />
        <Route path="/refacciones" element={<ProtectedRoute><Refacciones /></ProtectedRoute>} />

        <Route path="/internos" element={<ProtectedRoute><Internos /></ProtectedRoute>} />
        <Route path="/externos" element={<ProtectedRoute><Externos /></ProtectedRoute>} />
        <Route path="/equipos" element={<ProtectedRoute><Equipos /></ProtectedRoute>} />
        <Route path="/alquileres" element={<ProtectedRoute><Alquileres /></ProtectedRoute>} />

        <Route path="/recepcion" element={<ProtectedRoute><Recepcionequipos /></ProtectedRoute>} />

        <Route path="/asistencias" element={<ProtectedRoute><Asistencias /></ProtectedRoute>} />
        <Route path="/bitacora" element={<ProtectedRoute><Bitacorafleteros /></ProtectedRoute>} />
        <Route path="/clientes" element={<ProtectedRoute><GestionClientes /></ProtectedRoute>} />
        <Route path="/precios" element={<ProtectedRoute><ListaPrecios /></ProtectedRoute>} />
        <Route path="/horas" element={<ProtectedRoute><ReporteHoras /></ProtectedRoute>} />
        <Route path="/contratos" element={<ProtectedRoute><GeneradorContratos /></ProtectedRoute>} />
        <Route path="/ordenes" element={<ProtectedRoute><OrdenesCompra /></ProtectedRoute>} />
        <Route path="/diesel" element={<ProtectedRoute><CargasDiesel /></ProtectedRoute>} />
        <Route path="/personal" element={<ProtectedRoute><PersonalNuevo /></ProtectedRoute>} />
        <Route path="/tareas" element={<ProtectedRoute><Tareas /></ProtectedRoute>} />

      </Routes>
      {/* chat del equipo y actividad en vivo: se muestra solo con sesión iniciada */}
      <ChatFlotante />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;