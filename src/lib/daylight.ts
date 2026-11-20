// Day / night for the home page street, from the visitor's real clock.
//
// We work out where the sun is for the visitor right now and turn that into a
// 0 → 1 "daylight" value: 0 = full night, 1 = full day, with a smooth dusk and
// dawn in between (sun from 6° below to 6° above the horizon).
//
// No location permission is asked for: latitude defaults to New York (the
// studio's city) and longitude is estimated from the visitor's time zone, so
// sunrise/sunset land at about the right time on their own clock.
//
// Override for previews: add ?time=day, ?time=night, ?time=dusk to the URL.

const RAD = Math.PI / 180;

/** Sun elevation in degrees above the horizon. */
export function sunElevation(date: Date, latDeg: number, lonDeg: number): number {
  const d = (date.getTime() - Date.UTC(2000, 0, 1, 12)) / 86_400_000; // days since J2000
  const g = (357.529 + 0.98560028 * d) * RAD; // mean anomaly
  const q = 280.459 + 0.98564736 * d; // mean longitude
  const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD; // ecliptic longitude
  const e = (23.439 - 0.00000036 * d) * RAD; // obliquity
  const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L));
  const dec = Math.asin(Math.sin(e) * Math.sin(L));
  const gmst = (18.697374558 + 24.06570982441908 * d) % 24;
  const ha = (gmst * 15 + lonDeg) * RAD - ra; // hour angle
  const lat = latDeg * RAD;
  return Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(ha)) / RAD;
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** 0 = night, 1 = day, for the visitor's current moment. */
export function daylight(now = new Date()): number {
  if (typeof window !== "undefined") {
    const o = new URLSearchParams(window.location.search).get("time");
    if (o === "day") return 1;
    if (o === "night") return 0;
    if (o === "dusk") return 0.5;
  }
  const lon = -now.getTimezoneOffset() / 4; // minutes east of UTC → degrees
  const elevation = sunElevation(now, 40.7, lon);
  return smooth(-6, 6, elevation);
}
