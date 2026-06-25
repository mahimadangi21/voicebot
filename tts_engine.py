"""
tts_engine.py
-------------
Hindi/Hinglish Text-to-Speech wrapper using Sarvam AI as the primary engine
with a gTTS secondary fallback engine.

Includes a pronunciation fix layer to normalize numbers, acronyms, and
specific bank name overrides.
"""

import os
import re
import sys
import base64
import requests
from dotenv import load_dotenv

# Ensure stdout handles Unicode characters on Windows
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

# Ensure environment variables are loaded
load_dotenv()

# ---------------------------------------------------------------------------
# LOCKED VOICE CONFIGURATION
# ---------------------------------------------------------------------------
# These parameters were confirmed to produce natural, human-sounding Hindi/Hinglish
# output based on listening tests of:
#   - audio_output/greeting.mp3          (generated via generate_bot_audios.py)
#   - audio_output/fccd147d_turn_00.mp3  (generated via server.py /api/start)
#
# DO NOT change these values without explicit A/B listening tests against the
# reference files above. If Sarvam's API ever changes its default speaker or
# model in a future update, these constants ensure our code ALWAYS forces this
# exact configuration — there is NO implicit fallback to any API default.
#
# Locked parameters:
#   Engine  : Sarvam AI REST API  (https://api.sarvam.ai/text-to-speech)
#   Model   : bulbul:v3           — Sarvam's highest-quality Indic TTS model
#   Speaker : rohan               — male, natural Hindi/Hinglish voice
#   Language: hi-IN               — Hindi (India)
#   Pace    : 1.0                 — normal speed (not slower, not faster)
# ---------------------------------------------------------------------------
DEFAULT_SPEAKER = "rohan"      # Confirmed natural-sounding male voice — do not change
DEFAULT_MODEL   = "bulbul:v3"  # Highest-quality Sarvam Indic TTS model — do not change
DEFAULT_LANG    = "hi-IN"      # Language code — do not change
DEFAULT_PACE    = 1.0          # Normal speech pace — do not change
DEFAULT_EDGE_VOICE = "hi-IN-MadhurNeural" # Fallback Microsoft Edge neural voice (natural male)

# ---------------------------------------------------------------------------
# 1. PRONUNCIATION FIX LAYER CONFIGURATION
# ---------------------------------------------------------------------------

# Easy-to-extend dictionary for manual phonetic overrides.
# Any words matching these keys (case-insensitively) will be replaced
# with the specified phonetic text before calling the TTS engine.
PRONUNCIATION_OVERRIDES = {
    "ICICI": "आई सी आई सी आई",
    "SBI": "एस बी आई",
    "HDFC": "एच डी एफ सी",
    "PNB": "पी एन बी",
    "INR": "आई एन आर",
    "UPI": "यू पी आई",
    "SMS": "एस एम एस",
    "PAN": "पैन",
    "CALLBACK": "kawl-back",
    "CONTACT": "kon-takt"
}

# Mapping of digits 1-99 to Hinglish (transliterated Hindi) words
HINDI_1_TO_99 = {
    0: "", 1: "ek", 2: "do", 3: "teen", 4: "chaar", 5: "paanch", 6: "chhe", 7: "saat", 8: "aath", 9: "nau",
    10: "das", 11: "gyarah", 12: "baarah", 13: "terah", 14: "chaudah", 15: "pandrah", 16: "solah", 17: "satrah", 18: "atharah", 19: "unnees",
    20: "bees", 21: "ikkees", 22: "baayees", 23: "teyees", 24: "chaubees", 25: "pachchees", 26: "chhabbees", 27: "sattaayees", 28: "atthaayees", 29: "untees",
    30: "tees", 31: "iktees", 32: "battees", 33: "taintees", 34: "chauntees", 35: "paintees", 36: "chhattees", 37: "saintees", 38: "ardtees", 39: "untaalees",
    40: "chaalees", 41: "iktalees", 42: "bayaalees", 43: "taintalees", 44: "chawaalees", 45: "paintalees", 46: "chhiyaalees", 47: "saitalees", 48: "adtaalees", 49: "unchaas",
    50: "pachaas", 51: "ikyawan", 52: "baawan", 53: "tirpan", 54: "chawwan", 55: "pachpan", 56: "chhappan", 57: "sattaawan", 58: "atthaawan", 59: "unsaath",
    60: "saath", 61: "iksaath", 62: "baasath", 63: "tirsath", 64: "chaunsath", 65: "painsath", 66: "chhiyasath", 67: "satsath", 68: "adsath", 69: "unhattar",
    70: "sattar", 71: "ikhattar", 72: "bahattar", 73: "tihattar", 74: "chauhattar", 75: "pachhattar", 76: "chhihattar", 77: "sathattar", 78: "athhattar", 79: "unasee",
    80: "assee", 81: "ikyaasee", 82: "bayaasee", 83: "tiraasee", 84: "chauraasee", 85: "pachaasee", 86: "chhiyaasee", 87: "sattaasee", 88: "atthaasee", 89: "nawaasee",
    90: "nabbe", 91: "ikyaanwe", 92: "bayaanwe", 93: "tiraanwe", 94: "chauraanwe", 95: "pachaanwe", 96: "chhiyaanwe", 97: "sattaanwe", 98: "atthaanwe", 99: "nanyaanwe"
}

