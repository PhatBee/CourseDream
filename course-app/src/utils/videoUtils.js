/**
 * Xử lý URL video cho Mobile
 * @param {string} url - URL gốc
 * @returns {object} - { type: 'webview' | 'native', uri: string }
 */
export const getVideoSource = (url) => {
  if (!url) return { type: 'native', uri: null };

  // 1. Kiểm tra YouTube
  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|watch\?v=)|youtu\.be\/)([^"&?\/ ]{11})/
  );
  if (youtubeMatch && youtubeMatch[1]) {
    return {
      type: 'webview',
      uri: `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=0&rel=0&showinfo=0&controls=1&modestbranding=1&playsinline=1`
    };
  }

  // 2. Kiểm tra Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: 'webview',
      uri: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=0`
    };
  }

  // 3. Các trường hợp còn lại (Cloudinary, mp4 trực tiếp...) -> Dùng Native Player
  return { type: 'native', uri: url };
};