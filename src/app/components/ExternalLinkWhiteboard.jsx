"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FaChalkboard,
  FaCompress,
  FaExpand,
  FaSave,
  FaSpinner,
} from "react-icons/fa";

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-gray-500">
        Loading whiteboard...
      </div>
    ),
  }
);

const SAVE_DELAY_MS = 1400;

const DEFAULT_APP_STATE = {
  viewBackgroundColor: "#ffffff",
  currentItemStrokeColor: "#1e1e1e",
  currentItemBackgroundColor: "transparent",
  currentItemFillStyle: "hachure",
  currentItemStrokeWidth: 2,
  currentItemStrokeStyle: "solid",
  currentItemRoughness: 1,
  currentItemOpacity: 100,
  gridModeEnabled: false,
};

const PERSISTED_APP_STATE_KEYS = [
  "viewBackgroundColor",
  "currentItemStrokeColor",
  "currentItemBackgroundColor",
  "currentItemFillStyle",
  "currentItemStrokeWidth",
  "currentItemStrokeStyle",
  "currentItemRoughness",
  "currentItemOpacity",
  "gridModeEnabled",
  "theme",
  "name",
];

const parseWhiteboardData = (whiteboardData) => {
  if (!whiteboardData) return {};

  if (typeof whiteboardData === "string") {
    try {
      return JSON.parse(whiteboardData);
    } catch (error) {
      console.error("Failed to parse whiteboard data:", error);
      return {};
    }
  }

  return whiteboardData;
};

const pickPersistedAppState = (appState = {}) =>
  PERSISTED_APP_STATE_KEYS.reduce((acc, key) => {
    if (appState[key] !== undefined) {
      acc[key] = appState[key];
    }
    return acc;
  }, {});

const normalizeScene = (whiteboardData, name) => {
  const parsed = parseWhiteboardData(whiteboardData);
  const elements = Array.isArray(parsed.elements) ? parsed.elements : [];
  const files =
    parsed.files && typeof parsed.files === "object" ? parsed.files : {};
  const appState = {
    ...DEFAULT_APP_STATE,
    ...pickPersistedAppState(parsed.appState),
    name,
  };

  return {
    elements,
    appState,
    files,
    scrollToContent: elements.length > 0,
  };
};

const toComparableScene = ({ elements = [], appState = {}, files = {} }) =>
  JSON.stringify({
    elements,
    appState: pickPersistedAppState(appState),
    files: files || {},
  });

const toPersistedScene = (elements, appState, files, name) => ({
  type: "excalidraw",
  version: 1,
  elements: Array.from(elements || []),
  appState: {
    ...pickPersistedAppState(appState),
    name,
  },
  files: files || {},
  updatedAt: new Date().toISOString(),
});

const getSaveLabel = (saveState) => {
  switch (saveState) {
    case "dirty":
      return "Unsaved";
    case "saving":
      return "Saving";
    case "saved":
      return "Saved";
    case "error":
      return "Save failed";
    default:
      return "";
  }
};

