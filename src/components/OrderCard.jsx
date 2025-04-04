import React, { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import QRCode from 'qrcode';

function OrderCard({ order, onStatusChange, onDeliveryConfirmation }) {
  const qrCodeRef = useRef(null);
  const [qrError, setQrError] = useState(null);
  const [deliveryCode, setDeliveryCode] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (!qrCodeRef.current) return;

    const orderData = {
      id: order.id,
      customer: order.customer,
      items: order.items,
      codigo_entrega: order.codigo_entrega,
      total: order.items.reduce((total, item) => total + item.valor * item.quantidade, 0)
    };

    const generateQR = async () => {
      try {
        await QRCode.toCanvas(qrCodeRef.current, JSON.stringify(orderData), {
          width: 128,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        });
      } catch (err) {
        setQrError('Erro ao gerar QR Code');
      }
    };

    generateQR();
  }, [order]);

  const statusColors = {
    'em espera': 'bg-yellow-100 text-yellow-800',
    'preparando': 'bg-orange-100 text-orange-800',
    'entregue': 'bg-green-100 text-green-800'
  };

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const handleDeliveryConfirm = () => {
    onDeliveryConfirmation(order.id, deliveryCode);
    setShowConfirmation(false);
    setDeliveryCode('');
  };

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'em espera': return 'preparando';
      case 'preparando': return 'entregue';
      default: return currentStatus;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Pedido #{order.id}</h3>
            <p className="text-sm text-gray-500">{format(new Date(order.createdAt), "dd 'de' MMMM', às' HH:mm", { locale: ptBR })}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
            {order.status === 'em espera' ? 'Em Espera' : order.status === 'preparando' ? 'Preparando' : 'Entregue'}
          </span>
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-900">Cliente</h4>
          <p className="text-sm text-gray-500">{order.customer.name}</p>
          <p className="text-sm text-gray-500">{order.customer.phone}</p>
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-900">Itens</h4>
          <ul className="mt-2 divide-y divide-gray-200">
            {order.items.map((item, index) => (
              <li key={index} className="py-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">{item.quantidade}x {item.nome_produto}</span>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(item.valor * item.quantidade)}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between">
            <span className="text-base font-medium text-gray-900">Total</span>
            <span className="text-base font-medium text-gray-900">{formatCurrency(order.items.reduce((total, item) => total + item.valor * item.quantidade, 0))}</span>
          </div>
        </div>

        <div className="mt-4 flex flex-col items-center">
          {qrError ? (
            <p className="text-red-500 text-sm">{qrError}</p>
          ) : (
            <canvas ref={qrCodeRef} className="border border-gray-200 rounded" />
          )}
        </div>

        {order.status !== 'entregue' && (
          <div className="mt-6 space-y-4">
            {showConfirmation ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={deliveryCode}
                  onChange={(e) => setDeliveryCode(e.target.value)}
                  placeholder="Digite o código de entrega"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <div className="flex space-x-2">
                  <button onClick={handleDeliveryConfirm} className="flex-1 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors">Confirmar</button>
                  <button onClick={() => setShowConfirmation(false)} className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors">Cancelar</button>
                </div>
              </div>
            ) : (
              <>
                <button onClick={() => onStatusChange(order.id, getNextStatus(order.status))} className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors">
                  {order.status === 'em espera' ? 'Iniciar Preparo' : 'Marcar como Entregue'}
                </button>
                {order.status === 'preparando' && (
                  <button onClick={() => setShowConfirmation(true)} className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors">
                    Confirmar Entrega
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderCard;
