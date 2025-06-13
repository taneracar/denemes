"use client";

import React, { useEffect, useState, useRef } from "react";
import * as THREE from "three";
//import Globe from "react-globe.gl";
import type { GlobeMethods } from "react-globe.gl";

import dynamic from "next/dynamic";
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });
interface Location {
  id: number;
  country: string;
  continent: string;
  lat: number;
  lng: number;
}

const locations: Location[] = [
  { id: 1, country: "Germany", continent: "Europe", lat: 52.52, lng: 13.405 },
  {
    id: 9,
    country: "England", // Birleşik Krallık olarak geçiyor burada
    continent: "Europe",
    lat: 51.5074,
    lng: -0.1278,
  },
  {
    id: 11,
    country: "Russia",
    continent: "Europe",
    lat: 55.7558,
    lng: 37.6176,
  },
  {
    id: 14,
    country: "United States",
    continent: "America",
    lat: 37.0902,
    lng: -95.7129,
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
  },
  {
    id: 17,
    country: "Turkey",
    continent: "Asia",
    lat: 38.9637,
    lng: 35.2433,
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
  const globeEl = useRef<GlobeMethods | undefined>(undefined);
  const [hexData, setHexData] = useState([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [selectedContinent, setSelectedContinent] =
    useState<keyof typeof continents>("Europe");

  useEffect(() => {
    getData().then((geoData) => {
      setHexData(geoData.features);
      console.log(geoData.features);
    });
  }, []);

  useEffect(() => {
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight + 200,
    });

    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
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

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (globeEl.current) {
        const controls = globeEl.current.controls();
        if (controls) {
          controls.enableZoom = false;
          controls.autoRotate = false;
          controls.enableRotate = false;
          controls.update();
        }
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, []);

  const ringsToShow = locations.filter(
    (loc) => loc.continent === selectedContinent
  );

  let dirIndex = 0;

  const customThreeObject = (d: object) => {
    const loc = d as Location;

    // LatLng -> 3D coordinate dönüşümü
    const phi = (90 - loc.lat) * (Math.PI / 180);
    const theta = (loc.lng + 90) * (Math.PI / 180);
    const radius = 100;

    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const position = new THREE.Vector3(x, y, z);

    const origin = position.clone();

    // 📌 Dört köşeye doğru yönler tanımla
    const directions = [
      new THREE.Vector3(1, 0.8, 1), // sağ üst
      new THREE.Vector3(-1, 1, 1), // sol üst
      new THREE.Vector3(-1, -0.1, 1), // sol alt (hafif yukarı)
      new THREE.Vector3(1, -0.1, 1), // sağ alt
    ];

    // 📏 Her indexe özel uzunluklar tanımla
    const lengths = [100, 75, 100, 110]; // sırayla kullanılacak uzunluklar

    const dir = directions[dirIndex % directions.length].clone().normalize();
    const length = lengths[dirIndex % lengths.length];
    dirIndex++;

    const hex = 0xde271f;

    // Çubuğu oluştur
    const rodGeometry = new THREE.CylinderGeometry(0.2, 0.2, length, 8);
    const rodMaterial = new THREE.MeshBasicMaterial({ color: hex });
    const rod = new THREE.Mesh(rodGeometry, rodMaterial);
    rod.position.copy(
      origin.clone().add(dir.clone().multiplyScalar(length / 2))
    );
    rod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone());

    // Nokta
    const dotGeometry = new THREE.SphereGeometry(2, 16, 16);
    const dotMaterial = new THREE.MeshBasicMaterial({ color: hex });
    const dot = new THREE.Mesh(dotGeometry, dotMaterial);
    dot.position.copy(origin.clone().add(dir.clone().multiplyScalar(length)));

    // Yazı
    const canvas = document.createElement("canvas");
    const size = 256;
    canvas.width = size;
    canvas.height = 64;
    const ctx = canvas.getContext("2d")!;
    ctx.font = "36px Arial";
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.fillText(loc.country, size / 2, 48);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    const spriteXOffsets = [0, 0, 0, 0]; // Her çubuk için manuel X offset
    const xOffset = spriteXOffsets[dirIndex % spriteXOffsets.length];
    sprite.position.copy(
      dot.position.clone().add(new THREE.Vector3(xOffset, -5, 0))
    );
    sprite.scale.set(20, 5, 1);

    const group = new THREE.Group();
    group.add(rod);
    group.add(dot);
    group.add(sprite);

    return group;
  };

  // Eğer güncellemek istersek (mesela animasyon vs) burada yapabiliriz

  return (
    <>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-4 bg-white bg-opacity-60 p-3 rounded-md">
        {Object.keys(continents).map((continent) => (
          <button
            key={continent}
            onClick={() =>
              setSelectedContinent(continent as keyof typeof continents)
            }
            className={`px-4 py-2 rounded-md font-semibold ${
              selectedContinent === continent
                ? "bg-purple-600 text-white"
                : "bg-white-300 text-black"
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
          ringsData={ringsToShow}
          arcColor={(arc: any) => arc.color}
          arcStroke={0.6}
          arcDashLength={1}
          arcDashGap={1}
          arcDashInitialGap={() => Math.random()}
          arcDashAnimateTime={1600}
          arcAltitudeAutoScale={0.4}
          ringColor={() => "#de271f"}
          showAtmosphere={false}
          showGlobe={true}
          customLayerData={ringsToShow}
          customThreeObject={customThreeObject}
        />
      </div>
    </>
  );
};

export default GlobeComponent;
