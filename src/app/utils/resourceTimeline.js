import { stripHtmlToText } from "./sanitizeHtml";

const toDateString = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
};

const addDaysToDateString = (dateString, days) => {
  if (!dateString) return null;
  const date = new Date(`${dateString}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  date.setUTCDate(date.getUTCDate() + Number(days || 0));
  return date.toISOString().slice(0, 10);
};

const daysBetween = (startDate, endDate) => {
  const start = toDateString(startDate);
  const end = toDateString(endDate);
  if (!start || !end) return null;
  const startMs = new Date(`${start}T00:00:00.000Z`).getTime();
  const endMs = new Date(`${end}T00:00:00.000Z`).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return null;
  return Math.floor((endMs - startMs) / 86400000);
};

const daysBetweenInclusive = (startDate, endDate) => {
  const diff = daysBetween(startDate, endDate);
  return diff === null || diff < 0 ? null : diff + 1;
};

export const normalizeResourceDurationToDays = ({
  durationValue,
  durationUnit,
} = {}) => {
  const value = Number(durationValue);
  const unit = String(durationUnit || "").toLowerCase();

  if (!Number.isFinite(value) || value <= 0 || !unit) return null;

  if (unit === "minutes") return Math.max(1, Math.ceil(value / 480));
  if (unit === "hours") return Math.max(1, Math.ceil(value / 8));
  if (unit === "days") return Math.max(1, Math.ceil(value));
  if (unit === "weeks") return Math.max(1, Math.ceil(value * 7));
  if (unit === "months") return Math.max(1, Math.ceil(value * 30));
  if (unit === "years") return Math.max(1, Math.ceil(value * 365));

  return null;
};

export const formatResourceDuration = (resource = {}) => {
  const durationValue = resource.durationValue ?? resource.duration_value;
  const durationUnit = resource.durationUnit ?? resource.duration_unit;

  if (!durationValue || !durationUnit) return null;

  return `${durationValue} ${durationUnit}`;
};

export const getResourcePlanDurationDays = (resource = {}) => {
  const explicitStart = toDateString(resource.startDate || resource.start_date);
  const explicitEnd = toDateString(resource.endDate || resource.end_date);
  const explicitDuration = daysBetweenInclusive(explicitStart, explicitEnd);
  if (explicitDuration) return explicitDuration;

  const structuredDuration = normalizeResourceDurationToDays({
    durationValue: resource.durationValue ?? resource.duration_value,
    durationUnit: resource.durationUnit ?? resource.duration_unit,
  });
  if (structuredDuration) return structuredDuration;

  const text = stripHtmlToText(
    [
      resource.title,
      resource.name,
      resource.description,
      resource.notes,
      resource.fullText,
      resource.full_text,
    ]
      .filter(Boolean)
      .join(" ")
  ).toLowerCase();
  const durationMatch = text.match(
    /(\d+(?:\.\d+)?)\s*(business\s+days?|work\s+days?|weeks?|months?|years?|days?)/
  );

  if (!durationMatch) return 1;

  const amount = Number(durationMatch[1]);
  if (!Number.isFinite(amount) || amount <= 0) return 1;

  const unit = durationMatch[2];
  if (unit.includes("year")) return Math.max(1, Math.ceil(amount * 365));
  if (unit.includes("month")) return Math.max(1, Math.ceil(amount * 30));
  if (unit.includes("week")) return Math.max(1, Math.ceil(amount * 7));
  return Math.max(1, Math.ceil(amount));
};

export const buildResourceTimelineItems = (
  resources = [],
  projectStartDate
) => {
  const startDateBase = toDateString(projectStartDate);
  let nextOffsetDays = 0;

  return resources.map((resource, index) => {
    const explicitStart = toDateString(resource.startDate || resource.start_date);
    const explicitEnd =
      toDateString(resource.endDate || resource.end_date) || explicitStart;
    const durationDays = Math.max(1, getResourcePlanDurationDays(resource));
    const startDate =
      explicitStart || addDaysToDateString(startDateBase, nextOffsetDays);
    const endDate =
      explicitEnd ||
      addDaysToDateString(startDate, Math.max(0, durationDays - 1)) ||
      startDate;
    const calculatedDurationDays =
      daysBetweenInclusive(startDate, endDate) || durationDays;
    const relativeStartDay =
      explicitStart && startDateBase
        ? Math.max(0, daysBetween(startDateBase, explicitStart) ?? 0)
        : nextOffsetDays;

    if (!explicitStart) {
      nextOffsetDays += Math.max(1, calculatedDurationDays);
    }

    return {
      resource,
      index,
      startDate,
      endDate,
      durationDays: calculatedDurationDays,
      relativeStartDay,
      hasExplicitDates: Boolean(explicitStart),
    };
  });
};
