"""
train_model.py

Trains the Cybersecurity Risk Score model.

Produces:
    risk_model.pkl
"""

import numpy as np
from sklearn.ensemble import RandomForestRegressor
import joblib


CATEGORIES = [
    "phishing",
    "password_security",
    "malware",
    "social_engineering",
    "network_security",
    "data_privacy",
]


FEATURE_NAMES = (
    [
        "overall_accuracy",
        "avg_time_per_question",
        "phishing_sim_accuracy",
    ]
    + [f"acc_{c}" for c in CATEGORIES]
)


np.random.seed(42)

N_SAMPLES = 4000


def generate_synthetic_data(n=N_SAMPLES):
    X = []
    y = []

    for _ in range(n):

        # Person's general cybersecurity aptitude
        base_skill = np.random.beta(2, 2)

        # Accuracy for each cybersecurity category
        cat_acc = np.clip(
            base_skill
            + np.random.normal(0, 0.15, size=len(CATEGORIES)),
            0,
            1,
        )

        overall_accuracy = cat_acc.mean()

        # Faster + correct = more confident
        avg_time_per_question = np.random.normal(
            25 - 10 * base_skill,
            5
        )

        avg_time_per_question = max(
            3,
            avg_time_per_question
        )

        # Phishing simulation performance
        phishing_sim_accuracy = np.clip(
            base_skill + np.random.normal(0, 0.2),
            0,
            1,
        )

        # Ground-truth risk score
        # 0 = risky
        # 100 = safe

        score = (
            40 * phishing_sim_accuracy
            + 45 * overall_accuracy
            + 15 * (
                1 - min(avg_time_per_question / 40, 1)
            )
        )

        score = np.clip(
            score + np.random.normal(0, 4),
            0,
            100,
        )

        row = [
            overall_accuracy,
            avg_time_per_question,
            phishing_sim_accuracy,
        ] + list(cat_acc)

        X.append(row)
        y.append(score)

    return np.array(X), np.array(y)


def main():

    X, y = generate_synthetic_data()

    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=8,
        random_state=42,
        n_jobs=1,
    )

    model.fit(X, y)

    train_score = model.score(X, y)

    print(
        f"Model trained. R^2 on training data: {train_score:.3f}"
    )

    joblib.dump(
        {
            "model": model,
            "feature_names": FEATURE_NAMES,
            "categories": CATEGORIES,
        },
        "risk_model.pkl",
    )

    print("Saved risk_model.pkl")


if __name__ == "__main__":
    main()
