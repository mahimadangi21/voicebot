# scratch/test_gender_and_names.py
import sys
import io

# Force UTF-8 encoding for standard output
try:
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
except Exception:
    pass

from conversation_engine import CallContext, bot_say, process_user_reply, is_call_over, State, detect_intent, Intent

def run_test():
    print("======================================================")
    print(" RUNNING TESTS: GENDER & NAME DYNAMIC INTENT DETECT")
    print("======================================================")

    # 1. Verify Mahima Dangi (Female Speech Patterns)
    print("\n--- Test Case 1: Mahima Dangi (Female Speech) ---")
    ctx1 = CallContext(name="Mahima Dangi", amount=5000, bank_name="ICICI")
    
    greeting = bot_say(ctx1)
    print(f"BOT Greeting: {greeting}")
    
    # User confirms name with female verb conjugation
    reply1 = "haan, main mahima dangi bol rahi hoon"
    intent1 = detect_intent(reply1, ctx1.name)
    print(f"USER: {reply1} -> Detected Intent: {intent1.value}")
    assert intent1 == Intent.AFFIRM, f"Expected Intent.AFFIRM, got {intent1}"
    
    bot_reply = process_user_reply(ctx1, reply1)
    print(f"BOT Reply: {bot_reply}")
    print(f"New State: {ctx1.state.name}")
    assert ctx1.state == State.AMOUNT_DUE, f"Expected State.AMOUNT_DUE, got {ctx1.state}"
    
    # 2. Verify Dhanesh Vaishnav (Male Speech Patterns)
    print("\n--- Test Case 2: Dhanesh Vaishnav (Male Speech) ---")
    ctx2 = CallContext(name="Dhanesh Vaishnav", amount=5000, bank_name="ICICI")
    
    greeting = bot_say(ctx2)
    print(f"BOT Greeting: {greeting}")
    
    # User confirms name with male verb conjugation
    reply2 = "haan, main dhanesh bol raha hoon"
    intent2 = detect_intent(reply2, ctx2.name)
    print(f"USER: {reply2} -> Detected Intent: {intent2.value}")
    assert intent2 == Intent.AFFIRM, f"Expected Intent.AFFIRM, got {intent2}"
    
    bot_reply = process_user_reply(ctx2, reply2)
    print(f"BOT Reply: {bot_reply}")
    print(f"New State: {ctx2.state.name}")
    assert ctx2.state == State.AMOUNT_DUE, f"Expected State.AMOUNT_DUE, got {ctx2.state}"

    # 3. Verify Wrong Name (Wrong Person Detection)
    print("\n--- Test Case 3: Wrong Name / Person ---")
    ctx3 = CallContext(name="Jitesh Soni", amount=5000)
    # If a female answers for Jitesh and says "bol rahi hoon", it should be wrong person
    reply3 = "haan, main mahima bol rahi hoon"
    intent3 = detect_intent(reply3, ctx3.name)
    print(f"USER: {reply3} (for Jitesh) -> Detected Intent: {intent3.value}")
    assert intent3 == Intent.WRONG_PERSON, f"Expected Intent.WRONG_PERSON, got {intent3}"

    print("\nALL TEST CASES PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_test()
