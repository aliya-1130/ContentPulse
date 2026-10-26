
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from starlette.concurrency import run_in_threadpool

if __package__:
    from . import backend
    from .video_processing import process_video
else:
    import backend
    from video_processing import process_video


# =========================================================
# PATHS
# =========================================================
BACKEND_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BACKEND_DIR / "uploads"
GENERATED_DIR = BACKEND_DIR / "generated"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
GENERATED_DIR.mkdir(parents=True, exist_ok=True)


# =========================================================
# FASTAPI
# =========================================================
app = FastAPI(title="ContentPulse Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount(
    "/generated",
    StaticFiles(directory=str(GENERATED_DIR)),
    name="generated",
)


# =========================================================
# REQUEST MODELS
# =========================================================
class AnalyzeRequest(BaseModel):
    platform: str
    niche: str
    title: str = ""
    description: str = ""
    caption: str = ""
    hashtags: str = ""
    duration: int = 30


class TranslateRequest(BaseModel):
    text: str
    language: str = ""
    audio_url: str = ""


# =========================================================
# HEALTH
# =========================================================
@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "service": "ContentPulse backend",
    }


# =========================================================
# TRANSCRIBE — ORIGINAL TRANSCRIPT
# =========================================================
@app.post("/api/transcribe")
async def transcribe_video(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No video file was provided.",
        )

    allowed_extensions = {
        ".mp4",
        ".mov",
        ".avi",
        ".mkv",
        ".webm",
        ".m4v",
    }

    extension = Path(file.filename).suffix.lower()

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Unsupported video format. Use MP4, MOV, AVI, MKV, WEBM, or M4V.",
        )

    unique_id = uuid4().hex
    video_path = UPLOAD_DIR / f"{unique_id}{extension}"

    print("=" * 60)
    print("/api/transcribe REQUEST RECEIVED")
    print(f"Filename: {file.filename}")
    print("Saving uploaded video...")
    print("=" * 60)

    try:
        with open(video_path, "wb") as buffer:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                buffer.write(chunk)

        print(f"Video saved: {video_path.name}")
        print("Starting video processing...")

        # Run blocking FFmpeg/Whisper work outside the FastAPI event loop.
        result = await run_in_threadpool(
            process_video,
            str(video_path),
        )

        transcript = (result.get("transcript") or "").strip()

        detected_language = (
            result.get("language") or ""
        ).strip().lower()

        audio_url = ""
        audio_path_value = result.get("audio_path")

        if audio_path_value:
            audio_filename = Path(audio_path_value).name

            audio_url = (
                "http://127.0.0.1:8000"
                f"/generated/{audio_filename}"
            )

        if not transcript:
            raise RuntimeError(
                "No speech was detected in the uploaded video."
            )

        print("Returning ORIGINAL transcript to frontend.")

        return {
            "status": "success",
            "filename": file.filename,
            "transcript": transcript,
            "original": transcript,
            "language": detected_language,
            "detected_language": detected_language,
            "variants": {
                "original": transcript,
            },
            "transcript_variants": {
                "original": transcript,
            },
            "transcriptVariants": {
                "original": transcript,
            },
            "audio_url": audio_url,
            "audio_duration": result.get("audio_duration"),
            "language_probability": result.get("language_probability"),
            "language_probabilities": result.get("language_probabilities", []),
            "language_verified": result.get("language_verified", False),
            "language_confidence": result.get("language_confidence"),
            "top_language_evidence": result.get("top_language_evidence", []),
            "first_segment_start": result.get("first_segment_start"),
            "last_segment_end": result.get("last_segment_end"),
            "segment_count": result.get("segment_count"),
            "coverage": result.get("coverage"),
            "repetition_detected": result.get("repetition_detected"),
            "is_complete": result.get("is_complete"),
            "language_matches_transcript": result.get("language_matches_transcript"),
        }

    except Exception as exc:
        print("/api/transcribe FAILED:")
        print(repr(exc))

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc

    finally:
        try:
            if video_path.exists():
                video_path.unlink()
        except Exception as exc:
            print(f"Could not delete uploaded video: {exc}")


# =========================================================
# TRANSLATE — ORIGINAL -> ENGLISH
# =========================================================
@app.post("/api/translate")
async def translate_transcript(request: TranslateRequest):

    text = (request.text or "").strip()
    language = (request.language or "").strip().lower()

    if not text:
        raise HTTPException(
            status_code=400,
            detail="No transcript text was provided.",
        )

    # Already English — no translation needed.
    if language == "en":
        return {
            "status": "success",
            "english": text,
            "source_language": "en",
        }

    try:
        print("=" * 60)
        print("/api/translate REQUEST RECEIVED")
        print(f"Source language: {language}")
        print(f"Transcript length: {len(text)} characters")
        print("Translating complete transcript to English...")
        print("=" * 60)

        # One complete translation request.
        # Do NOT split the transcript into many small requests.
        def perform_translation():
            from deep_translator import GoogleTranslator

            source_language = language if language else "auto"

            translator = GoogleTranslator(
                source=source_language,
                target="en",
            )

            return translator.translate(text)

        english = await run_in_threadpool(
            perform_translation
        )

        english = (english or "").strip()

        if not english:
            raise RuntimeError(
                "Translation returned an empty result."
            )

        print("English translation completed.")
        print("=" * 60)

        return {
            "status": "success",
            "english": english,
            "source_language": language or "auto",
        }

    except Exception as exc:
        print("/api/translate FAILED:")
        print(repr(exc))

        raise HTTPException(
            status_code=500,
            detail=f"English translation failed: {exc}",
        ) from exc


# =========================================================
# CONTENT ANALYSIS
# =========================================================
@app.post("/api/analyze")
def analyze(request: AnalyzeRequest):
    try:

        if request.platform.lower() == "youtube":
            result = backend.predict_youtube(
                title=request.title,
                transcript=request.description,
                niche=request.niche,
                duration_seconds=request.duration,
            )

            return {
                "platform": "youtube",
                "niche": request.niche,
                **result,
            }

        if request.platform.lower() == "instagram":
            result = backend.analyze_instagram(
                caption=request.caption,
                hashtags=request.hashtags,
                niche=request.niche,
            )

            return {
                "platform": "instagram",
                "niche": request.niche,
                **result,
            }

        raise HTTPException(
            status_code=400,
            detail="Unsupported platform. Use youtube or instagram.",
        )

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc


# =========================================================
# RUN
# =========================================================
if __name__ == "__main__":
    import uvicorn

    print("ContentPulse Backend API")
    print("Health: http://127.0.0.1:8000/api/health")
    print("Transcribe: POST http://127.0.0.1:8000/api/transcribe")
    print("Translate: POST http://127.0.0.1:8000/api/translate")
    print("Analyze: POST http://127.0.0.1:8000/api/analyze") 
 
    uvicorn.run( 
        app, 
        host="127.0.0.1", 
        port=8000, 
        reload=False, 
    )
