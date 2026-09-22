import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext(null);

export const PALETA_COLORES = [
  { clave: "azul", nombre: "Azul", valor: "#1d5c8f", oscuro: "#154970" },
  { clave: "gris", nombre: "Gris", valor: "#52525b", oscuro: "#3f3f46" },
  { clave: "naranja", nombre: "Naranja", valor: "#c2660c", oscuro: "#9a5109" },
  { clave: "verde", nombre: "Verde", valor: "#1f8b4c", oscuro: "#166838" },
  { clave: "rojoclaro", nombre: "Rojo claro", valor: "#c0394f", oscuro: "#9c2d3f" }
];

function aplicarColor(clave) {
  const c = PALETA_COLORES.find((p) => p.clave === clave) || PALETA_COLORES[0];
  document.documentElement.style.setProperty("--acento", c.valor);
  document.documentElement.style.setProperty("--acento-oscuro", c.oscuro);
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargarPerfil = useCallback(async (sesion) => {
    if (!sesion) {
      setProfile(null);
      setCargando(false);
      aplicarColor(null);
      return;
    }
    const { data } = await supabase
      .from("perfiles")
      .select("*")
      .eq("id", sesion.user.id)
      .maybeSingle();
    const p = data || { id: sesion.user.id, rol: "vendedor" };
    setProfile(p);
    aplicarColor(p.color_acento);
    setCargando(false);
  }, []);

  useEffect(() => {
    let activo = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!activo) return;
      setSession(data.session);
      cargarPerfil(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, sesion) => {
        if (!activo) return;
        setSession(sesion);
        setCargando(true);
        cargarPerfil(sesion);
      }
    );

    return () => {
      activo = false;
      listener.subscription.unsubscribe();
    };
  }, [cargarPerfil]);

  async function actualizarPerfil(cambios) {
    if (!session) return false;
    const { error } = await supabase
      .from("perfiles")
      .update(cambios)
      .eq("id", session.user.id);
    if (error) {
      alert("No se pudo guardar: " + error.message);
      return false;
    }
    setProfile((p) => {
      const nuevo = { ...p, ...cambios };
      if (cambios.color_acento !== undefined) aplicarColor(nuevo.color_acento);
      return nuevo;
    });
    return true;
  }

  const isAdmin = profile?.rol === "admin";

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user || null,
        profile,
        isAdmin,
        cargando,
        actualizarPerfil
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
