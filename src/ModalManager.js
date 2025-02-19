/**
 * 模态框管理器类
 * 负责处理所有模态框相关的操作
 */
export class ModalManager {
    /**
     * 显示添加持仓的模态框
     */
    static showAddModal() {
        document.getElementById('ph-add-modal').style.display = 'block';
    }

    /**
     * 隐藏添加持仓的模态框并重置表单
     */
    static hideAddModal() {
        document.getElementById('ph-add-modal').style.display = 'none';
        document.getElementById('ph-add-form').reset();
    }

    /**
     * 显示编辑持仓的模态框并填充数据
     * @param {Position} position - 需要编辑的持仓对象
     */
    static showEditModal(position) {
        document.getElementById('ph-edit-code').value = position.code;
        document.getElementById('ph-edit-quantity').value = position.quantity;
        document.getElementById('ph-edit-cost').value = position.cost;
        document.getElementById('ph-edit-targetRatio').value = position.targetRatio;
        document.getElementById('ph-edit-modal').style.display = 'block';
    }

    /**
     * 隐藏编辑持仓的模态框并重置表单
     */
    static hideEditModal() {
        document.getElementById('ph-edit-modal').style.display = 'none';
        document.getElementById('ph-edit-form').reset();
    }
}