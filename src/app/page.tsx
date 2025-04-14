// src/app/page.tsx
import { EnhancedPredictionMarketDashboard } from "@/components/enhanced-prediction-market-dashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forecast - Prediction Market",
  description: "Forecast outcomes!",
  openGraph: {
    title: "Forecast",
    images: ["/icon.jpg"],
  },
  other: {
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl: "https://buster-mkt.vercel.app/icon.jpg",
      button: {
        title: "Forecast",
        action: {
          type: "launch_frame",
          name: "Forecast",
          iconUrl: "https://buster-mkt.vercel.app/icon1.jpg",
          url: "https://buster-mkt.vercel.app",
          splashImageUrl: "https://buster-mkt.vercel.app/icon.jpg",
          splashBackgroundColor: "#ffffff",
        },
      },
    }),
  },
};

export default function Home() {
  return <EnhancedPredictionMarketDashboard />;
}
