export default function WatermarkBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden -z-10"
      style={{ opacity: 0.03 }}
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <span
          key={i}
          className="absolute font-serif font-bold text-navy-950 whitespace-nowrap select-none"
          style={{
            fontSize: `${80 + i * 20}px`,
            top: `${i * 12}%`,
            left: `${i % 2 === 0 ? '-5%' : '30%'}`,
            transform: `rotate(${-15 + i * 5}deg)`,
          }}
        >
          Aizawl Bible College
        </span>
      ))}
    </div>
  );
}
