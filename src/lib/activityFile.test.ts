import { describe, expect, it } from "vitest";
import { parseActivity, summary } from "./activityFile";

const TCX = `<?xml version="1.0"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">
 <Activities>
  <Activity Sport="Running">
   <Id>2026-09-28T07:12:00Z</Id>
   <Lap StartTime="2026-09-28T07:12:00Z">
    <TotalTimeSeconds>1800.0</TotalTimeSeconds>
    <DistanceMeters>5400.0</DistanceMeters>
    <Calories>320</Calories>
    <AverageHeartRateBpm><Value>148</Value></AverageHeartRateBpm>
    <MaximumHeartRateBpm><Value>171</Value></MaximumHeartRateBpm>
    <Track>
     <Trackpoint><Time>2026-09-28T07:12:00Z</Time><AltitudeMeters>40.0</AltitudeMeters><HeartRateBpm><Value>140</Value></HeartRateBpm></Trackpoint>
     <Trackpoint><Time>2026-09-28T07:13:00Z</Time><AltitudeMeters>52.0</AltitudeMeters><HeartRateBpm><Value>150</Value></HeartRateBpm></Trackpoint>
     <Trackpoint><Time>2026-09-28T07:14:00Z</Time><AltitudeMeters>48.0</AltitudeMeters><HeartRateBpm><Value>176</Value></HeartRateBpm></Trackpoint>
    </Track>
   </Lap>
   <Lap StartTime="2026-09-28T07:42:00Z">
    <TotalTimeSeconds>600.0</TotalTimeSeconds>
    <DistanceMeters>1600.0</DistanceMeters>
    <Calories>90</Calories>
   </Lap>
  </Activity>
 </Activities>
</TrainingCenterDatabase>`;

const GPX = `<?xml version="1.0"?>
<gpx version="1.1" creator="StravaGPX">
 <trk>
  <name>Sortie longue</name>
  <type>running</type>
  <trkseg>
   <trkpt lat="48.8400" lon="2.4200"><ele>35.0</ele><time>2026-09-26T08:00:00Z</time>
    <extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>132</gpxtpx:hr></gpxtpx:TrackPointExtension></extensions>
   </trkpt>
   <trkpt lat="48.8500" lon="2.4200"><ele>38.0</ele><time>2026-09-26T08:07:00Z</time>
    <extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>150</gpxtpx:hr></gpxtpx:TrackPointExtension></extensions>
   </trkpt>
   <trkpt lat="48.8600" lon="2.4200"><ele>36.0</ele><time>2026-09-26T08:14:00Z</time>
    <extensions><gpxtpx:TrackPointExtension><gpxtpx:hr>162</gpxtpx:hr></gpxtpx:TrackPointExtension></extensions>
   </trkpt>
  </trkseg>
 </trk>
</gpx>`;

describe("fichier TCX", () => {
  const a = parseActivity(TCX)!;

  it("additionne la durée, la distance et les calories de tous les tours", () => {
    expect(a.format).toBe("tcx");
    expect(a.seconds).toBe(2400);
    expect(a.distance).toBe(7000);
    expect(a.calories).toBe(410);
  });

  it("préfère la fréquence cardiaque annoncée par le tour, et retient le maximum", () => {
    expect(a.avgHr).toBe(148);
    expect(a.maxHr).toBe(176);
  });

  it("ne compte que les montées dans le dénivelé", () => {
    expect(a.elevation).toBe(12);
  });

  it("reprend la date et le sport du fichier", () => {
    expect(a.startedAt).toBe("2026-09-28T07:12:00Z");
    expect(a.sport).toBe("Running");
  });
});

describe("fichier GPX", () => {
  const a = parseActivity(GPX)!;

  it("calcule la distance à partir des points, à quelques mètres près", () => {
    expect(a.format).toBe("gpx");
    // Deux fois 0,01° de latitude, soit environ 1 112 m chacun.
    expect(a.distance).toBeGreaterThan(2200);
    expect(a.distance).toBeLessThan(2250);
  });

  it("déduit la durée des horodatages", () => {
    expect(a.seconds).toBe(840);
  });

  it("lit la fréquence cardiaque quel que soit le préfixe de l'extension", () => {
    expect(a.avgHr).toBe(148);
    expect(a.maxHr).toBe(162);
  });

  it("ne compte que les montées dans le dénivelé", () => {
    expect(a.elevation).toBe(3);
  });
});

describe("valeurs nulles", () => {
  it("traite un zéro comme une absence de mesure, pour ne pas écraser une saisie", () => {
    const indoor = `<TrainingCenterDatabase><Activities><Activity Sport="Other">
      <Lap><TotalTimeSeconds>3120</TotalTimeSeconds><DistanceMeters>0</DistanceMeters>
      <Calories>410</Calories></Lap></Activity></Activities></TrainingCenterDatabase>`;
    const a = parseActivity(indoor)!;
    expect(a.seconds).toBe(3120);
    expect(a.distance).toBeUndefined();
    expect(a.calories).toBe(410);
  });
});

describe("fichier illisible", () => {
  it("renvoie null plutôt que d'inventer", () => {
    expect(parseActivity("bonjour")).toBeNull();
    expect(parseActivity("<html><body>404</body></html>")).toBeNull();
  });
});

describe("résumé", () => {
  it("écrit ce qui a été trouvé", () => {
    expect(summary(parseActivity(TCX)!)).toBe("40 min · 7 km · 148 bpm · 12 m D+ · 410 kcal");
  });

  it("le dit quand il n'y a rien à reprendre", () => {
    expect(summary({ format: "gpx" })).toBe("aucune donnée exploitable");
  });
});
