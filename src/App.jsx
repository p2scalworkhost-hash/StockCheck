import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import SalesEntry from './pages/SalesEntry'
import Summary from './pages/Summary'
import Products from './pages/Products'
import PurchaseEntry from './pages/PurchaseEntry'

function App() {
    return (
        <>
            <Navbar />
            <main className="main-content">
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/sales" element={<SalesEntry />} />
                    <Route path="/purchases" element={<PurchaseEntry />} />
                    <Route path="/summary" element={<Summary />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
        </>
    )
}

export default App
