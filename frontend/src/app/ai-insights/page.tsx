"use client";

import { useEffect } from "react";
import { getDashboardAIInsights } from "@/lib/ai";

export default function TestAI() {
  useEffect(() => {
    async function test() {
      try {
        const data = await getDashboardAIInsights();

        console.log("AI RESPONSE:", data);
      } catch (error) {
        console.error("AI ERROR:", error);
      }
    }

    test();
  }, []);

  return <div>Testing AI...</div>;
}