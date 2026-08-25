"use client"
import React, { useEffect, useState } from 'react'

export default function Home() {
  const [status, setStatus] = useState("Checking backend....");
  const [error, setError] = useState("");



  return(
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">
          BakiGuard AI
        </h1>
      </div>
    </main>
  );
}
