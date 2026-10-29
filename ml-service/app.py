"""
app.py
The ML microservice. Exposes two endpoints used by the Node backend:

  POST /predict-risk  -> steps 3-6: analyze performance, produce risk score,
                          weak areas, and recommendations
  POST /chatbot        -> step 8: AI cybersecurity assistant (TF-IDF retrieval)

Run: python app.py   (after `python train_model.py` has produced risk_model.pkl)
"""

import os
import numpy as np
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from chatbot_data import KNOWLEDGE_BASE

app = Flask(__name__)
CORS(app)

# ---------------------------------------------------------------------------
# Load the risk-scoring model (trained by train_model.py)
# ---------------------------------------------------------------------------
MODEL_PATH = os.path.join(os.path.dirname(__file__), "risk_model.pkl")
_bundle = None
if os.path.exists(MODEL_PATH):
    _bundle = joblib.load(MODEL_PATH)
    RISK_MODEL = _bundle["model"]
    if hasattr(RISK_MODEL, "n_jobs"):
        RISK_MODEL.n_jobs = 1
    FEATURE_NAMES = _bundle["feature_names"]
    CATEGORIES = _bundle["categories"]
else:
    RISK_MODEL = None
    CATEGORIES = [
        "phishing", "password_security", "malware",
        "social_engineering", "network_security", "data_privacy",
    ]
    print("⚠️  risk_model.pkl not found — run `python train_model.py` first.")

RECOMMENDATION_LIBRARY = {
    "phishing": "Review the 'Spotting Phishing Emails' module and practice a few more phishing simulations.",
    "password_security": "Complete the 'Building Strong Passwords' module and enable a password manager + MFA.",
    "malware": "Review 'How Malware Spreads' and avoid downloading software from unofficial sources.",
    "social_engineering": "Review 'Social Engineering Tactics' — always verify requests through an official channel.",
    "network_security": "Avoid sensitive logins on public Wi-Fi and review your home router's security settings.",
    "data_privacy": "Audit what personal info you share online and review your app/browser privacy settings.",
}


def build_feature_vector(payload):
    """Convert the raw payload from Node into the numeric feature vector
    the model expects, and also compute per-category accuracy for the
    'weak areas' step."""
    category_scores = payload.get("categoryScores", [])
    cat_accuracy = {c: None for c in CATEGORIES}
    for entry in category_scores:
        cat = entry["category"]
        if cat in cat_accuracy and entry["total"] > 0:
            cat_accuracy[cat] = entry["correct"] / entry["total"]

    total_correct = payload.get("totalCorrect", 0)
    total_questions = max(payload.get("totalQuestions", 1), 1)
    overall_accuracy = total_correct / total_questions

    time_taken = payload.get("timeTakenSeconds", 0)
    avg_time_per_question = time_taken / total_questions if total_questions else 0

    phishing_accuracy = payload.get("phishingAccuracy")
    if phishing_accuracy is None:
        # Unknown yet (user hasn't done a phishing sim) -> assume neutral/average
        phishing_accuracy = 0.5

    # Fill missing category accuracies with overall accuracy as a fallback
    cat_vector = [
        cat_accuracy[c] if cat_accuracy[c] is not None else overall_accuracy
        for c in CATEGORIES
    ]

    feature_vector = [overall_accuracy, avg_time_per_question, phishing_accuracy] + cat_vector
    return np.array(feature_vector).reshape(1, -1), cat_accuracy, overall_accuracy


@app.route("/predict-risk", methods=["POST"])
def predict_risk():
    if RISK_MODEL is None:
        return jsonify({"error": "Model not trained yet. Run train_model.py"}), 503

    payload = request.get_json(force=True)
    features, cat_accuracy, overall_accuracy = build_feature_vector(payload)

    predicted_score = float(RISK_MODEL.predict(features)[0])
    predicted_score = round(max(0, min(100, predicted_score)), 1)

    if predicted_score >= 75:
        risk_level = "Low"
    elif predicted_score >= 45:
        risk_level = "Medium"
    else:
        risk_level = "High"

    # "Identify weak areas": categories where accuracy is known and below 60%
    weak_areas = [
        cat for cat, acc in cat_accuracy.items()
        if acc is not None and acc < 0.6
    ]
    # If nothing scored below 60%, flag the single weakest known category
    if not weak_areas:
        known = {c: a for c, a in cat_accuracy.items() if a is not None}
        if known:
            weakest = min(known, key=known.get)
            if known[weakest] < 0.85:
                weak_areas = [weakest]

    recommendations = [RECOMMENDATION_LIBRARY[c] for c in weak_areas if c in RECOMMENDATION_LIBRARY]
    if not recommendations:
        recommendations = ["Great job! Keep practicing periodically to stay sharp."]

    return jsonify({
        "score": predicted_score,
        "riskLevel": risk_level,
        "weakAreas": weak_areas,
        "recommendations": recommendations,
        "overallAccuracy": round(overall_accuracy, 2),
    })


