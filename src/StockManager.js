// 股票数据管理类
export class StockManager {
    constructor(symbol) {
        this.symbol = symbol;
    }

    async fetchStockData() {
        try {
            const data = await window.getStockData(this.symbol);
            return {
                price: parseFloat(data.price),
                name: data.name
            };
        } catch (error) {
            console.error('获取行情数据失败:', error);
            return null;
        }
    }
}