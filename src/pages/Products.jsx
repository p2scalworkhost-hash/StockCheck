import { useState, useEffect } from 'react'
import { FiPackage, FiTrendingUp, FiTrendingDown } from 'react-icons/fi'
import {
    formatCurrency,
    formatThaiDate
} from '../services/firebase'

const STORAGE_KEY = 'stock_webapp_sales'

function Products() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [sortBy, setSortBy] = useState('totalProfit') // totalProfit, count, revenue
    const [sortDir, setSortDir] = useState('desc')

    useEffect(() => {
        loadProducts()
    }, [])

    const loadProducts = () => {
        setLoading(true)
        try {
            const raw = localStorage.getItem(STORAGE_KEY)
            const allSales = raw ? JSON.parse(raw) : []

            // จัดกลุ่มตามสินค้า
            const map = {}
            allSales.forEach(sale => {
                const key = sale.productName
                if (!map[key]) {
                    map[key] = {
                        name: key,
                        count: 0,
                        totalWeight: 0,
                        totalCost: 0,
                        totalSelling: 0,
                        totalProfit: 0,
                        customers: new Set(),
                        firstDate: sale.saleDate,
                        lastDate: sale.saleDate
                    }
                }
                map[key].count++
                map[key].totalWeight += sale.weight || 0
                map[key].totalCost += sale.costPrice || 0
                map[key].totalSelling += sale.sellingPrice || 0
                map[key].totalProfit += sale.profit || 0
                map[key].customers.add(sale.customerName)
                if (sale.saleDate < map[key].firstDate) map[key].firstDate = sale.saleDate
                if (sale.saleDate > map[key].lastDate) map[key].lastDate = sale.saleDate
            })

            // แปลง Set เป็น count
            const list = Object.values(map).map(p => ({
                ...p,
                customerCount: p.customers.size,
                avgProfit: p.count > 0 ? p.totalProfit / p.count : 0,
                marginPercent: p.totalCost > 0 ? ((p.totalProfit / p.totalCost) * 100) : 0
            }))

            setProducts(list)
        } catch (err) {
            console.error('Error loading products:', err)
        } finally {
            setLoading(false)
        }
    }

    // Sorting
    const sorted = [...products].sort((a, b) => {
        const mul = sortDir === 'desc' ? -1 : 1
        return (a[sortBy] - b[sortBy]) * mul
    })

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortDir(d => d === 'desc' ? 'asc' : 'desc')
        } else {
            setSortBy(field)
            setSortDir('desc')
        }
    }

    const sortIcon = (field) =>
        sortBy === field
            ? (sortDir === 'desc' ? ' ▼' : ' ▲')
            : ''

    // Grand totals
    const grandCost = products.reduce((s, p) => s + p.totalCost, 0)
    const grandSelling = products.reduce((s, p) => s + p.totalSelling, 0)
    const grandProfit = products.reduce((s, p) => s + p.totalProfit, 0)
    const grandCount = products.reduce((s, p) => s + p.count, 0)

    if (loading) {
        return (
            <div className="loading" style={{ minHeight: '60vh' }}>
                <div className="spinner"></div>
                <span>กำลังโหลดข้อมูลสินค้า...</span>
            </div>
        )
    }

    return (
        <div>
            {/* Header */}
            <div className="page-header animate-in">
                <h1 className="page-title">
                    <FiPackage /> สรุปสินค้า
                </h1>
                <p className="page-subtitle">ภาพรวมยอดขายและกำไร/ขาดทุน แยกตามสินค้า (ทั้งหมด)</p>
            </div>

            {/* Stat cards */}
            <div className="stat-cards">
                <div className="stat-card animate-in">
                    <div className="stat-card-label">สินค้าทั้งหมด</div>
                    <div className="stat-card-value">{products.length} รายการ</div>
                </div>
                <div className="stat-card animate-in">
                    <div className="stat-card-label">ขายรวมทั้งหมด</div>
                    <div className="stat-card-value">{grandCount} ครั้ง</div>
                </div>
                <div className="stat-card animate-in">
                    <div className="stat-card-label">ยอดขายรวม</div>
                    <div className="stat-card-value">{formatCurrency(grandSelling)}</div>
                </div>
                <div className="stat-card animate-in">
                    <div className="stat-card-label">กำไรรวมทั้งหมด</div>
                    <div className={`stat-card-value ${grandProfit >= 0 ? 'profit' : 'loss'}`}>
                        {grandProfit >= 0 ? '+' : ''}{formatCurrency(grandProfit)}
                    </div>
                </div>
            </div>

            {/* Products Table */}
            {products.length === 0 ? (
                <div className="empty-state animate-in">
                    <div className="empty-state-icon">📦</div>
                    <p className="empty-state-text">ยังไม่มีข้อมูลสินค้า</p>
                </div>
            ) : (
                <div className="table-container animate-in">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>ชื่อสินค้า</th>
                                <th
                                    onClick={() => handleSort('count')}
                                    style={{ cursor: 'pointer', userSelect: 'none' }}
                                >
                                    จำนวนขาย{sortIcon('count')}
                                </th>
                                <th
                                    onClick={() => handleSort('totalWeight')}
                                    style={{ cursor: 'pointer', userSelect: 'none' }}
                                >
                                    น.น. รวม (กก.){sortIcon('totalWeight')}
                                </th>
                                <th
                                    onClick={() => handleSort('totalCost')}
                                    style={{ cursor: 'pointer', userSelect: 'none' }}
                                >
                                    ทุนรวม{sortIcon('totalCost')}
                                </th>
                                <th
                                    onClick={() => handleSort('totalSelling')}
                                    style={{ cursor: 'pointer', userSelect: 'none' }}
                                >
                                    ยอดขายรวม{sortIcon('totalSelling')}
                                </th>
                                <th
                                    onClick={() => handleSort('totalProfit')}
                                    style={{ cursor: 'pointer', userSelect: 'none' }}
                                >
                                    กำไรรวม{sortIcon('totalProfit')}
                                </th>
                                <th
                                    onClick={() => handleSort('marginPercent')}
                                    style={{ cursor: 'pointer', userSelect: 'none' }}
                                >
                                    มาร์จิ้น %{sortIcon('marginPercent')}
                                </th>
                                <th
                                    onClick={() => handleSort('customerCount')}
                                    style={{ cursor: 'pointer', userSelect: 'none' }}
                                >
                                    ลูกค้า{sortIcon('customerCount')}
                                </th>
                                <th>สถานะ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map((p, idx) => (
                                <tr key={p.name}>
                                    <td>{idx + 1}</td>
                                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                                    <td>{p.count} ครั้ง</td>
                                    <td>{p.totalWeight.toFixed(1)}</td>
                                    <td>{formatCurrency(p.totalCost)}</td>
                                    <td>{formatCurrency(p.totalSelling)}</td>
                                    <td>
                                        <span className={`badge ${p.totalProfit >= 0 ? 'badge-profit' : 'badge-loss'}`}>
                                            {p.totalProfit >= 0 ? '+' : ''}{formatCurrency(p.totalProfit)}
                                        </span>
                                    </td>
                                    <td style={{ color: p.marginPercent >= 0 ? 'var(--profit-color)' : 'var(--loss-color)' }}>
                                        {p.marginPercent >= 0 ? '+' : ''}{p.marginPercent.toFixed(1)}%
                                    </td>
                                    <td>{p.customerCount} คน</td>
                                    <td>
                                        {p.totalProfit >= 0 ? (
                                            <span style={{ color: 'var(--profit-color)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <FiTrendingUp /> กำไร
                                            </span>
                                        ) : (
                                            <span style={{ color: 'var(--loss-color)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <FiTrendingDown /> ขาดทุน
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="table-footer">
                                <td colSpan="2">รวมทั้งหมด</td>
                                <td>{grandCount} ครั้ง</td>
                                <td>{products.reduce((s, p) => s + p.totalWeight, 0).toFixed(1)}</td>
                                <td>{formatCurrency(grandCost)}</td>
                                <td>{formatCurrency(grandSelling)}</td>
                                <td>
                                    <span className={`badge ${grandProfit >= 0 ? 'badge-profit' : 'badge-loss'}`}>
                                        {grandProfit >= 0 ? '+' : ''}{formatCurrency(grandProfit)}
                                    </span>
                                </td>
                                <td style={{ color: grandCost > 0 ? (grandProfit >= 0 ? 'var(--profit-color)' : 'var(--loss-color)') : '' }}>
                                    {grandCost > 0 ? `${grandProfit >= 0 ? '+' : ''}${((grandProfit / grandCost) * 100).toFixed(1)}%` : '—'}
                                </td>
                                <td></td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    )
}

export default Products
