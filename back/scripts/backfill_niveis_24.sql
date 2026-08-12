-- Recalcula o nível (1..24 · 8 tiers × 3 sub-ranks) de todos os usuários a partir do XP acumulado.
-- Rode uma vez após o deploy; daí em diante o engine mantém a coluna atualizada.
UPDATE gamificacao_usuario SET nivel = CASE
    WHEN xp_total >= 10000 THEN 24  -- Olimpiano III
    WHEN xp_total >=  9000 THEN 23  -- Olimpiano II
    WHEN xp_total >=  8000 THEN 22  -- Olimpiano I
    WHEN xp_total >=  7000 THEN 21  -- Titã III
    WHEN xp_total >=  6000 THEN 20  -- Titã II
    WHEN xp_total >=  5000 THEN 19  -- Titã I
    WHEN xp_total >=  4333 THEN 18  -- Atlas III
    WHEN xp_total >=  3667 THEN 17  -- Atlas II
    WHEN xp_total >=  3000 THEN 16  -- Atlas I
    WHEN xp_total >=  2600 THEN 15  -- Semideus III
    WHEN xp_total >=  2200 THEN 14  -- Semideus II
    WHEN xp_total >=  1800 THEN 13  -- Semideus I
    WHEN xp_total >=  1533 THEN 12  -- Herói III
    WHEN xp_total >=  1267 THEN 11  -- Herói II
    WHEN xp_total >=  1000 THEN 10  -- Herói I
    WHEN xp_total >=   833 THEN  9  -- Espartano III
    WHEN xp_total >=   667 THEN  8  -- Espartano II
    WHEN xp_total >=   500 THEN  7  -- Espartano I
    WHEN xp_total >=   400 THEN  6  -- Atleta III
    WHEN xp_total >=   300 THEN  5  -- Atleta II
    WHEN xp_total >=   200 THEN  4  -- Atleta I
    WHEN xp_total >=   133 THEN  3  -- Mortal III
    WHEN xp_total >=    67 THEN  2  -- Mortal II
    ELSE  1  -- Mortal I
END;
