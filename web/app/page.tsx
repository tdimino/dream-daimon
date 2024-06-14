"use client";

import { useRef, useState, Fragment } from "react";
import DarkModeBackground from "@/components/DarkModeBackground";
import Link from 'next/link'; 
import { Button } from "@/components/button"; 
import MadeWithSoulEngine from "@/components/MadeWithSoulEngine";
import JoinDiscord from "@/components/JoinDiscord";
import FAQ from "@/components/FAQ"; 
import Image from 'next/image';

export default function DreamPage() {
  const [isDarkMode] = useState(true); // Set to true by default

  return (
    <div className="py-6">
      {isDarkMode && <DarkModeBackground />}
      <div className="fixed top-0 left-0 right-0 flex justify-between p-4">
        <div className="hidden sm:block">
          <MadeWithSoulEngine position="left" />
        </div>
        <div className="hidden sm:block">
          <JoinDiscord position="right" />
        </div>
      </div>
      <div className="mb-10 flex">
          <h1 className={`h-10 text-2xl font-heading sm:text-3xl tracking-tighter large-heading ${isDarkMode ? 'matrix-green' : ''}`}>
            Dream Daimon
          </h1>
      </div>
      <div className="flex flex-col gap-6 pb-2"> {/* Adjusted padding-bottom */}
        <div className="text-center">
          <Button asChild className="tyrian-purple large-button">
            <Link href="/simulation" className="h-full w-full flex items-center justify-center">
              New game
            </Link>
          </Button>
        </div>
        <FAQ />
        <div className="flex flex-col items-center mb-1"> {/* Centered and reduced margin-bottom */}
          <Link href="https://www.minoanmystery.org/" target="_blank" rel="noopener noreferrer">
            <div className="seal-of-minos-container">
              <Image src="/sealOfMinos.png" alt="Seal of Minos" width={150} height={150} />
              <div className="seal-of-minos-glow" />
            </div>
          </Link>
          <p className="mt-1 text-center text-sm text-gray-400"> {/* Lighter grey and reduced margin-top */}
            © Al-Tamarru, 2024
          </p>
        </div>
      </div>
    </div>
  );
}
