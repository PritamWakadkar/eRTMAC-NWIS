import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 10000,
});


// ============================================================
// ANALYSIS API
// ============================================================

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


// ============================================================
// PREDICTION API
// ============================================================

export const predictWell = async (
    wellId,
    depth
) => {
    try {

        const response = await API.post(
            "/predict",
            {
                well_id: wellId,
                depth: Number(depth),
            }
        );

        return response.data;

    } catch (error) {

        console.error(
            "Prediction API Error:",
            error.response?.data || error.message
        );

        throw error;
    }
};


// ============================================================
// NEARBY WELLS API
// ============================================================

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


// ============================================================
// DOCUMENT — UPLOAD
// ============================================================

export const uploadDocument = async (
    file
) => {

    try {

        const formData = new FormData();

        formData.append(
            "file",
            file
        );

        const response = await API.post(
            "/documents/upload",
            formData,
            {
                headers: {
                    "Content-Type":
                        "multipart/form-data",
                },
            }
        );

        return response.data;

    } catch (error) {

        console.error(
            "Document Upload API Error:",
            error.response?.data || error.message
        );

        throw error;
    }
};


// ============================================================
// DOCUMENT — GET ALL
// ============================================================

export const getDocuments = async () => {

    try {

        const response = await API.get(
            "/documents"
        );

        return response.data;

    } catch (error) {

        console.error(
            "Get Documents API Error:",
            error.response?.data || error.message
        );

        throw error;
    }
};


// ============================================================
// DOCUMENT — GET ONE
// ============================================================

export const getDocument = async (
    documentId
) => {

    try {

        const response = await API.get(
            `/documents/${documentId}`
        );

        return response.data;

    } catch (error) {

        console.error(
            "Get Document API Error:",
            error.response?.data || error.message
        );

        throw error;
    }
};


// ============================================================
// DOCUMENT — PROCESS
// ============================================================

export const processDocument = async (
    documentId
) => {

    try {

        const response = await API.post(
            `/documents/${documentId}/process`
        );

        return response.data;

    } catch (error) {

        console.error(
            "Process Document API Error:",
            error.response?.data || error.message
        );

        throw error;
    }
};


// ============================================================
// DOCUMENT — DELETE
// ============================================================

export const deleteDocument = async (
    documentId
) => {

    try {

        const response = await API.delete(
            `/documents/${documentId}`
        );

        return response.data;

    } catch (error) {

        console.error(
            "Delete Document API Error:",
            error.response?.data || error.message
        );

        throw error;
    }
};
// ============================================================
// DEFAULT API INSTANCE
// ============================================================

export default API;