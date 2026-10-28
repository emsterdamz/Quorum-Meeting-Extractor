export type SampleTranscript = {
  id: string;
  label: string;
  title: string;
  transcript: string;
};

export const SAMPLE_TRANSCRIPTS: SampleTranscript[] = [
  {
    id: "launch",
    label: "Launch sync",
    title: "Atlas launch readiness",
    transcript: `[09:02] Maya: Alright, let's get started. We're three weeks out from the Atlas launch and I want to make sure we're not glossing over the open questions.
[09:03] Jordan: Quick update on the deck. The narrative is basically done, but the pricing slide is still using the old tiers.
[09:04] Maya: Okay. Priya, can you send Jordan the final pricing model by tomorrow so we can lock that slide?
[09:04] Priya: Yep. I'll send the updated model over by end of day tomorrow.
[09:05] Sam: We also still don't have the load test results from staging. Last run had some timeouts.
[09:06] Jordan: Do we need those before launch? I thought we agreed last week that the load test was a nice-to-have.
[09:07] Maya: No, we decided that the launch is gated on load testing. If it can't handle 5k concurrent users, we don't ship.
[09:08] Sam: Understood. I'll rerun the load test on Thursday and share the results.
[09:10] Priya: On the customer comms side, the email is drafted but legal hasn't reviewed it.
[09:11] Maya: Let's go with the shorter version of the email. It's clearer and legal already saw that structure in August.
[09:12] Jordan: Agreed. I'll update the email to the short version and send it to legal for a quick pass.
[09:13] Maya: What about the webinar? Are we still doing that on the 30th?
[09:14] Sam: We are, but the landing page is still missing the speaker bios.
[09:15] Maya: Priya, can you chase those down?
[09:15] Priya: Sure, I'll ping the speakers today.
[09:18] Maya: Okay, final thing. We need someone to own the launch-day war room. I can do it, but I'm also presenting at the customer event.
[09:19] Jordan: I'll own the war room. I can set up the runbook by next Wednesday.
[09:20] Maya: Perfect. So to recap: the launch is gated on load testing, we're using the short email, and Jordan owns the war room. Anything else?
[09:21] Sam: That's it from me.
[09:21] Maya: Great. Let's regroup Friday.`,
  },
  {
    id: "incident",
    label: "Incident review",
    title: "Checkout outage retrospective",
    transcript: `Sam: Okay, incident review for yesterday's checkout outage. We've got 42 minutes, so let's keep it focused.
Priya: Timeline is that the payment worker started failing at 14:08 after the 14:02 deploy. Error rate hit 18% before we rolled back at 14:26.
Jordan: Root cause is the new retry middleware retrying non-idempotent charges. That one was my change.
Sam: What do we need to prevent a repeat?
Maya: We agreed after the last incident that all payment changes need a canary. That clearly didn't happen.
Sam: Right. It slipped because the deploy checklist still has the old rollout steps.
Maya: Let's make it a hard rule: no payment service deploy goes to 100% without a 30-minute canary.
Priya: Agreed.
Sam: Works for me.
Maya: Priya, I'll add the canary gate to the deploy checklist by Monday.
Jordan: I'll revert the retry middleware and add an idempotency test.
Maya: I'll draft the customer-facing incident summary and share it with support tomorrow.
Sam: Do we need a postmortem meeting?
Maya: No, let's keep it async. Jordan, can you write the technical postmortem by Thursday?
Jordan: Yes.
Sam: Great. Priya, please schedule the canary review with platform next week.
Priya: On it.
Sam: Thanks everyone. I'll post the action items in the incident channel.`,
  },
  {
    id: "onboarding",
    label: "Client kickoff",
    title: "Northstar onboarding kickoff",
    transcript: `Participants: Priya, Maya, Lena, Marcus
Priya: Thanks for making time. This is the Northstar onboarding kickoff. We want to leave with a migration plan and clear owners.
Lena: Our biggest priority is moving 12,000 customer records before the renewal on November 15. We cannot afford a bad cutover.
Maya: I've looked at the data and there are a lot of duplicate accounts. I'd recommend a two-wave migration.
Marcus: Two waves makes sense to us. We can start with the top 3,000 accounts and learn before the full move.
Priya: So we're aligned on a two-wave migration. Can we target the first wave for the week of November 2?
Lena: That works if we have a validation report before go-live.
Maya: I'll build the field mapping this week and share it for review by Friday.
Marcus: I'll export the first 3,000 accounts from our current system by next Tuesday.
Priya: Perfect. I'll send the full migration timeline to everyone by end of day today.
Lena: One more thing. Can someone own the weekly status update?
Maya: I can own that. I'll send a short status note every Thursday.
Priya: Great. And let's agree that any record-level issues get raised in the shared Slack channel, not over email.
Lena: Agreed.
Marcus: Works for us.
Priya: Perfect. I'll set up that channel before our next call.`,
  },
];
