interface SignalTrademarkProps {
  className?: string;
}

export default function SignalTrademark({ className = '' }: SignalTrademarkProps) {
  return (
    <span
      className={`trademark-signal font-extrabold ${className}`}
      style={{
        fontFamily: "Lecturis, 'FH Lecturis', 'IBM Plex Sans', system-ui, sans-serif",
        fontWeight: 800,
        letterSpacing: '-0.02em',
      }}
    >
      SIGNAL
    </span>
  );
}
