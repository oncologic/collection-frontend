"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  FaArrowRight,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaExclamationCircle,
  FaHourglassHalf,
  FaListUl,
  FaMagic,
  FaRegStickyNote,
  FaTimes,
  FaUser,
} from "react-icons/fa";

const STATUS_STYLES = {
  completed: {
    bar: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Icon: FaCheckCircle,
  },
  active: {
    bar: "bg-blue-500",
    chip: "bg-blue-50 text-blue-700 border-blue-200",
    Icon: FaClock,
  },
  waiting: {
    bar: "bg-amber-500",
    chip: "bg-amber-50 text-amber-700 border-amber-200",
    Icon: FaHourglassHalf,
  },
  blocked: {
    bar: "bg-rose-500",
    chip: "bg-rose-50 text-rose-700 border-rose-200",
    Icon: FaExclamationCircle,
  },
  archived: {
    bar: "bg-slate-400",
    chip: "bg-slate-50 text-slate-600 border-slate-200",
    Icon: FaCheckCircle,
  },
  pending: {
    bar: "bg-slate-400",
    chip: "bg-slate-50 text-slate-600 border-slate-200",
    Icon: FaListUl,
  },
};

const WEEKDAYS = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const MONTHS = {
  january: 0,
  jan: 0,
  february: 1,
  feb: 1,
  march: 2,
  mar: 2,
  april: 3,
  apr: 3,
  may: 4,
  june: 5,
  jun: 5,
  july: 6,
  jul: 6,
  august: 7,
  aug: 7,
  september: 8,
  sept: 8,
  sep: 8,
  october: 9,
  oct: 9,
  november: 10,
  nov: 10,
  december: 11,
  dec: 11,
};

const NUMBER_WORDS = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

const STEP_MATCH_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "at",
  "be",
  "by",
  "can",
  "cant",
  "cannot",
  "do",
  "does",
  "for",
  "from",
  "get",
  "got",
  "have",
  "i",
  "if",
  "in",
  "is",
  "it",
  "need",
  "not",
  "of",
  "on",
  "or",
  "out",
  "rest",
  "setup",
  "step",
  "that",
  "the",
  "then",
  "this",
  "to",
  "until",
  "we",
  "with",
]);

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const TIMELINE_CONTEXT_DAYS = 30;
const TIMELINE_DAY_WIDTH = 14;
const TIMELINE_MIN_WIDTH = 720;

const parseDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;

  const date = new Date(
    String(value).includes("T") ? value : `${value}T00:00:00`,
  );
  return Number.isNaN(date.getTime()) ? null : date;
};

const toDateString = (value) => {
  const date = parseDate(value);
  if (!date) return null;
  return date.toISOString().slice(0, 10);
};

