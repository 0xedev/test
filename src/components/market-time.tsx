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
          "inline-flex items-center px-3 py-2 rounded-md font-medium text-sm bg-red-100 text-red-800 border border-red-200 shadow-sm",
          className
        )}
      >
        <span className="flex items-center">
          <span className="mr-1 w-2 h-2 bg-red-500 rounded-full"></span>
          Ended
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-md border border-gray-200 shadow-sm bg-white p-3 text-gray-800",
        className
      )}
    >
      <div className="text-sm font-medium text-gray-500 mb-2">Ends in:</div>
      <div className="flex space-x-2">
        <TimeUnit value={timeLeft.days} label="d" />
        <TimeUnit value={timeLeft.hours} label="h" />
        <TimeUnit value={timeLeft.minutes} label="m" />
        <TimeUnit value={timeLeft.seconds} label="s" />
      </div>
    </div>
  );
}

const TimeUnit = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <div className="bg-gray-100 rounded-md px-3 py-1 min-w-8 text-center font-bold">
      {value}
    </div>
    <div className="text-xs text-gray-500 mt-1">{label}</div>
  </div>
);
