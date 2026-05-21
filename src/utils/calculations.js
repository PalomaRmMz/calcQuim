export function calculateQuantity(amount, price) {
    const numericAmount = Number(amount);
    const numericPrice = Number(price);

    if (!numericAmount || !numericPrice) {
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