export default function ExternalLinkWhiteboard({
  boardId,
  externalLinkId,
  title,
  whiteboardData,
  canEdit,
  onSave,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [saveState, setSaveState] = useState("idle");
  const apiRef = useRef(null);
  const onSaveRef = useRef(onSave);
  const saveTimerRef = useRef(null);
  const lastSavedComparableRef = useRef("");
  const latestPendingRef = useRef(null);
  const hasHandledInitialChangeRef = useRef(false);
  const persistPendingRef = useRef(() => {});
  const whiteboardKey = boardId || externalLinkId || title || "whiteboard";
  const boardName = title ? `${title} whiteboard` : "Whiteboard";

  const initialData = useMemo(
    () => normalizeScene(whiteboardData, boardName),
    [whiteboardData, boardName]
  );

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    lastSavedComparableRef.current = toComparableScene(initialData);
    latestPendingRef.current = null;
    hasHandledInitialChangeRef.current = false;
    setSaveState("idle");
  }, [whiteboardKey, initialData]);

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      persistPendingRef.current();
    }, SAVE_DELAY_MS);
  }, []);

  const persistPending = useCallback(async () => {
    const pending = latestPendingRef.current;
    if (!pending || !onSaveRef.current) return;

    setSaveState("saving");

    try {
      await onSaveRef.current(pending.data);

      if (latestPendingRef.current?.comparable === pending.comparable) {
        lastSavedComparableRef.current = pending.comparable;
        latestPendingRef.current = null;
        setSaveState("saved");
      } else {
        scheduleSave();
      }
    } catch (error) {
      console.error("Failed to save whiteboard:", error);
      setSaveState("error");
    }
  }, [scheduleSave]);

  useEffect(() => {
    persistPendingRef.current = persistPending;
  }, [persistPending]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const refreshTimer = setTimeout(() => {
      apiRef.current?.refresh?.();
    }, 80);

    return () => clearTimeout(refreshTimer);
  }, [isExpanded]);

  const handleChange = useCallback(
    (elements, appState, files) => {
      if (!canEdit) return;

      const persistedScene = toPersistedScene(
        elements,
        appState,
        files,
        boardName
      );
      const comparable = toComparableScene(persistedScene);

      if (!hasHandledInitialChangeRef.current) {
        hasHandledInitialChangeRef.current = true;
        if (comparable === lastSavedComparableRef.current) {
          return;
        }
      }

      if (comparable === lastSavedComparableRef.current) {
        latestPendingRef.current = null;
        setSaveState("saved");
        return;
      }

      latestPendingRef.current = {
        data: persistedScene,
        comparable,
      };
      setSaveState("dirty");
      scheduleSave();
    },
    [boardName, canEdit, scheduleSave]
  );

  const handleSaveNow = () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    persistPendingRef.current();
  };

  const saveLabel = getSaveLabel(saveState);
  const shellClassName = isExpanded
    ? "fixed inset-3 sm:inset-6 z-[1000] flex flex-col rounded-lg border border-gray-200 bg-white shadow-2xl"
    : "bg-white rounded-lg shadow-sm border border-gray-200";
  const canvasClassName = isExpanded
    ? "flex-1 min-h-0"
    : "h-[420px] sm:h-[480px]";

  return (
    <>
      {isExpanded && (
        <div className="fixed inset-0 z-[999] bg-slate-900/40" />
      )}
      <div className={shellClassName}>
        <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <FaChalkboard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Whiteboard
              </h2>
              {saveLabel && (
                <p className="text-xs font-medium text-gray-500">
                  {saveLabel}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                type="button"
                onClick={handleSaveNow}
                disabled={saveState === "saving" || saveState !== "dirty"}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saveState === "saving" ? (
                  <FaSpinner className="h-4 w-4 animate-spin" />
                ) : (
                  <FaSave className="h-4 w-4" />
                )}
                Save
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsExpanded((current) => !current)}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white p-2 text-gray-700 shadow-sm hover:bg-gray-50"
              aria-label={isExpanded ? "Collapse whiteboard" : "Expand whiteboard"}
              title={isExpanded ? "Collapse whiteboard" : "Expand whiteboard"}
            >
              {isExpanded ? (
                <FaCompress className="h-4 w-4" />
              ) : (
                <FaExpand className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className={canvasClassName}>
          <Excalidraw
            key={whiteboardKey}
            excalidrawAPI={(api) => {
              apiRef.current = api;
            }}
            initialData={initialData}
            onChange={handleChange}
            viewModeEnabled={!canEdit}
            theme="light"
            name={boardName}
            UIOptions={{
              canvasActions: {
                changeViewBackgroundColor: true,
                clearCanvas: canEdit,
                export: { saveFileToDisk: true },
                loadScene: canEdit,
                saveAsImage: true,
                toggleTheme: false,
              },
            }}
          />
        </div>
      </div>
    </>
  );
}
