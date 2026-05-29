import asyncio
import json
import random
import pandas as pd
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.nlp import analyze_text
from app.generator import generate_profile
from app.model import (
    train_model, 
    predict_profile_risk, 
    get_trained_pipelines, 
    MODEL_METRICS, 
    MODEL_CONFIG,
    FEATURE_COLUMNS
)

app = FastAPI(
    title="Fake Account Detection Engine",
    description="REST APIs and streaming simulator for social media fake/bot account detection.",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Schemas for validation
class LoginRequest(BaseModel):
    username: str
    password: str

class ProfileInput(BaseModel):
    username: str = Field(..., example="crypto_guru99")
    display_name: str = Field("", example="⚡ Crypto Guru ⚡")
    bio: str = Field("", example="Earn money working from home! Click the link below!")
    has_profile_pic: int = Field(1, ge=0, le=1)
    has_link_in_bio: int = Field(0, ge=0, le=1)
    followers_count: int = Field(..., ge=0)
    following_count: int = Field(..., ge=0)
    posts_count: int = Field(..., ge=0)
    posts_frequency: float = Field(..., ge=0.0)
    recent_posts: List[str] = Field(default_factory=list)

class RetrainInput(BaseModel):
    classifier_type: str = Field("random_forest", pattern="^(random_forest|gradient_boosting|logistic_regression)$")
    n_estimators: Optional[int] = Field(100, ge=10, le=500)
    max_depth: Optional[int] = Field(8, ge=2, le=30)
    test_size: Optional[float] = Field(0.2, ge=0.1, le=0.5)

# Initialize ML models on startup
@app.on_event("startup")
async def startup_event():
    print("Pre-training default machine learning model pipelines...")
    train_model()

@app.get("/")
def read_root():
    return {"status": "online", "message": "Fake Account Detection API is running"}

@app.post("/api/login")
def login_endpoint(credentials: LoginRequest):
    """Authenticates dashboard users using static demonstration credentials."""
    if credentials.username == "admin" and credentials.password == "sybilguard2026":
        return {
            "status": "success", 
            "token": "mock-jwt-token-sybilguard-2026",
            "user": {"username": "admin", "role": "Security Operations Center Manager"}
        }
    else:
        raise HTTPException(status_code=401, detail="Invalid username or password")

@app.post("/api/analyze")
def analyze_single_profile(profile: ProfileInput):
    """
    Analyzes a single social media profile.
    Extracts NLP features, merges metadata, and yields classification + risk scores.
    """
    # 1. Compute NLP features from bio and posts
    full_text = profile.bio + " " + " ".join(profile.recent_posts)
    nlp_res = analyze_text(full_text)
    
    # 2. Derive helper features
    digits = sum(1 for c in profile.username if c.isdigit())
    username_digit_ratio = float(digits) / len(profile.username) if profile.username else 0.0
    
    total_network = profile.followers_count + profile.following_count
    reputation_score = float(profile.followers_count) / total_network if total_network > 0 else 0.0
    
    # 3. Assemble complete feature vector matching training columns
    features = {
        "username_length": len(profile.username),
        "username_digit_ratio": username_digit_ratio,
        "has_profile_pic": profile.has_profile_pic,
        "bio_length": len(profile.bio),
        "has_link_in_bio": profile.has_link_in_bio,
        "followers_count": profile.followers_count,
        "following_count": profile.following_count,
        "reputation_score": reputation_score,
        "posts_count": profile.posts_count,
        "posts_frequency": profile.posts_frequency,
        "spam_ratio": nlp_res["spam_ratio"],
        "caps_ratio": nlp_res["caps_ratio"],
        "sentiment": nlp_res["sentiment"],
        "lexical_diversity": nlp_res["lexical_diversity"]
    }
    
    # 4. Predict
    prediction = predict_profile_risk(features)
    
    return {
        "profile": profile,
        "extracted_features": features,
        "analysis": prediction
    }

@app.post("/api/batch")
def analyze_batch_profiles(profiles: List[ProfileInput]):
    """Analyzes a list of profiles and returns summary statistics along with details."""
    results = []
    bots_count = 0
    genuine_count = 0
    
    for p in profiles:
        analysis_res = analyze_single_profile(p)
        results.append(analysis_res)
        if analysis_res["analysis"]["is_fake"] == 1:
            bots_count += 1
        else:
            genuine_count += 1
            
    total = len(profiles)
    return {
        "summary": {
            "total_scanned": total,
            "detected_bots": bots_count,
            "detected_genuine": genuine_count,
            "bot_ratio": float(bots_count) / total if total > 0 else 0.0
        },
        "results": results
    }

@app.post("/api/upload-csv")
async def upload_csv_to_analyze(file: UploadFile = File(...)):
    """
    Accepts a CSV upload containing profile metrics, parses it, and scans each row.
    Expected headers: username, bio, followers_count, following_count, posts_count, posts_frequency, etc.
    Missing fields will be simulated or filled with logical defaults.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")
    
    try:
        df = pd.read_csv(file.file)
        profiles = []
        
        for _, row in df.iterrows():
            # Get values safely with fallbacks
            username = str(row.get("username", f"user_{random.randint(1000,9999)}"))
            display_name = str(row.get("display_name", username.capitalize()))
            bio = str(row.get("bio", ""))
            
            has_profile_pic = int(row.get("has_profile_pic", 1))
            has_link_in_bio = int(row.get("has_link_in_bio", 0))
            
            followers_count = int(row.get("followers_count", row.get("followers", 150)))
            following_count = int(row.get("following_count", row.get("following", 120)))
            posts_count = int(row.get("posts_count", row.get("posts", 50)))
            posts_frequency = float(row.get("posts_frequency", 1.5))
            
            recent_post = str(row.get("recent_posts", ""))
            posts_list = [recent_post] if recent_post else []
            
            profiles.append(ProfileInput(
                username=username,
                display_name=display_name,
                bio=bio,
                has_profile_pic=has_profile_pic,
                has_link_in_bio=has_link_in_bio,
                followers_count=followers_count,
                following_count=following_count,
                posts_count=posts_count,
                posts_frequency=posts_frequency,
                recent_posts=posts_list
            ))
            
        return analyze_batch_profiles(profiles)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process CSV file: {str(e)}")

@app.get("/api/model/metrics")
def get_model_metrics():
    """Returns the current model's evaluation metrics, configuration parameters, and feature importances."""
    # Ensure models are trained
    get_trained_pipelines()
    return {
        "config": MODEL_CONFIG,
        "metrics": MODEL_METRICS
    }

@app.post("/api/model/retrain")
def retrain_model_endpoint(params: RetrainInput):
    """Dynamically retrains the Scikit-learn model with user-provided hyperparameters."""
    try:
        new_metrics = train_model(
            classifier_type=params.classifier_type,
            n_estimators=params.n_estimators or 100,
            max_depth=params.max_depth,
            test_size=params.test_size or 0.2
        )
        return {
            "status": "success",
            "message": f"Successfully retrained model of type '{params.classifier_type}'",
            "config": MODEL_CONFIG,
            "metrics": new_metrics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retraining failed: {str(e)}")

@app.get("/api/stream")
def stream_live_profiles():
    """
    Server-Sent Events (SSE) generator streaming simulated live accounts.
    Runs each account through our active ML model, determines mitigation response,
    and yields JSON-formatted events.
    """
    async def event_generator():
        # Mitigation choices mapped to classification
        mitigation_actions = {
            "genuine": ["Allow", "Verified Badge"],
            "spambot": ["Suspend Account", "Shadowban", "Flag Profile"],
            "inactive": ["Flag Profile", "Requires Captcha"],
            "impersonator": ["Suspend Account", "Shadowban"],
            "harvester": ["Block IP Address", "Rate Limit API", "Flag Profile"],
            "astroturfer": ["Shadowban", "Label Propaganda", "Flag Profile"],
            "hijacked": ["Lock Account", "Force Password Reset", "Requires verification"]
        }
        
        while True:
            # Generate a random account (50% fake, 50% genuine)
            profile_data = generate_profile()
            
            # Predict risk using active model
            prediction = predict_profile_risk(profile_data["features"])
            
            profile_type = profile_data["metadata"]["profile_type"]
            is_fake = prediction["is_fake"]
            
            # Map action based on type
            if is_fake == 0:
                action = "Allow"
                if profile_data["metadata"]["followers_count"] > 18000 and random.random() < 0.2:
                    action = "Verified Badge"
            else:
                action = random.choice(mitigation_actions.get(profile_type, ["Flag Profile"]))
            
            payload = {
                "profile": profile_data["metadata"],
                "features": profile_data["features"],
                "analysis": prediction,
                "action_taken": action
            }
            
            # Format payload for Server-Sent Events
            yield f"data: {json.dumps(payload)}\n\n"
            
            # Yield interval
            await asyncio.sleep(2.0)
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")
