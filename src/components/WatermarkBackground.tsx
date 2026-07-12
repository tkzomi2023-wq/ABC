interface WatermarkBackgroundProps {
  text?: string;
  opacity?: number;
  rotation?: number;
  fontSize?: number;
  gap?: number;
  className?: string;
}

export function WatermarkBackground({
  text = "Aizawl Bible College",
  opacity = 0.12,
  rotation = -30,
  fontSize = 18,
  gap = 20,
  className = "",
}: WatermarkBackgroundProps) {
  const rows = 30;
  const cols = 8;

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
    >
      <div
        className="absolute inset-0 flex flex-wrap justify-center items-center"
        style={{
          transform: `rotate(${rotation}deg)`,
          transformOrigin: "center center",
          width: "150%",
          height: "150%",
          left: "-25%",
          top: "-25%",
        }}
      >
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="flex flex-nowrap justify-center"
            style={{
              width: "100%",
              marginTop: rowIndex === 0 ? 0 : gap,
            }}
          >
            {Array.from({ length: cols }).map((_, colIndex) => (
              <span
                key={colIndex}
                className="font-serif font-bold select-none whitespace-nowrap"
                style={{
                  fontSize: `${fontSize}px`,
                  color: `rgba(26, 39, 68, ${opacity})`,
                  marginRight: `${gap * 2}px`,
                  letterSpacing: "0.1em",
                }}
              >
                {text}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
