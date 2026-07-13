// Redimensiona y re-codifica una imagen en el navegador ANTES de subirla:
//  - baja el peso (evita límites de tamaño del proxy / servidor)
//  - convierte a JPEG los formatos que el navegador sabe decodificar
//    (incluye HEIC en Safari/iOS, que decodifica nativamente)
//  - elimina la metadata (EXIF) al re-codificar en canvas
// Si el navegador no puede decodificar el archivo (ej. HEIC en Chrome desktop),
// devuelve el original para que lo convierta el servidor.

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error("no se pudo decodificar la imagen"));
    im.src = src;
  });
}

export async function downscaleImage(file: File, maxSide = 1600, quality = 0.9): Promise<File> {
  if (!file.type.startsWith("image/") && !/\.(heic|heif)$/i.test(file.name)) return file;
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const longest = Math.max(img.naturalWidth, img.naturalHeight) || 1;
    const scale = Math.min(1, maxSide / longest);
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", quality));
    if (!blob) return file;
    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    return file; // el servidor se encarga (ej. HEIC en desktop)
  } finally {
    URL.revokeObjectURL(url);
  }
}
