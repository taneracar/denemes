"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const panels = [
  "bg-red-300",
  "bg-yellow-300",
  "bg-blue-300",
  "bg-orange-300",
  "bg-green-300",
];

const ScrollAnimation = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const sections = gsap.utils.toArray<HTMLElement>(".panel");

      sections.forEach((panel, i) => {
        const next = sections[i + 1];
        if (!next) return;

        // Panel-i pinle
        ScrollTrigger.create({
          trigger: panel,
          start: "top top",
          end: "bottom top",
          pin: true,
          pinSpacing: true,
        });

        // Panel-i scale ve shadow ile küçült (scroll esnasında)
        gsap.to(panel, {
          scale: 0.92,
          boxShadow: "0 25px 50px rgba(0,0,0,0.15)",
          scrollTrigger: {
            trigger: next,
            start: "top bottom",
            end: "top top",
            scrub: true,
          },
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {panels.map((color, i) => (
        <div
          key={i}
          className={`panel w-full h-screen ${color} flex justify-center items-center text-4xl font-bold transition-all duration-500 rounded-xl`}
        >
          Panel {i + 1}
        </div>
      ))}
    </div>
  );
};

export default ScrollAnimation;
