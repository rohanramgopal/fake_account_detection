import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, confusion_matrix, roc_curve, auc
from app.generator import generate_profile

# Global state to hold the trained pipelines, metrics, and configuration
CURRENT_BINARY_PIPELINE = None
CURRENT_SUBTYPE_PIPELINE = None

MODEL_METRICS = {}
MODEL_CONFIG = {
    "classifier_type": "random_forest",
    "n_estimators": 100,
    "max_depth": 8,
    "test_size": 0.2
}

FEATURE_COLUMNS = [
    "username_length", "username_digit_ratio", "has_profile_pic", "bio_length", 
    "has_link_in_bio", "followers_count", "following_count", "reputation_score", 
    "posts_count", "posts_frequency", "spam_ratio", "caps_ratio", 
    "sentiment", "lexical_diversity"
]

SUBTYPE_NAMES = {
    0: "Genuine User",
    1: "Commercial Spambot",
    2: "Inactive Follower Bot",
    3: "Celebrity Impersonator",
    4: "Data Harvester / Scraper",
    5: "Political Astroturfer",
    6: "Compromised / Hijacked Account"
}

SUBTYPE_MAPPING = {
    "genuine": 0,
    "spambot": 1,
    "inactive": 2,
    "impersonator": 3,
    "harvester": 4,
    "astroturfer": 5,
    "hijacked": 6
}

