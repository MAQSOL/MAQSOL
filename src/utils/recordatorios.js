/*
 * Recordatorios automáticos (estilo notificación de YouTube).
 * dias: 0 = domingo, 1 = lunes … 6 = sábado.  hora: "HH:MM" (hora local).
 * Para agregar o cambiar uno, basta con editar esta lista.
 */
export const RECORDATORIOS = [
  {
    id: "asistencia-diaria",
    dias: [1, 2, 3, 4, 5],
    hora: "09:00",
    titulo: "Registrar asistencias",
    cuerpo: "Recuerda registrar las asistencias de hoy.",
    url: "/asistencias"
  },
  {
    id: "asistencia-enviar-viernes",
    dias: [5],
    hora: "17:00",
    titulo: "Hacer y enviar asistencias",
    cuerpo: "Recuerda hacer y enviar las asistencias de la semana.",
    url: "/asistencias"
  },
  {
    id: "asistencia-enviar-sabado",
    dias: [6],
    hora: "09:00",
    titulo: "Hacer y enviar asistencias",
    cuerpo: "Recuerda registrar y enviar las asistencias de la semana.",
    url: "/asistencias"
  },
  {
    id: "bitacoras",
    dias: [1, 2, 3, 4, 5, 6],
    hora: "12:00",
    titulo: "Actualizar bitácoras",
    cuerpo: "Recuerda actualizar las bitácoras: fleteros, combustible y horas.",
    url: "/bitacora"
  }
];

// si se abre el sistema más tarde, el recordatorio aún aparece dentro de esta ventana
export const VENTANA_MIN = 4 * 60;
