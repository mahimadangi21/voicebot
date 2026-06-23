import asyncio
import edge_tts

async def main():
    voices = await edge_tts.VoicesManager.create()
    hi_voices = voices.find(Language="hi")
    for v in hi_voices:
        print(f"Name: {v['ShortName']}, Gender: {v['Gender']}")
        
if __name__ == "__main__":
    asyncio.run(main())
