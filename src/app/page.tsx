import { Suspense } from "react";
import { connection } from "next/server";
import {
  ArrowRight,
  ArrowUpRight,
  Braces,
  Check,
  FileText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { MeetingWorkbench } from "@/components/meeting-workbench";
import { getAiStatus } from "@/lib/deepseek-extractor";
import { todayIso } from "@/lib/dates";

export default function Home() {
  const ai = getAiStatus();

  return (
    <main>
      <header className="site-header">
        <a className="brand-link" href="#top" aria-label="Quorum home">
          <Brand />
        </a>

        <nav className="site-nav" aria-label="Primary navigation">
          <a href="#workspace">Workspace</a>
          <a href="#how-it-works">How it works</a>
          <a href="#schema">JSON schema</a>
        </nav>

        <div className="header-actions">
          <span className="header-engine">
            <span className={`status-dot ${ai.configured ? "online" : ""}`} />
            {ai.configured ? "AI extraction ready" : "Local preview ready"}
          </span>
          <a className="header-cta" href="#workspace">
            Open workspace <ArrowUpRight size={14} />
          </a>
        </div>
      </header>

      <div id="top" className="page-shell">
        <section className="hero">
          <div className="hero-copy">
            <div className="hero-eyebrow">
              <span className="eyebrow-mark">
                <Sparkles size={13} />
              </span>
              <span>Meeting intelligence, minus the busywork</span>
            </div>

            <h1>
              Turn talk into
              <br />
              <span className="serif-italic">clean next steps.</span>
            </h1>

            <p className="hero-subcopy">
              Quorum reads raw, messy meeting transcripts and returns a
              board-ready brief: a sharp summary, the decisions that actually
              landed, and every action item with an owner and a date — plus
              type-safe JSON.
            </p>

            <div className="hero-actions">
              <a className="primary-cta" href="#workspace">
                Extract a meeting <ArrowRight size={16} />
              </a>
              <a className="secondary-cta" href="#schema">
                <Braces size={15} /> See the schema
              </a>
            </div>

            <div className="hero-trust">
              <span>
                <Check size={12} /> No account
              </span>
              <span>
                <Check size={12} /> Transcripts not stored
              </span>
              <span>
                <Check size={12} /> Schema-validated JSON
              </span>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="visual-glow" />
            <div className="hero-paper paper-back">
              <span className="paper-tag">RAW INPUT</span>
              <div className="paper-line" />
              <div className="paper-line mid" />
              <div className="paper-line short" />
            </div>

            <div className="hero-paper paper-front">
              <div className="paper-topline">
                <span className="paper-brand">
                  <span className="paper-mark" />
                  quorum output
                </span>
                <span className="paper-valid">
                  <ShieldCheck size={11} /> valid
                </span>
              </div>
              <span className="paper-kicker">Structured meeting brief</span>
              <strong>Atlas launch readiness</strong>
              <div className="paper-meta-row">
                <span>4 participants</span>
                <span>·</span>
                <span>2 decisions</span>
                <span>·</span>
                <span>5 actions</span>
              </div>
              <div className="paper-divider" />
              <span className="paper-section-label">KEY DECISION</span>
              <div className="paper-decision">
                <span className="paper-num">01</span>
                <p>Launch is gated on load testing at 5k concurrent users.</p>
              </div>
              <span className="paper-section-label">ACTION ITEM</span>
              <div className="paper-action">
                <span className="paper-check">
                  <Check size={10} />
                </span>
                <div>
                  <p>Send the final pricing model</p>
                  <span>Priya · due tomorrow</span>
                </div>
                <span className="paper-priority">High</span>
              </div>
              <div className="paper-action">
                <span className="paper-check">
                  <Check size={10} />
                </span>
                <div>
                  <p>Rerun the load test</p>
                  <span>Sam · due Thursday</span>
                </div>
                <span className="paper-priority paper-priority-medium">Med</span>
              </div>
              <div className="paper-codebar">
                <span>{"{ }"}</span>
                <span>meeting_analysis.json</span>
                <span className="paper-cursor" />
              </div>
            </div>

            <span className="hero-float float-json">{"{ }"} type-safe</span>
            <span className="hero-float float-time">42 min saved</span>
          </div>
        </section>

        <div className="signal-strip" aria-label="What Quorum extracts">
          <span className="signal-label">FROM SIGNAL TO STRUCTURE</span>
          <span>Summary</span>
          <span className="signal-dot" />
          <span>Key decisions</span>
          <span className="signal-dot" />
          <span>Owners</span>
          <span className="signal-dot" />
          <span>Due dates</span>
          <span className="signal-dot" />
          <span>Type-safe JSON</span>
        </div>

        <Suspense fallback={<WorkbenchFallback />}>
          <WorkbenchLoader />
        </Suspense>

        <section className="how-section" id="how-it-works">
          <div className="how-heading">
            <div className="section-kicker">
              <span>02</span>
              <span>Under the hood</span>
            </div>
            <div className="how-title-row">
              <h2>
                From crosstalk to
                <br />
                <span className="serif-italic">a clean handoff.</span>
              </h2>
              <p>
                The model handles interpretation. The schema handles trust.
                Every response is checked before it reaches your screen.
              </p>
            </div>
          </div>

          <div className="how-grid">
            <article className="how-card">
              <span className="how-number">01</span>
              <span className="how-icon">
                <FileText size={20} />
              </span>
              <h3>Bring the raw version</h3>
              <p>
                Speaker labels, timestamps, false starts, side conversations.
                Paste it or drop a file — Quorum can handle the mess.
              </p>
              <span className="how-foot">TXT · MD · VTT · SRT</span>
            </article>

            <article className="how-card">
              <span className="how-number">02</span>
              <span className="how-icon">
                <Sparkles size={20} />
              </span>
              <h3>Extract what matters</h3>
              <p>
                A language model separates settled decisions from open ideas,
                resolves relative dates, and attributes work only when the
                transcript does.
              </p>
              <span className="how-foot">DEEPSEEK JSON MODE</span>
            </article>

            <article className="how-card">
              <span className="how-number">03</span>
              <span className="how-icon">
                <ShieldCheck size={20} />
              </span>
              <h3>Ship a trusted version</h3>
              <p>
                Zod validates the payload before it is returned. Copy the brief,
                tick off owners, or download JSON that your tools can consume.
              </p>
              <span className="how-foot">ZOD + TYPESCRIPT</span>
            </article>
          </div>
        </section>

        <section className="schema-section" id="schema">
          <div className="schema-copy">
            <div className="section-kicker light">
              <span>03</span>
              <span>The contract</span>
            </div>
            <h2>
              Type-safe by
              <br />
              <span className="serif-italic">construction.</span>
            </h2>
            <p>
              The output is not a hopeful text blob. It is a typed contract with
              predictable fields, enums, and nullability — ready for your CRM,
              project tracker, or agent workflow.
            </p>

            <ul className="schema-list">
              <li>
                <Check size={14} />
                Runtime validation with Zod
              </li>
              <li>
                <Check size={14} />
                TypeScript types inferred from the schema
              </li>
              <li>
                <Check size={14} />
                DeepSeek JSON mode + runtime validation
              </li>
            </ul>

            <a className="schema-cta" href="#workspace">
              Run your first extraction <ArrowRight size={15} />
            </a>
          </div>

          <div className="schema-code-card">
            <div className="schema-code-top">
              <span className="schema-file">
                <Braces size={14} /> meeting_analysis.json
              </span>
              <span className="schema-version">v1.0</span>
            </div>
            <pre className="schema-code">
              <code>
                <span className="code-line">
                  <span className="line-number">1</span>
                  <span>{"{"}</span>
                </span>
                <span className="code-line">
                  <span className="line-number">2</span>
                  <span>
                    {"  "}
                    <span className="code-key">&quot;summary&quot;</span>
                    {": "}
                    <span className="code-string">
                      &quot;The team aligned on a gated launch...&quot;
                    </span>
                    {","}
                  </span>
                </span>
                <span className="code-line">
                  <span className="line-number">3</span>
                  <span>
                    {"  "}
                    <span className="code-key">&quot;keyDecisions&quot;</span>
                    {": ["}
                  </span>
                </span>
                <span className="code-line">
                  <span className="line-number">4</span>
                  <span>
                    {"    { "}
                    <span className="code-key">&quot;decision&quot;</span>
                    {": "}
                    <span className="code-string">
                      &quot;Launch is gated on load testing&quot;
                    </span>
                    {" }"}
                  </span>
                </span>
                <span className="code-line">
                  <span className="line-number">5</span>
                  <span>{"  ],"}</span>
                </span>
                <span className="code-line">
                  <span className="line-number">6</span>
                  <span>
                    {"  "}
                    <span className="code-key">&quot;actionItems&quot;</span>
                    {": ["}
                  </span>
                </span>
                <span className="code-line">
                  <span className="line-number">7</span>
                  <span>{"    {"}</span>
                </span>
                <span className="code-line">
                  <span className="line-number">8</span>
                  <span>
                    {"      "}
                    <span className="code-key">&quot;task&quot;</span>
                    {": "}
                    <span className="code-string">
                      &quot;Send the final pricing model&quot;
                    </span>
                    {","}
                  </span>
                </span>
                <span className="code-line">
                  <span className="line-number">9</span>
                  <span>
                    {"      "}
                    <span className="code-key">&quot;owner&quot;</span>
                    {": "}
                    <span className="code-string">&quot;Priya&quot;</span>
                    {","}
                  </span>
                </span>
                <span className="code-line">
                  <span className="line-number">10</span>
                  <span>
                    {"      "}
                    <span className="code-key">&quot;dueDate&quot;</span>
                    {": "}
                    <span className="code-string">
                      &quot;2026-10-29&quot;
                    </span>
                    {","}
                  </span>
                </span>
                <span className="code-line">
                  <span className="line-number">11</span>
                  <span>
                    {"      "}
                    <span className="code-key">&quot;priority&quot;</span>
                    {": "}
                    <span className="code-string">&quot;high&quot;</span>
                  </span>
                </span>
                <span className="code-line">
                  <span className="line-number">12</span>
                  <span>{"    }"}</span>
                </span>
                <span className="code-line">
                  <span className="line-number">13</span>
                  <span>{"  ]"}</span>
                </span>
                <span className="code-line">
                  <span className="line-number">14</span>
                  <span>{"}"}</span>
                </span>
              </code>
            </pre>
            <div className="schema-code-foot">
              <span>
                <span className="code-valid-dot" /> Passed validation
              </span>
              <span>type MeetingAnalysis</span>
            </div>
          </div>
        </section>

        <footer className="site-footer">
          <div className="footer-brand">
            <Brand />
            <span>Meeting intelligence for teams that move.</span>
          </div>
          <div className="footer-meta">
            <span>Schema v1.0</span>
            <span className="footer-dot" />
            <span>Built with Next.js + DeepSeek + Zod</span>
          </div>
        </footer>
      </div>
    </main>
  );
}


async function WorkbenchLoader() {
  await connection();
  const ai = getAiStatus();

  return (
    <MeetingWorkbench
      aiReady={ai.configured}
      aiModel={ai.model}
      defaultDate={todayIso()}
    />
  );
}

function WorkbenchFallback() {
  return (
    <section className="workspace-section" id="workspace" aria-busy="true">
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
          </div>
          <div className="window-status">Loading workspace</div>
        </div>
        <div className="workspace-fallback">
          <div className="fallback-pane">
            <span className="fallback-line wide" />
            <span className="fallback-line" />
            <span className="fallback-line short" />
            <span className="fallback-block" />
          </div>
          <div className="fallback-pane dark">
            <span className="fallback-line wide" />
            <span className="fallback-line" />
            <span className="fallback-block" />
          </div>
        </div>
      </div>
    </section>
  );
}
