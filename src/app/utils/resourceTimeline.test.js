import {
  buildResourceTimelineItems,
  getResourcePlanDurationDays,
} from "./resourceTimeline";

describe("resource timeline utilities", () => {
  it("uses structured duration fields before text parsing", () => {
    expect(
      getResourcePlanDurationDays({
        durationValue: 3,
        durationUnit: "weeks",
        description: "This description says 2 days.",
      })
    ).toBe(21);
  });

  it("normalizes structured year durations to calendar days", () => {
    expect(
      getResourcePlanDurationDays({
        durationValue: 1,
        durationUnit: "years",
      })
    ).toBe(365);
  });

  it("builds the June 8 sequential resource timeline from durations", () => {
    const timeline = buildResourceTimelineItems(
      [
        { id: "1", name: "First", durationValue: 1, durationUnit: "weeks" },
        { id: "2", name: "Second", durationValue: 3, durationUnit: "weeks" },
        { id: "3", name: "Third", durationValue: 2, durationUnit: "weeks" },
        { id: "4", name: "Fourth", durationValue: 2, durationUnit: "days" },
      ],
      "2026-06-08"
    );

    expect(
      timeline.map(({ startDate, endDate, durationDays }) => ({
        startDate,
        endDate,
        durationDays,
      }))
    ).toEqual([
      { startDate: "2026-06-08", endDate: "2026-06-14", durationDays: 7 },
      { startDate: "2026-06-15", endDate: "2026-07-05", durationDays: 21 },
      { startDate: "2026-07-06", endDate: "2026-07-19", durationDays: 14 },
      { startDate: "2026-07-20", endDate: "2026-07-21", durationDays: 2 },
    ]);
  });
});
