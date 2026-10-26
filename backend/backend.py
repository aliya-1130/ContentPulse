 
import os 
import sys 
import re 
import numpy as np 
import pandas as pd 
import joblib 
 
 
# ========================================================= 
# PROJECT PATHS 
# ========================================================= 
 
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__)) 
PROJECT_ROOT = os.path.dirname(BACKEND_DIR) 
 
YOUTUBE_MODEL_DIR = os.path.join( 
    PROJECT_ROOT, "models", "youtube" 
) 
 
INSTAGRAM_MODEL_DIR = os.path.join( 
    PROJECT_ROOT, "models", "instagram" 
) 
 
 
# ========================================================= 
# LOAD YOUTUBE MODEL + PREPROCESSING 
# ========================================================= 
 
YOUTUBE_MODEL_PATH = os.path.join( 
    YOUTUBE_MODEL_DIR, 
    "STEP15_FINAL_RIDGE_REGRESSION.joblib" 
) 
 
YOUTUBE_TFIDF_PATH = os.path.join( 
    YOUTUBE_MODEL_DIR, 
    "ENGAGEMENT_TFIDF.joblib" 
) 
 
YOUTUBE_ENCODER_PATH = os.path.join( 
    YOUTUBE_MODEL_DIR, 
    "ENGAGEMENT_ENCODER.joblib" 
) 
 
YOUTUBE_SCALER_PATH = os.path.join( 
    YOUTUBE_MODEL_DIR, 
    "ENGAGEMENT_SCALER.joblib" 
) 
 
for required_path in [ 
    YOUTUBE_MODEL_PATH, 
    YOUTUBE_TFIDF_PATH, 
    YOUTUBE_ENCODER_PATH, 
    YOUTUBE_SCALER_PATH 
]: 
    if not os.path.exists(required_path): 
        raise FileNotFoundError( 
            f"Required model file not found: {required_path}" 
        ) 
 
ridge_model = joblib.load(YOUTUBE_MODEL_PATH) 
engagement_tfidf = joblib.load(YOUTUBE_TFIDF_PATH) 
engagement_encoder = joblib.load(YOUTUBE_ENCODER_PATH) 
engagement_scaler = joblib.load(YOUTUBE_SCALER_PATH) 
 
 
# ========================================================= 
# YOUTUBE FEATURE EXTRACTION 
# ========================================================= 
 
HOOK_TERMS = [ 
    "stop", "wait", "here's", "here is", "the truth", 
    "secret", "mistake", "why", "how", "3 ways", 
    "5 ways", "you need to know", "before you" 
] 
 
CTA_TERMS = [ 
    "subscribe", "follow", "like", "comment", "share", 
    "save", "tell me", "check out", "let me know" 
] 
 
 
def clean_text(text): 
    if text is None: 
        return "" 
 
    text = str(text).lower().strip() 
    text = re.sub(r"\s+", " ", text) 
    return text 
 
 
def extract_numeric_features(title, transcript, duration_seconds): 
    title_clean = clean_text(title) 
    transcript_clean = clean_text(transcript) 
 
    title_chars = len(title_clean) 
    title_words = len(title_clean.split()) 
 
    title_exclamation_count = title_clean.count("!") 
    title_question_count = title_clean.count("?") 
    title_digit_count = sum(ch.isdigit() for ch in title_clean) 
 
    transcript_chars = len(transcript_clean) 
    transcript_words = len(transcript_clean.split()) 
 
    combined_text = f"{title_clean} {transcript_clean}" 
 
    hook_signal_count = sum( 
        1 for term in HOOK_TERMS 
        if term in combined_text 
    ) 
 
    cta_signal_count = sum( 
        1 for term in CTA_TERMS 
        if term in combined_text 
    ) 
 
    has_hook_signal = int(hook_signal_count > 0) 
    has_cta_signal = int(cta_signal_count > 0) 
 
    sentences = [ 
        s.strip() 
        for s in re.split(r"[.!?]+", transcript_clean) 
        if s.strip() 
    ] 
 
    transcript_sentence_count = len(sentences) 
 
    avg_words_per_sentence = ( 
        transcript_words / transcript_sentence_count 
        if transcript_sentence_count > 0 
        else 0.0 
    ) 
 
    has_question = int("?" in combined_text) 
    has_exclamation = int("!" in combined_text) 
 
    # EXACT TRAINING ORDER 
    return [ 
        float(duration_seconds), 
        float(title_chars), 
        float(title_words), 
        float(title_exclamation_count), 
        float(title_question_count), 
        float(title_digit_count), 
        float(transcript_chars), 
        float(transcript_words), 
        float(hook_signal_count), 
        float(cta_signal_count), 
        float(has_hook_signal), 
        float(has_cta_signal), 
        float(transcript_sentence_count), 
        float(avg_words_per_sentence), 
        float(has_question), 
        float(has_exclamation) 
    ] 
