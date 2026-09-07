import { describe, expect, it } from "vitest";
import { cssPace, formatPace, formatTime, isValidTest, parseTime, swimPaces } from "./swim";

describe("calcul de la CSS", () => {
  it("ramène l'écart des deux tests à une allure au 100 m", () => {
    // 400 m en 8'00, 200 m en 3'40 : 260 s pour 200 m de plus, soit 2'10 au 100.
    expect(cssPace(480, 220)).toBe(130);
    expect(formatPace(cssPace(480, 220))).toBe("2'10");
  });

  it("donne une allure plausible pour un nageur lent", () => {
    // Le niveau de Guil en août 2026 : environ 3'15 au 100 m.
    const css = cssPace(13 * 60, 6 * 60 + 15);
    expect(formatPace(css)).toBe("3'23");
  });
});

describe("validation du test", () => {
  it("refuse un 400 plus rapide que le 200", () => {
    expect(isValidTest(200, 400)).toBe(false);
    expect(isValidTest(400, 400)).toBe(false);
  });

  it("refuse une allure absurde", () => {
    expect(isValidTest(500, 480)).toBe(false); // 10 s au 100 m
    expect(isValidTest(2000, 200)).toBe(false); // 15 min au 100 m
  });

  it("accepte un test cohérent", () => {
    expect(isValidTest(480, 220)).toBe(true);
    expect(isValidTest(780, 375)).toBe(true);
  });
});

describe("saisie des temps", () => {
  it("lit les formats courants", () => {
    expect(parseTime("8:00")).toBe(480);
    expect(parseTime("8'00")).toBe(480);
    expect(parseTime("13:05")).toBe(785);
    expect(parseTime("480")).toBe(480);
  });

  it("rejette ce qui n'est pas un temps", () => {
    expect(parseTime("")).toBeNull();
    expect(parseTime("abc")).toBeNull();
    expect(parseTime("8:75")).toBeNull();
  });

  it("fait l'aller-retour avec le formatage", () => {
    expect(formatTime(parseTime("13:05")!)).toBe("13:05");
  });
});

describe("allures d'entraînement", () => {
  it("nage l'endurance plus lentement que le seuil, la vitesse plus vite", () => {
    const p = swimPaces(130);
    expect(p.endurance).toBeGreaterThan(p.seuil);
    expect(p.vitesse).toBeLessThan(p.seuil);
    expect(p.seuil).toBe(130);
  });
});
