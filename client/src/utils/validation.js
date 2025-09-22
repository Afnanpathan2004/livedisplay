import { useState } from 'react';

// Validation utility functions
export const validators = {
  required: (value) => {
    if (value === null || value === undefined || value === '') {
      return 'This field is required';
    }
    return null;
  },

  email: (value) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },

  phone: (value) => {
    if (!value) return null;
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
      return 'Please enter a valid phone number';
    }
    return null;
  },

  minLength: (min) => (value) => {
    if (!value) return null;
    if (value.length < min) {
      return `Must be at least ${min} characters long`;
    }
    return null;
  },

  maxLength: (max) => (value) => {
    if (!value) return null;
    if (value.length > max) {
      return `Must be no more than ${max} characters long`;
    }
    return null;
  },

  password: (value) => {
    if (!value) return null;
    
    const errors = [];
    
    if (value.length < 8) {
      errors.push('at least 8 characters');
    }
    
    if (!/[A-Z]/.test(value)) {
      errors.push('one uppercase letter');
    }
    
    if (!/[a-z]/.test(value)) {
      errors.push('one lowercase letter');
    }
    
    if (!/\d/.test(value)) {
      errors.push('one number');
    }
    
    if (errors.length > 0) {
      return `Password must contain ${errors.join(', ')}`;
    }
    
    return null;
  },

  confirmPassword: (originalPassword) => (value) => {
    if (!value) return null;
    if (value !== originalPassword) {
      return 'Passwords do not match';
    }
    return null;
  },

  date: (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return 'Please enter a valid date';
    }
    return null;
  },

  futureDate: (value) => {
    if (!value) return null;
    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) {
      return 'Date must be in the future';
    }
    return null;
  },

  pastDate: (value) => {
    if (!value) return null;
    const date = new Date(value);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (date > today) {
      return 'Date must be in the past';
    }
    return null;
  },

  number: (value) => {
    if (!value) return null;
    if (isNaN(Number(value))) {
      return 'Please enter a valid number';
    }
    return null;
  },

  positiveNumber: (value) => {
    if (!value) return null;
    const num = Number(value);
    if (isNaN(num) || num <= 0) {
      return 'Please enter a positive number';
    }
    return null;
  },

  range: (min, max) => (value) => {
    if (!value) return null;
    const num = Number(value);
    if (isNaN(num)) {
      return 'Please enter a valid number';
    }
    if (num < min || num > max) {
      return `Value must be between ${min} and ${max}`;
    }
    return null;
  },

  url: (value) => {
    if (!value) return null;
    try {
      new URL(value);
      return null;
    } catch {
      return 'Please enter a valid URL';
    }
  },

  alphanumeric: (value) => {
    if (!value) return null;
    const alphanumericRegex = /^[a-zA-Z0-9]+$/;
    if (!alphanumericRegex.test(value)) {
      return 'Only letters and numbers are allowed';
    }
    return null;
  },

  noSpecialChars: (value) => {
    if (!value) return null;
    const specialCharsRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (specialCharsRegex.test(value)) {
      return 'Special characters are not allowed';
    }
    return null;
  }
};

// Validation schema builder
export class ValidationSchema {
  constructor() {
    this.rules = {};
  }

  field(fieldName) {
    this.currentField = fieldName;
    this.rules[fieldName] = [];
    return this;
  }

  required(message) {
    if (this.currentField) {
      this.rules[this.currentField].push({
        validator: validators.required,
        message
      });
    }
    return this;
  }

  email(message) {
    if (this.currentField) {
      this.rules[this.currentField].push({
        validator: validators.email,
        message
      });
    }
    return this;
  }

  minLength(min, message) {
    if (this.currentField) {
      this.rules[this.currentField].push({
        validator: validators.minLength(min),
        message
      });
    }
    return this;
  }

  maxLength(max, message) {
    if (this.currentField) {
      this.rules[this.currentField].push({
        validator: validators.maxLength(max),
        message
      });
    }
    return this;
  }

  custom(validator, message) {
    if (this.currentField) {
      this.rules[this.currentField].push({
        validator,
        message
      });
    }
    return this;
  }

  validate(data) {
    const errors = {};
    
    Object.keys(this.rules).forEach(fieldName => {
      const fieldRules = this.rules[fieldName];
      const fieldValue = data[fieldName];
      
      for (const rule of fieldRules) {
        const error = rule.validator(fieldValue);
        if (error) {
          errors[fieldName] = rule.message || error;
          break; // Stop at first error for this field
        }
      }
    });
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

// Hook for form validation
export const useFormValidation = (initialValues, validationSchema) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = (name, value) => {
    if (validationSchema && validationSchema.rules[name]) {
      const fieldRules = validationSchema.rules[name];
      
      for (const rule of fieldRules) {
        const error = rule.validator(value);
        if (error) {
          return rule.message || error;
        }
      }
    }
    return null;
  };

  const validateForm = () => {
    if (!validationSchema) return { isValid: true, errors: {} };
    return validationSchema.validate(values);
  };

  const handleChange = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const error = validateField(name, values[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (onSubmit) => {
    setIsSubmitting(true);
    
    // Mark all fields as touched
    const allTouched = {};
    Object.keys(values).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);
    
    // Validate form
    const validation = validateForm();
    setErrors(validation.errors);
    
    if (validation.isValid) {
      try {
        await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      }
    }
    
    setIsSubmitting(false);
    return validation.isValid;
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  };

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    isValid: Object.keys(errors).length === 0
  };
};

// Common validation schemas
export const commonSchemas = {
  login: new ValidationSchema()
    .field('username').required('Username is required')
    .field('password').required('Password is required'),

  register: new ValidationSchema()
    .field('username').required('Username is required').minLength(3, 'Username must be at least 3 characters')
    .field('email').required('Email is required').email('Please enter a valid email')
    .field('password').required('Password is required').custom(validators.password)
    .field('confirmPassword').required('Please confirm your password'),

  employee: new ValidationSchema()
    .field('firstName').required('First name is required')
    .field('lastName').required('Last name is required')
    .field('email').required('Email is required').email('Please enter a valid email')
    .field('phone').custom(validators.phone, 'Please enter a valid phone number')
    .field('employeeId').required('Employee ID is required')
    .field('department').required('Department is required')
    .field('designation').required('Designation is required'),

  booking: new ValidationSchema()
    .field('title').required('Title is required')
    .field('roomId').required('Please select a room')
    .field('startTime').required('Start time is required')
    .field('endTime').required('End time is required')
    .field('attendeeCount').required('Number of attendees is required').custom(validators.positiveNumber),

  visitor: new ValidationSchema()
    .field('name').required('Visitor name is required')
    .field('company').required('Company name is required')
    .field('email').email('Please enter a valid email')
    .field('phone').required('Phone number is required').custom(validators.phone)
    .field('purpose').required('Purpose of visit is required')
    .field('visitDate').required('Visit date is required')
    .field('expectedArrival').required('Expected arrival time is required'),

  leave: new ValidationSchema()
    .field('type').required('Leave type is required')
    .field('startDate').required('Start date is required')
    .field('endDate').required('End date is required')
    .field('reason').required('Reason for leave is required').minLength(10, 'Please provide a detailed reason')
};

export default validators;
