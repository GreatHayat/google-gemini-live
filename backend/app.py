import os
import sys
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse

from utils import model, google_client, generate_audio_chunks


app = FastAPI()

@app.on_event('startup')
async def check_api_key():
    """Check if GEMINI_API_KEY is set in environment variables before starting the app."""
    if not os.getenv("GEMINI_API_KEY"):
        print("❌ ERROR: GEMINI_API_KEY is missing in environment variables.")
        sys.exit(1)  # Stop the application

 
@app.get('/')
async def health_check():
    return JSONResponse({"message": "App is running"}, 200)

@app.websocket('/ws')
async def chat(websocket: WebSocket):
    await websocket.accept()
    try:
        async with google_client.aio.live.connect(model=model, config={'response_modalities': ['TEXT']}) as session:
            while True:
                data = await websocket.receive_text()
                await session.send(input=str(data), end_of_turn=True)

                async for response in session.receive():
                    if response.text is not None:
                        await websocket.send_text(response.text)

    except WebSocketDisconnect:
        print("WebSocket disconnected")
    except Exception as e:
        print(f"Error: {str(e)}")

@app.websocket('/audio_chat')
async def audio_chat(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await generate_audio_chunks(data, websocket)

    except WebSocketDisconnect:
        print("WebSocket disconnected")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host='0.0.0.0', port=5001, reload=True)