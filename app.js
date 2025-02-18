// 存储持仓数据的键名
const STORAGE_KEY = 'positions';

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
function showAddModal() {
    document.getElementById('add-modal').style.display = 'block';
}

// 隐藏添加持仓的模态框
function hideAddModal() {
    document.getElementById('add-modal').style.display = 'none';
    document.getElementById('add-form').reset();
}

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
    // 计算当前总市值
    const totalValue = positions.reduce((sum, pos) => {
        // 使用每个持仓的实际当前价格计算
        const price = pos === position ? currentPrice : pos.cost;
        return sum + (pos.quantity * price);
    }, 0);

    // 计算目标市值
    const targetValue = totalValue * (position.targetRatio / 100);
    const currentValue = position.quantity * currentPrice;

    // 计算差额
    const diff = targetValue - currentValue;
    const diffQuantity = Math.abs(Math.round(diff / currentPrice));

    if (Math.abs(diff) < currentPrice) { // 如果差额小于一股的价格，认为是平衡的
        return '';
    }

    if (diff > 0) {
        return `+ ${diffQuantity}`;
    } else {
        return `- ${diffQuantity}`;
    }
}

// 删除持仓
function deletePosition(code) {
    const positions = loadPositions();
    const newPositions = positions.filter(p => p.code !== code);
    savePositions(newPositions);
    renderPositions();
}

// 渲染持仓列表
// 更新renderPositions函数中的操作按钮部分
function renderPositions() {
    const positions = loadPositions();
    const tbody = document.getElementById('positions-body');
    tbody.innerHTML = '';

    positions.forEach(position => {
        const currentPrice = position.cost; // 默认使用成本价作为当前价格
        const { profit, profitRatio } = calculateProfit(position, currentPrice);
        const suggestion = calculateSuggestion(positions, position, currentPrice);
        const totalCost = position.quantity * position.cost;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${position.code}</td>
            <td>${position.quantity}</td>
            <td>${formatNumber(position.cost)}</td>
            <td>${formatNumber(position.quantity * currentPrice)}</td>
            <td>${formatNumber(position.targetRatio)}%</td>
            <td>${formatNumber(currentPrice)}</td>
            <td class="${profit >= 0 ? 'profit-positive' : 'profit-negative'}">
                ${formatNumber(profit)}
            </td>
            <td class="${profit >= 0 ? 'profit-positive' : 'profit-negative'}">
                ${formatNumber(profitRatio)}%
            </td>
            <td>${suggestion}</td>
            <td>
                <button class="btn btn-edit" onclick="showEditModal('${position.code}')">编辑</button>
                <button class="btn btn-secondary" onclick="deletePosition('${position.code}')">删除</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 添加新持仓
function addPosition(event) {
    event.preventDefault();

    const code = document.getElementById('code').value;
    const quantity = Number(document.getElementById('quantity').value);
    const cost = Number(document.getElementById('cost').value);
    const targetRatio = Number(document.getElementById('targetRatio').value);

    const positions = loadPositions();
    
    // 检查是否已存在相同代码的持仓
    if (positions.some(p => p.code === code)) {
        alert('该代码的持仓已存在！');
        return;
    }

    // 检查目标仓位比例总和是否超过100%
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
    hideAddModal();
}

// 初始化
document.getElementById('add-form').addEventListener('submit', addPosition);
renderPositions();

// 点击模态框外部时关闭
document.getElementById('add-modal').addEventListener('click', function(event) {
    if (event.target === this) {
        hideAddModal();
    }
});

function showEditModal(code) {
    const positions = loadPositions();
    const position = positions.find(p => p.code === code);
    if (!position) return;

    document.getElementById('edit-code').value = position.code;
    document.getElementById('edit-quantity').value = position.quantity;
    document.getElementById('edit-cost').value = position.cost;
    document.getElementById('edit-targetRatio').value = position.targetRatio;
    document.getElementById('edit-modal').style.display = 'block';
}

function hideEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
    document.getElementById('edit-form').reset();
}

function editPosition(event) {
    event.preventDefault();

    const code = document.getElementById('edit-code').value;
    const quantity = Number(document.getElementById('edit-quantity').value);
    const cost = Number(document.getElementById('edit-cost').value);
    const targetRatio = Number(document.getElementById('edit-targetRatio').value);

    const positions = loadPositions();
    const index = positions.findIndex(p => p.code === code);
    if (index === -1) return;

    // 检查目标仓位比例总和是否超过100%
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
    hideEditModal();
}

// 初始化编辑表单事件监听
document.getElementById('edit-form').addEventListener('submit', editPosition);

// 点击编辑模态框外部时关闭
document.getElementById('edit-modal').addEventListener('click', function(event) {
    if (event.target === this) {
        hideEditModal();
    }
});