import { useRef } from 'react'
import { FiCalendar } from 'react-icons/fi'

/**
 * Custom Date Input ที่แสดง dd/mm/yyyy เสมอ
 * prop: value = YYYY-MM-DD string, onChange = (YYYY-MM-DD) => void
 */
function DateInput({ value, onChange, max, min, style }) {
    const hiddenRef = useRef(null)

    // แปลง YYYY-MM-DD → dd/mm/yyyy สำหรับแสดง
    const displayValue = value
        ? (() => {
            const [y, m, d] = value.split('-')
            return `${d}/${m}/${y}`
        })()
        : ''

    const handleClick = () => {
        if (hiddenRef.current) {
            try {
                hiddenRef.current.showPicker()
            } catch {
                hiddenRef.current.focus()
                hiddenRef.current.click()
            }
        }
    }

    const handleChange = (e) => {
        if (e.target.value) {
            onChange(e.target.value)
        }
    }

    return (
        <div
            className="date-input-wrapper"
            style={{ position: 'relative', display: 'inline-block', ...style }}
            onClick={handleClick}
        >
            {/* ช่องแสดงผล dd/mm/yyyy */}
            <div
                className="form-input"
                style={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    userSelect: 'none',
                    minWidth: '150px',
                    pointerEvents: 'none'
                }}
            >
                <span>{displayValue || 'เลือกวันที่'}</span>
                <FiCalendar style={{ opacity: 0.5, flexShrink: 0 }} />
            </div>

            {/* Native date input — ซ้อนทับเพื่อรับ click */}
            <input
                ref={hiddenRef}
                type="date"
                value={value}
                onChange={handleChange}
                max={max}
                min={min}
                tabIndex={-1}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer',
                    zIndex: 2
                }}
            />
        </div>
    )
}

export default DateInput
