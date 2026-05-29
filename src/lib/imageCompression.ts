// Comprime imagens no cliente antes de armazenar/enviar ao Supabase Storage.
// Redimensiona para uma dimensão máxima e re-codifica em WebP (com fallback JPEG),
// reduzindo drasticamente o tamanho do arquivo. Arquivos não-imagem passam intactos.

const MAX_DIMENSION = 1600; // px — limite do maior lado
const QUALITY = 0.7; // 0..1 — qualidade da re-codificação com perdas
const COMPRESSIBLE = /^image\/(jpeg|jpg|png|webp)$/i;

export type CompressedFile = {
  /** Data URL da imagem comprimida (ou original, se não comprimível). */
  data: string;
  /** Tamanho em bytes do resultado. */
  size: number;
  /** MIME type resultante. */
  type: string;
  /** Nome do arquivo, com extensão ajustada quando recodificado. */
  name: string;
};

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("READ_FAILED"));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("IMAGE_DECODE_FAILED"));
    img.src = dataUrl;
  });
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("ENCODE_FAILED"));
    reader.readAsDataURL(blob);
  });
}

function replaceExtension(name: string, ext: string): string {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  return `${base}.${ext}`;
}

/**
 * Comprime uma imagem. Para tipos não comprimíveis (gif, heic, svg, não-imagem),
 * retorna o arquivo original como data URL sem alterações.
 */
export async function compressImageFile(file: File): Promise<CompressedFile> {
  const originalDataUrl = await readAsDataURL(file);

  if (!COMPRESSIBLE.test(file.type)) {
    return { data: originalDataUrl, size: file.size, type: file.type, name: file.name };
  }

  try {
    const img = await loadImage(originalDataUrl);
    const { width, height } = img;
    const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("NO_CANVAS_CONTEXT");
    ctx.drawImage(img, 0, 0, targetW, targetH);

    // Tenta WebP; alguns navegadores antigos caem para PNG no toBlob.
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", QUALITY),
    );

    if (!blob) throw new Error("TOBLOB_FAILED");

    // Se a recodificação não reduziu nada (imagem já pequena), mantém o original.
    if (blob.size >= file.size) {
      return { data: originalDataUrl, size: file.size, type: file.type, name: file.name };
    }

    const outType = blob.type || "image/webp";
    const ext = outType.includes("png") ? "png" : "webp";
    return {
      data: await blobToDataURL(blob),
      size: blob.size,
      type: outType,
      name: replaceExtension(file.name, ext),
    };
  } catch {
    // Em qualquer falha de compressão, preserva o arquivo original.
    return { data: originalDataUrl, size: file.size, type: file.type, name: file.name };
  }
}
