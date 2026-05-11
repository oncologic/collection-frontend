import { useState } from "react";
import {
  useUpdateExternalLinkInCollection,
  useUpdateNotation,
} from "./useCollections";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { DateTime } from "luxon";

/**
 * Hook for managing calendar event date updates
 * Handles both external links and notations
 */
export const useCalendarEventUpdates = (onSuccess) => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Mutation hooks for updating items
  const { mutate: updateExternalLink } = useUpdateExternalLinkInCollection();
  const { mutate: updateNotation } = useUpdateNotation();

  // Open update modal for an event
  const openUpdateModal = (event) => {
    setSelectedEvent(event);
    setIsUpdateModalOpen(true);
  };

  // Close update modal
  const closeUpdateModal = () => {
    setIsUpdateModalOpen(false);
    setSelectedEvent(null);
  };

  // Handle date update for an event
  const handleUpdateDate = (event, newDataOrDate) => {
    if (!event) return;

    try {
      // Determine if we're updating just the date or multiple fields
      const isDateOnly = typeof newDataOrDate === "string";
      const newStartDate = isDateOnly
        ? newDataOrDate
        : newDataOrDate.startDate || newDataOrDate.date;
      const newEndDate = isDateOnly
        ? newStartDate
        : newDataOrDate.endDate || newDataOrDate.startDate || newDataOrDate.date;
      const status =
        !isDateOnly && newDataOrDate.status
          ? newDataOrDate.status
          : event.status;

      // Handle time information if provided
      const time =
        !isDateOnly && newDataOrDate.time ? newDataOrDate.time : null;
      const timezone =
        !isDateOnly && newDataOrDate.timezone ? newDataOrDate.timezone : null;

      if (event.type === "external_link") {
        // Update external link date, time, timezone and/or status
        updateExternalLink(
          {
            collectionId: event.collectionId,
            externalLinkId: event.id,
            linkData: isDateOnly
              ? {
                  date: newStartDate,
                  startDate: newStartDate,
                  endDate: newEndDate,
                }
              : {
                  date: newStartDate,
                  startDate: newStartDate,
                  endDate: newEndDate,
                  status,
                  startTime: time || event.startTime,
                  endTime: event.endTime,
                  timezone: timezone,
                },
          },
          {
            onSuccess: () => {
              // Invalidate relevant queries to refresh the view
              queryClient.invalidateQueries([
                "collections",
                event.collectionId,
              ]);
              if (onSuccess) onSuccess();
              // toast.success(
              //   isDateOnly
              //     ? "External link date updated"
              //     : "External link updated"
              // );
            },
          }
        );
      } else if (event.type === "notation") {
        // Update notation date, time, timezone and/or status
        updateNotation(
          {
            notationId: event.notationId,
            notationData: isDateOnly
              ? {
                  date: newStartDate,
                  startDate: newStartDate,
                  endDate: newEndDate,
                }
              : {
                  date: newStartDate,
                  startDate: newStartDate,
                  endDate: newEndDate,
                  status,
                  startTime: event.startTime,
                  endTime: event.endTime,
                  timezone: timezone,
                },
          },
          {
            onSuccess: () => {
              // Invalidate relevant queries to refresh the view
              queryClient.invalidateQueries(["notations"]);
              queryClient.invalidateQueries(["externalLinks"]);
              queryClient.invalidateQueries([
                "collections",
                event.collectionId,
              ]);
              if (onSuccess) onSuccess();
              // toast.success(
              //   isDateOnly ? "Notation date updated" : "Notation updated"
              // );
            },
          }
        );
      } else {
        toast.error("Unsupported event type");
      }
    } catch (error) {
      console.error("Error updating date:", error);
      toast.error("Failed to update date");
    }
  };

  // Allow dragging events to update dates
  const handleEventDrag = (event, targetDate) => {
    if (!event) return;

    const currentStart = DateTime.fromISO(
      (event.startDate || event.date || "").split("T")[0]
    );
    const currentEnd = DateTime.fromISO(
      (event.endDate || event.startDate || event.date || "").split("T")[0]
    );
    const durationInDays =
      currentStart.isValid && currentEnd.isValid
        ? Math.max(Math.round(currentEnd.diff(currentStart, "days").days), 0)
        : 0;
    const formattedStartDate = targetDate.toFormat("yyyy-MM-dd");
    const formattedEndDate = targetDate
      .plus({ days: durationInDays })
      .toFormat("yyyy-MM-dd");

    // Preserve existing time, timezone, and status when dragging
    handleUpdateDate(event, {
      date: formattedStartDate,
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      startTime: event.startTime,
      endTime: event.endTime,
      timezone: event.timezone,
      status: event.status,
    });
  };

  return {
    selectedEvent,
    isUpdateModalOpen,
    openUpdateModal,
    closeUpdateModal,
    handleUpdateDate,
    handleEventDrag,
  };
};
