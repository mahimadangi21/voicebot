# scratch/read_logs.py
import json

log_path = r"C:\Users\Mahima\.gemini\antigravity-ide\brain\90467521-029f-4896-9d9b-728fd9402cf7\.system_generated\logs\transcript.jsonl"

print("Searching for session 08cedcb2 logs...")

with open(log_path, "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if "08cedcb2" in line:
            try:
                data = json.loads(line)
                print(f"\nLine {i} type={data.get('type')} source={data.get('source')}")
                # Print tool calls or content
                content = data.get("content", "")
                if content:
                    print(f"Content: {content[:300]}...")
                tool_calls = data.get("tool_calls", [])
                for tc in tool_calls:
                    print(f"Tool Call: {str(tc)[:300]}")
            except Exception as e:
                print(f"Error: {e}")
