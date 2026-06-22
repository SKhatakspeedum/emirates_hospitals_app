import React from "react";

interface WebTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
  title?: string;
}

const pad = (num: number) => (num < 10 ? `0${num}` : `${num}`);

export default function WebTimePicker({ value, onChange, onClose, title }: WebTimePickerProps) {
  // Internal state for time selection
  const [time, setTime] = React.useState(() => {
    const h = pad(value.getHours());
    const m = pad(value.getMinutes());
    return `${h}:${m}`;
  });

  // Sync prop value if changed externally
  React.useEffect(() => {
    const h = pad(value.getHours());
    const m = pad(value.getMinutes());
    setTime(`${h}:${m}`);
  }, [value]);

  return (
    <div
      style={{
        background: "#fff",
        padding: 24,
        borderRadius: 10,
        boxShadow: "0 2px 16px #0002",
        width: 320,
        height: 220,
        margin: "32px auto",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>{title || "Select Bedtime"}</div>
      <input
        type="time"
        value={time}
        onChange={e => setTime(e.target.value)}
        style={{ fontSize: 18, padding: 8, borderRadius: 6, border: "1px solid #ccc", marginBottom: 24, width: 140 }}
      />
      <div>
        <button
          onClick={() => {
            // Parse and emit selected time
            const [h, m] = time.split(":").map(Number);
            const newDate = new Date(value);
            newDate.setHours(h, m, 0, 0);
            onChange(newDate);
            onClose();
          }}
          style={{ background: "#7E3AF2", color: "#fff", border: 0, borderRadius: 6, padding: "8px 32px", fontSize: 16, cursor: "pointer" }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
