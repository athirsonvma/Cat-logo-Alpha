const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// Envia um arquivo direto do navegador para o Cloudinary (upload "unsigned",
// não precisa de servidor). Retorna a URL pública da imagem.
export async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'alpha-imoveis');

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Falha no upload da imagem');
  const data = await res.json();
  return data.secure_url;
}

// Gera uma versão redimensionada/otimizada de uma URL do Cloudinary
// sem precisar guardar múltiplos arquivos — é só um parâmetro na URL.
export function cloudinaryResize(url, width) {
  if (!url || !url.includes('/upload/')) return url;
  return url.replace('/upload/', `/upload/w_${width},c_limit,q_auto,f_auto/`);
}
