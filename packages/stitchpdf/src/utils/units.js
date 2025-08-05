// PDF Unit Conversion Utilities
// Standard PDF uses points (72 points = 1 inch)

const POINTS_PER_INCH = 72;
const POINTS_PER_MM = 2.83465;

/**
 * Convert points to inches
 * @param {number} points 
 * @returns {number} inches
 */
export function pointsToInches(points) {
    return points / POINTS_PER_INCH;
}

/**
 * Convert points to millimeters
 * @param {number} points 
 * @returns {number} millimeters
 */
export function pointsToMm(points) {
    return points / POINTS_PER_MM;
}

/**
 * Convert inches to points
 * @param {number} inches 
 * @returns {number} points
 */
export function inchesToPoints(inches) {
    return inches * POINTS_PER_INCH;
}

/**
 * Convert millimeters to points
 * @param {number} mm 
 * @returns {number} points
 */
export function mmToPoints(mm) {
    return mm * POINTS_PER_MM;
}

// Legacy exports for backward compatibility
export const inToPt = inchesToPoints;
export const mmToPt = mmToPoints;