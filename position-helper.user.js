// ==UserScript==
// @name         Position Helper
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  持仓管理助手
// @author       Your name
// @match        https://www.baidu.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 创建并注入样式
    const style = document.createElement('style');
    style.textContent = `
        .ph-container {
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 9999;
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-height: 80vh;
            overflow-y: auto;
            font-size: 13px;
            max-width: 900px;
        }

        .ph-header {
            display: flex;
            justify-content: flex-start;
            margin-bottom: 12px;
        }

        .ph-add-btn {
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
        }

        .ph-positions-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
        }

        .ph-positions-table th,
        .ph-positions-table td {
            padding: 6px;
            text-align: left;
            border-bottom: 1px solid #ddd;
            font-size: 13px;
        }

        .ph-positions-table th {
            background-color: #f8f9fa;
            font-weight: 600;
        }

        .ph-positions-table tr:hover {
            background-color: #f5f5f5;
        }

        .ph-profit-positive {
            color: #4CAF50;
        }

        .ph-profit-negative {
            color: #f44336;
        }

        .ph-btn-edit {
            background-color: #2196F3;
            color: white;
            border: none;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 8px;
        }

        .ph-btn-delete {
            background-color: #f44336;
            color: white;
            border: none;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
        }

        .ph-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
            z-index: 10000;
        }

        .ph-modal-content {
            position: relative;
            background-color: white;
            margin: 15% auto;
            padding: 20px;
            width: 80%;
            max-width: 500px;
            border-radius: 4px;
        }

        .ph-form-group {
            margin-bottom: 15px;
        }

        .ph-form-group label {
            display: block;
            margin-bottom: 5px;
        }

        .ph-form-group input {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }

        .ph-btn-group {
            text-align: right;
            margin-top: 20px;
        }

        .ph-btn-group button {
            margin-left: 10px;
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }

        .ph-btn-primary {
            background-color: #4CAF50;
            color: white;
        }

        .ph-btn-secondary {
            background-color: #9e9e9e;
            color: white;
        }
    `;
    document.head.appendChild(style);

    // 创建UI
    const container = document.createElement('div');
    container.className = 'ph-container';
    container.innerHTML = `
        <div class="ph-header">
            <button class="ph-add-btn" onclick="window.phShowAddModal()">+</button>
        </div>

        <table class="ph-positions-table">
            <tbody id="ph-positions-body"></tbody>
        </table>

        <div id="ph-add-modal" class="ph-modal">
            <div class="ph-modal-content">
                <form id="ph-add-form">
                    <div class="ph-form-group">
                        <label for="ph-code">代码</label>
                        <input type="text" id="ph-code" required>
                    </div>
                    <div class="ph-form-group">
                        <label for="ph-quantity">数量</label>
                        <input type="number" id="ph-quantity" required min="0">
                    </div>
                    <div class="ph-form-group">
                        <label for="ph-cost">成本价</label>
                        <input type="number" id="ph-cost" required min="0" step="0.01">
                    </div>
                    <div class="ph-form-group">
                        <label for="ph-targetRatio">目标仓位比例 (%)</label>
                        <input type="number" id="ph-targetRatio" required min="0" max="100" step="0.01">
                    </div>
                    <div class="ph-btn-group">
                        <button type="button" class="ph-btn-secondary" onclick="window.phHideAddModal()">取消</button>
                        <button type="submit" class="ph-btn-primary">确定</button>
                    </div>
                </form>
            </div>
        </div>

        <div id="ph-edit-modal" class="ph-modal">
            <div class="ph-modal-content">
\                <form id="ph-edit-form">
                    <div class="ph-form-group">
                        <label for="ph-edit-code">代码</label>
                        <input type="text" id="ph-edit-code" required disabled>
                    </div>
                    <div class="ph-form-group">
                        <label for="ph-edit-quantity">数量</label>
                        <input type="number" id="ph-edit-quantity" required min="0">
                    </div>
                    <div class="ph-form-group">
                        <label for="ph-edit-cost">成本价</label>
                        <input type="number" id="ph-edit-cost" required min="0" step="0.01">
                    </div>
                    <div class="ph-form-group">
                        <label for="ph-edit-targetRatio">目标仓位比例 (%)</label>
                        <input type="number" id="ph-edit-targetRatio" required min="0" max="100" step="0.01">
                    </div>
                    <div class="ph-btn-group">
                        <button type="button" class="ph-btn-secondary" onclick="window.phHideEditModal()">取消</button>
                        <button type="submit" class="ph-btn-primary">确定</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(container);

    // 存储持仓数据的键名
    const STORAGE_KEY = 'ph_positions';

    // 从localStorage加载持仓数据
    function loadPositions() {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    // 保存持仓数据到localStorage
    function savePositions(positions) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
    }

    // 显示添加持仓的模态框
    window.phShowAddModal = function() {
        document.getElementById('ph-add-modal').style.display = 'block';
    };

    // 隐藏添加持仓的模态框
    window.phHideAddModal = function() {
        document.getElementById('ph-add-modal').style.display = 'none';
        document.getElementById('ph-add-form').reset();
    };

    // 格式化数字为带两位小数的字符串
    function formatNumber(number) {
        return Number(number).toFixed(2);
    }

    // 计算收益信息
    function calculateProfit(position, currentPrice) {
        const cost = position.quantity * position.cost;
        const current = position.quantity * currentPrice;
        const profit = current - cost;
        const profitRatio = (profit / cost) * 100;
        return {
            profit,
            profitRatio
        };
    }

    // 计算建议操作
    function calculateSuggestion(positions, position, currentPrice) {
        const totalValue = positions.reduce((sum, pos) => {
            const price = pos === position ? currentPrice : pos.cost;
            return sum + (pos.quantity * price);
        }, 0);

        const targetValue = totalValue * (position.targetRatio / 100);
        const currentValue = position.quantity * currentPrice;
        const diff = targetValue - currentValue;
        const diffQuantity = Math.abs(Math.round(diff / currentPrice));

        if (Math.abs(diff) < currentPrice) {
            return '';
        }

        return diff > 0 ? `+ ${diffQuantity}` : `- ${diffQuantity}`;
    }

    // 删除持仓
    window.phDeletePosition = function(code) {
        if (!confirm(`确定要删除代码为 ${code} 的持仓吗？`)) {
            return;
        }
        const positions = loadPositions();
        const newPositions = positions.filter(p => p.code !== code);
        savePositions(newPositions);
        renderPositions();
    };

    // 渲染持仓列表
    function renderPositions() {
        const positions = loadPositions();
        const tbody = document.getElementById('ph-positions-body');
        tbody.innerHTML = '';

        positions.forEach(position => {
            const currentPrice = position.cost;
            const { profit, profitRatio } = calculateProfit(position, currentPrice);
            const suggestion = calculateSuggestion(positions, position, currentPrice);

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div>${position.code}</div>
                    <div style="color: #666; font-size: 12px;">${position.quantity}</div>
                </td>
                <td>
                    <div>${formatNumber(currentPrice)}</div>
                    <div style="color: #666; font-size: 12px;">${formatNumber(position.cost)}</div>
                </td>
                <td>
                    <div>${formatNumber(position.quantity * currentPrice)}</div>
                    <div style="color: #666; font-size: 12px;">${formatNumber(position.targetRatio)}%</div>
                </td>
                <td class="${profit >= 0 ? 'ph-profit-positive' : 'ph-profit-negative'}">
                    <div>${formatNumber(profitRatio)}%</div>
                    <div style="font-size: 12px;">${formatNumber(profit)}</div>
                </td>
                <td>${suggestion}</td>
                <td>
                    <button class="ph-btn-edit" onclick="window.phShowEditModal('${position.code}')">编辑</button>
                    <button class="ph-btn-delete" onclick="window.phDeletePosition('${position.code}')">删除</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // 添加新持仓
    function addPosition(event) {
        event.preventDefault();

        const code = document.getElementById('ph-code').value;
        const quantity = Number(document.getElementById('ph-quantity').value);
        const cost = Number(document.getElementById('ph-cost').value);
        const targetRatio = Number(document.getElementById('ph-targetRatio').value);

        const positions = loadPositions();
        
        if (positions.some(p => p.code === code)) {
            alert('该代码的持仓已存在！');
            return;
        }

        const totalRatio = positions.reduce((sum, p) => sum + p.targetRatio, 0) + targetRatio;
        if (totalRatio > 100) {
            alert('目标仓位比例总和不能超过100%！');
            return;
        }

        positions.push({
            code,
            quantity,
            cost,
            targetRatio
        });

        savePositions(positions);
        renderPositions();
        window.phHideAddModal();
    }

    // 显示编辑模态框
    window.phShowEditModal = function(code) {
        const positions = loadPositions();
        const position = positions.find(p => p.code === code);
        if (!position) return;

        document.getElementById('ph-edit-code').value = position.code;
        document.getElementById('ph-edit-quantity').value = position.quantity;
        document.getElementById('ph-edit-cost').value = position.cost;
        document.getElementById('ph-edit-targetRatio').value = position.targetRatio;
        document.getElementById('ph-edit-modal').style.display = 'block';
    };

    // 隐藏编辑模态框
    window.phHideEditModal = function() {
        document.getElementById('ph-edit-modal').style.display = 'none';
        document.getElementById('ph-edit-form').reset();
    };

    // 编辑持仓
    function editPosition(event) {
        event.preventDefault();

        const code = document.getElementById('ph-edit-code').value;
        const quantity = Number(document.getElementById('ph-edit-quantity').value);
        const cost = Number(document.getElementById('ph-edit-cost').value);
        const targetRatio = Number(document.getElementById('ph-edit-targetRatio').value);

        const positions = loadPositions();
        const index = positions.findIndex(p => p.code === code);
        if (index === -1) return;

        const totalRatio = positions.reduce((sum, p, i) => {
            return sum + (i === index ? targetRatio : p.targetRatio);
        }, 0);
        if (totalRatio > 100) {
            alert('目标仓位比例总和不能超过100%！');
            return;
        }

        positions[index] = {
            code,
            quantity,
            cost,
            targetRatio
        };

        savePositions(positions);
        renderPositions();
        window.phHideEditModal();
    }

    // 初始化表单事件监听
    document.getElementById('ph-add-form').addEventListener('submit', addPosition);
    document.getElementById('ph-edit-form').addEventListener('submit', editPosition);

    // 点击模态框外部时关闭
    document.getElementById('ph-add-modal').addEventListener('click', function(event) {
        if (event.target === this) {
            window.phHideAddModal();
        }
    });

    document.getElementById('ph-edit-modal').addEventListener('click', function(event) {
        if (event.target === this) {
            window.phHideEditModal();
        }
    });

    // 初始化渲染
    renderPositions();
})();