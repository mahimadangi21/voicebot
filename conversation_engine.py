"""
conversation_engine.py
-----------------------
Core state-machine "brain" for the Hindi voice collections bot.

This module is intentionally decoupled from STT/TTS so it can be:
  1. Tested purely as text-in / text-out (fastest to demo to a manager)
  2. Later wired to real STT (speech -> text) and TTS (text -> speech)

Design choice: We use a STATE MACHINE, not a free-form LLM, to control
the bot's own lines. This matters for a collections/finance bot:
  - The bot must say only approved, compliant sentences.
  - The amount/name/bank must be injected exactly, never "hallucinated".
  - Behaviour must be 100% predictable for audits/QA.

We DO use lightweight NLU (intent detection) to understand the *user's*
free-form Hinglish replies ("Ha", "haa bhai", "nahi yrr", "konse bank se").
"""

from dataclasses import dataclass, field
from enum import Enum
import re
import os
import requests
import json
from dotenv import load_dotenv
from datetime import datetime, timedelta

# Load environment variables from .env file if present
load_dotenv()



# ---------------------------------------------------------------------------
# 1. INTENT DETECTION (handles Hinglish variations)
# ---------------------------------------------------------------------------

class Intent(Enum):
    AFFIRM = "affirm"          # haan, ha, ji, yes, theek hai, ok
    DENY = "deny"               # nahi, no, galat number
    ASK_BANK = "ask_bank"        # "konse bank se", "which bank"
    ASK_IDENTITY = "ask_identity" # "aap kaun ho", "who is this", "ye call kisliye hai"
    WRONG_PERSON = "wrong_person" # "wrong number", "galat number", "yeh jitesh nahi hai", "main unka bhai hoon"
    ACKNOWLEDGE = "acknowledge"  # "bataiye", "boliye", "hmmm", "hello"
    ASK_AMOUNT = "ask_amount"    # "kitna baki hai", "balance"
    ALREADY_PAID = "already_paid"# "payment kar diya"
    CALLBACK = "callback"        # "busy", "baad me baat karna"
    ANGRY = "angry"              # "bakwaas band karo"
    ABUSIVE = "abusive"          # idiot, stupid, bad words
    ASK_SENSITIVE = "ask_sensitive" # "pan number", "account number"
    ASK_LINK = "ask_link"        # "link bhejo", "whatsapp bhejo"
    PROMISE_TO_PAY = "promise_to_pay" # "kal karunga", "salary aane do", "monday"
    FINANCIAL_PROBLEM = "financial_problem" # "paise nahi hain", "job chali gayi"
    HUMAN_AGENT = "human_agent"  # manager se baat karao, human chahiye
    OUT_OF_SCOPE = "out_of_scope" # aaj weather kaisa hai, tum robot ho
    SILENCE = "silence"           # user says nothing
    NOISE = "noise"               # hmmmmm, background noise
    ASK_DUE_DATE = "ask_due_date" # payment due date
    WRONG_AMOUNT = "wrong_amount" # 5000 nahi hai, galat amount
    NEGOTIATE = "negotiate"       # discount milega, settlement possible hai
    MAYBE = "maybe"               # dekhta hoon, sochunga
    GOODBYE = "goodbye"           # thank you, bye, good night
    UNCLEAR = "unclear"
    AUDIO_CHECK = "audio_check"  # "awaaz nahi aa rahi", "hello hello", "can you hear me"


# Keyword sets kept simple & explicit on purpose -- easy to extend,
# easy to explain to a non-technical manager, easy to unit test.
AFFIRM_WORDS = {
    "haan", "ha", "han", "haa", "ji", "yes", "y", "theek", "thik",
    "ok", "okay", "bilkul", "sahi", "haanji", "haan ji", "kardo",
    "bhejdo", "bhej do", "kar do", "bhej de", "bhej dena", "bhejye",
    "sure", "confirm", "speaking", "yep", "correct", "main hi", "bol raha",
    "pay", "dunga", "karunga", "pay kar",
    "theek hai", "thik hai", "ok kar do", "ok kardo", "okay kar do", "okay kardo",
    # Devanagari Hindi matches
    "हाँ", "जी", "ठीक", "हां", "हाँजी", "हाँ जी", "भेज दो", "कर दो", "सही",
    "बिल्कुल", "बिलकुल", "ठीक है", "ठिक है", "ओके", "ओके कर दो", "ओके करदो", "हांजी", "हां जी"
}

DENY_WORDS = {
    "nahi", "nahin", "naa", "no", "n", "cancel",
    "mana", "inkar", "reject",
    # Devanagari Hindi matches
    "नहीं", "नही", "ना"
}

BANK_QUESTION_PATTERNS = [
    r"\bkonse?\s*bank\b",
    r"\bkaunse?\s*bank\b",
    r"\bkounse?\s*bank\b",
    r"\bkon\s*sa\s*bank\b",
    r"\bkaun\s*sa\s*bank\b",
    r"\bkoun\s*sa\s*bank\b",
    r"\bkon\s*se\s*bank\b",
    r"\bkaun\s*se\s*bank\b",
    r"\bkoun\s*se\s*bank\b",
    r"\bkis\s*bank\b",
    r"\bwhich\s*bank\b",
    r"\bbank\s*kaunsa?\b",
    r"\bbank\s*kounsa?\b",
    r"\bbank\s*konse?\b",
    r"\bbank\s*se\s*bol\b",
    r"\bicici\b",
    r"\bsbi\b",
    r"\bhdfc\b",
    r"\baxis\b",
    r"\bbank\b",
    # Devanagari matches (ignoring word boundary boundaries since it is unicode)
    r"कौन\s*सा\s*बैंक",
    r"कौन\s*से\s*बैंक",
    r"कौनसा\s*बैंक",
    r"कौनसे\s*बैंक",
    r"किस\s*बैंक",
    r"कौन\s*बैंक",
    r"बैंक"
]

WRONG_PERSON_PATTERNS = [
    r"\bwrong\b",
    r"\brong\b",
    r"\bgalat\b",
    r"\bwrong\s*number\b",
    r"\brong\s*number\b",
    r"\bgalat\s*number\b",
    r"\bgalat\s*insaan\b",
    r"\bgalat\s*banda\b",
    r"\bgalat\s*bande\b",
    r"\bgalat\s*person\b",
    r"गलत\s*नंबर",
    r"गलत\s*नम्बर",
    r"रॉन्ग\s*नंबर",
    r"रॉन्ग\s*नम्बर",
    r"रोंग\s*नंबर",
    r"रोंग\s*नम्बर",
    r"रॉन्ग",
    r"रोंग",
    r"गलत\s*नम्बर",
    r"गलत\s*इंसान",
    r"गलत\s*बंदा",
    r"गलत\s*बंदे",
    r"\byeh\s+jitesh\s+nah?i\s+hai\b",
    r"\bmain\s+unka\s+bhai\b",
    r"\bmain\s+unka\s+friend\b",
    r"\bunka\s+bhai\b",
    r"\bunki\s+wife\b",
    r"\bwife\s+bol\b",
    r"\bpapa\s+bol\b",
    r"\bfriend\s+bol\b",
    r"\bbrother\s+bol\b",
    r"\bmahima\b",
    r"bol\s*rahi\s*hoon",
    r"bol\s*rahi\s*hu",
    r"bol\s*rahi\s*ho",
    # Devanagari Hindi matches
    r"गलत",
    r"यह\s*जितेश\s*नहीं\s*है",
    r"भाई\s*बोल",
    r"पापा\s*बोल",
    r"पत्नी\s*बोल",
    r"दोस्त\s*बोल"
]

ASK_IDENTITY_PATTERNS = [
    r"\baap\s+kaun\b",
    r"\bkaun\s+ho\b",
    r"\bkoun\s+ho\b",
    r"\bkahan\s+se\b",
    r"\bkahāñ\s+se\b",
    r"\bkaunsi\s+company\b",
    r"\bkaun\s+si\s+company\b",
    r"\bkounsi\s+company\b",
    r"\bkya\s+naam\b",
    r"\bnaam\s+kya\b",
    r"\bkiske\s+liye\b",
    r"\bkis\s+liye\b",
    r"\bkya\s+kaam\b",
    r"\bkis\s*liye\s*hai\b",
    r"\bwho\s+is\s+this\b",
    r"\bwho\s+are\s+you\b",
    r"\bji\s+kaun\b",
    r"\bji\s+koun\b",
    # Devanagari
    r"आप\s*कौन",
    r"कौन\s*हो",
    r"कहाँ\s*से",
    r"कहां\s*से",
    r"कौनसी\s*कंपनी",
    r"कौन\s*सी\s*कंपनी",
    r"क्या\s*नाम",
    r"नाम\s*क्या",
    r"किसलिए",
    r"किस\s*लिए",
    r"जी\s*कौन"
]