# ---------------------------------------------------------------------------
# AI Assistant: TF-IDF + cosine similarity retrieval over the FAQ knowledge base
# (lightweight, explainable "AI" — swap this for an LLM call if you want a
# more open-ended assistant; interface stays the same)
# ---------------------------------------------------------------------------
_all_questions = []
_question_to_entry_index = []
for idx, entry in enumerate(KNOWLEDGE_BASE):
    for q in entry["questions"]:
        _all_questions.append(q)
        _question_to_entry_index.append(idx)

_vectorizer = TfidfVectorizer(stop_words="english")
_question_matrix = _vectorizer.fit_transform(_all_questions)


@app.route("/chatbot", methods=["POST"])
def chatbot():
    payload = request.get_json(force=True)
    message = (payload.get("message") or "").strip()
    # context = { riskScore, riskLevel, weakAreas } — attached by Node from the
    # user's latest RiskScore document, or None if they haven't taken an assessment yet.
    context = payload.get("context")
    if not message:
        return jsonify({"error": "message is required"}), 400

    lower_msg = message.lower()

    # --- Special-case: direct questions about the user's own score/weak areas ---
    SCORE_TRIGGERS = ["my risk score", "why is my score", "why is my risk", "my weak area", "am i at risk"]
    if context and any(t in lower_msg for t in SCORE_TRIGGERS):
        if context.get("riskScore") is not None:
            weak_areas = context.get("weakAreas") or []
            weak_text = ", ".join(w.replace("_", " ") for w in weak_areas) if weak_areas else "no major weak areas right now"
            reply = (
                f"Your current risk score is {context['riskScore']}/100 ({context['riskLevel']} risk). "
                f"Your weakest area(s): {weak_text}. Focus your next study session there — "
                "it's the fastest way to raise your score."
            )
        else:
            reply = "You haven't taken an assessment yet, so I don't have a risk score for you. Head to the Assessment page to get your first score!"
        return jsonify({"reply": reply, "confidence": 1.0, "matchedTopic": "risk_score"})

    # --- Standard FAQ retrieval via TF-IDF + cosine similarity ---
    user_vec = _vectorizer.transform([message])
    similarities = cosine_similarity(user_vec, _question_matrix)[0]

    best_idx = int(np.argmax(similarities))
    best_score = float(similarities[best_idx])

    CONFIDENCE_THRESHOLD = 0.15
    if best_score < CONFIDENCE_THRESHOLD:
        return jsonify({
            "reply": (
                "I'm not fully sure about that one. Try asking about phishing, passwords, "
                "malware, social engineering, network security, or data privacy — or check "
                "the Learn section for a full module."
            ),
            "confidence": round(best_score, 2),
            "matchedTopic": None,
        })

    entry = KNOWLEDGE_BASE[_question_to_entry_index[best_idx]]
    reply = entry["answer"]
    matched_topic = entry["topic"]

    # --- Personalization: if this topic happens to be one of the user's known
    # weak areas, append a short nudge referencing their actual performance. ---
    if context and context.get("weakAreas") and matched_topic in context["weakAreas"]:
        reply += (
            f"\n\nSince this came up: your recent assessment shows {matched_topic.replace('_', ' ')} "
            f"is one of your weaker areas (risk score: {context.get('riskScore')}/100). "
            "Worth reviewing the matching Learn module and trying a few extra practice scenarios."
        )

    return jsonify({
        "reply": reply,
        "confidence": round(best_score, 2),
        "matchedTopic": matched_topic,
    })

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "modelLoaded": RISK_MODEL is not None})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
