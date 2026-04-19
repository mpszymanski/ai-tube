import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ChannelResult } from "../../types";
import {
  addTag,
  removeTag,
  getChannelTags,
  getAllTags,
  normalizeTag,
  subscribeToChanges,
} from "../../services/taggedChannels";
import { tagStyle } from "../../utils/tagColor";

interface TagPickerProps {
  channel: ChannelResult;
  size?: "sm" | "md";
}

export default function TagPicker({ channel, size = "md" }: TagPickerProps) {
  const [tags, setTags] = useState(() => getChannelTags(channel.channelId));
  const [allTags, setAllTags] = useState(() => getAllTags());
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const [inputValue, setInputValue] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const refresh = () => {
      setTags(getChannelTags(channel.channelId));
      setAllTags(getAllTags());
    };
    refresh();
    return subscribeToChanges(refresh);
  }, [channel.channelId]);

  useEffect(() => {
    if (!open) return;
    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        !containerRef.current?.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open]);

  function handleToggleTag(tag: string) {
    if (tags.includes(tag)) {
      removeTag(channel.channelId, tag);
    } else {
      addTag(channel, tag);
    }
  }

  function handleCreate() {
    const norm = normalizeTag(inputValue);
    if (!norm) return;
    addTag(channel, norm);
    setInputValue("");
  }

  const chipFontSize = size === "sm" ? 11 : 12;
  const chipPadding = size === "sm" ? "3px 7px" : "4px 9px";

  const dropdown = open && dropdownPos ? createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: "fixed",
        top: dropdownPos.top,
        left: dropdownPos.left,
        zIndex: 9999,
        background: "var(--bg-elev)",
        border: "1px solid var(--border-strong)",
        borderRadius: "var(--radius)",
        minWidth: 160,
        boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {allTags.length === 0 ? (
        <div style={{ padding: "8px 12px", fontSize: 12, color: "var(--text-mute)", fontFamily: "var(--font-mono)" }}>
          No tags yet
        </div>
      ) : (
        allTags.map((tag) => {
          const active = tags.includes(tag);
          const s = tagStyle(tag);
          return (
            <button
              key={tag}
              onClick={() => handleToggleTag(tag)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 12px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                fontSize: 12,
                fontFamily: "var(--font-mono)",
                color: active ? s.color : "var(--text-dim)",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-card)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ width: 14, fontSize: 12, color: "var(--success)", flexShrink: 0 }}>
                {active ? "✓" : ""}
              </span>
              #{tag}
            </button>
          );
        })
      )}
      <div style={{ borderTop: "1px solid var(--border)", padding: "6px 8px", display: "flex", gap: 6 }}>
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreate(); } }}
          placeholder="New tag…"
          style={{
            flex: 1,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            color: "var(--text)",
            fontSize: 12,
            fontFamily: "var(--font-mono)",
            padding: "4px 8px",
            outline: "none",
          }}
        />
        <button
          onClick={handleCreate}
          style={{
            background: "var(--accent)",
            border: "none",
            borderRadius: "var(--radius-sm)",
            color: "#fff",
            fontSize: 12,
            fontFamily: "var(--font-mono)",
            padding: "4px 10px",
            cursor: "pointer",
          }}
        >
          Add
        </button>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}
    >
      {tags.map((tag) => {
        const s = tagStyle(tag);
        return (
          <span
            key={tag}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: chipFontSize,
              fontFamily: "var(--font-mono)",
              padding: chipPadding,
              borderRadius: "var(--radius-sm)",
              border: `1px solid ${s.borderColor}`,
              color: s.color,
              background: s.background,
              whiteSpace: "nowrap",
            }}
          >
            #{tag}
            <button
              onClick={(e) => { e.stopPropagation(); removeTag(channel.channelId, tag); }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: s.color,
                padding: 0,
                lineHeight: 1,
                fontSize: chipFontSize + 1,
                opacity: 0.7,
                display: "flex",
                alignItems: "center",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
            >
              ×
            </button>
          </span>
        );
      })}

      <button
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation();
          if (!open && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setDropdownPos({ top: rect.bottom + 6, left: rect.left });
          }
          setOpen((v) => !v);
        }}
        style={{
          flexShrink: 0,
          background: "transparent",
          border: "1px solid var(--border-strong)",
          borderRadius: "var(--radius-sm)",
          color: "var(--text-mute)",
          fontSize: chipFontSize,
          fontFamily: "var(--font-mono)",
          padding: chipPadding,
          cursor: "pointer",
          transition: "border-color 0.15s, color 0.15s",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.color = "var(--text-mute)"; }}
      >
        + Tag
      </button>

      {dropdown}
    </div>
  );
}
