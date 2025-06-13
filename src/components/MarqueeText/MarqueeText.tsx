"use client";
import React, { useEffect, useState } from "react";
import Marquee from "react-fast-marquee";

// Marquee'nin direction prop'unun kabul ettiği tipleri bir Type olarak tanımla
type MarqueeDirection = "left" | "right" | "up" | "down";

interface MarqueeTextProps {
  text: string; // Kaydırılacak metin
}
const MarqueeText = ({ text }: MarqueeTextProps) => {
  // useState'e tipini açıkça belirtiyoruz
  const [currentDirection, setCurrentDirection] =
    useState<MarqueeDirection>("left");
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentDirection((prevDirection) =>
        prevDirection === "left" ? "right" : "left"
      );
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);
  return (
    <div>
      <Marquee
        speed={150}
        gradient={false}
        pauseOnHover={true}
        direction={currentDirection}
        loop={0}
        autoFill={true}
        className="bg-transparent h-14 border-t border-[#707070]"
      >
        <span className="px-10  pt-4 text-[#707070]">{text}</span>
      </Marquee>
    </div>
  );
};

export default MarqueeText;
