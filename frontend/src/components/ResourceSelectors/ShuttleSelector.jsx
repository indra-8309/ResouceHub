import React from 'react';
import './ResourceSelectors.css';

const ShuttleSelector = ({ slots = [], bookedSlots = [], selectedSlot, onSelect }) => {
    // Generate rows (1A, 1B, 1C [aisle] 1D, 1E, 1F)
    const rows = [];
    for (let i = 1; i <= 5; i++) {
        const rowSlots = (slots || []).filter(s => s.slot_number.startsWith(i.toString()));
        rows.push({
            rowNum: i,
            left: rowSlots.filter(s => ['A', 'B'].includes(s.slot_number.slice(-1))),
            right: rowSlots.filter(s => ['C', 'D', 'E', 'F'].includes(s.slot_number.slice(-1)))
        });
    }

    const renderSeat = (slot) => {
        const isBooked = (bookedSlots || []).includes(slot.id);
        const isSelected = selectedSlot === slot.id;
        
        return (
            <div 
                key={slot.id}
                className={`shuttle-seat ${isBooked ? 'booked' : 'available'} ${isSelected ? 'selected' : ''}`}
                onClick={() => !isBooked && onSelect(slot.id)}
                title={isBooked ? "Reserved" : `Seat ${slot.slot_number}`}
            >
                {slot.slot_number}
            </div>
        );
    };

    return (
        <div className="selector-container">
            <h3 className="selector-title">Select Shuttle Seat</h3>
            <div className="shuttle-layout">
                <div className="shuttle-front">
                    <div className="driver-seat" title="Driver">
                        <span className="steering-wheel">⚙️</span>
                    </div>
                    <div style={{ color: 'white', opacity: 0.3, fontSize: '0.8rem' }}>ENTRANCE</div>
                </div>

                <div className="shuttle-rows">
                    {rows.map(row => (
                        <div key={row.rowNum} className="shuttle-row">
                            {row.left.map(renderSeat)}
                            <div className="shuttle-aisle-space"></div>
                            {row.right.map(renderSeat)}
                        </div>
                    ))}
                </div>

                <div className="selection-legend">
                    <div className="legend-item">
                        <div className="legend-dot" style={{ background: '#ecf0f1', border: '1px solid #bdc3c7' }}></div>
                        <span>Available</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-dot" style={{ background: '#3498db' }}></div>
                        <span>Selected</span>
                    </div>
                    <div className="legend-item">
                        <div className="legend-dot" style={{ background: '#e74c3c' }}></div>
                        <span>Reserved</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShuttleSelector;
