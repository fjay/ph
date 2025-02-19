import { UIManager } from './UIManager.js';

/**
 * 表格渲染器类
 * 负责处理表格的渲染和更新逻辑
 */
export class TableRenderer {
    /**
     * 创建表格单元格
     * @param {string} html - 单元格的HTML内容
     * @returns {HTMLTableCellElement} 创建的表格单元格元素
     */
    static createCell(html) {
        const td = document.createElement('td');
        td.innerHTML = html;
        return td;
    }

    /**
     * 创建新的表格行
     * @param {Position} position - 持仓对象
     * @param {number} currentPrice - 当前价格
     * @param {string} stockName - 股票名称
     * @param {number} profit - 盈亏金额
     * @param {number} profitRatio - 盈亏比例
     * @param {string} suggestion - 建议操作
     * @param {number} close - 收盘价
     * @returns {HTMLTableRowElement} 创建的表格行元素
     */
    static #renderCellContent(position, currentPrice, stockName, profit, profitRatio, suggestion, close, positionsData = null) {
        const priceChange = UIManager.formatPriceChange(currentPrice, close);
        const priceChangeClass = currentPrice >= close ? 'ph-profit-positive' : 'ph-profit-negative';
        const marketValue = UIManager.formatNumber(position.calculateValue(currentPrice), 0);
        const actualRatio = positionsData ? UIManager.calculateActualRatio(position, currentPrice, positionsData) : null;

        return {
            firstCell: `<div>${stockName}</div><div class="ph-cell-secondary">${position.quantity} | ${UIManager.formatNumber(position.cost, 0)}</div>`,
            priceCell: `<div class="price-value">${UIManager.formatNumber(currentPrice, 3)}</div><div class="price-change ${priceChangeClass}">${priceChange}</div>`,
            marketCell: actualRatio
                ? `<div class="market-value">${marketValue}</div><div class="ph-cell-secondary">${UIManager.formatNumber(actualRatio, 1)}%</div>`
                : `<div class="market-value">${marketValue}</div>`,
            profitCell: `<div>${UIManager.formatNumber(profitRatio, 2)}%</div><div class="ph-cell-secondary">${UIManager.formatNumber(profit, 0)}</div>`,
            profitClass: profit >= 0 ? 'ph-profit-positive' : 'ph-profit-negative',
            suggestionCell: suggestion,
            actionCell: `<button class="ph-btn-edit" data-code="${position.code}">编辑</button><button class="ph-btn-delete" data-code="${position.code}">删除</button>`
        };
    }

    static createNewRow(position, currentPrice, stockName, profit, profitRatio, suggestion, close) {
        const tr = document.createElement('tr');
        tr.setAttribute('data-code', position.code);

        const cellContent = this.#renderCellContent(position, currentPrice, stockName, profit, profitRatio, suggestion, close);
        const cells = [
            this.createCell(cellContent.firstCell),
            this.createCell(cellContent.priceCell),
            this.createCell(cellContent.marketCell),
            this.createCell(cellContent.profitCell),
            this.createCell(cellContent.suggestionCell),
            this.createCell(cellContent.actionCell)
        ];

        cells.forEach(cell => tr.appendChild(cell));
        tr.querySelector('td:nth-child(4)').className = cellContent.profitClass;

        return tr;
    }

    /**
     * 更新现有的表格行
     * @param {HTMLTableRowElement} tr - 表格行元素
     * @param {Position} position - 持仓对象
     * @param {string} stockName - 股票名称
     * @param {number} currentPrice - 当前价格
     * @param {number} profit - 盈亏金额
     * @param {number} profitRatio - 盈亏比例
     * @param {string} suggestion - 建议操作
     * @param {number} close - 收盘价
     * @param {Array} positionsData - 所有持仓数据
     */
    static updateExistingRow(tr, position, stockName, currentPrice, profit, profitRatio, suggestion, close, positionsData) {
        const priceValueDiv = tr.querySelector('.price-value');
        if (!priceValueDiv) return;

        const cellContent = this.#renderCellContent(position, currentPrice, stockName, profit, profitRatio, suggestion, close, positionsData);

        tr.querySelector('td:nth-child(1)').innerHTML = cellContent.firstCell;
        priceValueDiv.parentElement.innerHTML = cellContent.priceCell;
        tr.querySelector('.market-value').parentElement.innerHTML = cellContent.marketCell;

        const profitCell = tr.querySelector('td:nth-child(4)');
        profitCell.className = cellContent.profitClass;
        profitCell.innerHTML = cellContent.profitCell;

        tr.querySelector('td:nth-child(5)').innerHTML = cellContent.suggestionCell;
    }

    /**
     * 移除已删除的持仓行
     * @param {HTMLTableSectionElement} tbody - 表格体元素
     * @param {Array} positionsData - 持仓数据数组
     */
    static removeDeletedRows(tbody, positionsData) {
        const existingRows = tbody.querySelectorAll('tr');
        existingRows.forEach(row => {
            const code = row.getAttribute('data-code');
            if (!positionsData.some(data => data.position.code === code)) {
                row.remove();
            }
        });
    }

    /**
     * 更新持仓表格
     * @param {HTMLTableSectionElement} tbody - 表格体元素
     * @param {Array} positionsData - 持仓数据数组
     */
    static updateTable(tbody, positionsData) {
        positionsData.forEach(data => {
            const { position, currentPrice, stockName, profit, profitRatio, suggestion, close } = data;
            let tr = tbody.querySelector(`tr[data-code="${position.code}"]`);
            const isNewRow = !tr;

            if (isNewRow) {
                tr = this.createNewRow(position, currentPrice, stockName, profit, profitRatio, suggestion, close);
                tbody.appendChild(tr);
            } else {
                this.updateExistingRow(tr, position, stockName, currentPrice, profit, profitRatio, suggestion, close, positionsData);
            }
        });

        this.removeDeletedRows(tbody, positionsData);
    }
}