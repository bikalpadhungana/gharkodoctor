// SMS Service Stub
// Replace with Sparrow SMS / Aakash SMS integration when ready

const sendSMS = async (phone, message) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`📱 SMS Stub → ${phone}: ${message}`);
    return { success: true, stub: true };
  }

  // TODO: Real SMS implementation
  // const response = await fetch(process.env.SMS_API_URL, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     api_key: process.env.SMS_API_KEY,
  //     to: phone,
  //     message: message
  //   })
  // });

  return { success: true, stub: true };
};

// Pre-built message templates
const smsTemplates = {
  bookingConfirmed: (patientName, serviceType, time) =>
    `नमस्ते ${patientName}, तपाईंको ${serviceType} बुकिङ पक्का भएको छ। समय: ${time}। - घरको डाक्टर`,

  providerAssigned: (patientName, providerName, phone) =>
    `${patientName}, तपाईंको सेवा प्रदायक ${providerName} तोकिएका छन्। सम्पर्क: ${phone}। - घरको डाक्टर`,

  providerEnRoute: (patientName, providerName) =>
    `${patientName}, ${providerName} तपाईंको घरतिर आउँदै हुनुहुन्छ। - घरको डाक्टर`,

  bookingCompleted: (patientName) =>
    `${patientName}, तपाईंको सेवा सम्पन्न भएको छ। कृपया रेटिङ दिनुहोस्। धन्यवाद! - घरको डाक्टर`,

  newBookingForProvider: (providerName, serviceType, time) =>
    `${providerName}, नयाँ बुकिङ आएको छ: ${serviceType}, समय: ${time}। कृपया एपमा हेर्नुहोस्। - घरको डाक्टर`,

  verificationApproved: (providerName) =>
    `बधाई छ ${providerName}! तपाईंको प्रमाणीकरण स्वीकृत भएको छ। अब तपाईं बुकिङ प्राप्त गर्न सक्नुहुन्छ। - घरको डाक्टर`,

  verificationRejected: (providerName) =>
    `${providerName}, तपाईंको प्रमाणीकरण अस्वीकृत भएको छ। कृपया थप जानकारीको लागि सम्पर्क गर्नुहोस्। - घरको डाक्टर`
};

module.exports = { sendSMS, smsTemplates };
