import {
  DEFAULT_FEEDBACK_TICKET_FRAMEWORK,
  type ANetProvider,
  type FeedbackTicketFramework,
} from "@anet/shared";

export function inferFeedbackFrameworkFromAgentProvider(
  _provider: ANetProvider | null | undefined,
): FeedbackTicketFramework {
  return DEFAULT_FEEDBACK_TICKET_FRAMEWORK;
}