# =========================================================
# VIDEO-SPECIFIC CONTENT ANALYSIS
# =========================================================

def _split_content_sentences(text):
    """
    Split transcript into usable sentences while preserving
    the creator's actual wording.
    """
    clean = str(text or "").strip()

    if not clean:
        return []

    sentences = [
        s.strip()
        for s in re.split(r"(?<=[.!?])\s+|\n+", clean)
        if s.strip()
    ]

    return sentences


def _content_words(text):
    """
    Extract meaningful words from title/transcript.
    This is used only for content understanding and
    does NOT affect the trained engagement model.
    """
    stop_words = {
        "the", "a", "an", "and", "or", "but", "so", "to",
        "of", "in", "on", "for", "with", "is", "are", "was",
        "were", "this", "that", "it", "i", "you", "we", "my",
        "me", "your", "our", "they", "them", "he", "she",
        "he's", "she's", "im", "i'm", "just", "really",
        "very", "today", "actually", "like", "okay", "ok",
        "guys", "everyone", "here", "there", "then"
    }

    words = re.findall(r"[A-Za-z][A-Za-z0-9'-]*", clean_text(text))

    return [
        word
        for word in words
        if word not in stop_words and len(word) > 2
    ]


def _infer_content_type(title, transcript):
    """
    Infer the actual video type from title + transcript.

    Niche is deliberately NOT used here.
    """
    combined = clean_text(
        f"{title} {transcript}"
    )

    type_patterns = [
        (
            "what-i-eat-in-a-day",
            [
                r"\bwhat i eat\b",
                r"\bwhat i ate\b",
                r"\bwhat i eat in a day\b",
                r"\bwhat i ate in a day\b",
                r"\bmeals? i (eat|ate)\b",
                r"\bfood diary\b"
            ]
        ),
        (
            "day-in-the-life",
            [
                r"\bday in my life\b",
                r"\bday in the life\b",
                r"\ba day with me\b",
                r"\bmy morning\b",
                r"\bmy routine\b",
                r"\bdaily routine\b"
            ]
        ),
        (
            "tutorial-how-to",
            [
                r"\bhow to\b",
                r"\bhow do i\b",
                r"\bstep by step\b",
                r"\btutorial\b",
                r"\bsteps\b"
            ]
        ),
        (
            "review",
            [
                r"\breview\b",
                r"\bworth it\b",
                r"\bpros and cons\b",
                r"\bmy review\b",
                r"\btested\b"
            ]
        ),
        (
            "first-impression",
            [
                r"\bfirst impression\b",
                r"\btrying .* for the first time\b",
                r"\btry .* for the first time\b",
                r"\bfirst time using\b"
            ]
        ),
        (
            "storytime",
            [
                r"\bstorytime\b",
                r"\bstory\b",
                r"\bwhat happened\b",
                r"\blet me tell you\b"
            ]
        ),
        (
            "list-tips",
            [
                r"\b\d+ tips?\b",
                r"\b\d+ ways?\b",
                r"\b\d+ things?\b",
                r"\btips?\b",
                r"\bways to\b"
            ]
        ),
        (
            "study-content",
            [
                r"\bstudy\b",
                r"\bstudying\b",
                r"\bexam\b",
                r"\bnotes\b",
                r"\brevision\b",
                r"\bsemester\b"
            ]
        ),
        (
            "workout",
            [
                r"\bworkout\b",
                r"\btraining\b",
                r"\bexercise\b",
                r"\bgym\b",
                r"\breps?\b",
                r"\bsets?\b"
            ]
        ),
        (
            "recipe-food",
            [
                r"\brecipe\b",
                r"\bcook\b",
                r"\bcooking\b",
                r"\bingredients?\b",
                r"\bmake this\b",
                r"\bhow i made\b"
            ]
        ),
        (
            "tech-tool-demo",
            [
                r"\bapp\b",
                r"\btool\b",
                r"\bsoftware\b",
                r"\bfeature\b",
                r"\bwebsite\b",
                r"\bai tool\b",
                r"\bchatgpt\b",
                r"\bdemo\b"
            ]
        ),
        (
            "product-related",
            [
                r"\bproduct\b",
                r"\bproduct review\b",
                r"\bskincare\b",
                r"\bfoundation\b",
                r"\bsunscreen\b",
                r"\bserum\b",
                r"\bcream\b"
            ]
        )
    ]

    scores = []

    for content_type, patterns in type_patterns:
        matched = sum(
            1
            for pattern in patterns
            if re.search(pattern, combined)
        )

        if matched:
            scores.append(
                (matched, content_type)
            )

    if not scores:
        return "general"

    scores.sort(
        key=lambda item: item[0],
        reverse=True
    )

    return scores[0][1]


