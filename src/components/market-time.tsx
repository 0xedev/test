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

export function MarketTime({ endTime, className }: MarketTimeProps) {
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
          "mb-2 w-fit px-2 py-1 rounded border text-xs bg-red-200 border-red-300 text-red-800",
          className
        )}
      >
        Ended
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mb-2 w-fit px-2 py-1 rounded border text-xs border-gray-300 text-gray-800",
        className
      )}
    >
      <div>Ends in:</div>
      <div>{timeLeft.days}d</div>
      <div>{timeLeft.hours}h</div>
      <div>{timeLeft.minutes}m</div>
      <div>{timeLeft.seconds}s</div>
    </div>
  );
}
