import { Router, type IRouter } from "express";
import { CalculateVertexBody, CalculateVertexResponse } from "@workspace/api-zod";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const swe = require("swisseph");

const router: IRouter = Router();

const ZODIAC_SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

function longitudeToSign(longitude: number): { sign: string; degreeInSign: number } {
  const normalizedLon = ((longitude % 360) + 360) % 360;
  const signIndex = Math.floor(normalizedLon / 30);
  const degreeInSign = normalizedLon % 30;
  return {
    sign: ZODIAC_SIGNS[signIndex] ?? "Unknown",
    degreeInSign: Math.round(degreeInSign * 100) / 100,
  };
}

router.post("/calculate-vertex", (req, res) => {
  const parseResult = CalculateVertexBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid input: " + parseResult.error.message });
    return;
  }

  const { name, date, time, lat, lon } = parseResult.data;

  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);

  if (
    !year || !month || !day ||
    hour === undefined || minute === undefined ||
    isNaN(year) || isNaN(month) || isNaN(day) ||
    isNaN(hour) || isNaN(minute)
  ) {
    res.status(400).json({ error: "Invalid date or time format" });
    return;
  }

  const utcHour = hour + minute / 60;

  try {
    swe.swe_set_ephe_path("");

    const julianDay = swe.swe_julday(year, month, day, utcHour, swe.SE_GREG_CAL);

    const PLACIDUS = "P".charCodeAt(0);
    const flags = 0;

    const housesResult = swe.swe_houses_ex(julianDay, flags, lat, lon, PLACIDUS);

    if (!housesResult || typeof housesResult.vertex === "undefined") {
      req.log.error({ housesResult }, "swe_houses_ex returned invalid result");
      res.status(500).json({ error: "Failed to calculate houses — invalid result from ephemeris" });
      return;
    }

    const vertexLongitude: number = housesResult.vertex;
    const { sign, degreeInSign } = longitudeToSign(vertexLongitude);

    const response = CalculateVertexResponse.parse({
      vertex_degree: Math.round(vertexLongitude * 10000) / 10000,
      vertex_sign: sign,
      vertex_degree_in_sign: degreeInSign,
      name: name ?? undefined,
    });

    res.json(response);
  } catch (err) {
    req.log.error({ err }, "Error calculating vertex");
    res.status(500).json({ error: "Failed to calculate Vertex. Please check your inputs and try again." });
  }
});

export default router;
