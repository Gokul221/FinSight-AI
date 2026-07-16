import { describe, expect, it } from "vitest";
import { formatActivityTimestamp, serializeActivity } from "./activity";

describe("formatActivityTimestamp", () => {
  const now = new Date("2026-07-11T18:00:00");

  it("labels a timestamp from earlier today as 'Today, <time>'", () => {
    const result = formatActivityTimestamp(new Date("2026-07-11T09:30:00"), now);
    expect(result).toMatch(/^Today, /);
  });

  it("labels a timestamp from the previous calendar day as 'Yesterday, <time>'", () => {
    const result = formatActivityTimestamp(new Date("2026-07-10T21:00:00"), now);
    expect(result).toMatch(/^Yesterday, /);
  });

  it("labels a timestamp a few days back as '<n> days ago'", () => {
    const result = formatActivityTimestamp(new Date("2026-07-08T09:00:00"), now);
    expect(result).toBe("3 days ago");
  });

  it("falls back to a full date beyond a week", () => {
    const result = formatActivityTimestamp(new Date("2026-06-01T09:00:00"), now);
    expect(result).toBe("1 Jun 2026");
  });
});

describe("serializeActivity", () => {
  it("maps a document to the plain API shape", () => {
    const result = serializeActivity({
      _id: { toString: () => "a1" },
      type: "trade",
      message: "Added 10 shares of TCS to your portfolio",
      createdAt: new Date(),
    });

    expect(result.id).toBe("a1");
    expect(result.type).toBe("trade");
    expect(result.message).toBe("Added 10 shares of TCS to your portfolio");
    expect(typeof result.timestamp).toBe("string");
  });
});
