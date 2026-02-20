import { useState, useEffect, useCallback } from 'react'
import { FiEdit3, FiPlus, FiTrash2, FiCheck, FiDownload } from 'react-icons/fi'
import DateInput from '../components/DateInput'
import {
    addPurchase,
    getPurchasesByDate,
    deletePurchase,
    formatCurrency,
    getTodayStr,
    formatThaiDate
} from '../services/firebase'

const initialForm = {
    supplierName: '',
    productName: '',
    weight: '',
    costPrice: '',
}

function PurchaseEntry() {
    const [selectedDate, setSelectedDate] = useState(getTodayStr())
    const [form, setForm] = useState(initialForm)
    const [purchases, setPurchases] = useState([])
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [toast, setToast] = useState(null)

    // โหลดข้อมูลรับเข้าตามวันที่เลือก
    const loadPurchases = useCallback(async () => {
        setLoading(true)
        try {
            const data = await getPurchasesByDate(selectedDate)
            setPurchases(data)
        } catch (err) {
            showToast('โหลดข้อมูลไม่สำเร็จ', true)
        } finally {
            setLoading(false)
        }
    }, [selectedDate])

    useEffect(() => {
        loadPurchases()
    }, [loadPurchases])

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!form.supplierName || !form.productName || !form.weight || !form.costPrice) {
            showToast('กรุณากรอกข้อมูลให้ครบทุกช่อง', true)
            return
        }

        setSubmitting(true)
        try {
            const purchaseData = {
                supplierName: form.supplierName.trim(),
                productName: form.productName.trim(),
                weight: Number(form.weight),
                costPrice: Number(form.costPrice), // ทุนรวม
                receiveDate: selectedDate
            }

            await addPurchase(purchaseData)
            setForm(initialForm)
            showToast('บันทึกรายการรับเข้าสำเร็จ! ✅')
            loadPurchases()
        } catch (err) {
            showToast('บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง', true)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (purchaseId) => {
        if (!window.confirm('ต้องการลบรายการนี้ใช่หรือไม่?')) return
        try {
            await deletePurchase(purchaseId)
            showToast('ลบรายการสำเร็จ')
            loadPurchases()
        } catch (err) {
            showToast('ลบไม่สำเร็จ', true)
        }
    }

    const showToast = (msg, isError = false) => {
        setToast({ msg, isError })
        setTimeout(() => setToast(null), 3000)
    }

    // คำนวณยอดรวม
    const totalCost = purchases.reduce((sum, p) => sum + (p.costPrice || 0), 0)
    const totalWeight = purchases.reduce((sum, p) => sum + (p.weight || 0), 0)

    return (
        <div>
            {/* Header */}
            <div className="page-header animate-in">
                <h1 className="page-title" style={{ color: 'var(--blue)' }}>
                    <FiDownload /> บันทึกรับเข้าสินค้า
                </h1>
                <p className="page-subtitle">บันทึกข้อมูลสินค้าที่รับเข้าคลัง สามารถเลือกวันย้อนหลังได้</p>
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
                <div className="form-title" style={{ color: 'var(--blue)' }}>
                    <FiPlus /> เพิ่มรายการรับเข้า (ซื้อ)
                </div>
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">ชื่อซัพพลายเออร์/ผู้ขาย</label>
                        <input
                            className="form-input"
                            type="text"
                            name="supplierName"
                            placeholder="เช่น ฟาร์มเฮียชัย"
                            value={form.supplierName}
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
                        <label className="form-label">ราคาทุนรวม (บาท)</label>
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
                </div>
                <div className="form-actions">
                    <button type="submit" className="btn btn-primary" style={{ background: 'var(--blue)' }} disabled={submitting}>
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

            {/* Purchases Table */}
            <div className="animate-in">
                <div className="card-title" style={{ marginBottom: '1rem', fontSize: '1rem' }}>
                    📋 รายการรับเข้าวันที่ {formatThaiDate(selectedDate)} ({purchases.length} รายการ)
                </div>

                {loading ? (
                    <div className="loading">
                        <div className="spinner"></div>
                        <span>กำลังโหลดข้อมูล...</span>
                    </div>
                ) : purchases.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📦</div>
                        <p className="empty-state-text">ยังไม่มีรายการรับเข้าในวันนี้</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>ชื่อซัพพลายเออร์</th>
                                    <th>ชื่อสินค้า</th>
                                    <th>น.น. (กก.)</th>
                                    <th>ราคาทุนรวม</th>
                                    <th>ทุนเฉลี่ย/กก.</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchases.map((purchase, idx) => (
                                    <tr key={purchase.id}>
                                        <td>{idx + 1}</td>
                                        <td>{purchase.supplierName}</td>
                                        <td>{purchase.productName}</td>
                                        <td>{purchase.weight} กก.</td>
                                        <td style={{ color: 'var(--loss-color)' }}>{formatCurrency(purchase.costPrice)}</td>
                                        <td style={{ color: 'var(--text-muted)' }}>
                                            {purchase.weight > 0 ? formatCurrency(purchase.costPrice / purchase.weight) : '—'}
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleDelete(purchase.id)}
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="table-footer">
                                    <td colSpan="3" style={{ textAlign: 'right' }}>รวมทั้งหมด:</td>
                                    <td>{totalWeight.toFixed(1)} กก.</td>
                                    <td style={{ color: 'var(--loss-color)' }}>{formatCurrency(totalCost)}</td>
                                    <td></td>
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

export default PurchaseEntry
