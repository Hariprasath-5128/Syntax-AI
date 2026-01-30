from phi.agent import Agent
from phi.model.google import Gemini
from dotenv import load_dotenv
import os


# Load environment variables from .env file
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")


# Initialize the individual agents
codeGenerator = Agent(
    model=Gemini(id="gemini-2.5-flash-lite", api_key=api_key),
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
    model=Gemini(id="gemini-2.5-flash-lite", api_key=api_key),
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
    model=Gemini(id="gemini-2.5-flash-lite", api_key=api_key),
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
    model=Gemini(id="gemini-2.5-flash-lite", api_key=api_key),
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


# Function to decide which agent to call based on the task
def handle_task(prompt):
    prompt_lower = prompt.lower()
    
    if "generate" in prompt_lower:
        print("Calling codeGenerator...")
        codeGenerator.print_response(prompt, stream=False)
        return codeGenerator.run(prompt)
    elif "refactor" in prompt_lower:
        print("Calling refactor...")
        refactor.print_response(prompt, stream=False)
        return refactor.run(prompt)
    elif "modernize" in prompt_lower or "modernise" in prompt_lower:
        print("Calling codeModerniser...")
        codeModerniser.print_response(prompt, stream=False)
        return codeModerniser.run(prompt)
    elif "error correction" in prompt_lower:
        print("Calling errorDetection...")
        errorDetection.print_response(prompt, stream=False)
        return errorDetection.run(prompt)
    else:
        return {"error": "No matching task found for this prompt."}
