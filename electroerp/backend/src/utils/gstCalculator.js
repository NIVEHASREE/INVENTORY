/**
 * GST Calculator Utility
 * Handles CGST/SGST (intrastate) and IGST (interstate) calculations
 */

export const calculateGST = (taxableAmount, gstRate, isInterstate = false) => {
    const totalGST = parseFloat(((taxableAmount * gstRate) / 100).toFixed(2));
    if (isInterstate) {
        return { cgst: 0, sgst: 0, igst: totalGST, totalGST };
    }
    const halfGST = parseFloat((totalGST / 2).toFixed(2));
    return { cgst: halfGST, sgst: halfGST, igst: 0, totalGST };
};

export const calculateBillTotals = (items, isInterstate = false) => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTaxable = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    let totalGST = 0;
    let totalProfit = 0;

    const processedItems = items.map((item) => {
        const grossAmount = item.sellingPrice * item.quantity;
        const discountAmount = parseFloat(((grossAmount * (item.discount || 0)) / 100).toFixed(2));
        const taxableAmount = parseFloat((grossAmount - discountAmount).toFixed(2));
        const gst = calculateGST(taxableAmount, item.gstRate, isInterstate);
        const totalAmount = parseFloat((taxableAmount + gst.totalGST).toFixed(2));
        const profitAmount = parseFloat(((item.sellingPrice - item.costPrice) * item.quantity).toFixed(2));

        subtotal += grossAmount;
        totalDiscount += discountAmount;
        totalTaxable += taxableAmount;
        totalCGST += gst.cgst;
        totalSGST += gst.sgst;
        totalIGST += gst.igst;
        totalGST += gst.totalGST;
        totalProfit += profitAmount;

        return {
            ...item,
            taxableAmount,
            cgst: gst.cgst,
            sgst: gst.sgst,
            igst: gst.igst,
            gstAmount: gst.totalGST,
            totalAmount,
            profitAmount,
        };
    });

    const grandTotal = parseFloat((totalTaxable + totalGST).toFixed(2));
    const roundOff = parseFloat((Math.round(grandTotal) - grandTotal).toFixed(2));

    return {
        processedItems,
        subtotal: parseFloat(subtotal.toFixed(2)),
        totalDiscount: parseFloat(totalDiscount.toFixed(2)),
        totalTaxable: parseFloat(totalTaxable.toFixed(2)),
        cgst: parseFloat(totalCGST.toFixed(2)),
        sgst: parseFloat(totalSGST.toFixed(2)),
        igst: parseFloat(totalIGST.toFixed(2)),
        totalGST: parseFloat(totalGST.toFixed(2)),
        grandTotal,
        roundOff,
        finalTotal: Math.round(grandTotal),
        profitAmount: parseFloat(totalProfit.toFixed(2)),
    };
};
