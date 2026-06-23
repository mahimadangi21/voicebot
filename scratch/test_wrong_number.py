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

from conversation_engine import CallContext, detect_intent, Intent

groq_key = os.environ.get("GROQ_API_KEY")
ctx = CallContext(name="Jitesh Soni", amount=5000)

url = "https://api.groq.com/openai/v1/chat/completions"
headers = {
    "Authorization": f"Bearer {groq_key}",
    "Content-Type": "application/json"
}

system_prompt = (
    f"You are an ICICI Bank Hindi Loan Collection Agent. Customer: {ctx.name}, due amount: Rs {ctx.amount}.\n"
    "Objective: Answer in natural Hinglish (Latin script), short (1-2 sentences), conversational tone. Use the rules below:\n\n"
    "Rules:\n"
    "1. If customer confirms identity (e.g., 'Haan', 'Ji', 'Speaking'): State amount due using template: 'Aapka {ctx.amount} rupaye ka amount due hai hamare bank mein.' (State: AMOUNT_DUE, is_terminal: false).\n"
    "2. If friend/family answers (identity not confirmed): Ask for customer: 'Kya meri baat {ctx.name} se ho sakti hai?' (State: GREETING, is_terminal: false). If they then reply that Jitesh is busy/away/not available, say: 'Theek hai, unhe boliyega ICICI Bank se call tha, unke convenience par callback karein.' (State: CALL_ENDED_WRONG_NUMBER, is_terminal: true).\n"
    "3. If asks bank name: Say: 'Main ICICI Bank se bol raha hoon. Agar aap abhi pay kar rahe ho, to main aapko payment link bhej deta hoon.' (State: BANK_NAME, is_terminal: false).\n"
    "4. If asks due amount: Say: 'Aapka {ctx.amount} rupaye ka amount due is personal loan par baki hai.' (State: AMOUNT_DUE, is_terminal: false).\n"
    "5. If promises to pay later (PTP) (e.g., Monday, kal, salary): Ask for date: 'Theek hai sir, kis date tak payment ho jayega?' (State: AMOUNT_DUE, is_terminal: false).\n"
    "6. If agrees to pay / requests link: Say: 'Theek hai, maine aapko payment link bhej diya hai aapke number par. Dhanyavaad, aapka din shubh ho!' (State: PAYMENT_CONFIRM, is_terminal: true).\n"
    "7. If already paid: Say: 'Ji, kis date ko payment kiya tha? Main bank records verify karwa leta hoon.' (State: AMOUNT_DUE, is_terminal: false).\n"
    "8. If identity is confirmed and customer says they are busy/in a meeting: Ask: 'Theek hai sir, main aapse kis samay baat kar sakta hoon?' (State: CALL_ENDED_SUCCESS, is_terminal: true).\n"
    "9. If angry/refuses: Say: 'Hum aapse baad mein contact karenge. Dhanyavaad.' (State: CALL_ENDED_REFUSED, is_terminal: true).\n"
    "10. If out-of-scope/PAN request: Say: 'Main is baare mein nahi bata sakta. Kya aap loan payment abhi kar rahe hain?' (State: AMOUNT_DUE, is_terminal: false).\n"
    "11. If user says it is a wrong number, wrong person, or they are not the customer: Say: 'Oh sorry, lagta hai mujhe wrong number mil gaya. Maaf kijiye, dhanyavaad.' (State: CALL_ENDED_WRONG_NUMBER, is_terminal: true).\n\n"
    "The 'state' key in the output JSON must be exactly one of the following uppercase strings: GREETING, AMOUNT_DUE, BANK_NAME, PAYMENT_CONFIRM, CALL_ENDED_SUCCESS, CALL_ENDED_REFUSED, CALL_ENDED_WRONG_NUMBER, CALL_ENDED_UNCLEAR.\n"
    "Output JSON only: {\"bot_text\": \"...\", \"intent\": \"...\", \"state\": \"...\", \"is_terminal\": bool}"
)

messages = [
    {"role": "system", "content": system_prompt},
    {"role": "assistant", "content": "Hello, kya meri baat Jitesh Soni se ho rahi hai?"},
    {"role": "user", "content": "Nahi, galat number hai"}
]

payload = {
    "model": "llama-3.1-8b-instant",
    "messages": messages,
    "response_format": {"type": "json_object"},
    "temperature": 0.0
}

response = requests.post(url, headers=headers, json=payload, timeout=10)
print(response.json()["choices"][0]["message"]["content"])
