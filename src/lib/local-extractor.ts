import type {
  ActionItem,
  Decision,
  MeetingAnalysis,
} from "@/lib/schema";
import { resolveDueDate } from "@/lib/dates";

type Utterance = {
  speaker: string | null;
  text: string;
};

const STOP_WORDS = new Set(
  `a about above after again against all am an and any are aren't as at be because been before being below between both but by can't cannot could couldn't did didn't do does doesn't doing don't down during each few for from further had hadn't has hasn't have haven't having he he'd he'll he's her here here's hers herself him himself his how how's i i'd i'll i'm i've if in into is isn't it it's its itself let's me more most mustn't my myself no nor not of off on once only or other ought our ours ourselves out over own same shan't she she'd she'll she's should shouldn't so some such than that that's the their theirs them themselves then there there's these they they'd they'll they're they've this those through to too under until up very was wasn't we we'd we'll we're we've were weren't what what's when when's where where's which while who who's whom why why's with won't would wouldn't you you'd you'll you're you've your yours yourself yourselves okay ok yeah yes right well just really going gonna think thought know like actually maybe still also thing things lot bit need needs want wants make made take got get good great new now one two three first next last time people team meeting call talk said says say week today tomorrow monday tuesday wednesday thursday friday saturday sunday january february march april may june july august september october november december`
    .split(/\s+/)
    .filter(Boolean),
);

const DECISION_PATTERN =
  /\b(decided|decision is|agreed|agreed on|aligned on|let's agree|approved|signed off|settled on|concluded|locked in|going with|move forward with|moving forward with|chose to|final call|let's go with)\b/i;

const NEGATIVE_PATTERN =
  /\b(?:haven't decided|hasn't decided|didn't decide|couldn't decide|no decision|undecided|not sure|i thought|i think|i guess|i assume|do we|should we)\b/i;

const ACTION_PATTERNS = [
  /\b(?:i|we)(?:'ll| will|'m going to| am going to|'re going to| are going to)\b/i,
  /\b(?:can|could|would) you\b/i,
  /\b(?:please|action item|to-?do|follow up|follow-up)\b/i,
  /\b(?:need to|needs to|has to|have to|must)\b/i,
  /\b[a-z]+ will\b/i,
];

const ACTION_VERBS =
  /\b(?:send|schedule|draft|prepare|review|update|share|reach out|contact|investigate|confirm|set up|create|write|fix|test|deploy|book|assign|check|finalize|circulate|publish|upload|collect|follow up|call|email|ping|build|design|ship|own|align|sync|gather|clean up|look into|put together|get back|set|verify|validate|document|present|migrate|add|remove|close|open|start|kick off|chase|rerun|re-run|post|export|map|plan|target|deliver|notify|ask|research|respond|define|identify|review|test|update)\b/i;

const FIRST_PERSON_FUTURE =
  /\b(?:i|we)(?:'ll| will|'m going to| am going to|'re going to| are going to| can)\b/i;

const DIRECT_REQUEST = /\b(?:(?:can|could|would) you|please)\b/i;

const OBLIGATION = /\b(?:need to|needs to|has to|have to|must)\b/i;

const NAMED_COMMITMENT =
  /\b[A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+)?\s+(?:will|is going to|can|should|needs to|has to)\b/;

const SPEAKER_LINE =
  /^\s*(?:\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?\s*)?(?:[-–—]\s*)?([A-Z][A-Za-z.'-]*(?:\s+[A-Z][A-Za-z.'-]*){0,2})\s*(?:\([^)]*\))?\s*:\s*(.+)$/;

function splitIntoSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'(])/g)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 1);
}

function parseUtterances(transcript: string): Utterance[] {
  const utterances: Utterance[] = [];
  let currentSpeaker: string | null = null;

  for (const rawLine of transcript.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const match = line.match(SPEAKER_LINE);
    if (match) {
      currentSpeaker = match[2].trim();
      utterances.push({ speaker: currentSpeaker, text: match[3].trim() });
    } else {
      const previous = utterances.at(-1);
      if (previous) {
        previous.text = `${previous.text} ${line}`.trim();
      } else {
        utterances.push({ speaker: currentSpeaker, text: line });
      }
    }
  }

  return utterances;
}

