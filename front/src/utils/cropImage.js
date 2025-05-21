export default function getCroppedImg(imageSrc, pixelCrop) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.src = imageSrc;
        image.crossOrigin = 'anonymous';
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = pixelCrop.width;
            canvas.height = pixelCrop.height;
            const ctx = canvas.getContext('2d');

            ctx.drawImage(
                image,
                pixelCrop.x,
                pixelCrop.y,
                pixelCrop.width,
                pixelCrop.height,
                0,
                0,
                pixelCrop.width,
                pixelCrop.height
            );

            canvas.toBlob(blob => {
                if (!blob) {
                    return reject(new Error('Canvas is empty'));
                }
                blob.name = 'avatar.jpeg';
                resolve(blob);
            }, 'image/jpeg');
        };

        image.onerror = () => {
            reject(new Error('Falha ao carregar imagem'));
        };
    });
}
