import { connectLambda, getStore } from '@netlify/blobs';

export const handler = async (event) => {
  connectLambda(event);

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  const store = getStore('wafer_flow');

  // ========== GET: 获取所有记录 ==========
  if (event.httpMethod === 'GET') {
    const list = (await store.get('all', { type: 'json' })) || [];
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return { statusCode: 200, headers, body: JSON.stringify(list) };
  }

  // ========== POST: 新建、批量新建、更新 ==========
  if (event.httpMethod === 'POST') {
    let data;
    try {
      data = JSON.parse(event.body);
    } catch (e) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: '数据格式错误' }) };
    }

    const action = data.action;
    let list = (await store.get('all', { type: 'json' })) || [];
    const now = new Date().toISOString();

    // 1. 单条新建（PIE 网页表单）
    if (action === 'create') {
      const newRecord = {
        id: Date.now().toString(),
        mask: data.mask || '',
        lot: data.lot || '',
        wafer: data.wafer || '',
        etchId: data.etchId || '',
        remarks: data.remarks || '',
        testReq: data.testReq || '',
        shipDate: data.shipDate || '',
        pieName: data.pieName || '',
        
        testerName: '',
        testStartDate: '',
        testEndDate: '',
        status: '待测试',
        location: '',
        notes: '',
        
        createdAt: now,
        updatedAt: now
      };
      list.push(newRecord);
      await store.setJSON('all', list);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: '出货登记成功！', data: newRecord }) };
    }

    // 2. 批量新建（Python 脚本极速导入）
    if (action === 'bulk_create') {
      const items = data.items || [];
      if (!Array.isArray(items) || items.length === 0) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: '批量导入数据为空' }) };
      }

      const newRecords = items.map((item, index) => ({
        id: (Date.now() + index).toString(),
        mask: item.mask || '',
        lot: item.lot || '',
        wafer: item.wafer || '',
        etchId: item.etchId || '',
        remarks: item.remarks || '',
        testReq: item.testReq || '',
        shipDate: item.shipDate || '',
        pieName: item.pieName || '系统导入',
        
        testerName: item.testerName || '',
        testStartDate: item.testStartDate || '',
        testEndDate: item.testEndDate || '',
        status: item.status || '待测试',
        location: item.location || '',
        notes: item.notes || '',
        
        createdAt: now,
        updatedAt: now
      }));

      list = list.concat(newRecords);
      await store.setJSON('all', list);

      return { 
        statusCode: 200, 
        headers, 
        body: JSON.stringify({ success: true, message: `成功批量导入 ${newRecords.length} 条数据` }) 
      };
    }

    // 3. 更新测试进度（Tester 网页表单）
    if (action === 'update') {
      const idx = list.findIndex(item => item.id === data.id);
      if (idx === -1) {
        return { statusCode: 404, headers, body: JSON.stringify({ success: false, message: '记录不存在' }) };
      }

      list[idx] = {
        ...list[idx],
        testerName: data.testerName,
        testStartDate: data.testStartDate,
        testEndDate: data.testEndDate,
        status: data.status,
        location: data.location,
        notes: data.notes,
        updatedAt: now
      };

      await store.setJSON('all', list);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: '测试进度已更新！' }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: '未知的 action' }) };
  }

  return { statusCode: 405, headers, body: 'Method Not Allowed' };
};
