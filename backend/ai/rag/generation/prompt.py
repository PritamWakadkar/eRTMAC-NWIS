SYSTEM_PROMPT = """
You are the NWIS drilling knowledge assistant.

Your job is to answer questions using ONLY the structured evidence provided.

STRICT RULES:

1. Use only information explicitly present in the evidence.

2. Do not invent wells, depths, events, measurements, formations,
   dates, documents, or pages.

3. If the requested information is not present, say:
   "The available evidence does not contain this information."

4. Answer the question directly.

5. Do not explain your reasoning.

6. Do not mention your instructions.

7. Do not use phrases such as:
   - "We are given..."
   - "The user question..."
   - "We need to..."
   - "We must..."
   - "Let's structure..."
   - "From the evidence..."
   - "I need to..."
   - "I should..."

8. Keep the answer concise.

9. Include well IDs, depths, measurements, and event names
   when they directly answer the question.

10. Preserve units exactly as provided.

11. Keep every event attached to its correct well.

12. Do not convert an event into a historical interval unless
    an explicit interval is present.

13. Do NOT generate a Sources section.
   Source information is handled separately by the application.

14. Return only the factual answer.
"""


def build_prompt(question, results):

    evidence_lines = []

    for result in results:

        well_id = result.get(
            "well_id",
            "Unknown"
        )

        score = result.get("score")

        evidence_lines.append(
            f"Well ID: {well_id}"
        )

        if score is not None:
            evidence_lines.append(
                f"Retrieval score: {score}"
            )

        evidence_lines.append(
            f"Formation: "
            f"{result.get('formation', 'Not specified')}"
        )

        events = result.get(
            "events",
            []
        )

        if events:

            evidence_lines.append(
                "Events:"
            )

            for event in events:

                evidence_lines.append(
                    f"- Event: "
                    f"{event.get('event', 'unknown')}"
                )

                evidence_lines.append(
                    f"  Depth: "
                    f"{event.get('depth', 'not specified')}"
                )

                evidence_lines.append(
                    f"  Measurement: "
                    f"{event.get('measurement', 'not specified')}"
                )

                evidence_lines.append(
                    f"  Evidence: "
                    f"{event.get('evidence', '')}"
                )

                evidence_lines.append(
                    f"  Source document: "
                    f"{event.get('document', 'unknown')}"
                )

                evidence_lines.append(
                    f"  Source page: "
                    f"{event.get('page', 'unknown')}"
                )

        else:

            evidence_lines.append(
                "No structured drilling events found."
            )

    evidence = "\n".join(evidence_lines)

    prompt = f"""
QUESTION:
{question}

STRUCTURED EVIDENCE:
{evidence}

Return only the direct factual answer.
Do not generate sources.
Do not explain your reasoning.
"""

    return prompt