// src/services/emailService.js
const EMAILJS_CONFIG = {
  service_id: 'service_oi1vsro', 
  template_id: 'template_q4ctoty',
  user_id: 'IjGwE50SYxIfxPyoW', // Public Key
  accessToken: 'p0TZEez0rI0Vojr82fgEP' // Private Key
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
          otp_code: otpCode, // Ensure your EmailJS template uses {{otp_code}}
        },
      }),
    });

    if (response.ok) {
      return { success: true };
    } else {
      // ✅ FIXED: Use .text() instead of .json() to catch the error message
      const errorText = await response.text();
      console.error("EmailJS Error Response:", errorText);
      return { success: false, error: errorText };
    }
  } catch (error) {
    console.error("Fetch Error:", error);
    return { success: false, error: error.message };
  }
};