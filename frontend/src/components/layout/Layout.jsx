import Sidebar from "./Sidebar";
import Footer from "./Footer";
import AIChatDrawer from "../common/AIChatDrawer";

function Layout({ children }) {
    return (
        <div className="min-h-screen bg-slate-50">

            {/* Desktop / Mobile Navigation */}
            <Sidebar />

            {/* Main Application Area */}
            <div className="min-h-screen md:pl-64">

                <main>
                    {children}
                </main>

                <Footer />

            </div>

            {/* AI RAG Assistant Drawer */}
            <AIChatDrawer />

        </div>
    );
}

export default Layout;