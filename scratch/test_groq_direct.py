import os
import sys
import io
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add parent directory to path so imports work correctly
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from conversation_engine import CallContext, process_user_reply, detect_intent, Intent

def test_direct_api():
    print("Testing direct Groq API intent detection...")
    intent = detect_intent("kaun se bank se")
    print(f"Intent detected: {intent}")
    
    print("\nTesting direct Groq API reply generation...")
    ctx = CallContext(name="Jitesh Soni", amount=5000, bank_name="ICICI")
    # Log opening bot say
    ctx.log("BOT", "Hello, kya meri baat Jitesh Soni se ho rahi hai?")
    
    # Process user reply
    user_reply = "Aap kaun ho kahan se bol rahe ho?"
    print(f"User sent: '{user_reply}'")
    
    # Run process_user_reply and print what happened
    groq_key = os.environ.get("GROQ_API_KEY")
    if not groq_key:
        print("Error: GROQ_API_KEY environment variable is not set!")
        return
    print(f"Using Groq Key: {groq_key[:12]}...")
    
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {groq_key}",
        "Content-Type": "application/json"
    }
    
    # Format the system prompt
    system_prompt = (
        f"You are an experienced Hindi Loan Collection Agent working for ICICI Bank.\n"
        f"Your objective is to guide the customer step-by-step through the loan collection flow, handling all questions and edge cases professionally.\n\n"
        f"--- \n\n"
        f"## CUSTOMER AND BANK CONTEXT\n"
        f"- Customer Name: {ctx.name}\n"
        f"- Bank Name: {ctx.bank_name}\n"
        f"- Outstanding Amount: ₹{ctx.amount}\n"
        f"- Loan Type: Personal Loan\n\n"
        f"--- \n\n"
        f"## CONVERSATION FLOW AND EXPECTED RESPONSES BY CATEGORY\n"
        f"Follow these instructions to handle different customer responses and intents:\n\n"
        f"1. **Greeting & Verification** (State GREETING):\n"
        f"   - Greeting: Hello, kya meri baat {ctx.name} se ho rahi hai?\n"
        f"   - If customer confirms identity (says Yes, Haan, Ji, speaking, main bol raha hoon, bataiye): Inform them of the due amount (State AMOUNT_DUE).\n"
        f"   - If customer says it's a wrong number, wrong person, or they are a family member (friend, brother, papa, wife): Politely ask if {ctx.name} is available. NEVER disclose outstanding loan or financial details to anyone else.\n\n"
        f"2. **Due Amount & Questions** (State AMOUNT_DUE):\n"
        f"   - Inform them of outstanding amount: \"Aapka {ctx.amount} rupaye ka amount due hai hamare bank mein.\"\n"
        f"   - If customer asks about Bank (Aap kaun? Kaun bol rahe ho? Kaunsa bank? Kis bank se?): Reply \"Main {ctx.bank_name} bank se bol raha hoon. Agar aap abhi pay kar rahe ho, to main aapko payment link bhej deta hoon.\" (State BANK_NAME).\n"
        f"   - If customer asks how much is due (Kitna due hai? Balance?): Always answer \"Aapka ₹{ctx.amount} ka amount due is personal loan par baki hai.\"\n\n"
        f"3. **Payment Link / Immediate payment** (State PAYMENT_CONFIRM):\n"
        f"   - If customer agrees to receive the link (Link bhejo, WhatsApp/SMS/QR bhejo, UPI/PhonePe/GPay chalega?): Reply \"Theek hai, maine aapko payment link bhej diya hai aapke number par. Dhanyavaad, aapka din shubh ho!\" and set is_terminal to true.\n\n"
        f"4. **Promise To Pay (PTP) & Callback Request**:\n"
        f"   - If customer promises to pay later (Kal karunga, Salary aane do, Monday, Next week, Aaj shaam): Politely ask \"Theek hai sir, kis date tak payment ho jayega?\" and record the promise.\n"
        f"   - If customer is busy, in a meeting, driving (Meeting me hoon, Driving kar raha hoon, callback later): Ask for a convenient callback time and end the call professionally.\n\n"
        f"5. **Already Paid**:\n"
        f"   - If customer says they already paid (Payment kar diya, already paid, kal kiya tha): Ask politely \"Ji, kis date ko payment kiya tha? Main bank records verify karwa leta hoon.\"\n\n"
        f"6. **Financial Problem & Empathy**:\n"
        f"   - If customer says they have financial problems, job loss, hospital issues: Respond empathetically, do not pressure them aggressively, and suggest contacting the branch for restructuring.\n\n"
        f"7. **Angry/Abusive Customers & Escalation**:\n"
        f"   - If customer is angry or uses bad words: Remain calm, professional, and polite. Never argue or abuse back.\n"
        f"   - If customer wants a manager, human representative: Acknowledge the request, and offer escalation.\n\n"
        f"8. **Random/Off-topic Questions & Compliance**:\n"
        f"   - If customer asks about weather, sports, AI, or PAN/RBI/sensitive details: Politely redirect them back to the purpose of the call (debt collection) and NEVER invent or hallucinate sensitive info (like RBI details or account numbers).\n\n"
        f"--- \n\n"
        f"## SPEAKING STYLE RULES\n"
        f"- Speak ONLY in natural, fluent Hinglish (Hindi written in Latin script).\n"
        f"- Keep responses short (1-3 sentences) and conversational. Do not output large paragraphs.\n"
        f"- Avoid any AI-like phrases (\"As an AI\", \"Based on your response\", etc.).\n\n"
        f"--- \n\n"
        f"## OUTPUT FORMAT SPECIFICATION\n"
        f"You must output a valid JSON object. Do not explain reasoning. Do not output anything other than the JSON object.\n"
        f"The JSON object must have the following keys:\n"
        f"1. \"bot_text\": (string) The Hinglish spoken response that the agent will speak to the customer.\n"
        f"2. \"intent\": (string) The closest matching user intent from the QA testing categories.\n"
        f"3. \"state\": (string) The current stage of the conversation (GREETING, AMOUNT_DUE, BANK_NAME, PAYMENT_CONFIRM, CALL_ENDED_SUCCESS, CALL_ENDED_REFUSED, CALL_ENDED_WRONG_NUMBER, CALL_ENDED_UNCLEAR).\n"
        f"4. \"is_terminal\": (boolean) Set to true if the call should end (e.g., call closing, wrong number, refusal, callback scheduled, goodbye), otherwise false."
    )
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "assistant", "content": "Hello, kya meri baat Jitesh Soni se ho rahi hai?"},
        {"role": "user", "content": user_reply}
    ]
    
    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": messages,
        "response_format": {"type": "json_object"},
        "temperature": 0.0
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=6.0)
        print(f"API status code: {response.status_code}")
        if response.status_code == 200:
            print("Response raw content:")
            print(response.json()["choices"][0]["message"]["content"])
        else:
            print("Error response text:")
            print(response.text)
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_direct_api()
