import asyncHandler from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import * as billService from './bill.service.js';

export const createBill = asyncHandler(async (req, res) => {
    const bill = await billService.createBill(req.body, req.user._id);
    res.status(201).json(new ApiResponse(201, bill, 'Bill created successfully'));
});

export const getBills = asyncHandler(async (req, res) => {
    const result = await billService.getBills(req.query);
    res.status(200).json(
        new ApiResponse(200, result.bills, 'Bills fetched', {
            page: result.page, limit: result.limit, total: result.total,
        })
    );
});

export const getBillById = asyncHandler(async (req, res) => {
    const bill = await billService.getBillById(req.params.id);
    res.status(200).json(new ApiResponse(200, bill, 'Bill fetched'));
});

export const downloadBillPDF = asyncHandler(async (req, res) => {
    const pdfBuffer = await billService.generateBillPDF(req.params.id);
    res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${req.params.id}.pdf"`,
        'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
});

export const cancelBill = asyncHandler(async (req, res) => {
    const bill = await billService.cancelBill(req.params.id, req.user._id);
    res.status(200).json(new ApiResponse(200, bill, 'Bill cancelled'));
});
