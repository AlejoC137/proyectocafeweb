/**
 * Calculate the current or last complete fortnight (quincena) date range
 * 
 * Fortnights are defined as:
 * - First fortnight: Days 1-15 of the month
 * - Second fortnight: Days 16-last day of the month
 * 
 * Logic:
 * - If today is 1-15: return 1-15 of current month
 * - If today is 16-31: return 16-last day of current month
 * - Special case: If today is Jan 1, return Dec 16-31 (last complete fortnight)
 * 
 * @param {Date} [date=new Date()] - The reference date (defaults to today)
 * @returns {{ startDate: string, endDate: string }} - Date range in YYYY-MM-DD format
 */
export function getCurrentFortnightRange(date = new Date()) {
    const today = new Date(date);
    const dayOfMonth = today.getDate();
    const currentMonth = today.getMonth(); // 0-indexed
    const currentYear = today.getFullYear();

    let startDate, endDate;

    // Special case: January 1st should show last fortnight of previous year (Dec 16-31)
    if (currentMonth === 0 && dayOfMonth === 1) {
        // December of previous year
        const prevYear = currentYear - 1;
        const lastDayOfDec = 31;

        startDate = new Date(prevYear, 11, 16); // December is month 11
        endDate = new Date(prevYear, 11, lastDayOfDec);
    }
    // First fortnight (days 1-15)
    else if (dayOfMonth <= 15) {
        startDate = new Date(currentYear, currentMonth, 1);
        endDate = new Date(currentYear, currentMonth, 15);
    }
    // Second fortnight (days 16-end of month)
    else {
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        startDate = new Date(currentYear, currentMonth, 16);
        endDate = new Date(currentYear, currentMonth, lastDayOfMonth);
    }

    // Format as YYYY-MM-DD
    const formatDate = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    return {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate)
    };
}
