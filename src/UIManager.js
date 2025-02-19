import { Position } from './Position.js';
import { StockManager } from './StockManager.js';
import { PositionManager } from './PositionManager.js';
import { TableRenderer } from './TableRenderer.js';
import { ModalManager } from './ModalManager.js';

/**
 * UI管理类
 * 负责处理所有UI相关的操作，包括模态框的显示/隐藏、表格的渲染和更新等
 */
export class UIManager {
    /**
     * 格式化数字，保留3位小数
     * @param {number} number - 需要格式化的数字
     * @returns {string} 格式化后的字符串
     */
    static formatNumber(number, decimals = 3) {
        return Number(number).toFixed(decimals);
    }

    /**
     * 计算并格式化价格变化百分比
     * @param {number} currentPrice - 当前价格
     * @param {number} closePrice - 收盘价格
     * @returns {string} 格式化后的价格变化百分比，包含+/-符号
     */
    static formatPriceChange(currentPrice, closePrice) {
        const change = ((currentPrice - closePrice) / closePrice) * 100;
        return `${change >= 0 ? '+' : ''}${this.formatNumber(change, 2)}%`;
    }

    /**
     * 显示添加持仓的模态框
     */
    static showAddModal() {
        ModalManager.showAddModal();
    }

    /**
     * 隐藏添加持仓的模态框并重置表单
     */
    static hideAddModal() {
        ModalManager.hideAddModal();
    }

    /**
     * 显示编辑持仓的模态框并填充数据
     * @param {Position} position - 需要编辑的持仓对象
     */
    static showEditModal(position) {
        ModalManager.showEditModal(position);
    }

    /**
     * 隐藏编辑持仓的模态框并重置表单
     */
    static hideEditModal() {
        ModalManager.hideEditModal();
    }

    /**
     * 计算持仓的实际仓位比例
     * @param {Position} position - 持仓对象
     * @param {number} currentPrice - 当前价格
     * @param {Array} positionsData - 所有持仓数据
     * @returns {number} 实际仓位比例
     */
    static calculateActualRatio(position, currentPrice, positionsData) {
        const totalValue = positionsData.reduce((sum, data) => sum + data.position.calculateValue(data.currentPrice), 0);
        return (position.calculateValue(currentPrice) / totalValue) * 100;
    }

    /**
     * 渲染持仓列表
     * 获取所有持仓数据，并异步获取每个持仓的股票实时数据
     */
    static async renderPositions() {
        const positions = PositionManager.load();
        const tbody = document.getElementById('ph-positions-body');

        // 批量获取所有股票数据
        const stockCodes = positions.map(position => position.code);
        const stockManager = new StockManager(stockCodes);
        const stockDataMap = await stockManager.fetchStockData() || {};

        const positionsData = positions.map(position => {
            const stockData = stockDataMap[position.code] || { price: position.cost, name: position.code, close: position.cost };
            const currentPrice = parseFloat(stockData.price);
            const stockName = stockData.name.substring(0, 3);
            const { profit, profitRatio } = position.calculateProfit(currentPrice);
            const suggestion = PositionManager.calculateSuggestion(positions, position, currentPrice);
            return { position, currentPrice, stockName, profit, profitRatio, suggestion, close: parseFloat(stockData.close) };
        });

        TableRenderer.updateTable(tbody, positionsData);
    }
}