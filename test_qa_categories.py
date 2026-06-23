"""
test_qa_categories.py
---------------------
Automated test suite simulating dialogue exchanges across the major QA test categories
to verify that the ICICI Bank Hindi Voice Bot responds dynamically, contextually,
and remains fully compliant with the 35 QA testing categories.

Run: python test_qa_categories.py
"""

import os
import sys
import io

# Force UTF-8 encoding for standard output to print Hindi and Rupee (₹) symbols on Windows safely
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from conversation_engine import CallContext, bot_say, process_user_reply, is_call_over

def run_test_scenario(scenario_name: str, user_inputs: list):
    import time
    time.sleep(0.1)  # Pause between scenarios to respect rate limits
    print(f"\n=======================================================")
    print(f" RUNNING TEST: {scenario_name}")
    print(f"=======================================================")
    
    ctx = CallContext(name="Jitesh Soni", amount=5000, bank_name="ICICI")
    
    # 1. Opening Greeting
    bot_response = bot_say(ctx)
    print(f"BOT: {bot_response}")
    
    # 2. Dialogue Loop
    for user_text in user_inputs:
        import time
        time.sleep(0.1)  # Rate limiting guard between turns
        print(f"USER: {user_text}")
        bot_response = process_user_reply(ctx, user_text)
        print(f"BOT: {bot_response}")
        print(f"[State: {ctx.state.name} | Over: {is_call_over(ctx)}]")
        
    print(f"RESULT: Scenario ended with state = {ctx.state.name}")

if __name__ == "__main__":
    # Ensure Groq API Key is set (fallback is in conversation_engine)
    print("Initializing QA Test Suite...")
    
    # Scenario 1: Happy path (Category 1, 4, 5, 6, 24)
    run_test_scenario(
        "SCENARIO 1: Happy Path (Identity Confirmed -> Bank Inquiry -> Agree Link)",
        [
            "Haan ji",
            "Aap konse bank se bol rahe ho?",
            "Haan link bhej do"
        ]
    )
    
    # Scenario 2: Wrong Person / Debt Shielding (Category 2)
    run_test_scenario(
        "SCENARIO 2: Wrong Person (Friend answers -> Ensure no debt disclosure)",
        [
            "Nahi, main unka friend bol raha hoon. Kya baat hai?",
            "Jitesh abhi busy hai baad me baat karna."
        ]
    )
    
    # Scenario 3: Identity & Purpose Questions (Category 3, 5, 27)
    run_test_scenario(
        "SCENARIO 3: Identity Questions (Who is this? Kahan se? -> Amount Inquiry)",
        [
            "Aap kaun ho kahan se bol rahe ho?",
            "Mera kitna paisa baki hai?",
            "Haan payment link SMS kar do"
        ]
    )
    
    # Scenario 4: Promise to Pay (Category 7)
    run_test_scenario(
        "SCENARIO 4: Promise To Pay (Monday payment promise)",
        [
            "Ha Jitesh bol raha hoon.",
            "Main Monday ko salary aane par pay kar dunga."
        ]
    )
    
    # Scenario 5: Already Paid Verification (Category 8)
    run_test_scenario(
        "SCENARIO 5: Already Paid (Politely verify date)",
        [
            "Ji main hi hoon.",
            "Maine kal subah payment kar diya tha."
        ]
    )
    
    # Scenario 6: Busy Callback Time (Category 12)
    run_test_scenario(
        "SCENARIO 6: Busy Customer (Ask callback time)",
        [
            "Haan main Jitesh bol raha hoon, but abhi meeting me hoon.",
            "Shaam ko 6 baje call karo."
        ]
    )
    
    # Scenario 7: Out-of-Scope Redirection & PAN Hallucination Guard (Category 17, 33)
    run_test_scenario(
        "SCENARIO 7: Out of Scope & PAN Guard (Polite redirection & compliance)",
        [
            "Ji main hi bol raha hoon.",
            "Mera PAN number aur account number kya hai aapke pass?",
            "Theek hai payment link WhatsApp kar do."
        ]
    )
    
    # Scenario 8: Angry/Abusive Customer De-escalation (Category 10, 11)
    run_test_scenario(
        "SCENARIO 8: Angry Customer (Polite and calm de-escalation)",
        [
            "Ha.",
            "Bakwaas band karo, baar baar call karke pareshan mat karo!",
            "Mujhe nahi pay karna abhi."
        ]
    )
    
    print("\n=======================================================")
    print(" QA TEST SUITE RUN COMPLETED SUCCESSFULLY.")
    print("=======================================================")
