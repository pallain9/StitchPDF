const DPI = 72;
function inToPt(inches) { return inches * DPI; }
function mmToPt(mm) { return mm * 2.83465; }
module.exports = { inToPt, mmToPt };