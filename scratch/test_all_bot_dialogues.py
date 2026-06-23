# scratch/test_all_bot_dialogues.py
import os
import sys
import io

# Ensure PYTHONPATH is root
sys.path.append(os.getcwd())

from conversation_engine import CallContext, bot_say, State
from tts_engine import speak, get_audio_duration

def get_all_bot_lines():
    # Setup contexts with varying bank names, names, amounts, dates, and times
    ctx_jitesh = CallContext(name="Jitesh Soni", amount=5000, bank_name="ICICI")
    ctx_mahima = CallContext(name="Mahima Dangi", amount=12500, bank_name="HDFC")
    ctx_dhanesh = CallContext(name="Dhanesh Vaishnav", amount=750, bank_name="Axis Bank")
    ctx_sbi = CallContext(name="Kiran Soni", amount=2500, bank_name="SBI")

    # Define standard state outputs
    dialogues = []

    # 1. State.GREETING
    ctx_jitesh.state = State.GREETING
    dialogues.append(("greeting_jitesh", bot_say(ctx_jitesh)))

    # 2. State.GREETING (with Mahima)
    ctx_mahima.state = State.GREETING
    dialogues.append(("greeting_mahima", bot_say(ctx_mahima)))

    # 3. State.GREETING_IDENTITY_ASKED
    ctx_jitesh.state = State.GREETING_IDENTITY_ASKED
    dialogues.append(("greeting_identity_asked_jitesh", bot_say(ctx_jitesh)))

    # 4. State.ASK_JITESH (using Jitesh context)
    ctx_jitesh.state = State.ASK_JITESH
    dialogues.append(("ask_jitesh", bot_say(ctx_jitesh)))

    # 5. State.AMOUNT_DUE (Jitesh, 5000, ICICI)
    ctx_jitesh.state = State.AMOUNT_DUE
    dialogues.append(("amount_due_jitesh", bot_say(ctx_jitesh)))

    # 6. State.AMOUNT_DUE (Mahima, 12500, HDFC)
    ctx_mahima.state = State.AMOUNT_DUE
    dialogues.append(("amount_due_mahima", bot_say(ctx_mahima)))

    # 7. State.AMOUNT_DUE (Dhanesh, 750, Axis)
    ctx_dhanesh.state = State.AMOUNT_DUE
    dialogues.append(("amount_due_dhanesh", bot_say(ctx_dhanesh)))

    # 8. State.BANK_NAME
    ctx_jitesh.state = State.BANK_NAME
    dialogues.append(("bank_name_jitesh", bot_say(ctx_jitesh)))

    # 9. State.ALREADY_PAID
    ctx_jitesh.state = State.ALREADY_PAID
    dialogues.append(("already_paid", bot_say(ctx_jitesh)))

    # 10. State.DE_ESCALATE
    ctx_jitesh.state = State.DE_ESCALATE
    dialogues.append(("de_escalate", bot_say(ctx_jitesh)))

    # 11. State.PAYMENT_CONFIRM
    ctx_jitesh.state = State.PAYMENT_CONFIRM
    dialogues.append(("payment_confirm_jitesh", bot_say(ctx_jitesh)))

    # 12. State.ASK_PAYMENT_DATE
    ctx_jitesh.state = State.ASK_PAYMENT_DATE
    dialogues.append(("ask_payment_date", bot_say(ctx_jitesh)))

    # 13. State.ASK_CALLBACK_TIME
    ctx_jitesh.state = State.ASK_CALLBACK_TIME
    dialogues.append(("ask_callback_time", bot_say(ctx_jitesh)))

    # 14. State.CALL_ENDED_SUCCESS (with promise date)
    ctx_jitesh.state = State.CALL_ENDED_SUCCESS
    ctx_jitesh.promise_date = "15 June 2026"
    dialogues.append(("call_ended_success_promise", bot_say(ctx_jitesh)))

    # 15. State.CALL_ENDED_SUCCESS (without promise date)
    ctx_mahima.state = State.CALL_ENDED_SUCCESS
    ctx_mahima.promise_date = ""
    dialogues.append(("call_ended_success_no_promise", bot_say(ctx_mahima)))

    # 16. State.CALL_ENDED_CALLBACK (with callback time)
    ctx_jitesh.state = State.CALL_ENDED_CALLBACK
    ctx_jitesh.callback_time = "5 Baje"
    dialogues.append(("call_ended_callback_time", bot_say(ctx_jitesh)))

    # 17. State.CALL_ENDED_CALLBACK (without callback time)
    ctx_mahima.state = State.CALL_ENDED_CALLBACK
    ctx_mahima.callback_time = ""
    dialogues.append(("call_ended_callback_no_time", bot_say(ctx_mahima)))

    # 18. State.CALL_ENDED_WRONG_NUMBER
    ctx_jitesh.state = State.CALL_ENDED_WRONG_NUMBER
    dialogues.append(("call_ended_wrong_number", bot_say(ctx_jitesh)))

    # 19. State.CALL_ENDED_REFUSED
    ctx_jitesh.state = State.CALL_ENDED_REFUSED
    dialogues.append(("call_ended_refused", bot_say(ctx_jitesh)))

    # 20. State.CALL_ENDED_UNCLEAR
    ctx_jitesh.state = State.CALL_ENDED_UNCLEAR
    dialogues.append(("call_ended_unclear", bot_say(ctx_jitesh)))

    # 21. State.CALL_ENDED_FINANCIAL
    ctx_jitesh.state = State.CALL_ENDED_FINANCIAL
    dialogues.append(("call_ended_financial", bot_say(ctx_jitesh)))

    # 22. State.CALL_ENDED_ESCALATED
    ctx_jitesh.state = State.CALL_ENDED_ESCALATED
    dialogues.append(("call_ended_escalated", bot_say(ctx_jitesh)))

    # 23. State.DUE_DATE
    ctx_jitesh.state = State.DUE_DATE
    dialogues.append(("due_date", bot_say(ctx_jitesh)))

    # 24. State.WRONG_AMOUNT
    ctx_jitesh.state = State.WRONG_AMOUNT
    dialogues.append(("wrong_amount_jitesh", bot_say(ctx_jitesh)))

    # 25. State.NEGOTIATE
    ctx_jitesh.state = State.NEGOTIATE
    dialogues.append(("negotiate", bot_say(ctx_jitesh)))

    # 26. State.REMINDER_ASKED
    ctx_jitesh.state = State.REMINDER_ASKED
    dialogues.append(("reminder_asked", bot_say(ctx_jitesh)))

    # 27. State.CONSEQUENCES_EXPLAINED
    ctx_jitesh.state = State.CONSEQUENCES_EXPLAINED
    dialogues.append(("consequences_explained", bot_say(ctx_jitesh)))

    # 28. State.CALL_ENDED_POLITE
    ctx_jitesh.state = State.CALL_ENDED_POLITE
    dialogues.append(("call_ended_polite", bot_say(ctx_jitesh)))

    # Inline responses from process_user_reply
    dialogues.append(("inline_sensitive", "Security reasons ki wajah se main aapka PAN number ya account number call par nahi bata sakta. Main ICICI Bank se bol raha hoon. Agar aap pay kar rahe hain to kya main aapko payment link bhej doon?"))
    dialogues.append(("inline_silence_giveup", "Lagta hai hamari aawaz nahi pahunch rahi hai. Hum aapse baad mein contact karenge. Dhanyavaad."))
    dialogues.append(("inline_silence_retry", "Hello? Kya aapko meri aawaz aa rahi hai? Kripya bataiye."))
    dialogues.append(("inline_noise_giveup", "Lagta hai network kharab hai. Hum aapse baad mein contact karenge. Dhanyavaad."))
    dialogues.append(("inline_noise_retry", "Sorry, main aapki aawaz theek se nahi sun paya. Kya aap kripya repeat kar sakte hain?"))
    dialogues.append(("inline_out_of_scope", "Maaf kijiye, main ek automated loan recovery assistant hoon. Main sirf aapke pending loan ke baare mein hi bata sakta hoon. Kripya loan payment ke baare mein bataiye."))

    return dialogues

