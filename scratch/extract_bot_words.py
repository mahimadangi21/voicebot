# scratch/extract_bot_words.py
import re
import sys
import os

# Set PYTHONPATH to root
sys.path.append(os.getcwd())

from conversation_engine import CallContext, bot_say, State
from tts_engine import HINGLISH_TO_DEVANAGARI

def extract_all_words():
    # Construct a comprehensive context
    ctx = CallContext(name="Jitesh Soni", amount=5000, bank_name="ICICI")
    ctx.promise_date = "15 June 2026"
    ctx.callback_time = "5 Baje"

    sentences = []
    # Collect sentences from all states
    for state in State:
        ctx.state = state
        text = bot_say(ctx)
        if text:
            sentences.append(text)

    # Add inline responses from process_user_reply
    sentences.append("Security reasons ki wajah se main aapka PAN number ya account number call par nahi bata sakta. Main ICICI Bank se bol raha hoon. Agar aap pay kar rahe hain to kya main aapko payment link bhej doon?")
    sentences.append("Lagta hai hamari aawaz nahi pahunch rahi hai. Hum aapse baad mein contact karenge. Dhanyavaad.")
    sentences.append("Hello? Kya aapko meri aawaz aa rahi hai? Kripya bataiye.")
    sentences.append("Lagta hai network kharab hai. Hum aapse baad mein contact karenge. Dhanyavaad.")
    sentences.append("Sorry, main aapki aawaz theek se nahi sun paya. Kya aap kripya repeat kar sakte hain?")
    sentences.append("Maaf kijiye, main ek automated loan recovery assistant hoon. Main sirf aapke pending loan ke baare mein hi bata sakta hoon. Kripya loan payment ke baare mein bataiye.")

    # Tokenize words (Latin script only)
    all_latin_words = set()
    for sentence in sentences:
        # Replace non-word chars and split
        words = re.findall(r'[a-zA-Z]+', sentence)
        for w in words:
            all_latin_words.add(w.lower())

    print(f"Total unique Latin words found: {len(all_latin_words)}")
    
    missing_mappings = []
    for w in sorted(all_latin_words):
        # Skip bank overrides that are normalized separately
        if w in ["icici", "sbi", "hdfc", "pnb", "axis"]:
            continue
        if w not in HINGLISH_TO_DEVANAGARI:
            missing_mappings.append(w)

    if missing_mappings:
        print("\n[WARNING] The following words are MISSING from HINGLISH_TO_DEVANAGARI:")
        for w in missing_mappings:
            print(f"  - '{w}'")
    else:
        print("\n[SUCCESS] No words are missing from HINGLISH_TO_DEVANAGARI!")

if __name__ == "__main__":
    extract_all_words()
