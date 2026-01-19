'use client';

import { useEffect, useState } from 'react';
import { Heart, Star, Sparkles } from 'lucide-react';

// Floating particle component - extracted as client component for SSR optimization
export function FloatingParticles() {
    const [particles, setParticles] = useState<Array<{
        id: number;
        left: number;
        delay: number;
        duration: number;
        size: number;
        type: 'heart' | 'star' | 'sparkle';
    }>>([]);

    useEffect(() => {
        // Generate random particles only on client
        const newParticles = Array.from({ length: 12 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            delay: Math.random() * 10,
            duration: 15 + Math.random() * 10,
            size: 12 + Math.random() * 16,
            type: (['heart', 'star', 'sparkle'] as const)[Math.floor(Math.random() * 3)],
        }));
        setParticles(newParticles);
    }, []);

    // Render nothing on server, particles appear after hydration
    if (particles.length === 0) return null;

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="floating-particle text-pink-300/40"
                    style={{
                        left: `${p.left}%`,
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.duration}s, 3s`,
                    }}
                >
                    {p.type === 'heart' && <Heart size={p.size} fill="currentColor" />}
                    {p.type === 'star' && <Star size={p.size} fill="currentColor" />}
                    {p.type === 'sparkle' && <Sparkles size={p.size} />}
                </div>
            ))}
        </div>
    );
}

// Bokeh background circles - can be static CSS, no JS needed
export function BokehBackground() {
    return (
        <div className="bokeh-bg">
            <div
                className="bokeh-circle bg-purple-300/30"
                style={{ width: 300, height: 300, top: '10%', left: '5%' }}
            />
            <div
                className="bokeh-circle bg-pink-300/25"
                style={{ width: 400, height: 400, top: '20%', right: '10%', animationDelay: '1s' }}
            />
            <div
                className="bokeh-circle bg-fuchsia-300/20"
                style={{ width: 250, height: 250, bottom: '15%', left: '15%', animationDelay: '2s' }}
            />
            <div
                className="bokeh-circle bg-violet-300/25"
                style={{ width: 350, height: 350, bottom: '5%', right: '5%', animationDelay: '0.5s' }}
            />
        </div>
    );
}
