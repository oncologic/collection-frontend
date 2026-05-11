"use client";

import React, { useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { DateTime } from "luxon";
import {
  FaDownload,
  FaClock,
  FaMapMarkerAlt,
  FaBuilding,
  FaSpinner,
} from "react-icons/fa";

const EventsCalendarPDF = ({
  events = [],
  organizations = [],
  month,
  year,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const monthName = DateTime.local(year, month).monthLong;

  // Debug: Log incoming events
  // (silent) remove noisy console logs

  // Helpers to normalize event dates and organizations
  const toDT = (v) => {
    if (!v) return null;
    if (typeof v === "string") return DateTime.fromISO(v);
    if (v?.toISO) return v;
    return null;
  };
  const getRange = (ev) => {
    const start = toDT(ev.startTime || ev.startDate);
    const end = toDT(ev.endTime || ev.endDate) || start;
    return { start, end };
  };
  const overlaps = (start, end, dayStart, dayEnd) =>
    (start >= dayStart && start <= dayEnd) ||
    (end >= dayStart && end <= dayEnd) ||
    (start < dayStart && end > dayEnd);
  const getOrganization = (orgOrId) => {
    if (!orgOrId) return undefined;
    if (typeof orgOrId === "string")
      return organizations.find((o) => o.id === orgOrId);
    if (orgOrId.id)
      return organizations.find((o) => o.id === orgOrId.id) || orgOrId;
    return undefined;
  };

  // Get events for a specific day
  const getEventsForDay = (date) => {
    const dayStart = date.startOf("day");
    const dayEnd = date.endOf("day");

    const dayEvents = events.filter((event) => {
      const { start, end } = getRange(event);
      if (!start) return false;
      const onDay = overlaps(start, end, dayStart, dayEnd);

      return onDay;
    });

    // Separate long and regular events
    const longEvents = [];
    const regularEvents = [];

    dayEvents.forEach((event) => {
      const { start: eventStart, end: eventEnd } = getRange(event);
      const duration = eventEnd.diff(eventStart, "days").days;

      if (duration > 14) {
        longEvents.push(event);
      } else {
        regularEvents.push(event);
      }
    });

    return { regularEvents, longEvents };
  };

  // Get long-running events for the month
  const getLongRunningEvents = () => {
    const monthStart = DateTime.local(year, month, 1).startOf("month");
    const monthEnd = monthStart.endOf("month");

    return events.filter((event) => {
      const { start, end } = getRange(event);
      if (!start) return false;
      const duration = end.diff(start, "days").days;
      return (
        duration > 14 &&
        ((start >= monthStart && start <= monthEnd) ||
          (end >= monthStart && end <= monthEnd) ||
          (start < monthStart && end > monthEnd))
      );
    });
  };

  // getOrganization is defined above and supports ids or objects

  // Generate calendar grid data
  const generateCalendarGrid = () => {
    const firstDay = DateTime.local(year, month, 1);
    const lastDay = firstDay.endOf("month");
    const startPadding = firstDay.weekday === 7 ? 0 : firstDay.weekday;

    const grid = [];
    let week = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startPadding; i++) {
      week.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= lastDay.day; day++) {
      const date = DateTime.local(year, month, day);
      const { regularEvents, longEvents } = getEventsForDay(date);

      week.push({
        day,
        date: date.toISODate(),
        regularEvents,
        longEvents,
        dateObj: date,
      });

      if (week.length === 7) {
        grid.push(week);
        week = [];
      }
    }

    // Fill last week if needed
    if (week.length > 0) {
      while (week.length < 7) {
        week.push(null);
      }
      grid.push(week);
    }

    return grid;
  };

  // Generate PDF
  const generatePDF = async () => {
    setIsGenerating(true);

    // Show the hidden content temporarily
    const element = document.getElementById("calendar-pdf-content");
    if (!element) {
      setIsGenerating(false);
      return;
    }

    // Make it visible on screen temporarily for React to render
    element.style.position = "fixed";
    element.style.left = "0";
    element.style.top = "0";
    element.style.zIndex = "9999";
    element.style.display = "block";
    element.style.visibility = "visible";

    try {
      // Ensure fonts and layout are ready
      if (document.fonts && document.fonts.ready) {
        try {
          await document.fonts.ready;
        } catch {}
      }
      await new Promise((resolve) => requestAnimationFrame(() => resolve()));
      await new Promise((resolve) => setTimeout(resolve, 300));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        imageTimeout: 0,
        foreignObjectRendering: true,
        logging: false,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          // Ensure the cloned element is visible
          const clonedElement = clonedDoc.getElementById(
            "calendar-pdf-content"
          );
          if (clonedElement) {
            clonedElement.style.display = "block";
            clonedElement.style.visibility = "visible";
          }
        },
      });

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const dataUrl = canvas.toDataURL("image/png");

      // Fit entire image onto one page (scale to max that fits width & height)
      const ratio = Math.min(
        pageWidth / canvas.width,
        pageHeight / canvas.height
      );
      const imgWidth = canvas.width * ratio;
      const imgHeight = canvas.height * ratio;
      const x = (pageWidth - imgWidth) / 2;
      const y = (pageHeight - imgHeight) / 2;

      pdf.addImage(dataUrl, "PNG", x, y, imgWidth, imgHeight);

      pdf.save(`${monthName}-${year}-events-calendar.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      // Hide it again
      element.style.position = "absolute";
      element.style.left = "-9999px";
      element.style.zIndex = "-9999";
      element.style.display = "none";
      setIsGenerating(false);
    }
  };

  const calendarGrid = generateCalendarGrid();
  const longRunningEvents = getLongRunningEvents();

  // Get unique organizations for this month's events
  const monthOrganizations = new Set();
  events.forEach((event) => {
    if (Array.isArray(event.organizations)) {
      event.organizations.forEach((o) => monthOrganizations.add(o?.id || o));
    }
  });

  return (
    <>
      {/* Download Button TODO: may remove this version */}
      {/* <button
        onClick={generatePDF}
        disabled={isGenerating}
        className="flex items-center gap-2 px-2 py-1 bg-blue-400 text-white rounded-lg hover:bg-blue-400 disabled:bg-blue-400 transition-colors"
      >
        {isGenerating ? (
          <>
            <FaSpinner className="animate-spin" />
            Generating PDF...
          </>
        ) : (
          <>
            <FaDownload />
          </>
        )}
      </button> */}

      {/* Hidden PDF Content */}
      <div
        id="calendar-pdf-content"
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
          width: "1240px", // ensure container exceeds 7 * 170px grid (1190px) with comfortable margin
          padding: "16px",
          backgroundColor: "white",
          fontFamily: "system-ui, -apple-system, sans-serif",
          display: "none",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: "#111827",
              marginBottom: "16px",
            }}
          >
            {monthName} {year} Events Calendar
          </h1>

          {/* Hosting Organizations removed per design request */}
        </div>

        {/* Calendar Grid */}
        <div
          style={{
            border: "2px solid #e5e7eb",
            borderRadius: "8px",
            overflow: "visible",
          }}
        >
          {/* Weekday Headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "170px 170px 170px 170px 170px 170px 170px", // wider columns to use more page width
              backgroundColor: "#f3f4f6",
              boxShadow: "inset 0 -1px 0 #e5e7eb",
            }}
          >
            {[
              "Sunday",
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ].map((day) => (
              <div
                key={day}
                style={{
                  padding: "8px",
                  textAlign: "center",
                  fontWeight: "600",
                  fontSize: "14px",
                  borderRight: "1px solid #e5e7eb",
                  color: "#374151",
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          {calendarGrid.map((week, weekIndex) => (
            <div
              key={weekIndex}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "170px 170px 170px 170px 170px 170px 170px",
              }}
            >
              {week.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  style={{
                    minHeight: "100px",
                    padding: "6px",
                    boxShadow: "inset -1px 0 0 #e5e7eb, inset 0 -1px 0 #e5e7eb",
                    backgroundColor: day ? "white" : "#f9fafb",
                    boxSizing: "border-box",
                  }}
                >
                  {day && (
                    <>
                      <div
                        style={{
                          fontWeight: "600",
                          fontSize: "14px",
                          marginBottom: "4px",
                        }}
                      >
                        {day.day}
                      </div>

                      {/* Long event indicators */}
                      {day.longEvents.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            gap: "2px",
                            marginBottom: "4px",
                          }}
                        >
                          {day.longEvents.slice(0, 3).map((event, idx) => (
                            <div
                              key={idx}
                              style={{
                                width: "6px",
                                height: "6px",
                                backgroundColor: "#2563eb",
                                borderRadius: "50%",
                              }}
                              title={event.title}
                            />
                          ))}
                        </div>
                      )}

                      {/* Regular Events */}
                      {day.regularEvents.slice(0, 2).map((event, idx) => {
                        const firstOrg = event.organizations?.[0];
                        const org = firstOrg ? getOrganization(firstOrg) : null;

                        return (
                          <div
                            key={idx}
                            style={{
                              fontSize: "11px",
                              marginBottom: "4px",
                              padding: "4px 6px",
                              backgroundColor: "#F8FAFC",
                              borderRadius: "4px",
                              // border removed to avoid partial render artifacts in html2canvas
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 500,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                lineHeight: "1.2",
                                maxHeight: "2.4em",
                                color: "#111827",
                              }}
                            >
                              {event.title}
                            </div>
                            {org && (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0px",
                                  marginTop: "2px",
                                }}
                              >
                                {/* Intentionally omit inline logos to avoid canvas artifacts */}
                                {/* {org.imageUrl || org.logoUrl ? (
                                  <img
                                    src={org.imageUrl || org.logoUrl}
                                    crossOrigin="anonymous"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => (e.currentTarget.style.display = "none")}
                                    style={{
                                      height: "12px",
                                      width: "12px",
                                      objectFit: "contain",
                                      borderRadius: "2px",
                                    }}
                                    alt=""
                                  />
                                ) : null} */}
                                <span
                                  style={{ fontSize: "10px", color: "#6b7280" }}
                                >
                                  {" " + org.name}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {day.regularEvents.length > 2 && (
                        <div style={{ fontSize: "10px", color: "#6b7280" }}>
                          +{day.regularEvents.length - 2} more
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Long Running Events Section */}
        {longRunningEvents.length > 0 && (
          <div
            style={{
              marginTop: "24px",
              padding: "16px",
              backgroundColor: "#e0f2fe",
              borderRadius: "8px",
              border: "1px solid #93c5fd",
            }}
          >
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "600",
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#1e3a8a",
              }}
            >
              <FaClock />
              Long Running Events (2+ weeks)
            </h3>

            <div style={{ display: "grid", gap: "8px" }}>
              {longRunningEvents.map((event, index) => {
                const { start: startDate, end: endDate } = getRange(event);
                const duration = Math.max(
                  1,
                  Math.ceil(endDate.diff(startDate, "days").days)
                );
                const org = event.organizations?.[0]
                  ? getOrganization(event.organizations[0])
                  : null;

                return (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      gap: "12px",
                      padding: "8px",
                      backgroundColor: "white",
                      borderRadius: "4px",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: "500",
                          fontSize: "14px",
                          color: "#111827",
                          marginBottom: "2px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          lineHeight: "1.2",
                          maxHeight: "2.4em",
                        }}
                      >
                        {event.title}
                      </div>
                      {org && (
                        <div
                          style={{
                            display: "block",
                            fontSize: "12px",
                            color: "#6b7280",
                            marginTop: "2px",
                            marginBottom: "6px",
                          }}
                        >
                          {org.name}
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6b7280",
                          marginTop: "4px",
                        }}
                      >
                        {startDate.toFormat("MMM d")} -{" "}
                        {endDate.toFormat("MMM d, yyyy")}
                        <span style={{ marginLeft: "8px", color: "#2563eb" }}>
                          ({duration} days)
                        </span>
                      </div>
                      {event.locationName && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            marginTop: "2px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <FaMapMarkerAlt style={{ fontSize: "10px" }} />
                          {event.locationName}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{ marginTop: "8px", fontSize: "11px", color: "#1e3a8a" }}
            >
              * Blue dots on calendar days indicate long-running events
            </div>
          </div>
        )}

        <span style={{ marginTop: "4px" }}>Powered by: </span>

        <span style={{ fontWeight: 600, color: "#111827", marginLeft: "4px" }}>
          Contexlia.com
        </span>
      </div>
    </>
  );
};

export default EventsCalendarPDF;
