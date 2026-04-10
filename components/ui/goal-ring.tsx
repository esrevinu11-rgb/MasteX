interface GoalRingProps {
  current: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export function GoalRing({
  current,
  goal,
  size = 80,
  strokeWidth = 7,
  color = "#F59E0B",
}: GoalRingProps) {
  const pct = goal > 0 ? Math.min(current / goal, 1) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  return (
    <svg
      width={size}
      height={size}
      className="-rotate-90"
      aria-label={`${Math.round(pct * 100)}% of daily goal`}
    >
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#2E2C28"
        strokeWidth={strokeWidth}
      />
      {/* Progress */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.7s ease" }}
      />
    </svg>
  );
}
