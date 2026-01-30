import tkinter as tk

# Path to the output.txt file
file_path = r'C:\Projects\Syntax AI\output.txt'

# Function to read the content of the file
def read_file():
    try:
        with open(file_path, 'r') as file:
            content = file.read()
        return content
    except Exception as e:
        return f"Error reading file: {e}"

# Function to close the GUI
def close_gui():
    root.quit()  # This will close the window

# Create the main window
root = tk.Tk()
root.title("Output")

# Read the content of the output.txt
file_content = read_file()

# Maximize the window to cover the entire screen on launch
root.state('zoomed')  # 'zoomed' is a state to make the window maximized

# Set a background color for the window
root.config(bg="white")

# Create a Frame to hold the Text widget (for better control)
frame = tk.Frame(root, bg="white")
frame.pack(expand=True, fill=tk.BOTH, padx=20, pady=20)

# Create a Text widget inside the frame to display the file content (with selectable text)
text_widget = tk.Text(frame, wrap=tk.WORD, font=("Helvetica", 14), bg="white", height=100, width=80)
text_widget.insert(tk.END, file_content)  # Insert the content of the file into the Text widget
text_widget.config(state=tk.DISABLED)  # Make the text widget read-only (so the user can't modify the text)

# Pack the Text widget into the frame
text_widget.pack(expand=True, fill=tk.BOTH)

# Create a Back button that will close the window
back_button = tk.Button(root, text="Back", font=("Helvetica", 14), command=close_gui)
back_button.pack(side="bottom", pady=20)

# Start the tkinter event loop to keep the window open
root.mainloop()