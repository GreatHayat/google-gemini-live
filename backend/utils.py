import os
import sys
import wave
import tempfile
from fastapi import WebSocket
from google import genai

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')

google_client = genai.Client(api_key=GEMINI_API_KEY, http_options={'api_version': 'v1alpha'})
model = "gemini-2.0-flash-exp"

async def generate_audio_chunks(prompt: str, websocket: WebSocket):
    try:
        async with google_client.aio.live.connect(model=model, config={'response_modalities': ['AUDIO']}) as session:
            await session.send(input=prompt, end_of_turn=True)

            async for response in session.receive():
                if response.data is not None:
                    # Create a temporary file to store the audio chunk
                    with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                        wf = wave.open(temp_file, "wb")
                        wf.setnchannels(1)
                        wf.setsampwidth(2)
                        wf.setframerate(24000)
                        wf.writeframes(response.data)
                        wf.close()
                        temp_file_path = temp_file.name

                    # Send the audio chunk to the frontend
                    with open(temp_file_path, "rb") as audio_file:
                        audio_chunk = audio_file.read()
                        await websocket.send_bytes(audio_chunk)

                    # Delete the temporary file
                    os.remove(temp_file_path)

    except Exception as e:
        print(f"Error: {str(e)}")

