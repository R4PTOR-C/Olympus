import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, TextField, InputAdornment, Chip, Stack, Typography,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TablePagination, IconButton, Tooltip, CircularProgress, Paper,
    Dialog, DialogContent
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const GRUPOS = ['Todos', 'Peitoral', 'Bíceps', 'Tríceps', 'Costas', 'Ombros', 'Pernas', 'Abdômen', 'Panturrilha'];

const Exercicios_tabela = () => {
    const navigate = useNavigate();
    const apiUrl = process.env.REACT_APP_API_BASE_URL;

    const [exercicios, setExercicios]   = useState([]);
    const [loading, setLoading]         = useState(true);
    const [search, setSearch]           = useState('');
    const [grupoFiltro, setGrupoFiltro] = useState('Todos');
    const [page, setPage]               = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [gifModal, setGifModal]       = useState(null); // url do gif expandido

    useEffect(() => {
        fetch(`${apiUrl}/exercicios`)
            .then(r => r.json())
            .then(data => setExercicios(data))
            .finally(() => setLoading(false));
    }, [apiUrl]);

    const filtered = useMemo(() => {
        const term = search.toLowerCase();
        return exercicios.filter(e => {
            const matchGrupo = grupoFiltro === 'Todos' || e.grupo_muscular === grupoFiltro;
            const matchSearch = !term ||
                e.nome_exercicio?.toLowerCase().includes(term) ||
                e.grupo_muscular?.toLowerCase().includes(term);
            return matchGrupo && matchSearch;
        });
    }, [exercicios, search, grupoFiltro]);

    const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    const handleDelete = (id) => {
        if (!window.confirm('Deletar este exercício?')) return;
        fetch(`${apiUrl}/exercicios/${id}`, { method: 'DELETE' })
            .then(r => {
                if (r.ok) setExercicios(prev => prev.filter(e => e.id !== id));
            });
    };

    const isVideo = (url) => /\.(mp4|mov|webm)(\?|$)/i.test(url) || url?.includes('/video/');

    if (loading) return (
        <Box display="flex" justifyContent="center" mt={8}>
            <CircularProgress />
        </Box>
    );

    return (
        <Box sx={{ px: 2, pb: 6 }}>

            {/* Busca */}
            <TextField
                fullWidth
                placeholder="Buscar por nome ou grupo..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
                size="small"
                sx={{ mb: 2 }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon fontSize="small" />
                        </InputAdornment>
                    ),
                }}
            />

            {/* Filtro por grupo */}
            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
                {GRUPOS.map(g => (
                    <Chip
                        key={g}
                        label={g}
                        size="small"
                        onClick={() => { setGrupoFiltro(g); setPage(0); }}
                        color={grupoFiltro === g ? 'primary' : 'default'}
                        variant={grupoFiltro === g ? 'filled' : 'outlined'}
                    />
                ))}
            </Stack>

            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                {filtered.length} exercício{filtered.length !== 1 ? 's' : ''}
            </Typography>

            {/* Tabela */}
            <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ '& th': { fontWeight: 700, whiteSpace: 'nowrap' } }}>
                            <TableCell>GIF</TableCell>
                            <TableCell>Nome</TableCell>
                            <TableCell>Grupo</TableCell>
                            <TableCell>Nível</TableCell>
                            <TableCell align="right">Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {paginated.map(ex => (
                            <TableRow key={ex.id} hover>

                                {/* Thumbnail */}
                                <TableCell sx={{ width: 64, p: '4px 8px' }}>
                                    {ex.gif_url ? (
                                        isVideo(ex.gif_url) ? (
                                            <video
                                                src={ex.gif_url}
                                                autoPlay loop muted playsInline
                                                style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
                                                onClick={() => setGifModal(ex.gif_url)}
                                            />
                                        ) : (
                                            <img
                                                src={ex.gif_url}
                                                alt=""
                                                style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
                                                onClick={() => setGifModal(ex.gif_url)}
                                            />
                                        )
                                    ) : (
                                        <Box sx={{ width: 56, height: 56, bgcolor: '#222', borderRadius: 1 }} />
                                    )}
                                </TableCell>

                                {/* Nome */}
                                <TableCell>
                                    <Typography variant="body2">{ex.nome_exercicio}</Typography>
                                    <Typography variant="caption" color="text.secondary">#{ex.id}</Typography>
                                </TableCell>

                                {/* Grupo */}
                                <TableCell>
                                    <Typography variant="body2" noWrap>{ex.grupo_muscular}</Typography>
                                </TableCell>

                                {/* Nível */}
                                <TableCell>
                                    <Typography variant="body2" noWrap color="text.secondary">
                                        {ex.nivel || '—'}
                                    </Typography>
                                </TableCell>

                                {/* Ações */}
                                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                    <Tooltip title="Editar">
                                        <IconButton size="small" onClick={() => navigate(`/exercicios/edit/${ex.id}`)}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Deletar">
                                        <IconButton size="small" color="error" onClick={() => handleDelete(ex.id)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                component="div"
                count={filtered.length}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={e => { setRowsPerPage(+e.target.value); setPage(0); }}
                rowsPerPageOptions={[25, 50, 100]}
                labelRowsPerPage="Por página:"
                labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
            />

            {/* Modal GIF expandido */}
            <Dialog open={!!gifModal} onClose={() => setGifModal(null)} maxWidth="sm">
                <DialogContent sx={{ p: 0, bgcolor: '#111' }}>
                    {gifModal && (
                        isVideo(gifModal) ? (
                            <video src={gifModal} autoPlay loop muted playsInline style={{ width: '100%', display: 'block' }} />
                        ) : (
                            <img src={gifModal} alt="" style={{ width: '100%', display: 'block' }} />
                        )
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default Exercicios_tabela;