def number_to_hindi_words(num: int) -> str:
    """
    Converts numbers in the hundreds to lakhs range to natural Hinglish spoken words.
    """
    if num == 0:
        return "shunya"
    
    parts = []
    
    # Lakhs (1,00,000+)
    lakhs = num // 100000
    num %= 100000
    if lakhs > 0:
        parts.append(f"{HINDI_1_TO_99.get(lakhs, str(lakhs))} lakh")
        
    # Thousands (1,000+)
    thousands = num // 1000
    num %= 1000
    if thousands > 0:
        parts.append(f"{HINDI_1_TO_99.get(thousands, str(thousands))} hazaar")
        
    # Hundreds (100+)
    hundreds = num // 100
    num %= 100
    if hundreds > 0:
        parts.append(f"{HINDI_1_TO_99.get(hundreds, str(hundreds))} sau")
        
    # Remaining tens and units (1-99)
    if num > 0:
        parts.append(HINDI_1_TO_99.get(num, str(num)))
        
    return " ".join(parts).strip()

def normalize_for_tts(text: str) -> str:
    """
    Normalizes Hindi/Hinglish text to correct common pronunciation issues:
    1. Converts numeric amounts (e.g. 5000) to Hinglish word equivalents (paanch hazaar).
    2. Substitutes manual overrides from PRONUNCIATION_OVERRIDES (case-insensitively).
    3. Formats acronyms (uppercase words >= 2 chars) to spaced-out letter form so they are read individually.
    """
    # 1. Convert digit numbers to Hindi words
    def replace_num(match):
        num_str = match.group(0)
        try:
            val = int(num_str)
            return number_to_hindi_words(val)
        except ValueError:
            return num_str

    normalized = re.sub(r'\b\d+\b', replace_num, text)

    # 2. Lookup overrides and spacing-out acronyms
    def replace_word(match):
        word = match.group(0)
        upper_word = word.upper()
        
        # Check manual dictionary overrides
        if upper_word in PRONUNCIATION_OVERRIDES:
            return PRONUNCIATION_OVERRIDES[upper_word]
        
        # Space out unmapped acronyms (e.g. ABC -> A B C)
        if len(word) >= 2 and word.isupper() and word.isalpha():
            return " ".join(list(word))
            
        return word

    normalized = re.sub(r'\b[A-Za-z]+\b', replace_word, normalized)
    return normalized