ASK_AMOUNT_PATTERNS = [
    r"\bkitna\b",
    r"\bkitne\b",
    r"\bkitni\b",
    r"\bpaisa\b",
    r"\bpaise\b",
    r"\bdue\b",
    r"\bbaki\b",
    r"\bbaaki\b",
    r"\bbalance\b",
    r"\bhow\s+much\b",
    r"\bamount\b",
    r"\bemi\b",
    r"\byaad\b",
    # Devanagari
    r"कितना",
    r"कितने",
    r"कितनी",
    r"पैसा",
    r"पैसे",
    r"बाकी",
    r"ड्यू",
    r"ईएमआई",
    r"याद"
]

ALREADY_PAID_PATTERNS = [
    r"\bpay\s+kar\s+diya\b",
    r"\bpayment\s+kar\s+diya\b",
    r"\bpaid\b",
    r"\balready\s+paid\b",
    r"\bde\s+diya\b",
    r"\bbhej\s+diya\b",
    r"\bkar\s+diya\s+hai\b",
    r"\bkal\s+kar\s+diya\b",
    r"\bmorning\s+me\s+kar\s+diya\b",
    # Devanagari
    r"पे\s*कर\s*दिया",
    r"पेमेंट\s*कर\s*दिया",
    r"दे\s*दिया"
]

PROMISE_TO_PAY_PATTERNS = [
    r"\bkal\b",
    r"\bparso\b",
    r"\bparson\b",
    r"\baaj\s+shaam\b",
    r"\bkal\s+subah\b",
    r"\bkal\s+dopahar\b",
    r"\bkal\s+shaam\b",
    r"\bparso\s+subah\b",
    r"\bmonday\b",
    r"\btuesday\b",
    r"\bwednesday\b",
    r"\bthursday\b",
    r"\bfriday\b",
    r"\bsaturday\b",
    r"\bsunday\b",
    r"\bnext\s+week\b",
    r"\bagle\s+hafte\b",
    r"\bagle\s+week\b",
    r"\b2\s+din\s+baad\b",
    r"\b3\s+tareekh\s+ko\b",
    r"\bmahine\s+ke\s+end\s+mein\b",
    r"\bsalary\b",
    r"\bshaam\b",
    r"\bghante\s+baad\b",
    r"\btime\s+do\b",
    r"\bdono\b",
    r"\bkar\s+dunga\b",
    r"\bpayment\s+kar\s+dunga\b",
    r"\bpay\s+karunga\b",
    r"\bjama\s+kar\s+dunga\b",
    r"\btransfer\s+kar\s+dunga\b",
    r"\bpay\s+kar\s+dunga\b",
    r"\bpayment\s+kar\s+dungi\b",
    r"\bpay\s+karungi\b",
    # Devanagari
    r"कल",
    r"परसो",
    r"परसों",
    r"आज\s*शाम",
    r"सैलरी",
    r"सोमवार",
    r"मंगलवार",
    r"बुधवार",
    r"गुरुवार",
    r"शुक्रवार",
    r"शनिवार",
    r"रविवार",
    r"अगले\s*हफ्ते",
    r"शाम",
    r"घंटे\s*बाद",
    r"कर\s*दूंगा",
    r"कर\s*दूंगी",
    r"जमा",
    r"पेमेंट"
]

FINANCIAL_PROBLEM_PATTERNS = [
    r"\bpaise?\s+nah?i\b",
    r"\bjob\s+chali\b",
    r"\bnaukri\b",
    r"\bhospital\b",
    r"\bbimar\b",
    r"\bfinancial\b",
    r"\bmushkil\b",
    r"\bloss\b",
    r"\bnuksan\b",
    # Devanagari
    r"पैसे\s*नहीं",
    r"नौकरी\s*चली",
    r"अस्पताल",
    r"बीमार",
    r"नुकसान",
    r"आर्थिक"
]

CALLBACK_PATTERNS = [
    r"\bbusy\b",
    r"\bmeeting\b",
    r"\bbaad\s+me\b",
    r"\bbaad\s+mein\b",
    r"\bbaje\b",
    r"\btime\b",
    r"\bcall\s+back\b",
    r"\bbaad\s+mai\b",
    r"\bcall\s+later\b",
    r"\blater\b",
    r"\bdriving\b",
    r"\boffice\b",
    # Devanagari
    r"बिजी",
    r"व्यस्त",
    r"मीटिंग",
    r"बाद\s*में",
    r"बजे",
    r"कॉल\s*बैक"
]

ANGRY_PATTERNS = [
    r"\bbakwaas\b",
    r"\bbakwas\b",
    r"\bpareshan\b",
    r"\bpareshān\b",
    r"\bharass\b",
    r"\btameez\b",
    r"\bshutup\b",
    r"\bshut\s+up\b",
    r"\bpareshan\s+mat\b",
    r"\bcall\s+mat\s+karo\b",
    r"\bgussa\s+mat\s+dilao\b",
    r"\bgussa\b",
    # Devanagari
    r"बकवास",
    r"परेशान",
    r"तमीज",
    r"तमीज़"
]

ABUSIVE_PATTERNS = [
    r"\bidiot\b",
    r"\bstupid\b",
    r"\bbadtameez\b",
    r"\bfool\b",
    r"\bnonsense\b",
    r"\bbad\s+words\b",
    r"\babuse\b",
    r"\bfucking\b"
]

HUMAN_AGENT_PATTERNS = [
    r"\bmanager\b",
    r"\bhuman\b",
    r"\brepresentative\b",
    r"\bagent\b",
    r"\bbaat\s+karao\b",
    r"\bbaat\s+karaiye\b",
    r"\bbaat\s+karva\b",
    r"\bconnect\b",
    r"\btransfer\b",
    r"\blive\s+person\b",
    r"\bperson\b",
    # Devanagari
    r"मैनेजर",
    r"ह्यूमन",
    r"एजेंट",
    r"प्रतिनिधि",
    r"बात\s*कराओ",
    r"बात\s*करवाओ",
    r"बात\s*करो",
    r"ट्रांसफर"
]

ASK_SENSITIVE_PATTERNS = [
    r"\bpan\b",
    r"\baccount\b",
    r"\baadhaar\b",
    r"\badhar\b",
    r"\bpersonal\b",
    r"\bdetails\b",
    r"\bcard\b",
    r"\baddress\b",
    r"\bghar\s*ka\s*address\b",
    r"\bpata\s+batao\b",
    r"\brbi\b",
    r"\brbi\s*rule\b",
    r"\bregulatory\b",
    # Devanagari
    r"\u092a\u0948\u0928",
    r"\u0905\u0915\u093e\u0909\u0902\u091f",
    r"\u0906\u0927\u093e\u0930",
    r"\u0930\u093f\u091c\u0930\u094d\u0935\s*\u092c\u0948\u0902\u0915"
]

ASK_LINK_PATTERNS = [
    r"\blink\b",
    r"\bwhatsapp\b",
    r"\bsms\b",
    r"\bqr\b",
    r"\bupi\b",
    r"\bphonepe\b",
    r"\bphone\s*pe\b",
    r"\bgpay\b",
    r"\bgoogle\s*pay\b",
    r"\bpaytm\b",
    r"\bbhejo\b",
    r"\bbhej\b",
    r"\bsend\b",
    # Devanagari
    r"लिंक",
    r"व्हाट्सएप",
    r"व्हाट्सऐप",
    r"एसएमएस",
    r"क्यूआर",
    r"यूपीआई",
    r"भेजो",
    r"भेज"
]

ACKNOWLEDGE_WORDS = {
    "bataiye", "boliye", "hello", "batao", "bolo", "ji boliye", "acha", "achha",
    # Devanagari
    "बताइए", "बोलिए", "हैलो", "हेलो", "बताओ", "बोलो", "अच्छा", "अच्चा"
}

OUT_OF_SCOPE_PATTERNS = [
    r"\bweather\b",
    r"\bmausam\b",
    r"\bmatch\b",
    r"\bjeetega\b",
    r"\bwin\b",
    r"\bai\b",
    r"\brobot\b",
    r"\bbot\b",
    r"\bcomputer\b",
    r"\bseason\b",
    r"\btum\s+ai\b",
    r"\btum\s+robot\b",
    r"\btum\s+bot\b",
    # Devanagari
    r"मौसम",
    r"मैच",
    r"जीतेगा",
    r"रोबोट",
    r"बॉट",
    r"एआई"
]

