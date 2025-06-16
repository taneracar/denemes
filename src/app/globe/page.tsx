"use client";

import React, { useEffect, useState, useRef } from "react";
import * as THREE from "three";
import type { GlobeMethods } from "react-globe.gl";
import dynamic from "next/dynamic";
import gsap from "gsap";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

interface Location {
  id: number;
  country: string;
  continent: string;
  lat: number;
  lng: number;
  subtitle?: string;
  items?: string[];
}

const locations: Location[] = [
  {
    id: 1,
    country: "Germany",
    continent: "Europe",
    lat: 52.52,
    lng: 13.405,
    subtitle: "Berlin HQ",
    items: ["Engineering", "Marketing"],
  },
  {
    id: 9,
    country: "England",
    continent: "Europe",
    lat: 51.5074,
    lng: -0.1278,
    subtitle: "London Office",
    items: ["Sales", "Support"],
  },
  {
    id: 11,
    country: "Russia",
    continent: "Europe",
    lat: 55.7558,
    lng: 37.6176,
    subtitle: "Moscow Team",
  },
  {
    id: 14,
    country: "United States",
    continent: "America",
    lat: 37.0902,
    lng: -95.7129,
    subtitle: "NY Hub",
    items: ["HR", "Legal"],
  },
  {
    id: 15,
    country: "Poland",
    continent: "Europe",
    lat: 52.2297,
    lng: 21.0122,
  },
  {
    id: 16,
    country: "Egypt",
    continent: "Africa",
    lat: 30.0444,
    lng: 31.2357,
    subtitle: "Cairo Dev Center",
  },
  {
    id: 17,
    country: "Turkey",
    continent: "Asia",
    lat: 38.9637,
    lng: 35.2433,
    subtitle: "Istanbul Lab",
    items: ["Frontend", "Backend", "QA"],
  },
];

const continents = {
  Europe: { lat: 28, lng: 15, altitude: 2 },
  Asia: { lat: 34, lng: 100, altitude: 2 },
  America: { lat: 37, lng: -95, altitude: 2 },
  Africa: { lat: 0, lng: 20, altitude: 2 },
};

const getData = async () => {
  const res = await fetch(
    "https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson"
  );
  return res.json();
};

