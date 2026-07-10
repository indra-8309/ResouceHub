import React from 'react';
import './ResourceSelectors.css';

const ParkingSelector = ({ slots = [], bookedSlots = [], selectedSlot, onSelect }) => {
    // Group slots into two rows for a realistic layout (Row 1: P1-P10, Row 2: P11-P20)
    const upperRow = (slots || []).slice(0, 10);
    const lowerRow = (slots || []).slice(10, 20);

    const renderSlot = (slot) => {
        const isBooked = (bookedSlots || []).includes(slot.id);
        const isSelected = selectedSlot === slot.id;
        
        return (
            <div 
                key={slot.id}
                className={`parking-slot ${isBooked ? 'booked' : 'available'} ${isSelected ? 'selected' : ''}`}
                onClick={() => !isBooked && onSelect(slot.id)}
            >
                <span className="parking-slot-label">{slot.slot_number}</span>
                {isBooked && <span className="status-label">OCCUPIED</span>}
            </div>
        );
    };

    return (
        <div className="selector-container">
            <h3 className="selector-title">Select Parking Slot</h3>
            <div className="parking-layout">
                <div className="parking-row">
                    {upperRow.map(renderSlot)}
                </div>
                
                <div className="parking-aisle">
                    {/* Aisle space for driving */}
                </div>
                
                <div className="parking-row">
                    {lowerRow.map(renderSlot)}
                </div>
            </div>

            <div className="selection-legend">
                <div className="legend-item">
                    <div className="legend-dot" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid #444' }}></div>
                    <span>Available</span>
                </div>
                <div className="legend-item">
                    <div className="legend-dot" style={{ background: '#4caf50' }}></div>
                    <span>Selected</span>
                </div>
                <div className="legend-item">
                    <div className="legend-dot" style={{ background: 'rgba(244, 67, 54, 0.4)', border: '1px solid #f44336' }}></div>
                    <span>Occupied</span>
                </div>
            </div>
        </div>
    );
};

export default ParkingSelector;
