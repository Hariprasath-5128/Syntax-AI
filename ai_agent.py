import os
from dotenv import load_dotenv

from phi.agent import Agent
from phi.model.mistral import MistralChat

# Load environment variables
load_dotenv()
mistral_api_key = os.getenv("MISTRAL_API_KEY")

# Shared model config (Codestral for coding)
def mistral_model():
    return MistralChat(
        id="codestral-latest",  # coding-optimized, free-tier friendly
        api_key=mistral_api_key,
    )

codeGenerator = Agent(
    model=mistral_model(),
    save_response_to_file="output.txt",
    show_tool_calls=True,
    markdown=True,
    instructions=[
        "For a given programming problem and selected language, generate the relevant code without any comments or explanations.",
        "Ensure the code is efficient and syntactically correct for the chosen language.",
    ],
    add_datetime_to_instructions=True,
)

codeModerniser = Agent(
    model=mistral_model(),
    save_response_to_file="output.txt",
    show_tool_calls=True,
    markdown=True,
    instructions=[
        "For a given programming problem and selected language, modernize the provided code to improve readability, efficiency, and follow modern best practices.",
        "Ensure the modernized code is syntactically correct and retains the same functionality.",
        "Just give the code without any explanation and after code is given then give explanation",
        "The comments in the code should be at max a single line comment",
    ],
    add_datetime_to_instructions=True,
)

refactor = Agent(
    model=mistral_model(),
    save_response_to_file="output.txt",
    show_tool_calls=True,
    markdown=True,
    instructions=[
        "For a given programming problem and selected language, refactor the provided code to improve readability, modularity, and maintainability.",
        "Ensure the refactored code is syntactically correct and retains the same functionality.",
        "Just give the code without any explanation and after code is given then give explanation",
        "The comments in the code should be at max a single line comment",
        "Just give single code not multiple codes",
        "Give explanation at last",
    ],
    add_datetime_to_instructions=True,
)

errorDetection = Agent(
    model=mistral_model(),
    save_response_to_file="output.txt",
    show_tool_calls=True,
    markdown=True,
    instructions=[
        "Analyze provided code for syntax, logic, and runtime errors.",
        "Provide detailed explanations of the detected errors.",
        "Suggest corrected versions of the code while preserving its original intent.",
        "Just give the code without any explanation and after code is given then give explanation",
        "The comments in the code should be at max a single line comment",
    ],
    add_datetime_to_instructions=True,
)

def handle_task(prompt: str):
    prompt_lower = prompt.lower()

    if "generate" in prompt_lower:
        return codeGenerator.run(prompt)

    elif "refactor" in prompt_lower:
        return refactor.run(prompt)

    elif "modernize" in prompt_lower or "modernise" in prompt_lower or "optimize" in prompt_lower:
        return codeModerniser.run(prompt)

    elif "error" in prompt_lower or "fix" in prompt_lower:
        return errorDetection.run(prompt)

    else:
        return codeModerniser.run(prompt)