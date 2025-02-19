// 股票数据管理类
export class StockManager {
    constructor(symbols) {
        // 确保symbols始终是数组
        this.symbols = Array.isArray(symbols) ? symbols : [symbols];
    }

    async fetchStockData() {
        try {
            const data = await window.getStockData(this.symbols);
            if (!data) return {};
            // 处理多个股票的数据
            const result = {};
            for (const symbol of this.symbols) {
                if (data[symbol]) {
                    result[symbol] = {
                        price: parseFloat(data[symbol].price),
                        name: data[symbol].name,
                        close: parseFloat(data[symbol].close)
                    };
                }
            }

            return result;
        } catch (error) {
            console.error('获取行情数据失败:', error);
            return {};
        }
    }
}