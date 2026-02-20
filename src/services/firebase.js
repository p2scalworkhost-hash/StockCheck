// ============================================
// Mock Data Mode — ใช้ localStorage แทน Firebase
// เมื่อมี Firebase Config จริง ให้สลับกลับไปใช้ Firebase ได้
// ============================================

const USE_MOCK = true // เปลี่ยนเป็น false เมื่อใช้ Firebase จริง

// ─── Firebase Imports (ใช้เมื่อ USE_MOCK = false) ───
// import { initializeApp } from 'firebase/app'
// import {
//   getFirestore, collection, addDoc, getDocs, deleteDoc,
//   doc, query, where, orderBy, serverTimestamp
// } from 'firebase/firestore'
//
// const firebaseConfig = {
//   apiKey: "YOUR_API_KEY",
//   authDomain: "YOUR_PROJECT.firebaseapp.com",
//   projectId: "YOUR_PROJECT_ID",
//   storageBucket: "YOUR_PROJECT.firebasestorage.app",
//   messagingSenderId: "YOUR_SENDER_ID",
//   appId: "YOUR_APP_ID"
// }
//
// const app = initializeApp(firebaseConfig)
// const db = getFirestore(app)

// ─── Helper Functions ───

export function formatCurrency(amount) {
    return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount)
}

export function getTodayStr() {
    const now = new Date()
    return now.toISOString().split('T')[0]
}

export function getDateNDaysAgo(n) {
    const d = new Date()
    d.setDate(d.getDate() - n)
    return d.toISOString().split('T')[0]
}

export function formatThaiDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00')
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
}

// ─── Mock Data Layer (localStorage) ───

const STORAGE_KEY = 'stock_webapp_meat_sales'
const PURCHASE_STORAGE_KEY = 'stock_webapp_meat_purchases'

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function getAllSales() {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
}

function saveSales(sales) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sales))
}

