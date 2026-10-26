import os
import re
import subprocess
from collections import Counter
from pathlib import Path
from statistics import mean
from faster_whisper import WhisperModel

BUILD_ID = "rescue-v3 (chunks + loop cleanup + missing-speech rescue)"

print("CONTENTPULSE VIDEO_PROCESSING FILE:", Path(__file__).resolve())
print("CONTENTPULSE BUILD:", BUILD_ID)

# ---------------------------------------------------------
# Paths
# ---------------------------------------------------------
BACKEND_DIR = Path(__file__).resolve().parent

FFMPEG_PATH = (
    r"C:\Users\galaxy computers\AppData\Local\Microsoft\WinGet\Packages"
    r"\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe"
    r"\ffmpeg-9.0.1-full_build\bin\ffmpeg.exe"
)

GENERATED_DIR = BACKEND_DIR / "generated"
GENERATED_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------
# Settings (all optional environment variables)
# ---------------------------------------------------------
# CONTENTPULSE_WHISPER_MODEL : large-v3-turbo (default, fast) or large-v3
# CONTENTPULSE_LANGUAGE      : force a language code for every video, e.g. kn
# CONTENTPULSE_BEAM_SIZE     : 1 = fastest (default), 5 = most accurate
# CONTENTPULSE_CHUNK_SECONDS : chunk length for Indian/non-Latin scripts (default 12, 0 = off)
# CONTENTPULSE_VAD           : 1 = cut silence before transcribing (default 0)
WHISPER_MODEL_NAME = os.environ.get(
    "CONTENTPULSE_WHISPER_MODEL", "large-v3-turbo"
)

try:
    BEAM_SIZE = max(1, int(os.environ.get("CONTENTPULSE_BEAM_SIZE", "1")))
except ValueError:
    BEAM_SIZE = 1

# Gentle voice-activity filter: removes silent/music-only parts, which is
# where Whisper invents garbage like "ಠಠಠ ಠಠಠಠ". Set CONTENTPULSE_VAD=0 to turn off.
USE_VAD = os.environ.get("CONTENTPULSE_VAD", "1") != "0"

# Accuracy mode: for these languages a bigger model can be used, but it is
# MUCH slower on CPU (Indian scripts need many tokens per word). Default is
# the fast turbo model. For best Kannada spelling (slow) start the backend with:
#   $env:CONTENTPULSE_LOWRES_MODEL="large-v3"
LOWRES_MODEL_NAME = os.environ.get("CONTENTPULSE_LOWRES_MODEL", "large-v3-turbo")
LOWRES_LANGUAGES = {
    "kn", "te", "ta", "ml", "mr", "gu", "pa", "bn", "or", "as",
    "ne", "si", "ur", "sd", "sa",
}

_whisper_models = {}
_language_id_model = None


def _model_name_for(language):
    """Pick the Whisper model: explicit env choice wins, else by language."""
    if os.environ.get("CONTENTPULSE_WHISPER_MODEL"):
        return WHISPER_MODEL_NAME
    if language in LOWRES_LANGUAGES:
        return LOWRES_MODEL_NAME
    return WHISPER_MODEL_NAME


def get_whisper_model(model_name=None):
    name = model_name or WHISPER_MODEL_NAME

    if name not in _whisper_models:
        print(f"Loading faster-whisper model ({name})...")
        _whisper_models[name] = WhisperModel(
            name,
            device="cpu",
            compute_type="int8",
            cpu_threads=os.cpu_count() or 4,
        )
        print("Whisper model loaded.")

    return _whisper_models[name]


def _get_language_id_model():
    """Load the language-only VoxLingua107 classifier on first use."""
    global _language_id_model

    if _language_id_model is not None:
        return _language_id_model

    try:
        from speechbrain.inference.classifiers import EncoderClassifier
    except ImportError:
        from speechbrain.pretrained import EncoderClassifier

    cache_dir = Path.home() / ".cache" / "contentpulse" / "voxlingua107"
    cache_dir.mkdir(parents=True, exist_ok=True)

    kwargs = dict(
        source="speechbrain/lang-id-voxlingua107-ecapa",
        savedir=str(cache_dir),
        run_opts={"device": "cpu"},
    )

    # Windows without Developer Mode cannot create symlinks, so ask
    # SpeechBrain to COPY files instead (older versions do not have this
    # option, so fall back to the default).
    try:
        from speechbrain.utils.fetching import LocalStrategy

        _language_id_model = EncoderClassifier.from_hparams(
            local_strategy=LocalStrategy.COPY, **kwargs
        )
    except (ImportError, TypeError):
        _language_id_model = EncoderClassifier.from_hparams(**kwargs)

    return _language_id_model


