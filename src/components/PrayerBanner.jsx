import { usePrayerTimes } from "../hooks/usePrayerTimes";

export default function PrayerBanner({ location, onOpenLocation }) {
  const { times, loading } = usePrayerTimes({
    city: location?.city,
    country: location?.country,
    lat: location?.lat,
    lng: location?.lng,
  });

  if (loading) return <div className="prayer-banner">Loading prayer times...</div>;
  if (!times) return null;

  return (
    <div className="prayer-banner">
      <div className="prayer-banner-title" onClick={onOpenLocation} style={{ cursor: "pointer" }}>
        PRAYER TIMES{location?.city ? ` — ${location.city.toUpperCase()}` : ""}
      </div>
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
