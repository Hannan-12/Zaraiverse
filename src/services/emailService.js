const EMAILJS_CONFIG = {
  service_id: 'default_service', // Or your specific Service ID from EmailJS
  template_id: 'template_q4ctoty',
  user_id: 'IjGwE50SYxIfxPyoW',
  accessToken: 'p0TZEez0rI0Vojr82fgEP'
};

export const sendOTP = async (userEmail, otpCode) => {
  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: EMAILJS_CONFIG.service_id,
        template_id: EMAILJS_CONFIG.template_id,
        user_id: EMAILJS_CONFIG.user_id,
        accessToken: EMAILJS_CONFIG.accessToken,
        template_params: {
          to_email: userEmail,
          otp_code: otpCode, // Make sure your EmailJS template uses {{otp_code}}
        },
      }),
    });

    if (response.ok) {
      return { success: true };
    } else {
      const errorData = await response.json();
      return { success: false, error: errorData };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};