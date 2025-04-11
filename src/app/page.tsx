import { EnhancedPredictionMarketDashboard } from "@/components/enhanced-prediction-market-dashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "ForeCast - Prediction Market",
  description: "Forecast outcomes!",
  openGraph: {
    title: "ForeCast",
    images: ["/banner2.avif"],
  },
  other: {
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl: "https://buster-mkt.vercel.app/Banner.jpg",
      button: {
        title: "ForeCast now!",
        action: {
          type: "launch_frame",
          url: "https://buster-mkt.vercel.app",
          name: "ForeCast",
          splashImageUrl: "https://buster-mkt.vercel.app/banner2.avif",
          splashBackgroundColor: "#ffffff",
        },
      },
    }),
  },
};

export default function Home() {
  return <EnhancedPredictionMarketDashboard />;
}
