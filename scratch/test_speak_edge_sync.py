import os
import asyncio

DEFAULT_EDGE_VOICE = "hi-IN-MadhurNeural"

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

if __name__ == "__main__":
    speak_with_edge_tts("हैलो, क्या मेरी बात रितु से हो रही है?", "audio_output/test_edge_sync.mp3")
    print("Done!")
