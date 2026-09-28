 
export const ANALYSIS_STORAGE_KEY = "ertmac_analysis_result";
 
export function saveAnalysis(response) {
    try {
        if (response && typeof response === "object") {
            sessionStorage.setItem(
                ANALYSIS_STORAGE_KEY,
                JSON.stringify(response)
            );
        }
    } catch (error) {
        console.error("Failed to save analysis:", error);
    }
}
 
export function loadAnalysis() {
    try {
        const stored = sessionStorage.getItem(ANALYSIS_STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch (error) {
        console.error("Failed to restore analysis:", error);
        return null;
    }
}
 
export function clearAnalysis() {
    try {
        sessionStorage.removeItem(ANALYSIS_STORAGE_KEY);
    } catch (error) {
        console.error("Failed to clear analysis:", error);
    }
}
 