NOISE_PATTERNS = [
    r"^h+m+$",
    r"^h+m+x*$",
    r"^\.+$",
    r"^background\s*noise$",
    r"^\(background\s*noise\)$",
    r"^\[noise\]$",
    r"^uh+$",
    r"^ah+$",
    r"^\u0939+\u092e\u094d+$"
]

# AUDIO_CHECK: customer is signalling audio is unclear or asking if they can be heard
# This is ACTIVE ENGAGEMENT — must not be treated as silence or unclear intent.
# Resets unclear_retries and triggers identity re-confirmation response.
AUDIO_CHECK_PATTERNS = [
    r"\bawaaz\s*nahi\b",
    r"\baawaz\s*nahi\b",
    r"\bsunaai\s*nahi\b",
    r"\bsunai\s*nahi\b",
    r"\bsuna\s*nahi\b",
    r"\bkya\s+meri\s+awaaz\b",
    r"\bkya\s+aap\s+sun\b",
    r"\bhello\s+hello\b",
    r"\bkya\s+sun\s+pa\b",
    r"\bcan\s+you\s+hear\b",
    r"\bhear\s+me\b",
    r"\baudio\s+theek\b",
    r"\baudio\s+clear\b",
    # Devanagari
    r"\u0906\u0935\u093e\u091c\u093c?\s*\u0928\u0939\u0940\u0902",
    r"\u0938\u0941\u0928\u093e\u0908\s*\u0928\u0939\u0940\u0902",
    r"\u0938\u0941\u0928\u093e\s*\u0928\u0939\u0940\u0902",
    r"\u0915\u094d\u092f\u093e\s*\u092e\u0947\u0930\u0940\s*\u0906\u0935\u093e\u091c\u093c?",
    r"\u0915\u094d\u092f\u093e\s*\u0906\u092a\s*\u0938\u0941\u0928",
    r"\u0939\u0948\u0932\u094b\s*\u0939\u0948\u0932\u094b",
    r"\u0939\u0947\u0932\u094b\s*\u0939\u0947\u0932\u094b"
]

ASK_DUE_DATE_PATTERNS = [
    r"\bdue\s*date\b",
    r"\bkab\s+tak\s+pay\b",
    r"\bkab\s+tak\s+karna\b",
    r"\blast\s+date\b",
    r"\bpayment\s+date\b",
    r"\bdate\s+kya\b",
    r"\bkab\s+karna\s+hai\b",
    r"\bkab\s+bharna\s+hai\b",
    r"\bkab\s+dena\s+hai\b",
    # Devanagari
    r"ड्यू\s*डेट",
    r"कब\s*तक",
    r"अंतिम\s*तिथि",
    r"आखिरी\s*तारीख"
]

WRONG_AMOUNT_PATTERNS = [
    r"\b5000\s*nah?i\b",
    r"\bgalat\s*amount\b",
    r"\bgalat\s*outstanding\b",
    r"\bwrong\s*amount\b",
    r"\bwrong\s*outstanding\b",
    r"\bpaise\s*galat\b",
    r"\bamount\s*galat\b",
    # Devanagari
    r"गलत\s*अमाउंट",
    r"गलत\s*पैसे",
    r"५०००\s*नहीं"
]

NEGOTIATE_PATTERNS = [
    r"\bdiscount\b",
    r"\bsettlement\b",
    r"\bwaiver\b",
    r"\bmaaf\b",
    r"\bhatao\b",
    r"\bkam\s+karo\b",
    r"\bkam\s+kijiye\b",
    r"\bsettle\b",
    r"\bdiscount\s*milega\b",
    r"\binterest\s*hatao\b",
    # Devanagari
    r"डिस्काउंट",
    r"सेटलमेंट",
    r"माफ़",
    r"माफ",
    r"कम\s*करो"
]

MAYBE_PATTERNS = [
    r"\bdekhta\s+hoon\b",
    r"\bdekhti\s+hoon\b",
    r"\bsochunga\b",
    r"\bsochungi\b",
    r"\bsoch\s+ke\s+bata\b",
    r"\bpata\s+nahi\b",
    r"\bshayad\b",
    r"\bmaybe\b",
    r"\bpossibly\b",
    r"\bsochna\s+hai\b",
    r"\bsochta\s+hoon\b",
    r"\bsochti\s+hoon\b",
    r"\bkuch\s+nahi\s+pata\b",
    r"\bconfirm\s+nahi\b",
    r"\babhi\s+nahi\s+bata\s+sakta\b",
    r"\babhi\s+nahi\s+bata\s+sakti\b",
    # Devanagari
    r"देखता\s*हूं",
    r"देखती\s*हूं",
    r"सोचूंगा",
    r"सोचूंगी",
    r"पता\s*नहीं",
    r"शायद",
    r"सोचना\s*है"
]

GOODBYE_PATTERNS = [
    r"\bthank\s*you\b",
    r"\bthanks\b",
    r"\bbye\b",
    r"\bgoodbye\b",
    r"\bgood\s*night\b",
    r"\bgood\s*morning\b",
    r"\bgood\s*evening\b",
    r"\bshubh\s*din\b",
    r"\bdhanyavaad\b",
    r"\bshukriya\b",
    r"\btataa\b",
    r"\bta\s*ta\b",
    r"\balvida\b",
    r"\bthik\s*hai\s*bye\b",
    r"\bphone\s*rakhta\b",
    r"\bphone\s*rakhti\b",
    r"\bphone\s+rakho\b",
    r"\bband\s+karo\b",
    r"\bkhatam\b",
    r"\bdisconnect\b",
    # Devanagari
    r"धन्यवाद",
    r"शुक्रिया",
    r"अलविदा",
    r"बाय",
    r"गुड\s*नाइट",
    r"शुभ\s*दिन"
]

UNCLEAR_PATTERNS = [
    r"\bsamajh\b",
    r"\bawaaz\b",
    r"\baawaz\b",
    r"\bsuna\b",
    r"\bsunai\b",
    r"\bdobara\b",
    r"\brepeat\b",
    r"\bfir\s*se\b",
    r"\bphir\s*se\b",
    r"\bkya\s+bola\b",
    r"\bkya\s+bol\b",
    r"\bkya\s+keh\b",
    # Devanagari matches
    r"समझ",
    r"आवाज़",
    r"आवाज",
    r"सुना",
    r"सुनाई",
    r"दोबारा",
    r"फिर\s*से",
    r"क्या\s*बोला",
    r"क्या\s*कहा"
]

def is_incomplete_thought(text: str) -> bool:
    """
    Checks if a customer utterance is incomplete (e.g. trailing conjunctions,
    fillers, or ending without a clear verb or conclusion).
    """
    cleaned = text.strip().lower()
    if not cleaned:
        return False
        
    # 1. Trailing conjunctions/fillers/prepositions
    # Split ASCII (using \b) and Devanagari (using (?:^|\s)) to avoid unicode word boundary issues
    trailing_ascii = r"\b(lekin|agar|ya|aur|aaur|ki|kyunki|kyonki|yaar|but|if|because|so|then|or|and)\b\s*[.…]*$"
    trailing_devanagari = r"(?:^|\s)(लेकिन|अगर|या|और|कि|क्योंकि|यार)\s*[.…]*$"
    if re.search(trailing_ascii, cleaned) or re.search(trailing_devanagari, cleaned):
        return True

    # 2. Starts with a subordinate conjunction but doesn't end with a clear verb or completion indicator
    subordinate_patterns = [
        r"\b(agar|lekin|kyunki|kyonki|if|but|because)\b",
        r"(?:^|\s)(अगर|लेकिन|क्योंकि)(?:\s|$)"
    ]
    if any(re.search(pat, cleaned) for pat in subordinate_patterns):
        # Common final verbs/helpers/conclusions
        concluding_patterns = [
            r"\b(hai|hain|hoon|hu|ho|tha|thi|the|gaya|gaye|gayi|karo|do|de|bhejo|bhej|bola|bol|boliye|bataiye|rha|raha|rahi|rahe|karunga|karungi|pay|link|karna|karke|rakhta|rakhti|rakho|bye|ok|okay|dhanyavaad|shukriya|alvida)\b\s*[.…]*$",
            r"(है|हैं|हूं|हु|हो|था|थी|थे|गया|गए|गयी|करो|दो|दे|भेजो|भेज|बोला|बोल|बोलिए|बताइए|रहा|रही|रहे|करूंगा|करूंगी|करना|रखता|रखती|रखो|धन्यवाद|शुक्रिया|बाय)\s*[.…]*$"
        ]
        # Also check common future/present verb suffixes (like -unga, -ungi, -ega, -egi, -enge, -ta, -te, -ti)
        suffix_patterns = [
            r"\w+(unga|ungi|ega|egi|enge|ta|te|ti)\b\s*[.…]*$"
        ]
        if not (any(re.search(pat, cleaned) for pat in concluding_patterns) or 
                any(re.search(pat, cleaned) for pat in suffix_patterns)):
            return True
            
    return False


