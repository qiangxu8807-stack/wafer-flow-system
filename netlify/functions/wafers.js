import { connectLambda, getStore } from '@netlify/blobs';

export const handler = async (event) => {
  connectLambda(event);

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  // 注意：这里使用独立的 Store 名称 'wafer_flow'，与预约系统的 'bookings' 完全隔离
  const store = getStore('wafer_flow');

  if (event.httpMethod === 'GET') {
    const list = (await store.get('all', { type: 'json' })) || [];
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return { statusCode: 200, headers, body: JSON.stringify(list) };
  }

  if (event.httpMethod === 'POST') {
    const data = JSON.parse(event.body);
    const action = data.action;
    const list = (await store.get('all', { type: 'json' })) || [];

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
        
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      list.push(newRecord);
      await store.setJSON('all', list);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: '出货登记成功！', data: newRecord }) };
    }

    if (action === 'update') {
      const idx = list.findIndex(item => item.id === data.id);
      if (idx === -1) return { statusCode: 404, headers, body: JSON.stringify({ success: false, message: '记录不存在' }) };

      list[idx] = {
        ...list[idx],
        testerName: data.testerName,
        testStartDate: data.testStartDate,
        testEndDate: data.testEndDate,
        status: data.status,
        location: data.location,
        notes: data.notes,
        updatedAt: new Date().toISOString()
      };

      await store.setJSON('all', list);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: '测试进度已更新！' }) };
    }
  }

  return { statusCode: 405, headers, body: 'Method Not Allowed' };
};
