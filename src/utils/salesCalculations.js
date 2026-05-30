export function calculateSaleByAmount(amount, price) {
    const numericAmount = Number(amount || 0);
    const numericPrice = Number(price || 0);

    if (numericAmount <= 0 || numericPrice <= 0) {
        return {
            quantity: 0,
            milliliters: 0,
        };
    }
    const quantity = numericAmount / numericPrice;
    return {
        quantity,
        milliliters: quantity * 1000,
    };
}

export function calculateSaleByLiters(liters, price) {
    const numericLiters = Number(liters || 0);
    const numericPrice = Number(price || 0);

    if (numericLiters <= 0 || numericPrice <= 0) {
        return 0;
    }
    return numericLiters * numericPrice;
}

export function calculateTotalSales(list) {
    return list.reduce((acc, item) => {
        if (item.type === "venta_por_monto") {
            return acc + Number(item.amount || 0);
        }
        return acc + Number(item.total || 0);
    }, 0);
}

export function formatLiquid(milliliters) {
    const numericMilliliters = Number(milliliters || 0);

    return numericMilliliters >= 1000
        ? `${(numericMilliliters / 1000).toFixed(2)} litros`
        : `${numericMilliliters.toFixed(0)} ml`;
}