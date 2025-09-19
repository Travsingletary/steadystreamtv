// Simple script to test NOWPayments API connection

const API_KEY = 'GWY1RNA-CDXMZ35-M326YDF-JC660RR';
const BASE_URL = 'https://api.nowpayments.io/v1';

async function testNOWPaymentsAPI() {
  console.log('Testing NOWPayments API...');

  try {
    // Test 1: Get API status
    console.log('\n1. Testing API status...');
    const statusResponse = await fetch(`${BASE_URL}/status`, {
      headers: {
        'x-api-key': API_KEY
      }
    });

    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('✅ API Status:', statusData.message || 'OK');
    } else {
      console.log('❌ API Status failed:', statusResponse.status);
    }

    // Test 2: Get available currencies
    console.log('\n2. Testing available currencies...');
    const currenciesResponse = await fetch(`${BASE_URL}/currencies`, {
      headers: {
        'x-api-key': API_KEY
      }
    });

    if (currenciesResponse.ok) {
      const currenciesData = await currenciesResponse.json();
      console.log('✅ Available currencies:', currenciesData.currencies?.slice(0, 10), '(showing first 10)');
    } else {
      console.log('❌ Currencies failed:', currenciesResponse.status);
    }

    // Test 3: Get minimum payment amount for USDT
    console.log('\n3. Testing minimum payment amount...');
    const minAmountResponse = await fetch(`${BASE_URL}/min-amount?currency_from=usd&currency_to=usdt`, {
      headers: {
        'x-api-key': API_KEY
      }
    });

    if (minAmountResponse.ok) {
      const minAmountData = await minAmountResponse.json();
      console.log('✅ Minimum amount for USDT:', minAmountData);
    } else {
      console.log('❌ Min amount failed:', minAmountResponse.status);
    }

    // Test 4: Create a test payment
    console.log('\n4. Testing payment creation...');
    const paymentData = {
      price_amount: 20,
      price_currency: 'USD',
      pay_currency: 'usdt',
      order_id: `test-${Date.now()}`,
      order_description: 'SteadyStream TV Test Payment',
      success_url: 'https://steadystreamtv.com/payment-success',
      cancel_url: 'https://steadystreamtv.com/payment-failed',
      ipn_callback_url: 'https://steadystreamtv.com/api/nowpayments-webhook',
      purchase_id: `purchase-${Date.now()}`
    };

    const createPaymentResponse = await fetch(`${BASE_URL}/invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify(paymentData)
    });

    if (createPaymentResponse.ok) {
      const paymentResult = await createPaymentResponse.json();
      console.log('✅ Payment created successfully!');
      console.log('Payment ID:', paymentResult.payment_id);
      console.log('Invoice URL:', paymentResult.invoice_url);
      console.log('Pay amount:', paymentResult.pay_amount, paymentResult.pay_currency);
    } else {
      const errorData = await createPaymentResponse.json().catch(() => ({}));
      console.log('❌ Payment creation failed:', createPaymentResponse.status);
      console.log('Error:', errorData);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testNOWPaymentsAPI();