import React, { useState, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../utils/cropImage';

const CropAvatar = ({ file, onCropped, onClose }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [saving, setSaving] = useState(false);

    const isMobile = window.innerWidth < 600;

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

    return ReactDOM.createPortal(
        <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(5, 8, 15, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 1200,
            display: 'flex',
            alignItems: isMobile ? 'flex-end' : 'center',
            justifyContent: 'center',
            padding: isMobile ? 0 : '16px',
        }}>
            <div style={{
                width: '100%',
                maxWidth: isMobile ? '100%' : 420,
                height: isMobile ? '90dvh' : 'auto',
                background: '#0d1117',
                borderRadius: isMobile ? '20px 20px 0 0' : 16,
                border: '1px solid rgba(255,255,255,0.08)',
                borderBottom: isMobile ? 'none' : '1px solid rgba(255,255,255,0.08)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
            }}>

                {/* ── HANDLE (mobile only) ── */}
                {isMobile && (
                    <div style={{
                        display: 'flex', justifyContent: 'center',
                        padding: '10px 0 4px',
                        flexShrink: 0,
                    }}>
                        <div style={{
                            width: 36, height: 4, borderRadius: 2,
                            background: 'rgba(255,255,255,0.18)',
                        }} />
                    </div>
                )}

                {/* ── HEADER ── */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: isMobile ? '8px 20px 12px' : '10px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.07)',
                    flexShrink: 0,
                }}>
                    <h2 style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: '1.2rem', letterSpacing: '0.04em',
                        color: '#E8EDF5', margin: 0,
                    }}>Ajustar Foto</h2>
                    <button
                        onClick={onClose}
                        style={{
                            width: 32, height: 32, borderRadius: '50%',
                            border: '1px solid rgba(255,255,255,0.12)',
                            background: 'rgba(255,255,255,0.06)',
                            color: '#E8EDF5', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>

                {/* ── CROPPER ── */}
                <div style={{
                    position: 'relative',
                    flex: 1,
                    minHeight: 0,
                }}>
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

                {/* ── CONTROLES ── */}
                <div style={{
                    padding: isMobile
                        ? '14px 20px calc(20px + env(safe-area-inset-bottom, 0px))'
                        : '10px 16px calc(16px + env(safe-area-inset-bottom, 0px))',
                    display: 'flex', flexDirection: 'column', gap: 12,
                    flexShrink: 0,
                    borderTop: '1px solid rgba(255,255,255,0.07)',
                    background: '#0d1117',
                }}>

                    {/* Zoom slider */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
                                flex: 1,
                                padding: isMobile ? '13px 0' : '10px 0',
                                borderRadius: 12,
                                border: '1.5px solid rgba(255,255,255,0.12)',
                                background: 'transparent',
                                color: 'rgba(255,255,255,0.5)',
                                fontFamily: "'Barlow Condensed', sans-serif",
                                fontSize: isMobile ? '0.9rem' : '0.78rem',
                                fontWeight: 700,
                                letterSpacing: '0.1em', textTransform: 'uppercase',
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
                                flex: 2,
                                padding: isMobile ? '13px 0' : '10px 0',
                                borderRadius: 12, border: 'none',
                                background: saving ? 'rgba(74,144,217,0.4)' : '#4A90D9',
                                color: '#fff',
                                fontFamily: "'Barlow Condensed', sans-serif",
                                fontSize: isMobile ? '0.9rem' : '0.78rem',
                                fontWeight: 700,
                                letterSpacing: '0.1em', textTransform: 'uppercase',
                                cursor: saving ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
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
        </div>,
        document.body
    );
};

export default CropAvatar;
