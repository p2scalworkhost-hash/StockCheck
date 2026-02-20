import { useState, useEffect, useCallback } from 'react'
import { FiEdit3, FiPlus, FiTrash2, FiCheck } from 'react-icons/fi'
import DateInput from '../components/DateInput'
import {
    addSale,
    getSalesByDate,
    deleteSale,
    formatCurrency,
    getTodayStr,
    formatThaiDate
} from '../services/firebase'

const initialForm = {
    customerName: '',
    productName: '',
    weight: '',
    costPrice: '',
    sellingPrice: ''
}

function SalesEntry() {
    const [selectedDate, setSelectedDate] = useState(getTodayStr())
    const [form, setForm] = useState(initialForm)
    const [sales, setSales] = useState([])
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [toast, setToast] = useState(null)

    const profit = (Number(form.sellingPrice) || 0) - (Number(form.costPrice) || 0)
    const isLoss = profit < 0

    // โหลดข้อมูลขายตามวันที่เลือก
    const loadSales = useCallback(async () => {
        setLoading(true)
        try {
            const data = await getSalesByDate(selectedDate)
            setSales(data)
        } catch (err) {
            showToast('โหลดข้อมูลไม่สำเร็จ', true)
        } finally {
            setLoading(false)
        }
    }, [selectedDate])

    useEffect(() => {
        loadSales()
    }, [loadSales])

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!form.customerName || !form.productName || !form.weight || !form.costPrice || !form.sellingPrice) {
            showToast('กรุณากรอกข้อมูลให้ครบทุกช่อง', true)
            return
        }

        setSubmitting(true)
        try {
            const saleData = {
                customerName: form.customerName.trim(),
                productName: form.productName.trim(),
                weight: Number(form.weight),
                costPrice: Number(form.costPrice),
                sellingPrice: Number(form.sellingPrice),
                profit: Number(form.sellingPrice) - Number(form.costPrice),
                saleDate: selectedDate
            }

            await addSale(saleData)
            setForm(initialForm)
            showToast('บันทึกรายการขายสำเร็จ! ✅')
            loadSales()
        } catch (err) {
            showToast('บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง', true)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (saleId) => {
        if (!window.confirm('ต้องการลบรายการนี้ใช่หรือไม่?')) return
        try {
            await deleteSale(saleId)
            showToast('ลบรายการสำเร็จ')
            loadSales()
        } catch (err) {
            showToast('ลบไม่สำเร็จ', true)
        }
    }

    const showToast = (msg, isError = false) => {
        setToast({ msg, isError })
        setTimeout(() => setToast(null), 3000)
    }

    // คำนวณยอดรวม
    const totalCost = sales.reduce((sum, s) => sum + (s.costPrice || 0), 0)
    const totalSelling = sales.reduce((sum, s) => sum + (s.sellingPrice || 0), 0)
    const totalProfit = sales.reduce((sum, s) => sum + (s.profit || 0), 0)

    return (
        <div>
            {/* Header */}
            <div className="page-header animate-in">
                <h1 className="page-title">
                    <FiEdit3 /> บันทึกการขาย
                </h1>
                <p className="page-subtitle">กรอกข้อมูลการขายสินค้า สามารถเลือกวันย้อนหลังได้</p>
            </div>

            {/* Date Picker */}
            <div className="date-bar animate-in">
                <span className="date-bar-label">📅 เลือกวันที่:</span>
                <DateInput
                    value={selectedDate}
                    onChange={setSelectedDate}
                    max={getTodayStr()}
                />
            </div>

            {/* Form */}
            <form className="form-card animate-in" onSubmit={handleSubmit}>
                <div className="form-title">
                    <FiPlus /> เพิ่มรายการขาย
                </div>
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">ชื่อลูกค้า</label>
                        <input
                            className="form-input"
                            type="text"
                            name="customerName"
                            placeholder="เช่น ร้านส้มตำป้าแก้ว"
                            value={form.customerName}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">ชื่อสินค้า</label>
                        <input
                            className="form-input"
                            type="text"
                            name="productName"
                            placeholder="เช่น เนื้อวัวสันใน"
                            value={form.productName}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">น้ำหนัก (กก.)</label>
                        <input
                            className="form-input"
                            type="number"
                            name="weight"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            value={form.weight}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">ราคาทุน (บาท)</label>
                        <input
                            className="form-input"
                            type="number"
                            name="costPrice"
                            placeholder="0"
                            min="0"
                            value={form.costPrice}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">ราคาขาย (บาท)</label>
                        <input
                            className="form-input"
                            type="number"
                            name="sellingPrice"
                            placeholder="0"
                            min="0"
                            value={form.sellingPrice}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">กำไร (บาท)</label>
                        <input
                            className={`form-input form-profit ${isLoss ? 'loss' : ''}`}
                            type="text"
                            readOnly
                            value={form.costPrice || form.sellingPrice ? formatCurrency(profit) : '—'}
                        />
                    </div>
                </div>
                <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? (
                            <>
                                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> กำลังบันทึก...
                            </>
                        ) : (
                            <>
                                <FiCheck /> บันทึก
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setForm(initialForm)}
                    >
                        ล้างฟอร์ม
                    </button>
                </div>
            </form>

            {/* Sales Table */}
            <div className="animate-in">
                <div className="card-title" style={{ marginBottom: '1rem', fontSize: '1rem' }}>
                    📋 รายการขายวันที่ {formatThaiDate(selectedDate)} ({sales.length} รายการ)
                </div>

                {loading ? (
                    <div className="loading">
                        <div className="spinner"></div>
                        <span>กำลังโหลดข้อมูล...</span>
                    </div>
                ) : sales.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📦</div>
                        <p className="empty-state-text">ยังไม่มีรายการขายในวันนี้</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>ชื่อลูกค้า</th>
                                    <th>ชื่อสินค้า</th>
                                    <th>น.น. (กก.)</th>
                                    <th>ราคาทุน</th>
                                    <th>ราคาขาย</th>
                                    <th>กำไร</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.map((sale, idx) => (
                                    <tr key={sale.id}>
                                        <td>{idx + 1}</td>
                                        <td>{sale.customerName}</td>
                                        <td>{sale.productName}</td>
                                        <td>{sale.weight}</td>
                                        <td>{formatCurrency(sale.costPrice)}</td>
                                        <td>{formatCurrency(sale.sellingPrice)}</td>
                                        <td>
                                            <span className={`badge ${sale.profit >= 0 ? 'badge-profit' : 'badge-loss'}`}>
                                                {sale.profit >= 0 ? '+' : ''}{formatCurrency(sale.profit)}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleDelete(sale.id)}
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="table-footer">
                                    <td colSpan="4" style={{ textAlign: 'right' }}>รวมทั้งหมด:</td>
                                    <td>{formatCurrency(totalCost)}</td>
                                    <td>{formatCurrency(totalSelling)}</td>
                                    <td>
                                        <span className={`badge ${totalProfit >= 0 ? 'badge-profit' : 'badge-loss'}`}>
                                            {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
                                        </span>
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>

            {/* Toast */}
            {toast && (
                <div className={`toast ${toast.isError ? 'toast-error' : ''}`}>
                    {toast.isError ? '❌' : '✅'} {toast.msg}
                </div>
            )}
        </div>
    )
}

export default SalesEntry