const formatDate = (value) => {
  const date = parseDate(value);
  if (!date) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const formatDateWithYear = (value) => {
  const date = parseDate(value);
  if (!date) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const daysBetweenInclusive = (start, end) => {
  const startDate = parseDate(start);
  const endDate = parseDate(end || start);
  if (!startDate || !endDate) return 1;
  return Math.max(1, Math.round((endDate - startDate) / MS_PER_DAY) + 1);
};

const formatDuration = (days) => {
  const safeDays = Math.max(0, Math.round(Number(days) || 0));
  if (safeDays === 0) return "0 days";

  const years = Math.floor(safeDays / 365);
  let remainingDays = safeDays % 365;
  const months = years === 0 ? Math.floor(remainingDays / 30) : 0;
  if (months > 0) {
    remainingDays %= 30;
  }

  const parts = [];
  if (years > 0) {
    parts.push(`${years} ${years === 1 ? "year" : "years"}`);
  }
  if (months > 0) {
    parts.push(`${months} ${months === 1 ? "month" : "months"}`);
  }
  if (remainingDays > 0 || parts.length === 0) {
    parts.push(`${remainingDays} ${remainingDays === 1 ? "day" : "days"}`);
  }

  return parts.join(" ");
};

const dayOffset = (start, value) => {
  const startDate = parseDate(start);
  const valueDate = parseDate(value);
  if (!startDate || !valueDate) return 0;
  return Math.max(0, Math.round((valueDate - startDate) / MS_PER_DAY));
};

const dayDelta = (start, value) => {
  const startDate = parseDate(start);
  const valueDate = parseDate(value);
  if (!startDate || !valueDate) return 0;
  return Math.round((valueDate - startDate) / MS_PER_DAY);
};

const addDays = (value, days) => {
  const date = parseDate(value);
  if (!date) return null;
  date.setDate(date.getDate() + days);
  return toDateString(date);
};

const nextWeekday = (fromDate, weekday) => {
  const date = parseDate(fromDate);
  if (!date) return null;
  const target = WEEKDAYS[weekday];
  if (target === undefined) return null;
  const diff = (target - date.getDay() + 7) % 7;
  date.setDate(date.getDate() + diff);
  return toDateString(date);
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getStatusStyle = (status) =>
  STATUS_STYLES[String(status || "pending").toLowerCase()] ||
  STATUS_STYLES.pending;

const isDateRangeContained = (childStart, childEnd, parentStart, parentEnd) => {
  if (!childStart || !parentStart) return false;
  const resolvedChildEnd = childEnd || childStart;
  const resolvedParentEnd = parentEnd || parentStart;

  return (
    childStart.localeCompare(parentStart) >= 0 &&
    resolvedChildEnd.localeCompare(resolvedParentEnd) <= 0
  );
};

const buildTimelineTicks = (startDate, totalDays) => {
  if (!parseDate(startDate)) return [];

  const tickCount = Math.min(6, Math.max(2, Math.ceil(totalDays / 14)));
  const ticks = [];

  for (let index = 0; index < tickCount; index += 1) {
    const offset = Math.round((totalDays * index) / Math.max(1, tickCount - 1));
    const date = parseDate(startDate);
    date.setDate(date.getDate() + offset);
    ticks.push({
      offset,
      label: formatDate(date),
    });
  }

  return ticks;
};

const summarizeSteps = (steps) => {
  const counts = steps.reduce(
    (acc, step) => {
      const status = String(step.status || "pending").toLowerCase();
      acc.total += 1;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    { total: 0 },
  );

  const nextStep =
    steps.find(
      (step) =>
        !["completed", "archived"].includes(
          String(step.status || "pending").toLowerCase(),
        ),
    ) || null;

  return {
    total: counts.total,
    completed: counts.completed || 0,
    active: counts.active || 0,
    waiting: counts.waiting || 0,
    pending: counts.pending || 0,
    nextStep,
  };
};

const buildTimelineMetrics = (steps, startDate, endDate) => {
  const todayDate = toDateString(new Date());
  const scheduleSteps = steps
    .map((step) => {
      const stepStartDate = toDateString(step.startDate || step.date);
      const stepEndDate = toDateString(step.endDate || stepStartDate);

      return {
        ...step,
        startDate: stepStartDate,
        endDate: stepEndDate,
        durationDays: daysBetweenInclusive(stepStartDate, stepEndDate),
        isDone: ["completed", "archived"].includes(
          String(step.status || "pending").toLowerCase(),
        ),
      };
    })
    .filter((step) => step.startDate);

  const totalWorkDays = scheduleSteps.reduce(
    (total, step) => total + step.durationDays,
    0,
  );
  const completedWorkDays = scheduleSteps
    .filter((step) => step.isDone)
    .reduce((total, step) => total + step.durationDays, 0);
  const remainingSteps = scheduleSteps.filter((step) => !step.isDone);
  const remainingWorkDays = remainingSteps.reduce(
    (total, step) => total + step.durationDays,
    0,
  );
  const remainingDateValues = remainingSteps.flatMap((step) => [
    step.startDate,
    step.endDate || step.startDate,
  ]);
  const remainingStartDate = remainingDateValues
    .filter(Boolean)
    .sort((a, b) => parseDate(a) - parseDate(b))[0];
  const remainingEndDate = remainingDateValues
    .filter(Boolean)
    .sort((a, b) => parseDate(a) - parseDate(b))
    .at(-1);
  const completedPercent = totalWorkDays
    ? Math.round((completedWorkDays / totalWorkDays) * 100)
    : 0;
  const isCompletionOverdue =
    Boolean(remainingEndDate) && parseDate(remainingEndDate) < parseDate(todayDate);
  const completionClockStartDate = remainingSteps.length
    ? isCompletionOverdue
      ? remainingEndDate
      : todayDate
    : null;
  const calendarUntilCompletionDays =
    remainingSteps.length && completionClockStartDate
      ? daysBetweenInclusive(completionClockStartDate, remainingEndDate)
      : 0;
  const overdueDays = isCompletionOverdue
    ? dayDelta(remainingEndDate, todayDate)
    : 0;
  const completionWindowPercent = daysBetweenInclusive(startDate, endDate)
    ? Math.round(
        (calendarUntilCompletionDays / daysBetweenInclusive(startDate, endDate)) *
          100,
      )
    : 0;

  return {
    todayDate,
    startDate,
    endDate,
    totalCalendarDays: daysBetweenInclusive(startDate, endDate),
    totalWorkDays,
    completedWorkDays,
    remainingWorkDays,
    completedPercent,
    remainingPercent: Math.max(0, 100 - completedPercent),
    remainingStepsCount: remainingSteps.length,
    remainingStartDate,
    remainingEndDate,
    remainingCalendarDays: remainingSteps.length
      ? daysBetweenInclusive(remainingStartDate, remainingEndDate)
      : 0,
    completionClockStartDate,
    calendarUntilCompletionDays,
    completionWindowPercent,
    isCompletionOverdue,
    overdueDays,
  };
};

const TimelineOverviewPopover = ({ metrics }) => {
  const completePercent = clamp(metrics.completedPercent, 0, 100);
  const remainingPercent = clamp(metrics.remainingPercent, 0, 100);
  const completionWindowPercent = clamp(metrics.completionWindowPercent, 0, 100);
  const remainingTimelineText = metrics.remainingStepsCount
    ? `${formatDate(metrics.remainingStartDate)} to ${formatDate(
        metrics.remainingEndDate,
      )}`
    : "Complete";
  const completionTimingText = metrics.remainingStepsCount
    ? metrics.isCompletionOverdue
      ? `${formatDuration(metrics.overdueDays)} overdue`
      : formatDuration(metrics.calendarUntilCompletionDays)
    : "Complete";
  const finishByText = metrics.remainingStepsCount
    ? formatDateWithYear(metrics.remainingEndDate)
    : "Complete";

  return (
    <div className="absolute left-0 top-full z-30 mt-2 w-[calc(100vw-3rem)] rounded-lg border border-slate-200 bg-white p-4 text-left shadow-xl shadow-slate-900/10 sm:left-auto sm:right-0 sm:w-[560px]">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex shrink-0 justify-center sm:w-40">
          <div
            className="relative h-36 w-36 rounded-full border border-slate-100"
            style={{
              background: `conic-gradient(#2563eb ${completePercent}%, #e2e8f0 ${completePercent}% 100%)`,
            }}
          >
            <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-white shadow-inner">
              <span className="text-3xl font-semibold text-slate-900">
                {completePercent}%
              </span>
              <span className="text-xs font-medium uppercase text-slate-400">
                Complete
              </span>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <FaClock className="h-4 w-4 text-blue-600" />
            <span>Timeline overview</span>
          </div>
          <div className="mt-1 text-sm text-slate-600">
            Full schedule:{" "}
            {formatDateWithYear(metrics.startDate)} to{" "}
            {formatDateWithYear(metrics.endDate)}
            <span className="mx-2 text-slate-300">•</span>
            {formatDuration(metrics.totalCalendarDays)}
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">
                  Scheduled work complete
                </span>
                <span className="font-semibold text-blue-700">
                  {completePercent}%
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${completePercent}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">
                  Remaining work
                </span>
                <span className="font-semibold text-slate-900">
                  {formatDuration(metrics.remainingWorkDays)}
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-400"
                  style={{ width: `${remainingPercent}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-slate-700">
                  Calendar until done
                </span>
                <span
                  className={`font-semibold ${
                    metrics.isCompletionOverdue
                      ? "text-rose-700"
                      : "text-slate-900"
                  }`}
                >
                  {completionTimingText}
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${
                    metrics.isCompletionOverdue ? "bg-rose-500" : "bg-blue-400"
                  }`}
                  style={{ width: `${completionWindowPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 text-sm sm:grid-cols-4">
        <div className="rounded-md border border-blue-100 bg-blue-50/70 px-3 py-2">
          <div className="text-xs font-medium uppercase text-slate-500">
            Work left
          </div>
          <div className="mt-0.5 font-semibold text-blue-700">
            {formatDuration(metrics.remainingWorkDays)}
          </div>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="text-xs font-medium uppercase text-slate-500">
            Until done
          </div>
          <div className="mt-0.5 font-semibold text-slate-800">
            {completionTimingText}
          </div>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="text-xs font-medium uppercase text-slate-500">
            Open steps
          </div>
          <div className="mt-0.5 font-semibold text-slate-800">
            {metrics.remainingStepsCount}
          </div>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="text-xs font-medium uppercase text-slate-500">
            Finish by
          </div>
          <div className="mt-0.5 font-semibold text-slate-800">
            {finishByText}
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs text-slate-500">
        {formatDuration(metrics.completedWorkDays)} of{" "}
        {formatDuration(metrics.totalWorkDays)} scheduled work completed.
        {metrics.remainingStepsCount
          ? ` Remaining window: ${remainingTimelineText}.`
          : ""}
      </div>
    </div>
  );
};

const getInstructionNumber = (matchValue) => {
  if (!matchValue) return 1;
  const normalized = String(matchValue).toLowerCase();
  return Number(normalized) || NUMBER_WORDS[normalized] || 1;
};

const getShiftDays = (instruction) => {
  const lower = instruction.toLowerCase();
  const weekMatch = lower.match(
    /\b(?:by|out by|push(?:ed)?(?: out)? by)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+week/,
  );
  if (weekMatch) return getInstructionNumber(weekMatch[1]) * 7;

  const dayMatch = lower.match(
    /\b(?:by|out by|push(?:ed)?(?: out)? by)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+day/,
  );
  if (dayMatch) return getInstructionNumber(dayMatch[1]);

  return lower.includes("week") ? 7 : 0;
};

const normalizeYear = (yearValue, fallbackYear) => {
  if (!yearValue) return fallbackYear;
  const year = Number(yearValue);
  if (!Number.isFinite(year)) return fallbackYear;
  return year < 100 ? 2000 + year : year;
};

const dateFromParts = (year, month, day) => {
  const date = new Date(year, month, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return toDateString(date);
};

const parseInstructionDate = (instruction, referenceDate) => {
  const lower = instruction.toLowerCase();
  const fallbackYear =
    parseDate(referenceDate)?.getFullYear() || new Date().getFullYear();

  const isoMatch = lower.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  if (isoMatch) {
    return dateFromParts(
      Number(isoMatch[1]),
      Number(isoMatch[2]) - 1,
      Number(isoMatch[3]),
    );
  }

  const monthMatch = lower.match(
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{2,4}))?\b/,
  );
  if (monthMatch) {
    const month = MONTHS[monthMatch[1].replace(".", "")];
    const day = Number(monthMatch[2]);
    const year = normalizeYear(monthMatch[3], fallbackYear);
    return dateFromParts(year, month, day);
  }

  const slashMatch = lower.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (slashMatch) {
    const year = normalizeYear(slashMatch[3], fallbackYear);
    return dateFromParts(
      year,
      Number(slashMatch[1]) - 1,
      Number(slashMatch[2]),
    );
  }

  return null;
};

const tokenizeForStepMatch = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/can't/g, "cant")
    .split(/\W+/)
    .filter(
      (word) =>
        word.length > 1 &&
        !STEP_MATCH_STOP_WORDS.has(word) &&
        WEEKDAYS[word] === undefined &&
        MONTHS[word] === undefined &&
        NUMBER_WORDS[word] === undefined &&
        !/^\d+$/.test(word),
    );

const findTargetStep = (instruction, steps) => {
  const lower = instruction.toLowerCase();
  const activeStep = steps.find((step) => step.status === "active");
  const nextStep =
    steps.find((step) => !["completed", "archived"].includes(step.status)) ||
    null;

  const exactMatch = steps.find((step) => {
    const title = String(step.name || step.title || "").toLowerCase();
    return title && lower.includes(title);
  });
  if (exactMatch) return exactMatch;

  const instructionTokens = new Set(tokenizeForStepMatch(lower));
  const scoredMatches = steps
    .map((step) => {
      const titleTokens = tokenizeForStepMatch(step.name || step.title || "");
      const matchedTokenCount = titleTokens.filter((word) =>
        instructionTokens.has(word),
      ).length;
      return {
        step,
        score: matchedTokenCount,
      };
    })
    .filter((match) => match.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (a.step.sortOrder ?? 0) - (b.step.sortOrder ?? 0);
    });

  if (scoredMatches[0]) return scoredMatches[0].step;

  if (lower.includes("active") || lower.includes("stalled")) {
    return activeStep || nextStep;
  }

  return activeStep || nextStep;
};

const buildAssistantProposal = (instruction, steps) => {
  const lower = instruction.toLowerCase().trim();
  if (!lower) return [];

  const targetStep = findTargetStep(lower, steps);
  const shiftDays = getShiftDays(lower);
  const weekday = Object.keys(WEEKDAYS).find((day) => lower.includes(day));
  const explicitDate = parseInstructionDate(
    lower,
    targetStep?.startDate || steps[0]?.startDate,
  );
  const targetStartDate =
    explicitDate ||
    (targetStep && weekday ? nextWeekday(targetStep.startDate, weekday) : null);
  const moveEverything =
    lower.includes("everything") ||
    lower.includes("rest") ||
    lower.includes("remaining") ||
    lower.includes("downstream");
  const shouldCascadeFromTarget =
    moveEverything ||
    lower.includes("until") ||
    lower.includes("can't") ||
    lower.includes("cant") ||
    lower.includes("blocked") ||
    lower.includes("delay") ||
    lower.includes("delayed") ||
    lower.includes("push") ||
    lower.includes("stalled");

  const updates = new Map();

  if (targetStep && targetStartDate) {
    const duration = daysBetweenInclusive(
      targetStep.startDate,
      targetStep.endDate,
    );
    updates.set(targetStep.id, {
      step: targetStep,
      startDate: targetStartDate,
      endDate: addDays(targetStartDate, duration - 1),
    });
  }

  const targetDeltaDays =
    targetStep && targetStartDate
      ? dayDelta(targetStep.startDate, targetStartDate)
      : 0;

  if (targetStep && targetDeltaDays && shouldCascadeFromTarget) {
    steps
      .filter((step) => {
        const status = String(step.status || "pending").toLowerCase();
        return status !== "archived" && step.sortOrder > targetStep.sortOrder;
      })
      .forEach((step) => {
        updates.set(step.id, {
          step,
          startDate: addDays(step.startDate, targetDeltaDays),
          endDate: addDays(step.endDate || step.startDate, targetDeltaDays),
        });
      });
  }

  if (shiftDays) {
    const wholeTimelineOnly =
      moveEverything &&
      !targetStartDate &&
      !lower.includes("after") &&
      !lower.includes("then");
    const shouldShiftFromOrder = wholeTimelineOnly
      ? -1
      : targetStep && (moveEverything || lower.includes("after"))
        ? targetStep.sortOrder
        : -1;

    steps
      .filter((step) => {
        const incomplete = !["completed", "archived"].includes(step.status);
        if (!incomplete) return false;
        if (shouldShiftFromOrder < 0) return true;
        return step.sortOrder > shouldShiftFromOrder;
      })
      .forEach((step) => {
        const existing = updates.get(step.id);
        const baseStart = existing?.startDate || step.startDate;
        const baseEnd = existing?.endDate || step.endDate || step.startDate;
        updates.set(step.id, {
          step,
          startDate: addDays(baseStart, shiftDays),
          endDate: addDays(baseEnd, shiftDays),
        });
      });
  }

  return Array.from(updates.values()).filter(
    (update) =>
      update.startDate &&
      update.endDate &&
      (toDateString(update.step.startDate) !== update.startDate ||
        toDateString(update.step.endDate) !== update.endDate),
  );
};

export default function WorkflowGanttChart({
  collection,
  canEdit = false,
  onUpdateStepDates,
}) {
  const router = useRouter();
  const recentDragRef = useRef(false);
  const timelineOverviewRef = useRef(null);
  const ganttPreviewRef = useRef(null);
  const lastTimelineScrollKeyRef = useRef("");
  const lastAssistantPreviewInputRef = useRef("");
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isTimelineOverviewOpen, setIsTimelineOverviewOpen] = useState(false);
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantProposal, setAssistantProposal] = useState([]);
  const [draftByStepId, setDraftByStepId] = useState({});
  const [dragState, setDragState] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [includeDatedNotations, setIncludeDatedNotations] = useState(false);

  const workflowKind = collection?.workflowMetadata?.kind;
  const datedNotationCount = useMemo(
    () =>
      (collection?.externalLinks || []).reduce((count, externalLink) => {
        return (
          count +
          (externalLink.notations || []).filter(
            (notation) => notation?.startDate || notation?.date,
          ).length
        );
      }, 0),
    [collection],
  );

  const workflowSteps = useMemo(() => {
    const externalRows = (collection?.externalLinks || [])
      .filter((step) => {
        return (
          step?.startDate ||
          step?.date ||
          step?.workflowMetadata?.relativeStartDay !== undefined
        );
      })
      .map((step, index) => {
        const metadata = step.workflowMetadata || {};
        const fallbackStart = collection?.startDate || new Date().toISOString();
        const relativeStartDay = Number(metadata.relativeStartDay || 0);
        const estimatedDurationDays = Number(
          metadata.estimatedDurationDays || 1,
        );
        const fallbackDate = parseDate(fallbackStart);
        const calculatedStartDate = fallbackDate
          ? addDays(fallbackStart, relativeStartDay)
          : toDateString(new Date());
        const startDate =
          toDateString(step.startDate || step.date) || calculatedStartDate;
        const endDate =
          toDateString(step.endDate) ||
          addDays(startDate, Math.max(0, estimatedDurationDays - 1));
        const draft = draftByStepId[step.id];
        const timelineSortOrder = (step.sortOrder ?? index) * 1000;
        const childNotations = includeDatedNotations
          ? (step.notations || [])
              .map((notation) => {
                const notationStartDate = toDateString(
                  notation.startDate || notation.date,
                );
                if (!notationStartDate) return null;

                const notationEndDate =
                  toDateString(notation.endDate) || notationStartDate;

                if (
                  !isDateRangeContained(
                    notationStartDate,
                    notationEndDate,
                    startDate,
                    endDate,
                  )
                ) {
                  return null;
                }

                return {
                  ...notation,
                  timelineItemType: "notation",
                  parentExternalLinkId: step.id,
                  parentExternalLinkName:
                    step.name || step.title || step.url,
                  name: notation.title || "Untitled notation",
                  startDate:
                    draftByStepId[notation.id]?.startDate ||
                    notationStartDate,
                  endDate:
                    draftByStepId[notation.id]?.endDate || notationEndDate,
                  status: String(notation.status || "pending").toLowerCase(),
                  workflowMetadata: notation.workflowMetadata || {},
                };
              })
              .filter(Boolean)
          : [];

        return {
          ...step,
          timelineItemType: "externalLink",
          timelineSortOrder,
          childNotations,
          startDate: draft?.startDate || startDate,
          endDate: draft?.endDate || endDate,
          status: String(step.status || "pending").toLowerCase(),
          sortOrder: timelineSortOrder,
        };
      });

    const notationRows = includeDatedNotations
      ? (collection?.externalLinks || []).flatMap((externalLink, linkIndex) => {
          return (externalLink.notations || [])
            .map((notation, notationIndex) => {
              const startDate = toDateString(
                notation.startDate || notation.date,
              );
              if (!startDate) return null;

              const endDate = toDateString(notation.endDate) || startDate;
              const draft = draftByStepId[notation.id];
              const parentSortOrder =
                (externalLink.sortOrder ?? linkIndex) * 1000;
              const parentStartDate = toDateString(
                externalLink.startDate || externalLink.date,
              );
              const parentEndDate =
                toDateString(externalLink.endDate) || parentStartDate;

              if (
                isDateRangeContained(
                  startDate,
                  endDate,
                  parentStartDate,
                  parentEndDate,
                )
              ) {
                return null;
              }

              return {
                ...notation,
                timelineItemType: "notation",
                timelineSortOrder:
                  parentSortOrder + (notation.listOrder ?? notationIndex) + 1,
                parentExternalLinkId: externalLink.id,
                parentExternalLinkName:
                  externalLink.name || externalLink.title || externalLink.url,
                name: notation.title || "Untitled notation",
                startDate: draft?.startDate || startDate,
                endDate: draft?.endDate || endDate,
                status: String(notation.status || "pending").toLowerCase(),
                sortOrder:
                  parentSortOrder + (notation.listOrder ?? notationIndex) + 1,
                workflowMetadata: notation.workflowMetadata || {},
              };
            })
            .filter(Boolean);
        })
      : [];

    return [...externalRows, ...notationRows]
      .sort((a, b) => {
        const orderDiff =
          (a.timelineSortOrder ?? a.sortOrder ?? 0) -
          (b.timelineSortOrder ?? b.sortOrder ?? 0);
        if (orderDiff !== 0) return orderDiff;
        return parseDate(a.startDate) - parseDate(b.startDate);
      });
  }, [collection, draftByStepId, includeDatedNotations]);

  const shouldRender =
    workflowKind ||
    workflowSteps.length > 0 ||
    datedNotationCount > 0;

  const assistantProposalByStepId = useMemo(() => {
    return new Map(assistantProposal.map((update) => [update.step.id, update]));
  }, [assistantProposal]);

  const scheduleDateValues = workflowSteps.flatMap((step) => [
    step.startDate,
    step.endDate || step.startDate,
  ]);
  const fallbackScheduleStartDate =
    toDateString(collection?.startDate) || toDateString(new Date());
  const scheduleStartDate = scheduleDateValues
    .filter(Boolean)
    .sort((a, b) => parseDate(a) - parseDate(b))[0] ||
    fallbackScheduleStartDate;
  const scheduleEndDate = scheduleDateValues
    .filter(Boolean)
    .sort((a, b) => parseDate(a) - parseDate(b))
    .at(-1) ||
    toDateString(collection?.endDate) ||
    fallbackScheduleStartDate;
  const timelineDateValues = [
    ...scheduleDateValues,
    ...assistantProposal.flatMap((update) => [
      update.startDate,
      update.endDate || update.startDate,
    ]),
  ];

  const chartContentStartDate = timelineDateValues
    .filter(Boolean)
    .sort((a, b) => parseDate(a) - parseDate(b))[0] ||
    fallbackScheduleStartDate;
  const chartContentEndDate = timelineDateValues
    .filter(Boolean)
    .sort((a, b) => parseDate(a) - parseDate(b))
    .at(-1) ||
    toDateString(collection?.endDate) ||
    chartContentStartDate;
  const chartStartDate =
    addDays(chartContentStartDate, -TIMELINE_CONTEXT_DAYS) ||
    chartContentStartDate;
  const chartEndDate =
    addDays(chartContentEndDate, TIMELINE_CONTEXT_DAYS) ||
    chartContentEndDate;
  const totalDays = daysBetweenInclusive(chartStartDate, chartEndDate);
  const chartWidth = Math.max(
    TIMELINE_MIN_WIDTH,
    totalDays * TIMELINE_DAY_WIDTH,
  );
  const ticks = buildTimelineTicks(chartStartDate, totalDays);
  const summary = summarizeSteps(workflowSteps);
  const timelineMetrics = useMemo(
    () =>
      buildTimelineMetrics(workflowSteps, scheduleStartDate, scheduleEndDate),
    [scheduleEndDate, scheduleStartDate, workflowSteps],
  );

  const openStep = useCallback(
    (step) => {
      if (recentDragRef.current) return;
      const collectionQuery = collection?.id
        ? `?collectionId=${encodeURIComponent(collection.id)}`
        : "";
      const externalLinkId =
        step.timelineItemType === "notation"
          ? step.parentExternalLinkId
          : step.id;
      router.push(`/external-links/${externalLinkId}${collectionQuery}`);
    },
    [collection?.id, router],
  );

  const saveDateUpdates = useCallback(
    async (updates) => {
      if (!updates.length || !onUpdateStepDates) return;

      setIsSaving(true);
      try {
        await onUpdateStepDates(updates);
        setDraftByStepId((prev) => {
          const next = { ...prev };
          updates.forEach((update) => {
            delete next[update.step.id];
          });
          return next;
        });
        toast.success(
          updates.length === 1
            ? "Timeline updated"
            : "Timeline changes applied",
        );
      } catch (error) {
        setDraftByStepId((prev) => {
          const next = { ...prev };
          updates.forEach((update) => {
            delete next[update.step.id];
          });
          return next;
        });
        toast.error(error?.message || "Failed to update timeline");
      } finally {
        setIsSaving(false);
      }
    },
    [onUpdateStepDates],
  );

  useEffect(() => {
    if (!dragState) return undefined;

    const handlePointerMove = (event) => {
      const deltaDays = Math.round(
        ((event.clientX - dragState.startX) / chartWidth) * totalDays,
      );
      const newStartDate = addDays(dragState.originalStartDate, deltaDays);
      const newEndDate = addDays(dragState.originalEndDate, deltaDays);

      setDraftByStepId((prev) => ({
        ...prev,
        [dragState.step.id]: {
          startDate: newStartDate,
          endDate: newEndDate,
        },
      }));
    };

    const handlePointerUp = async (event) => {
      const deltaDays = Math.round(
        ((event.clientX - dragState.startX) / chartWidth) * totalDays,
      );

      setDragState(null);

      if (!deltaDays) {
        setDraftByStepId((prev) => {
          const next = { ...prev };
          delete next[dragState.step.id];
          return next;
        });
        openStep(dragState.step);
        return;
      }

      recentDragRef.current = true;
      window.setTimeout(() => {
        recentDragRef.current = false;
      }, 250);

      const newStartDate = addDays(dragState.originalStartDate, deltaDays);
      const newEndDate = addDays(dragState.originalEndDate, deltaDays);
      await saveDateUpdates([
        {
          step: dragState.step,
          startDate: newStartDate,
          endDate: newEndDate,
        },
      ]);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [chartWidth, dragState, openStep, saveDateUpdates, totalDays]);

  useEffect(() => {
    if (!isTimelineOverviewOpen) return undefined;

    const handlePointerDown = (event) => {
      if (timelineOverviewRef.current?.contains(event.target)) return;
      setIsTimelineOverviewOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsTimelineOverviewOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isTimelineOverviewOpen]);

  useEffect(() => {
    if (!shouldRender || dragState) return;

    const scrollContainer = ganttPreviewRef.current;
    if (!scrollContainer || !chartStartDate || !chartContentStartDate) return;

    const scrollKey = `${collection?.id || "workflow"}:${chartContentStartDate}:${chartContentEndDate}`;
    if (lastTimelineScrollKeyRef.current === scrollKey) return;

    lastTimelineScrollKeyRef.current = scrollKey;
    const contextOffsetDays = dayOffset(chartStartDate, chartContentStartDate);
    const contextOffsetPixels =
      (contextOffsetDays / Math.max(1, totalDays)) * chartWidth;

    scrollContainer.scrollLeft = Math.max(0, contextOffsetPixels - 24);
  }, [
    chartContentEndDate,
    chartContentStartDate,
    chartStartDate,
    chartWidth,
    collection?.id,
    dragState,
    shouldRender,
    totalDays,
  ]);

  if (!shouldRender) return null;

  const handleDragStart = (event, step) => {
    if (!canEdit || !onUpdateStepDates) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDragState({
      step,
      startX: event.clientX,
      originalStartDate: step.startDate,
      originalEndDate: step.endDate || step.startDate,
    });
  };

  const handleFocusNextStep = () => {
    if (!summary.nextStep || !chartStartDate) return;

    const scrollContainer = ganttPreviewRef.current;
    if (!scrollContainer) return;

    const stepOffsetDays = dayOffset(chartStartDate, summary.nextStep.startDate);
    const stepOffsetPixels =
      (stepOffsetDays / Math.max(1, totalDays)) * chartWidth;
    const nextScrollLeft = Math.max(0, stepOffsetPixels - 24);

    scrollContainer.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    window.requestAnimationFrame(() => {
      scrollContainer.scrollTo({
        left: nextScrollLeft,
        behavior: "smooth",
      });
    });
  };

  const handlePreviewAssistantChanges = () => {
    const nextInput = assistantInput.trim();

    if (
      assistantProposal.length > 0 &&
      lastAssistantPreviewInputRef.current === nextInput
    ) {
      ganttPreviewRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    const proposal = buildAssistantProposal(nextInput, workflowSteps);
    setAssistantProposal(proposal);
    lastAssistantPreviewInputRef.current = proposal.length ? nextInput : "";

    if (!proposal.length) {
      toast.error("No timeline changes found");
    }
  };

  const handleProposalDateChange = (stepId, field, value) => {
    const nextDate = toDateString(value);
    if (!nextDate) return;

    setAssistantProposal((prev) =>
      prev.map((update) => {
        if (update.step.id !== stepId) return update;

        if (field === "startDate") {
          const deltaDays = dayDelta(update.startDate, nextDate);
          return {
            ...update,
            startDate: nextDate,
            endDate: addDays(update.endDate || update.startDate, deltaDays),
          };
        }

        const startDateValue = update.startDate;
        const nextEndDate =
          parseDate(nextDate) < parseDate(startDateValue)
            ? startDateValue
            : nextDate;

        return {
          ...update,
          endDate: nextEndDate,
        };
      }),
    );
  };

  const handleRemoveProposalStep = (stepId) => {
    setAssistantProposal((prev) =>
      prev.filter((update) => update.step.id !== stepId),
    );
  };

  const handleApplyAssistantChanges = async () => {
    await saveDateUpdates(assistantProposal);
    setAssistantInput("");
    setAssistantProposal([]);
    setIsAssistantOpen(false);
  };

  return (
    <section className="border-b border-slate-200 bg-white px-6 py-5">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
            <FaCalendarAlt className="h-4 w-4" />
            <span>Project Timeline</span>
          </div>
          <h2 className="mt-1 text-xl font-semibold text-slate-800">
            Gantt View
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
            {summary.total} {includeDatedNotations ? "items" : "steps"}
          </span>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
            {summary.completed} complete
          </span>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700">
            {summary.active} active
          </span>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
            {summary.waiting} waiting
          </span>
          <div ref={timelineOverviewRef} className="relative">
            <button
              type="button"
              onClick={() => setIsTimelineOverviewOpen((value) => !value)}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-md border transition ${
                isTimelineOverviewOpen
                  ? "border-blue-300 bg-blue-100 text-blue-700 shadow-sm"
                  : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
              }`}
              title="Timeline overview"
              aria-label="Timeline overview"
              aria-expanded={isTimelineOverviewOpen}
            >
              <FaClock className="h-4 w-4" />
            </button>
            {isTimelineOverviewOpen && (
              <TimelineOverviewPopover metrics={timelineMetrics} />
            )}
          </div>
          <button
            type="button"
            onClick={() => setIncludeDatedNotations((value) => !value)}
            disabled={datedNotationCount === 0}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-md border transition ${
              includeDatedNotations
                ? "border-indigo-300 bg-indigo-100 text-indigo-700 shadow-sm"
                : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            } disabled:cursor-not-allowed disabled:opacity-40`}
            title={
              includeDatedNotations
                ? "Hide dated notations"
                : "Show dated notations"
            }
            aria-label={
              includeDatedNotations
                ? "Hide dated notations"
                : "Show dated notations"
            }
            aria-pressed={includeDatedNotations}
          >
            <FaRegStickyNote className="h-4 w-4" />
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={() => setIsAssistantOpen((value) => !value)}
              className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700 hover:bg-blue-100"
            >
              <FaMagic className="h-3.5 w-3.5" />
              Assistant
            </button>
          )}
        </div>
      </div>

      <>
        {isAssistantOpen && canEdit && (
          <div className="mb-4 rounded-md border border-blue-100 bg-blue-50/50 p-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={assistantInput}
                onChange={(event) => setAssistantInput(event.target.value)}
                className="min-w-0 flex-1 rounded-md border border-blue-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="Timeline change request"
              />
              <button
                type="button"
                onClick={handlePreviewAssistantChanges}
                disabled={!assistantInput.trim() || isSaving}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Preview
              </button>
            </div>

            {assistantProposal.length > 0 && (
              <div className="mt-3 rounded-md border border-slate-200 bg-white">
                <div className="divide-y divide-slate-100">
                  {assistantProposal.map((update) => (
                    <div
                      key={update.step.id}
                      className="flex flex-col gap-3 px-3 py-3 text-sm lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium text-slate-700">
                          {update.step.name}
                        </div>
                        <div className="mt-1 inline-flex items-center gap-2 text-slate-500">
                          {formatDate(update.step.startDate)} -{" "}
                          {formatDate(update.step.endDate)}
                          <FaArrowRight className="h-3 w-3" />
                          {formatDate(update.startDate)} -{" "}
                          {formatDate(update.endDate)}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-end gap-2">
                        <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
                          Start
                          <input
                            type="date"
                            value={update.startDate}
                            onChange={(event) =>
                              handleProposalDateChange(
                                update.step.id,
                                "startDate",
                                event.target.value,
                              )
                            }
                            className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm font-normal text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
                          End
                          <input
                            type="date"
                            value={update.endDate}
                            min={update.startDate}
                            onChange={(event) =>
                              handleProposalDateChange(
                                update.step.id,
                                "endDate",
                                event.target.value,
                              )
                            }
                            className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm font-normal text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveProposalStep(update.step.id)
                          }
                          className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600 hover:bg-slate-50"
                          title="Remove from proposed changes"
                        >
                          <FaTimes className="h-3 w-3" />
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2 border-t border-slate-100 p-3">
                  <button
                    type="button"
                    onClick={() => setAssistantProposal([])}
                    className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    <FaTimes className="h-3 w-3" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyAssistantChanges}
                    disabled={isSaving || !assistantProposal.length}
                    className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Apply changes
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {workflowSteps.length === 0 ? (
          <div
            ref={ganttPreviewRef}
            className="rounded-md border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500"
          >
            No dated items
          </div>
        ) : (
          <>
            {summary.nextStep && (
              <button
                type="button"
                onClick={handleFocusNextStep}
                className="mb-4 flex w-full flex-col gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-700 hover:border-blue-200 hover:bg-blue-50/50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="font-medium">
                  Next: {summary.nextStep.name}
                </div>
                <div className="text-slate-500">
                  {formatDate(summary.nextStep.startDate)} to{" "}
                  {formatDate(
                    summary.nextStep.endDate || summary.nextStep.startDate,
                  )}
                </div>
              </button>
            )}

            <div ref={ganttPreviewRef} className="scroll-mt-6 overflow-x-auto">
              <div className="min-w-[960px]">
                <div className="grid grid-cols-[280px_minmax(720px,1fr)] border-b border-slate-200 pb-2 text-xs font-medium uppercase text-slate-500">
                  <div className="sticky left-0 z-30 bg-white pr-4 shadow-[8px_0_12px_-12px_rgba(15,23,42,0.35)]">
                    Step
                  </div>
                  <div className="relative" style={{ width: chartWidth }}>
                    {ticks.map((tick) => (
                      <span
                        key={`${tick.offset}-${tick.label}`}
                        className="absolute top-0 -translate-x-1/2 whitespace-nowrap"
                        style={{
                          left: `${clamp(
                            (tick.offset / Math.max(1, totalDays)) * 100,
                            0,
                            100,
                          )}%`,
                        }}
                      >
                        {tick.label}
                      </span>
                    ))}
                  </div>
                </div>
            </div>

            <div className="divide-y divide-slate-100">
              {workflowSteps.map((step) => {
                const statusStyle = getStatusStyle(step.status);
                const StatusIcon = statusStyle.Icon;
                const left =
                  (dayOffset(chartStartDate, step.startDate) /
                    Math.max(1, totalDays)) *
                  100;
                const width =
                  (daysBetweenInclusive(step.startDate, step.endDate) /
                    Math.max(1, totalDays)) *
                  100;
                const preview = assistantProposalByStepId.get(step.id);
                const previewLeft = preview
                  ? (dayOffset(chartStartDate, preview.startDate) /
                      Math.max(1, totalDays)) *
                    100
                  : 0;
                const previewWidth = preview
                  ? (daysBetweenInclusive(preview.startDate, preview.endDate) /
                      Math.max(1, totalDays)) *
                    100
                  : 0;
                const isDragging = dragState?.step.id === step.id;
                const stepLabel =
                  step.name || step.title || step.url || "Untitled step";
                const childNotations = step.childNotations || [];
                const timelineRowHeight = childNotations.length
                  ? Math.min(60, 44 + childNotations.length * 6)
                  : 40;

                return (
                  <div
                    key={`${step.timelineItemType || "step"}:${step.id}`}
                    className="grid min-h-[64px] grid-cols-[280px_minmax(720px,1fr)] items-center py-3"
                  >
                    <div className="sticky left-0 z-20 flex self-stretch flex-col justify-center bg-white pr-4 shadow-[8px_0_12px_-12px_rgba(15,23,42,0.35)]">
                      <button
                        type="button"
                        onClick={() => openStep(step)}
                        className="block max-w-full truncate text-left text-sm font-medium text-slate-800 hover:text-blue-700"
                      >
                        {stepLabel}
                      </button>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                        {step.timelineItemType === "notation" && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-indigo-700">
                            <FaRegStickyNote className="h-3 w-3" />
                            Notation
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 capitalize ${statusStyle.chip}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {step.status}
                        </span>
                        {step.workflowMetadata?.ownerRole && (
                          <span className="inline-flex min-w-0 items-center gap-1 truncate">
                            <FaUser className="h-3 w-3 shrink-0" />
                            <span className="truncate">
                              {step.workflowMetadata.ownerRole}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      className="relative rounded-sm bg-slate-50"
                      style={{ width: chartWidth, height: timelineRowHeight }}
                    >
                      {ticks.map((tick) => (
                        <span
                          key={`${step.id}-${tick.offset}`}
                          className="absolute top-0 border-l border-slate-200"
                          style={{
                            left: `${clamp(
                              (tick.offset / Math.max(1, totalDays)) * 100,
                              0,
                              100,
                            )}%`,
                            height: timelineRowHeight,
                          }}
                        />
                      ))}
                      {preview && (
                        <button
                          type="button"
                          onClick={() => openStep(step)}
                          className="absolute top-1 z-10 flex h-8 min-w-[36px] items-center rounded-sm border border-blue-500 bg-blue-50/90 px-2 text-xs font-medium text-blue-700 shadow-sm"
                          style={{
                            left: `${clamp(previewLeft, 0, 100)}%`,
                            width: `${clamp(previewWidth, 2, 100)}%`,
                          }}
                          title={`Proposed: ${formatDate(
                            preview.startDate,
                          )} to ${formatDate(preview.endDate)}`}
                        >
                          <span className="truncate">
                            {formatDate(preview.startDate)} -{" "}
                            {formatDate(preview.endDate)}
                          </span>
                        </button>
                      )}
                      <button
                        type="button"
                        onPointerDown={(event) => handleDragStart(event, step)}
                        onClick={() => openStep(step)}
                        disabled={isSaving}
                        className={`absolute top-2 flex h-6 min-w-[28px] items-center rounded-sm px-2 text-xs font-medium text-white shadow-sm ${
                          statusStyle.bar
                        } ${
                          canEdit
                            ? "cursor-grab active:cursor-grabbing"
                            : "cursor-pointer"
                        } ${isDragging ? "ring-2 ring-blue-200" : ""} ${
                          preview ? "opacity-45" : ""
                        }`}
                        style={{
                          left: `${clamp(left, 0, 100)}%`,
                          width: `${clamp(width, 2, 100)}%`,
                        }}
                        title={`${stepLabel}: ${formatDate(
                          step.startDate,
                        )} to ${formatDate(step.endDate || step.startDate)}`}
                      >
                        <span className="truncate">
                          {formatDate(step.startDate)} -{" "}
                          {formatDate(step.endDate || step.startDate)}
                        </span>
                      </button>
                      {childNotations.map((notation, childIndex) => {
                        const childLeft =
                          (dayOffset(chartStartDate, notation.startDate) /
                            Math.max(1, totalDays)) *
                          100;
                        const childWidth =
                          (daysBetweenInclusive(
                            notation.startDate,
                            notation.endDate,
                          ) /
                            Math.max(1, totalDays)) *
                          100;
                        const notationLabel =
                          notation.name ||
                          notation.title ||
                          "Untitled notation";
                        const isChildDragging =
                          dragState?.step.id === notation.id;

                        return (
                          <button
                            key={notation.id}
                            type="button"
                            onPointerDown={(event) =>
                              handleDragStart(event, notation)
                            }
                            onClick={() => openStep(notation)}
                            disabled={isSaving}
                            className={`absolute z-20 h-1.5 min-w-[18px] rounded-full bg-indigo-500 shadow-sm ${
                              canEdit
                                ? "cursor-grab active:cursor-grabbing"
                                : "cursor-pointer"
                            } ${
                              isChildDragging ? "ring-2 ring-indigo-200" : ""
                            }`}
                            style={{
                              top: 36 + childIndex * 6,
                              left: `${clamp(childLeft, 0, 100)}%`,
                              width: `${clamp(childWidth, 2, 100)}%`,
                            }}
                            title={`${notationLabel}: ${formatDate(
                              notation.startDate,
                            )} to ${formatDate(
                              notation.endDate || notation.startDate,
                            )}`}
                            aria-label={`${notationLabel}: ${formatDate(
                              notation.startDate,
                            )} to ${formatDate(
                              notation.endDate || notation.startDate,
                            )}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          </>
        )}
      </>
    </section>
  );
}
