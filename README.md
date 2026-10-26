# AI Content Engagement Analyzer

An application for analyzing and optimizing short-form social media content for YouTube Shorts and Instagram Reels.

## Features

### YouTube Shorts
- Accepts video title and transcript
- Uses the trained Ridge Regression machine learning model
- Predicts engagement rate
- Assigns a performance level

### Instagram Reels
- Accepts caption and hashtags
- Selects a niche
- Calculates an Engagement Potential Score out of 100
- Detects content weaknesses
- Provides optimization suggestions

## Important Note

The YouTube result is generated using the trained machine learning model.

The Instagram result is a rule-based Engagement Potential Score. It is not a prediction of actual Instagram engagement rate.

## Supported Instagram Niches

Beauty, Fitness, Food, Technology, Entertainment, Lifestyle

## Supported YouTube Niches

Motivation, Education, Beauty, Fitness, Food, Entertainment, Technology, Lifestyle

## Project Structure

backend/
    backend.py

frontend/
    app.py

models/
    youtube/
        STEP15_FINAL_RIDGE_REGRESSION.joblib
        ENGAGEMENT_TFIDF.joblib
        ENGAGEMENT_ENCODER.joblib
        ENGAGEMENT_SCALER.joblib

    instagram/
        instagram_scoring_engine.py

data/
    sample/

docs/
tests/

requirements.txt
.gitignore
.streamlit/
    config.toml

## Run Locally

Install dependencies:

pip install -r requirements.txt

Start the application:

streamlit run frontend/app.py

## Deployment

The project is designed to be deployed to a cloud hosting service so it can be accessed from a phone or laptop without running Google Colab.

## Data and Models

Large datasets, uploaded videos, audio files, transcripts, and temporary files are intentionally excluded from the GitHub repository.

The repository contains the application code and the model files required by the deployed application.