# ---------------------------------------------------------
# Audio extraction (unchanged)
# ---------------------------------------------------------
def extract_audio(video_path: str) -> str:
    """
    Extract the video's audio into a 16 kHz mono WAV file.
    """
    video_file = Path(video_path)

    if not video_file.exists():
        raise FileNotFoundError(
            f"Video file not found: {video_file}"
        )

    if not os.path.exists(FFMPEG_PATH):
        raise FileNotFoundError(
            f"FFmpeg was not found at:\n{FFMPEG_PATH}"
        )

    audio_path = GENERATED_DIR / f"{video_file.stem}.wav"

    command = [
        FFMPEG_PATH,
        "-y",
        "-i",
        str(video_file),
        "-vn",
        "-acodec",
        "pcm_s16le",
        "-ar",
        "16000",
        "-ac",
        "1",
        str(audio_path),
    ]

    try:
        subprocess.run(
            command,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
    except subprocess.CalledProcessError as exc:
        error_message = exc.stderr.decode(errors="ignore")
        raise RuntimeError(
            f"Audio extraction failed:\n{error_message}"
        ) from exc

    if not audio_path.exists():
        raise RuntimeError(
            "FFmpeg completed, but the audio file was not created."
        )

    print(f"Audio extracted: {audio_path}")
    return str(audio_path)


# ---------------------------------------------------------
# Script tables (all major Indian + foreign scripts)
# ---------------------------------------------------------
_SCRIPT_RANGES = {
    "devanagari": [(0x0900, 0x097F), (0xA8E0, 0xA8FF)],
    "bengali": [(0x0980, 0x09FF)],
    "gurmukhi": [(0x0A00, 0x0A7F)],
    "gujarati": [(0x0A80, 0x0AFF)],
    "oriya": [(0x0B00, 0x0B7F)],
    "tamil": [(0x0B80, 0x0BFF)],
    "telugu": [(0x0C00, 0x0C7F)],
    "kannada": [(0x0C80, 0x0CFF)],
    "malayalam": [(0x0D00, 0x0D7F)],
    "sinhala": [(0x0D80, 0x0DFF)],
    "thai": [(0x0E00, 0x0E7F)],
    "lao": [(0x0E80, 0x0EFF)],
    "tibetan": [(0x0F00, 0x0FFF)],
    "myanmar": [(0x1000, 0x109F)],
    "georgian": [(0x10A0, 0x10FF)],
    "hangul": [(0x1100, 0x11FF), (0x3130, 0x318F), (0xAC00, 0xD7AF)],
    "ethiopic": [(0x1200, 0x137F)],
    "khmer": [(0x1780, 0x17FF)],
    "greek": [(0x0370, 0x03FF), (0x1F00, 0x1FFF)],
    "cyrillic": [(0x0400, 0x052F)],
    "armenian": [(0x0530, 0x058F)],
    "hebrew": [(0x0590, 0x05FF)],
    "arabic": [
        (0x0600, 0x06FF),
        (0x0750, 0x077F),
        (0xFB50, 0xFDFF),
        (0xFE70, 0xFEFF),
    ],
    "cjk": [(0x3040, 0x30FF), (0x3400, 0x4DBF), (0x4E00, 0x9FFF)],
}

_ALL_SCRIPTS = list(_SCRIPT_RANGES.keys()) + ["latin"]

_SCRIPT_BY_LANGUAGE = {
    # Devanagari
    "hi": "devanagari", "mr": "devanagari", "ne": "devanagari",
    "sa": "devanagari",
    # Other Indian scripts
    "kn": "kannada", "te": "telugu", "ta": "tamil", "ml": "malayalam",
    "bn": "bengali", "as": "bengali", "pa": "gurmukhi", "gu": "gujarati",
    "or": "oriya", "si": "sinhala",
    # Arabic script
    "ar": "arabic", "fa": "arabic", "ur": "arabic", "ps": "arabic",
    "sd": "arabic",
    # Cyrillic
    "ru": "cyrillic", "uk": "cyrillic", "bg": "cyrillic",
    "be": "cyrillic", "sr": "cyrillic", "mk": "cyrillic",
    "kk": "cyrillic", "ky": "cyrillic", "mn": "cyrillic",
    "tg": "cyrillic", "tt": "cyrillic", "ba": "cyrillic",
    # Others
    "he": "hebrew", "yi": "hebrew",
    "th": "thai", "lo": "lao", "km": "khmer", "my": "myanmar",
    "bo": "tibetan", "ka": "georgian", "hy": "armenian",
    "am": "ethiopic", "el": "greek",
    "ko": "hangul", "ja": "cjk", "zh": "cjk", "yue": "cjk",
}
# Every language not listed above is treated as Latin-script.

# Short native-script primers. Used ONLY as a retry when the first pass
# produced the wrong script. Stripped from the output if echoed back.
_NATIVE_PROMPTS = {
    "kn": "ನಮಸ್ಕಾರ, ಇದು ಕನ್ನಡ ಭಾಷೆಯಲ್ಲಿರುವ ವೀಡಿಯೊ.",
    "hi": "नमस्ते, यह हिंदी भाषा में एक वीडियो है।",
    "ta": "வணக்கம், இது தமிழ் மொழியில் உள்ள வீடியோ.",
    "te": "నమస్కారం, ఇది తెలుగు భాషలో ఉన్న వీడియో.",
    "ml": "നമസ്കാരം, ഇത് മലയാളം ഭാഷയിലുള്ള വീഡിയോ ആണ്.",
    "mr": "नमस्कार, हा मराठी भाषेतील व्हिडिओ आहे.",
    "bn": "নমস্কার, এটি বাংলা ভাষার একটি ভিডিও।",
    "gu": "નમસ્તે, આ ગુજરાતી ભાષામાં વિડિઓ છે.",
    "pa": "ਸਤ ਸ੍ਰੀ ਅਕਾਲ, ਇਹ ਪੰਜਾਬੀ ਭਾਸ਼ਾ ਵਿੱਚ ਇੱਕ ਵੀਡੀਓ ਹੈ।",
    "ur": "السلام علیکم، یہ اردو زبان میں ایک ویڈیو ہے۔",
}


# ---------------------------------------------------------
# Language-code and script helpers
# ---------------------------------------------------------
def _clean_language_code(language):
    """
    Turn None / 'auto' / '' into None (= auto-detect).
    Validate real language codes against Whisper's supported list.
    """
    if language is None:
        return None

    code = str(language).strip().lower()

    if code in ("", "auto", "none", "original", "detect"):
        return None

    if code != "yue":
        code = code.replace("_", "-").split("-")[0]

    try:
        from faster_whisper.tokenizer import _LANGUAGE_CODES
        valid = code in _LANGUAGE_CODES
    except Exception:
        valid = len(code) in (2, 3)

    return code if valid else None


def _count_script_chars(text: str):
    """
    Count characters per Unicode script. Used only to verify the
    transcript is in the expected script. We NEVER transliterate.
    """
    counts = {name: 0 for name in _ALL_SCRIPTS}

    for char in text:
        code = ord(char)

        if (
            0x41 <= code <= 0x5A
            or 0x61 <= code <= 0x7A
            or 0xC0 <= code <= 0x24F
            or 0x1E00 <= code <= 0x1EFF
        ):
            counts["latin"] += 1
            continue

        if code < 0x0370:
            continue

        for script, ranges in _SCRIPT_RANGES.items():
            if any(lo <= code <= hi for lo, hi in ranges):
                counts[script] += 1
                break

    return counts


def _expected_script(language: str) -> str:
    return _SCRIPT_BY_LANGUAGE.get(language, "latin")


def _script_profile(language: str, text: str):
    """
    Returns (native_count, native_ratio, foreign_ratio).

    Latin words inside a non-Latin language are tolerated because of
    normal code-switching (English words inside Kannada).
    """
    if not text:
        return 0, 0.0, 0.0

    counts = _count_script_chars(text)
    total = sum(counts.values())

    if total == 0:
        return 0, 0.0, 0.0

    expected = _expected_script(language)
    native = counts.get(expected, 0)

    if expected == "latin":
        foreign = total - native
    else:
        foreign = total - native - counts["latin"]

    return native, native / total, max(0, foreign) / total


def _parse_language_probs(raw):
    result = []

    try:
        for item in raw:
            if isinstance(item, (tuple, list)) and len(item) >= 2:
                language, probability = item[0], item[1]
                if isinstance(language, str) and isinstance(
                    probability, (int, float)
                ):
                    result.append(
                        (language.lower(), float(probability))
                    )
    except Exception:
        return []

    return result


# ---------------------------------------------------------
# Transcript quality helpers
# ---------------------------------------------------------
_PUNCT = ".,!?;:()[]{}\"'।॥-–—…"


# A short unit (1-4 characters) repeated 4+ times in a row, e.g. the end-of-
# video loop "ಮಾನಿದಿದಿದಿದಿದಿದಿ..." or "ಠಠಠಠ".
_RUNAWAY = re.compile(r"(.{1,4}?)\1{3,}", re.DOTALL)


def _fix_runaway_token(token: str) -> str:
    core = token.strip(_PUNCT)

    if not core or any(ch.isdigit() for ch in core):
        return token

    if len(core) >= 3 and len(set(core)) == 1:
        return ""

    match = _RUNAWAY.search(core)
    if not match:
        return token

    run_length = len(match.group(0))

    # Mostly (or long) loop -> drop the token; otherwise keep ONE copy.
    if run_length >= 12 or run_length >= 0.6 * len(core):
        return ""

    return token.replace(match.group(0), match.group(1), 1)


def _clean_segment_text(text: str) -> str:
    """
    Remove hallucinated loops/filler such as "ಠಠಠ ಠಠಠಠ" and
    "ಮಾನಿದಿದಿದಿದಿದಿ...". Normal words are never touched.
    """
    kept = []
    # U+FFFD is a half-decoded character (Whisper ran out of tokens mid-letter).
    for token in (text or "").replace("\ufffd", "").split():
        fixed = _fix_runaway_token(token)
        if fixed:
            kept.append(fixed)
    return " ".join(kept).strip()


def _collapse_word_runs(text: str, min_run: int = 4):
    """
    Collapse a word repeated 4+ times in a row ("में में में में") to one.
    Returns (collapsed_text, fraction_of_words_removed). Words with digits
    are never touched.
    """
    tokens = text.split()
    if not tokens:
        return text, 0.0

    out = []
    removed = 0
    i = 0

    while i < len(tokens):
        key = tokens[i].strip(_PUNCT).casefold()
        j = i + 1
        while j < len(tokens) and key and tokens[j].strip(_PUNCT).casefold() == key:
            j += 1

        run = j - i
        if key and run >= min_run and not any(ch.isdigit() for ch in key):
            out.append(tokens[i])
            removed += run - 1
        else:
            out.extend(tokens[i:j])
        i = j

    return " ".join(out), removed / len(tokens)


def _is_obvious_repetition_loop(text: str) -> bool:
    """Reject only transcript segments dominated by a long exact token loop."""
    words = [
        word.strip(".,!?;:()[]{}\"'।॥").casefold()
        for word in text.split()
    ]
    words = [word for word in words if word]

    if len(words) >= 12:
        most_common, count = Counter(words).most_common(1)[0]
        if len(most_common) >= 2 and count >= 10 and count / len(words) >= 0.65:
            return True

        max_phrase_length = min(6, len(words) // 8)
        for phrase_length in range(2, max_phrase_length + 1):
            for start in range(len(words) - phrase_length * 8 + 1):
                phrase = words[start:start + phrase_length]
                repeats = 1
                next_start = start + phrase_length
                while (
                    next_start + phrase_length <= len(words)
                    and words[next_start:next_start + phrase_length] == phrase
                ):
                    repeats += 1
                    next_start += phrase_length
                if repeats >= 8 and repeats * phrase_length / len(words) >= 0.7:
                    return True

    return False


def _candidate_is_healthy(text: str, min_words: int = 6) -> bool:
    """
    Reject obvious hallucination loops. Never modifies the text.
    Works for spaced languages and for unspaced ones
    (Chinese, Japanese, Thai, Khmer, Lao, Myanmar...).
    """
    words = [
        w.strip(".,!?;:()[]{}\"'।॥").lower()
        for w in text.split()
    ]
    words = [w for w in words if w]

    compact = "".join(text.split())

    # Unspaced scripts: judge by characters instead of words.
    if len(words) <= 3 and len(compact) >= 20:
        longest_run = 1
        current_run = 1
        for i in range(1, len(compact)):
            if compact[i] == compact[i - 1]:
                current_run += 1
                longest_run = max(longest_run, current_run)
            else:
                current_run = 1

        if longest_run >= 12:
            return False

        trigrams = [compact[i:i + 3] for i in range(len(compact) - 2)]
        if trigrams and len(set(trigrams)) / len(trigrams) < 0.30:
            return False

        return True

    if len(words) < min_words:
        return False

    longest_run = 1
    current_run = 1
    for i in range(1, len(words)):
        if words[i] == words[i - 1]:
            current_run += 1
            longest_run = max(longest_run, current_run)
        else:
            current_run = 1

    if longest_run >= 7:
        return False

    counts = Counter(words)
    most_common_count = counts.most_common(1)[0][1]
    if most_common_count / len(words) >= 0.45:
        return False

    if len(words) >= 10:
        bigrams = [
            (words[i], words[i + 1])
            for i in range(len(words) - 1)
        ]
        unique_bigrams = len(set(bigrams))
        if unique_bigrams / len(bigrams) < 0.35:
            return False

    return True


def _build_evaluation(language, transcript, avg_logprob, prior):
    native_count, native_ratio, foreign_ratio = _script_profile(
        language, transcript
    )

    healthy = _candidate_is_healthy(transcript, min_words=3)

    if _expected_script(language) == "latin":
        script_ok = bool(transcript) and foreign_ratio <= 0.10
        script_quality = 1.0 - foreign_ratio
    else:
        script_ok = (
            native_count >= 4
            and native_ratio >= 0.25
            and foreign_ratio <= 0.10
        )
        script_quality = native_ratio

    word_count = len(transcript.split())

    score = 0.0
    score += 3.0 if healthy else 0.0
    score += 3.0 if script_ok else 0.0
    score += 2.0 * script_quality
    score -= 4.0 * foreign_ratio
    if avg_logprob is not None:
        score += 2.0 * max(-2.0, avg_logprob)
    score += 2.0 * prior
    score += min(word_count, 200) / 200.0

    accepted = (
        bool(transcript)
        and healthy
        and script_ok
        and (avg_logprob is None or avg_logprob >= -1.2)
    )

    return {
        "language": language,
        "transcript": transcript,
        "avg_logprob": avg_logprob,
        "native_count": native_count,
        "native_ratio": native_ratio,
        "foreign_ratio": foreign_ratio,
        "healthy": healthy,
        "script_ok": script_ok,
        "accepted": accepted,
        "prior": prior,
        "score": score,
    }


def _segment_coverage(spans, duration):
    """Measure valid decoded timestamp coverage, including internal gaps."""
    if duration <= 0 or not spans:
        return {"ratio": 0.0, "largest_gap": duration, "trailing_gap": duration}

    merged = []
    for start, end in sorted(spans):
        start = max(0.0, min(float(start), duration))
        end = max(start, min(float(end), duration))
        if end <= start:
            continue
        if merged and start <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], end))
        else:
            merged.append((start, end))

    if not merged:
        return {"ratio": 0.0, "largest_gap": duration, "trailing_gap": duration}

    covered = sum(end - start for start, end in merged)
    gaps = [merged[0][0]]
    gaps.extend(
        max(0.0, merged[index + 1][0] - merged[index][1])
        for index in range(len(merged) - 1)
    )
    trailing_gap = max(0.0, duration - merged[-1][1])
    gaps.append(trailing_gap)
    return {
        "ratio": min(1.0, covered / duration),
        "largest_gap": max(gaps, default=duration),
        "trailing_gap": trailing_gap,
    }