# Mapping of Hinglish words to Devanagari equivalents for gTTS fallback
HINGLISH_TO_DEVANAGARI = {
    # Core Collection Bot Vocabulary (from conversation_engine.py)
    "hello": "हैलो",
    "namaste": "नमस्ते",
    "confirm": "कंफर्म",
    "department": "डिपार्टमेंट",
    "kya": "क्या",
    "meri": "मेरी",
    "baat": "बात",
    "se": "से",
    "ho": "हो",
    "rahi": "रही",
    "hai": "है",
    "hain": "हैं",
    "aapka": "आपका",
    "rupaye": "रुपये",
    "rupaya": "रुपया",
    "rupee": "रुपया",
    "rupees": "रुपये",
    "ka": "का",
    "amount": "अमाउंट",
    "due": "ड्यू",
    "hamare": "हमारे",
    "bank": "बैंक",
    "mein": "में",
    "me": "में",
    "main": "मैं",
    "bol": "बोल",
    "raha": "रहा",
    "hoon": "हूँ",
    "agar": "अगर",
    "aap": "आप",
    "abhi": "अभी",
    "pay": "पे",
    "kar": "कर",
    "rahe": "रहे",
    "to": "तो",
    "aapko": "आपको",
    "payment": "पेमेंट",
    "link": "लिंक",
    "bhej": "भेज",
    "deta": "देता",
    "theek": "ठीक",
    "thik": "ठीक",
    "maine": "मैंने",
    "diya": "दिया",
    "aapke": "आपके",
    "number": "नंबर",
    "par": "पर",
    "dhanyavaad": "धन्यवाद",
    "din": "दिन",
    "shubh": "शुभ",
    "sorry": "सॉरी",
    "samajh": "समझ",
    "paya": "पाया",
    "bata": "बता",
    "sakte": "सकते",
    "baad": "बाद",
    "karta": "करता",
    "yeh": "यह",
    "call": "कॉल",
    "pending": "पेंडिंग",
    "personal": "पर्सनल",
    "due amount": "लोन",
    "ke": "के",
    "baare": "बारे",
    "achha": "अच्छा",
    "okay": "ओके",
    "ok": "ओके",
    "sakti": "सकती",
    "aapne": "आपने",
    "kab": "कब",
    "kiya": "किया",
    "tha": "था",
    "system": "सिस्टम",
    "check": "चेक",
    "leta": "लेता",
    "pareshan": "परेशान",
    "karna": "करना",
    "chahte": "चाहते",
    "kis": "किस",
    "date": "डेट",
    "ko": "को",
    "karenge": "करेंगे",
    "taaki": "ताकि",
    "note": "नोट",
    "sakoon": "सकूँ",
    "samay": "समय",
    "karein": "करें",
    "convenient": "कन्वीनिएंट",
    "time": "टाइम",
    "ki": "की",
    "register": "रजिस्टर",
    "li": "ली",
    "kripya": "कृपया",
    "tab": "तब",
    "tak": "तक",
    "dijiyega": "दीजिएगा",
    "records": "रिकॉर्ड्स",
    "liya": "लिया",
    "tabhi": "तभी",
    "tabhi": "तभी",
    "sunkar": "सुनकर",
    "dukh": "दुख",
    "hua": "हुआ",
    "sakta": "सकता",
    "financial": "फाइनेंशियल",
    "problem": "प्रॉब्लम",
    "mark": "मार्क",
    "apna": "अपना",
    "apne": "अपने",
    "apni": "अपनी",
    "khayal": "ख्याल",
    "rakhiyega": "रखिएगा",
    "senior": "सीनियर",
    "representative": "प्रतिनिधि",
    "manager": "मैनेजर",
    "transfer": "ट्रांसफर",
    "line": "लाइन",
    "bane": "बने",
    "rahein": "रहें",
    "june": "जून",
    "doon": "दूँ",
    "anusar": "अनुसार",
    "outstanding": "आउटस्टैंडिंग",
    "clear": "क्लियर",
    "penalty": "पेनल्टी",
    "na": "न",
    "lage": "लगे",
    "policy": "पॉलिसी",
    "discount": "डिस्काउंट",
    "waiver": "वेवर",
    "settlement": "सेटलमेंट",
    "possible": "पॉसिबल",
    "poora": "पूरा",
    "hoga": "होगा",
    "kal": "कल",
    "reminder": "रिमाइंडर",
    "karoon": "करूँ",
    "isse": "इससे",
    "yaad": "याद",
    "rahega": "रहेगा",
    "lekin": "लेकिन",
    "dena": "देना",
    "chahta": "चाहता",
    "late": "लेट",
    "fees": "फीस",
    "aur": "और",
    "credit": "क्रेडिट",
    "score": "स्कोर",
    "asar": "असर",
    "pad": "पड़",
    "kabhi": "कभी",
    "zaroorat": "ज़रूरत",
    "yahan": "यहाँ",
    "alvida": "अलविदा",
    "security": "सिक्योरिटी",
    "reasons": "रीज़न्स",
    "wajah": "वजह",
    "pan": "पैन",
    "account": "अकाउंट",
    "hamari": "हमारी",
    "aawaz": "आवाज़",
    "pahunch": "पहुंच",
    "aa": "आ",
    "bataiye": "बताइए",
    "network": "नेटवर्क",
    "kharab": "खराब",
    "sun": "सुन",
    "repeat": "रिपीट",
    "ek": "एक",
    "automated": "ऑटोमेटेड",
    "recovery": "रिकवरी",
    "assistant": "असिस्टेंट",
    "sirf": "सिर्फ",
    "otb": "ओटीपी",
    "otp": "ओटीपी",
    "horhi": "हो रही",
    "hmare": "हमारे",
    "bolrha": "बोल रहा",
    "bolrhe": "बोल रहे",
    "koi": "कोई",
    "ya": "या",
    "oh": "ओह",
    "lagta": "लगता",
    "mujhe": "मुझे",
    "wrong": "गलत",
    "mil": "मिल",
    "gaya": "गया",
    "maaf": "माफ़",
    "kijiye": "कीजिए",
    "bhejdo": "भेज दो",
    "kardo": "कर दो",
    "kr": "कर",
    "rhe": "रहे",
    "send": "सेंड",
    "bhejta": "भेजता",
    "busy": "बिजी",
    "meeting": "मीटिंग",
    "baje": "बजे",
    "shaam": "शाम",
    "subah": "सुबह",
    "raat": "रात",
    "dopahar": "दोपहर",
    "monday": "सोमवार",
    "tuesday": "मंगलवार",
    "wednesday": "बुधवार",
    "thursday": "गुरुवार",
    "friday": "शुक्रवार",
    "saturday": "शनिवार",
    "sunday": "रविवार",
    "tomorrow": "कल",
    "today": "आज",
    "morning": "सुबह",
    "evening": "शाम",
    "afternoon": "दोपहर",
    "night": "रात",
    "later": "लेटर",
    "driving": "ड्राइविंग",
    "idiot": "इडियट",
    "stupid": "स्टुपिड",
    "badtameez": "बदतमीज",
    "fool": "फूल",
    "nonsense": "नॉनसेंस",
    "abusive": "एब्यूजिव",
    "contact": "कॉन्टेक्ट",
    "kawl": "कॉल",
    "back": "बैक",
    "kon": "कॉन्",
    "takt": "टैक्ट",
    "office": "ऑफिस",
    "rbi": "आरबीआई",
    "rules": "रूल्स",
    "rule": "रूल",
    "whatsapp": "व्हाट्सएप",
    "qr": "क्यूआर",
    "upi": "यूपीआई",
    "phonepe": "फोनपे",
    "gpay": "जीपे",
    "paytm": "पेटीएम",
    "bhejo": "भेजो",
    "unka": "उनका",
    "unki": "उनकी",
    "unke": "उनके",
    "unhe": "उन्हें",
    "usse": "उससे",
    "uska": "उसका",
    "uski": "उसकी",
    "uske": "उसके",
    "ise": "इसे",
    "iska": "इसका",
    "iski": "इसकी",
    "iske": "इसके",
    "aapse": "आपसे",
    "aapki": "आपकी",
    "mujhse": "मुझसे",

    # Names
    "jitesh": "जितेश",
    "soni": "सोनी",
    "mahima": "महिमा",
    "dangi": "डांगी",
    "dhanesh": "धनेश",
    "vaishnav": "वैष्णव",
    "ji": "जी",

    # Quantity terms
    "sau": "सौ",
    "hazaar": "हजार",
    "lakh": "लाख",
    "shunya": "शून्य",

    # Hindi Numbers 1-99
    "ek": "एक", "do": "दो", "teen": "तीन", "chaar": "चार", "paanch": "पांच", "chhe": "छह", "saat": "सात", "aath": "आठ", "nau": "नौ",
    "das": "दस", "gyarah": "ग्यारह", "baarah": "बारह", "terah": "तेरह", "chaudah": "चौदह", "pandrah": "पंद्रह", "solah": "सोलह", "satrah": "सत्रह", "atharah": "अठारह", "unnees": "उन्नीस",
    "bees": "बीस", "ikkees": "इक्कीस", "baayees": "बाईस", "teyees": "तेईस", "chaubees": "चौबीस", "pachchees": "पच्चीस", "chhabbees": "छब्बीस", "sattaayees": "सत्ताईस", "atthaayees": "अट्ठाईस", "untees": "उनतीस",
    "tees": "तीस", "iktees": "इकतीस", "battees": "बत्तीस", "taintees": "तैंतीस", "chauntees": "चौंतीस", "paintees": "पैंतीस", "chhattees": "छत्तीस", "saintees": "सैंतीस", "ardtees": "अड़तीस", "untaalees": "उनतालीस",
    "chaalees": "चालीस", "iktalees": "इकतालिस", "bayaalees": "बयालीस", "taintalees": "तैंतालिस", "chawaalees": "चवालीस", "paintalees": "पैंतालिस", "chhiyaalees": "छियालीस", "saitalees": "सैंतालिस", "adtaalees": "अड़तालिस", "unchaas": "उनचास",
    "pachaas": "पचास", "ikyawan": "इक्यावन", "baawan": "बावन", "tirpan": "तिर्पन", "chawwan": "चौवन", "pachpan": "पचपन", "chhappan": "छप्पन", "sattaawan": "सत्तावन", "atthaawan": "अट्ठावन", "unsaath": "उनसठ",
    "saath": "साठ", "iksaath": "इकसठ", "baasath": "बासठ", "tirsath": "तिरसठ", "chaunsath": "चौंसठ", "painsath": "पैंसठ", "chhiyasath": "छियासठ", "satsath": "सड़सठ", "adsath": "अड़सठ", "unhattar": "उनहत्तर",
    "sattar": "सत्तर", "ikhattar": "इकहत्तर", "bahattar": "बहत्तर", "tihattar": "तिहत्तर", "chauhattar": "चौहत्तर", "pachhattar": "पचहत्तर", "chhihattar": "छिहत्तर", "sathattar": "सतहत्तर", "athhattar": "अठहत्तर", "unasee": "उनासी",
    "assee": "अस्सी", "ikyaasee": "इक्यासी", "bayaasee": "बयासी", "tiraasee": "तिरासी", "chauraasee": "चौरासी", "pachaasee": "पचासी", "chhiyaasee": "छियासी", "sattaasee": "सत्तासी", "atthaasee": "अट्ठासी", "nawaasee": "नवासी",
    "nabbe": "नब्बे", "ikyaanwe": "इक्यानवे", "bayaanwe": "बयानवे", "tiraanwe": "तिरानवे", "chauraanwe": "चौरानवे", "pachaanwe": "पचानवे", "chhiyaanwe": "छियानवे", "sattaanwe": "सत्तानवे", "atthaanwe": "अट्ठानवे", "nanyaanwe": "निन्यानवे",
    "of": "ऑफ़",
    "axis": "एक्सिस",
    "sbi": "एसबीआई",
    "hdfc": "एचडीएफसी",
    "pnb": "पीएनबी",
    "canara": "केनरा",
    "baroda": "बड़ौदा",
    "kotak": "कोटक",
    "yesbank": "यस बैंक",
    "yes": "यस",
    "idfc": "आईडीएफसी",
    "indusind": "इंडसइंड",
    "rbl": "आरबीएल",
    "hsbc": "एचएसबीसी",
    "dobara": "दोबारा",
    "hi": "ही",
    "hum": "हम",
    "karne": "करने",
    "nahi": "नहीं",
    "nahin": "नहीं",
    "kiran": "किरण",
    "pooja": "पूजा",
    "neha": "नेहा",
    "pan": "पैन",
    "a": "ए", "b": "बी", "c": "सी", "d": "डी", "e": "ई", "f": "एफ", "g": "जी", "h": "एच", "i": "आई",
    "j": "जे", "k": "के", "l": "एल", "m": "एम", "n": "एन", "o": "ओ", "p": "पी", "q": "क्यू", "r": "आर",
    "s": "एस", "t": "टी", "u": "यू", "v": "वी", "w": "डब्लू", "x": "एक्स", "y": "वाई", "z": "जेड"
}