def normalize_relative_date(text: str, anchor_date: datetime = None) -> str | None:
    """
    Normalizes relative date expressions like "kal", "parso", "2 din baad", "next week",
    "Monday", "aaj shaam" to a standard date format like "27 June".
    """
    if anchor_date is None:
        anchor_date = datetime.now()
    
    clean = text.lower().strip()
    if not clean:
        return None

    # 1. aaj / today / aaj shaam / today evening
    if "aaj" in clean or "today" in clean:
        return f"{anchor_date.day} {anchor_date.strftime('%B')}"
        
    # 2. parso / parson / 2 din baad / in 2 days / do din baad / day after tomorrow
    if "parso" in clean or "parson" in clean or "2 din baad" in clean or "do din baad" in clean or "day after tomorrow" in clean:
        dt = anchor_date + timedelta(days=2)
        return f"{dt.day} {dt.strftime('%B')}"
        
    # 3. kal / tomorrow
    # Note: check "kal" after "parso" to avoid matching "kal" inside "parso" or checking "parso" first
    if "kal" in clean or "tomorrow" in clean:
        dt = anchor_date + timedelta(days=1)
        return f"{dt.day} {dt.strftime('%B')}"
        
    # 4. 3 din baad / teen din baad / in 3 days
    if "3 din baad" in clean or "teen din baad" in clean or "in 3 days" in clean:
        dt = anchor_date + timedelta(days=3)
        return f"{dt.day} {dt.strftime('%B')}"
        
    # 5. next week / agle hafte / agle week
    if "next week" in clean or "agle hafte" in clean or "agle week" in clean:
        dt = anchor_date + timedelta(days=7)
        return f"{dt.day} {dt.strftime('%B')}"
        
    # 6. Weekdays mapping
    weekdays_en = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    weekdays_hi = ["somwar", "mangalwar", "budhwar", "guruwar", "shukrawar", "shaniwar", "ravivar"]
    weekdays_hi_alt = ["somvaar", "mangalvaar", "budhvaar", "guruvaar", "shukrawaar", "shaniwaar", "ravivaar"]
    weekdays_hi_dev = ["सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार", "रविवार"]
    
    for i in range(7):
        if (weekdays_en[i] in clean or 
            weekdays_hi[i] in clean or 
            weekdays_hi_alt[i] in clean or 
            weekdays_hi_dev[i] in clean):
            current_weekday = anchor_date.weekday()  # Monday is 0, Sunday is 6
            days_ahead = (i - current_weekday) % 7
            if days_ahead <= 0:
                days_ahead += 7  # If they say "Monday" on a Monday, they mean next Monday
            dt = anchor_date + timedelta(days=days_ahead)
            return f"{dt.day} {dt.strftime('%B')}"
            
    # Check Devanagari relative expressions
    if "परसों" in clean or "परसो" in clean:
        dt = anchor_date + timedelta(days=2)
        return f"{dt.day} {dt.strftime('%B')}"
    if "कल" in clean:
        dt = anchor_date + timedelta(days=1)
        return f"{dt.day} {dt.strftime('%B')}"
        
    return None


def extract_specific_date(text: str, anchor_date: datetime = None) -> str | None:
    """
    Extracts explicit date strings like "15 June", "28 tareekh ko" from the user text.
    """
    if anchor_date is None:
        anchor_date = datetime.now()
        
    clean = text.lower().strip()
    if not clean:
        return None
        
    months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december",
              "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
    months_pattern = "|".join(months)
    
    # 1. Try pattern: 27 June, 27th June, 27 june
    m = re.search(rf"\b(\d{{1,2}})(?:st|nd|rd|th)?\s*({months_pattern})\b", clean)
    if m:
        day = int(m.group(1))
        month_raw = m.group(2)
        full_month = None
        for mon in ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]:
            if mon.startswith(month_raw):
                full_month = mon.capitalize()
                break
        if full_month:
            return f"{day} {full_month}"

    # 2. Try pattern: June 27, June 27th
    m = re.search(rf"\b({months_pattern})\s*(\d{{1,2}})(?:st|nd|rd|th)?\b", clean)
    if m:
        day = int(m.group(2))
        month_raw = m.group(1)
        full_month = None
        for mon in ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]:
            if mon.startswith(month_raw):
                full_month = mon.capitalize()
                break
        if full_month:
            return f"{day} {full_month}"
            
    # 3. Try pattern: 28 tareekh ko, 28 tarikh
    m = re.search(r"\b(\d{1,2})\s*(?:tareekh|tarikh)\b", clean)
    if m:
        day = int(m.group(1))
        if day >= anchor_date.day:
            return f"{day} {anchor_date.strftime('%B')}"
        else:
            # next month
            next_month = anchor_date.month + 1
            year = anchor_date.year
            if next_month > 12:
                next_month = 1
                year += 1
            dt = datetime(year, next_month, 1)
            return f"{day} {dt.strftime('%B')}"
            
    return None


def extract_callback_time(text: str) -> str | None:
    """
    Extracts a specific date or time from the user text if it is present.
    If no specific time is found, or if it is a generic reply, returns None.
    """
    cleaned = text.strip().lower()
    if not cleaned:
        return None
        
    # Check for explicit generic/non-specific callback replies
    invalid_words = {
        "baad mein", "baad me", "baad mai", "theek hai", "thik hai", 
        "dekhenge", "haan", "han", "hmm", "hmmm", "ok", "okay", 
        "yes", "no", "nahi", "nahin", "hello", "hi", "busy", "later"
    }
    if cleaned in invalid_words:
        return None

    time_patterns = [
        r"\d+", # digits
        r"\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b",
        r"\b(ek|do|teen|chaar|paanch|chah|che|saat|aath|nau|das|gyarah|barah)\b",
        r"\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b",
        r"\b(somwar|mangalwar|budhwar|guruwar|veervar|shukrawar|shaniwar|ravivar|som|mangal|budh|guru|shukra|shani|ravi)\b",
        r"(सोमवार|मंगलवार|बुधवार|गुरुवार|वीरवार|शुक्रवार|शनिवार|रविवार)",
        r"\b(baje|pm|am|o'clock|oclock)\b",
        r"(बजे|पीएम|एएम)",
        r"\b(subah|dopahar|dophar|shaam|sham|raat|kal|parso|parson)\b",
        r"(सुबह|दोपहर|शाम|रात|कल|परसों)"
    ]
    
    if any(re.search(pat, cleaned) for pat in time_patterns):
        return text.strip()
        
    return None


def detect_intent_with_confidence(user_text: str, customer_name: str = None) -> tuple[Intent, float]:
    """
    Detects the intent and returns a confidence score.
    If the intent is UNCLEAR, confidence is 0.5. Otherwise, 1.0.
    """
    intent = detect_intent(user_text, customer_name)
    if intent == Intent.UNCLEAR:
        confidence = 0.5
    else:
        confidence = 1.0
    return intent, confidence


