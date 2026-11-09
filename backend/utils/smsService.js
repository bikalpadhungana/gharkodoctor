// SMS Service
// SMS is the primary notification channel (readme §7). Sending is fire-and-forget: a failed SMS
// must never fail a booking request. Configure SMS_API_URL + SMS_API_KEY (+ SMS_SENDER) for
// Sparrow SMS (https://api.sparrowsms.com/v2/sms/) or a compatible token/from/to/text gateway.
// Until configured, messages are logged instead of sent.

const normalizeNpPhone = (phone) => {
  const digits = phone.toString().replace(/[^0-9]/g, '');
  return digits.startsWith('977') && digits.length === 13 ? digits.slice(3) : digits;
};

const sendSMS = async (phone, message) => {
  const { SMS_API_URL, SMS_API_KEY, SMS_SENDER } = process.env;
  const configured = SMS_API_URL && SMS_API_KEY && !/stub|your_|xxx/i.test(SMS_API_KEY);

  if (!configured) {
    console.log(`📱 SMS (not configured) → ${phone}: ${message}`);
    return { success: true, stub: true };
  }

  try {
    const response = await fetch(SMS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        token: SMS_API_KEY,
        from: SMS_SENDER || 'GharkoDoc',
        to: normalizeNpPhone(phone),
        text: message
      }),
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) {
      console.error(`📱 SMS failed (${response.status}) → ${phone}`);
      return { success: false, status: response.status };
    }
    return { success: true };
  } catch (err) {
    console.error(`📱 SMS error → ${phone}: ${err.message}`);
    return { success: false, error: err.message };
  }
};

// Pre-built message templates
const smsTemplates = {
  bookingReceived: (patientName, serviceType, time) =>
    `नमस्ते ${patientName}, तपाईंको ${serviceType} अनुरोध प्राप्त भयो। समय: ${time}। स्वास्थ्यकर्मी तोकिएपछि SMS आउनेछ। - घरको डाक्टर`,

  providerReleased: (patientName) =>
    `${patientName}, तोकिएका स्वास्थ्यकर्मी आउन नसक्ने भएकाले हामी अर्को स्वास्थ्यकर्मी मिलाउँदैछौं। - घरको डाक्टर`,

  bookingCancelled: (patientName, serviceType) =>
    `${patientName}, तपाईंको ${serviceType} बुकिङ रद्द भएको छ। थप जानकारीको लागि सम्पर्क गर्नुहोस्। - घरको डाक्टर`,

  bookingCancelledForProvider: (providerName, serviceType, time) =>
    `${providerName}, ${time} को ${serviceType} बुकिङ रद्द भएको छ। - घरको डाक्टर`,

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
