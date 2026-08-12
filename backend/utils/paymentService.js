// Payment Service Stub
// Replace with eSewa/Khalti SDK integration when ready

const initiatePayment = async (method, amount, bookingId) => {
  console.log(`💳 Payment Stub → Method: ${method}, Amount: Rs.${amount}, Booking: ${bookingId}`);

  if (method === 'cash') {
    return {
      success: true,
      method: 'cash',
      status: 'pending',
      message: 'नगद भुक्तानी — सेवा प्रदायक आएपछि तिर्नुहोस्'
    };
  }

  // TODO: Real eSewa integration
  if (method === 'esewa') {
    return {
      success: true,
      method: 'esewa',
      status: 'pending',
      redirectUrl: `https://esewa.com.np/epay/main?amt=${amount}&pid=${bookingId}`,
      message: 'eSewa मा रिडाइरेक्ट हुँदैछ...'
    };
  }

  // TODO: Real Khalti integration
  if (method === 'khalti') {
    return {
      success: true,
      method: 'khalti',
      status: 'pending',
      redirectUrl: `https://khalti.com/api/v2/payment/initiate/`,
      message: 'Khalti मा रिडाइरेक्ट हुँदैछ...'
    };
  }

  return { success: false, message: 'अमान्य भुक्तानी विधि' };
};

const verifyPayment = async (method, transactionId) => {
  console.log(`✅ Payment Verify Stub → Method: ${method}, TxID: ${transactionId}`);
  return { success: true, verified: true, stub: true };
};

module.exports = { initiatePayment, verifyPayment };
