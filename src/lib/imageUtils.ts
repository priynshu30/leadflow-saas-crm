/**
 * Client-side high performance image compressor.
 * Resizes any large phone camera image (5MB-15MB) to max 640px and compresses to ~40KB-70KB JPEG.
 * Prevents "Request Entity Too Large" / "Unexpected token R" errors.
 */
export async function compressImage(fileOrDataUrl: File | string, maxDimension = 640, quality = 0.65): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Scale down proportionally if larger than maxDimension
      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      try {
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedDataUrl);
      } catch (e) {
        reject(e);
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load image for compression"));
    };

    if (typeof fileOrDataUrl === "string") {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}
