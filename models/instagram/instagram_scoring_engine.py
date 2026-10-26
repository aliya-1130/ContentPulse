import re


_STOP_WORDS = {
    "a", "an", "and", "as", "at", "be", "by", "for", "from", "how",
    "i", "in", "is", "it", "of", "on", "or", "the", "this", "to",
    "what", "when", "where", "which", "who", "why", "with", "you",
    "welcome", "back", "hello", "hi", "hey", "guys", "everyone",
    "day", "make", "eat", "eating",
}


def _keywords(value):
    """Accept hashtags or comma/space-separated keywords from the input."""
    raw = str(value or "").strip()
    tags = re.findall(r"#[\w]+", raw, flags=re.UNICODE)
    if tags:
        return [tag.lstrip("#") for tag in tags]
    parts = re.split(r"[,;\n]+", raw) if re.search(r"[,;\n]", raw) else raw.split()
    return [part.strip("#,; ") for part in parts if part.strip("#,; ")]


def _clean_keyword(value):
    return re.sub(r"[^\w]", "", value, flags=re.UNICODE)


def _clean_caption(caption):
    text = re.sub(r"https?://\S+", "", str(caption or "")).strip()
    text = re.sub(
        r"^(?:(?:hi|hey|hello)\s+(?:everyone|guys)[,!\s]*)?(?:welcome\s+(?:back\s+)?to\s+)?",
        "",
        text,
        flags=re.IGNORECASE,
    ).strip(" ,:-")
    text = re.sub(r"\s+", " ", text)
    if text:
        text = text[0].upper() + text[1:]
        text = re.sub(r"\bi\b", "I", text)
    return text


def _topic(caption, keywords, niche):
    text = _clean_caption(caption)
    if text:
        first_sentence = re.split(r"(?<=[.!?])\s+", text, maxsplit=1)[0]
        return first_sentence[:100].rstrip(" ,:;.")
    if keywords:
        return " ".join(keywords[:5])
    return str(niche or "this Reel").strip()


def _content_purpose(caption, keywords):
    text = f"{caption} {' '.join(keywords)}".lower()
    if re.search(r"\b(mistake|myth|wrong|avoid|don't|stop)\b", text):
        return "mistake or myth breakdown"
    if re.search(r"\b(recipe|cook|bake|ingredients|eat|meal|food)\b", text):
        return "food or recipe content"
    if re.search(r"\b(review|tested|try|tried|versus|vs\.?|review)\b", text):
        return "review or hands-on test"
    if re.search(r"\b(how to|steps?|tips?|guide|ways?|routine)\b", text):
        return "how-to or tips"
    if re.search(r"\b(day in|day as|my day|story|when i|i went|i tried)\b", text):
        return "personal story or day-in-the-life"
    return "short-form topic or idea"


def _prompt_for_purpose(purpose, topic="this topic"):
    if purpose == "mistake or myth breakdown":
        return "Save this to check later, then comment which mistake you want me to explain."
    if purpose == "food or recipe content":
        return "Save this for later, then comment which meal you want the recipe for."
    if purpose == "review or hands-on test":
        return "Would you try it? Tell me why in the comments."
    if purpose == "how-to or tips":
        return "Save this guide, and comment which step you want to see next."
    if purpose == "personal story or day-in-the-life":
        return "What would your version look like? Share it in the comments."
    return f"What would you like to know about {topic}? Tell me below."


def _caption_question(purpose, topic):
    if purpose == "mistake or myth breakdown":
        return "which one should I explain with a real example?"
    if purpose == "food or recipe content":
        return "which meal would you like me to share a recipe for?"
    if purpose == "review or hands-on test":
        return "what should I test or compare next?"
    if purpose == "how-to or tips":
        return "which step should I demonstrate more closely?"
    if purpose == "personal story or day-in-the-life":
        return "which part of a day like this should I show next?"
    return f"which part of {topic} should I cover in more detail?"


