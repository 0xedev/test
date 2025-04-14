// src/app/page.tsx
import { EnhancedPredictionMarketDashboard } from "@/components/enhanced-prediction-market-dashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ForeCast - Prediction Market",
  description: "Forecast outcomes!",
  openGraph: {
    title: "ForeCast",
    images: ["/Banner.jpg"],
  },
  other: {
    "fc:frame": "1",
    "fc:frame:image": "https://buster-mkt.vercel.app/Banner.jpg",
    "fc:frame:button:1": "Enter ForeCast",
    "fc:frame:button:1:action": "link",
    "fc:frame:button:1:target": "https://buster-mkt.vercel.app",
  },
};

export default function Home() {
  return <EnhancedPredictionMarketDashboard />;
}
