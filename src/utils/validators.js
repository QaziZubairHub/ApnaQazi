export const validateGeneralSettings = (data) => {
  const errors = [];

  if (!data.websiteName?.trim()) {
    errors.push('Website name is required');
  }
  if (!data.adminEmail?.trim()) {
    errors.push('Admin email is required');
  } else if (!/^\S+@\S+\.\S+$/.test(data.adminEmail)) {
    errors.push('Admin email is invalid');
  }
  if (!data.timezone?.trim()) {
    errors.push('Timezone is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateStoreSettings = (data) => {
  const errors = [];

  if (!data.storeName?.trim()) {
    errors.push('Store name is required');
  }
  if (!data.currency?.trim()) {
    errors.push('Currency is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateEmailSettings = (data) => {
  const errors = [];

  if (!data.smtpHost?.trim()) {
    errors.push('SMTP host is required');
  }
  if (!data.smtpPort) {
    errors.push('SMTP port is required');
  }
  if (!data.smtpUser?.trim()) {
    errors.push('SMTP username is required');
  }
  if (!data.smtpPassword?.trim()) {
    errors.push('SMTP password is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validatePaymentSettings = (data) => {
  const errors = [];

  if (!data.provider?.trim()) {
    errors.push('Payment provider is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