def run_tests():
    dialogues = get_all_bot_lines()
    print(f"Loaded {len(dialogues)} dialogues to verify.")

    output_dir = "audio_output/test_dialogues"
    os.makedirs(output_dir, exist_ok=True)

    # Backup the original API key
    original_api_key = os.environ.get("SARVAM_API_KEY")

    failed_cases = []

    # -----------------------------------------------------------------------
    # PATH A: Forced Fallback (gTTS with transliteration)
    # -----------------------------------------------------------------------
    print("\n" + "="*80)
    # Use "INVALID_KEY" to trigger the local bypass of Sarvam to fall back to gTTS
    os.environ["SARVAM_API_KEY"] = "INVALID_KEY_TO_FORCE_FALLBACK"
    print("RUNNING FORCED FALLBACK (gTTS) TEST PATH")
    print("="*80)

    for name, text in dialogues:
        filename = os.path.join(output_dir, f"{name}_fallback.mp3")
        if os.path.exists(filename):
            os.remove(filename)

        # Catch stdout to check for transliteration warnings
        old_stdout = sys.stdout
        new_stdout = io.StringIO()
        sys.stdout = new_stdout

        try:
            speak(text, filename, engine="sarvam")
        except Exception as e:
            sys.stdout = old_stdout
            print(f"FAIL [fallback]: '{name}' raised error: {e}")
            failed_cases.append((name, "fallback_exception", str(e)))
            continue

        sys.stdout = old_stdout
        captured = new_stdout.getvalue()

        # Check for transliteration warnings
        if "[Transliteration Warning]" in captured:
            print(f"WARNING [fallback]: '{name}' has missing transliterated words!")
            print(captured)
            failed_cases.append((name, "fallback_warning", "Transliteration Warning in logs"))
            continue

        # Check duration
        if os.path.exists(filename):
            duration = get_audio_duration(filename)
            min_expected = len(text) * 0.035
            if duration < min_expected:
                print(f"FAIL [fallback]: '{name}' audio duration too short ({duration:.2f}s, expected >= {min_expected:.2f}s)")
                failed_cases.append((name, "fallback_duration", f"Duration: {duration:.2f}s"))
            else:
                print(f"PASS [fallback]: '{name}' | size: {os.path.getsize(filename)} bytes | duration: {duration:.2f}s")
        else:
            print(f"FAIL [fallback]: '{name}' file was not created.")
            failed_cases.append((name, "fallback_file_missing", "File not created"))

    # -----------------------------------------------------------------------
    # PATH B: Primary Engine (Sarvam AI using "rohan" speaker)
    # -----------------------------------------------------------------------
    print("\n" + "="*80)
    if not original_api_key or original_api_key.startswith("INVALID") or original_api_key == "":
        print("Skipping Primary Sarvam AI path because no valid SARVAM_API_KEY is available.")
        print("="*80)
    else:
        os.environ["SARVAM_API_KEY"] = original_api_key
        print("RUNNING PRIMARY ENGINE (Sarvam AI) TEST PATH")
        print("="*80)

        for name, text in dialogues:
            filename = os.path.join(output_dir, f"{name}_primary.mp3")
            if os.path.exists(filename):
                os.remove(filename)

            try:
                # Primary call should hit Sarvam and use "rohan" default speaker
                speak(text, filename, engine="sarvam")
            except Exception as e:
                print(f"FAIL [primary]: '{name}' raised error: {e}")
                failed_cases.append((name, "primary_exception", str(e)))
                continue

            if os.path.exists(filename):
                duration = get_audio_duration(filename)
                min_expected = len(text) * 0.035
                if duration < min_expected:
                    print(f"FAIL [primary]: '{name}' audio duration too short ({duration:.2f}s, expected >= {min_expected:.2f}s)")
                    failed_cases.append((name, "primary_duration", f"Duration: {duration:.2f}s"))
                else:
                    print(f"PASS [primary]: '{name}' | size: {os.path.getsize(filename)} bytes | duration: {duration:.2f}s")
            else:
                print(f"FAIL [primary]: '{name}' file was not created.")
                failed_cases.append((name, "primary_file_missing", "File not created"))

    print("\n" + "="*80)
    print(" TEST RUN SUMMARY")
    print("="*80)
    if failed_cases:
        print(f"FAILED: {len(failed_cases)} errors detected.")
        for name, err_type, details in failed_cases:
            print(f"  - Case '{name}' failed with type '{err_type}': {details}")
        sys.exit(1)
    else:
        print("ALL TESTS PASSED SUCCESSFULLY! Clean fallback and duration safeguard validation verified on all bot responses.")
        sys.exit(0)

if __name__ == "__main__":
    run_tests()
