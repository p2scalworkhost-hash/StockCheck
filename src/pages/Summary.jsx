import React, { useState } from 'react'
import { FiBarChart2, FiSearch, FiTrendingUp, FiTrendingDown, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import DateInput from '../components/DateInput'
import {
    getSalesByDateRange,
    getPurchasesByDateRange,
    formatCurrency,
    getTodayStr,
    getDateNDaysAgo,
    formatThaiDate
} from '../services/firebase'

function Summary() {
    const [summaryType, setSummaryType] = useState('sales') // 'sales' or 'purchases'
    const [startDate, setStartDate] = useState(getDateNDaysAgo(9))
    const [endDate, setEndDate] = useState(getTodayStr())
    const [summaryData, setSummaryData] = useState([])
    const [loading, setLoading] = useState(false)
    const [loaded, setLoaded] = useState(false)
    const [expandedDate, setExpandedDate] = useState(null)

    // คำนวณจำนวนวันที่เลือก
    const dayCount = Math.round(
        (new Date(endDate + 'T00:00:00') - new Date(startDate + 'T00:00:00')) / (1000 * 60 * 60 * 24)
    ) + 1

    const loadSummary = async () => {
        if (startDate > endDate) {
            alert('วันเริ่มต้นต้องไม่เกินวันสิ้นสุด')
            return
        }

        setLoading(true)
        try {
            let records = []
            if (summaryType === 'sales') {
                records = await getSalesByDateRange(startDate, endDate)
            } else {
                records = await getPurchasesByDateRange(startDate, endDate)
            }

            // สร้างวันทั้งหมดในช่วง
            const grouped = {}
            const start = new Date(startDate + 'T00:00:00')
            const end = new Date(endDate + 'T00:00:00')
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const key = d.toISOString().split('T')[0]
                grouped[key] = { date: key, records: [], totalCost: 0, totalSelling: 0, totalProfit: 0, totalWeight: 0 }
            }

            records.forEach(record => {
                const dateKey = summaryType === 'sales' ? record.saleDate : record.receiveDate
                if (grouped[dateKey]) {
                    grouped[dateKey].records.push(record)
                    grouped[dateKey].totalCost += record.costPrice || 0
                    grouped[dateKey].totalSelling += record.sellingPrice || 0
                    grouped[dateKey].totalProfit += record.profit || 0
                    grouped[dateKey].totalWeight += record.weight || 0
                }
            })

            // เรียงจากวันล่าสุด → เก่าสุด
            const sorted = Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date))
            setSummaryData(sorted)
            setLoaded(true)
        } catch (err) {
            console.error('Error loading summary:', err)
        } finally {
            setLoading(false)
        }
    }

    // Effect to reload when summaryType changes (if already loaded)
    React.useEffect(() => {
        if (loaded) {
            loadSummary()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [summaryType])

    // Quick select shortcuts
    const setQuickRange = (days) => {
        setStartDate(getDateNDaysAgo(days - 1))
        setEndDate(getTodayStr())
    }

    const grandTotalCost = summaryData.reduce((sum, d) => sum + d.totalCost, 0)
    const grandTotalSelling = summaryData.reduce((sum, d) => sum + d.totalSelling, 0)
    const grandTotalProfit = summaryData.reduce((sum, d) => sum + d.totalProfit, 0)
    const grandTotalWeight = summaryData.reduce((sum, d) => sum + d.totalWeight, 0)
    const totalItems = summaryData.reduce((sum, d) => sum + d.records.length, 0)
    const daysWithRecords = summaryData.filter(d => d.records.length > 0).length

    return (
        <div>
            {/* Header */}
            <div className="page-header animate-in">
                <h1 className="page-title">
                    <FiBarChart2 /> สรุปย้อนหลัง ({summaryType === 'sales' ? 'ขายออก' : 'รับเข้า'})
                </h1>
                <p className="page-subtitle">เลือกช่วงวันที่และประเภทข้อมูล เพื่อดูภาพรวม</p>
            </div>

            {/* View Toggle */}
            <div className="view-toggle animate-in" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <button
                    className={`btn ${summaryType === 'sales' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSummaryType('sales')}
                    disabled={loading}
                >
                    <FiTrendingUp /> สรุปการขายออก
                </button>
                <button
                    className={`btn ${summaryType === 'purchases' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setSummaryType('purchases')}
                    style={summaryType === 'purchases' ? { background: 'var(--blue)' } : {}}
                    disabled={loading}
                >
                    <span style={{ transform: 'rotate(180deg)', display: 'inline-block' }}><FiTrendingUp /></span> สรุปการรับเข้า
                </button>
            </div>

            {/* Date Range Picker */}
            <div className="form-card animate-in">
                <div className="form-title">
                    📅 เลือกช่วงวันที่
                </div>

                {/* Quick select buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    {[
                        { label: '7 วัน', days: 7 },
                        { label: '10 วัน', days: 10 },
                        { label: '14 วัน', days: 14 },
                        { label: '30 วัน', days: 30 },
                        { label: '90 วัน', days: 90 },
                    ].map(q => (
                        <button
                            key={q.days}
                            className="btn btn-secondary btn-sm"
                            onClick={() => setQuickRange(q.days)}
                        >
                            {q.label}
                        </button>
                    ))}
                </div>

                <div className="form-grid" style={{ gridTemplateColumns: '1fr auto 1fr auto', alignItems: 'end' }}>
                    <div className="form-group">
                        <label className="form-label">วันเริ่มต้น</label>
                        <DateInput
                            value={startDate}
                            onChange={setStartDate}
                            max={endDate}
                        />
                    </div>
                    <span style={{ color: 'var(--text-muted)', padding: '10px 4px', fontSize: '1.2rem' }}>→</span>
                    <div className="form-group">
                        <label className="form-label">วันสิ้นสุด</label>
                        <DateInput
                            value={endDate}
                            onChange={setEndDate}
                            max={getTodayStr()}
                            min={startDate}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={loadSummary} disabled={loading}>
                        {loading ? (
                            <>
                                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> โหลด...
                            </>
                        ) : (
                            <>
                                <FiSearch /> ดูสรุป
                            </>
                        )}
                    </button>
                </div>
                <div style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    ช่วงที่เลือก: {formatThaiDate(startDate)} — {formatThaiDate(endDate)} ({dayCount} วัน)
                </div>
            </div>

            {/* Table */}
            {loaded && (
                <>
                    {/* Summary stat cards */}
                    <div className="stat-cards" style={{ marginBottom: '1.5rem' }}>
                        <div className="stat-card animate-in">
                            <div className="stat-card-label">จำนวนวันที่มีรายการ</div>
                            <div className="stat-card-value">{daysWithRecords}/{dayCount} วัน</div>
                        </div>
                        <div className="stat-card animate-in">
                            <div className="stat-card-label">รายการทั้งหมด</div>
                            <div className="stat-card-value">{totalItems} รายการ</div>
                        </div>

                        {summaryType === 'sales' ? (
                            <>
                                <div className="stat-card animate-in">
                                    <div className="stat-card-label">ยอดขายรวม</div>
                                    <div className="stat-card-value">{formatCurrency(grandTotalSelling)}</div>
                                </div>
                                <div className="stat-card animate-in">
                                    <div className="stat-card-label">กำไร/ขาดทุนรวม</div>
                                    <div className={`stat-card-value ${grandTotalProfit >= 0 ? 'profit' : 'loss'}`}>
                                        {grandTotalProfit >= 0 ? '+' : ''}{formatCurrency(grandTotalProfit)}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="stat-card animate-in">
                                    <div className="stat-card-label">ปริมาณรวมรับเข้า</div>
                                    <div className="stat-card-value">{grandTotalWeight.toFixed(1)} กก.</div>
                                </div>
                                <div className="stat-card animate-in">
                                    <div className="stat-card-label">ยอดทุนซื้อรวม</div>
                                    <div className="stat-card-value" style={{ color: 'var(--loss-color)' }}>
                                        {formatCurrency(grandTotalCost)}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="table-container animate-in">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th></th>
                                    <th>วันที่</th>
                                    <th>จำนวนรายการ</th>
                                    <th>ยอดรวม (น.น.)</th>
                                    <th>{summaryType === 'sales' ? 'ยอดทุนรวม' : 'ยอดทุนรวมรับเข้า'}</th>

                                    {summaryType === 'sales' && (
                                        <>
                                            <th>ยอดขายรวม</th>
                                            <th>กำไร/ขาดทุน</th>
                                            <th>สถานะ</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {summaryData.map(day => (
                                    <React.Fragment key={day.date}>
                                        <tr
                                            onClick={() => day.records.length > 0 && setExpandedDate(expandedDate === day.date ? null : day.date)}
                                            style={{ cursor: day.records.length > 0 ? 'pointer' : 'default' }}
                                        >
                                            <td style={{ width: 30, textAlign: 'center' }}>
                                                {day.records.length > 0 && (
                                                    expandedDate === day.date
                                                        ? <FiChevronUp style={{ color: 'var(--accent)' }} />
                                                        : <FiChevronDown style={{ color: 'var(--text-muted)' }} />
                                                )}
                                            </td>
                                            <td>{formatThaiDate(day.date)}</td>
                                            <td>{day.records.length} รายการ</td>
                                            <td>{day.totalWeight > 0 ? `${day.totalWeight.toFixed(1)} กก.` : '—'}</td>
                                            <td>{day.totalCost > 0 ? formatCurrency(day.totalCost) : '—'}</td>

                                            {summaryType === 'sales' && (
                                                <>
                                                    <td>{day.totalSelling > 0 ? formatCurrency(day.totalSelling) : '—'}</td>
                                                    <td>
                                                        {day.records.length > 0 ? (
                                                            <span className={`badge ${day.totalProfit >= 0 ? 'badge-profit' : 'badge-loss'}`}>
                                                                {day.totalProfit >= 0 ? '+' : ''}{formatCurrency(day.totalProfit)}
                                                            </span>
                                                        ) : '—'}
                                                    </td>
                                                    <td>
                                                        {day.records.length > 0 ? (
                                                            day.totalProfit >= 0 ? (
                                                                <span style={{ color: 'var(--profit-color)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                    <FiTrendingUp /> กำไร
                                                                </span>
                                                            ) : (
                                                                <span style={{ color: 'var(--loss-color)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                    <FiTrendingDown /> ขาดทุน
                                                                </span>
                                                            )
                                                        ) : (
                                                            <span style={{ color: 'var(--text-muted)' }}>ไม่มีรายการ</span>
                                                        )}
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                        {/* Detail rows */}
                                        {expandedDate === day.date && day.records.length > 0 && (
                                            <tr>
                                                <td colSpan={summaryType === 'sales' ? "8" : "5"} style={{ padding: 0, background: 'rgba(52, 211, 153, 0.03)' }}>
                                                    <div style={{ padding: '0.75rem 1rem 0.75rem 2.5rem' }}>
                                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)', marginBottom: '0.5rem' }}>
                                                            📋 รายละเอียดวันที่ {formatThaiDate(day.date)}
                                                        </div>
                                                        <table className="table" style={{ fontSize: '0.82rem' }}>
                                                            <thead>
                                                                <tr>
                                                                    <th>#</th>
                                                                    <th>{summaryType === 'sales' ? 'ชื่อลูกค้า' : 'ชื่อซัพพลายเออร์'}</th>
                                                                    <th>ชื่อสินค้า</th>
                                                                    <th>น.น. (กก.)</th>
                                                                    <th>{summaryType === 'sales' ? 'ราคาทุน' : 'ราคาทุนรวม'}</th>

                                                                    {summaryType === 'sales' && (
                                                                        <>
                                                                            <th>ราคาขาย</th>
                                                                            <th>กำไร</th>
                                                                        </>
                                                                    )}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {day.records.map((record, idx) => (
                                                                    <tr key={record.id || idx}>
                                                                        <td>{idx + 1}</td>
                                                                        <td>{summaryType === 'sales' ? record.customerName : record.supplierName}</td>
                                                                        <td>{record.productName}</td>
                                                                        <td>{record.weight}</td>
                                                                        <td style={summaryType === 'purchases' ? { color: 'var(--loss-color)' } : {}}>{formatCurrency(record.costPrice)}</td>

                                                                        {summaryType === 'sales' && (
                                                                            <>
                                                                                <td>{formatCurrency(record.sellingPrice)}</td>
                                                                                <td>
                                                                                    <span className={`badge ${record.profit >= 0 ? 'badge-profit' : 'badge-loss'}`}>
                                                                                        {record.profit >= 0 ? '+' : ''}{formatCurrency(record.profit)}
                                                                                    </span>
                                                                                </td>
                                                                            </>
                                                                        )}
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="table-footer">
                                    <td></td>
                                    <td>รวมทั้งหมด</td>
                                    <td>{totalItems} รายการ</td>
                                    <td>{grandTotalWeight.toFixed(1)} กก.</td>
                                    <td style={summaryType === 'purchases' ? { color: 'var(--loss-color)' } : {}}>{formatCurrency(grandTotalCost)}</td>

                                    {summaryType === 'sales' && (
                                        <>
                                            <td>{formatCurrency(grandTotalSelling)}</td>
                                            <td>
                                                <span className={`badge ${grandTotalProfit >= 0 ? 'badge-profit' : 'badge-loss'}`}>
                                                    {grandTotalProfit >= 0 ? '+' : ''}{formatCurrency(grandTotalProfit)}
                                                </span>
                                            </td>
                                            <td></td>
                                        </>
                                    )}
                                </tr>
                            </tfoot>
                        </table>
                    </div>


                </>
            )}

            {!loaded && !loading && (
                <div className="empty-state animate-in">
                    <div className="empty-state-icon">📊</div>
                    <p className="empty-state-text">เลือกช่วงวันที่แล้วกดปุ่ม "ดูสรุป" เพื่อดูข้อมูล</p>
                </div>
            )}
        </div>
    )
}

export default Summary
