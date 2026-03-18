"""
SadakSathi — Civic Issue Duplicate Detector

Ported from eNivaran's duplication_detection_code.py.
Uses ResNet50 (image), SentenceTransformer (text), Geopy (location), and XGBoost (classifier).
"""

from __future__ import annotations

import io
import json
import logging
import os
import warnings
from collections import defaultdict

import numpy as np
from PIL import Image

warnings.filterwarnings("ignore")
logger = logging.getLogger(__name__)


def _decode_image_bytes(image_bytes: bytes) -> Image.Image:
    """Decode raw image bytes to a PIL Image."""
    try:
        return Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        logger.warning(f"Error decoding image bytes: {e}")
        return Image.new("RGB", (224, 224), color="white")


def _decode_base64_image(base64_str: str) -> Image.Image:
    """Decode a base64 string (with or without data URI prefix) to a PIL Image."""
    import base64 as b64

    try:
        if "," in base64_str:
            base64_str = base64_str.split(",", 1)[1]
        raw = b64.b64decode(base64_str)
        return Image.open(io.BytesIO(raw)).convert("RGB")
    except Exception as e:
        logger.warning(f"Error decoding base64 image: {e}")
        return Image.new("RGB", (224, 224), color="white")


class CivicIssueDuplicateDetector:
    """
    Multi-modal duplicate detection engine using unsupervised clustering.

    Compares reports using:
    - Image features (ResNet50)
    - Text embeddings (Sentence-BERT)
    - Geospatial proximity (Geopy)
    - XGBoost classifier (auto-trained when enough data available)
    """

    def __init__(
        self,
        n_clusters: int | None = None,
        location_threshold: float = 0.1,
        text_similarity_threshold: float = 0.65,
    ):
        import torch
        import torchvision.models as models
        import torchvision.transforms as transforms

        self.n_clusters = n_clusters
        self.location_threshold = location_threshold
        self.text_similarity_threshold = text_similarity_threshold

        # ── Image feature extractor (ResNet50) ──
        try:
            resnet = models.resnet50(weights="DEFAULT")
            resnet.eval()
            self.image_model = torch.nn.Sequential(*(list(resnet.children())[:-1]))
            self.image_model_available = True
            logger.info("ResNet50 model loaded for image embeddings.")
        except Exception as e:
            logger.warning(f"Could not load ResNet50: {e}. Using basic image features.")
            self.image_model = None
            self.image_model_available = False

        self.image_transform = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])

        # ── Text embedding model (Sentence-BERT) ──
        try:
            from sentence_transformers import SentenceTransformer
            self.text_model = SentenceTransformer("paraphrase-MiniLM-L6-v2")
            self.text_model_available = True
            logger.info("SentenceTransformer loaded for text embeddings.")
        except Exception as e:
            logger.warning(f"Could not load SentenceTransformer: {e}. Falling back to TF-IDF.")
            self.text_model = None
            self.text_model_available = False

        # ── TF-IDF fallback ──
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            self.tfidf = TfidfVectorizer(max_features=5000, stop_words="english")
            self.tfidf_fitted = False
        except Exception:
            self.tfidf = None
            self.tfidf_fitted = False

        # ── Storage ──
        self.image_features_db: list[np.ndarray] = []
        self.location_db: list[list[float]] = []
        self.text_embeddings_db: list[np.ndarray] = []
        self.text_raw_db: list[str] = []
        self.issue_types_db: list[str] = []
        self.reports_db: list[dict] = []

        # ── Clustering ──
        self.image_kmeans = None
        self.image_clusters: list[int] = []
        self.location_clusters: dict = defaultdict(list)
        self.issue_type_clusters: dict = defaultdict(list)

        # ── XGBoost ──
        self.xgb_model = None
        self.scaler = None
        self.has_enough_data_for_xgboost = False

    # ─────────────────────────────────────────
    #  Feature Extraction
    # ─────────────────────────────────────────

    def extract_image_features(self, image_input) -> np.ndarray:
        """Extract image features using ResNet50 or fallback to basic histogram."""
        import torch

        try:
            # Resolve image to PIL
            if image_input is None:
                return np.zeros(2048 if self.image_model_available else 100)
            elif isinstance(image_input, str):
                if image_input.startswith("data:") or len(image_input) > 500:
                    pil_img = _decode_base64_image(image_input)
                elif os.path.exists(image_input):
                    pil_img = Image.open(image_input).convert("RGB")
                else:
                    return np.zeros(2048 if self.image_model_available else 100)
            elif isinstance(image_input, bytes):
                pil_img = _decode_image_bytes(image_input)
            elif isinstance(image_input, Image.Image):
                pil_img = image_input
            elif isinstance(image_input, np.ndarray):
                pil_img = Image.fromarray(image_input.astype("uint8"))
            else:
                return np.zeros(2048 if self.image_model_available else 100)

            if self.image_model_available and self.image_model is not None:
                tensor = self.image_transform(pil_img).unsqueeze(0)
                with torch.no_grad():
                    features = self.image_model(tensor)
                return features.squeeze().numpy()
            else:
                # Basic color histogram fallback
                arr = np.array(pil_img.resize((64, 64)))
                hist_r = np.histogram(arr[:, :, 0], bins=10, range=(0, 255))[0]
                hist_g = np.histogram(arr[:, :, 1], bins=10, range=(0, 255))[0]
                hist_b = np.histogram(arr[:, :, 2], bins=10, range=(0, 255))[0]
                mean_rgb = np.mean(arr, axis=(0, 1))
                std_rgb = np.std(arr, axis=(0, 1))
                features = np.concatenate([hist_r, hist_g, hist_b, mean_rgb, std_rgb])
                padded = np.zeros(100)
                padded[: len(features)] = features[: 100]
                return padded

        except Exception as e:
            logger.warning(f"Image feature extraction error: {e}")
            return np.zeros(2048 if self.image_model_available else 100)

    def extract_text_features(self, text: str) -> np.ndarray:
        """Extract text embeddings using Sentence-BERT or TF-IDF fallback."""
        if not text or not isinstance(text, str):
            text = ""

        try:
            if self.text_model_available and self.text_model is not None:
                return self.text_model.encode(text)
            elif self.tfidf is not None:
                if not self.tfidf_fitted and len(self.text_raw_db) > 0:
                    self.tfidf.fit(self.text_raw_db + [text])
                    self.tfidf_fitted = True
                    return self.tfidf.transform([text]).toarray()[0]
                elif self.tfidf_fitted:
                    return self.tfidf.transform([text]).toarray()[0]
            # Very basic fallback
            return np.array([len(text), len(text.split())] + [0] * 382)
        except Exception as e:
            logger.warning(f"Text feature extraction error: {e}")
            return np.zeros(384)

    # ─────────────────────────────────────────
    #  Report Management
    # ─────────────────────────────────────────

    def _location_to_grid(self, location: list[float]) -> tuple[int, int]:
        try:
            return (int(location[0] / self.location_threshold), int(location[1] / self.location_threshold))
        except Exception:
            return (0, 0)

    def add_report(self, report: dict) -> int | None:
        """
        Add a report to the internal database.

        report must contain: text, location ([lat, lon]), issue_type.
        Optionally: id, image_base64, image_path, image_bytes.
        """
        try:
            for field in ("text", "location", "issue_type"):
                if field not in report:
                    raise ValueError(f"Missing required field: {field}")

            image_input = report.get("image_base64") or report.get("image_bytes") or report.get("image_path")
            image_features = self.extract_image_features(image_input)
            text_embedding = self.extract_text_features(report["text"])

            idx = len(self.reports_db)
            self.image_features_db.append(image_features)
            self.text_embeddings_db.append(text_embedding)
            self.text_raw_db.append(report["text"])
            self.location_db.append(report["location"])
            self.issue_types_db.append(report["issue_type"])
            self.reports_db.append(report)

            grid = self._location_to_grid(report["location"])
            self.location_clusters[grid].append(idx)
            self.issue_type_clusters[report["issue_type"]].append(idx)

            self._check_and_train_xgboost()
            return idx

        except Exception as e:
            logger.error(f"Error adding report: {e}")
            return None

    def build_clusters(self):
        """Build KMeans clusters from all stored image features."""
        from sklearn.cluster import KMeans

        try:
            if len(self.reports_db) < 2:
                return
            n = self.n_clusters or max(2, min(len(self.reports_db) // 2, 50))
            n = min(n, len(self.reports_db))
            self.image_kmeans = KMeans(n_clusters=n, random_state=42, n_init=10)
            self.image_clusters = self.image_kmeans.fit_predict(np.array(self.image_features_db)).tolist()
        except Exception as e:
            logger.error(f"Error building clusters: {e}")
            self.image_clusters = [0] * len(self.reports_db)

    # ─────────────────────────────────────────
    #  XGBoost Auto-Training
    # ─────────────────────────────────────────

    def _check_and_train_xgboost(self):
        if self.has_enough_data_for_xgboost:
            return
        try:
            has_enough = any(len(indices) >= 5 for indices in self.issue_type_clusters.values())
            if has_enough:
                self._train_xgboost()
                self.has_enough_data_for_xgboost = True
        except Exception as e:
            logger.error(f"XGBoost check error: {e}")

    def _train_xgboost(self):
        from sklearn.metrics.pairwise import cosine_similarity
        from sklearn.preprocessing import StandardScaler
        import geopy.distance
        import xgboost as xgb

        try:
            X, y = [], []
            for i in range(len(self.reports_db)):
                for j in range(i + 1, len(self.reports_db)):
                    if self.issue_types_db[i] != self.issue_types_db[j]:
                        continue
                    text_sim = cosine_similarity([self.text_embeddings_db[i]], [self.text_embeddings_db[j]])[0][0]
                    image_sim = cosine_similarity([self.image_features_db[i]], [self.image_features_db[j]])[0][0]
                    dist = geopy.distance.distance(self.location_db[i], self.location_db[j]).kilometers
                    loc_sim = 1.0 - min(1.0, dist / self.location_threshold)

                    X.append([text_sim, image_sim, loc_sim, 1])
                    pseudo_label = 1 if (0.4 * text_sim + 0.2 * image_sim + 0.4 * loc_sim) >= 0.65 else 0
                    y.append(pseudo_label)

            if len(X) > 5:
                self.scaler = StandardScaler()
                X_scaled = self.scaler.fit_transform(X)
                self.xgb_model = xgb.XGBClassifier(
                    n_estimators=50, max_depth=3, learning_rate=0.1,
                    objective="binary:logistic", random_state=42
                )
                self.xgb_model.fit(X_scaled, y)
                logger.info("XGBoost duplicate classifier trained.")
        except Exception as e:
            logger.error(f"XGBoost training error: {e}")
            self.xgb_model = None
            self.scaler = None

    # ─────────────────────────────────────────
    #  Duplicate Detection
    # ─────────────────────────────────────────

    def find_duplicates(self, new_report: dict) -> tuple[bool, list[dict], float]:
        """
        Check if a new report duplicates any existing report.

        Returns:
            (is_duplicate, list_of_similar_reports, confidence)
        """
        from sklearn.metrics.pairwise import cosine_similarity
        import geopy.distance

        try:
            for field in ("text", "location", "issue_type"):
                if field not in new_report:
                    logger.warning(f"Missing field: {field}")
                    return False, [], 0.0

            image_input = new_report.get("image_base64") or new_report.get("image_bytes") or new_report.get("image_path")
            new_img_feat = self.extract_image_features(image_input)
            new_txt_emb = self.extract_text_features(new_report["text"])
            new_loc = new_report["location"]
            new_type = new_report["issue_type"]

            similarities: list[tuple[dict, float]] = []

            for idx, report in enumerate(self.reports_db):
                try:
                    if report.get("issue_type") != new_type:
                        continue

                    dist = geopy.distance.distance(new_loc, self.location_db[idx]).kilometers
                    if dist > self.location_threshold:
                        continue

                    text_sim = float(cosine_similarity([new_txt_emb], [self.text_embeddings_db[idx]])[0][0])
                    image_sim = float(cosine_similarity([new_img_feat], [self.image_features_db[idx]])[0][0])

                    if np.isnan(text_sim):
                        text_sim = 0.0
                    if np.isnan(image_sim):
                        image_sim = 0.0

                    loc_sim = 1.0 - min(1.0, dist / self.location_threshold)

                    # Use XGBoost if available
                    if (
                        self.xgb_model is not None
                        and self.has_enough_data_for_xgboost
                        and len(self.reports_db) > 10
                        and self.scaler is not None
                    ):
                        features = self.scaler.transform([[text_sim, image_sim, loc_sim, 1]])
                        prob = self.xgb_model.predict_proba(features)[0][1]
                        if prob >= 0.5:
                            similarities.append((report, float(prob)))
                    else:
                        # Rule-based fallback
                        if image_sim > 0.85 and loc_sim > 0.9:
                            similarities.append((report, 0.95))
                            continue

                        overall = 0.4 * text_sim + 0.2 * image_sim + 0.4 * loc_sim
                        if overall >= 0.65:
                            similarities.append((report, float(overall)))

                except Exception as e:
                    logger.warning(f"Comparison error with report {idx}: {e}")
                    continue

            similarities.sort(key=lambda x: x[1], reverse=True)

            if similarities:
                return True, [r for r, _ in similarities], similarities[0][1]
            return False, [], 0.0

        except Exception as e:
            logger.error(f"find_duplicates error: {e}")
            return False, [], 0.0

    def process_json_input(self, data: dict) -> dict:
        """
        Process a report dict and return duplicate status.

        Returns:
            {"is_duplicate": 0|1, "original_report_id": "...", "confidence": float}
        """
        try:
            is_dup, similar, confidence = self.find_duplicates(data)
            response: dict = {"is_duplicate": 1 if is_dup else 0, "confidence": round(confidence, 4)}

            if is_dup and similar:
                original_ids = [r.get("id") for r in similar if r.get("id")]
                if original_ids:
                    response["original_report_id"] = original_ids[0]
                response["similar_reports"] = [
                    {
                        "id": r.get("id", "unknown"),
                        "text": (r.get("text", "")[:100] + "...") if len(r.get("text", "")) > 100 else r.get("text", ""),
                        "issue_type": r.get("issue_type", ""),
                        "location": r.get("location", []),
                    }
                    for r in similar[:5]
                ]

            return response

        except Exception as e:
            logger.error(f"process_json_input error: {e}")
            return {"is_duplicate": 0, "error": str(e)}


def create_detector(**kwargs) -> CivicIssueDuplicateDetector:
    """Factory function to create a detector instance."""
    try:
        detector = CivicIssueDuplicateDetector(**kwargs)
        logger.info("Duplicate detector initialized.")
        return detector
    except Exception as e:
        logger.error(f"Error creating detector: {e}")
        raise
