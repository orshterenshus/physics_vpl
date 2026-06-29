import { ISubmission } from "@/models/Submission";

// A teacher's override always wins over the LLM's original grade/feedback,
// but the original is never discarded — these just decide what to *display*.
export function effectiveGrade(s: Pick<ISubmission, "grade" | "overrideGrade">): number | null {
  return s.overrideGrade ?? s.grade;
}

export function effectiveFeedback(s: Pick<ISubmission, "feedback" | "overrideFeedback">): string {
  return s.overrideFeedback ?? s.feedback;
}
