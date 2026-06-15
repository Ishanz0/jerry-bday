'use client';

import React, { useRef, Suspense, useState } from 'react';
import { Canvas, useFrame, useLoader, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Stars, Html, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import { X, Heart, Star } from 'lucide-react';

// ==========================================
// User Configurations: Replace these image URLs
// with your local paths once uploaded (e.g. '/images/jerry-1.jpg')
// ==========================================
const JERRY_IMAGES = [
  "https://picsum.photos/seed/jerry1/600/800",
  "https://picsum.photos/seed/jerry2/600/800",
  "https://picsum.photos/seed/jerry3/600/800",
  "https://picsum.photos/seed/jerry4/600/800",
  "https://picsum.photos/seed/jerry5/600/800",
];

const COUNTRY_SPECIFIC_FLIRTS: Record<string, string[]> = {
  "India": [
    "India isn't famous for the Taj Mahal—it's famous for Jerry!! 💖", 
    "Forget Bollywood, Jerry is the real superstar! ✨", 
    "Spicy food? Nothing is spicier than Jerry's smile! 🌶️"
  ],
  "Pakistan": [
    "Ahh Pakistan (laugh)... Jerry literally rules it! 👑", 
    "The mountains are high, but Jerry's standards are higher! 🏔️"
  ],
  "United States": [
    "Forget Hollywood, Jerry is the real main character of the USA! 🎬", 
    "They call it the land of the free, but Jerry holds everyone captive with her looks! 🦅", 
    "New York might never sleep, but Jerry is the one keeping everyone awake! 🌃"
  ],
  "United States of America": [
    "Forget Hollywood, Jerry is the real main character of the USA! 🎬", 
    "They call it the land of the free, but Jerry holds everyone captive with her looks! 🦅"
  ],
  "United Kingdom": [
    "The Crown Jewels have nothing on Jerry's sparkling eyes! 💎", 
    "Tea time is great, but looking at Jerry is definitely the best part of the day! 🫖"
  ],
  "Japan": [
    "Cherry blossoms are beautiful, but they bow down to Jerry's cuteness! 🌸", 
    "Forget anime, Jerry is the ultimate kawaii protagonist! 🥺💖"
  ],
  "France": [
    "Paris is the city of love, but everyone is just looking at Jerry! 🗼", 
    "The Mona Lisa is a masterpiece, but Jerry is the real work of art! 🎨"
  ],
  "Italy": [
    "Pizza is great, but Jerry is the real treat! 🍕", 
    "The Leaning Tower might fall, but I've already fallen for Jerry! 💘"
  ],
  "Brazil": [
    "The Carnival is fun, but Jerry is the real life of the party! 🎭", 
    "Forget the Amazon, getting lost in Jerry's eyes is the real adventure! 🌿"
  ],
  "Australia": [
    "The Great Barrier Reef is stunning, but Jerry is the true natural wonder down under! 🦘"
  ],
  "Canada": [
    "Maple syrup is sweet, but Jerry is the sweetest thing in North America! 🍁", 
    "The winters are cold, but Jerry melts everyone's heart! ❄️❤️"
  ],
  "China": [
    "The Great Wall is massive, but it can't keep my thoughts away from Jerry! 🧱"
  ],
  "Thailand": [
    "Forget the tropical islands, Jerry's smile is the real paradise! 🏝️", 
    "Pad Thai is great, but Jerry is the absolute spiciest catch around! 🌶️"
  ],
  "Egypt": [
    "The Pyramids are ancient wonders, but Jerry is a modern-day goddess! 🏜️"
  ],
  "Mexico": [
    "Tacos are amazing, but Jerry is the absolute zest of life! 🌮", 
    "The beaches are gorgeous, but they don't even compare to Jerry! 🏖️"
  ]
};

const FALLBACK_COMPLIMENTS = [
  "is amazing, but Jerry totally rules it!",
  "is incredibly lucky to be on the same planet as Jerry.",
  "might be huge, but Jerry's heart is so much bigger.",
  "has great sights, but Jerry is the best sight of them all!",
  "could never outshine Jerry's bright smile. ✨",
  "is cool, but Jerry is definitely the richest, most gorgeous girl there!"
];

function CanvasLoader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="text-slate-200 font-sans flex flex-col items-center justify-center whitespace-nowrap bg-black/60 p-4 rounded-xl border border-white/10 backdrop-blur-md">
        <div className="w-8 h-8 border-2 border-white/20 border-t-pink-400 rounded-full animate-spin mb-4" />
        <p className="tracking-widest text-xs uppercase font-medium">{progress.toFixed(0)}% Loading Textures</p>
      </div>
    </Html>
  );
}

