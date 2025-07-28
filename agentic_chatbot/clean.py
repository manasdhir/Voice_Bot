import re
def clean_markdown_for_tts(text):
    """
    Remove markdown formatting elements from text for TTS processing.
    """
    if not text:
        return ""

    # Remove bold and italic formatting
    text = re.sub(r'\*\*\*(.*?)\*\*\*', r'\1', text)  # ***bold italic***
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)      # **bold**
    text = re.sub(r'\*(.*?)\*', r'\1', text)          # *italic*
    text = re.sub(r'___(.*?)___', r'\1', text)        # ___bold italic___
    text = re.sub(r'__(.*?)__', r'\1', text)          # __bold__
    text = re.sub(r'_(.*?)_', r'\1', text)            # _italic_

    # Remove list markers (but keep numbered lists)
    text = re.sub(r'^\s*\*\s+', '', text, flags=re.MULTILINE)   # * bullet points
    text = re.sub(r'^\s*-\s+', '', text, flags=re.MULTILINE)    # - bullet points
    text = re.sub(r'^\s*\+\s+', '', text, flags=re.MULTILINE)   # + bullet points

    # Remove other asterisk-based markings
    text = re.sub(r'\*{3,}', '', text)                # *** horizontal rules
    text = re.sub(r'^\s*\*\s*$', '', text, flags=re.MULTILINE)  # standalone asterisks

    # Remove blockquotes
    text = re.sub(r'^>\s+', '', text, flags=re.MULTILINE)       # > blockquote

    # Remove headers
    text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)  # # Headers

    # Clean up extra whitespace
    text = re.sub(r'\n\s*\n', '\n\n', text)           # Multiple newlines
    text = re.sub(r'[ \t]+', ' ', text)               # Multiple spaces/tabs
    text = text.strip()

    return text