def detect_intent(user_text: str, customer_name: str = None) -> Intent:
    """
    NLU (Intent Detection).
    Uses local rule-based keyword and pattern matching.
    """
    text = user_text.strip().lower()

    # 0. Check silence
    if not text or text == "[silence]":
        return Intent.SILENCE

    # 0b. Check noise
    for pattern in NOISE_PATTERNS:
        if re.match(pattern, text):
            return Intent.NOISE

    # 0c. Check AUDIO_CHECK — customer signalling audio is unclear / asking if heard
    # Must be before UNCLEAR so it is not swallowed by the generic unclear bucket
    for pattern in AUDIO_CHECK_PATTERNS:
        if re.search(pattern, text):
            return Intent.AUDIO_CHECK

    # 1. Check sensitive queries
    for pattern in ASK_SENSITIVE_PATTERNS:
        if re.search(pattern, text):
            return Intent.ASK_SENSITIVE

    # 1b. Check angry
    for pattern in ANGRY_PATTERNS:
        if re.search(pattern, text):
            return Intent.ANGRY

    # 1c. Check abusive
    for pattern in ABUSIVE_PATTERNS:
        if re.search(pattern, text):
            return Intent.ABUSIVE

    # 1d. Check human agent escalation
    for pattern in HUMAN_AGENT_PATTERNS:
        if re.search(pattern, text):
            return Intent.HUMAN_AGENT

    # 1e. Check out of scope
    for pattern in OUT_OF_SCOPE_PATTERNS:
        if re.search(pattern, text):
            return Intent.OUT_OF_SCOPE

    # 1f. Check ask due date
    for pattern in ASK_DUE_DATE_PATTERNS:
        if re.search(pattern, text):
            return Intent.ASK_DUE_DATE

    # 1g. Check wrong amount
    for pattern in WRONG_AMOUNT_PATTERNS:
        if re.search(pattern, text):
            return Intent.WRONG_AMOUNT

    # 1h. Check negotiate
    for pattern in NEGOTIATE_PATTERNS:
        if re.search(pattern, text):
            return Intent.NEGOTIATE

    # 1i. Check GOODBYE before MAYBE (thankyou, bye, etc.)
    for pattern in GOODBYE_PATTERNS:
        if re.search(pattern, text):
            return Intent.GOODBYE

    # 1j. Check MAYBE (dekhta hoon, pata nahi, shayad)
    for pattern in MAYBE_PATTERNS:
        if re.search(pattern, text):
            return Intent.MAYBE

    # 2. Check identity questions first (includes "Ji kaun?")
    for pattern in ASK_IDENTITY_PATTERNS:
        if re.search(pattern, text):
            return Intent.ASK_IDENTITY

    # 3. Check bank question specifically
    for pattern in BANK_QUESTION_PATTERNS:
        if re.search(pattern, text):
            return Intent.ASK_BANK

    # 4. Check wrong person / third party
    # Build WRONG_PERSON_PATTERNS dynamically based on customer_name
    first_name = "jitesh"
    is_female = False
    has_mahima = False

    if customer_name:
        name_lower = customer_name.lower().strip()
        first_name = name_lower.split()[0]
        # Detect if female name (e.g. starts with mahima, or we can add other common ones)
        if name_lower.startswith("mahima") or "dangi" in name_lower or name_lower.startswith("kiran") or name_lower.startswith("pooja") or name_lower.startswith("neha"):
            is_female = True
        if "mahima" in name_lower:
            has_mahima = True

    wrong_person_patterns = [
        r"\bwrong\b",
        r"\brong\b",
        r"\bgalat\b",
        r"\bwrong\s*number\b",
        r"\brong\s*number\b",
        r"\bgalat\s*number\b",
        r"\bgalat\s*insaan\b",
        r"\bgalat\s*banda\b",
        r"\bgalat\s*bande\b",
        r"\bgalat\s*person\b",
        r"गलत\s*नंबर",
        r"गलत\s*नम्बर",
        r"रॉन्ग\s*नंबर",
        r"रॉन्ग\s*नम्बर",
        r"रोंग\s*नंबर",
        r"रोंग\s*नम्बर",
        r"रॉन्ग",
        r"रोंग",
        r"गलत\s*नम्बर",
        r"गलत\s*इंसान",
        r"गलत\s*बंदा",
        r"गलत\s*बंदे",
        rf"\byeh\s+{re.escape(first_name)}\s+nah?i\s+hai\b",
        r"\bmain\s+unka\s+bhai\b",
        r"\bmain\s+unka\s+friend\b",
        r"\bunka\s+bhai\b",
        r"\bunki\s+wife\b",
        r"\bwife\s+bol\b",
        r"\bpapa\s+bol\b",
        r"\bfriend\s+bol\b",
        r"\bbrother\s+bol\b",
        # Devanagari Hindi matches
        r"गलत",
        rf"यह\s*{re.escape(first_name)}\s*नहीं\s*है",
        r"भाई\s*बोल",
        r"पापा\s*बोल",
        r"पत्नी\s*बोल",
        r"दोस्त\s*बोल"
    ]

    if not has_mahima:
        wrong_person_patterns.append(r"\bmahima\b")

    if not is_female:
        wrong_person_patterns.extend([
            r"bol\s*rahi\s*hoon",
            r"bol\s*rahi\s*hu",
            r"bol\s*rahi\s*ho"
        ])

    if is_female:
        wrong_person_patterns.extend([
            r"bol\s*raha\s*hoon",
            r"bol\s*raha\s*hu",
            r"bol\s*raha\s*ho"
        ])

    # Name mismatch check
    if customer_name:
        expected_parts = [p.lower() for p in customer_name.split()]
        name_match_patterns = [
            r"(?:main|मैं)\s+([a-zA-Z]+|[\u0900-\u097F]+)\s+(?:bol|hoon|hu|बोल|हूं|हूँ|bolta|bolti|raha|rahi)(?:\s|$|[.,!?])",
            r"(?:mera\s+naam|मेरा\s+नाम)\s+([a-zA-Z]+|[\u0900-\u097F]+)\s+(?:hai|है|he)(?:\s|$|[.,!?])",
            r"([a-zA-Z]+|[\u0900-\u097F]+)\s+(?:bol\s+raha|bol\s+rahi|बोल\s+रहा|बोल\s+रही)(?:\s|$|[.,!?])",
            r"this\s+is\s+([a-zA-Z]+|[\u0900-\u097F]+)(?:\s|$|[.,!?])",
            r"([a-zA-Z]+|[\u0900-\u097F]+)\s+speaking(?:\s|$|[.,!?])"
        ]
        for pat in name_match_patterns:
            m = re.search(pat, text)
            if m:
                extracted = m.group(1).lower().strip()
                if extracted and extracted not in expected_parts and extracted not in ["unka", "uska", "apka", "aapka", "kya", "mera", "mai", "main", "bol"]:
                    return Intent.WRONG_PERSON

    for pattern in wrong_person_patterns:
        if re.search(pattern, text):
            return Intent.WRONG_PERSON

    # 5. Check payment link request
    for pattern in ASK_LINK_PATTERNS:
        if re.search(pattern, text):
            return Intent.ASK_LINK

    # 6. Check callback
    for pattern in CALLBACK_PATTERNS:
        if re.search(pattern, text):
            return Intent.CALLBACK

    # 8. Check already paid
    for pattern in ALREADY_PAID_PATTERNS:
        if re.search(pattern, text):
            return Intent.ALREADY_PAID

    # 8b. Check financial problem
    for pattern in FINANCIAL_PROBLEM_PATTERNS:
        if re.search(pattern, text):
            return Intent.FINANCIAL_PROBLEM

    # 8c. Check promise to pay
    for pattern in PROMISE_TO_PAY_PATTERNS:
        if re.search(pattern, text):
            return Intent.PROMISE_TO_PAY

    # 9. Check ask amount
    # If a deny word is present, we only match if there's also a question word
    has_deny_word = any((word in text if any(ord(c) > 127 for c in word) else re.search(rf"\b{re.escape(word)}\b", text)) for word in DENY_WORDS)
    if has_deny_word:
        question_patterns = [r"kitna", r"kitne", r"kitni", r"how", r"कितना", r"कितने", r"कितनी"]
        has_question = any(re.search(pat, text) for pat in question_patterns)
        if has_question:
            for pattern in ASK_AMOUNT_PATTERNS:
                if re.search(pattern, text):
                    return Intent.ASK_AMOUNT
    else:
        for pattern in ASK_AMOUNT_PATTERNS:
            if re.search(pattern, text):
                return Intent.ASK_AMOUNT

    # 10. Check for unclear overrides
    for pattern in UNCLEAR_PATTERNS:
        if re.search(pattern, text):
            return Intent.UNCLEAR

    # 11. Check acknowledge words
    for word in ACKNOWLEDGE_WORDS:
        if any(ord(c) > 127 for c in word):
            if word in text:
                return Intent.ACKNOWLEDGE
        else:
            if re.search(rf"\b{re.escape(word)}\b", text):
                return Intent.ACKNOWLEDGE

    # 12. Check DENY
    for word in DENY_WORDS:
        if any(ord(c) > 127 for c in word):
            if word in text:
                return Intent.DENY
        else:
            if re.search(rf"\b{re.escape(word)}\b", text):
                return Intent.DENY

    # 13. Check AFFIRM
    for word in AFFIRM_WORDS:
        if any(ord(c) > 127 for c in word):
            if word in text:
                return Intent.AFFIRM
        else:
            if re.search(rf"\b{re.escape(word)}\b", text):
                return Intent.AFFIRM

    return Intent.UNCLEAR


# ---------------------------------------------------------------------------
# 2. CONVERSATION STATES
# ---------------------------------------------------------------------------