interface EarthProps {
  onLocationClick: (country: string, isFetching: boolean) => void;
}

function Earth({ onLocationClick }: EarthProps) {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const sunGroupRef = useRef<THREE.Group>(null);

  // High-resolution textures
  const [colorMap, normalMap, specularMap, cloudsMap] = useLoader(THREE.TextureLoader, [
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png',
  ]);

  cloudsMap.wrapS = THREE.RepeatWrapping;
  cloudsMap.wrapT = THREE.RepeatWrapping;

  const onPointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
  };
  const onPointerOut = () => {
    document.body.style.cursor = 'auto';
  };

  const handleGlobeClick = async (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onLocationClick("", true); 

    const localPoint = event.object.worldToLocal(event.point.clone());
    const radius = 2; // matches args={[2, 64, 64]}
    
    // Clamp to prevent floating point inaccuracy NaN
    const yClamp = Math.max(-1, Math.min(1, localPoint.y / radius));
    const lat = Math.asin(yClamp) * (180 / Math.PI);
    
    // Calculate longitude
    let lon = Math.atan2(localPoint.x, localPoint.z) * (180 / Math.PI);
    // Add offset specifically for the MRDOOB texture alignment
    lon = lon - 90; 
    if (lon < -180) lon += 360;

    try {
      const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
      const data = await res.json();
      
      let locationName = data.countryName || data.locality;
      if (!locationName) {
        locationName = "the Ocean";
      }
      
      onLocationClick(locationName, false);
    } catch (error) {
      console.error("Geocoding failed", error);
      onLocationClick("A Mysterious Place", false);
    }
  };

  useFrame(({ clock }) => {
    const elapsedTime = clock.getElapsedTime();
    if (earthRef.current) {
      earthRef.current.rotation.y = elapsedTime * 0.05;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y = elapsedTime * 0.06;
    }
    if (sunGroupRef.current) {
      sunGroupRef.current.rotation.y = elapsedTime * 0.15;
    }
  });

  return (
    <>
      <ambientLight intensity={0.03} color="#4b9fff" />
      <group ref={sunGroupRef}>
        <directionalLight position={[15, 3, 5]} intensity={3.5} color="#ffffff" castShadow />
        <directionalLight position={[-15, -3, -5]} intensity={0.05} color="#1a3a5c" />
      </group>

      <mesh 
        ref={earthRef} 
        castShadow 
        receiveShadow
        onClick={handleGlobeClick}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
      >
        <sphereGeometry args={[2, 64, 64]} />
        <meshPhongMaterial
          map={colorMap}
          normalMap={normalMap}
          specularMap={specularMap}
          specular={new THREE.Color('gray')}
          shininess={25}
        />
      </mesh>

      <mesh ref={cloudsRef}>
        <sphereGeometry args={[2.02, 64, 64]} />
        <meshPhongMaterial
          map={cloudsMap}
          transparent={true}
          opacity={0.65}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
    </>
  );
}

