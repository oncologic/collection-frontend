import {
  RESOURCE_IMPORT_LLM_COLUMNS,
  buildResourceImportLLMPrompt,
} from "./resourceImportPrompt";

describe("resource import LLM prompt", () => {
  it("keeps timeline and related-resource fields in the CSV header order", () => {
    expect(RESOURCE_IMPORT_LLM_COLUMNS).toEqual(
      expect.arrayContaining([
        "resourceKey",
        "durationValue",
        "durationUnit",
        "relatedResourceKeys",
        "relatedResourceNames",
        "relatedResourceUrls",
      ])
    );

    expect(RESOURCE_IMPORT_LLM_COLUMNS.indexOf("resourceKey")).toBeLessThan(
      RESOURCE_IMPORT_LLM_COLUMNS.indexOf("relatedResourceKeys")
    );
  });

  it("instructs the model to use resource keys and duration units", () => {
    const prompt = buildResourceImportLLMPrompt({
      resourceTypes: [{ name: "Checklist" }],
      sensitivityLevels: [{ name: "Low" }],
      expertiseLevels: [{ name: "Beginner" }],
      targetAudiences: [{ name: "Patients" }],
      tags: [{ name: "project" }],
    });

    expect(prompt).toContain("Return only CSV content");
    expect(prompt).toContain("resourceKey");
    expect(prompt).toContain("relatedResourceKeys");
    expect(prompt).toContain("durationValue");
    expect(prompt).toContain("minutes, hours, days, weeks, months, or years");
    expect(prompt).toContain("Checklist");
  });
});
