const getImageUrl = (filename) => {
  if (!filename) return null;
  
  // Si por error guardamos una URL completa (http...), la devolvemos tal cual
  if (filename.startsWith('http')) {
    return filename;
  }

  // Obtenemos el prefijo del .env
  const prefix = process.env.STORAGE_PUBLIC_URL_PREFIX;
  
  if (!prefix) return filename; // Fallback si falta la variable

  // Limpieza de barras duplicadas por si acaso
  const cleanPrefix = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
  const cleanFilename = filename.startsWith('/') ? filename.slice(1) : filename;

  // Retorna: https://f004.../tu-bucket/ingenieria.jpg
  return `${cleanPrefix}/${cleanFilename}`;
};

module.exports = { getImageUrl };