def _find_specific_topic(title, transcript):
    """
    Extract a topic phrase from the actual title/transcript.

    The result is used to construct examples from the
    uploaded video's own content.
    """
    title_words = _content_words(title)
    transcript_words = _content_words(transcript)

    if title_words:
        title_phrase = " ".join(title_words[:8])

        if title_phrase:
            return title_phrase

    if transcript_words:
        return " ".join(transcript_words[:8])

    return "the main topic"


def _find_main_content_sentence(
    title,
    transcript,
    content_type
):
    """
    Find the transcript sentence that most strongly represents
    the actual topic instead of inventing a topic.
    """
    sentences = _split_content_sentences(transcript)

    if not sentences:
        return ""

    title_words = set(
        _content_words(title)
    )

    type_words = set(
        _content_words(
            content_type.replace("-", " ")
        )
    )

    candidates = []

    for index, sentence in enumerate(sentences):
        sentence_words = set(
            _content_words(sentence)
        )

        title_overlap = len(
            title_words.intersection(sentence_words)
        )

        type_overlap = len(
            type_words.intersection(sentence_words)
        )

        # Earlier sentences receive a small preference,
        # but content relevance matters more.
        score = (
            title_overlap * 4
            + type_overlap * 2
            + min(len(sentence_words), 20) * 0.05
        )

        candidates.append(
            (score, index, sentence)
        )

    candidates.sort(
        key=lambda item: (
            item[0],
            -item[1]
        ),
        reverse=True
    )

    return candidates[0][2]


def _shorten_sentence(sentence, max_words=22):
    """
    Shorten an actual transcript sentence without inventing
    new content.
    """
    words = str(sentence or "").split()

    if len(words) <= max_words:
        return str(sentence).strip()

    return (
        " ".join(words[:max_words]).rstrip(",;:-")
        + "..."
    )


def _find_repeated_phrase(transcript):
    """
    Detect repeated 2-4 word phrases from the actual transcript.
    """
    words = _content_words(transcript)

    if len(words) < 4:
        return ""

    candidates = []

    for size in range(2, 5):
        counts = {}

        for index in range(
            0,
            len(words) - size + 1
        ):
            phrase = " ".join(
                words[index:index + size]
            )

            counts[phrase] = (
                counts.get(phrase, 0) + 1
            )

        for phrase, count in counts.items():
            if count >= 2:
                candidates.append(
                    (count * size, phrase, count)
                )

    if not candidates:
        return ""

    candidates.sort(
        reverse=True
    )

    return candidates[0][1]


def _is_generic_title(title):
    """
    Detect titles that provide very little specific information.
    """
    words = _content_words(title)

    if len(words) <= 2:
        return True

    generic_patterns = [
        r"^vlog$",
        r"^daily vlog$",
        r"^study vlog$",
        r"^my day$",
        r"^a day in my life$",
        r"^today's vlog$",
        r"^my routine$",
        r"^routine$"
    ]

    clean_title = clean_text(title)

    return any(
        re.search(pattern, clean_title)
        for pattern in generic_patterns
    )