# ---------------------------------------------------------
# Full transcription pass
# ---------------------------------------------------------
def _transcribe_once(
    model,
    audio_file,
    language=None,
    multilingual=False,
    initial_prompt=None,
    clip_timestamps=None,
    rescue=False,
):
    """
    One complete source-language transcription pass.

    rescue=True is used only to re-decode stretches that failed the first
    time (loops / missing text): wider search, retries at higher temperature
    and a repetition penalty so the model cannot fall into "में में में...".

    - language is locked to the identified language, so Whisper cannot
      drift between Kannada / Hindi / Malayalam segment by segment.
    - Low-confidence segments are NOT dropped as "silence".
    - Timed segments are returned so coverage can be checked.
    """
    if clip_timestamps is None:
        clip_timestamps = "0"

    # VAD and explicit clip windows do not combine, so chunked passes and
    # tail recovery run without VAD (junk filters handle silence instead).
    vad_on = USE_VAD and clip_timestamps == "0"

    if rescue:
        decode_kwargs = dict(
            beam_size=5,
            best_of=3,
            temperature=(0.0, 0.2, 0.4, 0.6),
            compression_ratio_threshold=2.0,
            log_prob_threshold=-1.0,
            repetition_penalty=1.1,
            no_repeat_ngram_size=4,
        )
    else:
        decode_kwargs = dict(
            beam_size=BEAM_SIZE,
            best_of=3,
            temperature=(
                (0.0, 0.2, 0.4)
                if os.environ.get("CONTENTPULSE_FALLBACK") == "1"
                else 0.0
            ),
            compression_ratio_threshold=2.4,
            log_prob_threshold=-1.5,
        )

    segments, info = model.transcribe(
        str(audio_file),
        language=language,
        multilingual=multilingual,
        task="transcribe",
        **decode_kwargs,
        vad_filter=vad_on,
        vad_parameters=dict(
            threshold=0.3,
            min_silence_duration_ms=1500,
            speech_pad_ms=600,
        ),
        condition_on_previous_text=False,
        no_speech_threshold=None,
        without_timestamps=False,
        clip_timestamps=clip_timestamps,
        initial_prompt=initial_prompt,
    )

    texts = []
    avg_logprobs = []
    segment_count = 0
    first_segment_start = None
    last_segment_end = 0.0
    segment_spans = []
    items = []

    for segment in segments:
        text = _clean_segment_text(segment.text or "")
        start = getattr(segment, "start", None)
        end = getattr(segment, "end", None)

        if text:
            print(f"  [{float(start or 0):6.1f}s - {float(end or 0):6.1f}s] {text[:70]}")

        no_speech_prob = getattr(segment, "no_speech_prob", None)
        seg_logprob = getattr(segment, "avg_logprob", None)
        if (
            isinstance(no_speech_prob, (int, float))
            and isinstance(seg_logprob, (int, float))
            and no_speech_prob > 0.85
            and seg_logprob < -1.0
        ):
            print("Skipping a probable silence/music hallucination segment.")
            text = ""

        if isinstance(end, (int, float)):
            last_segment_end = max(last_segment_end, float(end))

        if text:
            collapsed, removed_fraction = _collapse_word_runs(text)

            if _is_obvious_repetition_loop(text) or removed_fraction >= 0.5:
                print("Skipping a looping segment (will be re-decoded with stronger settings).")
            else:
                text = collapsed
                texts.append(text)
                if (
                    isinstance(start, (int, float))
                    and isinstance(end, (int, float))
                    and float(end) > float(start)
                ):
                    segment_spans.append((float(start), float(end)))
                    items.append((float(start), float(end), text))
                if first_segment_start is None and isinstance(start, (int, float)):
                    first_segment_start = float(start)

        avg_logprob = getattr(segment, "avg_logprob", None)
        if isinstance(avg_logprob, (int, float)):
            avg_logprobs.append(float(avg_logprob))

        segment_count += 1

    transcript = " ".join(texts).strip()
    average_logprob = mean(avg_logprobs) if avg_logprobs else None

    return (
        transcript,
        info,
        average_logprob,
        segment_count,
        first_segment_start,
        last_segment_end,
        segment_spans,
        items,
    )


