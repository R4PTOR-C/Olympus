import React, { useState, useCallback, useMemo } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../utils/cropImage';

const CropAvatar = ({ file, onCropped, onClose }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [saving, setSaving] = useState(false);

    const imageUrl = useMemo(() => URL.createObjectURL(file), [file]);

    const onCropComplete = useCallback((_, areaPixels) => {
        setCroppedAreaPixels(areaPixels);
    }, []);

    const handleCrop = async () => {
        setSaving(true);
        const croppedBlob = await getCroppedImg(imageUrl, croppedAreaPixels);
        const finalBlob = new File([croppedBlob], 'avatar.jpeg', { type: 'image/jpeg' });
        onCropped(finalBlob);
    };

    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(5, 8, 15, 0.96)',
            backdropFilter: 'blur(10px)',
            zIndex: 1200,
            display: 'flex',
            flexDirection: 'column',
        }}>

            {/* ── HEADER ── */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                flexShrink: 0,
            }}>
                <div>
                    <p style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: '0.65rem', fontWeight: 700,
                        letterSpacing: '0.14em', textTransform: 'uppercase',
                        color: '#4A90D9', margin: 0,
                    }}>Foto de Perfil</p>
                    <h2 style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: '1.5rem', letterSpacing: '0.04em',
                        color: '#E8EDF5', margin: 0, lineHeight: 1.1,
                    }}>Ajustar Foto</h2>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        width: 36, height: 36, borderRadius: '50%',
                        border: '1px solid rgba(255,255,255,0.12)',
                        background: 'rgba(255,255,255,0.06)',
                        color: '#E8EDF5', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>

            {/* ── CROPPER ── */}
            <div style={{ position: 'relative', flex: 1 }}>
                <Cropper
                    image={imageUrl}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                    style={{
                        containerStyle: { background: 'transparent' },
                        cropAreaStyle: {
                            border: '2px solid #4A90D9',
                            boxShadow: '0 0 0 9999px rgba(5,8,15,0.75)',
                        },
                    }}
                />
            </div>

            {/* ── DICA ── */}
            <p style={{
                textAlign: 'center',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '0.68rem', fontWeight: 600,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.25)',
                margin: '14px 0 0',
                flexShrink: 0,
            }}>
                Arraste para posicionar · Pinça para dar zoom
            </p>

            {/* ── CONTROLES ── */}
            <div style={{
                padding: '14px 28px 32px',
                display: 'flex', flexDirection: 'column', gap: 14,
                flexShrink: 0,
            }}>

                {/* Zoom slider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
                    </svg>
                    <input
                        type="range"
                        min={1} max={3} step={0.05}
                        value={zoom}
                        onChange={e => setZoom(parseFloat(e.target.value))}
                        style={{
                            flex: 1, height: 4, borderRadius: 2,
                            appearance: 'none', WebkitAppearance: 'none',
                            background: `linear-gradient(to right, #4A90D9 ${((zoom - 1) / 2) * 100}%, rgba(255,255,255,0.12) ${((zoom - 1) / 2) * 100}%)`,
                            outline: 'none', cursor: 'pointer',
                        }}
                    />
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
                    </svg>
                </div>

                {/* Botões */}
                <div style={{ display: 'flex', gap: 10 }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1, padding: '13px 0',
                            borderRadius: 12,
                            border: '1.5px solid rgba(255,255,255,0.12)',
                            background: 'transparent',
                            color: 'rgba(255,255,255,0.5)',
                            fontFamily: "'Barlow Condensed', sans-serif",
                            fontSize: '0.82rem', fontWeight: 700,
                            letterSpacing: '0.12em', textTransform: 'uppercase',
                            cursor: 'pointer',
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleCrop}
                        disabled={saving}
                        style={{
                            flex: 2, padding: '13px 0',
                            borderRadius: 12, border: 'none',
                            background: saving ? 'rgba(74,144,217,0.4)' : '#4A90D9',
                            color: '#fff',
                            fontFamily: "'Barlow Condensed', sans-serif",
                            fontSize: '0.82rem', fontWeight: 700,
                            letterSpacing: '0.12em', textTransform: 'uppercase',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            boxShadow: saving ? 'none' : '0 4px 16px rgba(74,144,217,0.35)',
                            transition: 'all 0.15s',
                        }}
                    >
                        {saving ? (
                            'Salvando...'
                        ) : (
                            <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"/>
                                </svg>
                                Usar esta foto
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CropAvatar;