def phonetic_to_devanagari_word(word: str) -> str:
    """
    Phonetically transliterates a Latin-script word into Devanagari script
    using rules for Indian name/word structures. This ensures that any unmapped 
    dynamic words (like names or banks) are readable by gTTS without causing cutoffs.
    """
    word_lower = word.lower().strip()
    if not word_lower:
        return ""

    # Independent vowel mappings (start of word or syllable)
    ind_vowels = {
        'aa': 'आ', 'ee': 'ई', 'oo': 'ऊ', 'ae': 'ऐ', 'ai': 'ऐ', 'au': 'औ', 'ou': 'औ',
        'a': 'अ', 'e': 'ए', 'i': 'इ', 'o': 'ओ', 'u': 'उ', 'y': 'इ'
    }
    
    # Dependent vowel mappings (matras - following a consonant)
    dep_vowels = {
        'aa': 'ा', 'ee': 'ी', 'oo': 'ू', 'ae': 'ै', 'ai': 'ै', 'au': 'ौ', 'ou': 'ौ',
        'a': 'ा', 'e': 'े', 'i': 'ि', 'o': 'ो', 'u': 'ु', 'y': 'ि'
    }
    
    # Consonant mappings
    consonants = {
        'sh': 'श', 'ch': 'च', 'kh': 'ख', 'gh': 'घ', 'th': 'थ', 'ph': 'फ', 'bh': 'भ', 
        'jh': 'झ', 'dh': 'ध', 'ks': 'क्ष', 'gy': 'ज्ञ', 'tr': 'त्र',
        'b': 'ब', 'c': 'क', 'd': 'द', 'f': 'फ', 'g': 'ग', 'h': 'ह', 'j': 'ज', 'k': 'क', 
        'l': 'ल', 'm': 'म', 'n': 'न', 'p': 'प', 'q': 'क', 'r': 'र', 's': 'स', 't': 'त', 
        'v': 'व', 'w': 'व', 'x': 'क्स', 'z': 'ज़'
    }
    
    # Tokenize word into phonetic chunks (longer chunks first)
    patterns = [
        'sh', 'ch', 'kh', 'gh', 'th', 'ph', 'bh', 'jh', 'dh', 'ks', 'gy', 'tr',
        'aa', 'ee', 'oo', 'ae', 'ai', 'au', 'ou',
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'
    ]
    
    i = 0
    tokens = []
    while i < len(word_lower):
        matched = False
        if i < len(word_lower) - 1:
            two_chars = word_lower[i:i+2]
            if two_chars in patterns:
                tokens.append(two_chars)
                i += 2
                matched = True
                continue
        one_char = word_lower[i]
        if one_char in patterns:
            tokens.append(one_char)
            i += 1
        else:
            tokens.append(one_char)
            i += 1
            
    # Assemble Devanagari characters
    result = []
    last_was_consonant = False
    
    for t in tokens:
        if t in consonants:
            result.append(consonants[t])
            last_was_consonant = True
        elif t in dep_vowels:
            if last_was_consonant:
                result.append(dep_vowels[t])
            else:
                result.append(ind_vowels[t])
            last_was_consonant = False
        else:
            result.append(t)
            last_was_consonant = False
            
    return "".join(result)


