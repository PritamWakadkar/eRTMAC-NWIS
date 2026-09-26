import { Routes, Route } from "react-router-dom";

import Layout from "./components/layout/Layout";

import Dashboard from "./pages/Dashboard";
import Analysis from "./pages/Analysis";
import Prediction from "./pages/Prediction";
import EventAnalysis from "./pages/EventAnalysis";
import NotFound from "./pages/NotFound";

function App() {
    return (
        <Layout>
            <Routes>

                <Route
                    path="/"
                    element={<Dashboard />}
                />

                <Route
                    path="/analysis"
                    element={<Analysis />}
                />

                <Route
                    path="/event-analysis"
                    element={<EventAnalysis />}
                />

                <Route
                    path="/prediction"
                    element={<Prediction />}
                />

                <Route
                    path="*"
                    element={<NotFound />}
                />

            </Routes>
        </Layout>
    );
}

export default App;