def train_model(classifier_type="random_forest", n_estimators=100, max_depth=8, test_size=0.2):
    """
    Trains two Scikit-learn pipelines on a synthetic dataset of 7 archetypes:
    1. Binary classification (Genuine vs. Suspect)
    2. Multi-class classification (archetype identification)
    Generates training/test metrics, feature importances, ROC curve data, and a confusion matrix.
    """
    global CURRENT_BINARY_PIPELINE, CURRENT_SUBTYPE_PIPELINE, MODEL_METRICS, MODEL_CONFIG
    
    # 1. Generate Dataset with subtypes
    print(f"Generating synthetic multi-class dataset for training...")
    records = []
    for _ in range(2500):
        prof = generate_profile()
        row = prof["features"].copy()
        row["is_fake"] = prof["is_fake"]
        row["subtype"] = SUBTYPE_MAPPING.get(prof["metadata"]["profile_type"], 0)
        records.append(row)
        
    df = pd.DataFrame(records)
    
    X = df[FEATURE_COLUMNS]
    y_binary = df["is_fake"]
    y_subtype = df["subtype"]
    
    X_train, X_test, y_bin_train, y_bin_test, y_sub_train, y_sub_test = train_test_split(
        X, y_binary, y_subtype, test_size=test_size, random_state=42, stratify=y_binary
    )
    
    # 2. Select Classifiers for Binary and Subtype Models
    if classifier_type == "random_forest":
        clf_bin = RandomForestClassifier(n_estimators=n_estimators, max_depth=max_depth, random_state=42)
        clf_sub = RandomForestClassifier(n_estimators=n_estimators, max_depth=max_depth, random_state=42)
    elif classifier_type == "gradient_boosting":
        clf_bin = GradientBoostingClassifier(n_estimators=n_estimators, max_depth=max_depth if max_depth else 3, random_state=42)
        clf_sub = GradientBoostingClassifier(n_estimators=n_estimators, max_depth=max_depth if max_depth else 3, random_state=42)
    elif classifier_type == "logistic_regression":
        clf_bin = LogisticRegression(max_iter=1000, random_state=42)
        clf_sub = LogisticRegression(max_iter=1000, random_state=42)
    else:
        clf_bin = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
        clf_sub = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
        classifier_type = "random_forest"
        
    # 3. Build & Train Pipelines
    binary_pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('classifier', clf_bin)
    ])
    
    subtype_pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('classifier', clf_sub)
    ])
    
    binary_pipeline.fit(X_train, y_bin_train)
    subtype_pipeline.fit(X_train, y_sub_train)
    
    # 4. Evaluate Binary Model
    y_pred = binary_pipeline.predict(X_test)
    y_prob = binary_pipeline.predict_proba(X_test)[:, 1]
    
    acc = accuracy_score(y_bin_test, y_pred)
    prec, rec, f1, _ = precision_recall_fscore_support(y_bin_test, y_pred, average='binary')
    
    # Confusion Matrix
    cm = confusion_matrix(y_bin_test, y_pred)
    cm_dict = {
        "tn": int(cm[0, 0]),
        "fp": int(cm[0, 1]),
        "fn": int(cm[1, 0]),
        "tp": int(cm[1, 1])
    }
    
    # ROC Curve & AUC
    fpr, tpr, _ = roc_curve(y_bin_test, y_prob)
    roc_auc = auc(fpr, tpr)
    
    # Downsample ROC points for compact JSON
    step = max(1, len(fpr) // 30)
    roc_points = [{"fpr": float(fpr[i]), "tpr": float(tpr[i])} for i in range(0, len(fpr), step)]
    if not roc_points or roc_points[-1] != {"fpr": 1.0, "tpr": 1.0}:
        roc_points.append({"fpr": 1.0, "tpr": 1.0})
        
    # 5. Extract Feature Importances
    importances = {}
    classifier_impl = binary_pipeline.named_steps['classifier']
    
    if hasattr(classifier_impl, 'feature_importances_'):
        feat_imp = classifier_impl.feature_importances_
        for col, imp in zip(FEATURE_COLUMNS, feat_imp):
            importances[col] = float(imp)
    elif hasattr(classifier_impl, 'coef_'):
        coefs = np.abs(classifier_impl.coef_[0])
        total_coef = sum(coefs) if sum(coefs) > 0 else 1.0
        for col, coef in zip(FEATURE_COLUMNS, coefs):
            importances[col] = float(coef / total_coef)
            
    # Sort importances desc
    sorted_importances = sorted(importances.items(), key=lambda x: x[1], reverse=True)
    importances_list = [{"feature": k, "importance": v} for k, v in sorted_importances]
    
    # Save to global cache
    CURRENT_BINARY_PIPELINE = binary_pipeline
    CURRENT_SUBTYPE_PIPELINE = subtype_pipeline
    
    MODEL_METRICS.clear()
    MODEL_METRICS.update({
        "accuracy": float(acc),
        "precision": float(prec),
        "recall": float(rec),
        "f1_score": float(f1),
        "auc": float(roc_auc),
        "confusion_matrix": cm_dict,
        "roc_curve": roc_points,
        "feature_importances": importances_list
    })
    
    MODEL_CONFIG.clear()
    MODEL_CONFIG.update({
        "classifier_type": classifier_type,
        "n_estimators": n_estimators,
        "max_depth": max_depth,
        "test_size": test_size
    })
    
    print(f"Model trained successfully. Binary Accuracy: {acc:.4f}, AUC: {roc_auc:.4f}")
    return MODEL_METRICS

def get_trained_pipelines():
    """Ensures model pipelines are trained, and returns them."""
    global CURRENT_BINARY_PIPELINE, CURRENT_SUBTYPE_PIPELINE
    if CURRENT_BINARY_PIPELINE is None or CURRENT_SUBTYPE_PIPELINE is None:
        train_model()
    return CURRENT_BINARY_PIPELINE, CURRENT_SUBTYPE_PIPELINE

def predict_profile_risk(features_dict: dict) -> dict:
    """
    Predicts risk probability using the binary classifier,
    and infers specific archetype category using the multiclass classifier.
    """
    binary_pipe, subtype_pipe = get_trained_pipelines()
    
    # Convert input to DataFrame
    df = pd.DataFrame([features_dict])[FEATURE_COLUMNS]
    
    # Binary predictions
    prob = binary_pipe.predict_proba(df)[0, 1]
    is_fake = int(binary_pipe.predict(df)[0])
    
    # Multiclass archetype predictions
    predicted_subtype_id = int(subtype_pipe.predict(df)[0])
    subtype_name = SUBTYPE_NAMES.get(predicted_subtype_id, "Unknown Bot")
    
    # Override archetype description if binary model classifies it as genuine
    if is_fake == 0:
        subtype_name = "Genuine User"
    elif subtype_name == "Genuine User":
        # Fallback if subtype model disagrees with binary model
        subtype_name = "Commercial Spambot"
        
    # Heuristics explanation engine
    explanations = []
    
    if features_dict.get("username_digit_ratio", 0) > 0.4:
        explanations.append({
            "feature": "username_digit_ratio",
            "message": f"High ratio of digits in username ({features_dict['username_digit_ratio']*100:.1f}%)",
            "severity": "high" if features_dict["username_digit_ratio"] > 0.6 else "medium"
        })
        
    if features_dict.get("has_profile_pic", 1) == 0:
        explanations.append({
            "feature": "has_profile_pic",
            "message": "Default blank profile avatar (no profile pic)",
            "severity": "medium"
        })
        
    if features_dict.get("reputation_score", 1.0) < 0.15:
        explanations.append({
            "feature": "reputation_score",
            "message": f"Extremely skewed followers-following reputation ratio ({features_dict['reputation_score']:.3f})",
            "severity": "high" if features_dict["reputation_score"] < 0.05 else "medium"
        })
        
    if features_dict.get("posts_frequency", 0) > 12.0:
        explanations.append({
            "feature": "posts_frequency",
            "message": f"Abnormally high posting rate ({features_dict['posts_frequency']} posts/day)",
            "severity": "high" if features_dict["posts_frequency"] > 35.0 else "medium"
        })
        
    if features_dict.get("spam_ratio", 0) > 0.08:
        explanations.append({
            "feature": "spam_ratio",
            "message": f"Excessive usage of promotional/spam keywords ({features_dict['spam_ratio']*100:.1f}% of text)",
            "severity": "high" if features_dict["spam_ratio"] > 0.25 else "medium"
        })
        
    if features_dict.get("caps_ratio", 0) > 0.35:
        explanations.append({
            "feature": "caps_ratio",
            "message": f"Aggressive capital letters capitalization in posts/bio ({features_dict['caps_ratio']*100:.1f}%)",
            "severity": "medium"
        })
        
    if features_dict.get("lexical_diversity", 1.0) < 0.45 and features_dict.get("posts_count", 0) > 3:
        explanations.append({
            "feature": "lexical_diversity",
            "message": f"Extremely repetitive vocabulary choice ({features_dict['lexical_diversity']*100:.1f}% unique words)",
            "severity": "medium"
        })
        
    explanations = sorted(explanations, key=lambda x: 0 if x["severity"] == "high" else 1)
    
    if not explanations:
        if is_fake == 1:
            explanations.append({
                "feature": "model_verdict",
                "message": "Aggregated features fit known patterns of malicious social agents.",
                "severity": "medium"
            })
        else:
            explanations.append({
                "feature": "model_verdict",
                "message": "Normal organic account behavior verified.",
                "severity": "low"
            })
            
    return {
        "risk_probability": float(prob),
        "is_fake": is_fake,
        "risk_classification": subtype_name,
        "explanations": explanations
    }
