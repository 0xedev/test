import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface MarketTimeProps {
  endTime: bigint;
  className?: string;
}

const calculateTimeLeft = (endTime: bigint) => {
  const difference = Number(endTime) * 1000 - Date.now();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
};

export default function MarketTime({ endTime, className }: MarketTimeProps) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(endTime));
  const isEnded = new Date(Number(endTime) * 1000) < new Date();

  useEffect(() => {
    if (isEnded) return;

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(endTime));
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, isEnded]);

  if (isEnded) {
    return (
      <div
        className={cn(
          "text-xs px-1.5 py-0.5 rounded-sm bg-red-100 text-red-800 border border-red-200 flex items-center",
          className
        )}
      >
        <span className="h-1 w-1 bg-red-500 rounded-full mr-1"></span>
        Ended
      </div>
    );
  }

  return (
    <div
      className={cn(
        "text-xs px-1.5 py-0.5 rounded-sm bg-gray-50 border border-gray-200 flex items-center",
        className
      )}
    >
      <span className="text-gray-500 mr-1">Ends:</span>
      {timeLeft.days > 0 && <span className="mr-1">{timeLeft.days}d</span>}
      <span className="mr-1">{String(timeLeft.hours).padStart(2, "0")}h</span>
      <span className="mr-1">{String(timeLeft.minutes).padStart(2, "0")}m</span>
      <span>{String(timeLeft.seconds).padStart(2, "0")}s</span>
    </div>
  );
}