# ---------------------------------------------------------
# Short, silence-aware chunks (fixes cut-off Kannada/Indian-language text)
# ---------------------------------------------------------
def _chunk_seconds_for(language):
    """
    Whisper has a fixed token budget per 30-second window. Kannada, Hindi,
    Tamil and other non-Latin scripts use MANY tokens per word, so the
    window overflows and the end of the speech is silently lost.
    Shorter chunks avoid that. Latin-script languages do not need it.
    """
    env = os.environ.get("CONTENTPULSE_CHUNK_SECONDS")
    if env is not None:
        try:
            return max(0.0, float(env))
        except ValueError:
            pass

    return 0.0 if _expected_script(language) in ("latin", "cjk") else 12.0


def _chunk_boundaries(audio, chunk_seconds, sample_rate=16000):
    """
    Split points near every `chunk_seconds`, each moved to the quietest
    moment within +/-30% so words are not cut in half.
    Returns a clip_timestamps list [start, end, start, end, ...] or None.
    """
    import numpy as np

    total = len(audio) / sample_rate

    if chunk_seconds <= 0 or total <= chunk_seconds * 1.3:
        return None

    step = 0.02
    frame = int(step * sample_rate)
    n_frames = len(audio) // frame

    if n_frames < 10:
        return None

    frames = np.asarray(audio[: n_frames * frame], dtype=np.float32)
    energy = np.sqrt(np.mean(np.square(frames.reshape(n_frames, frame)), axis=1))

    search = chunk_seconds * 0.3
    cuts = [0.0]
    position = 0.0

    while total - position > chunk_seconds * 1.3:
        target = position + chunk_seconds
        lo = max(int((target - search) / step), int((position + 2.0) / step))
        hi = min(int((target + search) / step), n_frames - 1)

        if hi - lo >= 5:
            smooth = np.convolve(energy[lo:hi], np.ones(5) / 5, mode="same")
            cut = (lo + int(np.argmin(smooth))) * step
        else:
            cut = target

        cuts.append(cut)
        position = cut

    cuts.append(total)

    clips = []
    for start, end in zip(cuts[:-1], cuts[1:]):
        clips.extend([round(start, 2), round(end, 2)])

    return clips


