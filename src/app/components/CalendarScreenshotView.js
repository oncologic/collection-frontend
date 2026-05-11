"use client";

import React, { useState, useEffect, useRef } from "react";
import { DateTime } from "luxon";
import { FaTimes } from "react-icons/fa";

const CalendarScreenshotView = ({
  events = [],
  organizations = [],
  month,
  year,
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [scale, setScale] = useState(1);
  const containerRef = useRef(null);
  const monthName = DateTime.local(year, month).monthLong.toUpperCase();

  // Calculate scale to fit calendar in viewport
  useEffect(() => {
    const calculateScale = () => {
      if (!showPreview || !containerRef.current) return;

      const container = containerRef.current;
      const containerWidth = container.clientWidth; // Full width
      const containerHeight = container.clientHeight; // Full height

      const contentWidth = 1720; // 1600 + 60*2 padding
      const contentHeight = 1020; // ~900 + 60*2 padding

      // Calculate scale to fit both width and height
      const scaleX = containerWidth / contentWidth;
      const scaleY = containerHeight / contentHeight;
      const newScale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down

      setScale(newScale);
    };

    // Small delay to ensure DOM is ready
    setTimeout(calculateScale, 50);
    window.addEventListener("resize", calculateScale);

    return () => window.removeEventListener("resize", calculateScale);
  }, [showPreview]);

  // Helpers
  const toDT = (v) => {
    if (!v) return null;
    if (typeof v === "string") {
      // Handle space-separated datetime format
      const cleanDate = v.replace(" ", "T");
      return DateTime.fromISO(cleanDate);
    }
    if (v?.toISO) return v;
    return null;
  };

  const getRange = (ev) => {
    const start = toDT(ev.startDate || ev.startTime);
    const end = toDT(ev.endDate || ev.endTime) || start;
    return { start, end };
  };

  const getEventTime = (event) => {
    // Try explicit time fields first
    const timeStr = event.time || event.startTime;
    if (timeStr) {
      try {
        // Handle time strings like "10:00" or "10:00:00"
        const timeParts = timeStr.split(":");
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1] || "0", 10);

        if (isNaN(hours)) return "";

        const ampm = hours >= 12 ? "PM" : "AM";
        const hour12 = hours % 12 || 12;
        return `${hour12}:${minutes.toString().padStart(2, "0")} ${ampm}`;
      } catch (e) {
        return "";
      }
    }
    
    // Try to extract time from startDate if it has time info
    if (event.startDate) {
      try {
        const dt = toDT(event.startDate);
        if (dt && dt.isValid) {
          // Check if it has a meaningful time (not midnight)
          if (dt.hour !== 0 || dt.minute !== 0) {
            const hours = dt.hour;
            const minutes = dt.minute;
            const ampm = hours >= 12 ? "PM" : "AM";
            const hour12 = hours % 12 || 12;
            return `${hour12}:${minutes.toString().padStart(2, "0")} ${ampm}`;
          }
        }
      } catch (e) {
        return "";
      }
    }
    
    return "";
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

  // Get events for a specific day, excluding long-running events
  const getEventsForDay = (date) => {
    const dayStart = date.startOf("day");
    const dayEnd = date.endOf("day");

    return events.filter((event) => {
      const { start, end } = getRange(event);
      if (!start) return false;

      // Calculate duration
      const duration = end.diff(start, "days").days;

      // Exclude long-running events (>14 days)
      if (duration > 14) return false;

      return overlaps(start, end, dayStart, dayEnd);
    });
  };

  // Get all events for the sidebar (excluding long-running)
  const getAllMonthEvents = () => {
    const monthStart = DateTime.local(year, month, 1).startOf("month");
    const monthEnd = monthStart.endOf("month");

    return events
      .filter((event) => {
        const { start, end } = getRange(event);
        if (!start) return false;
        const duration = end.diff(start, "days").days;
        if (duration > 14) return false;
        return overlaps(start, end, monthStart, monthEnd);
      })
      .sort((a, b) => {
        const { start: startA } = getRange(a);
        const { start: startB } = getRange(b);
        return startA.toMillis() - startB.toMillis();
      });
  };

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
      const dayEvents = getEventsForDay(date);

      week.push({
        day,
        date: date.toISODate(),
        events: dayEvents,
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

  const calendarGrid = generateCalendarGrid();
  const allMonthEvents = getAllMonthEvents();

  return (
    <>
      {/* Preview Button */}
      <button
        onClick={() => setShowPreview(true)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        Calendar Preview
      </button>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-lg w-full max-w-[100vw] sm:max-w-[95vw] max-h-[100vh] sm:max-h-[95vh] overflow-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-semibold text-gray-900">
                Calendar Preview - {monthName} {year}
              </h2>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Content */}
            <div
              ref={containerRef}
              className="p-2 sm:p-6 overflow-auto"
              style={{ height: "calc(100vh - 80px)" }}
            >
              <div
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                  transition: "transform 0.3s ease",
                  margin: scale < 1 ? `0 auto ${20 * scale}px auto` : "0 auto",
                  width: "fit-content",
                }}
              >
                <div
                  id="calendar-screenshot-content"
                  style={{
                    width: "1600px",
                    minHeight: "900px",
                    padding: "60px",
                    backgroundColor: "#FFFFFF",
                    fontFamily: "Arial, system-ui, -apple-system, sans-serif",
                    display: "flex",
                    flexDirection: "column",
                    margin: "0 auto",
                    boxShadow:
                      scale < 1 ? "0 20px 50px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  {/* Header with Year and Month */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "40px",
                    }}
                  >
                    <h1
                      style={{
                        fontSize: "72px",
                        fontWeight: "bold",
                        color: "#000000",
                        margin: 0,
                        fontFamily: "Arial Black, sans-serif",
                      }}
                    >
                      {year}
                    </h1>
                    <h2
                      style={{
                        fontSize: "60px",
                        fontWeight: "900",
                        color: "#000000",
                        margin: 0,
                        letterSpacing: "2px",
                        fontFamily: "Arial Black, sans-serif",
                      }}
                    >
                      {monthName}
                    </h2>
                    <div
                      style={{
                        fontSize: "18px",
                        fontStyle: "italic",
                        color: "#000000",
                        fontWeight: "500",
                      }}
                    >
                      UPCOMING EVENTS
                    </div>
                  </div>

                  {/* Main Content Area */}
                  <div
                    style={{
                      display: "flex",
                      gap: "40px",
                      flex: 1,
                    }}
                  >
                    {/* Left Sidebar - Events List */}
                    <div
                      style={{
                        width: "320px",
                        flexShrink: 0,
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "20px",
                          fontWeight: "bold",
                          color: "#000000",
                          marginBottom: "20px",
                          letterSpacing: "1px",
                        }}
                      >
                        EVENTS
                      </h3>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "16px",
                        }}
                      >
                        {allMonthEvents.length === 0 ? (
                          <div
                            style={{
                              fontSize: "14px",
                              color: "#666666",
                              fontStyle: "italic",
                            }}
                          >
                            No events scheduled this month
                          </div>
                        ) : (
                          allMonthEvents.map((event, idx) => {
                            const { start } = getRange(event);
                            const firstOrg = event.organizations?.[0];
                            const org = firstOrg
                              ? getOrganization(firstOrg)
                              : null;
                            const eventTime = getEventTime(event);

                            return (
                              <div
                                key={idx}
                                style={{
                                  fontSize: "14px",
                                  lineHeight: "1.4",
                                  color: "#000000",
                                  marginBottom: "8px",
                                  paddingBottom: "8px",
                                  borderBottom: "1px solid #EEEEEE",
                                }}
                              >
                                <div
                                  style={{
                                    fontWeight: "600",
                                    marginBottom: "2px",
                                  }}
                                >
                                  {start.toFormat("MMM dd")} | {event.title}
                                </div>
                                {(eventTime || org) && (
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      color: "#666666",
                                      marginTop: "2px",
                                      display: "flex",
                                      flexWrap: "wrap",
                                      gap: "4px",
                                    }}
                                  >
                                    {eventTime && (
                                      <span style={{ color: "#0066CC", fontWeight: "500" }}>
                                        {eventTime}
                                      </span>
                                    )}
                                    {eventTime && org && (
                                      <span style={{ color: "#999999" }}>•</span>
                                    )}
                                    {org && (
                                      <span>{org.name}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Right Side - Calendar Grid */}
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      {/* Weekday Headers Row */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(7, 1fr)",
                          borderTop: "2px solid #000000",
                          borderLeft: "2px solid #000000",
                          borderRight: "2px solid #000000",
                          backgroundColor: "#FFFFFF",
                        }}
                      >
                        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(
                          (day, index) => (
                            <div
                              key={day}
                              style={{
                                padding: "15px 10px",
                                backgroundColor: "#FFFFFF",
                                borderBottom: "2px solid #000000",
                                borderRight:
                                  index < 6 ? "1px solid #000000" : "none",
                                fontSize: "16px",
                                fontWeight: "bold",
                                color: "#000000",
                                letterSpacing: "1px",
                                textAlign: "center",
                              }}
                            >
                              {day}
                            </div>
                          )
                        )}
                      </div>

                      {/* Calendar Grid */}
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          borderLeft: "2px solid #000000",
                          borderRight: "2px solid #000000",
                          borderBottom: "2px solid #000000",
                          backgroundColor: "#FFFFFF",
                          tableLayout: "fixed",
                        }}
                      >
                        {/* Calendar Body */}
                        <tbody>
                          {calendarGrid.map((week, weekIndex) => (
                            <tr key={weekIndex}>
                              {week.map((day, dayIndex) => {
                                const hasEvents = day && day.events.length > 0;
                                const cellBackground = hasEvents
                                  ? "#FFE4CC"
                                  : "#FFFFFF";

                                return (
                                  <td
                                    key={dayIndex}
                                    style={{
                                      width: "14.285%",
                                      height: "110px",
                                      padding: "10px 8px",
                                      verticalAlign: "top",
                                      borderBottom:
                                        weekIndex < calendarGrid.length - 1
                                          ? "1px solid #000000"
                                          : "none",
                                      borderRight:
                                        dayIndex < 6
                                          ? "1px solid #000000"
                                          : "none",
                                      backgroundColor: day
                                        ? cellBackground
                                        : "#F5F5F5",
                                      position: "relative",
                                    }}
                                  >
                                    {day && (
                                      <div
                                        style={{
                                          display: "flex",
                                          flexDirection: "column",
                                          height: "100%",
                                        }}
                                      >
                                        <div
                                          style={{
                                            fontSize: "14px",
                                            fontWeight: "600",
                                            color: "#000000",
                                            display: "block",
                                            width: "100%",
                                          }}
                                        >
                                          {String(day.day).padStart(2, "0")}
                                        </div>
                                        {day.events.length > 0 && (
                                          <div
                                            style={{
                                              fontSize: "11px",
                                              lineHeight: "1.3",
                                              marginTop: "6px",
                                              display: "flex",
                                              flexDirection: "column",
                                              gap: "4px",
                                            }}
                                          >
                                            {day.events
                                              .slice(0, 2)
                                              .map((event, idx) => {
                                                // Get event time
                                                const eventTime = getEventTime(event);
                                                // Truncate title to fit - shorter if we have time
                                                const maxLength = eventTime ? 18 : 25;
                                                const title =
                                                  event.title.length > maxLength
                                                    ? event.title.substring(
                                                        0,
                                                        maxLength - 3
                                                      ) + "..."
                                                    : event.title;

                                                return (
                                                  <div
                                                    key={idx}
                                                    style={{
                                                      display: "flex",
                                                      flexDirection: "column",
                                                      gap: "1px",
                                                    }}
                                                  >
                                                    {eventTime && (
                                                      <div
                                                        style={{
                                                          fontSize: "9px",
                                                          color: "#0066CC",
                                                          fontWeight: "600",
                                                        }}
                                                      >
                                                        {eventTime}
                                                      </div>
                                                    )}
                                                    <div
                                                      style={{
                                                        fontWeight: "500",
                                                        color: "#333333",
                                                        fontSize: "11px",
                                                        lineHeight: "1.2",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap",
                                                      }}
                                                    >
                                                      {title}
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            {day.events.length > 2 && (
                                              <div
                                                style={{
                                                  fontSize: "10px",
                                                  color: "#666666",
                                                  fontStyle: "italic",
                                                  marginTop: "2px",
                                                }}
                                              >
                                                +{day.events.length - 2} more
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Footer with Logos */}
                  <div
                    style={{
                      marginTop: "40px",
                      paddingTop: "20px",
                      borderTop: "1px solid #CCCCCC",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    {/* Left side - Organization logos */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "20px",
                      }}
                    >
                      {(() => {
                        // Get unique organizations with logos
                        const uniqueOrgs = new Map();
                        allMonthEvents.forEach((event) => {
                          if (event.organizations) {
                            event.organizations.forEach((org) => {
                              const orgData = getOrganization(org);
                              if (
                                orgData &&
                                orgData.imageUrl &&
                                !uniqueOrgs.has(orgData.id)
                              ) {
                                uniqueOrgs.set(orgData.id, orgData);
                              }
                            });
                          }
                        });

                        // Display up to 3 organization logos
                        return Array.from(uniqueOrgs.values())
                          .slice(0, 3)
                          .map((org) => (
                            <img
                              key={org.id}
                              src={org.imageUrl}
                              alt={org.name}
                              style={{
                                height: "50px",
                                width: "auto",
                                objectFit: "contain",
                                borderRadius: "8px",
                                backgroundColor: "white",
                                padding: "6px",
                              }}
                            />
                          ));
                      })()}
                    </div>

                    {/* Right side - Contexlia logo and text */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "14px",
                          color: "#666666",
                          marginRight: "8px",
                        }}
                      >
                        Powered by
                      </span>
                      <img
                        src="/images/Contexlia.png"
                        alt="Contexlia"
                        style={{
                          height: "55px",
                          width: "auto",
                          objectFit: "contain",
                          borderRadius: "8px",
                          backgroundColor: "white",
                          padding: "6px",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CalendarScreenshotView;