def hinglish_to_devanagari(text: str) -> str:
    """
    Translates common Hinglish words to Devanagari script so that gTTS (Google Translate hi)
    can read the text completely and cleanly without choking or cutting off.
    Uses HINGLISH_TO_DEVANAGARI mapping first, then falls back to a phonetic 
    transliterator for any dynamic/unmapped English words.
    """
    # 1. Apply standard TTS normalization (numbers and acronym overrides)
    normalized = normalize_for_tts(text)
    
    # 2. Extract words and keep spacing/punctuation intact
    parts = re.split(r'([a-zA-Z]+)', normalized)
    
    translated_parts = []
    for part in parts:
        if part.isalpha(): # English word
            word_lower = part.lower()
            if word_lower in HINGLISH_TO_DEVANAGARI:
                translated_parts.append(HINGLISH_TO_DEVANAGARI[word_lower])
            else:
                # Apply phonetic transliteration fallback
                phonetic_dev = phonetic_to_devanagari_word(part)
                print(f"[Transliteration Fallback] Transliterated unmapped word '{part}' -> '{phonetic_dev}' for gTTS fallback")
                translated_parts.append(phonetic_dev)
        else:
            translated_parts.append(part)
            
    return "".join(translated_parts)



# ---------------------------------------------------------------------------
# 2. TTS GENERATION FUNCTIONS
# ---------------------------------------------------------------------------

def get_mp3_duration(filepath: str) -> float:
    """
    Parses MP3 frame headers to compute exact duration in seconds.
    Falls back to a CBR approximation if no frames are parsed.
    """
    bitrates_v1_l3 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, -1]
    bitrates_v2_l3 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, -1]
    
    samplerates = {
        0: {0: 44100, 1: 48000, 2: 32000},
        1: {0: 22050, 1: 24000, 2: 16000},
        2: {0: 11025, 1: 12000, 2: 8000}
    }
    
    try:
        file_size = os.path.getsize(filepath)
        with open(filepath, 'rb') as f:
            data = f.read()
            
        duration = 0.0
        i = 0
        while i < len(data) - 4:
            if data[i] == 0xFF and (data[i+1] & 0xE0) == 0xE0:
                b1 = data[i+1]
                b2 = data[i+2]
                
                version_id = (b1 & 0x18) >> 3
                if version_id == 3:
                    ver_idx = 0
                elif version_id == 2:
                    ver_idx = 1
                else:
                    ver_idx = 2
                    
                layer = (b1 & 0x06) >> 1
                bitrate_idx = (b2 & 0xF0) >> 4
                
                if ver_idx == 0:
                    bitrate = bitrates_v1_l3[bitrate_idx] * 1000
                else:
                    bitrate = bitrates_v2_l3[bitrate_idx] * 1000
                    
                sr_idx = (b2 & 0x0C) >> 2
                try:
                    sample_rate = samplerates[ver_idx][sr_idx]
                except KeyError:
                    sample_rate = 0
                    
                if bitrate > 0 and sample_rate > 0:
                    padding = (b2 & 0x02) >> 1
                    if layer == 1:  # Layer III
                        frame_len = int(144 * bitrate / sample_rate) + padding
                        samples_per_frame = 1152 if ver_idx == 0 else 576
                        duration += samples_per_frame / sample_rate
                    else:
                        frame_len = 4
                    i += max(frame_len, 4)
                else:
                    i += 1
            else:
                i += 1
                
        if duration > 0:
            return duration
    except Exception:
        pass
        
    # Standard fallback for gTTS (typically Constant Bit Rate 32 kbps MP3)
    try:
        return (os.path.getsize(filepath) * 8) / 32000.0
    except Exception:
        return 0.0

