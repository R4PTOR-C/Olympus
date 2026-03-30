import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, TextField, Button, Select, MenuItem, FormControl,
    InputLabel, Typography, CircularProgress, Snackbar, Alert
} from '@mui/material';

const GRUPOS = ['Peitoral', 'Bíceps', 'Tríceps', 'Costas', 'Ombros', 'Pernas', 'Abdômen', 'Panturrilha'];
const NIVEIS = ['Iniciante', 'Intermediário', 'Avançado'];

function Exercicios_edit() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [nome_exercicio, setNome]      = useState('');
    const [grupo_muscular, setGrupo]     = useState('');
    const [nivel, setNivel]              = useState('');
    const [mediaFile, setMediaFile]      = useState(null);
    const [mediaPreview, setMediaPreview] = useState('');
    const [mediaIsVideo, setMediaIsVideo] = useState(false);
    const [loading, setLoading]          = useState(true);
    const [saving, setSaving]            = useState(false);
    const [snack, setSnack]              = useState({ open: false, msg: '', severity: 'success' });

    useEffect(() => {
        fetch(`${process.env.REACT_APP_API_BASE_URL}/exercicios/exercicios/${id}`)
            .then(r => r.json())
            .then(data => {
                setNome(data.nome_exercicio);
                setGrupo(data.grupo_muscular);
                setNivel(data.nivel || '');
                setMediaPreview(data.gif_url);
                setMediaIsVideo(/\.(mp4|mov|webm)(\?|$)/i.test(data.gif_url) || data.gif_url?.includes('/video/'));
            })
            .catch(() => setSnack({ open: true, msg: 'Erro ao carregar exercício.', severity: 'error' }))
            .finally(() => setLoading(false));
    }, [id]);

    const handleMediaChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setMediaFile(file);
        setMediaIsVideo(file.type.startsWith('video/'));
        const reader = new FileReader();
        reader.onload = (ev) => setMediaPreview(ev.target.result);
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        const formData = new FormData();
        formData.append('nome_exercicio', nome_exercicio);
        formData.append('grupo_muscular', grupo_muscular);
        formData.append('nivel', nivel);
        if (mediaFile) formData.append('media', mediaFile);

        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/exercicios/${id}`, {
                method: 'PUT',
                body: formData,
            });
            if (res.ok) {
                setSnack({ open: true, msg: 'Salvo!', severity: 'success' });
                setTimeout(() => navigate(-1), 800);
            } else {
                setSnack({ open: true, msg: 'Erro ao salvar.', severity: 'error' });
            }
        } catch {
            setSnack({ open: true, msg: 'Erro de conexão.', severity: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <CircularProgress />
        </Box>
    );

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 560, mx: 'auto', px: 2, pb: 6 }}>

            {/* GIF grande */}
            {mediaPreview && (
                <Box sx={{ width: '100%', mb: 3, borderRadius: 3, overflow: 'hidden', bgcolor: '#111' }}>
                    {mediaIsVideo ? (
                        <video
                            src={mediaPreview}
                            autoPlay loop muted playsInline
                            style={{ width: '100%', maxHeight: 400, objectFit: 'contain', display: 'block' }}
                        />
                    ) : (
                        <img
                            src={mediaPreview}
                            alt={nome_exercicio}
                            style={{ width: '100%', maxHeight: 400, objectFit: 'contain', display: 'block' }}
                        />
                    )}
                </Box>
            )}

            {/* Nome em destaque */}
            <TextField
                fullWidth
                label="Nome do exercício"
                value={nome_exercicio}
                onChange={e => setNome(e.target.value)}
                required
                variant="outlined"
                sx={{ mb: 3 }}
                inputProps={{ style: { fontSize: 18 } }}
            />

            {/* Grupo muscular */}
            <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Grupo muscular</InputLabel>
                <Select
                    value={grupo_muscular}
                    label="Grupo muscular"
                    onChange={e => setGrupo(e.target.value)}
                    required
                >
                    {GRUPOS.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                </Select>
            </FormControl>

            {/* Nível */}
            <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Nível</InputLabel>
                <Select
                    value={nivel}
                    label="Nível"
                    onChange={e => setNivel(e.target.value)}
                >
                    <MenuItem value="">—</MenuItem>
                    {NIVEIS.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                </Select>
            </FormControl>

            {/* Trocar mídia */}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Trocar GIF / vídeo (opcional)
            </Typography>
            <Button variant="outlined" component="label" fullWidth sx={{ mb: 3 }}>
                Escolher arquivo
                <input hidden type="file" accept=".gif,video/mp4,video/webm,video/quicktime" onChange={handleMediaChange} />
            </Button>

            {/* Salvar */}
            <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={saving}
            >
                {saving ? <CircularProgress size={22} color="inherit" /> : 'Salvar'}
            </Button>

            <Snackbar
                open={snack.open}
                autoHideDuration={3000}
                onClose={() => setSnack(s => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
            </Snackbar>
        </Box>
    );
}

export default Exercicios_edit;
