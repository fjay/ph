import { Position } from './Position.js';

// 持仓数据管理类
export class PositionManager {
    static STORAGE_KEY = 'ph_positions';

    static load() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        const positions = data ? JSON.parse(data) : [];
        return positions.map(p => new Position(p.code, p.quantity, p.cost, p.targetRatio));
    }

    static save(positions) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(positions));
    }

    static validateTargetRatio(positions, newRatio, excludeCode = null) {
        const totalRatio = positions.reduce((sum, p) => {
            return sum + (p.code === excludeCode ? 0 : p.targetRatio);
        }, 0) + newRatio;

        return totalRatio <= 100;
    }

    /**
     * 计算建议的交易数量
     * @param {Position[]} positions - 所有持仓数组
     * @param {Position} position - 当前需要计算的持仓
     * @param {number} currentPrice - 当前价格
     * @param {Object} stockDataMap - 所有股票的最新价格数据
     * @returns {string} 建议的交易数量，格式为 "+ 数量" 或 "- 数量"
     */
    static calculateSuggestion(positions, position, currentPrice, stockDataMap) {
        // 计算当前总市值
        const currentTotalValue = positions.reduce((sum, pos) => {
            const price = pos === position ? currentPrice : (stockDataMap[pos.code]?.price || pos.cost);
            return sum + pos.calculateValue(parseFloat(price));
        }, 0);

        // 根据目标仓位比例计算目标市值
        const targetValue = currentTotalValue * (position.targetRatio / 100);

        // 计算当前持仓的实际市值
        const currentValue = position.calculateValue(currentPrice);

        // 计算市值差额
        const valueDiff = targetValue - currentValue;

        // 如果差额太小（小于一股的价值），不给出建议
        if (Math.abs(valueDiff) < currentPrice) {
            return '';
        }

        // 计算建议数量（向下取整，确保不会超过目标比例）
        const suggestedQuantity = Math.floor(valueDiff / currentPrice);
        const suggestedAmount = Math.abs(suggestedQuantity * currentPrice).toFixed(0);

        const suggestedAmountDiv =  `<div class="ph-cell-secondary">${suggestedAmount}</div>`;
        return suggestedQuantity > 0 ? 
            `+ ${suggestedQuantity} ${suggestedAmountDiv}` : 
            `- ${Math.abs(suggestedQuantity)} ${suggestedAmountDiv}`;
    }
}