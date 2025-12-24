
import React, { useState, useEffect } from 'react';

const images = [
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2070&auto=format=fit=crop', // Snowy mountains night
    'https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=2070&auto=format=fit=crop', // Tokyo street night
    'https://images.unsplash.com/photo-1554147090-e1221a04a025?q=80&w=2070&auto=format=fit=crop', // Colorful liquid swirls
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format=fit=crop', // Earth from space
    'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=2070&auto=format=fit=crop', // Lake and mountains
    'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?q=80&w=2072&auto=format=fit=crop', // Neon signs
    'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=2071&auto=format=fit=crop', // Nebula
    'https://images.unsplash.com/photo-1620421680121-592b2910a0ce?q=80&w=2070&auto=format=fit=crop'  // 3D abstract shapes
];


const AnimatedArtDisplay: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, 5000); // Change image every 5 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full h-full relative overflow-hidden animate-glow">
            {images.map((src, index) => (
                <div
                    key={src}
                    className="absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-1000"
                    style={{
                        backgroundImage: `url(${src})`,
                        opacity: currentIndex === index ? 1 : 0,
                        animation: currentIndex === index ? `image-fade-zoom 5.5s ease-in-out` : 'none',
                    }}
                />
            ))}
             <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-slate-900/20"></div>
        </div>
    );
};

export default AnimatedArtDisplay;