def _make_suggestions(caption, keywords, niche, topic, purpose, weaknesses):
    clean_caption = _clean_caption(caption).rstrip(".!? ")
    niche_name = str(niche or "your niche").strip()
    topic_name = topic or niche_name
    suggestions = []

    if "caption" in weaknesses:
        example = (
            f"{clean_caption} — {_caption_question(purpose, topic_name)}"
            if clean_caption else
            _caption_question(purpose, topic_name).capitalize()
        )
        suggestions.append({
            "category": "Caption",
            "title": "Add a useful detail",
            "text": (
                f"Remove the introductory wording and lead with the actual {purpose} subject."
                if clean_caption != str(caption or "").strip().rstrip(".!? ")
                else f"Add one specific detail from the Reel about {topic_name} so viewers know what they will get."
            ),
            "example": example,
            "score": 86,
        })

    if "hook" in weaknesses:
        if purpose == "mistake or myth breakdown":
            hook_prompt = "Which one are beginners most likely to miss?"
        elif purpose == "food or recipe content":
            hook_prompt = "Which meal would you pick?"
        elif purpose == "review or hands-on test":
            hook_prompt = "Would you try it?"
        elif purpose == "how-to or tips":
            hook_prompt = "Which step would you want to see first?"
        else:
            hook_prompt = f"What would you want to know about {topic_name}?"
        example = f"{topic_name} — {hook_prompt}"
        suggestions.append({
            "category": "Hook",
            "title": "Make the opening specific",
            "text": f"Lead with the clearest payoff or tension in your {purpose}; keep the hook tied to the caption's actual topic, {topic_name}.",
            "example": example,
            "score": 84,
        })

    if "interaction" in weaknesses:
        example = f"{clean_caption} — { _prompt_for_purpose(purpose, topic_name) }" if clean_caption else _prompt_for_purpose(purpose, topic_name)
        suggestions.append({
            "category": "Interaction",
            "title": "Invite a relevant response",
            "text": f"There is no clear question or action tied to this {purpose}. Ask viewers about the specific topic instead of using an unrelated CTA.",
            "example": example,
            "score": 80,
        })

    if "keywords" in weaknesses:
        source_terms = []
        for term in re.findall(r"[\w]+", f"{topic_name} {' '.join(keywords)}", flags=re.UNICODE):
            if len(term) > 2 and term.lower() not in _STOP_WORDS and term.lower() not in {x.lower() for x in source_terms}:
                source_terms.append(term)
        if not source_terms:
            source_terms = [re.sub(r"\W+", "", niche_name.lower()) or "reels"]
        current = [term.lstrip("#") for term in keywords]
        phrase_terms = [
            term.lower()
            for term in re.findall(r"[^\W\d_]+", topic_name, flags=re.UNICODE)
            if term.lower() not in _STOP_WORDS
        ]
        if len(phrase_terms) >= 2:
            topic_tag = "".join(phrase_terms[:3])
        else:
            topic_tag = _clean_keyword(topic_name.lower())
        topic_tag = topic_tag[:29]
        proposed = [topic_tag] if topic_tag else []
        if purpose == "food or recipe content":
            proposed.extend(["fooddiary", "mealideas"])
        elif purpose == "mistake or myth breakdown":
            proposed.extend(["beginnerstips", "howto"])
        elif purpose == "how-to or tips":
            proposed.extend(["stepbystep", "howto"])
        proposed.extend(source_terms[:3])
        combined = list(dict.fromkeys(current + proposed))[:8]
        cleaned = [_clean_keyword(term) for term in combined]
        example = " ".join(f"#{term}" for term in cleaned if term)
        suggestions.append({
            "category": "Keywords",
            "title": "Make the keywords more specific",
            "text": f"Use a short set that reflects both {topic_name} and the selected {niche_name} niche. Topic words from this caption are included in the example.",
            "example": example,
            "score": 76,
        })

    if not suggestions:
        example = f"{clean_caption} — { _prompt_for_purpose(purpose, topic_name) }" if clean_caption else _prompt_for_purpose(purpose, topic_name)
        suggestions.append({
            "category": "Experiment",
            "title": "Test a topic-specific variation",
            "text": f"The main signals are present. Test a different opening or question while keeping the Reel focused on {topic_name}.",
            "example": example,
            "score": 72,
        })

    return suggestions[:4]