def _build_chunk_clips(audio_file, chunk_seconds):
    try:
        from faster_whisper.audio import decode_audio

        audio = decode_audio(str(audio_file), sampling_rate=16000)
        return _chunk_boundaries(audio, chunk_seconds)
    except Exception as exc:
        print(f"Chunking unavailable ({exc}); using normal windows.")
        return None


# ---------------------------------------------------------
# Recover speech the model skipped (anywhere in the video)
# ---------------------------------------------------------
def _load_audio_array(audio_file):
    from faster_whisper.audio import decode_audio

    return decode_audio(str(audio_file), sampling_rate=16000)


def _voiced_frames(audio, sample_rate=16000, step=0.02):
    """Boolean per 20 ms frame: True where the audio is loud enough to be speech."""
    import numpy as np

    frame = int(step * sample_rate)
    n_frames = len(audio) // frame

    if n_frames < 10:
        return np.zeros(0, dtype=bool), step

    frames = np.asarray(audio[: n_frames * frame], dtype=np.float32)
    energy = np.sqrt(np.mean(np.square(frames.reshape(n_frames, frame)), axis=1))
    speech_level = float(np.percentile(energy, 90))
    threshold = max(0.003, 0.20 * speech_level)

    return energy > threshold, step


def _find_missing_speech_regions(audio, spans, duration, min_gap=2.5, min_voiced=1.2):
    """
    Time ranges that contain voice-level audio but received NO transcript text.
    Returns [(start, end), ...] in seconds.
    """
    voiced, step = _voiced_frames(audio)

    if len(voiced) == 0:
        return []

    merged = []
    for start, end in sorted(spans):
        start = max(0.0, min(float(start), duration))
        end = max(start, min(float(end), duration))
        if merged and start <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(merged[-1][1], end))
        else:
            merged.append((start, end))

    gaps = []
    cursor = 0.0
    for start, end in merged:
        if start - cursor >= min_gap:
            gaps.append((cursor, start))
        cursor = max(cursor, end)
    if duration - cursor >= min_gap:
        gaps.append((cursor, duration))

    regions = []
    for start, end in gaps:
        lo = int(start / step)
        hi = min(int(end / step), len(voiced))
        if hi <= lo:
            continue
        voiced_seconds = float(voiced[lo:hi].sum()) * step
        if voiced_seconds >= min_voiced and voiced_seconds / (end - start) >= 0.25:
            regions.append((start, end))

    return regions


