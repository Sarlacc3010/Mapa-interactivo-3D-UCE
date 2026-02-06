const getImageUrl = (filename) => {
  if (!filename) return null;

  // If we accidentally saved a full URL (http...), return it as is
  if (filename.startsWith('http')) {
    return filename;
  }

  // Get prefix from .env
  const prefix = process.env.STORAGE_PUBLIC_URL_PREFIX;

  if (!prefix) return filename; // Fallback if variable is missing

  // Clean duplicate slashes just in case
  const cleanPrefix = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
  const cleanFilename = filename.startsWith('/') ? filename.slice(1) : filename;

  // Returns: https://f004.../your-bucket/engineering.jpg
  return `${cleanPrefix}/${cleanFilename}`;
};

module.exports = { getImageUrl };