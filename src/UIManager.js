import { Position } from './Position.js';
import { StockManager } from './StockManager.js';
import { PositionManager } from './PositionManager.js';

// UI管理类
export class UIManager {
    static formatNumber(number) {
        return Number(number).toFixed(3);
    }

    static showAddModal() {
        document.getElementById('ph-add-modal').style.display = 'block';
    }

    static hideAddModal() {
        document.getElementById('ph-add-modal').style.display = 'none';
        document.getElementById('ph-add-form').reset();
    }

    static showEditModal(position) {
        document.getElementById('ph-edit-code').value = position.code;
        document.getElementById('ph-edit-quantity').value = position.quantity;
        document.getElementById('ph-edit-cost').value = position.cost;
        document.getElementById('ph-edit-targetRatio').value = position.targetRatio;
        document.getElementById('ph-edit-modal').style.display = 'block';
    }

    static hideEditModal() {
        document.getElementById('ph-edit-modal').style.display = 'none';
        document.getElementById('ph-edit-form').reset();
    }

    static createCell(html) {
        const td = document.createElement('td');
        td.innerHTML = html;
        return td;
    }

    static async renderPositions() {
        const positions = PositionManager.load();
        const tbody = document.getElementById('ph-positions-body');

        const positionsData = await Promise.all(positions.map(async position => {
            const stockManager = new StockManager(position.code);
            const stockData = await stockManager.fetchStockData() || { price: position.cost, name: position.code };
            const currentPrice = stockData.price;
            const stockName = stockData.name.substring(0, 3);
            const { profit, profitRatio } = position.calculateProfit(currentPrice);
            const suggestion = PositionManager.calculateSuggestion(positions, position, currentPrice);
            return { position, currentPrice, stockName, profit, profitRatio, suggestion };
        }));

        this.updateTable(tbody, positionsData);
    }

    static updateTable(tbody, positionsData) {
        positionsData.forEach(data => {
            const { position, currentPrice, stockName, profit, profitRatio, suggestion } = data;
            let tr = tbody.querySelector(`tr[data-code="${position.code}"]`);
            const isNewRow = !tr;

            if (isNewRow) {
                tr = this.createNewRow(position, currentPrice, stockName, profit, profitRatio, suggestion);
                tbody.appendChild(tr);
            } else {
                this.updateExistingRow(tr, position, currentPrice, profit, profitRatio, suggestion);
            }
        });

        this.removeDeletedRows(tbody, positionsData);
    }

    static createNewRow(position, currentPrice, stockName, profit, profitRatio, suggestion) {
        const tr = document.createElement('tr');
        tr.setAttribute('data-code', position.code);
        tr.style.opacity = '0';
        tr.style.transition = 'opacity 0.3s';

        const cells = [
            this.createCell(`<div>${stockName}</div><div style="color: #666; font-size: 12px;">${position.quantity}</div>`),
            this.createCell(`<div class="price-value" style="transition: color 0.3s">${this.formatNumber(currentPrice)}</div><div style="color: #666; font-size: 12px;">${this.formatNumber(position.cost)}</div>`),
            this.createCell(`<div class="market-value" style="transition: color 0.3s">${this.formatNumber(position.calculateValue(currentPrice))}</div><div style="color: #666; font-size: 12px;">${this.formatNumber(position.targetRatio)}%</div>`),
            this.createCell(`<div>${this.formatNumber(profitRatio)}%</div><div style="font-size: 12px;">${this.formatNumber(profit)}</div>`),
            this.createCell(suggestion),
            this.createCell(`<button class="ph-btn-edit" onclick="app.editPosition('${position.code}')">编辑</button><button class="ph-btn-delete" onclick="app.deletePosition('${position.code}')">删除</button>`)
        ];

        cells.forEach(cell => tr.appendChild(cell));
        tr.querySelector('td:nth-child(4)').className = profit >= 0 ? 'ph-profit-positive' : 'ph-profit-negative';

        requestAnimationFrame(() => {
            tr.style.opacity = '1';
        });

        return tr;
    }

    static updateExistingRow(tr, position, currentPrice, profit, profitRatio, suggestion) {
        const priceValueDiv = tr.querySelector('.price-value');
        const marketValueDiv = tr.querySelector('.market-value');
        const profitCell = tr.querySelector('td:nth-child(4)');

        if (priceValueDiv) {
            const oldPrice = parseFloat(priceValueDiv.textContent);
            const priceChanged = oldPrice !== currentPrice;

            if (priceChanged) {
                const color = currentPrice > oldPrice ? '#f44336' : '#4CAF50';
                priceValueDiv.style.color = color;
                marketValueDiv.style.color = color;

                setTimeout(() => {
                    priceValueDiv.style.color = '';
                    marketValueDiv.style.color = '';
                }, 1000);

                priceValueDiv.textContent = this.formatNumber(currentPrice);
                marketValueDiv.textContent = this.formatNumber(position.calculateValue(currentPrice));
                profitCell.className = profit >= 0 ? 'ph-profit-positive' : 'ph-profit-negative';
                profitCell.children[0].textContent = `${this.formatNumber(profitRatio)}%`;
                profitCell.children[1].textContent = this.formatNumber(profit);
                tr.querySelector('td:nth-child(5)').textContent = suggestion;
            }
        }
    }

    static removeDeletedRows(tbody, positionsData) {
        const existingRows = tbody.querySelectorAll('tr');
        existingRows.forEach(row => {
            const code = row.getAttribute('data-code');
            if (!positionsData.some(data => data.position.code === code)) {
                row.style.transition = 'opacity 0.3s';
                row.style.opacity = '0';
                setTimeout(() => row.remove(), 300);
            }
        });
    }
}