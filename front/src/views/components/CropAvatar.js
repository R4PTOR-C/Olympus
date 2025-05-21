import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../utils/cropImage';

const CropAvatar = ({ file, onCropped, onClose }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropComplete = useCallback((_, areaPixels) => {
        setCroppedAreaPixels(areaPixels);
    }, []);

    const handleCrop = async () => {
        const croppedBlob = await getCroppedImg(URL.createObjectURL(file), croppedAreaPixels);

        // 👉 Defina name e type se não estiverem definidos automaticamente
        const finalBlob = new File([croppedBlob], 'avatar.jpeg', { type: 'image/jpeg' });
        console.log('📸 Blob cortado enviado:', finalBlob);
        onCropped(finalBlob);

    };


    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#000000cc', zIndex: 1000 }}>
            <div style={{ position: 'relative', width: '100%', height: '60vh' }}>
                <Cropper
                    image={URL.createObjectURL(file)}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                />
            </div>
            <div className="d-flex flex-column align-items-center gap-2 p-3">
                <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(e.target.value)}
                    style={{ width: '80%' }}
                />
                <div className="d-flex gap-2">
                    <button onClick={onClose} className="btn btn-outline-secondary">Cancelar</button>
                    <button type="button" onClick={handleCrop} className="btn btn-primary">Cortar e Salvar</button>
                </div>
            </div>
        </div>
    );
};

export default CropAvatar;