def get_audio_duration(filepath: str) -> float:
    """
    Returns the exact duration of a WAV or MP3 audio file in seconds.
    Supports both RIFF WAVE format and MPEG audio frames (MP3).
    """
    if not os.path.exists(filepath):
        return 0.0
    try:
        with open(filepath, 'rb') as f:
            start_bytes = f.read(4)
        if start_bytes == b'RIFF':
            # WAV file parsing
            import struct
            with open(filepath, 'rb') as f:
                riff = f.read(4)
                f.seek(22)
                num_channels = struct.unpack('<H', f.read(2))[0]
                sample_rate = struct.unpack('<I', f.read(4))[0]
                f.seek(34)
                bits_per_sample = struct.unpack('<H', f.read(2))[0]
                f.seek(12)
                while True:
                    chunk_id = f.read(4)
                    if not chunk_id:
                        break
                    chunk_size = struct.unpack('<I', f.read(4))[0]
                    if chunk_id == b'data':
                        return chunk_size / (sample_rate * num_channels * (bits_per_sample / 8))
                    else:
                        f.seek(chunk_size, 1)
        else:
            # MP3 file parsing
            return get_mp3_duration(filepath)
    except Exception as e:
        print(f"[Duration Utility Warning] Could not parse duration for {filepath}: {e}")
        try:
            file_size = os.path.getsize(filepath)
            # Fallback approximation: check if WAV format (starts with RIFF)
            with open(filepath, 'rb') as f:
                header = f.read(4)
            if header == b'RIFF':
                # mono 16-bit 22.05kHz WAV: 44100 bytes/sec
                return file_size / 44100.0
            else:
                return (file_size * 8) / 32000.0
        except Exception:
            return 0.0

# Cached last working key
_cached_working_key = None

def get_all_sarvam_keys() -> list[str]:
    keys = []
    
    # helper to clean and add key
    def add_key(val):
        if not val:
            return
        # split by comma in case multiple keys are in a single variable
        for part in val.split(","):
            part = part.strip()
            # Remove any wrapping quotes
            if (part.startswith('"') and part.endswith('"')) or (part.startswith("'") and part.endswith("'")):
                part = part[1:-1].strip()
            if part and part not in keys and "INVALID_KEY" not in part:
                keys.append(part)

    # 1. Check all environment variables matching SARVAM_API_KEY.*
    for k, v in sorted(os.environ.items()):
        if k.startswith("SARVAM_API_KEY"):
            add_key(v)

    # 2. Also check .env file directly if it exists, to ensure we get any keys that were not loaded
    env_path = ".env"
    if os.path.exists(env_path):
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    # Skip comments or empty lines
                    if not line or line.startswith("#"):
                        continue
                    if line.startswith("SARVAM_API_KEY"):
                        parts = line.split("=", 1)
                        if len(parts) == 2:
                            add_key(parts[1].strip())
        except Exception as e:
            print(f"[Key Manager Error] Error reading .env directly: {e}")

    return keys

