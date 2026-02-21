import 'dotenv/config';
import mongoose from 'mongoose';
import Role from './models/Role.model.js';
import User from './models/User.model.js';
import Category from './models/Category.model.js';
import Product from './models/Product.model.js';
import Supplier from './models/Supplier.model.js';
import Purchase from './models/Purchase.model.js';
import Bill from './models/Bill.model.js';
import SupplierLedger from './models/SupplierLedger.model.js';
import GSTLedger from './models/GSTLedger.model.js';
import ActivityLog from './models/ActivityLog.model.js';
import logger from './config/logger.js';

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        logger.info('🚀 DISPATCHING PROTOCOL: MEGA SEED INITIALIZED');

        // Clear existing data (Fresh start)
        await Promise.all([
            Role.deleteMany({}),
            User.deleteMany({}),
            Category.deleteMany({}),
            Product.deleteMany({}),
            Supplier.deleteMany({}),
            Purchase.deleteMany({}),
            Bill.deleteMany({}),
            SupplierLedger.deleteMany({}),
            GSTLedger.deleteMany({}),
            ActivityLog.deleteMany({})
        ]);

        // 1. ROLES
        const roles = [
            {
                name: 'ADMIN',
                description: 'Full access to all modules',
                permissions: ['products', 'categories', 'suppliers', 'purchases', 'bills', 'gst', 'reports', 'users', 'notifications', 'audit-logs'].map(r => ({ resource: r, actions: ['create', 'read', 'update', 'delete', 'export'] }))
            },
            {
                name: 'MANAGER',
                description: 'Operational lead',
                permissions: [
                    { resource: 'products', actions: ['create', 'read', 'update'] },
                    { resource: 'categories', actions: ['create', 'read', 'update'] },
                    { resource: 'suppliers', actions: ['create', 'read', 'update'] },
                    { resource: 'purchases', actions: ['create', 'read'] },
                    { resource: 'bills', actions: ['create', 'read', 'update'] },
                    { resource: 'reports', actions: ['read', 'export'] }
                ]
            }
        ];
        const createdRoles = await Role.insertMany(roles);
        const adminRole = createdRoles.find(r => r.name === 'ADMIN');
        logger.info('✅ Roles Authenticated');

        // 2. USERS
        const admin = await User.create({
            name: 'Vanguard Alpha',
            email: 'admin@electroerp.com',
            password: 'Admin@123',
            role: adminRole._id,
            phone: '+91-9999999999'
        });
        logger.info('✅ Authority Alpha Established');

        // 3. CATEGORIES
        const categories = await Category.insertMany([
            { name: 'Power Transmission' },
            { name: 'Circuit Protection' },
            { name: 'Industrial Controls' },
            { name: 'Lighting Arrays' },
            { name: 'Modular Switches' },
            { name: 'Renewable Energy' }
        ]);
        logger.info('✅ Taxonomy Classified');

        // 4. SUPPLIERS
        const suppliers = await Supplier.insertMany([
            { name: 'Apex Electrics Corp', phone: '9810010001', email: 'orders@apex.com', gstin: '07AAAAA0000A1Z5', currentBalance: 45000 },
            { name: 'Zenith Wire Systems', phone: '9820020002', email: 'sales@zenith.in', gstin: '27BBBBB1111B1Z2', currentBalance: 125000 },
            { name: 'Shield Gear Tech', phone: '9830030003', email: 'contact@shieldgear.com', gstin: '09CCCCC2222C1Z8', currentBalance: 0 }
        ]);
        logger.info('✅ Vector Partners Integrated');

        // 5. PRODUCTS
        const productsData = [
            { name: 'HyperCore 2.5mm Wire (Roll)', sku: 'HC-WIR-25', category: categories[0]._id, brand: 'Zenith', costPrice: 850, sellingPrice: 1250, stockQty: 120, gstRate: 18, minStockQty: 20 },
            { name: 'Armor-Shield MCB 32A TP', sku: 'AS-MCB-32-TP', category: categories[1]._id, brand: 'Shield Gear', costPrice: 420, sellingPrice: 680, stockQty: 45, gstRate: 12, minStockQty: 10 },
            { name: 'Photon LED Panel 15W', sku: 'PH-LED-15W', category: categories[3]._id, brand: 'Apex', costPrice: 180, sellingPrice: 350, stockQty: 250, gstRate: 12, minStockQty: 50 },
            { name: 'Modular Switch 6A (Standard)', sku: 'SW-6A-STD', category: categories[4]._id, brand: 'Apex', costPrice: 45, sellingPrice: 85, stockQty: 800, gstRate: 18, minStockQty: 100 },
            { name: 'Solar Grid Inverter 5KW', sku: 'SL-INV-5K', category: categories[5]._id, brand: 'Zenith', costPrice: 45000, sellingPrice: 62000, stockQty: 8, gstRate: 5, minStockQty: 2 }
        ];
        const products = await Product.insertMany(productsData);
        logger.info('✅ Asset Matrix Populated');

        // 6. HISTORICAL DATA (Last 30 days)
        const now = new Date();

        // PURCHASE LOGS
        for (let i = 0; i < 5; i++) {
            const date = new Date();
            date.setDate(now.getDate() - (i * 4));
            const supplier = suppliers[i % 3];
            const p = products[i % 5];

            const qty = 50 + (i * 10);
            const subtotal = qty * p.costPrice;
            const tax = subtotal * (p.gstRate / 100);

            await Purchase.create({
                purchaseNumber: `PO-REF-${1000 + i}`,
                purchaseDate: date,
                supplier: supplier._id,
                items: [{
                    product: p._id,
                    productName: p.name,
                    sku: p.sku,
                    quantity: qty,
                    purchasePrice: p.costPrice,
                    gstRate: p.gstRate,
                    taxableAmount: subtotal,
                    cgst: tax / 2,
                    sgst: tax / 2,
                    totalAmount: subtotal + tax
                }],
                subtotal,
                totalTaxable: subtotal,
                totalGST: tax,
                cgst: tax / 2,
                sgst: tax / 2,
                grandTotal: subtotal + tax,
                paymentStatus: 'credit',
                amountDue: subtotal + tax,
                createdBy: admin._id
            });

            await GSTLedger.create({
                date,
                type: 'INPUT',
                referenceNo: `PO-REF-${1000 + i}`,
                month: date.getMonth() + 1,
                year: date.getFullYear(),
                taxableAmount: subtotal,
                cgst: tax / 2,
                sgst: tax / 2,
                totalGST: tax,
                party: { name: supplier.name, gstin: supplier.gstin }
            });

            await SupplierLedger.create({
                supplier: supplier._id,
                date,
                type: 'purchase',
                referenceNo: `PO-REF-${1000 + i}`,
                narration: `Acquisition of ${p.name}`,
                debit: 0,
                credit: subtotal + tax,
                balance: supplier.currentBalance + (subtotal + tax)
            });
        }
        logger.info('✅ Acquisition Pulse Recorded');

        // BILLING LOGS (SALES)
        const customers = [
            { name: 'Skyline Construction', phone: '9000000001' },
            { name: 'Walk-in Customer', phone: '9000000002' },
            { name: 'Industrial Zone A', phone: '9000000003' }
        ];

        for (let i = 0; i < 15; i++) {
            const date = new Date();
            date.setDate(now.getDate() - i * 2);
            date.setHours(10 + (i % 8), 0, 0);

            const p1 = products[i % 5];
            const p2 = products[(i + 1) % 5];
            const qty1 = 5;
            const qty2 = 2;

            const taxable1 = qty1 * p1.sellingPrice;
            const taxable2 = qty2 * p2.sellingPrice;
            const tax1 = taxable1 * (p1.gstRate / 100);
            const tax2 = taxable2 * (p2.gstRate / 100);

            const totalTaxable = taxable1 + taxable2;
            const totalGST = tax1 + tax2;
            const grandTotal = totalTaxable + totalGST;

            const bill = await Bill.create({
                billNumber: `TXN-${202400 + i}`,
                billDate: date,
                customer: customers[i % 3],
                items: [
                    {
                        product: p1._id,
                        productName: p1.name,
                        sku: p1.sku,
                        quantity: qty1,
                        costPrice: p1.costPrice,
                        sellingPrice: p1.sellingPrice,
                        gstRate: p1.gstRate,
                        taxableAmount: taxable1,
                        cgst: tax1 / 2,
                        sgst: tax1 / 2,
                        totalAmount: taxable1 + tax1,
                        profitAmount: taxable1 - (qty1 * p1.costPrice)
                    },
                    {
                        product: p2._id,
                        productName: p2.name,
                        sku: p2.sku,
                        quantity: qty2,
                        costPrice: p2.costPrice,
                        sellingPrice: p2.sellingPrice,
                        gstRate: p2.gstRate,
                        taxableAmount: taxable2,
                        cgst: tax2 / 2,
                        sgst: tax2 / 2,
                        totalAmount: taxable2 + tax2,
                        profitAmount: taxable2 - (qty2 * p2.costPrice)
                    }
                ],
                subtotal: totalTaxable,
                totalTaxable,
                totalGST,
                cgst: totalGST / 2,
                sgst: totalGST / 2,
                grandTotal,
                paymentMode: i % 2 === 0 ? 'upi' : 'cash',
                paymentStatus: 'paid',
                amountPaid: grandTotal,
                profitAmount: totalTaxable - ((qty1 * p1.costPrice) + (qty2 * p2.costPrice)),
                createdBy: admin._id
            });

            // GST LEDGER
            await GSTLedger.create({
                date,
                type: 'OUTPUT',
                referenceNo: bill.billNumber,
                month: date.getMonth() + 1,
                year: date.getFullYear(),
                party: { name: bill.customer.name, gstin: bill.customer.gstin },
                taxableAmount: totalTaxable,
                cgst: totalGST / 2,
                sgst: totalGST / 2,
                totalGST: totalGST
            });

            // ACTIVITY LOG
            await ActivityLog.create({
                user: admin._id,
                action: 'CREATE_BILL',
                resource: 'BILL',
                details: { billNumber: bill.billNumber, amount: grandTotal },
                ipAddress: '127.0.0.1'
            });
        }
        logger.info('✅ Revenue Channels Synchronized');

        logger.info('🏁 PROTOCOL COMPLETE: VANGUARD SYSTEM IS NOW FULLY OPERATIONAL');
        process.exit(0);
    } catch (err) {
        logger.error('❌ SEED FAILURE:', err);
        process.exit(1);
    }
};

seedDB();
