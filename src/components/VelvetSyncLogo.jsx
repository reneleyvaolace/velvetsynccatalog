import React from 'react';
import './VelvetSyncLogo.css';

const VelvetSyncLogo = ({ className }) => {
    return (
        <svg
            viewBox="0 0 400 240"
            className={`${className} vs-logo-final`}
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <filter id="vs-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur1" />
                    <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur2" />
                    <feMerge>
                        <feMergeNode in="blur1" />
                        <feMergeNode in="blur2" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>

                <linearGradient id="vs-magenta" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#E43681" stopOpacity="0" />
                    <stop offset="50%" stopColor="#E43681" stopOpacity="1" />
                    <stop offset="100%" stopColor="#ff7eb6" />
                </linearGradient>

                <linearGradient id="vs-cyan" x1="100%" y1="0%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#00FFEE" stopOpacity="0" />
                    <stop offset="50%" stopColor="#00FFEE" stopOpacity="1" />
                    <stop offset="100%" stopColor="#a0ffff" />
                </linearGradient>
            </defs>

            {/* 8-bit precision grid dots */}
            <g className="grid-precision-dots">
                {[...Array(21)].map((_, i) => (
                    [...Array(13)].map((_, j) => (
                        <circle key={`dot-${i}-${j}`} cx={i * 20} cy={j * 20} r="0.8" fill="#fff" opacity="0.1" />
                    ))
                ))}
            </g>

            <g filter="url(#vs-glow)">
                {/* HARMONIC FREQUENCY WAVES - Forming Infinity/V Hybrid */}
                {/* Wave 1 - Magenta (CH1) */}
                <path
                    d="M 200 120 C 150 40, 80 40, 60 120 C 80 200, 150 200, 200 120 C 250 40, 320 40, 340 120 C 320 200, 250 200, 200 120 Z"
                    className="wave-path path-mag"
                    fill="none"
                    stroke="url(#vs-magenta)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    pathLength="100"
                />

                {/* Wave 2 - Cyan (CH2) - Synchronized and Intertwined */}
                <path
                    d="M 200 120 C 250 200, 320 200, 340 120 C 320 40, 250 40, 200 120 C 150 200, 80 200, 60 120 C 80 40, 150 40, 200 120 Z"
                    className="wave-path path-cy"
                    fill="none"
                    stroke="url(#vs-cyan)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    pathLength="100"
                />

                {/* White core light filaments */}
                <path
                    d="M 200 120 C 150 40, 80 40, 60 120 C 80 200, 150 200, 200 120 C 250 40, 320 40, 340 120 C 320 200, 250 200, 200 120 Z"
                    className="wave-core core-mag"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity="0.9"
                    pathLength="100"
                />
                <path
                    d="M 200 120 C 250 200, 320 200, 340 120 C 320 40, 250 40, 200 120 C 150 200, 80 200, 60 120 C 80 40, 150 40, 200 120 Z"
                    className="wave-core core-cy"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity="0.9"
                    pathLength="100"
                />

                {/* Central Sync Dot */}
                <circle cx="200" cy="120" r="5" className="sync-center" fill="#fff" />
            </g>
        </svg>
    );
};

export default VelvetSyncLogo;