class State(Enum):
    GREETING = "greeting"
    GREETING_IDENTITY_ASKED = "greeting_identity_asked"
    ASK_JITESH = "ask_jitesh"
    AMOUNT_DUE = "amount_due"
    BANK_NAME = "bank_name"
    ALREADY_PAID = "already_paid"
    DE_ESCALATE = "de_escalate"
    PAYMENT_CONFIRM = "payment_confirm"
    ASK_PAYMENT_DATE = "ask_payment_date"
    ASK_CALLBACK_TIME = "ask_callback_time"
    CALL_ENDED_SUCCESS = "call_ended_success"
    CALL_ENDED_REFUSED = "call_ended_refused"
    CALL_ENDED_WRONG_NUMBER = "call_ended_wrong_number"
    CALL_ENDED_UNCLEAR = "call_ended_unclear"
    CALL_ENDED_FINANCIAL = "call_ended_financial"
    CALL_ENDED_CALLBACK = "call_ended_callback"
    CALL_ENDED_ESCALATED = "call_ended_escalated"
    DUE_DATE = "due_date"
    WRONG_AMOUNT = "wrong_amount"
    NEGOTIATE = "negotiate"
    REMINDER_ASKED = "reminder_asked"
    CONSEQUENCES_EXPLAINED = "consequences_explained"
    CALL_ENDED_POLITE = "call_ended_polite"


@dataclass
class CallContext:
    """Holds everything specific to one call/person."""
    name: str
    amount: int
    bank_name: str = "ICICI"
    state: State = State.GREETING
    unclear_retries: int = 0
    max_unclear_retries: int = 3  # 3 prompts ≈ 7-9 seconds of patience before ending
    transcript: list = field(default_factory=list)  # for logs / QA
    promise_date: str = ""  # For saving Category 7 payment promise details
    callback_time: str = ""  # For saving Category 12 callback details
    engine: str = "sarvam"
    voice: str = "male"

    def log(self, speaker: str, text: str):
        self.transcript.append((speaker, text))


# ---------------------------------------------------------------------------
# 3. BOT LINES  (Hinglish, written the way people actually talk)
# ---------------------------------------------------------------------------
# Kept in Latin script (Hinglish) since that is what TTS engines like
# gTTS/Google Cloud TTS Hindi voices read naturally for casual phone tone.
# If you want pure Devanagari script for a different TTS engine, this is
# the ONLY section that needs to change.

def line_greeting(ctx: CallContext) -> str:
    return f"Hello, kya meri baat {ctx.name} se ho rahi hai?"

def line_wrong_number() -> str:
    return "Oh sorry, lagta hai mujhe wrong number mil gaya. Maaf kijiye, dhanyavaad."

def line_amount_due(ctx: CallContext) -> str:
    return f"Aapka {ctx.amount} rupaye ka amount due hai hamare bank mein."

def line_bank_name(ctx: CallContext) -> str:
    return (
        f"Main {ctx.bank_name} bank se bol raha hoon. "
        f"Agar aap abhi pay kar rahe ho, to main aapko payment link bhej deta hoon."
    )

def line_payment_sent(ctx: CallContext) -> str:
    return "Theek hai, maine aapko payment link bhej diya hai aapke number par. Dhanyavaad, aapka din shubh ho!"

def line_refused() -> str:
    return "Koi baat nahi, hum aapse dobara contact karenge. Dhanyavaad."

def line_unclear_retry() -> str:
    return "Sorry, main samajh nahi paya. Kya aap haan ya nahi mein bata sakte hain?"

def line_unclear_giveup() -> str:
    return "Theek hai, main baad mein call karta hoon. Dhanyavaad."

def line_fallback_to_amount(ctx: CallContext) -> str:
    """Used if user affirms identity but engine needs to restate amount context."""
    return line_amount_due(ctx)


# ---------------------------------------------------------------------------
# 4. STATE MACHINE TRANSITIONS
# ---------------------------------------------------------------------------

def bot_say(ctx: CallContext) -> str:
    """Returns what the bot should say for the CURRENT state (before user replies)."""
    if ctx.state == State.GREETING:
        text = line_greeting(ctx)
    elif ctx.state == State.GREETING_IDENTITY_ASKED:
        text = (
            f"Main {ctx.bank_name} Bank se bol raha hoon. Yeh call aapke pending personal due amount "
            f"ke payment ke baare mein hai. Kya meri baat {ctx.name} se ho rahi hai?"
        )
    elif ctx.state == State.ASK_JITESH:
        text = f"Achha okay. Kya meri baat {ctx.name} ji se ho sakti hai? Main {ctx.bank_name} Bank se bol raha hoon."
    elif ctx.state == State.AMOUNT_DUE:
        text = line_amount_due(ctx)
    elif ctx.state == State.BANK_NAME:
        text = line_bank_name(ctx)
    elif ctx.state == State.ALREADY_PAID:
        text = "Achha, aapne kab pay kiya tha? Main system mein check kar leta hoon."
    elif ctx.state == State.DE_ESCALATE:
        text = "Maaf kijiye, hum aapko pareshan nahi karna chahte. Agar aap abhi payment nahi kar sakte to koi baat nahi."
    elif ctx.state == State.PAYMENT_CONFIRM:
        text = line_payment_sent(ctx)
    elif ctx.state == State.ASK_PAYMENT_DATE:
        text = "Aap kis date ko pay karenge? Taaki main system mein note kar sakoon."
    elif ctx.state == State.ASK_CALLBACK_TIME:
        text = "Aapko kis samay call karein? Taaki main convenient time note kar sakoon."
    elif ctx.state == State.CALL_ENDED_SUCCESS:
        if ctx.promise_date:
            text = f"Maine aapki payment {ctx.promise_date} ke liye note kar li hai. Kripya usi din payment kar dijiye. Dhanyavaad."
        else:
            text = "Theek hai, maine aapki payment commitment note kar li hai. Kripya usi din payment kar dijiye. Dhanyavaad."
    elif ctx.state == State.CALL_ENDED_CALLBACK:
        text = "Maine aapka convenient callback time note kar liya hai. Hum aapko tabhi call karenge. Dhanyavaad!"
    elif ctx.state == State.CALL_ENDED_WRONG_NUMBER:
        text = line_wrong_number()
    elif ctx.state == State.CALL_ENDED_REFUSED:
        text = line_refused()
    elif ctx.state == State.CALL_ENDED_UNCLEAR:
        text = line_unclear_giveup()
    elif ctx.state == State.CALL_ENDED_FINANCIAL:
        text = "Oh, mujhe sunkar dukh hua. Main samajh sakta hoon ki aap abhi financial problem mein hain. Main system mein mark kar deta hoon ki aap abhi pay nahi kar sakte. Hum aapse baad mein contact karenge. Dhanyavaad, apna khayal rakhiyega."
    elif ctx.state == State.CALL_ENDED_ESCALATED:
        text = "Hum samajh sakte hain. Main aapki call hamare senior representative ya manager ko transfer kar raha hoon. Kripya line par bane rahein. Dhanyavaad."
    elif ctx.state == State.DUE_DATE:
        text = "Aapki payment due date 15 June 2026 hai. Kya main aapko payment link bhej doon?"
    elif ctx.state == State.WRONG_AMOUNT:
        text = f"Hamare bank records ke anusar aapka outstanding amount ₹{ctx.amount} hi hai. Kripya outstanding clear karein taaki koi penalty na lage. Kya main payment link bhej doon?"
    elif ctx.state == State.NEGOTIATE:
        text = "Maaf kijiye, bank policy ke anusar outstanding amount par koi discount, waiver ya settlement possible nahi hai. Aapko poora amount hi pay karna hoga. Kya main payment link bhej doon?"
    elif ctx.state == State.REMINDER_ASKED:
        text = "Theek hai, kya aap chahte hain ki main aapko kal reminder call karoon? Isse aapko payment yaad rahega."
    elif ctx.state == State.CONSEQUENCES_EXPLAINED:
        text = (f"Samajh sakta hoon. Lekin aapko bata dena chahta hoon ki payment na karne par late fees aur "
                f"credit score par asar pad sakta hai. Kya aap kal tak payment kar sakte hain?")
    elif ctx.state == State.CALL_ENDED_POLITE:
        text = "Aapka dhanyavaad! Agar kabhi zaroorat ho to hum yahan hain. Aapka din shubh ho. Alvida!"
    else:
        text = ""
    ctx.log("BOT", text)
    return text


