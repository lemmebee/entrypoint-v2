import { usePrayerTimes } from "../hooks/usePrayerTimes";

export default function PrayerBanner() {
  const { times, loading } = usePrayerTimes();

  if (loading) return <div className="prayer-banner">Loading prayer times...</div>;
  if (!times) return null;

  return (
    <div className="prayer-banner">
      <div className="prayer-banner-title">PRAYER TIMES — LYON</div>
      <div className="prayer-times-row">
        {Object.entries(times).map(([name, time]) => (
          <div key={name} className="prayer-time-item">
            <span className="prayer-name">{name}</span>
            <span className="prayer-time">{time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
