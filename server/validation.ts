import { z } from "zod";

// 1. Auth Schemas
export const RegisterSchema = z.object({
  email: z.string().email({ message: "Invalid email address format" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
  role: z.enum(["Chairman", "Admin", "Partner", "Viewer"]),
});

export const LoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address format" }),
  password: z.string().min(1, { message: "Password is required" }),
});

// 2. Weekly Board Win/Fail items Schemas
export const WeeklyBoardItemSchema = z.object({
  category: z.enum(["win", "fail", "risk", "team"]),
  title: z.string().min(2, { message: "Title must be at least 2 characters long" }),
  description: z.string().min(2, { message: "Description must be at least 2 characters long" }),
});

// 3. Action Plan Items Schemas
export const ActionPlanItemSchema = z.object({
  day: z.string().optional().default("Monday"),
  title: z.string().min(2, { message: "Action title is required" }),
  description: z.string().optional().default(""),
});

// 4. Emergency Mode Trigger Schema
export const EmergencyModeSchema = z.object({
  isActivated: z.boolean().optional(),
  reason: z.string().optional(),
  runwayMonths: z.number().optional(),
  revenueGapPct: z.number().optional(),
});

// 5. Accountability Commitments Schema
export const AccountabilityCommitmentSchema = z.object({
  title: z.string().min(2, { message: "Commitment title is required" }),
  status: z.enum(["overdue", "due-soon", "completed"]),
  committedDate: z.string().optional(),
  dueDate: z.string().optional(),
  impact: z.string().optional(),
});

// 6. Decision Log Schema
export const DecisionLogSchema = z.object({
  title: z.string().min(2, { message: "Decision title is required" }),
  context: z.string().optional(),
  outcome: z.string().min(2, { message: "Outcome decision description is required" }),
  status: z.enum(["successful", "in-progress", "pending"]).optional().default("successful"),
});

// 7. Onboard Investors Schema
export const InvestorSchema = z.object({
  name: z.string().min(2, { message: "Investor name is required" }),
  email: z.string().email({ message: "Invalid email address format" }).optional().or(z.literal("")),
  contact: z.string().optional(),
  ticketSizeRs: z.union([z.number(), z.string()]).transform((val) => Number(val)),
  stage: z.enum(["cold", "warm", "due-diligence", "committed"]).optional().default("warm"),
  spvAllocated: z.string().optional(),
  notes: z.string().optional(),
});

// 8. Brand Management Adjustments Schema
export const BrandSchema = z.object({
  name: z.string().min(2, { message: "Brand name is required" }),
  type: z.string().optional().default("QSR"),
  outletsCountTarget: z.number().optional(),
  outletsCountActual: z.number().optional(),
  appUsersTarget: z.number().optional(),
  appUsersActual: z.number().optional(),
  commissionPct: z.number().optional(),
  mrrActual: z.number().optional(),
});

// 9. Readiness Scanner Schema
export const ReadinessScanSchema = z.object({
  cityName: z.string().min(1, { message: "City name parameter is required" }),
  tier: z.number().optional(),
  focoModelStable: z.boolean().optional(),
  npsScore: z.number().optional(),
});

// 10. Knowledge Documents Schema
export const KnowledgeDocSchema = z.object({
  title: z.string().min(2, { message: "Document title is required" }),
  category: z.string().optional().default("SOP"),
  summary: z.string().optional(),
  content: z.string().min(2, { message: "Content details are required" }),
});

// 11. War Room Session Update Schema
export const WarRoomSessionSchema = z.object({
  title: z.string().optional(),
  battlePlan: z.array(z.string()).optional(),
  adversaries: z.array(z.string()).optional(),
  allies: z.array(z.string()).optional(),
});

// 12. Chat Prompt Schema
export const ChatSchema = z.object({
  prompt: z.string().min(1, { message: "Chat query cannot be empty" }),
});