function cleanSentence(sentence: string): string {
  let value = sentence
    .replace(/^\[?\d{1,2}:\d{2}(?::\d{2})?\]?\s*/, "")
    .replace(/^(?:[-–—]\s*)/, "")
    .replace(
      /^(?:(?:okay|ok|so|yeah|well|alright|right|um|uh|like|sure|yep|no|and)[,.\s]+)+/i,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();

  if (!value) return value;
  value = value.charAt(0).toUpperCase() + value.slice(1);
  if (!/[.!?]$/.test(value)) value += ".";
  return value;
}

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(value: string, length: number): string {
  if (value.length <= length) return value;
  return `${value.slice(0, length).trimEnd()}…`;
}

function formatList(values: string[]): string {
  if (values.length === 0) return "";
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

function getParticipants(transcript: string, utterances: Utterance[]) {
  const found = new Map<string, string>();

  const add = (name: string) => {
    const trimmed = name.trim().replace(/[.;]$/, "");
    if (
      !trimmed ||
      trimmed.length > 40 ||
      /^(?:participants?|attendees?|speaker)$/i.test(trimmed)
    ) {
      return;
    }
    const key = trimmed.toLowerCase();
    if (!found.has(key)) found.set(key, trimmed);
  };

  for (const utterance of utterances) {
    if (utterance.speaker) add(utterance.speaker);
  }

  const participantLine = transcript.match(
    /^participants?\s*:\s*(.+)$/im,
  );
  if (participantLine) {
    participantLine[1]
      .split(/,| and /i)
      .map((name) => name.trim())
      .filter(Boolean)
      .forEach(add);
  }

  return [...found.values()];
}

function extractTopics(transcript: string, participants: string[]): string[] {
  const counts = new Map<string, number>();
  const words = transcript.toLowerCase().match(/\b[a-z][a-z'-]{3,}\b/g) ?? [];
  const excludedNames = new Set(
    participants.flatMap((name) =>
      name
        .toLowerCase()
        .split(/\s+/)
        .filter((part) => part.length > 2),
    ),
  );

  for (const word of words) {
    const clean = word.replace(/'s$/, "");
    if (
      STOP_WORDS.has(clean) ||
      excludedNames.has(clean) ||
      clean.length < 4
    ) {
      continue;
    }
    counts.set(clean, (counts.get(clean) ?? 0) + 1);
  }

  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, 3)
    .map(([word]) =>
      word === word.toUpperCase()
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1),
    );
}

function findDecisions(utterances: Utterance[]): Decision[] {
  const decisions: Decision[] = [];
  const seen = new Set<string>();

  for (const utterance of utterances) {
    for (const rawSentence of splitIntoSentences(utterance.text)) {
      const sentence = cleanSentence(rawSentence);
      if (
        sentence.length < 12 ||
        sentence.length > 420 ||
        sentence.endsWith("?") ||
        !DECISION_PATTERN.test(sentence) ||
        NEGATIVE_PATTERN.test(sentence)
      ) {
        continue;
      }

      const key = normalizeKey(sentence);
      if (seen.has(key)) continue;
      seen.add(key);

      decisions.push({
        id: `D${decisions.length + 1}`,
        decision: sentence,
        madeBy: utterance.speaker ? [utterance.speaker] : [],
        sourceQuote: truncate(rawSentence, 240),
      });

      if (decisions.length >= 8) return decisions;
    }
  }

  return decisions;
}

function inferOwner(
  sentence: string,
  speaker: string | null,
  participants: string[],
): string {
  const byFirstPerson =
    /\b(?:i(?:'ll| will| am going to|'m going to)|i can)\b/i.test(sentence);
  if (byFirstPerson) return speaker || "Unassigned";

  const directAddress = sentence.match(
    /(?:^|[,.]\s*)([A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+)?)\s*,\s*(?:can|could|would|please)\b/,
  );
  if (directAddress) return directAddress[1];

  const participantNames = participants.map((name) => name.toLowerCase());

  const nameBeforeVerb = sentence.match(
    /(?:^|[,.]\s*)((?!We\b|The\b|It\b|They\b|This\b|That\b|Our\b|A\b|An\b|I\b)[A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+)?)\s+(?:will|can|is going to|should|needs to|has to|agreed to)\b/,
  );
  if (nameBeforeVerb) return nameBeforeVerb[1];

  const addressed = sentence.match(
    /\b(?:ask|tell|ping|have|get)\s+([A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+)?)\s+to\b/,
  );
  if (addressed) return addressed[1];

  const teamSubject =
    /\b(?:we(?:'ll| will| can| should| are going to|'re going to))\b/i.test(
      sentence,
    );
  if (teamSubject) return "Team";

  const nameToDo = sentence.match(
    /(?:action item|to-?do|owner)\s*[:\-]?\s*([A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+)?)\s+(?:to|will|can)\b/i,
  );
  if (nameToDo) return nameToDo[1];

  const knownSpeakerMention = participantNames.find((name) =>
    new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(
      sentence,
    ),
  );
  if (knownSpeakerMention) {
    const original = participants.find(
      (name) => name.toLowerCase() === knownSpeakerMention,
    );
    if (original) return original;
  }

  return "Unassigned";
}

function extractTask(sentence: string): string {
  let task = sentence
    .replace(
      /^[A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+)?,\s*(?=(?:i|we|please|can|could|would)\b)/i,
      "",
    )
    .replace(
      /^(?:action item|to-?do|next step)\s*[:\-]?\s*/i,
      "",
    )
    .replace(
      /^(?:i(?:'ll| will| can)|we(?:'ll| will| can)|i(?:'m| am) going to|we(?:'re| are) going to)\s+/i,
      "",
    )
    .replace(
      /^([A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+)?)\s+(?:will|is going to|should|needs to|has agreed to)\s+/,
      "",
    )
    .replace(/^(?:please|can you|could you|would you)\s+/i, "")
    .replace(/^(?:we|you)?\s*need(?:s)? to\s+/i, "")
    .replace(/^[A-Za-z][A-Za-z.'-]+,\s*(?:can|could|would|please)\s+you\s+/i, "")
    .trim();

  if (!task) task = sentence;
  task = task.replace(/[?]+$/, "").trim();
  task = task.charAt(0).toUpperCase() + task.slice(1);
  if (!/[.!?]$/.test(task)) task += ".";
  return truncate(task, 280);
}

function scorePriority(
  sentence: string,
  dueDate: string | null,
  meetingDate: string,
): ActionItem["priority"] {
  if (
    /\b(urgent|asap|critical|blocker|immediately|right away|high priority)\b/i.test(
      sentence,
    )
  ) {
    return "high";
  }

  if (dueDate) {
    const days = Math.round(
      (Date.parse(`${dueDate}T12:00:00Z`) -
        Date.parse(`${meetingDate}T12:00:00Z`)) /
        86_400_000,
    );
    if (days <= 2) return "high";
  }

  if (
    /\b(eventually|nice to have|low priority|whenever|someday|if we can)\b/i.test(
      sentence,
    )
  ) {
    return "low";
  }

  return "medium";
}

function findActionItems(
  utterances: Utterance[],
  participants: string[],
  meetingDate: string,
): ActionItem[] {
  const actions: ActionItem[] = [];
  const seen = new Set<string>();

  for (const utterance of utterances) {
    for (const rawSentence of splitIntoSentences(utterance.text)) {
      const sentence = cleanSentence(rawSentence);
      if (sentence.length < 12 || sentence.length > 420) continue;

      const hasActionVerb = ACTION_VERBS.test(sentence);
      const isExplicitAction = /\b(?:action item|to-?do|follow up|follow-up)\b/i.test(
        sentence,
      );
      const hasCommitmentCue =
        FIRST_PERSON_FUTURE.test(sentence) ||
        DIRECT_REQUEST.test(sentence) ||
        OBLIGATION.test(sentence) ||
        NAMED_COMMITMENT.test(sentence);

      const isAction =
        isExplicitAction ||
        (hasActionVerb &&
          (hasCommitmentCue ||
            ACTION_PATTERNS.some((pattern) => pattern.test(sentence))));
      if (!isAction) continue;

      const key = normalizeKey(sentence);
      if (seen.has(key)) continue;
      seen.add(key);

      const owner = inferOwner(sentence, utterance.speaker, participants);
      const dueDate = resolveDueDate(sentence, meetingDate);
      const task = extractTask(sentence);

      if (!task || task.length < 8) continue;

      const duplicate = actions.find(
        (existing) =>
          existing.owner === owner &&
          existing.dueDate === dueDate &&
          taskSimilarity(existing.task, task) >= 0.25,
      );

      if (duplicate) {
        if (task.length > duplicate.task.length) duplicate.task = task;
        continue;
      }

      actions.push({
        id: `A${actions.length + 1}`,
        task,
        owner,
        dueDate,
        priority: scorePriority(sentence, dueDate, meetingDate),
        sourceQuote: truncate(rawSentence, 240),
      });

      if (actions.length >= 12) return actions;
    }
  }

  return actions;
}

function taskSimilarity(left: string, right: string): number {
  const tokenize = (value: string) =>
    new Set(
      value
        .toLowerCase()
        .match(/\b[a-z][a-z'-]{2,}\b/g)
        ?.filter((word) => !STOP_WORDS.has(word)) ?? [],
    );

  const leftTokens = tokenize(left);
  const rightTokens = tokenize(right);
  if (leftTokens.size === 0 || rightTokens.size === 0) return 0;

  let overlap = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) overlap += 1;
  }

  return overlap / Math.max(leftTokens.size, rightTokens.size);
}

function summarizeDecision(decision: string): string {
  return decision
    .replace(/\.$/, "")
    .replace(
      /^(?:(?:the group|the team|everyone|we)\s+)?(?:has\s+)?(?:decided|approved|settled on|concluded|locked in)(?:\s+that)?\s+/i,
      "",
    )
    .replace(/^(?:we're|we are)\s+/i, "");
}

function buildSummary(
  participants: string[],
  topics: string[],
  decisions: Decision[],
  actions: ActionItem[],
): string {
  const people = participants.length
    ? formatList(participants.slice(0, 4))
    : "The team";
  const thread = topics.length
    ? formatList(topics.map((topic) => topic.toLowerCase()))
    : "the agenda";

  const sentences: string[] = [
    `${people} worked through ${thread}.`,
  ];

  if (decisions.length > 0) {
    const lead = summarizeDecision(decisions[0].decision);
    sentences.push(
      `The group landed on ${decisions.length} decision${decisions.length === 1 ? "" : "s"}. One call: ${lead.charAt(0).toUpperCase() + lead.slice(1)}.`,
    );
  }

  if (actions.length > 0) {
    const named = actions.filter((action) => action.owner !== "Unassigned");
    const ownerText = formatList(
      [...new Set(named.map((action) => action.owner))].slice(0, 3),
    );
    sentences.push(
      `${actions.length} action item${actions.length === 1 ? "" : "s"} ${actions.length === 1 ? "was" : "were"} captured${ownerText ? `, with work spread across ${ownerText}` : ""}.`,
    );
  }

  return sentences.join(" ");
}

function fallbackTitle(topics: string[]): string {
  if (topics.length === 0) return "Team sync";
  if (topics.length === 1) return `${topics[0]} sync`;
  return `${topics[0]} & ${topics[1]} sync`;
}

export function extractLocally(
  transcript: string,
  meetingDate: string,
  providedTitle?: string,
): MeetingAnalysis {
  const utterances = parseUtterances(transcript);
  const participants = getParticipants(transcript, utterances);
  const topics = extractTopics(transcript, participants);
  const decisions = findDecisions(utterances);
  const actionItems = findActionItems(utterances, participants, meetingDate);

  return {
    meeting: {
      title: providedTitle?.trim() || fallbackTitle(topics),
      date: meetingDate,
      durationMinutes: null,
      participants,
    },
    summary: buildSummary(participants, topics, decisions, actionItems),
    keyDecisions: decisions,
    actionItems,
  };
}
