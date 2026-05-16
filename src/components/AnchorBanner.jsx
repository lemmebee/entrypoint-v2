import { useAnchorTimes } from "../hooks/useAnchorTimes";

export default function AnchorBanner({ location, onOpenLocation }) {
  const { times, loading } = useAnchorTimes({
    city: location?.city,
    country: location?.country,
    lat: location?.lat,
    lng: location?.lng,
  });

  if (loading) return <div className="anchor-banner">Loading time anchors...</div>;
  if (!times) return null;

  return (
    <div className="anchor-banner">
      <div className="anchor-banner-title" onClick={onOpenLocation} style={{ cursor: "pointer" }}>
        TIME ANCHORS{location?.city ? ` — ${location.city.toUpperCase()}` : ""}
      </div>
      <div className="anchor-times-row">
        {Object.entries(times).map(([name, time]) => (
          <div key={name} className="anchor-time-item">
            <span className="anchor-name">{name}</span>
            <span className="anchor-time">{time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