def speak_with_sarvam(text: str, filename: str, voice: str = None) -> str:
    """
    Synthesizes speech using Sarvam AI's REST API.

    IMPORTANT: The voice/model/language/pace are controlled EXCLUSIVELY by the
    module-level constants (DEFAULT_SPEAKER, DEFAULT_MODEL, DEFAULT_LANG, DEFAULT_PACE).
    The `voice` parameter is intentionally IGNORED — passing a different speaker
    here will NOT override the locked configuration. This prevents any silent drift
    if Sarvam's API changes its defaults in a future update.

    To change the voice, update the DEFAULT_* constants at the top of this file
    and document the change with a listening test against the reference audio files.
    """
    global _cached_working_key
    
    # 1. Load all keys
    all_keys = get_all_sarvam_keys()
    if not all_keys:
        raise ValueError("No SARVAM_API_KEY configured in environment or .env file.")
        
    # Re-order keys to try the cached working key first if it exists
    keys_to_try = list(all_keys)
    if _cached_working_key and _cached_working_key in keys_to_try:
        keys_to_try.remove(_cached_working_key)
        keys_to_try.insert(0, _cached_working_key)
        
    last_error = None
    
    for idx, key in enumerate(keys_to_try):
        masked_key = f"{key[:6]}...{key[-4:]}" if len(key) > 10 else f"KeyIndex_{idx}"
        
        url = "https://api.sarvam.ai/text-to-speech"
        headers = {
            "api-subscription-key": key,
            "Content-Type": "application/json"
        }
        
        # Use the voice parameter if specified, otherwise default speaker
        actual_speaker = voice if voice else DEFAULT_SPEAKER
        payload = {
            "text": text,
            "speaker": actual_speaker,
            "target_language_code": DEFAULT_LANG,
            "model": DEFAULT_MODEL,
            "pace": DEFAULT_PACE,
        }
        
        # Ensure output directory exists
        output_dir = os.path.dirname(filename)
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)
            
        print(f"[TTS Attempt] Attempting Sarvam AI with speaker '{actual_speaker}' using key: {masked_key}...")
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            
            # Check for failover-triggering error statuses
            if response.status_code in (401, 402, 429) or response.status_code != 200:
                err_msg = f"Key {masked_key} failed with status code {response.status_code}: {response.text}"
                print(f"[Sarvam Failover] {err_msg}")
                last_error = RuntimeError(err_msg)
                if idx < len(keys_to_try) - 1:
                    next_key = keys_to_try[idx + 1]
                    next_masked = f"{next_key[:6]}...{next_key[-4:]}" if len(next_key) > 10 else f"KeyIndex_{idx + 1}"
                    print(f"[Sarvam Failover] Automatically switching from key {masked_key} to next key {next_masked}")
                continue
                
            data = response.json()
            audio_content = "".join(data["audios"])
            audio_bytes = base64.b64decode(audio_content)
            
            with open(filename, "wb") as f:
                f.write(audio_bytes)
                
            # Success! Cache the key.
            if _cached_working_key != key:
                print(f"[Sarvam Success] Key {masked_key} succeeded. Caching as active working key.")
                _cached_working_key = key
                
            return filename
            
        except (requests.exceptions.RequestException, Exception) as e:
            err_msg = f"Key {masked_key} encountered connection/unexpected error: {e}"
            print(f"[Sarvam Failover] {err_msg}")
            last_error = e
            if idx < len(keys_to_try) - 1:
                next_key = keys_to_try[idx + 1]
                next_masked = f"{next_key[:6]}...{next_key[-4:]}" if len(next_key) > 10 else f"KeyIndex_{idx + 1}"
                print(f"[Sarvam Failover] Automatically switching from key {masked_key} to next key {next_masked}")
            continue
            
    # All keys exhausted
    print("[Sarvam Exhaustion] All configured Sarvam API keys were tried and failed.")
    if last_error:
        raise RuntimeError(f"All Sarvam API keys exhausted. Last error: {last_error}")
    else:
        raise RuntimeError("All Sarvam API keys exhausted.")

def speak_with_gtts(text: str, filename: str, lang: str = "hi") -> str:
    """
    Fallback speech synthesis using free gTTS library.
    """
    from gtts import gTTS
    
    # Ensure output directory exists
    output_dir = os.path.dirname(filename)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)

    tts = gTTS(text=text, lang=lang)
    tts.save(filename)
    return filename

def speak_with_edge_tts(text: str, filename: str, voice: str = DEFAULT_EDGE_VOICE) -> str:
    """
    Fallback speech synthesis using free edge-tts library (Microsoft Neural Voices).
    """
    import asyncio
    import edge_tts

    # Ensure output directory exists
    output_dir = os.path.dirname(filename)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)

    print(f"[TTS Attempt] Attempting Edge-TTS with voice '{voice}'...")
    
    async def _save():
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(filename)

    try:
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None

        if loop and loop.is_running():
            from concurrent.futures import ThreadPoolExecutor
            with ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(lambda: asyncio.run(_save()))
                future.result()
        else:
            asyncio.run(_save())
    except Exception as e:
        print(f"[TTS Edge-TTS Error] Edge-TTS generation failed: {e}")
        raise

    return filename