def _fill_missing_speech(model, audio_file, audio, items, language, duration,
                         rounds=(6.0, 4.0)):
    """
    Re-transcribe ONLY the stretches that have speech but no text, in short
    chunks. Recovered text is merged back in time order.
    """
    sample_rate = 16000
    budget = max(25.0, duration * 0.6)  # never re-decode more than this many seconds

    for chunk_seconds in rounds:
        regions = _find_missing_speech_regions(
            audio, [(a, b) for a, b, _t in items], duration
        )

        if not regions:
            break

        print(
            "MISSING SPEECH REGIONS: "
            + ", ".join(f"{a:.1f}s-{b:.1f}s" for a, b in regions)
        )

        clips = []
        used = 0.0
        for start, end in regions:
            if used + (end - start) > budget:
                break
            used += end - start

            piece = audio[int(start * sample_rate):int(end * sample_rate)]
            relative = _chunk_boundaries(piece, chunk_seconds)

            if relative:
                for index in range(0, len(relative), 2):
                    a = round(start + relative[index], 2)
                    b = round(start + relative[index + 1], 2)
                    if b - a >= 0.5:
                        clips.extend([a, b])
            elif end - start >= 0.5:
                clips.extend([round(start, 2), round(end, 2)])

        if not clips:
            break

        result = _transcribe_once(
            model,
            audio_file,
            language=language,
            multilingual=False,
            clip_timestamps=clips,
            rescue=True,
        )
        new_items = result[7]
        print(f"Recovered {len(new_items)} missing segment(s).")

        if new_items:
            items = items + new_items

    return items


# ---------------------------------------------------------
# Language identification
# ---------------------------------------------------------
def _identify_source_language(audio_file, max_windows=30):
    """
    Dedicated language-ID model (SpeechBrain VoxLingua107, 107 languages).
    Listens to overlapping windows across the WHOLE audio and combines
    the votes. Much better than Whisper's guess for Kannada / Telugu /
    Tamil / Malayalam / Hindi.
    """
    import numpy as np
    import torch
    from faster_whisper.audio import decode_audio

    audio = decode_audio(str(audio_file), sampling_rate=16000)
    if len(audio) == 0:
        raise RuntimeError("Cannot identify a language in empty audio.")

    classifier = _get_language_id_model()
    sample_rate = 16000
    window_size = 8 * sample_rate
    hop_size = 4 * sample_rate

    starts = list(range(0, max(1, len(audio) - window_size + 1), hop_size))
    final_start = max(0, len(audio) - window_size)
    if not starts or starts[-1] != final_start:
        starts.append(final_start)

    # Keep long videos fast: use at most max_windows evenly spread windows.
    if len(starts) > max_windows:
        step = (len(starts) - 1) / (max_windows - 1)
        starts = [starts[int(round(i * step))] for i in range(max_windows)]

    chunks = [audio[s:min(s + window_size, len(audio))] for s in starts]
    energies = [
        float(np.sqrt(np.mean(np.square(chunk)))) if len(chunk) else 0.0
        for chunk in chunks
    ]
    peak_energy = max(energies, default=0.0)
    evidence = {}
    analyzed = 0

    for chunk, energy in zip(chunks, energies):
        if len(chunk) < 2 * sample_rate or energy < max(0.003, peak_energy * 0.20):
            continue

        waveform = torch.as_tensor(
            np.asarray(chunk, dtype=np.float32)
        ).unsqueeze(0)
        _out_prob, score, _index, labels = classifier.classify_batch(waveform)
        label = labels[0] if isinstance(labels, (tuple, list)) else labels
        code = _clean_language_code(str(label).split(":", 1)[0].strip())
        if not code:
            continue

        # SpeechBrain scores are log-posteriors; convert to probability.
        confidence = float(torch.as_tensor(score).reshape(-1)[0].exp().item())
        confidence = min(1.0, max(0.0, confidence))
        duration = len(chunk) / sample_rate
        evidence[code] = evidence.get(code, 0.0) + duration * confidence
        analyzed += 1

    if not evidence:
        raise RuntimeError("The language-ID model found no usable speech windows.")

    total_evidence = sum(evidence.values())
    ranked = sorted(
        ((code, value / total_evidence) for code, value in evidence.items()),
        key=lambda item: item[1],
        reverse=True,
    )
    return {
        "language": ranked[0][0],
        "confidence": ranked[0][1],
        "probabilities": ranked,
        "windows": analyzed,
        "method": "voxlingua107",
    }


