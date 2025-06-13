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

      sections.forEach((panel, index) => {
        if (index === sections.length - 1) return;

        gsap.to(sections[index + 1], {
          scrollTrigger: {
            trigger: panel,
            start: "top top",
            end: "bottom top",
            scrub: true,
            pin: true,
            pinSpacing: false,
          },
          y: 0,
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef}>
      {panels.map((color, i) => (
        <div
          key={i}
          className={`panel w-full h-screen ${color} flex justify-center items-center text-4xl font-bold`}
        >
          Panel {i + 1}
        </div>
      ))}
    </div>
  );
};

export default ScrollAnimation;