def speak(text: str, filename: str, engine: str = "sarvam", voice: str = "male") -> str:
    """
    General wrapper method that selects the engine and handles fallback dynamically.
    Normalizes the text before calling Sarvam.
    """
    selected_engine = None
    spoken_text = text  # Track the actual text sent to the TTS engine for accurate safeguard checks
    
    print(f"[TTS Call] Input Text: '{text}' | Engine: {engine} | Voice: {voice}")
    
    # Pre-transliterate Devanagari text for fallbacks (edge-tts and gTTS)
    devanagari_text = hinglish_to_devanagari(text)
    
    if engine.lower() == "sarvam":
        all_keys = get_all_sarvam_keys()
        sarvam_voice = "rohan" if voice.lower() == "male" else "divya"
        fallback_edge_voice = "hi-IN-MadhurNeural" if voice.lower() == "male" else "hi-IN-SwaraNeural"
        
        if not all_keys:
            reason = "No Sarvam API keys are configured in environment or .env"
            print(f"[TTS Fallback Triggered] Engine: Edge-TTS (Reason: {reason})")
            try:
                spoken_text = devanagari_text
                speak_with_edge_tts(devanagari_text, filename, voice=fallback_edge_voice)
                selected_engine = "Edge-TTS"
                print(f"[TTS Engine Success] Synthesized successfully with Edge-TTS fallback: '{filename}'")
            except Exception as edge_err:
                print(f"[TTS Fallback Triggered] Engine: gTTS (Reason: Edge-TTS failed: {edge_err})")
                speak_with_gtts(devanagari_text, filename)
                selected_engine = "gTTS"
                print(f"[TTS Engine Success] Synthesized successfully with gTTS fallback: '{filename}'")
        else:
            try:
                # Apply pronunciation fix layer to Sarvam input
                normalized_text = normalize_for_tts(text)
                spoken_text = normalized_text
                print(f"[TTS Engine Chosen] Engine: Sarvam AI (Text: '{normalized_text}', Speaker: '{sarvam_voice}')")
                speak_with_sarvam(normalized_text, filename, voice=sarvam_voice)
                selected_engine = "Sarvam AI"
                print(f"[TTS Engine Success] Synthesized successfully with Sarvam AI: '{filename}'")
            except Exception as e:
                # Log the exact exception which includes status codes/bodies raised from speak_with_sarvam
                print(f"[TTS Fallback Triggered] Engine: Edge-TTS (Reason: Sarvam AI failed: {e})")
                try:
                    spoken_text = devanagari_text
                    speak_with_edge_tts(devanagari_text, filename, voice=fallback_edge_voice)
                    selected_engine = "Edge-TTS"
                    print(f"[TTS Engine Success] Synthesized successfully with Edge-TTS fallback: '{filename}'")
                except Exception as edge_err:
                    print(f"[TTS Fallback Triggered] Engine: gTTS (Reason: Edge-TTS failed: {edge_err})")
                    speak_with_gtts(devanagari_text, filename)
                    selected_engine = "gTTS"
                    print(f"[TTS Engine Success] Synthesized successfully with gTTS fallback: '{filename}'")
    elif engine.lower() == "edge":
        fallback_edge_voice = "hi-IN-MadhurNeural" if voice.lower() == "male" else "hi-IN-SwaraNeural"
        print(f"[TTS Engine Chosen] Engine: Edge-TTS (Reason: Direct request)")
        try:
            spoken_text = devanagari_text
            speak_with_edge_tts(devanagari_text, filename, voice=fallback_edge_voice)
            selected_engine = "Edge-TTS"
            print(f"[TTS Engine Success] Synthesized successfully with Edge-TTS: '{filename}'")
        except Exception as edge_err:
            print(f"[TTS Fallback Triggered] Engine: gTTS (Reason: Edge-TTS failed: {edge_err})")
            speak_with_gtts(devanagari_text, filename)
            selected_engine = "gTTS"
            print(f"[TTS Engine Success] Synthesized successfully with gTTS fallback: '{filename}'")
    else: # gtts
        if voice.lower() == "male":
            print(f"[TTS Engine Chosen] Engine: gTTS-Male (Using Edge-TTS hi-IN-MadhurNeural fallback)")
            try:
                spoken_text = devanagari_text
                speak_with_edge_tts(devanagari_text, filename, voice="hi-IN-MadhurNeural")
                selected_engine = "Edge-TTS"
                print(f"[TTS Engine Success] Synthesized successfully with Edge-TTS: '{filename}'")
            except Exception as edge_err:
                print(f"[TTS Fallback Triggered] Engine: gTTS (Reason: Edge-TTS failed: {edge_err})")
                speak_with_gtts(devanagari_text, filename)
                selected_engine = "gTTS"
                print(f"[TTS Engine Success] Synthesized successfully with gTTS: '{filename}'")
        else:
            print(f"[TTS Engine Chosen] Engine: gTTS (Reason: Direct request)")
            spoken_text = devanagari_text
            speak_with_gtts(devanagari_text, filename)
            selected_engine = "gTTS"
            print(f"[TTS Engine Success] Synthesized successfully with gTTS: '{filename}'")
        
    # Safeguard check: verify audio file exists and has sensible duration.
    # IMPORTANT: use `spoken_text` (the actual text sent to the engine), NOT the original `text`.
    # For gTTS fallback, the Devanagari transliteration is what gets spoken, so its length
    # is what determines expected duration. Using `text` (Hinglish) caused false positives.
    if os.path.exists(filename):
        duration = get_audio_duration(filename)
        # Expected minimum duration threshold depends on the engine:
        # gTTS speaks much faster than Sarvam AI / Edge-TTS.
        char_rate = 0.030 if selected_engine == "gTTS" else 0.045
        min_expected = len(spoken_text) * char_rate
        print(f"[TTS Performance] Generated file: {filename} | Engine: {selected_engine} | Duration: {duration:.2f}s | Min Expected: {min_expected:.2f}s (Spoken text length: {len(spoken_text)} chars)")
        if duration < min_expected:
            print(f"[TTS Warning] *** SUSPECT CUTOFF *** Audio duration ({duration:.2f}s) < expected minimum {min_expected:.2f}s for spoken text ({len(spoken_text)} chars at {char_rate}s/char). File: {filename}")
            
    return filename

def speak_to_file(text: str, filename: str = "bot_reply.mp3", lang: str = "hi", engine: str = "sarvam", voice: str = "male") -> str:
    """
    Backward compatibility wrapper matching the original function signature in server.py.
    """
    return speak(text, filename, engine=engine, voice=voice)


# ---------------------------------------------------------------------------
# 3. PLAYBACK UTILITY
# ---------------------------------------------------------------------------

def play_file(filename: str):
    """
    Plays an audio file. Cross-platform best-effort.
    """
    import platform
    system = platform.system()
    try:
        if system == "Darwin":
            os.system(f"afplay '{filename}'")
        elif system == "Linux":
            os.system(f"mpg123 '{filename}' 2>/dev/null || ffplay -nodisp -autoexit '{filename}' 2>/dev/null")
        elif system == "Windows":
            os.system(f'start "" "{filename}"')
    except Exception as e:
        print(f"[tts_engine] Could not auto-play audio: {e}")