export default function EarthGlobe() {
  const [modalData, setModalData] = useState<{isOpen: boolean, country: string, isLoading: boolean}>({
    isOpen: false,
    country: "",
    isLoading: false
  });
  
  const [randomImage, setRandomImage] = useState(JERRY_IMAGES[0]);
  const [randomCompliment, setRandomCompliment] = useState(FALLBACK_COMPLIMENTS[0]);

  const handleLocationClick = (country: string, isFetching: boolean) => {
    if (isFetching) {
      setModalData({ isOpen: true, country: "", isLoading: true });
    } else {
      let compliment = "";
      const flirts = COUNTRY_SPECIFIC_FLIRTS[country];
      
      if (flirts && flirts.length > 0) {
        compliment = flirts[Math.floor(Math.random() * flirts.length)];
      } else if (country === "the Ocean") {
        compliment = "Even out in the open ocean depths, Jerry is the ultimate treasure! 🌊💖";
      } else {
        const fallbacks = FALLBACK_COMPLIMENTS;
        compliment = `${country} ${fallbacks[Math.floor(Math.random() * fallbacks.length)]}`;
      }

      setRandomImage(JERRY_IMAGES[Math.floor(Math.random() * JERRY_IMAGES.length)]);
      setRandomCompliment(compliment);
      setModalData({ isOpen: true, country, isLoading: false });
    }
  };

  const closeModal = () => {
    setModalData(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="w-full h-full relative font-sans">
      <div className="absolute inset-0 cursor-move">
        <Canvas camera={{ position: [0, 0, 5.5], fov: 45 }}>
          <Suspense fallback={<CanvasLoader />}>
            <Earth onLocationClick={handleLocationClick} />
            <Stars radius={300} depth={50} count={8000} factor={6} saturation={0} fade={true} speed={0.2} />
            <OrbitControls 
              enableZoom={true} 
              enablePan={false} 
              enableRotate={true}
              zoomSpeed={0.8}
              rotateSpeed={0.5}
              minDistance={2.5}
              maxDistance={12}
              autoRotate={!modalData.isOpen && !modalData.isLoading}
              autoRotateSpeed={0.3}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Persistent Animated Header Instruction */}
      <div className="absolute top-6 sm:top-8 left-3 right-3 sm:left-0 sm:right-0 flex justify-center pointer-events-none z-10">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2.5 sm:px-6 sm:py-3 rounded-full shadow-[0_0_30px_rgba(236,72,153,0.3)] flex items-center justify-center space-x-2 sm:space-x-3 max-w-full">
          <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 animate-pulse delay-75 shrink-0" />
          <p className="text-white font-medium tracking-wide text-xs sm:text-sm md:text-base drop-shadow-md text-center">
            Click any country to see something cute!
          </p>
          <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500 animate-bounce shrink-0" />
        </div>
      </div>

      {/* Dynamic Flirt Modal */}
      {modalData.isOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-5 sm:p-6 w-full max-w-[340px] sm:max-w-sm flex flex-col items-center animate-in fade-in zoom-in duration-300 shadow-2xl relative">
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/30 hover:bg-black/50 rounded-full p-1.5 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            
            {modalData.isLoading ? (
               <div className="flex flex-col items-center justify-center py-12">
                 <div className="w-10 h-10 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin mb-3" />
                 <p className="text-pink-100 font-medium tracking-wide animate-pulse text-sm">Triangulating...</p>
               </div>
            ) : (
              <>
                <div className="w-full aspect-[4/5] bg-black/40 rounded-2xl sm:rounded-3xl overflow-hidden mb-4 relative shadow-inner border border-white/10 group">
                  <img 
                    src={randomImage} 
                    alt="Jerry" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 flex items-end">
                    <p className="text-white font-bold text-lg sm:text-2xl drop-shadow-lg flex items-center gap-2">
                       📍 {modalData.country === "the Ocean" ? "The Ocean" : modalData.country}
                    </p>
                  </div>
                </div>
                
                <div className="bg-pink-500/10 border border-pink-500/30 rounded-xl sm:rounded-2xl p-4 w-full text-center shadow-[inset_0_0_20px_rgba(236,72,153,0.1)]">
                  <p className="text-pink-100 font-medium text-sm sm:text-lg leading-relaxed drop-shadow-sm">
                    {randomCompliment}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
