from pypdf import PdfReader
import sys

try:
    reader = PdfReader("Dayflow - Human Resource Management System (1) (1).pdf")
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    with open("requirements_extracted.txt", "w", encoding="utf-8") as f:
        f.write(text)
    print("Successfully wrote to requirements_extracted.txt")
except Exception as e:
    print(f"Error reading PDF: {e}")
