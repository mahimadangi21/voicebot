# Hindi Voice Bot — POC

A proof-of-concept conversational voice bot that calls a customer about a due amount, speaks Hinglish naturally, and reacts to free-form replies — built entirely with **free tools**.

## What this proves

- Bot greets the customer by name and confirms identity.
- States the due amount.
- Answers "which bank are you calling from" if asked.
- Detects affirmative ("haan", "ha", "ji", "yes", "theek hai") vs negative ("nahi") replies in casual Hinglish, not just exact keywords.
- Handles unclear/inaudible inputs with a graceful retry and polite hang-up if it's repeatedly unclear.
- Cuts the call cleanly on: wrong number, refusal, or repeated confusion.
- Converts every bot line into a real Hindi `.mp3` voice file.

## Files

| File | Purpose |
|---|---|
| [`conversation_engine.py`](file:///c:/Desktop/POC/conversation_engine.py) | The state machine + intent detection logic. No API keys needed. |
| [`tts_engine.py`](file:///c:/Desktop/POC/tts_engine.py) | Converts bot text → Hindi speech (`.mp3`) using free `gTTS`. Includes optional playback helper. |
| [`demo_text_chat.py`](file:///c:/Desktop/POC/demo_text_chat.py) | **Interactive CLI demo** — prompts for details, lets you type replies turn-by-turn, and saves/plays audio. |
| [`test_example_flow.py`](file:///c:/Desktop/POC/test_example_flow.py) | Automated test suite verifying the target script flow, wrong number handling, refusal, and retries. |
| [`README.md`](file:///c:/Desktop/POC/README.md) | This documentation file. |

## Installation & Setup

1. Make sure you have Python 3.10+ installed.
2. Install the free dependencies (note that `gTTS` does not require any paid API keys or registration):
   ```bash
   pip install gtts SpeechRecognition
   ```
3. Ensure you have an active internet connection (gTTS calls Google's public translation API under the hood to generate high-quality neural-like Hindi TTS).

## How to Run

### 1. Automated Test Suite (Logic & Edge Cases)
Run the automated assertions to verify the state machine behavior and boundary matches:
```bash
python test_example_flow.py
```

### 2. Interactive CLI Demo
Run the interactive console chatbot. It will prompt for a customer name and due amount, then let you type Hinglish replies (e.g. `Ha`, `Nahi`, `Konse bank se`, `Bhejdo`). 
```bash
python demo_text_chat.py
```
*Note: This script outputs the bot lines as `.mp3` audio files inside the `./audio_output/` folder so you can listen to them.*

---

## Architecture Rationale

```
User speech ──(STT)──► Text ──► State Machine ──► Bot text ──(TTS)──► Hindi voice
```

1. **State Machine over Free-Form LLM:**
   In a collections/financial recovery scenario, deterministic behavior is critical. Every statement the bot makes must be pre-approved, compliant, and auditable. An LLM might hallucinate amounts, promise unapproved waivers, or use non-compliant language. The state machine ensures 100% control over the outbound script.
   
2. **Rule-Based Hinglish NLU (with word boundaries):**
   Understanding free-form Hinglish text is done using robust regex with `\b` (word boundaries). Naive substring checks like `"ha" in text` false-positive on words like `"nahi"` or `"kaha"`. By using word boundaries and checking for common colloquial phrasing, the NLU classifies intents (AFFIRM, DENY, ASK_BANK, UNCLEAR) accurately without the cost, latency, or API keys of an LLM.

3. **Decoupled Architecture:**
   The state machine is fully decoupled from the STT and TTS modules. This allows testing via text-input CLI and automated scripts instantly without needing microphone/speaker setup or incurring API costs, while remaining fully ready to swap in production-grade telephony and voice APIs later.

---

## Manager Summary & Production Upgrade Path

> "This proof-of-concept uses fully free, open-source tools to validate the conversation logic and prove the bot can speak natural-sounding Hindi:
> - **Conversation logic:** A Python state machine — deterministic, compliant, and auditable (essential for financial recovery).
> - **Understanding user replies:** Rule-based Hinglish intent detection (handles 'haan', 'nahi', 'konse bank', 'samajh nahi aaya' etc., in natural phrasing).
> - **Voice output:** Google's free Hindi text-to-speech (gTTS), which uses high-quality neural voice models for a natural tone.
> - **Speech input:** Standardized as a text-in/text-out engine for fast CLI testing and automated CI validation.
>
> **Production Upgrade Path:**
> To move from this POC to a live calling system, we would:
> 1. Use **Twilio** or **Exotel** to handle outbound telephony/SIP trunking and dial the customer's phone number.
> 2. Replace the CLI input with a low-latency Speech-to-Text (STT) service like **Deepgram** or **Sarvam AI** for real-time transcription of Hindi speech.
> 3. Replace the `gTTS` module with a premium, expressive Text-to-Speech (TTS) provider like **ElevenLabs** or **Sarvam TTS** to obtain extremely realistic, human-like voice synthesis with custom emotion/intonation control.
> 4. Deploy the Python backend on standard cloud container platforms (like AWS ECS or GCP Cloud Run)."

---

## Hindi Text-to-Speech (TTS) & Pronunciation overrides

This proof-of-concept supports dual synthesis engines: **Sarvam AI TTS** as the primary engine, and **gTTS** as a secondary/fallback engine.

### 1. Configure Sarvam AI API Key
1. Register and sign in to [Sarvam AI Dashboard](https://www.sarvam.ai).
2. Obtain an API key from the developer credentials.
3. Open/create the `.env` file in the project root directory and add your key:
   ```env
   SARVAM_API_KEY=your_sarvam_api_key_here
   ```

### 2. Testing & Comparing TTS Engines
You can generate audio files for both engines to compare quality for a given sentence:
```bash
python compare_tts.py "Aapka 5000 rupaye ka amount due hai ICICI bank mein."
```
This generates:
- `audio_output/compare_sarvam.mp3` (with pronunciation overrides and numbers converted to spoken words)
- `audio_output/compare_gtts.mp3` (raw fallback gTTS output)

### 3. Adding New Pronunciation Overrides
If Sarvam AI mispronounces acronyms, names, or Hinglish words, you can add phonetic overrides.
Open [`tts_engine.py`](file:///c:/Desktop/POC/tts_engine.py) and update the `PRONUNCIATION_OVERRIDES` dictionary at the top of the file:
```python
PRONUNCIATION_OVERRIDES = {
    "ICICI": "आई सी आई सी आई",
    "SBI": "एस बी आई",
    "NEW_ACRONYM": "phonetic equivalent in Devanagari or spaced out letters",
}
```
Words added to this dictionary are replaced automatically before sending the synthesis payload to Sarvam AI.
