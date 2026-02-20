import { useState, useEffect } from 'react'
import { FiHome, FiDollarSign, FiTrendingUp, FiShoppingBag, FiUsers, FiPackage } from 'react-icons/fi'
import {
    getSalesByDate,
    getSalesByDateRange,
    formatCurrency,
    getTodayStr,
    getDateNDaysAgo,
    formatThaiDate
} from '../services/firebase'
import {
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Area, AreaChart
} from 'recharts'

function Dashboard() {
    const [todaySales, setTodaySales] = useState([])
    const [rangeSales, setRangeSales] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const today = getTodayStr()
            const startDate = getDateNDaysAgo(9)

            const [todayData, rangeData] = await Promise.all([
                getSalesByDate(today),
                getSalesByDateRange(startDate, today)
            ])

            setTodaySales(todayData)
            setRangeSales(rangeData)
        } catch (err) {
            console.error('Dashboard load error:', err)
        } finally {
            setLoading(false)
        }
    }

    // === คำนวณตัวเลข ===
    const todayTotalSelling = todaySales.reduce((s, x) => s + (x.sellingPrice || 0), 0)
    const todayTotalProfit = todaySales.reduce((s, x) => s + (x.profit || 0), 0)
    const rangeTotalSelling = rangeSales.reduce((s, x) => s + (x.sellingPrice || 0), 0)
    const rangeTotalProfit = rangeSales.reduce((s, x) => s + (x.profit || 0), 0)

    // === กราฟข้อมูล ===
    const chartData = (() => {
        const grouped = {}
        for (let i = 9; i >= 0; i--) {
            const d = getDateNDaysAgo(i)
            grouped[d] = { date: d, label: '', profit: 0, revenue: 0 }
        }

        rangeSales.forEach(sale => {
            if (grouped[sale.saleDate]) {
                grouped[sale.saleDate].profit += sale.profit || 0
                grouped[sale.saleDate].revenue += sale.sellingPrice || 0
            }
        })

        return Object.values(grouped).map(item => {
            const d = new Date(item.date + 'T00:00:00')
            item.label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
            return item
        })
    })()

    // === Top 5 สินค้า ===
    const topProducts = (() => {
        const map = {}
        rangeSales.forEach(s => {
            if (!map[s.productName]) map[s.productName] = { name: s.productName, count: 0, revenue: 0 }
            map[s.productName].count++
            map[s.productName].revenue += s.sellingPrice || 0
        })
        return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5)
    })()

    // === Top 5 ลูกค้า ===
    const topCustomers = (() => {
        const map = {}
        rangeSales.forEach(s => {
            if (!map[s.customerName]) map[s.customerName] = { name: s.customerName, count: 0, totalSpent: 0 }
            map[s.customerName].count++
            map[s.customerName].totalSpent += s.sellingPrice || 0
        })
        return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5)
    })()

    // Custom tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    background: 'rgba(17, 24, 39, 0.95)',
                    border: '1px solid rgba(52, 211, 153, 0.2)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    fontSize: '0.82rem',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                }}>
                    <p style={{ color: '#94a3b8', marginBottom: 4, fontWeight: 600 }}>{label}</p>
                    {payload.map((item, i) => (
                        <p key={i} style={{ color: item.color, fontWeight: 700 }}>
                            {item.name === 'profit' ? 'กำไร' : 'ยอดขาย'}: {formatCurrency(item.value)}
                        </p>
                    ))}
                </div>
            )
        }
        return null
    }

    if (loading) {
        return (
            <div className="loading" style={{ minHeight: '60vh' }}>
                <div className="spinner"></div>
                <span>กำลังโหลด Dashboard...</span>
            </div>
        )
    }

    return (
        <div>
            {/* Header */}
            <div className="page-header animate-in">
                <h1 className="page-title">
                    <FiHome /> Dashboard
                </h1>
                <p className="page-subtitle">ภาพรวมยอดขายและกำไร/ขาดทุน • วันที่ {formatThaiDate(getTodayStr())}</p>
            </div>

            {/* Stat Cards */}
            <div className="stat-cards">
                <div className="stat-card animate-in">
                    <div className="stat-card-icon"><FiDollarSign /></div>
                    <div className="stat-card-label">ยอดขายวันนี้</div>
                    <div className="stat-card-value">{formatCurrency(todayTotalSelling)}</div>
                    <div className="stat-card-change" style={{ color: 'var(--text-muted)' }}>
                        {todaySales.length} รายการ
                    </div>
                </div>
                <div className="stat-card animate-in">
                    <div className="stat-card-icon"><FiTrendingUp /></div>
                    <div className="stat-card-label">กำไรวันนี้</div>
                    <div className={`stat-card-value ${todayTotalProfit >= 0 ? 'profit' : 'loss'}`}>
                        {todayTotalProfit >= 0 ? '+' : ''}{formatCurrency(todayTotalProfit)}
                    </div>
                </div>
                <div className="stat-card animate-in">
                    <div className="stat-card-icon"><FiShoppingBag /></div>
                    <div className="stat-card-label">ยอดขายรวม 10 วัน</div>
                    <div className="stat-card-value">{formatCurrency(rangeTotalSelling)}</div>
                    <div className="stat-card-change" style={{ color: 'var(--text-muted)' }}>
                        {rangeSales.length} รายการ
                    </div>
                </div>
                <div className="stat-card animate-in">
                    <div className="stat-card-icon"><FiTrendingUp /></div>
                    <div className="stat-card-label">กำไรรวม 10 วัน</div>
                    <div className={`stat-card-value ${rangeTotalProfit >= 0 ? 'profit' : 'loss'}`}>
                        {rangeTotalProfit >= 0 ? '+' : ''}{formatCurrency(rangeTotalProfit)}
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="chart-container animate-in">
                <div className="chart-title">📈 แนวโน้มกำไร/ยอดขาย 10 วัน</div>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#34d399" stopOpacity={0.25} />
                                <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.15} />
                                <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
                        <XAxis
                            dataKey="label"
                            stroke="#64748b"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#64748b"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#60a5fa"
                            fill="url(#revenueGrad)"
                            strokeWidth={2}
                            name="revenue"
                            dot={false}
                        />
                        <Area
                            type="monotone"
                            dataKey="profit"
                            stroke="#34d399"
                            fill="url(#profitGrad)"
                            strokeWidth={2.5}
                            name="profit"
                            dot={{ fill: '#34d399', r: 3, strokeWidth: 0 }}
                            activeDot={{ r: 5, fill: '#34d399', stroke: '#0a0e17', strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Top Lists */}
            <div className="info-grid">
                <div className="list-card animate-in">
                    <div className="list-card-title"><FiPackage /> สินค้าขายดี Top 5</div>
                    {topProducts.length > 0 ? (
                        topProducts.map((p, i) => (
                            <div className="list-item" key={p.name}>
                                <div className={`list-item-rank ${i === 0 ? 'top' : ''}`}>{i + 1}</div>
                                <div className="list-item-name">{p.name}</div>
                                <div className="list-item-value">
                                    {p.count} ครั้ง
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state" style={{ padding: '1.5rem' }}>
                            <p className="empty-state-text">ยังไม่มีข้อมูล</p>
                        </div>
                    )}
                </div>

                <div className="list-card animate-in">
                    <div className="list-card-title"><FiUsers /> ลูกค้าบ่อยที่สุด Top 5</div>
                    {topCustomers.length > 0 ? (
                        topCustomers.map((c, i) => (
                            <div className="list-item" key={c.name}>
                                <div className={`list-item-rank ${i === 0 ? 'top' : ''}`}>{i + 1}</div>
                                <div className="list-item-name">{c.name}</div>
                                <div className="list-item-value">
                                    {c.count} ครั้ง
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state" style={{ padding: '1.5rem' }}>
                            <p className="empty-state-text">ยังไม่มีข้อมูล</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Dashboard
