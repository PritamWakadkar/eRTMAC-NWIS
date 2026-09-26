import axios from "axios";

const API = axios.create({
    baseURL: "http://127.0.0.1:8000",
    headers: {
        "Content-Type": "application/json",
    },
});


// ================================================================
// NATURAL LANGUAGE ANALYSIS
// ================================================================

export const analyzeWell = async (
    question,
    radiusKm = 10,
    depthTolerance = 200
) => {
    try {
        const response = await API.post("/analyze", {
            question: question,
            radius_km: Number(radiusKm),
            depth_tolerance: Number(depthTolerance),
        });

        return response.data;

    } catch (error) {

        console.error(
            "Analyze API Error:",
            error.response?.data || error.message
        );

        throw error;
    }
};


// ================================================================
// DRILLING EVENT PREDICTION
// ================================================================

export const predictWell = async (
    wellId,
    depth
) => {
    try {

        const response = await API.post("/predict", {
            well_id: wellId,
            depth: Number(depth),
        });

        return response.data;

    } catch (error) {

        console.error(
            "Prediction API Error:",
            error.response?.data || error.message
        );

        throw error;
    }
};


// ================================================================
// NEARBY WELLS
// ================================================================

export const getNearbyWells = async (
    wellId,
    radiusKm = 10
) => {
    try {

        const response = await API.get(
            `/nearby-wells/${wellId}`,
            {
                params: {
                    radius_km: Number(radiusKm),
                },
            }
        );

        return response.data;

    } catch (error) {

        console.error(
            "Nearby Wells API Error:",
            error.response?.data || error.message
        );

        throw error;
    }
};


export default API;