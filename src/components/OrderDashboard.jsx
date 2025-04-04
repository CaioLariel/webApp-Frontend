// OrderDashboard.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import OrderCard from './OrderCard';

function OrderDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/consultarPedidos');
      
      if (response.data && response.data.length) {
        const formattedOrders = response.data.map(order => ({
          id: order.id,
          createdAt: order.created_at || new Date().toISOString(),
          status: order.status,
          customer: {
            name: order.nome_cliente,
          },
          items: order.itens,
          codigo_entrega: order.codigo_entrega,
          valor_total: order.valor_total
        }));
        setOrders(formattedOrders);
      } else {
        toast.error('Nenhum pedido encontrado.');
      }
    } catch (error) {
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.put(`http://localhost:3000/api/${orderId}/status`, { status: newStatus });
      setOrders(prevOrders => prevOrders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      toast.success('Status atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const handleDeliveryConfirmation = async (orderId, code) => {
    try {
      await axios.post(`http://localhost:3000/api/${orderId}/confirmar`, { codigo: code });
      setOrders(prevOrders => prevOrders.map(order => 
        order.id === orderId ? { ...order, status: 'entregue' } : order
      ));
      toast.success('Entrega confirmada com sucesso!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao confirmar entrega');
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-md ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}>Todos</button>
          <button onClick={() => setFilter('em espera')} className={`px-4 py-2 rounded-md ${filter === 'em espera' ? 'bg-yellow-500 text-white' : 'bg-white text-gray-700'}`}>Em Espera</button>
          <button onClick={() => setFilter('preparando')} className={`px-4 py-2 rounded-md ${filter === 'preparando' ? 'bg-orange-500 text-white' : 'bg-white text-gray-700'}`}>Preparando</button>
          <button onClick={() => setFilter('entregue')} className={`px-4 py-2 rounded-md ${filter === 'entregue' ? 'bg-green-500 text-white' : 'bg-white text-gray-700'}`}>Entregue</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.map(order => (
          <OrderCard
            key={order.id}
            order={order}
            onStatusChange={handleStatusChange}
            onDeliveryConfirmation={handleDeliveryConfirmation}
          />
        ))}
      </div>

      {filteredOrders.length === 0 && <div className="text-center py-12"><p className="text-gray-500 text-lg">Nenhum pedido encontrado</p></div>}
    </div>
  );
}

export default OrderDashboard;
