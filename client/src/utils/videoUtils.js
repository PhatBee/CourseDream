/**
 * Chuyển đổi URL video (YouTube, Dailymotion, Vimeo) sang URL nhúng (embed URL)
 * @param {string} url - URL video gốc
 * @returns {string | null} - URL có thể nhúng được hoặc null
 */
export const getEmbedUrl = (url) => {
  if (!url) return null;

  let videoId = null;
  let embedUrl = null;

  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|watch\?v=)|youtu\.be\/)([^"&?\/ ]{11})/
  );
  if (youtubeMatch && youtubeMatch[1]) {
    videoId = youtubeMatch[1];
    embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    return embedUrl;
  }

  const dailymotionMatch = url.match(
    /(?:dailymotion\.com\/(?:video\/|embed\/video\/)|dai\.ly\/)([^"&?\/ ]+)/
  );
  if (dailymotionMatch && dailymotionMatch[1]) {
    videoId = dailymotionMatch[1].split('_')[0];
    embedUrl = `https://geo.dailymotion.com/player.html?video=${videoId}&autoplay=1`;
    return embedUrl;
  }

  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    videoId = vimeoMatch[1];
    embedUrl = `https://player.vimeo.com/video/${videoId}?autoplay=1`;
    return embedUrl;
  }
  
  if (url.includes('/embed/') || url.includes('player.html')) {
    return url;
  }

  return null;
};