def _build_dynamic_content_suggestions(
    title,
    transcript,
    niche,
    duration_seconds
):
    """
    Generate video-specific suggestions from the actual
    title + transcript + duration.

    IMPORTANT:
    These suggestions do not select canned niche templates.
    Every example is constructed from evidence found in
    this video's own text.
    """
    title = str(title or "").strip()
    transcript = str(transcript or "").strip()

    if not transcript:
        return {
            "content_type": "unknown",
            "suggestions": []
        }

    sentences = _split_content_sentences(
        transcript
    )

    if not sentences:
        return {
            "content_type": "unknown",
            "suggestions": []
        }

    content_type = _infer_content_type(
        title,
        transcript
    )

    topic = _find_specific_topic(
        title,
        transcript
    )

    main_sentence = _find_main_content_sentence(
        title,
        transcript,
        content_type
    )

    suggestions = []

    # -----------------------------------------------------
    # 1. INTRO / PAYOFF DELAY
    # -----------------------------------------------------
    title_words = set(
        _content_words(title)
    )

    main_sentence_index = 0

    for index, sentence in enumerate(sentences):
        if sentence == main_sentence:
            main_sentence_index = index
            break

    intro_word_count = sum(
        len(sentence.split())
        for sentence in sentences[
            :main_sentence_index
        ]
    )

    total_word_count = max(
        len(transcript.split()),
        1
    )

    intro_ratio = (
        intro_word_count / total_word_count
    )

    generic_intro = bool(
        re.match(
            r"^(hi|hey|hello|okay|ok|so|welcome)"
            r"\b",
            clean_text(sentences[0])
        )
    )

    if (
        main_sentence_index >= 2
        and intro_ratio >= 0.20
    ) or generic_intro and main_sentence_index >= 1:

        example_sentence = _shorten_sentence(
            main_sentence
        )

        suggestions.append({
            "category": "Hook",
            "title": "Bring the main payoff forward",
            "text": (
                f"The transcript spends its opening on "
                f"introductory material before reaching the "
                f"main {content_type.replace('-', ' ')} content."
            ),
            "fix": (
                "Move the first useful or specific piece of "
                "content closer to the beginning so viewers "
                "understand the payoff earlier."
            ),
            "example": (
                f"Open with the video's actual point: "
                f"“{example_sentence}”"
            ),
            "score": 89
        })

    # -----------------------------------------------------
    # 2. GENERIC TITLE
    # -----------------------------------------------------
    if _is_generic_title(title):
        topic_sentence = _shorten_sentence(
            main_sentence,
            12
        )

        suggestions.append({
            "category": "Title",
            "title": "Make the title more specific",
            "text": (
                f"The title “{title}” gives limited information "
                f"about the specific content found in the transcript."
            ),
            "fix": (
                "Keep the same subject, but include the specific "
                "detail, result, item or activity that actually "
                "appears in this video."
            ),
            "example": (
                f"Use a title that reflects the actual content, "
                f"such as: “{topic_sentence}”"
            ),
            "score": 84
        })

    # -----------------------------------------------------
    # 3. REPETITION
    # -----------------------------------------------------
    repeated_phrase = _find_repeated_phrase(
        transcript
    )

    if repeated_phrase:
        suggestions.append({
            "category": "Structure",
            "title": "Tighten repeated wording",
            "text": (
                f"The transcript repeats the phrase "
                f"“{repeated_phrase}”, which can make the "
                f"content feel less concise."
            ),
            "fix": (
                "Keep the strongest occurrence and use the "
                "saved time for a new detail, example or payoff."
            ),
            "example": (
                f"Keep “{repeated_phrase}” once, then move "
                f"directly into the next unique point."
            ),
            "score": 82
        })

    # -----------------------------------------------------
    # 4. STRUCTURE / LATE TOPIC
    # -----------------------------------------------------
    if (
        len(sentences) >= 6
        and main_sentence_index >= 3
    ):
        later_sentence = _shorten_sentence(
            main_sentence
        )

        suggestions.append({
            "category": "Structure",
            "title": "Introduce the core content earlier",
            "text": (
                f"The strongest topic-related sentence appears "
                f"after {main_sentence_index} earlier sentence(s), "
                f"so the core subject is introduced relatively late."
            ),
            "fix": (
                "Move that specific information earlier and use "
                "the remaining introduction as supporting context."
            ),
            "example": (
                f"Move this actual line closer to the opening: "
                f"“{later_sentence}”"
            ),
            "score": 80
        })

    # -----------------------------------------------------
    # 5. MISSING CTA
    # -----------------------------------------------------
    lower_transcript = clean_text(
        transcript
    )

    has_cta = any(
        term in lower_transcript
        for term in CTA_TERMS
    )

    if (
        not has_cta
        and len(transcript.split()) >= 25
    ):
        topic_phrase = _shorten_sentence(
            main_sentence,
            8
        )

        suggestions.append({
            "category": "CTA",
            "title": "Add a content-specific CTA",
            "text": (
                "The transcript does not contain a clear "
                "viewer action or response prompt."
            ),
            "fix": (
                "End with one question or action directly "
                "connected to what the video actually discussed."
            ),
            "example": (
                f"End by asking viewers about "
                f"“{topic_phrase}” rather than using an "
                f"unrelated generic CTA."
            ),
            "score": 78
        })

    # -----------------------------------------------------
    # 6. WEAK / GENERIC ENDING
    # -----------------------------------------------------
    last_sentence = sentences[-1].strip()

    generic_end = bool(
        re.search(
            r"\b(thanks for watching|bye|that's it|"
            r"that's all|okay bye|see you)\b",
            clean_text(last_sentence)
        )
    )

    if (
        generic_end
        and len(sentences) >= 3
    ):
        suggestions.append({
            "category": "Ending",
            "title": "Make the ending carry the topic forward",
            "text": (
                f"The video ends with a generic closing "
                f"rather than extending the video's actual topic."
            ),
            "fix": (
                "Use the final seconds for a takeaway, result, "
                "question or next-step connected to the content."
            ),
            "example": (
                f"Replace the generic ending with a short "
                f"viewer prompt connected to “{topic}”."
            ),
            "score": 76
        })

    # -----------------------------------------------------
    # Do not flood the UI.
    # Keep the strongest evidence-based issues.
    # -----------------------------------------------------
    suggestions.sort(
        key=lambda item: item["score"],
        reverse=True
    )

    return {
        "content_type": content_type,
        "suggestions": suggestions[:5]
    }
 
 
