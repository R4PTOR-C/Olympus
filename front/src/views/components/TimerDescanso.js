import React, { useState, useEffect, useRef, useCallback } from 'react';

const DURATIONS = [30, 60, 90, 120, 180];
const R = 17;
const CIRC = 2 * Math.PI * R;

async function scheduleNotification(delayMs) {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    try {
        const sw = await navigator.serviceWorker.ready;
        sw.active?.postMessage({ type: 'SCHEDULE_TIMER', delay: delayMs });
    } catch (_) {}
}

async function cancelNotification() {
    try {
        const sw = await navigator.serviceWorker.ready;
        sw.active?.postMessage({ type: 'CANCEL_TIMER' });
    } catch (_) {}
}

async function requestNotificationPermission() {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
}

export default function TimerDescanso() {
    const [durIdx, setDurIdx] = useState(1); // default 60s
    const [remaining, setRemaining] = useState(DURATIONS[1]);
    const [running, setRunning] = useState(false);
    const [done, setDone] = useState(false);

    const intervalRef = useRef(null);
    const endTimeRef  = useRef(null); // timestamp absoluto de quando o timer termina

    const dur = DURATIONS[durIdx];
    const progress    = remaining / dur;
    const dashOffset  = CIRC * (1 - progress);

    // Sincroniza o remaining com o endTime real (usado ao voltar à aba)
    const syncFromEndTime = useCallback(() => {
        if (!endTimeRef.current) return;
        const now  = Date.now();
        const left = Math.ceil((endTimeRef.current - now) / 1000);
        if (left <= 0) {
            clearInterval(intervalRef.current);
            endTimeRef.current = null;
            setRunning(false);
            setDone(true);
            setRemaining(0);
        } else {
            setRemaining(left);
        }
    }, []);

    useEffect(() => {
        if (running) {
            intervalRef.current = setInterval(syncFromEndTime, 500);
        } else {
            clearInterval(intervalRef.current);
        }
        return () => clearInterval(intervalRef.current);
    }, [running, syncFromEndTime]);

    // Resync quando o usuário volta à aba
    useEffect(() => {
        const onVisible = () => {
            if (!document.hidden && running) syncFromEndTime();
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, [running, syncFromEndTime]);

    const startTimer = async (seconds) => {
        const granted = await requestNotificationPermission();
        endTimeRef.current = Date.now() + seconds * 1000;
        setRunning(true);
        setDone(false);
        if (granted) scheduleNotification(seconds * 1000);
    };

    const stopTimer = () => {
        endTimeRef.current = null;
        setRunning(false);
        setRemaining(dur);
        cancelNotification();
    };

    const handleTap = () => {
        if (done) {
            setDone(false);
            setRemaining(dur);
            return;
        }
        if (running) {
            stopTimer();
        } else {
            startTimer(remaining > 0 ? remaining : dur);
        }
    };

    const cycleDur = (e) => {
        e.stopPropagation();
        if (running) return;
        const next = (durIdx + 1) % DURATIONS.length;
        setDurIdx(next);
        setRemaining(DURATIONS[next]);
        setDone(false);
    };

    const mins    = Math.floor(remaining / 60);
    const secs    = remaining % 60;
    const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

    const accent  = done ? '#2ECC71' : '#4A90D9';
    const ringBg  = done ? 'rgba(46,204,113,0.15)' : 'rgba(74,144,217,0.12)';
    const ringBdr = done ? 'rgba(46,204,113,0.4)'  : 'rgba(74,144,217,0.3)';

    return (
        <div
            onClick={handleTap}
            style={{
                position: 'fixed',
                bottom: 'calc(68px + env(safe-area-inset-bottom, 0px))',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 900,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                background: 'rgba(10, 13, 22, 0.92)',
                border: `1px solid ${ringBdr}`,
                borderRadius: 40,
                padding: '10px 14px 10px 18px',
                cursor: 'pointer',
                backdropFilter: 'blur(12px)',
                boxShadow: `0 4px 28px rgba(0,0,0,0.55), 0 0 0 1px ${ringBdr}`,
                userSelect: 'none',
                transition: 'border-color 0.3s, box-shadow 0.3s',
            }}
        >
            {/* ── LADO ESQUERDO: tempo ── */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 68 }}>
                <span style={{
                    fontSize: 10,
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: accent,
                    lineHeight: 1,
                    marginBottom: 3,
                    transition: 'color 0.3s',
                }}>
                    {done ? 'Concluído' : running ? 'Descansando' : 'Descanso'}
                </span>

                <span
                    onClick={!running && !done ? cycleDur : undefined}
                    style={{
                        fontSize: 26,
                        fontFamily: 'Barlow Condensed, sans-serif',
                        fontWeight: 700,
                        color: done ? '#2ECC71' : running ? '#fff' : '#7a8aaa',
                        lineHeight: 1,
                        letterSpacing: '0.02em',
                        transition: 'color 0.3s',
                        cursor: !running && !done ? 'pointer' : 'default',
                    }}
                >
                    {timeStr}
                </span>
            </div>

            {/* ── LADO DIREITO: ring ── */}
            <svg
                width={R * 2 + 10}
                height={R * 2 + 10}
                viewBox={`0 0 ${R * 2 + 10} ${R * 2 + 10}`}
                style={{ flexShrink: 0 }}
            >
                {/* trilho de fundo */}
                <circle
                    cx={R + 5} cy={R + 5} r={R}
                    fill="none"
                    stroke={ringBg}
                    strokeWidth="3"
                />
                {/* arco de progresso */}
                <circle
                    cx={R + 5} cy={R + 5} r={R}
                    fill="none"
                    stroke={accent}
                    strokeWidth="3"
                    strokeDasharray={CIRC}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${R + 5} ${R + 5})`}
                    style={{ transition: running ? 'stroke-dashoffset 0.5s linear, stroke 0.3s' : 'stroke 0.3s' }}
                />
                {/* ícone centro: play / pause / check */}
                {done ? (
                    <polyline
                        points={`${R + 5 - 5},${R + 5} ${R + 5 - 1},${R + 5 + 4} ${R + 5 + 6},${R + 5 - 4}`}
                        fill="none" stroke="#2ECC71" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    />
                ) : running ? (
                    <>
                        <rect x={R + 5 - 5} y={R + 5 - 5} width="3.5" height="10" rx="1" fill="#4A90D9" />
                        <rect x={R + 5 + 1.5} y={R + 5 - 5} width="3.5" height="10" rx="1" fill="#4A90D9" />
                    </>
                ) : (
                    <polygon
                        points={`${R + 5 - 4},${R + 5 - 5} ${R + 5 + 6},${R + 5} ${R + 5 - 4},${R + 5 + 5}`}
                        fill="#4A90D9"
                    />
                )}
            </svg>
        </div>
    );
}
