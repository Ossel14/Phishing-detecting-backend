from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import tldextract
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from scipy.sparse import hstack
import numpy as np

app = FastAPI()

# -----------------------------
# LOAD YOUR MODELS
# -----------------------------
email_model = joblib.load("models/email_phishing_model.pkl")
email_tfidf = joblib.load("models/tfidf_vectorizer.pkl")

url_model = joblib.load("models/url_model.pkl")
url_tfidf = joblib.load("models/url_tfidf.pkl")

# -----------------------------
# REQUEST SCHEMAS
# -----------------------------
class EmailInput(BaseModel):
    subject: str
    body: str

class URLInput(BaseModel):
    url: str

# -----------------------------
# URL FEATURE EXTRACTION
# -----------------------------
def clean_url(url: str):
    url = url.lower()
    url = re.sub(r"https?://", "", url)
    url = re.sub(r"www\.", "", url)
    url = re.sub(r"[^a-zA-Z0-9./:?=&%-]", "", url)
    return url

def extract_url_features(url: str):
    ext = tldextract.extract(url)
    domain = ext.domain
    suffix = ext.suffix
    subdomain = ext.subdomain
    
    return np.array([
        len(url),
        sum(c.isdigit() for c in url),
        sum(not c.isalnum() for c in url),
        url.count("."),
        len(domain),
        len(subdomain),
        len(suffix),
        1 if "https" in url else 0,
        1 if re.search(r"\d+\.\d+\.\d+\.\d+", url) else 0
    ]).reshape(1, -1)

# -----------------------------
# EMAIL PREDICTION ENDPOINT
# -----------------------------
@app.post("/predict/email")
def predict_email(data: EmailInput):
    text = data.subject + " " + data.body
    X = email_tfidf.transform([text])
    prediction = email_model.predict(X)[0]
    return {"email_phishing": bool(prediction)}

# -----------------------------
# URL PREDICTION ENDPOINT
# -----------------------------
@app.post("/predict/url")
def predict_url(data: URLInput):
    cleaned = clean_url(data.url)
    
    tfidf_vector = url_tfidf.transform([cleaned])
    lexical = extract_url_features(cleaned)

    X = hstack([tfidf_vector, lexical])

    prediction = url_model.predict(X)[0]
    return {"url_phishing": bool(prediction)}

