"use client";

import {
  ArrowRight,
  Check,
  Code2,
  FileText,
  Loader2,
  ShieldCheck,
  Sparkles,
  Upload,
  Users,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";
import { AnalysisView } from "@/components/analysis-view";
import {
  meetingAnalysisSchema,
  type ExtractResponse,
} from "@/lib/schema";
import { SAMPLE_TRANSCRIPTS, type SampleTranscript } from "@/lib/samples";

const MAX_CHARS = 60_000;

const LOADING_STEPS = [
  "Reading the room",
  "Separating signal from crosstalk",
  "Assigning owners and dates",
  "Validating the schema",
];

type ExtractedInput = {
  transcript: string;
  title: string;
  date: string;
};

export function MeetingWorkbench({
  aiReady,
  aiModel,
  defaultDate,
}: {
  aiReady: boolean;
  aiModel: string | null;
  defaultDate: string;
}) {
  const initialSample = SAMPLE_TRANSCRIPTS[0];
  const [sampleId, setSampleId] = useState<string | null>(initialSample.id);
  const [transcript, setTranscript] = useState(initialSample.transcript);
  const [title, setTitle] = useState(initialSample.title);
  const [meetingDate, setMeetingDate] = useState(defaultDate);
  const [result, setResult] = useState<ExtractResponse | null>(null);
  const [extractedInput, setExtractedInput] = useState<ExtractedInput | null>(
    null,
  );
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [extractionKey, setExtractionKey] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wordCount = useMemo(
    () => (transcript.trim() ? transcript.trim().split(/\s+/).length : 0),
    [transcript],
  );
  const charCount = transcript.length;
  const canExtract = transcript.trim().length >= 40 && !isLoading;
  const stale =
    Boolean(result && extractedInput) &&
    (transcript !== extractedInput?.transcript ||
      title !== extractedInput?.title ||
      meetingDate !== extractedInput?.date);

  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setLoadingStep((step) => (step + 1) % LOADING_STEPS.length);
    }, 1300);

    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!result) return;
    if (window.innerWidth < 1080) {
      outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  function resetOutput() {
    setResult(null);
    setExtractedInput(null);
    setCompleted(new Set());
    setCopied(false);
  }

  function loadSample(sample: SampleTranscript) {
    setSampleId(sample.id);
    setTranscript(sample.transcript);
    setTitle(sample.title);
    setMeetingDate(defaultDate);
    setError(null);
    resetOutput();
  }

  function updateTranscript(value: string) {
    setTranscript(value);
    setSampleId(null);
    setCopied(false);
  }

  async function readFile(file: File) {
    if (!/\.(txt|md|vtt|srt)$/i.test(file.name) && file.type !== "text/plain") {
      setError("Use a .txt, .md, .vtt, or .srt transcript file.");
      return;
    }

    if (file.size > MAX_CHARS) {
      setError("That file is larger than the 60,000 character limit.");
      return;
    }

    try {
      const text = await file.text();
      if (!text.trim()) {
        setError("That file appears to be empty.");
        return;
      }
      updateTranscript(text.slice(0, MAX_CHARS));
      if (!title.trim()) {
        setTitle(file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));
      }
      setError(null);
    } catch {
      setError("Could not read that file. Try pasting the transcript instead.");
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void readFile(file);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void readFile(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canExtract) {
      setError(
        transcript.trim().length < 40
          ? "Add a little more transcript before extracting."
          : "Extraction is already running.",
      );
      return;
    }

    setIsLoading(true);
    setLoadingStep(0);
    setError(null);
    setCopied(false);

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          title: title.trim() || undefined,
          meetingDate,
        }),
      });

      const payload = (await response.json()) as
        | ExtractResponse
        | { error?: string };

      if (!response.ok || !("analysis" in payload)) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "Extraction failed. Please try again.",
        );
      }

      const analysis = meetingAnalysisSchema.parse(payload.analysis);
      const nextResult: ExtractResponse = { ...payload, analysis };

      setResult(nextResult);
      setExtractedInput({ transcript, title, date: meetingDate });
      setCompleted(new Set());
      setExtractionKey((key) => key + 1);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Something went wrong while extracting the meeting.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function toggleAction(id: string) {
    setCompleted((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function copyJson() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(result.analysis, null, 2),
      );
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Clipboard access was blocked. Download the JSON instead.");
    }
  }

  function downloadJson() {
    if (!result) return;
    const slug =
      result.analysis.meeting.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "meeting";
    const blob = new Blob([JSON.stringify(result.analysis, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${slug}-minutes.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="workspace-section" id="workspace">
      <div className="workspace-heading">
        <div className="section-kicker">
          <span>01</span>
          <span>The workspace</span>
        </div>
        <div className="workspace-title-row">
          <h2>Raw input in. Shared truth out.</h2>
          <p>
            Paste the transcript exactly as it arrived. Quorum handles the
            timestamps, crosstalk, and unfinished sentences.
          </p>
        </div>
      </div>

      <div className="workspace-frame">
        <div className="window-bar">
          <div className="window-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="window-label">
            <span>QUORUM WORKSPACE</span>
            <span className="window-slash">/</span>
            <span>{title || "Untitled meeting"}</span>
          </div>
          <div className="window-status">
            <span className={`status-dot ${aiReady ? "online" : ""}`} />
            {aiReady ? "DeepSeek + Zod guard" : "Local preview mode"}
          </div>
        </div>

        <div className="workspace-grid">
          <form className="input-pane" onSubmit={handleSubmit}>
            <div className="pane-heading">
              <div>
                <div className="pane-index">01 / Transcript</div>
                <h3>Drop in the messy version.</h3>
              </div>
              <span className="input-badge">
                <ShieldCheck size={13} /> Not stored
              </span>
            </div>

            <div className="sample-row">
              <span className="sample-label">Try a sample</span>
              <div className="sample-chips">
                {SAMPLE_TRANSCRIPTS.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    className={sampleId === sample.id ? "active" : ""}
                    onClick={() => loadSample(sample)}
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="meta-grid">
              <label>
                <span>Meeting title</span>
                <input
                  type="text"
                  value={title}
                  maxLength={160}
                  placeholder="Optional — inferred if blank"
                  onChange={(event) => {
                    setTitle(event.target.value);
                    setCopied(false);
                  }}
                />
              </label>
              <label>
                <span>Meeting date</span>
                <input
                  type="date"
                  value={meetingDate}
                  onChange={(event) => {
                    setMeetingDate(event.target.value);
                    setCopied(false);
                  }}
                />
              </label>
            </div>

            <div
              className={`editor-shell ${dragActive ? "drag-active" : ""}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(event) => {
                if (event.currentTarget === event.target) setDragActive(false);
              }}
              onDrop={handleDrop}
            >
              <div className="editor-toolbar">
                <span className="file-label">
                  <FileText size={14} />
                  <span>raw-transcript.txt</span>
                  {sampleId && <span className="sample-tag">sample</span>}
                </span>
                <div className="editor-actions">
                  <span className="count-label">
                    {wordCount.toLocaleString()} words
                  </span>
                  <button
                    type="button"
                    className="toolbar-button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={13} /> Upload
                  </button>
                  {transcript && (
                    <button
                      type="button"
                      className="toolbar-button icon-only"
                      onClick={() => updateTranscript("")}
                      aria-label="Clear transcript"
                      title="Clear transcript"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
              <textarea
                value={transcript}
                onChange={(event) => updateTranscript(event.target.value)}
                maxLength={MAX_CHARS}
                spellCheck={false}
                aria-label="Meeting transcript"
                placeholder={`Maya: Okay, let's get started...\nJordan: Quick update on the launch deck...\nMaya: Priya, can you send the final pricing model by tomorrow?`}
              />
              <div className="editor-footer">
                <span className={charCount > MAX_CHARS * 0.9 ? "near-limit" : ""}>
                  {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
                </span>
                <span>Drag a file anywhere in this box</span>
              </div>
              {dragActive && (
                <div className="drop-overlay">
                  <Upload size={24} />
                  <span>Drop transcript to load</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.vtt,.srt,text/plain"
                onChange={handleFileChange}
                hidden
              />
            </div>

            {error && (
              <div className="error-note" role="alert">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  aria-label="Dismiss error"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <div className="input-footer">
              <div className="engine-note">
                <span className={`status-dot ${aiReady ? "online" : ""}`} />
                <span>
                  {aiReady
                    ? `AI verified · ${aiModel ?? "DeepSeek"}`
                    : "Local preview · add API key for AI"}
                </span>
              </div>
              <button
                type="submit"
                className="extract-button"
                disabled={!canExtract}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={17} className="spin" />
                    Extracting…
                  </>
                ) : (
                  <>
                    Extract meeting
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="output-pane" ref={outputRef}>
            {isLoading ? (
              <LoadingState step={LOADING_STEPS[loadingStep]} />
            ) : result ? (
              <AnalysisView
                key={extractionKey}
                data={result}
                completed={completed}
                onToggle={toggleAction}
                copied={copied}
                stale={stale}
                onCopyJson={copyJson}
                onDownload={downloadJson}
              />
            ) : (
              <EmptyOutput />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function EmptyOutput() {
  return (
    <div className="output-empty">
      <div className="empty-graphic" aria-hidden="true">
        <span className="orbit orbit-one" />
        <span className="orbit orbit-two" />
        <div className="empty-sheet sheet-back">
          <span />
          <span />
        </div>
        <div className="empty-sheet sheet-middle">
          <span />
          <span />
          <span />
        </div>
        <div className="empty-sheet sheet-front">
          <div className="empty-sheet-top">
            <span className="empty-sheet-icon">
              <Sparkles size={12} />
            </span>
            <span>Meeting brief</span>
            <span className="empty-ready">ready</span>
          </div>
          <strong>Atlas launch readiness</strong>
          <div className="empty-lines">
            <span />
            <span />
            <span className="short" />
          </div>
          <div className="empty-mini-row">
            <span className="empty-check">
              <Check size={9} />
            </span>
            <span>Launch gated on load testing</span>
          </div>
          <div className="empty-mini-row">
            <span className="empty-avatar" />
            <span>Priya · Send pricing model</span>
            <span className="empty-due">Tomorrow</span>
          </div>
        </div>
        <span className="floating-chip chip-json">{"{ }"} JSON</span>
        <span className="floating-chip chip-schema">
          <ShieldCheck size={11} /> Valid
        </span>
      </div>

      <div className="output-empty-copy">
        <span className="output-kicker">02 / Structured output</span>
        <h3>Your meeting, distilled.</h3>
        <p>
          One run turns the noise into a shareable brief and strict,
          schema-validated JSON. No note-taking required.
        </p>
        <ul className="empty-feature-list">
          <li>
            <Sparkles size={13} /> Executive summary
          </li>
          <li>
            <Check size={13} /> Key decisions
          </li>
          <li>
            <Users size={13} /> Assigned owners
          </li>
          <li>
            <Code2 size={13} /> Type-safe JSON
          </li>
        </ul>
      </div>
    </div>
  );
}

function LoadingState({ step }: { step: string }) {
  return (
    <div className="analysis-loading">
      <div className="scan-stage" aria-hidden="true">
        <span className="scan-ring ring-one" />
        <span className="scan-ring ring-two" />
        <span className="scan-core">
          <Sparkles size={22} />
        </span>
        <span className="scan-beam" />
      </div>
      <span className="output-kicker">Extracting signal</span>
      <h3>{step}</h3>
      <p>Mapping the conversation into summary, decisions, and commitments.</p>
      <div className="loading-track">
        <span />
      </div>
      <div className="loading-skeleton" aria-hidden="true">
        <div>
          <span className="skeleton-line wide" />
          <span className="skeleton-line" />
          <span className="skeleton-line short" />
        </div>
        <div className="skeleton-cards">
          <span />
          <span />
          <span />
        </div>
      </div>
      <span className="loading-schema">
        <ShieldCheck size={13} /> Output must pass schema validation
      </span>
    </div>
  );
}
