import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { FiHome, FiEdit3, FiBarChart2, FiPackage, FiMenu, FiX, FiDownload } from 'react-icons/fi'

function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false)

    const navItems = [
        { to: '/', label: 'Dashboard', icon: <FiHome /> },
        { to: '/sales', label: 'บันทึกขายออก', icon: <FiEdit3 /> },
        { to: '/purchases', label: 'บันทึกรับเข้า', icon: <FiDownload /> },
        { to: '/summary', label: 'สรุปย้อนหลัง', icon: <FiBarChart2 /> },
        { to: '/products', label: 'สรุปสินค้า', icon: <FiPackage /> }
    ]

    return (
        <>
            {/* Mobile Header */}
            <div className="mobile-header">
                <Link to="/" className="mobile-header-brand">
                    <div className="sidebar-brand-icon">🥩</div>
                    Stock เนื้อ
                </Link>
                <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
                    {menuOpen ? <FiX /> : <FiMenu />}
                </button>
            </div>

            {/* Sidebar Overlay for mobile */}
            {menuOpen && (
                <div className="sidebar-overlay" onClick={() => setMenuOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
                <Link to="/" className="sidebar-brand" onClick={() => setMenuOpen(false)}>
                    <div className="sidebar-brand-icon">🥩</div>
                    <div>
                        <div className="sidebar-brand-text">Stock เนื้อ</div>
                        <div className="sidebar-brand-sub">ระบบจัดการสต็อกเนื้อสัตว์</div>
                    </div>
                </Link>

                <ul className="sidebar-nav">
                    {navItems.map(item => (
                        <li key={item.to}>
                            <NavLink
                                to={item.to}
                                end={item.to === '/'}
                                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                                onClick={() => setMenuOpen(false)}
                            >
                                {item.icon}
                                {item.label}
                            </NavLink>
                        </li>
                    ))}
                </ul>

                <div className="sidebar-footer">
                    Stock WebApp v1.0 © 2026
                </div>
            </aside>
        </>
    )
}

export default Navbar
