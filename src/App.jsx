import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";

import Dashboard from "./pages/Dashboard";

import Ventas from "./pages/Clientes/Ventas";
import Rentas from "./pages/Clientes/Rentas";
import Refacciones from "./pages/Clientes/Refacciones";

import Internos from "./pages/Mantenimientos/Internos";
import Externos from "./pages/Mantenimientos/Externos";
import Equipos from "./pages/Mantenimientos/Equipos";

import Recepcionequipos from "./pages/Recepcion/Recepcionequipos";

import Asistencias from "./pages/Administracion/Asistencias";
import Bitacorafleteros from "./pages/Administracion/Bitacorafleteros";
import GestionClientes from "./pages/Administracion/GestionClientes";
import ListaPrecios from "./pages/Administracion/ListaPrecios";
import ReporteHoras from "./pages/Administracion/ReporteHoras";
import GeneradorContratos from "./pages/Administracion/GeneradorContratos";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <Routes>

        <Route path="/login" element={<Login />} />

        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        <Route path="/ventas" element={<ProtectedRoute><Ventas /></ProtectedRoute>} />
        <Route path="/rentas" element={<ProtectedRoute><Rentas /></ProtectedRoute>} />
        <Route path="/refacciones" element={<ProtectedRoute><Refacciones /></ProtectedRoute>} />

        <Route path="/internos" element={<ProtectedRoute><Internos /></ProtectedRoute>} />
        <Route path="/externos" element={<ProtectedRoute><Externos /></ProtectedRoute>} />
        <Route path="/equipos" element={<ProtectedRoute><Equipos /></ProtectedRoute>} />

        <Route path="/recepcion" element={<ProtectedRoute><Recepcionequipos /></ProtectedRoute>} />

        <Route path="/asistencias" element={<ProtectedRoute><Asistencias /></ProtectedRoute>} />
        <Route path="/bitacora" element={<ProtectedRoute><Bitacorafleteros /></ProtectedRoute>} />
        <Route path="/clientes" element={<ProtectedRoute><GestionClientes /></ProtectedRoute>} />
        <Route path="/precios" element={<ProtectedRoute><ListaPrecios /></ProtectedRoute>} />
        <Route path="/horas" element={<ProtectedRoute><ReporteHoras /></ProtectedRoute>} />
        <Route path="/contratos" element={<ProtectedRoute><GeneradorContratos /></ProtectedRoute>} />

      </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;