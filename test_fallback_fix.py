import os
import sys
import shutil
from dotenv import load_dotenv

# Ensure stdout handles Unicode characters on Windows
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

# Load environmental variables
load_dotenv()

# Store original key
ORIGINAL_API_KEY = os.environ.get("SARVAM_API_KEY", "")

from tts_engine import speak, speak_with_gtts, get_audio_duration, hinglish_to_devanagari

def run_cutoff_reproduction_test():
    print("\n" + "="*80)
    print("STEP 2: REPRODUCING THE BUG ON PURPOSE (Forced Fallback & Naive gTTS)")
    print("="*80)

    # We will test two dynamic sentences that previously choked/cut off:
    # 1. A greeting with "Amala" and "Ritu"
    # 2. An amount due with "ICICI" and "Canara"
    reproduce_sentences = [
        "Hello, kya meri baat Amala se ho rahi hai?",
        "Hello, kya meri baat Ritu se ho rahi hai?",
        "Main Canara bank se bol raha hoon. Agar aap abhi pay kar rahe ho, to main aapko payment link bhej deta hoon.",
        "Aapka 5000 rupaye ka amount due hai hamare bank mein."
    ]

    test_dir = "audio_output/test_repro"
    os.makedirs(test_dir, exist_ok=True)

    print("\nSynthesizing with NAIVE gTTS (Raw Hinglish - EXPECTED CUTOFFS):")
    naive_durations = {}
    for idx, text in enumerate(reproduce_sentences):
        filename = os.path.join(test_dir, f"naive_{idx}.mp3")
        if os.path.exists(filename):
            os.remove(filename)
        
        # Call gTTS directly with Hinglish/Latin text (reproducing old bug)
        speak_with_gtts(text, filename, lang="hi")
        duration = get_audio_duration(filename)
        naive_durations[text] = duration
        print(f"  Raw: '{text}'")
        print(f"  Duration: {duration:.2f}s | File: {filename}\n")

    print("\nSynthesizing with FIXED transliterated gTTS (Devanagari fallback):")
    fixed_durations = {}
    for idx, text in enumerate(reproduce_sentences):
        filename = os.path.join(test_dir, f"fixed_{idx}.mp3")
        if os.path.exists(filename):
            os.remove(filename)
        
        # This will use the new hinglish_to_devanagari transliterator
        devanagari_text = hinglish_to_devanagari(text)
        speak_with_gtts(devanagari_text, filename, lang="hi")
        duration = get_audio_duration(filename)
        fixed_durations[text] = duration
        print(f"  Raw Text     : '{text}'")
        print(f"  Transliterated: '{devanagari_text}'")
        print(f"  Duration      : {duration:.2f}s | File: {filename}\n")

    print("\nComparison Results:")
    print("-" * 100)
    print(f"{'Test Sentence':<45} | {'Naive Dur':<10} | {'Fixed Dur':<10} | {'Diff (Fixed - Naive)':<20} | {'Status':<10}")
    print("-" * 100)
    for text in reproduce_sentences:
        n_dur = naive_durations[text]
        f_dur = fixed_durations[text]
        diff = f_dur - n_dur
        status = "FIXED" if diff > 0.5 else "NO DIFF"
        print(f"{text[:43]:<45} | {n_dur:<10.2f} | {f_dur:<10.2f} | {diff:<20.2f} | {status:<10}")
    print("-" * 100)

