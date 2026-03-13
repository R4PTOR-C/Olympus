import usePullToRefresh from '../../hooks/usePullToRefresh';

const THRESHOLD = 80;

export default function PullToRefresh({ onRefresh }) {
    const { pullDistance, refreshing } = usePullToRefresh(onRefresh);

    const progress = Math.min(pullDistance / THRESHOLD, 1);
    const visible = pullDistance > 4 || refreshing;

    if (!visible) return null;

    const size = 32;
    const radius = 12;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - progress);

    return (
        <div style={{
            position: 'fixed',
            top: `calc(var(--topbar-h, 60px) + ${refreshing ? 12 : pullDistance * 0.3}px)`,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            transition: refreshing ? 'top 0.2s ease' : 'none',
            pointerEvents: 'none',
        }}>
            <div style={{
                width: size, height: size,
                borderRadius: '50%',
                background: 'var(--hc-surface, #1C2436)',
                border: '1px solid rgba(74,144,217,0.25)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: Math.max(progress, refreshing ? 1 : 0),
                transition: 'opacity 0.15s',
            }}>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{
                    position: 'absolute',
                    animation: refreshing ? 'ptr-spin 0.8s linear infinite' : 'none',
                }}>
                    <circle
                        cx={size / 2} cy={size / 2} r={radius}
                        fill="none"
                        stroke="rgba(74,144,217,0.2)"
                        strokeWidth="2"
                    />
                    <circle
                        cx={size / 2} cy={size / 2} r={radius}
                        fill="none"
                        stroke="#4A90D9"
                        strokeWidth="2"
                        strokeDasharray={circumference}
                        strokeDashoffset={refreshing ? 0 : dashOffset}
                        strokeLinecap="round"
                        transform={`rotate(-90 ${size / 2} ${size / 2})`}
                        style={{ transition: refreshing ? 'none' : 'stroke-dashoffset 0.05s' }}
                    />
                </svg>
                {/* Seta */}
                {!refreshing && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4A90D9" strokeWidth="2.5" strokeLinecap="round"
                        style={{ transform: `rotate(${progress * 180}deg)`, transition: 'transform 0.1s' }}>
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <polyline points="19 12 12 19 5 12"/>
                    </svg>
                )}
            </div>
            <style>{`
                @keyframes ptr-spin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
