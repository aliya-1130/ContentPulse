
import streamlit as st
import sys
import os

# =========================================================
# BACKEND
# =========================================================

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_PATH = os.path.join(PROJECT_ROOT, "backend")

if BACKEND_PATH not in sys.path:
    sys.path.insert(0, BACKEND_PATH)

from backend import predict_youtube, analyze_instagram


# =========================================================
# PAGE CONFIG
# =========================================================

st.set_page_config(
    page_title="AI Content Engagement Analyzer",
    page_icon="🎯",
    layout="wide",
    initial_sidebar_state="collapsed"
)


# =========================================================
# CUSTOM CSS
# =========================================================

st.markdown(
    """
    <style>

    .stApp {
        background: #faf9ff;
    }

    .block-container {
        max-width: 1150px;
        padding-top: 2rem;
        padding-bottom: 4rem;
    }

    .hero {
        padding: 2rem 0 1rem 0;
    }

    .hero h1 {
        font-size: 3rem;
        font-weight: 800;
        margin-bottom: 0.4rem;
        color: #1d1b2f;
    }

    .hero p {
        font-size: 1.1rem;
        color: #6b6878;
        max-width: 760px;
    }

    .badge {
        display: inline-block;
        padding: 0.35rem 0.8rem;
        border-radius: 999px;
        background: #eeeaff;
        color: #5c45c7;
        font-size: 0.82rem;
        font-weight: 700;
        margin-bottom: 0.8rem;
    }

    .section-title {
        font-size: 1.4rem;
        font-weight: 750;
        color: #252238;
        margin-top: 1rem;
        margin-bottom: 0.8rem;
    }

    .info-card {
        background: white;
        border: 1px solid #eceaf3;
        border-radius: 18px;
        padding: 1.2rem;
        box-shadow: 0 4px 18px rgba(50, 40, 90, 0.05);
        margin-bottom: 1rem;
    }

    .result-card {
        background: white;
        border: 1px solid #eceaf3;
        border-radius: 20px;
        padding: 1.4rem;
        box-shadow: 0 6px 24px rgba(50, 40, 90, 0.06);
    }

    .metric-label {
        color: #777286;
        font-size: 0.9rem;
        margin-bottom: 0.3rem;
    }

    .metric-value {
        color: #211d35;
        font-size: 2rem;
        font-weight: 800;
    }

    .footer {
        text-align: center;
        color: #888494;
        font-size: 0.85rem;
        padding-top: 2.5rem;
    }

    div[data-testid="stButton"] > button {
        border-radius: 12px;
        border: none;
        padding: 0.65rem 1rem;
        font-weight: 700;
        background: #6b52d9;
        color: white;
    }

    div[data-testid="stButton"] > button:hover {
        background: #5841be;
        color: white;
    }

    </style>
    """,
    unsafe_allow_html=True
)


# =========================================================
# HERO
# =========================================================

st.markdown(
    """
    <div class="hero">
        <div class="badge">AI-POWERED CONTENT ANALYSIS</div>
        <h1>AI Content Engagement Analyzer</h1>
        <p>
            Analyze your short-form content, understand its engagement
            potential, and get practical suggestions to improve performance.
        </p>
    </div>
    """,
    unsafe_allow_html=True
)


# =========================================================
# PLATFORM
# =========================================================

st.markdown(
    '<div class="section-title">Choose your platform</div>',
    unsafe_allow_html=True
)

platform = st.radio(
    "",
    ["YouTube Shorts", "Instagram Reels"],
    horizontal=True,
    label_visibility="collapsed"
)


# =========================================================
# YOUTUBE
# =========================================================