def test_all_bot_lines(force_fallback=False):
    path_name = "FORCED FALLBACK (gTTS)" if force_fallback else "HAPPY PATH (Sarvam AI)"
    print("\n" + "="*80)
    print(f"STEP 4: TESTING ALL BOT LINES UNDER: {path_name}")
    print("="*80)

    if force_fallback:
        os.environ["SARVAM_API_KEY"] = "INVALID_KEY_FOR_TEST"
    else:
        os.environ["SARVAM_API_KEY"] = ORIGINAL_API_KEY

    # Let's import CallContext and State to generate the lines dynamically
    from conversation_engine import CallContext, State, bot_say
    
    # We will test multiple contexts with different names, banks, amounts, dates
    test_contexts = [
        CallContext(name="Ritu", amount=5000, bank_name="ICICI"),
        CallContext(name="Mahima Dangi", amount=12345, bank_name="SBI"),
        CallContext(name="Amit", amount=750, bank_name="Canara"),
        CallContext(name="Amala", amount=2500, bank_name="Axis")
    ]

    # Collect all states we want to test
    states_to_test = [
        State.GREETING,
        State.GREETING_IDENTITY_ASKED,
        State.ASK_JITESH,
        State.AMOUNT_DUE,
        State.BANK_NAME,
        State.ALREADY_PAID,
        State.DE_ESCALATE,
        State.PAYMENT_CONFIRM,
        State.ASK_PAYMENT_DATE,
        State.ASK_CALLBACK_TIME,
        State.CALL_ENDED_SUCCESS,
        State.CALL_ENDED_CALLBACK,
        State.CALL_ENDED_WRONG_NUMBER,
        State.CALL_ENDED_REFUSED,
        State.CALL_ENDED_UNCLEAR,
        State.CALL_ENDED_FINANCIAL,
        State.CALL_ENDED_ESCALATED,
        State.DUE_DATE,
        State.WRONG_AMOUNT,
        State.NEGOTIATE,
        State.REMINDER_ASKED,
        State.CONSEQUENCES_EXPLAINED,
        State.CALL_ENDED_POLITE
    ]

    output_dir = "audio_output/test_all_fallback" if force_fallback else "audio_output/test_all_sarvam"
    os.makedirs(output_dir, exist_ok=True)

    print(f"\nProcessing {len(states_to_test)} states across {len(test_contexts)} different dynamic contexts...")
    
    warnings_logged = 0
    total_processed = 0

    for ctx_idx, ctx in enumerate(test_contexts):
        # Set context variables for specific tests
        ctx.promise_date = "15 June" if ctx_idx % 2 == 0 else "monday shaam ko"
        ctx.callback_time = "5 baje" if ctx_idx % 2 == 0 else "tomorrow morning"

        print(f"\nContext {ctx_idx + 1}: Name={ctx.name}, Bank={ctx.bank_name}, Amount={ctx.amount}")
        print("-" * 50)
        
        for state in states_to_test:
            ctx.state = state
            # Generate the bot reply text
            bot_text = bot_say(ctx)
            if not bot_text:
                continue

            filename = os.path.join(output_dir, f"ctx{ctx_idx}_state_{state.name}.mp3")
            if os.path.exists(filename):
                os.remove(filename)

            print(f"State: {state.name}")
            # Call speak which uses fallback if key is invalid
            speak(bot_text, filename)
            
            # Check duration safeguard
            duration = get_audio_duration(filename)
            min_expected = len(bot_text) * 0.045
            total_processed += 1
            if duration < min_expected:
                warnings_logged += 1
                print(f"  [Safeguard Triggered] WARNING: Suspect cutoff in state {state.name}! Duration {duration:.2f}s < expected {min_expected:.2f}s")
            print()

    print(f"\nCompleted testing for {path_name}!")
    print(f"Total lines processed: {total_processed}")
    print(f"Safeguard warnings triggered: {warnings_logged}")
    
    # Restore key
    os.environ["SARVAM_API_KEY"] = ORIGINAL_API_KEY
    return warnings_logged

def main():
    # 1. Run cutoff reproduction test
    run_cutoff_reproduction_test()

    # 2. Run all lines with forced fallback (gTTS)
    fallback_warnings = test_all_bot_lines(force_fallback=True)

    # 3. Run all lines with happy-path (Sarvam AI)
    # Note: this will only run if SARVAM_API_KEY is active and valid.
    print("\n" + "="*80)
    print("STEP 4 (Part 2): HAPPY PATH (Sarvam AI) TEST")
    print("="*80)
    if ORIGINAL_API_KEY and ORIGINAL_API_KEY != "sk_0i1wbmsi_HSudXzIGEWm46gBR0i1w0CT9_INVALID":
        sarvam_warnings = test_all_bot_lines(force_fallback=False)
        print(f"\nFinal Summary:")
        print(f"  Forced Fallback Path Warnings: {fallback_warnings}")
        print(f"  Happy Path Sarvam AI Warnings: {sarvam_warnings}")
    else:
        print("\nSkipping Happy Path test because SARVAM_API_KEY is not configured or placeholder.")
        print(f"\nFinal Summary:")
        print(f"  Forced Fallback Path Warnings: {fallback_warnings}")

if __name__ == "__main__":
    main()
