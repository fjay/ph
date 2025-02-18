// 持仓数据模型类
export class Position {
    constructor(code, quantity, cost, targetRatio) {
        this.code = code;
        this.quantity = quantity;
        this.cost = cost;
        this.targetRatio = targetRatio;
    }

    calculateValue(price) {
        return this.quantity * price;
    }

    calculateProfit(currentPrice) {
        const cost = this.calculateValue(this.cost);
        const current = this.calculateValue(currentPrice);
        const profit = current - cost;
        const profitRatio = (profit / cost) * 100;
        return { profit, profitRatio };
    }
}