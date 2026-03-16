import { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
    const [items, setItems] = useState([]);

    const addItem = useCallback((product, qty = 1) => {
        setItems(prev => {
            const existing = prev.find(i => i.product === product._id);
            if (existing) {
                return prev.map(i =>
                    i.product === product._id
                        ? { ...i, quantity: i.quantity + qty }
                        : i
                );
            }
            return [...prev, {
                product: product._id,
                productName: product.name,
                sku: product.sku,
                sellingPrice: product.sellingPrice,
                costPrice: product.costPrice,
                mrp: product.mrp,
                gstRate: product.gstRate,
                hsnCode: product.hsnCode,
                unit: product.unit,
                quantity: qty,
                discount: 0,
                stockQty: product.stockQty,
            }];
        });
    }, []);

    const batchAddItems = useCallback((newItemsArr) => {
        setItems(prev => {
            const newCart = [...prev];
            newItemsArr.forEach(({ product, qty }) => {
                const existingIndex = newCart.findIndex(i => i.product === product._id);
                if (existingIndex >= 0) {
                    newCart[existingIndex] = { ...newCart[existingIndex], quantity: newCart[existingIndex].quantity + qty };
                } else {
                    newCart.push({
                        product: product._id,
                        productName: product.name,
                        sku: product.sku,
                        sellingPrice: product.sellingPrice,
                        costPrice: product.costPrice,
                        mrp: product.mrp,
                        gstRate: product.gstRate,
                        hsnCode: product.hsnCode,
                        unit: product.unit,
                        quantity: qty,
                        discount: 0,
                        stockQty: product.stockQty,
                    });
                }
            });
            return newCart;
        });
    }, []);

    const updateItem = useCallback((productId, updates) => {
        setItems(prev => prev.map(i => i.product === productId ? { ...i, ...updates } : i));
    }, []);

    const removeItem = useCallback((productId) => {
        setItems(prev => prev.filter(i => i.product !== productId));
    }, []);

    const clearCart = useCallback(() => setItems([]), []);

    return (
        <CartContext.Provider value={{ items, addItem, batchAddItems, updateItem, removeItem, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
