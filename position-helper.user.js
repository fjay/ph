// ==UserScript==
// @name         Position Helper
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  持仓管理助手
// @author       Your name
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function () {
    'use strict';

    // 配置管理
    const config = {
        apiEndpoint: 'https://hq.sinajs.cn/list=',
        referer: 'http://finance.sina.com.cn'
    };

    // 日志管理
    class Logger {
        static info(message) {
            console.log(`[INFO] ${new Date().toISOString()}: ${message}`);
        }

        static error(message, error) {
            console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error);
        }
    }

    // 股票数据解析器
    class StockDataParser {
        static parse(responseText) {
            const match = responseText.match(/"(.+)"/); 
            if (!match) {
                throw new Error('无法解析股票数据');
            }

            const data = match[1].split(',');
            return {
                name: data[0],        // 股票名称
                open: data[1],        // 今日开盘价
                close: data[2],       // 昨日收盘价
                price: data[3],       // 当前价格
                high: data[4],        // 今日最高价
                low: data[5],         // 今日最低价
                volume: data[8],      // 成交量
                date: data[30],       // 日期
                time: data[31]        // 时间
            };
        }
    }

    // 股票数据管理类
    class StockManager {
        constructor(symbol) {
            this.symbol = symbol;
        }

        async fetchStockData() {
            try {
                return await this._makeRequest();
            } catch (error) {
                Logger.error('获取行情数据失败', error);
                throw error;
            }
        }

        _makeRequest() {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: `${config.apiEndpoint}${this.symbol}`,
                    headers: {
                        'Referer': config.referer
                    },
                    onload: (response) => this._handleResponse(response, resolve, reject),
                    onerror: (error) => {
                        Logger.error('请求失败', error);
                        reject(error);
                    }
                });
            });
        }

        _handleResponse(response, resolve, reject) {
            if (response.status !== 200) {
                const error = new Error(`HTTP error! status: ${response.status}`);
                Logger.error('HTTP请求失败', error);
                reject(error);
                return;
            }

            try {
                const data = StockDataParser.parse(response.responseText);
                resolve(data);
            } catch (error) {
                Logger.error('数据解析失败', error);
                reject(error);
            }
        }
    }

    // 创建一个全局函数来获取股票数据
    unsafeWindow.getStockData = async function(symbol) {
        try {
            const stockManager = new StockManager(symbol);
            return await stockManager.fetchStockData();
        } catch (error) {
            Logger.error(`获取股票数据失败: ${symbol}`, error);
            throw error;
        }
    };

    Logger.info('股票数据助手已启动');

})();