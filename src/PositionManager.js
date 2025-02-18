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

    static calculateSuggestion(positions, position, currentPrice) {
        const totalValue = positions.reduce((sum, pos) => {
            const price = pos === position ? currentPrice : pos.cost;
            return sum + pos.calculateValue(price);
        }, 0);

        const targetValue = totalValue * (position.targetRatio / 100);
        const currentValue = position.calculateValue(currentPrice);
        const diff = targetValue - currentValue;
        const diffQuantity = Math.abs(Math.round(diff / currentPrice));

        if (Math.abs(diff) < currentPrice) {
            return '';
        }

        return diff > 0 ? `+ ${diffQuantity}` : `- ${diffQuantity}`;
    }
}