# ---- Whisper-based fallback (used only if SpeechBrain is unavailable) ----
def _detect_language_multi_window(model, audio_file, max_windows=5):
    """Whisper language detection over several windows across the video."""
    try:
        import numpy as np
        from faster_whisper.audio import decode_audio

        audio = decode_audio(str(audio_file), sampling_rate=16000)
    except Exception as exc:
        print(f"Whisper detection unavailable (audio load): {exc}")
        return []

    window = 30 * 16000
    total = len(audio)

    if total == 0:
        return []

    if total <= window:
        starts = [0]
    else:
        n_windows = min(max_windows, -(-total // window))
        starts = (
            [0]
            if n_windows <= 1
            else [
                int(i * (total - window) / (n_windows - 1))
                for i in range(n_windows)
            ]
        )

    chunks = [audio[s:s + window] for s in starts]
    energies = [
        float(np.sqrt(np.mean(np.square(c)))) if len(c) else 0.0
        for c in chunks
    ]
    max_energy = max(energies) if energies else 0.0

    if max_energy <= 0.0:
        return []

    chunks = [c for c, e in zip(chunks, energies) if e >= 0.35 * max_energy]

    totals = {}
    used = 0

    for chunk in chunks:
        try:
            result = model.detect_language(audio=chunk)
            probs = _parse_language_probs(result[2])
        except Exception as exc:
            print(f"Window language detection failed: {exc}")
            continue

        if not probs:
            continue

        used += 1
        for lang, prob in probs:
            totals[lang] = totals.get(lang, 0.0) + prob

    if not used:
        return []

    averaged = [(lang, value / used) for lang, value in totals.items()]
    averaged.sort(key=lambda item: item[1], reverse=True)
    return averaged


SAMPLE_SECONDS = 40


def _load_speech_sample(audio_file):
    """Return the most speech-heavy ~40 s of the audio as a numpy array."""
    try:
        import numpy as np
        from faster_whisper.audio import decode_audio

        audio = decode_audio(str(audio_file), sampling_rate=16000)
    except Exception as exc:
        print(f"Could not load audio sample: {exc}")
        return None

    sr = 16000
    size = SAMPLE_SECONDS * sr

    if len(audio) <= size:
        return audio

    best_start = 0
    best_energy = -1.0

    for start in range(0, len(audio) - size + 1, 10 * sr):
        seg = audio[start:start + size]
        energy = float(np.sqrt(np.mean(np.square(seg))))
        if energy > best_energy:
            best_energy = energy
            best_start = start

    return audio[best_start:best_start + size]


def _sample_pass(model, sample, language):
    """One quick, light transcription pass on the short sample."""
    segments, info = model.transcribe(
        sample,
        language=language,
        task="transcribe",
        beam_size=1,
        temperature=0.0,
        vad_filter=True,
        condition_on_previous_text=False,
    )

    texts, logprobs = [], []

    for segment in segments:
        text = segment.text.strip()
        if text:
            texts.append(text)
        lp = getattr(segment, "avg_logprob", None)
        if isinstance(lp, (int, float)):
            logprobs.append(float(lp))

    avg_lp = mean(logprobs) if logprobs else None
    return " ".join(texts).strip(), info, avg_lp


def _verify_language_candidates(model, sample, ranked, max_candidates=3):
    """
    Used only when language ID is not confident: decode the short sample
    in each top candidate and keep the one whose output is healthy and in
    the correct script. Returns the best language code or None.
    """
    if sample is None or not ranked:
        return None

    candidates = [language for language, _p in ranked[:max_candidates]]
    probabilities = dict(ranked)

    best_language = None
    best_score = None

    for language in candidates:
        try:
            text, _info, avg_logprob = _sample_pass(model, sample, language)
        except Exception as exc:
            print(f"Candidate check failed for {language}: {exc}")
            continue

        evaluation = _build_evaluation(
            language, text, avg_logprob, probabilities.get(language, 0.0)
        )
        print(
            f"VERIFY {language}: prior={probabilities.get(language, 0.0):.3f}, "
            f"native={evaluation['native_ratio']:.2f}, "
            f"foreign={evaluation['foreign_ratio']:.2f}, "
            f"accepted={evaluation['accepted']}, "
            f"score={evaluation['score']:.2f}"
        )

        if evaluation["accepted"] and (
            best_score is None or evaluation["score"] > best_score
        ):
            best_language = language
            best_score = evaluation["score"]

    return best_language


def _choose_language(audio_file, forced):
    """
    Decide the language BEFORE the full transcription.
    Returns (language, confidence, ranked_list, method).
    """
    if forced:
        return forced, 1.0, [(forced, 1.0)], "user-selected"

    ranked = []
    method = ""

    try:
        result = _identify_source_language(audio_file)
        ranked = result["probabilities"]
        method = result["method"]
        print(
            f"LANGUAGE ID ({method}): {result['language']} "
            f"confidence={result['confidence']:.3f} "
            f"windows={result['windows']}"
        )
    except Exception as exc:
        print(
            f"SpeechBrain language ID unavailable ({exc}). "
            "Using Whisper language detection instead."
        )

    if not ranked:
        ranked = _detect_language_multi_window(get_whisper_model(), audio_file)
        method = "whisper-multi-window"

    if not ranked:
        raise RuntimeError("Could not detect the spoken language.")

    print(f"TOP LANGUAGE EVIDENCE: {[(l, round(p, 3)) for l, p in ranked[:8]]}")

    chosen, confidence = ranked[0]

    # Not confident? Check the top candidates against real decoded speech.
    if confidence < 0.60:
        print("Language ID is not confident; verifying top candidates...")
        verified = _verify_language_candidates(
            get_whisper_model(), _load_speech_sample(audio_file), ranked
        )
        if verified:
            chosen = verified

    return chosen, confidence, ranked, method


# ---------------------------------------------------------
# Transcription
# ---------------------------------------------------------
def transcribe_audio(audio_path: str, forced_language=None) -> dict:
    """
    Original-language transcript in its native script.

      1. Identify the language FIRST (fast).
      2. Transcribe the full audio ONCE, locked to that language.
      3. Recover an uncovered tail if the transcript stopped early.
      4. If the script is wrong, retry once with a native-script primer.

    forced_language (or env CONTENTPULSE_LANGUAGE) skips step 1.
    """
    audio_file = Path(audio_path)

    if not audio_file.exists():
        raise FileNotFoundError(f"Audio file not found: {audio_file}")

    forced = (
        _clean_language_code(forced_language)
        or _clean_language_code(os.environ.get("CONTENTPULSE_LANGUAGE"))
    )

    chosen, confidence, ranked, method = _choose_language(audio_file, forced)

    model_name = _model_name_for(chosen)
    model = get_whisper_model(model_name)

    print(f"BUILD: {BUILD_ID}")
    print(f"CHOSEN LANGUAGE: {chosen} (method: {method})")
    print(f"WHISPER MODEL: {model_name}")
    print("TRANSCRIBING FULL AUDIO ONCE in the chosen language...")

    clips = _build_chunk_clips(audio_file, _chunk_seconds_for(chosen))
    if clips:
        print(f"Using {len(clips) // 2} short silence-aware chunks so no speech is cut off.")

    (
        transcript,
        info,
        avg_lp,
        segment_count,
        first_segment_start,
        last_segment_end,
        segment_spans,
        items,
    ) = _transcribe_once(
        model,
        audio_file,
        language=chosen,
        multilingual=False,
        clip_timestamps=clips,
    )

    audio_duration = float(getattr(info, "duration", 0.0) or 0.0)

    # Wrong script / garbage -> one retry with a native-script primer.
    evaluation = _build_evaluation(chosen, transcript, avg_lp, confidence)
    primer = _NATIVE_PROMPTS.get(chosen)

    if primer and not (evaluation["script_ok"] and evaluation["healthy"]):
        print("Transcript script looks wrong; retrying with a native-script primer...")
        try:
            (
                retry_text,
                retry_info,
                retry_lp,
                retry_count,
                retry_first,
                retry_last,
                retry_spans,
                retry_items,
            ) = _transcribe_once(
                model,
                audio_file,
                language=chosen,
                multilingual=False,
                initial_prompt=primer,
                clip_timestamps=clips,
            )

            if retry_text.startswith(primer):
                retry_text = retry_text[len(primer):].strip()

            retry_eval = _build_evaluation(chosen, retry_text, retry_lp, confidence)

            if retry_eval["score"] > evaluation["score"]:
                transcript = retry_text
                info = retry_info
                avg_lp = retry_lp
                segment_count = retry_count
                first_segment_start = retry_first
                last_segment_end = retry_last
                segment_spans = retry_spans
                items = retry_items
        except Exception as exc:
            print(f"Primer retry failed: {exc}")

    # Find speech the model skipped ANYWHERE (middle or ending) and
    # re-transcribe only those stretches in shorter chunks.
    try:
        audio_array = _load_audio_array(audio_file)
        items = _fill_missing_speech(
            model, audio_file, audio_array, items, chosen, audio_duration
        )
        items = sorted(items)
        transcript = " ".join(text for _a, _b, text in items).strip()
        segment_spans = [(a, b) for a, b, _t in items]
        if items:
            last_segment_end = max(last_segment_end, max(b for _a, b, _t in items))
        segment_count = max(segment_count, len(items))
    except Exception as exc:
        print(f"Missing-speech recovery failed: {exc}")

    transcript = _clean_segment_text(transcript)

    if not transcript:
        raise RuntimeError("No speech was detected in the uploaded video.")

    coverage = _segment_coverage(segment_spans, audio_duration)
    repetition_detected = _is_obvious_repetition_loop(transcript)
    final_eval = _build_evaluation(chosen, transcript, avg_lp, confidence)
    language_matches = bool(final_eval["script_ok"])

    is_complete = (
        segment_count > 0
        and coverage["trailing_gap"] <= max(1.5, audio_duration * 0.03)
        and coverage["largest_gap"] <= max(8.0, audio_duration * 0.20)
        and _candidate_is_healthy(transcript, min_words=6)
        and not repetition_detected
        and language_matches
    )

    print("=" * 60)
    print("FINAL ORIGINAL TRANSCRIPT:")
    print(transcript)
    print("=" * 60)
    print(f"FINAL LANGUAGE: {chosen} (confidence {confidence:.3f}, {method})")
    print(f"AUDIO DURATION: {audio_duration:.3f}s")
    print(f"LAST TRANSCRIBED SEGMENT END: {last_segment_end:.3f}s")
    print(f"SEGMENT COUNT: {segment_count}")
    print(f"TIMESTAMP COVERAGE: {coverage}")
    print(f"REPETITION DETECTED: {repetition_detected}")
    print(f"IS COMPLETE: {is_complete}")
    print(f"SCRIPT MATCHES LANGUAGE: {language_matches}")
    print("=" * 60)

    return {
        "transcript": transcript,
        "language": chosen or "",
        "language_probability": confidence,
        "language_probabilities": ranked,
        "language_verified": method != "whisper-multi-window",
        "language_confidence": confidence,
        "top_language_evidence": ranked[:8],
        "audio_duration": audio_duration,
        "first_segment_start": first_segment_start,
        "last_segment_end": last_segment_end,
        "segment_count": segment_count,
        "coverage": coverage,
        "repetition_detected": repetition_detected,
        "is_complete": is_complete,
        "language_matches_transcript": language_matches,
    }


# ---------------------------------------------------------
# Complete pipeline
# ---------------------------------------------------------
def process_video(
    video_path: str,
    language: str | None = None
) -> dict:
    """
    Complete pipeline:

        video -> audio -> language identification -> one locked
        full transcription -> original/source-language transcript

    `language`: None / "auto" = identify automatically; a real code such
    as "kn" or "hi" forces that language (skips identification).

    api_server.py separately generates the English translation.
    No Romanized transcript is generated.
    """
    audio_path = extract_audio(video_path)

    transcription_result = transcribe_audio(
        audio_path,
        forced_language=language,
    )

    return {
        "audio_path": str(audio_path),
        "transcript": transcription_result["transcript"],
        "language": transcription_result["language"],
        "language_probability": transcription_result["language_probability"],
        "language_probabilities": transcription_result["language_probabilities"],
        "language_verified": transcription_result["language_verified"],
        "language_confidence": transcription_result["language_confidence"],
        "top_language_evidence": transcription_result["top_language_evidence"],
        "audio_duration": transcription_result["audio_duration"],
        "first_segment_start": transcription_result["first_segment_start"],
        "last_segment_end": transcription_result["last_segment_end"],
        "segment_count": transcription_result["segment_count"],
        "coverage": transcription_result["coverage"],
        "repetition_detected": transcription_result["repetition_detected"],
        "is_complete": transcription_result["is_complete"],
        "language_matches_transcript": transcription_result["language_matches_transcript"],
    }