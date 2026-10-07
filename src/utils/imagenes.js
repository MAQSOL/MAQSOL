export function comprimirImagen(file, max = 1600, calidad = 0.82) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (Math.max(w, h) > max) {
        const r = max / Math.max(w, h);
        w = Math.round(w * r);
        h = Math.round(h * r);
      }
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      c.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo procesar la imagen"))), "image/jpeg", calidad);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("La imagen no es válida (usa JPG o PNG)"));
    };
    img.src = url;
  });
}

export function rutaUnica(carpeta, subcarpeta, extension) {
  return `${carpeta}/${subcarpeta}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${extension}`;
}

export function extensionDe(nombre, defecto = "bin") {
  return ((nombre || "").split(".").pop() || defecto).toLowerCase().replace(/[^a-z0-9]/g, "") || defecto;
}