function getAllPurchases() {
    const raw = localStorage.getItem(PURCHASE_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
}

function savePurchases(purchases) {
    localStorage.setItem(PURCHASE_STORAGE_KEY, JSON.stringify(purchases))
}

// สร้าง Mock Data ย้อนหลัง 10 วัน
function seedMockData() {
    if (localStorage.getItem(STORAGE_KEY)) return // มีข้อมูลแล้ว ไม่ต้องสร้างใหม่

    const customers = [
        'ร้านส้มตำป้าแก้ว', 'ร้านข้าวแกงลุงชาย', 'ตลาดสดบางแค', 'ร้านหมูกระทะเฮีย',
        'ร้านอาหารครัวคุณนาย', 'โรงแรมริเวอร์ไซด์', 'ร้านข้าวมันไก่แม่ทอง', 'ร้านก๋วยเตี๋ยวเจ๊หมวย',
        'ร้านบุฟเฟ่ต์ชาบู', 'ภัตตาคารมังกรทอง', 'ร้านสเต็กลุงจอห์น', 'ร้านอาหารบ้านสวน',
        'คุณวิชัย (ขายปลีก)'
    ]

    const products = [
        { name: 'เนื้อวัวสันใน', minW: 1, maxW: 10, minCost: 350, maxCost: 3500 },
        { name: 'เนื้อวัวสันนอก', minW: 2, maxW: 15, minCost: 500, maxCost: 4500 },
        { name: 'เนื้อวัวติดมัน', minW: 3, maxW: 20, minCost: 600, maxCost: 4000 },
        { name: 'ซี่โครงหมู', minW: 2, maxW: 12, minCost: 200, maxCost: 1800 },
        { name: 'สันคอหมู', minW: 1, maxW: 8, minCost: 150, maxCost: 1200 },
        { name: 'หมูสามชั้น', minW: 2, maxW: 15, minCost: 250, maxCost: 2250 },
        { name: 'อกไก่', minW: 1, maxW: 10, minCost: 80, maxCost: 900 },
        { name: 'น่องไก่', minW: 2, maxW: 12, minCost: 100, maxCost: 720 },
        { name: 'ปีกไก่', minW: 1, maxW: 8, minCost: 60, maxCost: 560 },
        { name: 'เนื้อแกะ', minW: 1, maxW: 5, minCost: 400, maxCost: 2500 },
        { name: 'กระดูกหมูอ่อน', minW: 3, maxW: 10, minCost: 200, maxCost: 800 },
        { name: 'เนื้อบด', minW: 1, maxW: 8, minCost: 120, maxCost: 1200 },
    ]

    const mockSales = []

    for (let dayOffset = 0; dayOffset < 10; dayOffset++) {
        const date = getDateNDaysAgo(dayOffset)
        // สุ่ม 3-8 รายการต่อวัน
        const numSales = Math.floor(Math.random() * 6) + 3

        for (let j = 0; j < numSales; j++) {
            const customer = customers[Math.floor(Math.random() * customers.length)]
            const product = products[Math.floor(Math.random() * products.length)]

            const weight = +(product.minW + Math.random() * (product.maxW - product.minW)).toFixed(1)
            const costPrice = Math.round(product.minCost + Math.random() * (product.maxCost - product.minCost))
            // กำไร 5-20% หรือขาดทุน -3% (บางครั้ง เนื้อเสีย/ลดราคา)
            const marginPercent = Math.random() < 0.12
                ? -(Math.random() * 0.03)
                : 0.05 + Math.random() * 0.15
            const sellingPrice = Math.round(costPrice * (1 + marginPercent))
            const profit = sellingPrice - costPrice

            mockSales.push({
                id: generateId(),
                customerName: customer,
                productName: product.name,
                weight,
                costPrice,
                sellingPrice,
                profit,
                saleDate: date,
                createdAt: new Date(date + 'T' + String(9 + j).padStart(2, '0') + ':00:00').toISOString()
            })
        }
    }

    saveSales(mockSales)
}

function seedMockPurchasesData() {
    if (localStorage.getItem(PURCHASE_STORAGE_KEY)) return // มีข้อมูลแล้ว ไม่ต้องสร้างใหม่

    const suppliers = [
        'ฟาร์มเฮียชัย', 'ซีพีเอฟ สาขา 1', 'ตลาดไท', 'เบทาโกร สาขาหลัก',
        'บริษัท สหฟาร์ม จำกัด', 'ฟาร์มหมูเจริญ'
    ]

    const products = [
        { name: 'เนื้อวัวสันใน', minW: 10, maxW: 50, cost: 350 },
        { name: 'เนื้อวัวสันนอก', minW: 15, maxW: 60, cost: 500 },
        { name: 'เนื้อวัวติดมัน', minW: 20, maxW: 80, cost: 600 },
        { name: 'ซี่โครงหมู', minW: 10, maxW: 40, cost: 200 },
        { name: 'สันคอหมู', minW: 15, maxW: 50, cost: 150 },
        { name: 'หมูสามชั้น', minW: 20, maxW: 60, cost: 250 },
        { name: 'อกไก่', minW: 20, maxW: 100, cost: 80 },
        { name: 'น่องไก่', minW: 15, maxW: 80, cost: 100 },
    ]

    const mockPurchases = []

    for (let dayOffset = 0; dayOffset < 10; dayOffset++) {
        const date = getDateNDaysAgo(dayOffset)
        // สุ่ม 1-4 รายการต่อวัน (การซื้อเข้าน้อยกว่าการขายออก)
        const numPurchases = Math.floor(Math.random() * 4) + 1

        for (let j = 0; j < numPurchases; j++) {
            const supplier = suppliers[Math.floor(Math.random() * suppliers.length)]
            const product = products[Math.floor(Math.random() * products.length)]

            const weight = +(product.minW + Math.random() * (product.maxW - product.minW)).toFixed(1)
            const costPrice = Math.round(weight * product.cost)

            mockPurchases.push({
                id: generateId(),
                supplierName: supplier,
                productName: product.name,
                weight,
                costPrice, // ทุนรวม
                receiveDate: date,
                createdAt: new Date(date + 'T' + String(8 + j).padStart(2, '0') + ':00:00').toISOString()
            })
        }
    }

    savePurchases(mockPurchases)
}

// เรียก seed ทันทีเมื่อโหลดไฟล์
seedMockData()
seedMockPurchasesData()

// ─── CRUD Functions (Mock) ───

export async function addSale(saleData) {
    // จำลอง network delay
    await new Promise(r => setTimeout(r, 300))

    const sales = getAllSales()
    const newSale = {
        ...saleData,
        id: generateId(),
        createdAt: new Date().toISOString()
    }
    sales.unshift(newSale)
    saveSales(sales)
    return newSale
}

export async function getSalesByDate(dateStr) {
    await new Promise(r => setTimeout(r, 200))
    const sales = getAllSales()
    return sales
        .filter(s => s.saleDate === dateStr)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export async function getSalesByDateRange(startDate, endDate) {
    await new Promise(r => setTimeout(r, 300))
    const sales = getAllSales()
    return sales
        .filter(s => s.saleDate >= startDate && s.saleDate <= endDate)
        .sort((a, b) => b.saleDate.localeCompare(a.saleDate))
}

export async function deleteSale(saleId) {
    await new Promise(r => setTimeout(r, 200))
    const sales = getAllSales()
    const filtered = sales.filter(s => s.id !== saleId)
    saveSales(filtered)
    return true
}

// ─── Purchase CRUD Functions (Mock) ───

export async function addPurchase(purchaseData) {
    await new Promise(r => setTimeout(r, 300))
    const purchases = getAllPurchases()
    const newPurchase = {
        ...purchaseData,
        id: generateId(),
        createdAt: new Date().toISOString()
    }
    purchases.unshift(newPurchase)
    savePurchases(purchases)
    return newPurchase
}

export async function getPurchasesByDate(dateStr) {
    await new Promise(r => setTimeout(r, 200))
    const purchases = getAllPurchases()
    return purchases
        .filter(p => p.receiveDate === dateStr)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export async function getPurchasesByDateRange(startDate, endDate) {
    await new Promise(r => setTimeout(r, 300))
    const purchases = getAllPurchases()
    return purchases
        .filter(p => p.receiveDate >= startDate && p.receiveDate <= endDate)
        .sort((a, b) => b.receiveDate.localeCompare(a.receiveDate))
}

export async function deletePurchase(purchaseId) {
    await new Promise(r => setTimeout(r, 200))
    const purchases = getAllPurchases()
    const filtered = purchases.filter(p => p.id !== purchaseId)
    savePurchases(filtered)
    return true
}
