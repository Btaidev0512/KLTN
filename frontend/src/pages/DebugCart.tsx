import React, { useState } from 'react';
import { api } from '../services/api';

const DebugCart: React.FC = () => {
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testGetCart = async () => {
    setLoading(true);
    try {
      const res = await api.getCart();
      setResponse({ type: 'success', data: res.data });
      console.log('✅ Get Cart Response:', res.data);
    } catch (error: any) {
      setResponse({ type: 'error', data: error.response?.data || error.message });
      console.error('❌ Get Cart Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testAddToCart = async () => {
    setLoading(true);
    try {
      const res = await api.addToCart(1, 1);
      setResponse({ type: 'success', data: res.data });
      console.log('✅ Add to Cart Response:', res.data);
    } catch (error: any) {
      setResponse({ type: 'error', data: error.response?.data || error.message });
      console.error('❌ Add to Cart Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🧪 Debug Cart API</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Token:</h3>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
          {localStorage.getItem('token') || 'Không có token'}
        </pre>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={testGetCart}
          disabled={loading}
          style={{ padding: '10px 20px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {loading ? 'Loading...' : 'Test GET /api/cart'}
        </button>
        
        <button 
          onClick={testAddToCart}
          disabled={loading}
          style={{ padding: '10px 20px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {loading ? 'Loading...' : 'Test POST /api/cart/add'}
        </button>
      </div>

      {response && (
        <div>
          <h3>Response:</h3>
          <div style={{ 
            background: response.type === 'success' ? '#d4edda' : '#f8d7da', 
            padding: '15px', 
            borderRadius: '4px',
            border: `1px solid ${response.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
          }}>
            <pre style={{ margin: 0, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(response.data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugCart;
