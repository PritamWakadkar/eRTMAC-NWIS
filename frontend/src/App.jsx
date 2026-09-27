import { Routes, Route } from "react-router-dom";

import Layout from "./components/layout/Layout";

import Dashboard from "./pages/Dashboard";
import Analysis from "./pages/Analysis";
import Prediction from "./pages/Prediction";
import EventAnalysis from "./pages/EventAnalysis";
import Documents from "./pages/Documents";
import NotFound from "./pages/NotFound";

function App() {
    return (
        <Layout>
            <Routes>

                {/* =================================================
                    DASHBOARD
                ================================================== */}

                <Route
                    path="/"
                    element={<Dashboard />}
                />


                {/* =================================================
                    WELL ANALYSIS
                ================================================== */}

                <Route
                    path="/analysis"
                    element={<Analysis />}
                />


                {/* =================================================
                    EVENT ANALYSIS
                ================================================== */}

                <Route
                    path="/event-analysis"
                    element={<EventAnalysis />}
                />


                {/* =================================================
                    ML PREDICTION
                ================================================== */}

                <Route
                    path="/prediction"
                    element={<Prediction />}
                />


                {/* =================================================
                    DOCUMENT / PDF MANAGEMENT
                    Upload → Process → RAG
                ================================================== */}

                <Route
                    path="/documents"
                    element={<Documents />}
                />


                {/* =================================================
                    404
                ================================================== */}

                <Route
                    path="*"
                    element={<NotFound />}
                />

            </Routes>
        </Layout>
    );
}

export default App;