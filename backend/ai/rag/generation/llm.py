import ollama

from .prompt import SYSTEM_PROMPT


class LLM:

    def __init__(self):
        self.model = "llama3.1:8b"

        print(
            f"Using Ollama model: {self.model}"
        )

    def generate(self, prompt):

        print("\nGenerating AI response...")

        try:
            response = ollama.chat(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": SYSTEM_PROMPT
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                think=False,
                options={
                    "temperature": 0,
                    "num_predict": 1200,
                    "top_p": 0.8
                }
            )

            answer = response["message"]["content"]

            if not answer or not answer.strip():
                return "Insufficient evidence found."

            return self.clean_response(answer)

        except Exception as e:

            print(
                f"\nLLM generation error: {e}"
            )

            return (
                "Unable to generate AI summary. "
                "Structured evidence is available."
            )

    def clean_response(self, answer):

        answer = answer.strip()

        # ----------------------------------------------------
        # REMOVE QWEN THINKING / META TEXT
        # ----------------------------------------------------

        unwanted_phrases = [
            "We are given",
            "The user question",
            "We need to",
            "We must",
            "Let's structure",
            "From the evidence",
            "Based on the evidence",
            "According to the evidence",
            "The evidence shows",
            "I need to",
            "I should",
            "Therefore"
        ]

        lines = answer.splitlines()

        cleaned_lines = []

        for line in lines:

            stripped = line.strip()

            if not stripped:
                continue

            skip_line = False

            for phrase in unwanted_phrases:

                if stripped.lower().startswith(
                    phrase.lower()
                ):
                    skip_line = True
                    break

            if not skip_line:
                cleaned_lines.append(
                    stripped
                )

        answer = "\n".join(cleaned_lines)

        # ----------------------------------------------------
        # REMOVE MARKDOWN CODE FENCES
        # ----------------------------------------------------

        answer = answer.replace(
            "```text",
            ""
        )

        answer = answer.replace(
            "```",
            ""
        )

        # ----------------------------------------------------
        # REMOVE LEADING / TRAILING QUOTES
        # ----------------------------------------------------

        answer = answer.strip("\"' ")

        return answer.strip()