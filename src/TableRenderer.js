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
    static createNewRow(position, currentPrice, stockName, profit, profitRatio, suggestion, close) {
        const tr = document.createElement('tr');
        tr.setAttribute('data-code', position.code);

        const priceChange = UIManager.formatPriceChange(currentPrice, close);
        const priceChangeClass = currentPrice >= close ? 'ph-profit-positive' : 'ph-profit-negative';
        const cells = [
            this.createCell(`<div>${stockName}</div><div class="ph-cell-secondary">${position.quantity} | ${UIManager.formatNumber(position.cost)}</div>`),
            this.createCell(`<div class="price-value">${UIManager.formatNumber(currentPrice)}</div><div class="price-change ${priceChangeClass}">${priceChange}</div>`),
            this.createCell(`<div class="market-value">${UIManager.formatNumber(position.calculateValue(currentPrice))}</div>`),
            this.createCell(`<div>${UIManager.formatNumber(profitRatio)}%</div><div class="ph-cell-secondary">${UIManager.formatNumber(profit)}</div>`),
            this.createCell(suggestion),
            this.createCell(`<button class="ph-btn-edit" data-code="${position.code}">编辑</button><button class="ph-btn-delete" data-code="${position.code}">删除</button>`)
        ];

        cells.forEach(cell => tr.appendChild(cell));
        tr.querySelector('td:nth-child(4)').className = profit >= 0 ? 'ph-profit-positive' : 'ph-profit-negative';

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
        const marketValueDiv = tr.querySelector('.market-value');
        const priceChangeDiv = tr.querySelector('.price-change');
        const profitCell = tr.querySelector('td:nth-child(4)');

        if (priceValueDiv) {
            const oldPrice = parseFloat(priceValueDiv.textContent);
            const priceChanged = oldPrice !== currentPrice;

            if (priceChanged) {
                tr.querySelector('td:nth-child(1)').innerHTML = `<div>${stockName}</div><div class="ph-cell-secondary">${position.quantity} | ${UIManager.formatNumber(position.cost)}</div>`;
                priceValueDiv.textContent = UIManager.formatNumber(currentPrice);
                const priceChangeClass = currentPrice >= close ? 'ph-profit-positive' : 'ph-profit-negative';
                priceChangeDiv.className = `price-change ${priceChangeClass}`;
                priceChangeDiv.textContent = UIManager.formatPriceChange(currentPrice, close);

                profitCell.className = profit >= 0 ? 'ph-profit-positive' : 'ph-profit-negative';
                profitCell.children[0].textContent = `${UIManager.formatNumber(profitRatio)}%`;
                profitCell.children[1].textContent = UIManager.formatNumber(profit);
            }

            const actualRatio = UIManager.calculateActualRatio(position, currentPrice, positionsData);
            marketValueDiv.innerHTML = `<div class="market-value">${UIManager.formatNumber(position.calculateValue(currentPrice))}</div><div class="ph-cell-secondary">${UIManager.formatNumber(actualRatio)}%</div>`;
            tr.querySelector('td:nth-child(5)').innerHTML = suggestion;
        }
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