# ========================================================= 
# YOUTUBE PREDICTION 
# ========================================================= 
 
def predict_youtube( 
    title, 
    transcript, 
    niche, 
    duration_seconds 
): 
    title_clean = clean_text(title) 
    transcript_clean = clean_text(transcript) 
 
    # Same text representation used for TF-IDF 
    combined_text = f"{title_clean} {transcript_clean}" 
 
    text_features = engagement_tfidf.transform( 
        [combined_text] 
    ) 
 
    numeric_features = np.array( 
        [extract_numeric_features( 
            title_clean, 
            transcript_clean, 
            duration_seconds 
        )], 
        dtype=float 
    ) 
 
    numeric_features = engagement_scaler.transform( 
        numeric_features 
    ) 
 
    categorical_features = engagement_encoder.transform( 
        pd.DataFrame({"primary_niche": [clean_text(niche)]}) 
    ) 
 
    from scipy.sparse import hstack 
 
    final_features = hstack([ 
        text_features, 
        numeric_features, 
        categorical_features 
    ]).tocsr() 
 
    expected_features = getattr( 
        ridge_model, 
        "n_features_in_", 
        None 
    ) 
 
    if expected_features is not None: 
        actual_features = final_features.shape[1] 
 
        if actual_features != expected_features: 
            raise ValueError( 
                f"Feature mismatch: model expects " 
                f"{expected_features}, but received " 
                f"{actual_features}" 
            ) 
 
    prediction_log = ridge_model.predict( 
        final_features 
    )[0] 
 
    predicted_engagement = float( 
        np.expm1(prediction_log) 
    ) 
 
    predicted_engagement = max( 
        0.0, 
        predicted_engagement 
    ) 
    
    if predicted_engagement >= 80:
        performance = "Very High"
    elif predicted_engagement >= 60:
        performance = "High"
    elif predicted_engagement >= 40:
        performance = "Medium"
    elif predicted_engagement >= 20:
        performance = "Low"
    else:
        performance = "Very Low"


    # =========================================================
    # VIDEO-SPECIFIC CONTENT SUGGESTIONS
    # =========================================================

    content_analysis = _build_dynamic_content_suggestions(
        title=title,
        transcript=transcript,
        niche=niche,
        duration_seconds=duration_seconds
    )


    return {
        "predicted_engagement_rate": round(
            predicted_engagement, 2
        ),
        "performance_level": performance,
        "feature_count": final_features.shape[1],

        # New content-aware analysis.
        # This does NOT affect the trained prediction.
        "content_type": content_analysis["content_type"],
        "suggestions": content_analysis["suggestions"]
    }
 
 
# ========================================================= 
# INSTAGRAM 
# ========================================================= 
 
if INSTAGRAM_MODEL_DIR not in sys.path: 
    sys.path.insert(0, INSTAGRAM_MODEL_DIR) 
 
from instagram_scoring_engine import optimize_instagram_content
 
 
def analyze_instagram( 
    caption, 
    hashtags, 
    niche 
): 
    return optimize_instagram_content( 
        caption=caption, 
        hashtags=hashtags, 
        niche=niche 
    ) 
   
