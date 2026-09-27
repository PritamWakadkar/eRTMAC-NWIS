from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.db import get_connection
from backend.nlp.nlp_engine import NLPEngine
from backend.prediction.predictor import DrillingEventPredictor
from backend.api.document_routes import router as document_router


# ================================================================
# FASTAPI APPLICATION
# ================================================================

app = FastAPI(
    title="eRTMAC-NWIS API",
    description="Nearby Wells Intelligence System",
    version="1.0.0"
)


# ================================================================
# CORS
# ================================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ================================================================
# DOCUMENT PROCESSING ROUTES
# ================================================================

app.include_router(document_router)


# ================================================================
# INITIALIZE ENGINES
# ================================================================

nlp_engine = NLPEngine()
prediction_engine = DrillingEventPredictor()


# ================================================================
# REQUEST MODELS
# ================================================================

class AnalysisRequest(BaseModel):
    question: str
    radius_km: float = 10.0
    depth_tolerance: float = 200.0


class PredictionRequest(BaseModel):
    well_id: str
    depth: float


# ================================================================
# HOME
# ================================================================

@app.get("/")
def home():
    return {
        "message": "eRTMAC-NWIS API is running"
    }


# ================================================================
# NEARBY WELLS
# ================================================================

@app.get("/nearby-wells/{well_id}")
def get_nearby_wells(
    well_id: str,
    radius_km: float = 10.0
):

    connection = None
    cursor = None

    try:

        connection = get_connection()
        cursor = connection.cursor()

        # --------------------------------------------------------
        # CHECK TARGET WELL
        # --------------------------------------------------------

        cursor.execute(
            """
            SELECT location
            FROM wells
            WHERE well_id = %s
            """,
            (well_id.upper(),)
        )

        target = cursor.fetchone()

        if target is None:
            raise HTTPException(
                status_code=404,
                detail=f"Well {well_id.upper()} not found"
            )

        # --------------------------------------------------------
        # FIND NEARBY WELLS
        # --------------------------------------------------------

        cursor.execute(
            """
            SELECT
                w.well_id,
                w.latitude,
                w.longitude,
                w.total_depth,
                w.formation,
                ROUND(
                    (
                        ST_Distance(
                            w.location::geography,
                            target.location::geography
                        ) / 1000
                    )::numeric,
                    2
                ) AS distance_km
            FROM wells w
            CROSS JOIN (
                SELECT location
                FROM wells
                WHERE well_id = %s
            ) AS target
            WHERE w.well_id != %s
            AND ST_DWithin(
                w.location::geography,
                target.location::geography,
                %s
            )
            ORDER BY distance_km;
            """,
            (
                well_id.upper(),
                well_id.upper(),
                radius_km * 1000
            )
        )

        rows = cursor.fetchall()

        nearby_wells = []

        for row in rows:

            nearby_wells.append(
                {
                    "well_id": row[0],
                    "latitude": row[1],
                    "longitude": row[2],
                    "total_depth": row[3],
                    "formation": row[4],
                    "distance_km": float(row[5])
                }
            )

        return {
            "target_well": well_id.upper(),
            "radius_km": radius_km,
            "count": len(nearby_wells),
            "nearby_wells": nearby_wells
        }

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ================================================================
# NWIS NATURAL LANGUAGE ANALYSIS
# ================================================================

@app.post("/analyze")
def analyze_well(
    request: AnalysisRequest
):

    # ------------------------------------------------------------
    # VALIDATE QUESTION
    # ------------------------------------------------------------

    question = request.question.strip()

    if not question:

        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty."
        )

    # ------------------------------------------------------------
    # RUN NLP ENGINE
    # ------------------------------------------------------------

    try:

        result = nlp_engine.process(
            question=question,
            radius_km=request.radius_km,
            depth_tolerance=request.depth_tolerance
        )

        return result

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ================================================================
# DRILLING EVENT PREDICTION
# ================================================================

@app.post("/predict")
def predict_drilling_event(
    request: PredictionRequest
):

    try:

        result = prediction_engine.predict_well(
            well_id=request.well_id,
            depth_m=request.depth
        )

        return {
            "success": True,
            "result": result
        }

    except ValueError as e:

        return {
            "success": False,
            "error": str(e)
        }

    except Exception as e:

        return {
            "success": False,
            "error": "Prediction failed.",
            "details": str(e)
        }