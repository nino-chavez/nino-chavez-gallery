'use client';

import { useState } from 'react';
import { PrintSizeSelector } from './PrintSizeSelector';
import { PrintMaterialSelector } from './PrintMaterialSelector';
import { PrintOptions } from './PrintOptions';
import { CustomerInfoForm } from './CustomerInfoForm';
import { OrderSummary } from './OrderSummary';
import type { Photo } from '@/types/photo';
import type { PrintOptions as PrintOptionsType, PrintOrder } from '@/lib/print/types';
import { calculatePrintPrice, createPrintOrder, formatPrice } from '@/lib/print/service';

interface PrintModalProps {
  photo: Photo;
  isOpen: boolean;
  onClose: () => void;
}

export function PrintModal({ photo, isOpen, onClose }: PrintModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [printOptions, setPrintOptions] = useState<PrintOptionsType | null>(null);
  const [customerInfo, setCustomerInfo] = useState<PrintOrder['customerInfo'] | null>(null);
  const [shippingSpeed, setShippingSpeed] = useState<'standard' | 'express' | 'overnight'>('standard');
  const [isProcessing, setIsProcessing] = useState(false);
  const [order, setOrder] = useState<PrintOrder | null>(null);

  const steps = [
    { id: 1, name: 'Size & Material', component: 'options' },
    { id: 2, name: 'Customer Info', component: 'customer' },
    { id: 3, name: 'Review & Order', component: 'summary' }
  ];

  const handleOptionsChange = (options: PrintOptionsType) => {
    setPrintOptions(options);
  };

  const handleCustomerInfoChange = (info: PrintOrder['customerInfo']) => {
    setCustomerInfo(info);
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmitOrder = async () => {
    if (!printOptions || !customerInfo) return;

    setIsProcessing(true);

    try {
      const newOrder = await createPrintOrder(
        photo.id,
        photo.title,
        printOptions,
        customerInfo,
        shippingSpeed
      );

      setOrder(newOrder);

      // Auto advance to success state
      setTimeout(() => {
        setCurrentStep(4); // Success step
      }, 1000);

    } catch (error) {
      console.error('Order failed:', error);
      // Handle error (show toast, etc.)
    } finally {
      setIsProcessing(false);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return printOptions !== null;
      case 2:
        return customerInfo !== null && isCustomerInfoValid(customerInfo);
      case 3:
        return printOptions && customerInfo;
      default:
        return false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Order Print - {photo.title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Steps */}
          <div className="mt-4">
            <div className="flex items-center">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    step.id <= currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step.id}
                  </div>
                  <span className={`ml-2 text-sm ${
                    step.id <= currentStep ? 'text-blue-600 font-medium' : 'text-gray-600'
                  }`}>
                    {step.name}
                  </span>
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-0.5 mx-4 ${
                      step.id < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {currentStep === 1 && (
            <PrintOptions
              photo={photo}
              options={printOptions}
              onChange={handleOptionsChange}
            />
          )}

          {currentStep === 2 && (
            <CustomerInfoForm
              info={customerInfo}
              onChange={handleCustomerInfoChange}
            />
          )}

          {currentStep === 3 && printOptions && customerInfo && (
            <OrderSummary
              photo={photo}
              options={printOptions}
              customerInfo={customerInfo}
              shippingSpeed={shippingSpeed}
              onShippingSpeedChange={setShippingSpeed}
            />
          )}

          {currentStep === 4 && order && (
            <div className="text-center py-8">
              <div className="mb-4">
                <svg className="w-16 h-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Order Placed Successfully!</h3>
              <p className="text-gray-600 mb-4">
                Your print order has been received and is being processed.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Order ID:</span>
                    <p className="text-gray-600">{order.id}</p>
                  </div>
                  <div>
                    <span className="font-medium">Total:</span>
                    <p className="text-gray-600">{formatPrice(order.total)}</p>
                  </div>
                  <div>
                    <span className="font-medium">Estimated Delivery:</span>
                    <p className="text-gray-600">
                      {new Date(order.estimatedDelivery).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <p className="text-gray-600 capitalize">{order.status}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div>
            {currentStep > 1 && currentStep < 4 && (
              <button
                onClick={handlePrevious}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Previous
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStep === 3 && (
              <div className="text-sm text-gray-600">
                Total: {printOptions && customerInfo ? formatPrice(calculatePrintPrice(printOptions, shippingSpeed).total) : '$0.00'}
              </div>
            )}

            {currentStep < 3 && (
              <button
                onClick={handleNext}
                disabled={!canProceedToNext()}
                className={`px-6 py-2 rounded-lg ${
                  canProceedToNext()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Next
              </button>
            )}

            {currentStep === 3 && (
              <button
                onClick={handleSubmitOrder}
                disabled={isProcessing}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                {isProcessing ? 'Processing...' : 'Place Order'}
              </button>
            )}

            {currentStep === 4 && (
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to validate customer info
function isCustomerInfoValid(info: PrintOrder['customerInfo']): boolean {
  return !!(
    info.name &&
    info.email &&
    info.address.street &&
    info.address.city &&
    info.address.state &&
    info.address.zipCode &&
    info.address.country
  );
}