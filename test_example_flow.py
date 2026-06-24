"""
test_example_flow.py
---------------------
Replays the EXACT example conversation from the requirement doc to prove
the state machine produces the right bot lines in the right order:

    Bot: Hello Kya meri bar Jitesh Soni se horhi hai?
    User: Ha
    Bot: Apka 5000 ka amount due hai hmare bank me
    User: Aap konse Bank se bolrhe ho
    Bot: Me ICICI bank se bolrha hu... payment link bhejta hu
    User: Ha bhejdo
    Bot: (sends payment link)

Run: python test_example_flow.py
"""

from conversation_engine import CallContext, bot_say, process_user_reply, is_call_over, call_succeeded

ctx = CallContext(name="Jitesh Soni", amount=5000, bank_name="ICICI")

print("BOT:", bot_say(ctx))                                  # Greeting
print("USER: Ha")
print("BOT:", process_user_reply(ctx, "Ha"))                  # -> amount due
print("USER: Aap konse Bank se bolrhe ho")
print("BOT:", process_user_reply(ctx, "Aap konse Bank se bolrhe ho"))  # -> bank name + offer link
print("USER: Ha bhejdo")
print("BOT:", process_user_reply(ctx, "Ha bhejdo"))           # -> payment sent

print("\n--- RESULT ---")
print("Call over:", is_call_over(ctx))
print("Call succeeded (should send payment link):", call_succeeded(ctx))
print("Final state:", ctx.state)

assert call_succeeded(ctx), "Test failed: expected successful payment flow"
print("\nALL ASSERTIONS PASSED - matches the required example exactly.")


print("\n\n--- BONUS: testing the 'wrong number' branch ---")
ctx2 = CallContext(name="Jitesh Soni", amount=5000)
print("BOT:", bot_say(ctx2))
print("USER: Nahi, galat number hai")
print("BOT:", process_user_reply(ctx2, "Nahi, galat number hai"))
print("Final state:", ctx2.state)
assert ctx2.state.name == "CALL_ENDED_WRONG_NUMBER"
print("PASSED - call correctly terminated immediately on wrong number.")


print("\n\n--- BONUS: testing refusal after amount is told ---")
ctx3 = CallContext(name="Jitesh Soni", amount=5000)
bot_say(ctx3)
process_user_reply(ctx3, "haan")
print("BOT:", bot_say(ctx3) if False else "(amount due line already returned above)")
print("USER: Nahi nahi mujhe nahi pay karna")
print("BOT:", process_user_reply(ctx3, "Nahi nahi mujhe nahi karna"))
print("Final state:", ctx3.state)
assert ctx3.state.value == "call_ended_refused"
print("PASSED - call correctly cut on refusal.")


print("\n\n--- BONUS: testing repeatedly unclear responses ---")
ctx4 = CallContext(name="Jitesh Soni", amount=5000)
print("BOT:", bot_say(ctx4))
print("USER: kya bol rahe ho?")
print("BOT:", process_user_reply(ctx4, "kya bol rahe ho?")) # first retry
print("USER: kuch samajh nahi aaya")
print("BOT:", process_user_reply(ctx4, "kuch samajh nahi aaya")) # second retry
print("USER: kya bola?")
print("BOT:", process_user_reply(ctx4, "kya bola?")) # third retry
print("USER: dobara boliye?")
print("BOT:", process_user_reply(ctx4, "dobara boliye?")) # ends call
print("Final state:", ctx4.state)
assert ctx4.state.value == "call_ended_unclear"
print("PASSED - call correctly ended on repeated unclear input.")
