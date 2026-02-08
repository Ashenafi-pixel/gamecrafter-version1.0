export async function cropImageSides(
  imgSrc: string,
  cropPercent: number = 20
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // to avoid CORS issues
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject("Canvas context not available");

      const cropLeft = img.width * (cropPercent / 100);
      const cropRight = img.width * (cropPercent / 100);
      const cropWidth = img.width - cropLeft - cropRight;

      canvas.width = cropWidth;
      canvas.height = img.height;

      ctx.drawImage(
        img,
        cropLeft, // source x
        0,        // source y
        cropWidth,
        img.height,
        0,
        0,
        cropWidth,
        img.height
      );

      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = imgSrc;
  });
}