def instagram_engagement_score(caption, hashtags, niche):
    caption = str(caption or "").strip()
    hashtags = str(hashtags or "").strip()
    niche = str(niche or "").strip()
    lower_caption = caption.lower()
    keyword_list = _keywords(hashtags)
    caption_length = len(caption)
    word_count = len(re.findall(r"\b\w+\b", caption, flags=re.UNICODE))
    keyword_count = len(keyword_list)

    # Preserve the existing point rules and their relative score weights.
    if 80 <= caption_length <= 600:
        caption_points = 20
    elif 40 <= caption_length < 80 or 600 < caption_length <= 1000:
        caption_points = 14
    elif caption_length > 0:
        caption_points = 8
    else:
        caption_points = 0

    cta_patterns = [
        "comment", "follow", "share", "save", "tell me", "let me know",
        "dm me", "what do you think", "tag",
    ]
    has_cta = any(phrase in lower_caption for phrase in cta_patterns)
    cta_points = 20 if has_cta else 0
    has_question = "?" in caption
    question_points = 15 if has_question else 0

    hook_patterns = [
        "you need to know", "stop", "before you", "here's", "here is",
        "the truth", "don't", "3 ways", "5 ways", "secret", "mistake",
        "why", "how", "what i eat", "day in my life", "day as a",
    ]
    hook_count = sum(1 for phrase in hook_patterns if phrase in lower_caption)
    hook_points = 20 if hook_count >= 2 else 12 if hook_count == 1 else 5

    if 3 <= keyword_count <= 8:
        keyword_points = 15
    elif 1 <= keyword_count < 3 or 8 < keyword_count <= 12:
        keyword_points = 10
    elif keyword_count > 0:
        keyword_points = 5
    else:
        keyword_points = 0

    raw_score = caption_points + cta_points + question_points + hook_points + keyword_points
    score = round(max(0, min(100, raw_score / 90 * 100)))
    level = "Excellent" if score >= 80 else "Good" if score >= 65 else "Average" if score >= 50 else "Needs Improvement"

    weaknesses = []
    if caption_points < 20:
        weaknesses.append("caption")
    if hook_count == 0:
        weaknesses.append("hook")
    if not has_cta and not has_question:
        weaknesses.append("interaction")
    if not (3 <= keyword_count <= 8):
        weaknesses.append("keywords")

    topic = _topic(caption, keyword_list, niche)
    purpose = _content_purpose(caption, keyword_list)
    suggestions = _make_suggestions(caption, keyword_list, niche, topic, purpose, weaknesses)

    def percent(points, maximum):
        return round(points / maximum * 100)

    return {
        "platform": "instagram",
        "niche": niche,
        "score": score,
        "engagement_score": score,
        "label": level,
        "performance_level": level,
        "title": "Instagram Engagement Potential",
        "type": "Caption and keyword analysis",
        "content_type": purpose,
        "detected_topic": topic,
        "caption_length": caption_length,
        "word_count": word_count,
        "hashtag_count": keyword_count,
        "has_cta": has_cta,
        "breakdown": [
            ["Caption Structure", percent(caption_points, 20)],
            ["Hook Signals", percent(hook_points, 20)],
            ["Interaction", percent(cta_points + question_points, 35)],
            ["Keyword Usage", percent(keyword_points, 15)],
        ],
        "positive": [
            text for condition, text in [
                (caption_points >= 20, "Caption length supports useful context."),
                (hook_count > 0, "A recognizable opening hook is present."),
                (has_cta or has_question, "The caption invites interaction."),
                (3 <= keyword_count <= 8, "Keyword count is in a focused range."),
            ] if condition
        ],
        "negative": [
            text for condition, text in [
                (caption_points < 20, "Caption could use more specific context."),
                (hook_count == 0, "The opening could make the topic more compelling."),
                (not has_cta and not has_question, "No clear interaction prompt was detected."),
                (not (3 <= keyword_count <= 8), "Keyword count could be more focused."),
            ] if condition
        ],
        "suggestions": suggestions,
    }


def optimize_instagram_content(caption, hashtags, niche):
    """Backward-compatible entry point returning the active dynamic analysis."""
    return instagram_engagement_score(caption, hashtags, niche)
