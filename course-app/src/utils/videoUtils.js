/**
 * Xử lý URL video cho Mobile
 * @param {string} url - URL gốc
 * @returns {object} - { type: 'webview' | 'native', uri: string }
 */
export const getVideoSource = (url) => {
  if (!url) return { type: 'native', uri: null };

  // Kiểm tra Dailymotion
  const dailymotionMatch = url.match(
    /(?:dailymotion\.com\/(?:video\/|embed\/video\/)|dai\.ly\/)([^"&?\/ ]+)/
  );
  if (dailymotionMatch && dailymotionMatch[1]) {
    return {
      type: 'webview',
      uri: `https://www.dailymotion.com/embed/video/${dailymotionMatch[1]}?autoplay=0`
    };
  }

  // 1. Kiểm tra YouTube
  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|watch\?v=)|youtu\.be\/)([^"&?\/ ]{11})/
  );
  if (youtubeMatch && youtubeMatch[1]) {
    return {
      type: 'youtube',
      videoId: youtubeMatch[1]
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