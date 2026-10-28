"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ClipboardCheck,
  Copy,
  Download,
  Sparkles,
  Scale,
  ListChecks,
  ShieldCheck,
  Users,
  AlertTriangle,
} from "lucide-react";
import type { ExtractResponse, MeetingAnalysis } from "@/lib/schema";
import { formatLongDate, relativeDueLabel } from "@/lib/dates";

const AVATAR_TONES = ["sage", "clay", "sky", "sand", "plum"];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase()).join("") || "?";
}

function toneFor(name: string): string {
  let total = 0;
  for (const character of name) total += character.charCodeAt(0);
  return AVATAR_TONES[total % AVATAR_TONES.length];
}

function Avatar({ name, small = false }: { name: string; small?: boolean }) {
  return (
    <span
      className={`avatar tone-${toneFor(name)} ${small ? "avatar-small" : ""}`}
      title={name}
    >
      {initials(name)}
    </span>
  );
}

export function AnalysisView({
  data,
  completed,
  onToggle,
  copied,
  stale,
  onCopyJson,
  onDownload,
}: {
  data: ExtractResponse;
  completed: Set<string>;
  onToggle: (id: string) => void;
  copied: boolean;
  stale: boolean;
  onCopyJson: () => void;
  onDownload: () => void;
}) {
  const [view, setView] = useState<"brief" | "json">("brief");
  const { analysis } = data;
  const json = useMemo(() => JSON.stringify(analysis, null, 2), [analysis]);
  const highPriority = analysis.actionItems.filter(
    (item) => item.priority === "high",
  ).length;
  const assignedOwners = useMemo(
    () =>
      new Set(
        analysis.actionItems
          .map((item) => item.owner)
          .filter((owner) => owner !== "Unassigned"),
      ).size,
    [analysis.actionItems],
  );
  const doneCount = analysis.actionItems.filter((item) =>
    completed.has(item.id),
  ).length;
  const progress =
    analysis.actionItems.length > 0
      ? Math.round((doneCount / analysis.actionItems.length) * 100)
      : 0;

  return (
    <section className="analysis-pane" aria-label="Extracted meeting intelligence">
      <div className="result-topbar">
        <div className="view-tabs" role="tablist" aria-label="Output format">
          <button
            type="button"
            role="tab"
            aria-selected={view === "brief"}
            className={view === "brief" ? "active" : ""}
            onClick={() => setView("brief")}
          >
            Brief
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "json"}
            className={view === "json" ? "active" : ""}
            onClick={() => setView("json")}
          >
            <span className="tab-braces">{"{ }"}</span> JSON
          </button>
        </div>

        <div className="result-actions">
          <button type="button" className="ghost-action" onClick={onCopyJson}>
            {copied ? <ClipboardCheck size={15} /> : <Copy size={15} />}
            <span>{copied ? "Copied" : "Copy JSON"}</span>
          </button>
          <button
            type="button"
            className="icon-action"
            onClick={onDownload}
            aria-label="Download JSON"
            title="Download JSON"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {view === "json" ? (
        <JsonView json={json} analysis={analysis} />
      ) : (
        <div className="result-scroll">
          <div className="result-head">
            <div className="result-kicker-row">
              <span className="output-kicker">
                <span className="output-live-dot" />
                Structured meeting brief
              </span>
              <span
                className={`engine-badge ${data.engine === "deepseek" ? "ai" : "local"}`}
              >
                {data.engine === "deepseek" ? "DeepSeek extracted" : "Local preview"}
              </span>
            </div>

            <h2>{analysis.meeting.title}</h2>

            <div className="meeting-meta">
              <span>
                <CalendarDays size={14} />
                {formatLongDate(analysis.meeting.date)}
              </span>
              <span className="dot-separator" />
              <span>
                <Users size={14} />
                {analysis.meeting.participants.length || "No"} participant
                {analysis.meeting.participants.length === 1 ? "" : "s"}
              </span>
              {analysis.meeting.durationMinutes ? (
                <>
                  <span className="dot-separator" />
                  <span>{analysis.meeting.durationMinutes} min</span>
                </>
              ) : null}
            </div>

            {analysis.meeting.participants.length > 0 && (
              <div className="participant-row">
                <div className="avatar-stack">
                  {analysis.meeting.participants.slice(0, 5).map((person) => (
                    <Avatar key={person} name={person} small />
                  ))}
                </div>
                <span>{analysis.meeting.participants.join(" · ")}</span>
              </div>
            )}
          </div>

          {stale && (
            <div className="warning-note stale-note">
              <AlertTriangle size={15} />
              <span>
                The transcript changed since this extraction. Run it again to
                refresh the brief.
              </span>
            </div>
          )}

          {data.warnings.length > 0 && (
            <div className="warning-note">
              <AlertTriangle size={15} />
              <span>{data.warnings[0]}</span>
            </div>
          )}

          <div className="metric-strip">
            <div>
              <strong>{analysis.keyDecisions.length}</strong>
              <span>Decisions</span>
            </div>
            <div>
              <strong>{analysis.actionItems.length}</strong>
              <span>Actions</span>
            </div>
            <div>
              <strong>{assignedOwners || "—"}</strong>
              <span>Owners</span>
            </div>
            <div>
              <strong>{highPriority || "—"}</strong>
              <span>High priority</span>
            </div>
          </div>

          <section className="brief-section">
            <div className="section-label">
              <span className="section-icon">
                <Sparkles size={14} />
              </span>
              <span>Executive summary</span>
              <span className="section-line" />
            </div>
            <p className="summary-copy">{analysis.summary}</p>
          </section>

          <section className="brief-section">
            <div className="section-label">
              <span className="section-icon">
                <Scale size={14} />
              </span>
              <span>Key decisions</span>
              <span className="count-pill">
                {analysis.keyDecisions.length}
              </span>
              <span className="section-line" />
            </div>

            {analysis.keyDecisions.length === 0 ? (
              <div className="section-empty">
                No settled decisions were detected in this conversation.
              </div>
            ) : (
              <ol className="decision-list">
                {analysis.keyDecisions.map((decision, index) => (
                  <li key={decision.id}>
                    <span className="decision-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="decision-body">
                      <p>{decision.decision}</p>
                      {decision.madeBy.length > 0 && (
                        <span className="decision-by">
                          {decision.madeBy.join(", ")}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="brief-section action-section">
            <div className="section-label">
              <span className="section-icon">
                <ListChecks size={14} />
              </span>
              <span>Action items</span>
              <span className="count-pill">{analysis.actionItems.length}</span>
              <span className="section-line" />
              {analysis.actionItems.length > 0 && (
                <span className="action-progress">
                  {doneCount}/{analysis.actionItems.length} done
                </span>
              )}
            </div>

            {analysis.actionItems.length === 0 ? (
              <div className="section-empty">
                No assignments were found. Try a transcript with clearer
                commitments or named owners.
              </div>
            ) : (
              <>
                <div className="action-list">
                  {analysis.actionItems.map((item) => {
                    const isDone = completed.has(item.id);
                    return (
                      <article
                        key={item.id}
                        className={`action-card ${isDone ? "is-done" : ""}`}
                      >
                        <button
                          type="button"
                          className={`action-check ${isDone ? "checked" : ""}`}
                          onClick={() => onToggle(item.id)}
                          aria-label={
                            isDone
                              ? `Mark "${item.task}" as incomplete`
                              : `Mark "${item.task}" as complete`
                          }
                          aria-pressed={isDone}
                        >
                          <Check size={13} />
                        </button>
                        <div className="action-content">
                          <p>{item.task}</p>
                          <div className="action-meta">
                            <span
                              className={`owner-chip ${item.owner === "Unassigned" ? "unassigned" : ""}`}
                            >
                              {item.owner !== "Unassigned" ? (
                                <Avatar name={item.owner} small />
                              ) : (
                                <span className="owner-placeholder">?</span>
                              )}
                              {item.owner}
                            </span>
                            <span
                              className={`due-chip ${!item.dueDate ? "no-date" : ""}`}
                            >
                              <CalendarDays size={12} />
                              {relativeDueLabel(
                                item.dueDate,
                                analysis.meeting.date,
                              )}
                            </span>
                            <span
                              className={`priority-chip priority-${item.priority}`}
                            >
                              <span />
                              {item.priority}
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
                <div className="progress-track" aria-hidden="true">
                  <span style={{ width: `${progress}%` }} />
                </div>
              </>
            )}
          </section>

          <div className="schema-lock">
            <ShieldCheck size={14} />
            <span>Runtime validated</span>
            <span className="schema-divider" />
            <code>meeting_analysis.schema.v1</code>
            {data.model && (
              <>
                <span className="schema-divider" />
                <span>{data.model}</span>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function JsonView({
  json,
  analysis,
}: {
  json: string;
  analysis: MeetingAnalysis;
}) {
  const lines = json.split("\n");

  return (
    <div className="json-view">
      <div className="json-meta">
        <span className="json-dot" />
        <span>application/json</span>
        <span className="json-separator">/</span>
        <span>{lines.length} lines</span>
        <span className="json-separator">/</span>
        <span>Zod validated</span>
        <span className="json-valid">
          <ShieldCheck size={13} /> Valid
        </span>
      </div>
      <div className="json-code-wrap">
        <pre className="json-code" aria-label="Structured meeting JSON">
          <code>
            {lines.map((line, index) => (
              <span className="code-line" key={`${index}-${line}`}>
                <span className="line-number">{index + 1}</span>
                <span>{line}</span>
              </span>
            ))}
          </code>
        </pre>
      </div>
      <div className="json-footer">
        <span>
          <span className="json-footer-dot" />
          {analysis.actionItems.length} action items ·{" "}
          {analysis.keyDecisions.length} decisions
        </span>
        <code>type MeetingAnalysis</code>
      </div>
    </div>
  );
}
