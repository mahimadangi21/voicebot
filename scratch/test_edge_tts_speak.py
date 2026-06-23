import asyncio
import edge_tts

async def main():
    text = "हैलो, क्या मेरी बात रितु से हो रही है?"
    voice = "hi-IN-MadhurNeural"
    output_file = "audio_output/test_edge_madhur.mp3"
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_file)
    print(f"Saved to {output_file}")

if __name__ == "__main__":
    asyncio.run(main())