def process_user_reply(ctx: CallContext, user_text: str) -> str:
    """
    Takes the user's spoken reply, updates the session context based on
    the local rule-based state machine, and returns the BOT's next spoken line.
    """
    ctx.log("USER", user_text)

    if is_incomplete_thought(user_text) and not is_call_over(ctx):
        return "[continue_listening]"

    intent, confidence = detect_intent_with_confidence(user_text, ctx.name)

    # Global check for callbacks in non-terminal states
    if intent == Intent.CALLBACK and not is_call_over(ctx) and ctx.state != State.ASK_CALLBACK_TIME:
        # Bypassed in GREETING state if user confirms identity in the same turn
        if ctx.state in {State.GREETING, State.GREETING_IDENTITY_ASKED} and any(word in user_text.lower() for word in ["haan", "ha", "ji", "speaking", "main hi", "bol raha"]):
            intent = Intent.AFFIRM
        else:
            extracted_time = extract_callback_time(user_text)
            if extracted_time:
                ctx.callback_time = extracted_time
                ctx.state = State.CALL_ENDED_CALLBACK
            else:
                ctx.state = State.ASK_CALLBACK_TIME
            ctx.unclear_retries = 0
            return bot_say(ctx)

    # Global check for angry / abusive in non-terminal states
    if intent in {Intent.ANGRY, Intent.ABUSIVE} and not is_call_over(ctx):
        if ctx.state == State.DE_ESCALATE:
            ctx.state = State.CALL_ENDED_REFUSED
        else:
            ctx.state = State.DE_ESCALATE
        ctx.unclear_retries = 0
        return bot_say(ctx)

    # Global check for sensitive queries in non-terminal states
    if intent == Intent.ASK_SENSITIVE and not is_call_over(ctx):
        ctx.state = State.BANK_NAME
        ctx.unclear_retries = 0
        return (
            f"Security reasons ki wajah se main aapka PAN number ya account number call par nahi bata sakta. "
            f"Main {ctx.bank_name} Bank se bol raha hoon. Agar aap pay kar rahe hain to kya main aapko payment link bhej doon?"
        )

    # Global check for human agent request in non-terminal states
    if intent == Intent.HUMAN_AGENT and not is_call_over(ctx):
        ctx.state = State.CALL_ENDED_ESCALATED
        ctx.unclear_retries = 0
        return bot_say(ctx)

    # Global check for WRONG_PERSON intent in non-terminal states
    # Explicit wrong-number statements bypass retries entirely and terminate the call immediately
    if intent == Intent.WRONG_PERSON and not is_call_over(ctx):
        ctx.state = State.CALL_ENDED_WRONG_NUMBER
        ctx.unclear_retries = 0
        return bot_say(ctx)

    # Global check for AUDIO_CHECK intent in non-terminal states
    # Customer is signalling audio is unclear or asking if they can be heard.
    # This is ACTIVE ENGAGEMENT — reset unclear counter, answer with identity +
    # re-confirmation, and do NOT advance to end-call or unclear path.
    if intent == Intent.AUDIO_CHECK and not is_call_over(ctx):
        ctx.unclear_retries = 0  # Reset — this was a real response, not silence
        text = (
            f"Sorry for that, main {ctx.bank_name} Bank se bol raha hoon "
            f"aapke pending due amount ke baare mein. "
            f"Kya ab meri awaaz aapko clearly aa rahi hai?"
        )
        ctx.log("BOT", text)
        return text

    # Global check for silence in non-terminal states
    if intent == Intent.SILENCE and not is_call_over(ctx):
        ctx.unclear_retries += 1
        if ctx.unclear_retries > ctx.max_unclear_retries:
            ctx.state = State.CALL_ENDED_UNCLEAR
            text = "Lagta hai hamari aawaz nahi pahunch rahi hai. Hum aapse baad mein contact karenge. Dhanyavaad."
            ctx.log("BOT", text)
            return text
        else:
            text = "Hello? Kya aapko meri aawaz aa rahi hai? Kripya bataiye."
            ctx.log("BOT", text)
            return text

    # Global check for noise in non-terminal states
    if intent == Intent.NOISE and not is_call_over(ctx):
        ctx.unclear_retries += 1
        if ctx.unclear_retries > ctx.max_unclear_retries:
            ctx.state = State.CALL_ENDED_UNCLEAR
            text = "Lagta hai network kharab hai. Hum aapse baad mein contact karenge. Dhanyavaad."
            ctx.log("BOT", text)
            return text
        else:
            text = "Sorry, main aapki aawaz theek se nahi sun paya. Kya aap kripya repeat kar sakte hain?"
            ctx.log("BOT", text)
            return text

    # Global check for out of scope queries in non-terminal states
    if intent == Intent.OUT_OF_SCOPE and not is_call_over(ctx):
        text = "Maaf kijiye, main ek automated due amount recovery assistant hoon. Main sirf aapke pending due amount ke baare mein hi bata sakta hoon. Kripya due amount payment ke baare mein bataiye."
        ctx.log("BOT", text)
        return text

    # Global check for wrong amount dispute in non-terminal states
    if intent == Intent.WRONG_AMOUNT and not is_call_over(ctx):
        ctx.state = State.WRONG_AMOUNT
        ctx.unclear_retries = 0
        return bot_say(ctx)

    # Global check for negotiation/discount in non-terminal states
    if intent == Intent.NEGOTIATE and not is_call_over(ctx):
        ctx.state = State.NEGOTIATE
        ctx.unclear_retries = 0
        return bot_say(ctx)

    # Global check for due date question in non-terminal states
    if intent == Intent.ASK_DUE_DATE and not is_call_over(ctx):
        ctx.state = State.DUE_DATE
        ctx.unclear_retries = 0
        return bot_say(ctx)

    # Global check for bank name question in non-terminal states
    if intent == Intent.ASK_BANK and not is_call_over(ctx):
        ctx.state = State.BANK_NAME
        ctx.unclear_retries = 0
        return bot_say(ctx)

    # Global check for amount due question in non-terminal states
    if intent == Intent.ASK_AMOUNT and not is_call_over(ctx):
        ctx.state = State.AMOUNT_DUE
        ctx.unclear_retries = 0
        return bot_say(ctx)

    # Global MAYBE check: customer says "dekhta hoon", "pata nahi", "shayad"
    if intent == Intent.MAYBE and not is_call_over(ctx):
        ctx.state = State.REMINDER_ASKED
        ctx.unclear_retries = 0
        return bot_say(ctx)

    # Global GOODBYE check: customer says "thank you", "bye", "shukriya"
    if intent == Intent.GOODBYE and not is_call_over(ctx):
        ctx.state = State.CALL_ENDED_POLITE
        ctx.unclear_retries = 0
        return bot_say(ctx)

    # Rule 4: If confidence on intent classification is below 90%, do not advance state
    if confidence < 0.9 and not is_call_over(ctx):
        return _handle_unclear(ctx, ctx.state)

    # Global PROMISE_TO_PAY check
    if intent == Intent.PROMISE_TO_PAY and not is_call_over(ctx):
        normalized_date = normalize_relative_date(user_text) or extract_specific_date(user_text)
        if normalized_date:
            ctx.promise_date = normalized_date
            ctx.state = State.CALL_ENDED_SUCCESS
        else:
            ctx.state = State.ASK_PAYMENT_DATE
        ctx.unclear_retries = 0
        return bot_say(ctx)

    # State machine logic
    if ctx.state == State.GREETING or ctx.state == State.GREETING_IDENTITY_ASKED:
        if intent == Intent.ASK_IDENTITY or intent == Intent.ASK_BANK:
            ctx.state = State.GREETING_IDENTITY_ASKED
            ctx.unclear_retries = 0
            return bot_say(ctx)
        elif intent == Intent.ASK_AMOUNT:
            # They want to know the amount -> implicit affirmation of identity
            ctx.state = State.AMOUNT_DUE
            ctx.unclear_retries = 0
            return bot_say(ctx)
        elif intent == Intent.ASK_LINK:
            # They want the link -> implicit affirmation of identity, go to AMOUNT_DUE first to disclose details securely
            ctx.state = State.AMOUNT_DUE
            ctx.unclear_retries = 0
            return bot_say(ctx)
        elif intent == Intent.FINANCIAL_PROBLEM:
            ctx.state = State.CALL_ENDED_FINANCIAL
            ctx.unclear_retries = 0
            return bot_say(ctx)
        elif intent == Intent.PROMISE_TO_PAY:
            normalized_date = normalize_relative_date(user_text) or extract_specific_date(user_text)
            if normalized_date:
                ctx.promise_date = normalized_date
                ctx.state = State.CALL_ENDED_SUCCESS
            else:
                ctx.state = State.ASK_PAYMENT_DATE
            ctx.unclear_retries = 0
            return bot_say(ctx)
        elif intent == Intent.AFFIRM or intent == Intent.ACKNOWLEDGE:
            ctx.state = State.AMOUNT_DUE
            ctx.unclear_retries = 0
            return bot_say(ctx)
        elif intent == Intent.DENY or intent == Intent.WRONG_PERSON:
            ctx.state = State.ASK_JITESH
            ctx.unclear_retries = 0
            return bot_say(ctx)
        else:
            return _handle_unclear(ctx, retry_state=ctx.state)

    elif ctx.state == State.ASK_JITESH:
        if intent == Intent.AFFIRM or intent == Intent.ACKNOWLEDGE:
            ctx.state = State.GREETING
            ctx.unclear_retries = 0
            return bot_say(ctx)
        elif intent == Intent.DENY or intent == Intent.WRONG_PERSON:
            ctx.state = State.CALL_ENDED_WRONG_NUMBER
            ctx.unclear_retries = 0
            return bot_say(ctx)
        else:
            return _handle_unclear(ctx, retry_state=State.ASK_JITESH)

    elif ctx.state == State.AMOUNT_DUE or ctx.state == State.DE_ESCALATE:
        if intent == Intent.ASK_IDENTITY or intent == Intent.ASK_BANK:
            ctx.state = State.BANK_NAME
            ctx.unclear_retries = 0
            return bot_say(ctx)
        elif intent == Intent.ALREADY_PAID:
            ctx.state = State.ALREADY_PAID
            ctx.unclear_retries = 0
            return bot_say(ctx)
        elif intent == Intent.FINANCIAL_PROBLEM:
            ctx.state = State.CALL_ENDED_FINANCIAL
            ctx.unclear_retries = 0
            return bot_say(ctx)
        elif intent == Intent.PROMISE_TO_PAY:
            normalized_date = normalize_relative_date(user_text) or extract_specific_date(user_text)
            if normalized_date:
                ctx.promise_date = normalized_date
                ctx.state = State.CALL_ENDED_SUCCESS
            else:
                ctx.state = State.ASK_PAYMENT_DATE
            ctx.unclear_retries = 0
            return bot_say(ctx)
        elif intent == Intent.ASK_LINK:
            ctx.state = State.PAYMENT_CONFIRM
            ctx.unclear_retries = 0
            return bot_say(ctx)
        elif intent == Intent.AFFIRM or intent == Intent.ACKNOWLEDGE:
            user_text_lower = user_text.lower()
            link_keywords = ["link", "bhej", "send", "whatsapp", "sms", "message", "qr", "upi", "paytm", "gpay", "phonepe"]
            if any(kw in user_text_lower for kw in link_keywords):
                ctx.state = State.PAYMENT_CONFIRM
            else:
                ctx.state = State.BANK_NAME
            ctx.unclear_retries = 0
            return bot_say(ctx)
        elif intent == Intent.DENY:
            ctx.state = State.CALL_ENDED_REFUSED
            ctx.unclear_retries = 0
            return bot_say(ctx)
        else:
            return _handle_unclear(ctx, retry_state=ctx.state)

    elif ctx.state == State.BANK_NAME:
        if intent == Intent.AFFIRM or intent == Intent.ACKNOWLEDGE or intent == Intent.ASK_LINK:
            ctx.state = State.PAYMENT_CONFIRM
            ctx.unclear_retries = 0
            return bot_say(ctx)
        elif intent == Intent.DENY:
            ctx.state = State.CALL_ENDED_REFUSED
            ctx.unclear_retries = 0
            return bot_say(ctx)
        else:
            return _handle_unclear(ctx, retry_state=State.BANK_NAME)

    elif ctx.state == State.ALREADY_PAID:
        ctx.state = State.CALL_ENDED_SUCCESS
        ctx.unclear_retries = 0
        return bot_say(ctx)

    elif ctx.state == State.ASK_PAYMENT_DATE:
        normalized_date = normalize_relative_date(user_text) or extract_specific_date(user_text)
        ctx.promise_date = normalized_date if normalized_date else ""
        ctx.state = State.CALL_ENDED_SUCCESS
        ctx.unclear_retries = 0
        return bot_say(ctx)

    elif ctx.state == State.ASK_CALLBACK_TIME:
        extracted_time = extract_callback_time(user_text)
        if extracted_time:
            ctx.callback_time = extracted_time
            ctx.state = State.CALL_ENDED_CALLBACK
            ctx.unclear_retries = 0
            return bot_say(ctx)
        else:
            # politely ask again, do not update state/variables
            return "Theek hai. Aapko kis samay call karna zyada convenient rahega?"

    elif ctx.state == State.DUE_DATE:
        if intent == Intent.AFFIRM or intent == Intent.ACKNOWLEDGE or intent == Intent.ASK_LINK:
            ctx.state = State.PAYMENT_CONFIRM
            ctx.unclear_retries = 0
            return bot_say(ctx)
        elif intent == Intent.DENY:
            ctx.state = State.CALL_ENDED_REFUSED
            ctx.unclear_retries = 0
            return bot_say(ctx)
        else:
            return _handle_unclear(ctx, retry_state=State.DUE_DATE)

    elif ctx.state == State.WRONG_AMOUNT:
        if intent == Intent.AFFIRM or intent == Intent.ACKNOWLEDGE or intent == Intent.ASK_LINK:
            ctx.state = State.PAYMENT_CONFIRM
            ctx.unclear_retries = 0
            return bot_say(ctx)
        elif intent == Intent.DENY:
            ctx.state = State.CALL_ENDED_REFUSED
            ctx.unclear_retries = 0
            return bot_say(ctx)
        else:
            return _handle_unclear(ctx, retry_state=State.WRONG_AMOUNT)

    elif ctx.state == State.NEGOTIATE:
        if intent == Intent.AFFIRM or intent == Intent.ACKNOWLEDGE or intent == Intent.ASK_LINK:
            ctx.state = State.PAYMENT_CONFIRM
            ctx.unclear_retries = 0
            return bot_say(ctx)
        elif intent == Intent.DENY:
            ctx.state = State.CALL_ENDED_REFUSED
            ctx.unclear_retries = 0
            return bot_say(ctx)
        else:
            return _handle_unclear(ctx, retry_state=State.NEGOTIATE)

    elif ctx.state == State.REMINDER_ASKED:
        if intent == Intent.AFFIRM or intent == Intent.ACKNOWLEDGE:
            # Customer wants a reminder -> log promise and close
            ctx.state = State.CALL_ENDED_CALLBACK
            ctx.callback_time = "kal"
            ctx.unclear_retries = 0
            return bot_say(ctx)
        elif intent == Intent.DENY:
            # Customer says no reminder needed -> explain consequences
            ctx.state = State.CONSEQUENCES_EXPLAINED
            ctx.unclear_retries = 0
            return bot_say(ctx)
        else:
            return _handle_unclear(ctx, retry_state=State.REMINDER_ASKED)

    elif ctx.state == State.CONSEQUENCES_EXPLAINED:
        if intent == Intent.AFFIRM or intent == Intent.ACKNOWLEDGE or intent == Intent.ASK_LINK:
            ctx.state = State.PAYMENT_CONFIRM
            ctx.unclear_retries = 0
            return bot_say(ctx)
        elif intent == Intent.DENY or intent == Intent.MAYBE:
            # Persistent refusal -> close professionally
            ctx.state = State.CALL_ENDED_REFUSED
            ctx.unclear_retries = 0
            return bot_say(ctx)
        elif intent == Intent.PROMISE_TO_PAY:
            normalized_date = normalize_relative_date(user_text) or extract_specific_date(user_text)
            ctx.promise_date = normalized_date if normalized_date else ""
            ctx.state = State.CALL_ENDED_SUCCESS
            ctx.unclear_retries = 0
            return bot_say(ctx)
        else:
            return _handle_unclear(ctx, retry_state=State.CONSEQUENCES_EXPLAINED)

    # Terminal states: nothing more to process
    return ""


def _handle_unclear(ctx: CallContext, retry_state: State) -> str:
    ctx.unclear_retries += 1
    if ctx.unclear_retries > ctx.max_unclear_retries:
        ctx.state = State.CALL_ENDED_UNCLEAR
        return bot_say(ctx)
    text = "Sorry, aapne kya kaha, dobara bata sakte hain?"
    ctx.log("BOT", text)
    return text


def is_call_over(ctx: CallContext) -> bool:
    return ctx.state in {
        State.PAYMENT_CONFIRM,
        State.CALL_ENDED_SUCCESS,
        State.CALL_ENDED_REFUSED,
        State.CALL_ENDED_WRONG_NUMBER,
        State.CALL_ENDED_UNCLEAR,
        State.CALL_ENDED_FINANCIAL,
        State.CALL_ENDED_CALLBACK,
        State.CALL_ENDED_ESCALATED,
        State.CALL_ENDED_POLITE,
    }


def call_succeeded(ctx: CallContext) -> bool:
    return ctx.state == State.PAYMENT_CONFIRM
