import { Position } from './Position.js';
import { PositionManager } from './PositionManager.js';
import { UIManager } from './UIManager.js';

// 应用主类
export class App {
    constructor() {
        this.refreshTimer = null;
        this.initEventListeners();
    }

    initEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            document.getElementById('ph-add-btn').addEventListener('click', () => UIManager.showAddModal());
            document.getElementById('ph-cancel-add-btn').addEventListener('click', () => UIManager.hideAddModal());
            document.getElementById('ph-cancel-edit-btn').addEventListener('click', () => UIManager.hideEditModal());
            document.getElementById('ph-add-form').addEventListener('submit', e => this.addPosition(e));
            document.getElementById('ph-edit-form').addEventListener('submit', e => this.handleEditSubmit(e));

            UIManager.renderPositions();
            this.startAutoRefresh();
        });

        window.addEventListener('unload', () => this.stopAutoRefresh());
    }

    startAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        this.refreshTimer = setInterval(() => UIManager.renderPositions(), 5000);
    }

    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    addPosition(event) {
        event.preventDefault();

        const code = document.getElementById('ph-code').value;
        const quantity = Number(document.getElementById('ph-quantity').value);
        const cost = Number(document.getElementById('ph-cost').value);
        const targetRatio = Number(document.getElementById('ph-targetRatio').value);

        const positions = PositionManager.load();

        if (positions.some(p => p.code === code)) {
            alert('该代码的持仓已存在！');
            return;
        }

        if (!PositionManager.validateTargetRatio(positions, targetRatio)) {
            alert('所有持仓的目标仓位比例之和不能超过100%！');
            return;
        }

        positions.push(new Position(code, quantity, cost, targetRatio));
        PositionManager.save(positions);
        UIManager.hideAddModal();
        UIManager.renderPositions();
    }

    editPosition(code) {
        const positions = PositionManager.load();
        const position = positions.find(p => p.code === code);
        if (position) {
            UIManager.showEditModal(position);
        }
    }

    handleEditSubmit(event) {
        event.preventDefault();

        const code = document.getElementById('ph-edit-code').value;
        const quantity = Number(document.getElementById('ph-edit-quantity').value);
        const cost = Number(document.getElementById('ph-edit-cost').value);
        const targetRatio = Number(document.getElementById('ph-edit-targetRatio').value);

        const positions = PositionManager.load();
        const index = positions.findIndex(p => p.code === code);

        if (index === -1) {
            alert('未找到要编辑的持仓！');
            return;
        }

        if (!PositionManager.validateTargetRatio(positions, targetRatio, code)) {
            alert('所有持仓的目标仓位比例之和不能超过100%！');
            return;
        }

        positions[index] = new Position(code, quantity, cost, targetRatio);
        PositionManager.save(positions);
        UIManager.hideEditModal();
        UIManager.renderPositions();
    }

    deletePosition(code) {
        if (!confirm(`确定要删除代码为 ${code} 的持仓吗？`)) {
            return;
        }
        const positions = PositionManager.load();
        const newPositions = positions.filter(p => p.code !== code);
        PositionManager.save(newPositions);
        UIManager.renderPositions();
    }
}

// 初始化应用
const app = new App();
window.app = app; // 导出到全局作用域以供HTML调用