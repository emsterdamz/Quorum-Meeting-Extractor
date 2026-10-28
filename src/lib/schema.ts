import { z } from "zod";

export const actionPrioritySchema = z.enum(["high", "medium", "low"]);

export const decisionSchema = z.object({
  id: z.string().min(1),
  decision: z.string().min(1),
  madeBy: z.array(z.string()),
  sourceQuote: z.string(),
});

export const actionItemSchema = z.object({
  id: z.string().min(1),
  task: z.string().min(1),
  owner: z.string().min(1),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  priority: actionPrioritySchema,
  sourceQuote: z.string(),
});

export const meetingAnalysisSchema = z.object({
  meeting: z.object({
    title: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    durationMinutes: z.number().int().positive().nullable(),
    participants: z.array(z.string()),
  }),
  summary: z.string().min(1),
  keyDecisions: z.array(decisionSchema),
  actionItems: z.array(actionItemSchema),
});

export const extractRequestSchema = z.object({
  transcript: z
    .string()
    .trim()
    .min(40, "Add at least a few lines of transcript.")
    .max(60_000, "Keep transcripts under 60,000 characters."),
  title: z.string().trim().max(160).optional(),
  meetingDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid YYYY-MM-DD date.")
    .optional(),
});

export type MeetingAnalysis = z.infer<typeof meetingAnalysisSchema>;
export type Decision = z.infer<typeof decisionSchema>;
export type ActionItem = z.infer<typeof actionItemSchema>;
export type ExtractRequest = z.infer<typeof extractRequestSchema>;

export type ExtractResponse = {
  analysis: MeetingAnalysis;
  engine: "deepseek" | "local";
  model: string | null;
  warnings: string[];
};
