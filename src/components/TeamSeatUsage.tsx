"use client";

interface TeamSeatUsageProps {
  usedSeats: number;
  totalSeats: number;
}

export function TeamSeatUsage({ usedSeats, totalSeats }: TeamSeatUsageProps) {
  const percentage = totalSeats > 0 ? (usedSeats / totalSeats) * 100 : 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-black/70">Seats</span>
        <span className="font-medium text-black">
          {usedSeats} / {totalSeats} used
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-black/10">
        <div
          className="h-full rounded-full bg-black/80 transition-all"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