const GlobeComponent = () => {
  const globeEl = useRef<GlobeMethods>();
  const [hexData, setHexData] = useState([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [selectedContinent, setSelectedContinent] = useState<
    keyof typeof continents | null
  >(null);
  const [showDetailed, setShowDetailed] = useState(false);
  const objectRefs = useRef<THREE.Group[]>([]);

  useEffect(() => {
    getData().then((geoData) => {
      setHexData(geoData.features);
    });
  }, []);

  useEffect(() => {
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight + 200,
    });

    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (globeEl.current && selectedContinent) {
      const { lat, lng, altitude } = continents[selectedContinent];
      globeEl.current.pointOfView({ lat, lng, altitude }, 1500);
    }
  }, [selectedContinent]);

  const fadeOutObjects = (): Promise<void> => {
    return new Promise((resolve) => {
      const total = objectRefs.current.length;
      if (total === 0) return resolve();

      let completed = 0;

      objectRefs.current.forEach((group) => {
        group.children.forEach((child) => {
          if (child instanceof THREE.Mesh || child instanceof THREE.Sprite) {
            gsap.to(child.scale, {
              x: 0,
              y: 0,
              z: 0,
              duration: 0.6,
              ease: "power2.inOut",
              onComplete: () => {
                completed++;
                if (completed === total) {
                  objectRefs.current = [];
                  resolve();
                }
              },
            });
          }
        });
      });
    });
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      const controls = globeEl.current?.controls();
      if (controls) {
        controls.enableZoom = false;
        controls.autoRotate = false;
        controls.enableRotate = true;

        const onStart = async () => {
          await fadeOutObjects();
          setSelectedContinent(null);
          setShowDetailed(false);
        };

        controls.addEventListener("start", onStart);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, []);

  const displayedLocations = selectedContinent
    ? locations.filter((loc) => loc.continent === selectedContinent)
    : locations;

  let dirIndex = 0;

  const customThreeObject = (d: object) => {
    if (!showDetailed) return undefined;

    const loc = d as Location;
    const phi = (90 - loc.lat) * (Math.PI / 180);
    const theta = (loc.lng + 90) * (Math.PI / 180);
    const radius = 100;

    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const origin = new THREE.Vector3(x, y, z);

    const directions = [
      new THREE.Vector3(1, 0.8, 1),
      new THREE.Vector3(-1, 1, 1),
      new THREE.Vector3(-1, -0.1, 1),
      new THREE.Vector3(1, -0.1, 1),
    ];
    const lengths = [100, 75, 100, 110];
    const spriteXOffsets = [2, 0, 0, 3];

    const dir = directions[dirIndex % directions.length].clone().normalize();
    const length = lengths[dirIndex % lengths.length];
    const xOffset = spriteXOffsets[dirIndex % spriteXOffsets.length];
    dirIndex++;

    const hex = 0xde271f;

    const rodGeometry = new THREE.CylinderGeometry(0.2, 0.2, length, 8);
    const rodMaterial = new THREE.MeshBasicMaterial({ color: hex });
    const rod = new THREE.Mesh(rodGeometry, rodMaterial);
    rod.position.copy(
      origin.clone().add(dir.clone().multiplyScalar(length / 2))
    );
    rod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone());
    rod.scale.set(1, 0, 1);

    const dotGeometry = new THREE.SphereGeometry(2, 16, 16);
    const dotMaterial = new THREE.MeshBasicMaterial({ color: hex });
    const dot = new THREE.Mesh(dotGeometry, dotMaterial);
    dot.position.copy(origin.clone().add(dir.clone().multiplyScalar(length)));
    dot.scale.set(0, 0, 0);

    const canvas = document.createElement("canvas");
    const size = 512;
    canvas.width = size;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    let yy = 50;

    ctx.font = "bold 48px Arial";

    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.fillText(loc.country, size / 2, yy);

    if (loc.subtitle) {
      ctx.font = "bold 36px Arial";
      yy += 40;
      ctx.fillText(loc.subtitle, size / 2, yy);
    }

    if (loc.items?.length) {
      ctx.font = "italic 20px Arial";
      loc.items.forEach((item) => {
        yy += 30;
        ctx.fillText(`• ${item}`, size / 2, yy);
      });
    }

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.copy(
      dot.position.clone().add(new THREE.Vector3(xOffset, -8, 0))
    );
    sprite.scale.set(0, 0, 0);

    const group = new THREE.Group();
    group.add(rod);
    group.add(dot);
    group.add(sprite);

    objectRefs.current.push(group);

    gsap.to(rod.scale, { y: 1, duration: 1, ease: "power2.inOut" });
    gsap.to(dot.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 1,
      ease: "back.inOut(1.7)",
      delay: 0.2,
    });
    gsap.to(sprite.scale, {
      x: 25,
      y: 12,
      z: 1,
      duration: 1,
      ease: "back.inOut(1.5)",
      delay: 0.4,
    });

    return group;
  };

  return (
    <>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-4 bg-white bg-opacity-60 p-3 rounded-md">
        {Object.keys(continents).map((continent) => (
          <button
            key={continent}
            onClick={async () => {
              if (selectedContinent === continent) return;
              await fadeOutObjects();
              setSelectedContinent(continent as keyof typeof continents);
              setShowDetailed(true);
            }}
            className={`px-4 py-2 rounded-md font-semibold transition-all cursor-pointer ${
              selectedContinent === continent
                ? "bg-purple-600 text-white"
                : "bg-white text-black hover:bg-gray-200"
            }`}
          >
            {continent}
          </button>
        ))}
      </div>

      <div className="absolute inset-0 bg-white overflow-hidden">
        <Globe
          ref={globeEl}
          width={dimensions.width}
          height={dimensions.height}
          globeMaterial={new THREE.MeshBasicMaterial({ color: 0xffffff })}
          hexPolygonsData={hexData}
          hexPolygonResolution={3}
          hexPolygonMargin={0.3}
          hexPolygonUseDots={true}
          hexPolygonColor={() => "rgba(128, 128, 128, 0.2)"}
          backgroundColor="white"
          ringsData={displayedLocations}
          ringColor={() => "#de271f"}
          showAtmosphere={false}
          showGlobe={true}
          customLayerData={displayedLocations}
          customThreeObject={customThreeObject}
          pointsData={displayedLocations}
          pointAltitude={0}
          pointRadius={1.6}
          pointColor={"rgba(0.0.0.0"}
          onPointHover={(point) => {
            // cursor'ı değiştir
            document.body.style.cursor = point ? "pointer" : "default";

            if (point) {
              console.log("Hovered:", point);
            }
          }}
        />
      </div>
    </>
  );
};

export default GlobeComponent;