if platform == "YouTube Shorts":

    st.markdown(
        '<div class="section-title">▶️ YouTube Shorts Analysis</div>',
        unsafe_allow_html=True
    )

    left, right = st.columns([1.4, 1])

    with left:
        st.markdown('<div class="info-card">', unsafe_allow_html=True)

        title = st.text_input(
            "Video title",
            placeholder="Enter your YouTube Shorts title"
        )

        transcript = st.text_area(
            "Transcript",
            placeholder="Paste the spoken transcript of your Short...",
            height=180
        )

        st.markdown('</div>', unsafe_allow_html=True)

    with right:
        st.markdown('<div class="info-card">', unsafe_allow_html=True)

        niche = st.selectbox(
            "Content niche",
            [
                "motivation",
                "education",
                "beauty",
                "fitness",
                "food",
                "entertainment",
                "technology",
                "lifestyle"
            ]
        )

        duration = st.number_input(
            "Video duration (seconds)",
            min_value=1,
            max_value=180,
            value=30
        )

        st.markdown(
            """
            <p style="color:#777286;font-size:0.9rem;">
            The YouTube model uses the title, transcript, niche and
            duration to estimate engagement rate.
            </p>
            """,
            unsafe_allow_html=True
        )

        analyze = st.button(
            "Analyze YouTube Short",
            use_container_width=True
        )

        st.markdown('</div>', unsafe_allow_html=True)

    if analyze:

        if not title.strip() or not transcript.strip():
            st.warning("Please enter both the title and transcript.")
        else:

            with st.spinner("Analyzing your Short..."):

                result = predict_youtube(
                    title=title,
                    transcript=transcript,
                    niche=niche,
                    duration_seconds=duration
                )

            st.markdown(
                '<div class="section-title">Your result</div>',
                unsafe_allow_html=True
            )

            c1, c2 = st.columns(2)

            with c1:
                st.markdown(
                    f"""
                    <div class="result-card">
                        <div class="metric-label">
                            Predicted engagement rate
                        </div>
                        <div class="metric-value">
                            {result["predicted_engagement_rate"]:.2f}%
                        </div>
                    </div>
                    """,
                    unsafe_allow_html=True
                )

            with c2:
                st.markdown(
                    f"""
                    <div class="result-card">
                        <div class="metric-label">
                            Performance level
                        </div>
                        <div class="metric-value">
                            {result["performance_level"]}
                        </div>
                    </div>
                    """,
                    unsafe_allow_html=True
                )

            st.info(
                "This result is generated using the trained YouTube "
                "machine learning model."
            )


# =========================================================
# INSTAGRAM
# =========================================================

else:

    st.markdown(
        '<div class="section-title">📸 Instagram Reels Analysis</div>',
        unsafe_allow_html=True
    )

    left, right = st.columns([1.4, 1])

    with left:
        st.markdown('<div class="info-card">', unsafe_allow_html=True)

        caption = st.text_area(
            "Reel caption",
            placeholder="Write or paste your Instagram caption...",
            height=180
        )

        hashtags = st.text_input(
            "Hashtags",
            placeholder="#beauty #skincare #reels"
        )

        st.markdown('</div>', unsafe_allow_html=True)

    with right:
        st.markdown('<div class="info-card">', unsafe_allow_html=True)

        niche = st.selectbox(
            "Content niche",
            [
                "beauty",
                "fitness",
                "food",
                "technology",
                "entertainment",
                "lifestyle"
            ]
        )

        st.markdown(
            """
            <p style="color:#777286;font-size:0.9rem;">
            The Instagram analyzer evaluates caption structure,
            hashtags, hooks and calls-to-action.
            </p>
            """,
            unsafe_allow_html=True
        )

        analyze = st.button(
            "Analyze Instagram Reel",
            use_container_width=True
        )

        st.markdown('</div>', unsafe_allow_html=True)

    if analyze:

        if not caption.strip():
            st.warning("Please enter a caption.")
        else:

            with st.spinner("Analyzing your Reel..."):

                result = analyze_instagram(
                    caption=caption,
                    hashtags=hashtags,
                    niche=niche
                )

            st.markdown(
                '<div class="section-title">Your result</div>',
                unsafe_allow_html=True
            )

            c1, c2 = st.columns(2)

            with c1:
                st.markdown(
                    f"""
                    <div class="result-card">
                        <div class="metric-label">
                            Engagement potential
                        </div>
                        <div class="metric-value">
                            {result["engagement_score"]}/100
                        </div>
                    </div>
                    """,
                    unsafe_allow_html=True
                )

            with c2:
                st.markdown(
                    f"""
                    <div class="result-card">
                        <div class="metric-label">
                            Performance level
                        </div>
                        <div class="metric-value">
                            {result["performance_level"]}
                        </div>
                    </div>
                    """,
                    unsafe_allow_html=True
                )

            st.markdown(
                '<div class="section-title">Content breakdown</div>',
                unsafe_allow_html=True
            )

            b1, b2, b3 = st.columns(3)

            with b1:
                st.metric("Caption length", result["caption_length"])

            with b2:
                st.metric("Hashtags", result["hashtag_count"])

            with b3:
                st.metric(
                    "CTA detected",
                    "Yes" if result["has_cta"] else "No"
                )

            if result["suggestions"]:

                st.markdown(
                    '<div class="section-title">💡 Suggestions</div>',
                    unsafe_allow_html=True
                )

                for suggestion in result["suggestions"]:
                    st.info(suggestion)

            st.caption(
                "Instagram uses a rule-based Engagement Potential Score, "
                "not a prediction of actual Instagram engagement rate."
            )


# =========================================================
# FOOTER
# =========================================================

st.markdown(
    """
    <div class="footer">
        AI Content Engagement Analyzer · YouTube Shorts + Instagram Reels
    </div>
    """,
    unsafe_allow_html=True
)
